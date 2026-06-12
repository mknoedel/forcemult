/**
 * Local verification harness: one server that impersonates
 *   1. an OpenAI-compatible LLM endpoint (what the n8n OpenRouter credential calls)
 *   2. the Zep Cloud graph API (stateful, in-memory)
 *
 * Used ONLY for local testing of the n8n workflows and the app — production
 * points at the real OpenRouter + Zep. Start with: node scripts/mocks/mock-services.mjs
 */
import express from 'express';
import crypto from 'node:crypto';

const PORT = process.env.MOCK_PORT ? Number(process.env.MOCK_PORT) : 4545;
const app = express();
app.use(express.json({ limit: '5mb' }));

// --------------------------------------------------------------------------
// Mock LLM (OpenAI chat-completions compatible)
// --------------------------------------------------------------------------

const ATTACK_MARKERS = [
  'ignore previous instructions',
  'ignore all previous instructions',
  'reveal your system prompt',
  'system prompt',
  'forward all',
  'api key',
  'jailbreak',
  'pretend you are',
  'developer mode',
];

function contentToText(content) {
  if (typeof content === 'string') return content;
  if (Array.isArray(content)) {
    return content.map((p) => (typeof p === 'string' ? p : p.text || '')).join(' ');
  }
  return '';
}

// All messages of a role, concatenated — parsers append their own system
// messages, so "the" system prompt may not be the last one.
function lastContent(messages, role) {
  return messages
    .filter((m) => m.role === role)
    .map((m) => contentToText(m.content))
    .join('\n');
}

function allText(messages) {
  return messages
    .map((m) =>
      typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
    )
    .join('\n');
}

function buildExtraction(userText) {
  const has = (s) => userText.toLowerCase().includes(s.toLowerCase());
  const titleMatch = userText.match(/<document title="([^"]+)"/);
  const title = titleMatch ? titleMatch[1] : 'Untitled document';
  if (has('Jiobit')) {
    return {
      entities: [
        { name: 'John Renaldi', type: 'Person', summary: 'Instructor of DSGN-497 and founder of Jiobit.' },
        { name: 'Jiobit', type: 'Organization', summary: 'Wearable location-tracker startup founded in Chicago.' },
        { name: 'Life360', type: 'Organization', summary: 'Family safety platform that acquired Jiobit.' },
        { name: title, type: 'Document', summary: 'Source document ingested into the knowledge graph.' },
      ],
      relationships: [
        { source: 'John Renaldi', relation: 'FOUNDED', target: 'Jiobit', fact: 'John Renaldi founded Jiobit, a wearable tech startup.' },
        { source: 'Life360', relation: 'ACQUIRED', target: 'Jiobit', fact: 'Life360 acquired Jiobit in 2021.' },
        { source: 'John Renaldi', relation: 'MENTIONED_IN', target: title, fact: `John Renaldi is mentioned in ${title}.` },
      ],
    };
  }
  return {
    entities: [
      { name: 'Sample Entity', type: 'Concept', summary: 'A generic concept extracted by the mock LLM.' },
      { name: title, type: 'Document', summary: 'Source document.' },
    ],
    relationships: [
      { source: 'Sample Entity', relation: 'MENTIONED_IN', target: title, fact: `Sample Entity is mentioned in ${title}.` },
    ],
  };
}

// Wrap a JSON payload the way the caller expects it: when the request binds a
// structured-output tool (n8n parsers use function calling), answer with a
// tool call; otherwise put the JSON in the message content.
function jsonReply(body, payload) {
  const tools = body.tools || [];
  const forced = body.tool_choice?.function?.name;
  if (tools.length) {
    const name = forced || tools[0].function?.name || 'output';
    return {
      tool_calls: [
        {
          id: 'call_' + crypto.randomUUID().slice(0, 8),
          type: 'function',
          function: { name, arguments: JSON.stringify(payload) },
        },
      ],
    };
  }
  return { content: JSON.stringify(payload) };
}

