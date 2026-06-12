---
description: REST principles, Zod validation, server Supabase client
globs: app/api/**
---

# API Design & Backend (applies to `app/api/**`)

- **Logic**: use Node.js within Next.js Route Handlers for backend logic.
- **REST principles**: consistent HTTP methods (`GET`, `POST`, `PUT`/`PATCH`, `DELETE`) and
  proper status codes (2xx, 4xx, 5xx).
- **Standardized responses**: use a consistent shape (e.g. `{ data, metadata, error }`).
- **Features**: standardized pagination, filtering, and sorting via query parameters.
- **Validation**: validate all endpoint inputs with **Zod**.
- **Return types**: annotate handlers explicitly (e.g. `Promise<NextResponse>`).
- **Auth context**: use the server Supabase client (`lib/supabase/server.ts`) so requests run
  as the signed-in user and RLS applies — never trust client-supplied identity.
