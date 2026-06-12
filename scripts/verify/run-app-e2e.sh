#!/bin/bash
# Start the Next.js dev server wired to the local verification stack and run
# the app-level E2E checks. Assumes run-local-verification.sh passed first
# (mock on :4545, n8n on :5678 with published workflows, supabase on :54321).
set -euo pipefail
cd "$(dirname "$0")/../.."

export NEXT_PUBLIC_SUPABASE_URL="http://127.0.0.1:54321"
export NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"
export N8N_WEBHOOK_URL="http://localhost:5678/webhook/capstone-agent"
export N8N_WEBHOOK_SECRET="test-secret-123"
export N8N_INGEST_WEBHOOK_URL="http://localhost:5678/webhook/capstone-ingest"
export ZEP_API_KEY="mock-zep-key"
export ZEP_BASE_URL="http://localhost:4545/zep/api/v2"
export ZEP_GRAPH_ID="capstone-kg"

echo "→ starting Next.js dev server"
pkill -f "next dev" 2>/dev/null || true
npm run dev > /tmp/next-dev.log 2>&1 &
DEV_PID=$!
trap 'kill $DEV_PID 2>/dev/null || true' EXIT

for i in $(seq 1 60); do
  if curl -s --max-time 2 http://localhost:3000/login | grep -qi "html"; then break; fi
  sleep 1
done
echo "→ dev server up, running E2E"

node scripts/verify/verify-app-e2e.mjs
