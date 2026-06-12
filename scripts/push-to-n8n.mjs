/**
 * Push the capstone workflow suite to a real n8n cloud workspace via the
 * public API: creates API-creatable credentials, personalizes webhook paths
 * (shared workspace!), rewires the sub-workflow tool references, imports all
 * five workflows in dependency order, and activates what it can.
 *
 * OAuth credentials (Gmail, Google Sheets) cannot be created via API — you
 * attach those in the UI afterwards; the script tells you exactly what's left.
 *
 * Usage:
 *   1. cp .env.capstone.example .env.capstone   # fill it in (gitignored)
 *   2. node scripts/push-to-n8n.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ---- load .env.capstone (no dotenv dependency) -----------------------------
const envFile = path.join(process.cwd(), '.env.capstone');
if (fs.existsSync(envFile)) {
  for (const line of fs.readFileSync(envFile, 'utf8').split('\n')) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

const HOST = (process.env.N8N_HOST || 'https://northwestern-mmm.app.n8n.cloud').replace(/\/$/, '');
const API = `${HOST}/api/v1`;
const KEY = process.env.N8N_API_KEY;
const SUFFIX = (process.env.CAPSTONE_SUFFIX || '').trim();
if (!KEY) {
  console.error('Set N8N_API_KEY in .env.capstone (n8n → Settings → n8n API → Create an API key).');
  process.exit(1);
}
if (!SUFFIX) {
  console.error('Set CAPSTONE_SUFFIX in .env.capstone (e.g. your initials/netid, like "mk") — the Northwestern workspace is shared, so webhook paths must be unique.');
  process.exit(1);
}

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || crypto.randomBytes(24).toString('base64url');
const agentPath = `capstone-agent-${SUFFIX}`;
const ingestPath = `capstone-ingest-${SUFFIX}`;

async function api(method, p, body) {
  const res = await fetch(`${API}${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-N8N-API-KEY': KEY },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: res.status, json };
}

async function createCredential(name, type, data) {
  const r = await api('POST', '/credentials', { name, type, data });
  const id = r.json?.id;
  if (!id) {
    console.log(`  ⚠️  could not create credential "${name}" (${r.status}): ${JSON.stringify(r.json).slice(0, 160)} — create it in the UI instead.`);
    return null;
  }
  console.log(`  ✓ credential "${name}" → ${id}`);
  return id;
}

function loadWf(file) {
  return JSON.parse(fs.readFileSync(path.join(process.cwd(), 'n8n', 'workflows', file), 'utf8'));
}

function personalize(wf, credIds) {
  let s = JSON.stringify(wf);
  s = s.replaceAll('"capstone-agent"', `"${agentPath}"`);
  s = s.replaceAll('"capstone-ingest"', `"${ingestPath}"`);
  s = s.replaceAll('https://REPLACE-WITH-YOUR-N8N-HOST/webhook/capstone-agent', `${HOST}/webhook/${agentPath}`);
  for (const [ph, id] of Object.entries(credIds)) if (id) s = s.replaceAll(ph, id);
  return JSON.parse(s);
}

async function createWorkflow(wf, namePrefix) {
  const body = {
    name: `${namePrefix}${wf.name}`,
    nodes: wf.nodes,
    connections: wf.connections,
    settings: wf.settings || { executionOrder: 'v1' },
  };
  let r = await api('POST', '/workflows', body);
  let data = r.json;
  if (!data?.id) throw new Error(`workflow create failed (${wf.name}): ${r.status} ${JSON.stringify(r.json).slice(0, 300)}`);
  console.log(`  ✓ "${body.name}" → ${data.id}`);
  return data;
}

async function activate(id, label) {
  const r = await api('POST', `/workflows/${id}/activate`);
  if (r.json?.active || r.status === 200) {
    console.log(`  ✓ published ${label}`);
    return true;
  }
  console.log(`  ⚠️  could not publish ${label} via API (${r.status}: ${JSON.stringify(r.json).slice(0, 140)}) — click Publish in the UI.`);
  return false;
}

// ---- preflight: verify access + scan the shared instance for collisions ----
async function preflight() {
  console.log(`Preflight against ${HOST} (suffix: ${SUFFIX})`);
  const me = await api('GET', '/workflows?limit=250');
  if (me.status === 401 || me.status === 403) {
    console.error(`  ✗ API key rejected (${me.status}). Check N8N_API_KEY / its scopes.`);
    process.exit(1);
  }
  if (!Array.isArray(me.json?.data)) {
    console.error(`  ✗ unexpected response (${me.status}): ${JSON.stringify(me.json).slice(0, 200)}`);
    process.exit(1);
  }
  const workflows = me.json.data;
  console.log(`  ✓ API key works — ${workflows.length} workflow(s) visible to you${me.json.nextCursor ? ' (first page)' : ''}`);

  // Webhook paths are unique per INSTANCE: scan visible workflows for clashes.
  const clashes = [];
  const dupes = [];
  for (const wf of workflows) {
    for (const node of wf.nodes ?? []) {
      if (node.type === 'n8n-nodes-base.webhook') {
        const p = node.parameters?.path;
        if (p === agentPath || p === ingestPath) clashes.push(`"${wf.name}" already uses path ${p}`);
        if (p === 'capstone-agent' || p === 'capstone-ingest') dupes.push(`"${wf.name}" uses the unsuffixed path ${p}`);
      }
    }
    if (wf.name?.startsWith(`[${SUFFIX}] `)) dupes.push(`"${wf.name}" looks like a previous push with this suffix`);
  }
  if (clashes.length) {
    console.error(`  ✗ path collision — pick a different CAPSTONE_SUFFIX:\n    - ${clashes.join('\n    - ')}`);
    process.exit(1);
  }
  if (dupes.length) {
    console.log(`  ⚠️  heads-up (not blocking):\n    - ${dupes.join('\n    - ')}`);
    if (dupes.some((d) => d.includes('previous push'))) {
      console.error('  ✗ refusing to create duplicates — delete the previous [' + SUFFIX + '] workflows in the UI, or change CAPSTONE_SUFFIX.');
      process.exit(1);
    }
  }
  console.log(`  ✓ paths ${agentPath} / ${ingestPath} are free (among workflows visible to your key)\n`);
}

await preflight();
if (process.argv.includes('--preflight')) {
  console.log('Preflight-only mode: stopping before any writes.');
  process.exit(0);
}

console.log(`Pushing capstone suite to ${HOST} (suffix: ${SUFFIX})\n`);

// 1. credentials --------------------------------------------------------------
// Reuse-first: *_CREDENTIAL_ID env vars point at credentials that already
// exist in your n8n project (find the id in the URL when you open the
// credential in the UI). Otherwise create from secrets where provided.
console.log('1) Credentials');
function reuse(name, id) {
  console.log(`  ✓ reusing existing ${name} credential → ${id}`);
  return id;
}
const credIds = {
  REPLACE_OPENROUTER: process.env.OPENROUTER_CREDENTIAL_ID
    ? reuse('OpenRouter', process.env.OPENROUTER_CREDENTIAL_ID)
    : process.env.OPENROUTER_API_KEY
      ? await createCredential(`OpenRouter (capstone-${SUFFIX})`, 'openRouterApi', { apiKey: process.env.OPENROUTER_API_KEY, allowedHttpRequestDomains: 'all' })
      : (console.log('  ⚠️  OPENROUTER_CREDENTIAL_ID / OPENROUTER_API_KEY not set — attach in UI'), null),
  REPLACE_ZEP: process.env.ZEP_CREDENTIAL_ID
    ? reuse('Zep header-auth', process.env.ZEP_CREDENTIAL_ID)
    : process.env.ZEP_API_KEY
      ? await createCredential(`Zep Api-Key (capstone-${SUFFIX})`, 'httpHeaderAuth', { name: 'Authorization', value: `Api-Key ${process.env.ZEP_API_KEY}`, allowedHttpRequestDomains: 'all' })
      : (console.log('  ⚠️  ZEP_API_KEY not set — attach in UI'), null),
  REPLACE_WEBHOOK_AUTH: process.env.WEBHOOK_AUTH_CREDENTIAL_ID
    ? reuse('webhook auth', process.env.WEBHOOK_AUTH_CREDENTIAL_ID)
    : await createCredential(`Capstone Webhook Auth (${SUFFIX})`, 'httpHeaderAuth', { name: 'API_KEY', value: WEBHOOK_SECRET, allowedHttpRequestDomains: 'all' }),
  REPLACE_POSTGRES: process.env.POSTGRES_CREDENTIAL_ID
    ? reuse('Postgres', process.env.POSTGRES_CREDENTIAL_ID)
    : process.env.SUPABASE_DB_HOST
      ? await createCredential(`Supabase Postgres (capstone-${SUFFIX})`, 'postgres', {
          host: process.env.SUPABASE_DB_HOST,
          port: Number(process.env.SUPABASE_DB_PORT || 5432),
          database: process.env.SUPABASE_DB_NAME || 'postgres',
          user: process.env.SUPABASE_DB_USER || 'postgres',
          password: process.env.SUPABASE_DB_PASSWORD || '',
          allowUnauthorizedCerts: false,
          ssl: 'require',
          sshTunnel: false,
        })
      : (console.log('  ⚠️  POSTGRES_CREDENTIAL_ID / SUPABASE_DB_HOST not set — attach Postgres credential in UI'), null),
  REPLACE_SUPABASE: process.env.SUPABASE_CREDENTIAL_ID
    ? reuse('Supabase API', process.env.SUPABASE_CREDENTIAL_ID)
    : process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY
      ? await createCredential(`Supabase API (capstone-${SUFFIX})`, 'supabaseApi', { host: process.env.SUPABASE_URL, serviceRole: process.env.SUPABASE_SERVICE_ROLE_KEY, allowedHttpRequestDomains: 'all' })
      : (console.log('  ⚠️  SUPABASE_CREDENTIAL_ID / SUPABASE_URL+SERVICE_ROLE not set — attach in UI'), null),
};

// 2. workflows in dependency order --------------------------------------------
console.log('\n2) Workflows');
const prefix = process.env.CAPSTONE_NAME_PREFIX ?? `[${SUFFIX}] `;
const graph = await createWorkflow(personalize(loadWf('capstone-graph-query-subagent.json'), credIds), prefix);
const fixRef = (wf) => JSON.parse(JSON.stringify(wf).replaceAll('CapGraphQuery001', graph.id));
const chat = await createWorkflow(fixRef(personalize(loadWf('capstone-chat-agent.json'), credIds)), prefix);
const ingest = await createWorkflow(personalize(loadWf('capstone-ingestion-pipeline.json'), credIds), prefix);
const email = await createWorkflow(fixRef(personalize(loadWf('capstone-email-channel.json'), credIds)), prefix);
const evalr = await createWorkflow(personalize(loadWf('capstone-eval-runner.json'), credIds), prefix);

// 3. publish what can run without OAuth ----------------------------------------
console.log('\n3) Publish');
await activate(graph.id, 'Graph Query Subagent');
const chatLive = await activate(chat.id, 'Chat Agent');
const ingestLive = await activate(ingest.id, 'Ingestion Pipeline');
console.log('  · Email Channel left unpublished (needs your Gmail OAuth credential first)');
console.log('  · Eval Runner has a manual trigger (no publish needed)');

// 4. report --------------------------------------------------------------------
console.log(`\n${'='.repeat(60)}
DONE. Save these values:

  Chat webhook:    ${HOST}/webhook/${agentPath}   ${chatLive ? '(live)' : '(publish in UI)'}
  Ingest webhook:  ${HOST}/webhook/${ingestPath}   ${ingestLive ? '(live)' : '(publish in UI)'}
  Webhook secret:  ${WEBHOOK_SECRET}
  Sub-workflow id: ${graph.id}

App .env.local lines:
  N8N_WEBHOOK_URL=${HOST}/webhook/${agentPath}
  N8N_WEBHOOK_SECRET=${WEBHOOK_SECRET}
  N8N_INGEST_WEBHOOK_URL=${HOST}/webhook/${ingestPath}

Still manual (in the UI):
  1. Email Channel → attach your Gmail OAuth credential to its 3 Gmail nodes, then Publish.
  2. Eval Runner → attach Google Sheets OAuth to the 2 sheets nodes and point them at your
     eval spreadsheet; verify "Call Capstone Agent" URL = ${HOST}/webhook/${agentPath}.
  3. Open Chat Agent + Email Channel → confirm the "Knowledge Graph Tool" node shows
     "${prefix}Capstone — Graph Query Subagent" (the script rewired the id; just verify).
`);
