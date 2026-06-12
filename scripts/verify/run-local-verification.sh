#!/bin/bash
# One-command local verification of the capstone n8n workflow suite.
# Requires: Docker running, local Supabase started (npx supabase start).
set -euo pipefail
cd "$(dirname "$0")/../.."

echo "→ restarting mock services"
pkill -f mock-services.mjs 2>/dev/null || true
sleep 0.5
node scripts/mocks/mock-services.mjs > /tmp/mock-services.log 2>&1 &
sleep 1
curl -s http://localhost:4545/healthz | grep -q ok

echo "→ resetting local n8n container"
docker rm -f n8n-cap >/dev/null 2>&1 || true
docker run -d --name n8n-cap -p 5678:5678 \
  -e N8N_SECURE_COOKIE=false \
  -e N8N_PERSONALIZATION_ENABLED=false \
  -e N8N_DIAGNOSTICS_ENABLED=false \
  -e GENERIC_TIMEZONE=America/Chicago \
  n8nio/n8n:latest >/dev/null

echo "→ applying grants to local Supabase (idempotent)"
DB_CONTAINER=$(docker ps --format '{{.Names}}' | grep supabase_db || true)
if [ -n "$DB_CONTAINER" ]; then
  docker exec -i "$DB_CONTAINER" psql -U postgres -d postgres -q \
    < supabase/migrations/20260612000000_grants_for_n8n_tables.sql || true
fi

echo "→ running verification"
node scripts/verify/verify-n8n.mjs
