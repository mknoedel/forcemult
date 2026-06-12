/** Dump recent n8n execution node statuses/errors. Usage: node scripts/verify/inspect-executions.mjs [count] */
const N8N_URL = process.env.N8N_URL || 'http://localhost:5678';
const EMAIL = process.env.N8N_EMAIL || 'capstone@example.com';
const PASSWORD = process.env.N8N_PASSWORD || 'Capstone123!';
let cookie = '';

async function api(method, p, body) {
  const res = await fetch(`${N8N_URL}${p}`, {
    method,
    headers: { 'Content-Type': 'application/json', cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const sc = res.headers.get('set-cookie');
  if (sc) cookie = sc.split(';')[0];
  return res.json();
}

function unflat(arr) {
  const memo = new Map();
  const get = (i) => {
    if (memo.has(i)) return memo.get(i);
    const v = arr[i];
    if (v && typeof v === 'object' && !Array.isArray(v)) {
      const out = {};
      memo.set(i, out);
      for (const [k, val] of Object.entries(v)) out[k] = typeof val === 'string' ? get(Number(val)) : val;
      return out;
    }
    if (Array.isArray(v)) {
      const out = [];
      memo.set(i, out);
      for (const val of v) out.push(typeof val === 'string' ? get(Number(val)) : val);
      return out;
    }
    memo.set(i, v);
    return v;
  };
  return get(0);
}

const count = Number(process.argv[2] || 6);
await api('POST', '/rest/login', { emailOrLdapLoginId: EMAIL, password: PASSWORD });
const list = (await api('GET', `/rest/executions?limit=${count}`)).data;
const rows = list.results || list;
for (const e of rows) {
  const d = (await api('GET', `/rest/executions/${e.id}`)).data;
  let raw = d.data;
  if (typeof raw === 'string') raw = JSON.parse(raw);
  const data = Array.isArray(raw) ? unflat(raw) : raw;
  const run = data?.resultData || {};
  console.log(`\n===== #${e.id} ${e.workflowName || e.workflowId} → ${d.status}`);
  const wfErr = run.error;
  if (wfErr) console.log(`  WF ERROR @ ${wfErr.node?.name}: ${String(wfErr.message).slice(0, 200)} | ${String(wfErr.description).slice(0, 200)}`);
  for (const [node, runs] of Object.entries(run.runData || {})) {
    const err = runs[0]?.error;
    const items = runs[0]?.data?.main?.[0]?.length;
    console.log(`  [${err ? 'ERR' : 'ok '}] ${node}${items !== undefined ? ` (${items} items)` : ''}${err ? ' — ' + String(err.message).slice(0, 180) : ''}`);
    if (err?.description) console.log(`        ↳ ${String(err.description).slice(0, 220)}`);
  }
}