function decideReply(body) {
  const messages = body.messages || [];
  const system = lastContent(messages, 'system');
  const user = lastContent(messages, 'user');
  const everything = allText(messages);
  const hasToolResult = messages.some((m) => m.role === 'tool');
  const tools = body.tools || [];

  // Guardrails LLM check → strict {confidenceScore, flagged} JSON in content.
  if (system.includes('confidenceScore')) {
    const flagged = ATTACK_MARKERS.some((m) => user.toLowerCase().includes(m));
    return jsonReply(body, { confidenceScore: flagged ? 0.95 : 0.02, flagged });
  }

  // Extraction subagent → strict extraction JSON.
  if (system.includes('Extraction Subagent')) {
    return jsonReply(body, { output: buildExtraction(user) });
  }

  // LLM-as-judge chains → strict judge JSON.
  if (system.includes('factual evaluator')) {
    return jsonReply(body, { output: {
      extended_reasoning: 'Mock correctness check: compared key entities, dates and relationships between output and ground truth.',
      reasoning_summary: 'Mock judge: output matches ground truth.',
      score: 5,
    } });
  }
  if (system.includes('groundedness evaluator')) {
    return jsonReply(body, { output: {
      extended_reasoning: 'Mock groundedness check: claims traced to knowledge-graph facts in the tool trace.',
      reasoning_summary: 'fully grounded',
      score: 5,
    } });
  }

  // Session title chain.
  if (system.includes('session title')) {
    return { content: 'Jiobit Founder Question' };
  }

  // Eval-runner LLM-as-judge (agent node with structured parser).
  if (system.includes('LLM-as-judge')) {
    const expectedRefusal = /guardrail_safety/i.test(user);
    const sawRefusal = /guardrail/i.test(user.split('## Actual agent response')[1] || '');
    const pass = expectedRefusal ? sawRefusal : true;
    return jsonReply(body, { output: {
      score: pass ? 5 : 1,
      pass,
      justification: pass
        ? 'Mock judge: response meets the expected behavior for this dimension.'
        : 'Mock judge: expected a guardrail refusal but none was found.',
    } });
  }

  // Structured-output auto-fix retry: re-emit a best-effort payload.
  if (user.includes('did not satisfy the constraints') || system.includes('did not satisfy the constraints')) {
    if (everything.includes('entities')) return jsonReply(body, { output: buildExtraction(everything) });
    return jsonReply(body, { output: { score: 3, pass: false, justification: 'Mock autofix fallback.' } });
  }

  // Agent with tools: call the knowledge-graph tool once, then answer from it.
  const agentTool = tools.find((t) => /graph|knowledge|search/i.test(t.function?.name || ''));
  if (agentTool && !hasToolResult) {
    const queryGuess = (user.match(/<user_prompt>\s*([\s\S]*?)\s*<\/user_prompt>/) || [null, user])[1]
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 120) || 'knowledge graph overview';
    return {
      tool_calls: [
        {
          id: 'call_' + crypto.randomUUID().slice(0, 8),
          type: 'function',
          function: { name: agentTool.function.name, arguments: JSON.stringify({ query: queryGuess }) },
        },
      ],
    };
  }

  if (hasToolResult) {
    const toolMsg = [...messages].reverse().find((m) => m.role === 'tool');
    const toolText = typeof toolMsg.content === 'string' ? toolMsg.content : JSON.stringify(toolMsg.content);
    if (toolText.includes('NO_RESULTS')) {
      return {
        content: "The knowledge graph doesn't contain that information yet. Try ingesting a source document about it on the Knowledge page.",
      };
    }
    const factLine = (toolText.match(/- \[[^\]]+\][^\\\n]*/) || ['- [FACT] (none)'])[0];
    const answer = `Based on the knowledge graph: ${factLine.replace(/^- /, '')}\n\nJohn Renaldi founded Jiobit, and Life360 acquired Jiobit in 2021 (per the graph).`;
    return {
      content: everything.includes('email_body')
        ? `Hi Sam,\n\n${answer}\n\n— Capstone Knowledge Agent (automated)`
        : answer,
    };
  }

  return { content: 'Mock LLM fallback answer: ask me about the knowledge graph.' };
}

