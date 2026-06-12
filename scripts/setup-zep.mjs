/**
 * One-time Zep setup for the capstone: creates the shared domain graph and
 * (optionally) seeds it through your REAL n8n ingestion pipeline so the demo
 * has something to show.
 *
 * Usage:
 *   ZEP_API_KEY=... node scripts/setup-zep.mjs              # create the graph
 *   ZEP_API_KEY=... N8N_INGEST_WEBHOOK_URL=... N8N_WEBHOOK_SECRET=... \
 *     node scripts/setup-zep.mjs --seed                     # + ingest seed docs
 */
import fs from 'node:fs';
import path from 'node:path';
import { ZepClient } from '@getzep/zep-cloud';

const GRAPH_ID = process.env.ZEP_GRAPH_ID?.trim() || 'capstone-kg';
const apiKey = process.env.ZEP_API_KEY;
if (!apiKey) {
  console.error('Set ZEP_API_KEY (from app.getzep.com → Project Settings).');
  process.exit(1);
}
const baseUrl = process.env.ZEP_BASE_URL;
const zep = new ZepClient(baseUrl ? { apiKey, environment: baseUrl } : { apiKey });

if (process.argv.includes('--reset')) {
  try {
    await zep.graph.delete(GRAPH_ID);
    console.log(`· deleted existing graph "${GRAPH_ID}" (reset)`);
  } catch (e) {
    console.log(`· nothing to reset (${String(e?.message ?? e).slice(0, 80)})`);
  }
}

try {
  const graph = await zep.graph.create({
    graphId: GRAPH_ID,
    name: 'Capstone Second Brain',
    description:
      'Shared domain knowledge graph for the DSGN-497 Path B capstone. Populated by the n8n ingestion pipeline; queried by the chat and email agents.',
  });
  console.log(`✅ created graph "${graph.graphId ?? GRAPH_ID}"`);
} catch (e) {
  const msg = String(e?.message ?? e);
  if (/exists|conflict|400|409/i.test(msg)) {
    console.log(`· graph "${GRAPH_ID}" already exists — fine.`);
  } else {
    console.error('💥 graph create failed:', msg);
    process.exit(1);
  }
}

if (process.argv.includes('--seed')) {
  const webhook = process.env.N8N_INGEST_WEBHOOK_URL;
  const secret = process.env.N8N_WEBHOOK_SECRET;
  if (!webhook) {
    console.error('Set N8N_INGEST_WEBHOOK_URL to seed through the pipeline.');
    process.exit(1);
  }
  const dir = path.join(process.cwd(), 'eval', 'seed-documents');
  for (const file of fs.readdirSync(dir)) {
    const text = fs.readFileSync(path.join(dir, file), 'utf8');
    const title = text.match(/^#\s*(.+)$/m)?.[1] ?? file;
    process.stdout.write(`→ ingesting "${title}" … `);
    const res = await fetch(webhook, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(secret ? { API_KEY: secret } : {}),
      },
      body: JSON.stringify({ title, text, source: 'seed-script' }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.ok) {
      console.log(
        `ok (${body.stats.entities} entities, ${body.stats.relationships} relationships, ${body.stats.merged} merged)`
      );
    } else {
      console.log(`FAILED (${res.status}): ${body.message ?? body.error ?? 'unknown'}`);
    }
  }
  console.log('Done. Open the graph at app.getzep.com to watch episodes finish processing.');
}
