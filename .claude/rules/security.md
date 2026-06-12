---
description: Auth/RLS, input sanitization, secrets management
globs: app/**,lib/**,proxy.ts
---

# Security (applies to all source)

- **Authentication**: use Supabase auth; validate sessions and handle expiration. The app is
  login-controlled via `proxy.ts` — see `.claude/rules/database.md`.
- **Authorization**: enforce via **RLS** policies (least privilege). Never trust the client
  for authorization; use the server Supabase client so RLS applies.
- **Input sanitization**: sanitize all user inputs to prevent XSS and injection; validate at
  API boundaries with Zod.
- **API security**: configure CORS policies and implement rate limiting on endpoints.
- **Secrets**: store all sensitive configuration in environment variables (`.env.local`,
  gitignored). **Never commit secrets.** The pre-commit hook (`scripts/check-secrets.js`)
  scans staged files for API keys, tokens, and private keys and blocks the commit.
