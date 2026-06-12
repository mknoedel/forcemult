# n8n workflow suite

Five importable workflows — see [SETUP-CAPSTONE.md](../SETUP-CAPSTONE.md) for the full import + credential checklist and [CAPSTONE.md](../CAPSTONE.md) for architecture and trade-offs.

| File                                           | Webhook path / trigger                             | Notes                                                                                               |
| ---------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `workflows/capstone-graph-query-subagent.json` | called by other workflows                          | **Publish it** or tools can't call it. Zep base URL + graph id live in its `Config` node.           |
| `workflows/capstone-chat-agent.json`           | `POST /webhook/capstone-agent` (header `API_KEY`)  | Body: `{ message, sessionId, userId, context }` (the template app's contract). Responds plain text. |
| `workflows/capstone-ingestion-pipeline.json`   | `POST /webhook/capstone-ingest` (header `API_KEY`) | Body: `{ title, text, source }`. Responds with the transparent extraction/dedupe report.            |
| `workflows/capstone-email-channel.json`        | Gmail trigger (poll, unread, `-from:me`)           | Ships with **pinned sample data** so you can run it manually without Gmail.                         |
| `workflows/capstone-eval-runner.json`          | manual                                             | Update the `Call Capstone Agent` URL + both Google Sheets nodes after import.                       |

Local verification (mock LLM + mock Zep + Docker n8n + local Supabase):

```bash
npx supabase start
bash scripts/verify/run-local-verification.sh   # imports, publishes, runs 20 E2E checks
bash scripts/verify/run-app-e2e.sh              # 8 app-through-n8n checks
node scripts/verify/inspect-executions.mjs      # debug helper: dump recent execution traces
```