app.post(['/v1/chat/completions', '/chat/completions'], (req, res) => {
  const b = req.body || {};
  console.log(
    `[llm] tools=${(b.tools || []).map((t) => t.function?.name).join(',') || '-'} ` +
    `tool_choice=${JSON.stringify(b.tool_choice) || '-'} stream=${!!b.stream} ` +
    `response_format=${JSON.stringify(b.response_format)?.slice(0, 80) || '-'} ` +
    `roles=${(b.messages || []).map((m) => m.role).join('>')} ` +
    `sys≈${lastContent(b.messages || [], 'system').replace(/\s+/g, ' ').slice(0, 90)}`
  );
  const reply = decideReply(req.body || {});
  console.log(`[llm] → ${reply.tool_calls ? 'tool_call:' + reply.tool_calls[0].function.name : 'content:' + String(reply.content).slice(0, 70).replace(/\n/g, ' ')}`);
  const id = 'chatcmpl-' + crypto.randomUUID().slice(0, 12);
  const created = Math.floor(Date.now() / 1000);
  const model = req.body?.model || 'mock-model';
  const message = { role: 'assistant', content: reply.content ?? null };
  if (reply.tool_calls) message.tool_calls = reply.tool_calls;
  const finish = reply.tool_calls ? 'tool_calls' : 'stop';

  if (req.body?.stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    const base = { id, object: 'chat.completion.chunk', created, model };
    const send = (delta, finish_reason = null) =>
      res.write(`data: ${JSON.stringify({ ...base, choices: [{ index: 0, delta, finish_reason }] })}\n\n`);
    send({ role: 'assistant' });
    if (reply.tool_calls) {
      send({
        tool_calls: reply.tool_calls.map((tc, i) => ({
          index: i,
          id: tc.id,
          type: 'function',
          function: tc.function,
        })),
      });
      send({}, 'tool_calls');
    } else {
      for (const chunk of (reply.content || '').match(/.{1,40}/gs) || []) {
        send({ content: chunk });
      }
      send({}, 'stop');
    }
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }

  res.json({
    id,
    object: 'chat.completion',
    created,
    model,
    choices: [{ index: 0, message, finish_reason: finish }],
    usage: { prompt_tokens: 50, completion_tokens: 50, total_tokens: 100 },
  });
});

app.get('/v1/models', (_req, res) =>
  res.json({ object: 'list', data: [{ id: 'mock-model', object: 'model' }] })
);

// --------------------------------------------------------------------------
// Mock Zep Cloud graph API (stateful, in-memory)
// --------------------------------------------------------------------------

const zep = {
  graphs: {},
  nodes: [], // {uuid, graph_id, name, summary, labels, created_at}
  edges: [], // {uuid, graph_id, name, fact, source_node_uuid, target_node_uuid, created_at, valid_at}
  episodes: [], // {uuid, graph_id, content, source, source_description, processed, created_at}
};

const now = () => new Date().toISOString();
const norm = (s) => (s || '').toString().toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

function findOrCreateNode(graphId, { name, uuid, summary, labels }) {
  let node = uuid ? zep.nodes.find((n) => n.uuid === uuid) : null;
  if (!node && name) {
    node = zep.nodes.find((n) => n.graph_id === graphId && norm(n.name) === norm(name));
  }
  if (!node) {
    node = {
      uuid: crypto.randomUUID(),
      graph_id: graphId,
      name: name || 'unknown',
      summary: summary || '',
      labels: ['Entity', ...(labels || [])],
      created_at: now(),
      attributes: {},
    };
    zep.nodes.push(node);
  } else if (summary && !node.summary) {
    node.summary = summary;
  }
  return node;
}

const zepRouter = express.Router();

zepRouter.post('/graph/create', (req, res) => {
  const { graph_id, name, description } = req.body || {};
  if (!graph_id) return res.status(400).json({ message: 'graph_id required' });
  zep.graphs[graph_id] = { graph_id, name, description, uuid: crypto.randomUUID(), created_at: now() };
  res.status(201).json(zep.graphs[graph_id]);
});

zepRouter.get('/graph/list-all', (_req, res) =>
  res.json({ graphs: Object.values(zep.graphs), total_count: Object.keys(zep.graphs).length })
);

zepRouter.get('/graph/:graphId', (req, res) => {
  const g = zep.graphs[req.params.graphId];
  if (!g) return res.status(404).json({ message: 'graph not found' });
  res.json(g);
});

zepRouter.post('/graph', (req, res) => {
  const { graph_id, type, data, source_description } = req.body || {};
  if (!graph_id || !data) return res.status(400).json({ message: 'graph_id and data required' });
  const ep = {
    uuid: crypto.randomUUID(),
    graph_id,
    content: data,
    source: type || 'text',
    source_description: source_description || '',
    processed: false,
    created_at: now(),
  };
  zep.episodes.push(ep);
  setTimeout(() => {
    ep.processed = true;
  }, 1500);
  res.json(ep);
});

