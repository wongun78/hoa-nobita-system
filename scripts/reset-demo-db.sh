#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DB_CONTAINER="${DB_CONTAINER:-hoanobita-postgres}"
PORT="${BACKEND_PORT:-8080}"

log(){ echo "[reset] $*"; }
need(){ command -v "$1" >/dev/null || { echo "$1 is required" >&2; exit 1; }; }
need docker

cd "$ROOT_DIR"

if command -v lsof >/dev/null; then
  PIDS="$(lsof -ti tcp:"$PORT" || true)"
  if [[ -n "$PIDS" ]]; then
    log "Stopping process(es) on port $PORT: $PIDS"
    kill $PIDS || true
  else
    log "No backend process is listening on port $PORT"
  fi
fi

log "Dropping Postgres volume and containers"
docker compose down -v

log "Starting clean Postgres"
docker compose up -d postgres

log "Waiting for Postgres health"
for i in {1..60}; do
  STATUS="$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || true)"
  if [[ "$STATUS" == "healthy" ]]; then
    log "Postgres is healthy"
    cat <<INFO

Next commands:
  cd "$ROOT_DIR/backend" && ./mvnw spring-boot:run
  cd "$ROOT_DIR" && bash scripts/seed-demo-data.sh
  cd "$ROOT_DIR" && bash scripts/verify-demo-data.sh
INFO
    exit 0
  fi
  sleep 1
done

echo "Postgres did not become healthy in time." >&2
exit 1
