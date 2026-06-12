// One-off dev utility: seed a user's Zep graph with a few fact-bearing turns so
// retrieveUserContext() (lib/zep/chat-memory.ts) returns a real <USER_SUMMARY>.
//
// Mirrors recordChatTurn: user.add -> thread.create -> thread.addMessages with
// ignoreRoles:['assistant'] (graph extraction reads USER messages only, so the
// persistent facts must live there). Reads ZEP_API_KEY from the environment.
//
// Usage:
//   set -a; . ./.env.local; set +a
//   node scripts/seed-zep-user.mjs <userId> [email]
import { ZepClient } from '@getzep/zep-cloud';

const userId = process.argv[2];
const email = process.argv[3]; // optional; Zep user.add accepts it when present
if (!userId) {
  console.error('Usage: node scripts/seed-zep-user.mjs <userId> [email]');
  process.exit(1);
}
const apiKey = process.env.ZEP_API_KEY;
if (!apiKey) {
  console.error('ZEP_API_KEY is not set. Run: set -a; . ./.env.local; set +a');
  process.exit(1);
}

const client = new ZepClient({ apiKey });
const threadId = `seed-${userId}`;
const NAME = 'John Renaldi';

// Conversational turns. Facts live in the USER messages (assistant turns are
// ignored by graph extraction). Kept natural so the summary reads cleanly.
const turns = [
  {
    user: `Hi, I'm ${NAME}, a Northwestern MMM student. I'm building a chat agent for my capstone.`,
    assistant: 'Nice to meet you, John! Happy to help with your capstone agent.',
  },
  {
    user: 'I work with the Presto clients dataset — my focus is client segmentation and churn-risk analysis.',
    assistant: 'Got it — segmentation and churn risk on the Presto clients data.',
  },
  {
    user: 'My stack is Next.js, Supabase, and n8n, and I just added Zep for long-term memory.',
    assistant: 'A solid stack. Zep will give your agent persistent user memory.',
  },
  {
    user: 'Please keep answers concise and data-backed, and use tables when comparing options.',
    assistant: 'Understood — concise, data-backed, tables for comparisons.',
  },
];

async function ignore(label, fn) {
  try {
    await fn();
    console.log(`✓ ${label}`);
  } catch (e) {
    console.log(`• ${label} skipped: ${String(e?.message ?? e)}`);
  }
}

console.log(`Seeding Zep user ${userId} (thread ${threadId})…`);

await ignore('user.add', () =>
  client.user.add({ userId, email, firstName: 'John', lastName: 'Renaldi' })
);
await ignore('thread.create', () => client.thread.create({ threadId, userId }));

const messages = turns.flatMap((t) => [
  { role: 'user', name: NAME, content: t.user },
  { role: 'assistant', name: 'Assistant', content: t.assistant },
]);

await ignore('thread.addMessages', () =>
  client.thread.addMessages(threadId, { messages, ignoreRoles: ['assistant'] })
);

console.log(
  `\nAdded ${turns.length} user turns. Zep now processes them into the graph (async).`
);

// Poll the user-node summary — this is the cross-session <USER_SUMMARY> source.
console.log('\nPolling user.getNode summary (graph processing is async)…');
for (let i = 1; i <= 6; i++) {
  await new Promise((r) => setTimeout(r, 10000));
  let summary = '';
  try {
    const node = await client.user.getNode(userId);
    summary = (node?.node?.summary ?? '').trim();
  } catch (e) {
    console.log(`  attempt ${i}: getNode error: ${String(e?.message ?? e)}`);
    continue;
  }
  if (summary) {
    console.log(`\n✅ user-node summary is ready (attempt ${i}):\n`);
    console.log(summary);
    process.exit(0);
  }
  console.log(`  attempt ${i}/6: summary not built yet…`);
}

console.log(
  '\n⏳ Summary not populated yet — graph extraction can take a bit longer.\n' +
    'Re-check later with a getNode call, or just fire a chat through /api/chat;\n' +
    'retrieveUserContext will pick it up once Zep finishes processing.'
);