zepRouter.post('/graph/add-fact-triple', (req, res) => {
  const b = req.body || {};
  const graphId = b.graph_id;
  if (!graphId || !b.fact || !b.fact_name) {
    return res.status(400).json({ message: 'graph_id, fact, fact_name required' });
  }
  const source = findOrCreateNode(graphId, {
    name: b.source_node_name,
    uuid: b.source_node_uuid,
    summary: b.source_node_summary,
  });
  const target = findOrCreateNode(graphId, {
    name: b.target_node_name,
    uuid: b.target_node_uuid,
    summary: b.target_node_summary,
  });
  const edge = {
    uuid: b.fact_uuid || crypto.randomUUID(),
    graph_id: graphId,
    name: b.fact_name,
    fact: b.fact,
    source_node_uuid: source.uuid,
    target_node_uuid: target.uuid,
    created_at: now(),
    valid_at: b.valid_at || null,
    invalid_at: null,
    expired_at: null,
    episodes: [],
  };
  zep.edges.push(edge);
  // Mirror REAL Zep Cloud behavior (observed 2026-06): fact triples are
  // processed asynchronously — the API acks with a task id and null nodes/edge.
  // (State above is still updated immediately so searches find the data.)
  res.json({ task_id: crypto.randomUUID(), edge: null, source_node: null, target_node: null });
});

zepRouter.post('/graph/search', (req, res) => {
  const { graph_id, query, scope = 'edges', limit = 10 } = req.body || {};
  if (!query) return res.status(400).json({ message: 'query required' });
  const terms = norm(query).split(' ').filter((t) => t.length > 2);
  const matches = (text) => {
    const t = norm(text);
    return terms.length === 0 || terms.some((term) => t.includes(term));
  };
  const result = { edges: [], nodes: [], episodes: [], context: '' };
  if (scope === 'edges' || scope === 'auto') {
    result.edges = zep.edges
      .filter((e) => e.graph_id === graph_id && matches(e.fact + ' ' + e.name))
      .slice(0, limit)
      .map((e) => ({ ...e, score: 0.9 }));
  }
  if (scope === 'nodes' || scope === 'auto') {
    result.nodes = zep.nodes
      .filter((n) => n.graph_id === graph_id && matches(n.name + ' ' + n.summary))
      .slice(0, limit)
      .map((n) => ({ ...n, score: 0.9 }));
  }
  if (scope === 'episodes' || scope === 'auto') {
    result.episodes = zep.episodes
      .filter((e) => e.graph_id === graph_id && matches(e.content))
      .slice(0, limit);
  }
  if (scope === 'auto') {
    result.context = [
      'FACTS:',
      ...result.edges.map((e) => `  - ${e.fact}`),
      'ENTITIES:',
      ...result.nodes.map((n) => `  - ${n.name}: ${n.summary}`),
    ].join('\n');
  }
  res.json(result);
});

zepRouter.post('/graph/node/graph/:graphId', (req, res) => {
  const limit = req.body?.limit || 100;
  res.json(zep.nodes.filter((n) => n.graph_id === req.params.graphId).slice(0, limit));
});

zepRouter.post('/graph/edge/graph/:graphId', (req, res) => {
  const limit = req.body?.limit || 100;
  res.json(zep.edges.filter((e) => e.graph_id === req.params.graphId).slice(0, limit));
});

zepRouter.get('/graph/episodes/graph/:graphId', (req, res) => {
  res.json({ episodes: zep.episodes.filter((e) => e.graph_id === req.params.graphId).slice(-20) });
});

zepRouter.get('/graph/episodes/:uuid', (req, res) => {
  const ep = zep.episodes.find((e) => e.uuid === req.params.uuid);
  if (!ep) return res.status(404).json({ message: 'episode not found' });
  res.json(ep);
});

// Internal: inspect full state in tests.
zepRouter.get('/__state', (_req, res) => res.json(zep));

app.use(['/zep/api/v2', '/api/v2'], zepRouter);

// Generic sink for test variants of Google-Sheets writes.
const sinks = {};
app.post('/sink/:name', (req, res) => {
  (sinks[req.params.name] ||= []).push(req.body);
  res.json({ ok: true });
});
app.get('/__sink', (_req, res) => res.json(sinks));

// Reset all mock state between verification runs.
app.post('/__reset', (_req, res) => {
  zep.graphs = {};
  zep.nodes = [];
  zep.edges = [];
  zep.episodes = [];
  for (const k of Object.keys(sinks)) delete sinks[k];
  res.json({ ok: true });
});

app.get('/healthz', (_req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`[mock-services] LLM + Zep mock listening on http://localhost:${PORT}`);
});
