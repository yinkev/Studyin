#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)
PROJECT_ROOT=$(dirname "$SCRIPT_DIR")

cd "$PROJECT_ROOT"

COMPOSE_FILE=${COMPOSE_FILE:-"${PROJECT_ROOT}/docker/docker-compose.prod.yml"}
APP_SERVICE=${APP_SERVICE:-api}
ENVIRONMENT=${ENVIRONMENT:-production}

REQUIRED_COMMANDS=(docker "docker compose" pg_dump pg_restore curl)

function require_command() {
  local cmd=$1
  if ! eval "command -v ${cmd%% *} >/dev/null"; then
    echo "[deploy] Missing required command: $cmd" >&2
    exit 1
  fi
}

for command_name in "${REQUIRED_COMMANDS[@]}"; do
  require_command "$command_name"
done

ENV_FILE=${ENV_FILE:-"${PROJECT_ROOT}/.env"}
if [[ -f "$ENV_FILE" ]]; then
  echo "[deploy] Loading environment from $ENV_FILE"
  set -a
  # shellcheck source=/dev/null
  source "$ENV_FILE"
  set +a
fi

for var in DB_HOST DB_PORT DB_NAME DB_USER; do
  if [[ -z "${!var:-}" ]]; then
    echo "[deploy] Environment variable $var must be set" >&2
    exit 1
  fi
done

BACKUP_FILE=""

function rollback() {
  echo "[deploy] Rolling back deployment"
  local latest_backup
  if [[ -n "$BACKUP_FILE" ]]; then
    latest_backup="$BACKUP_FILE"
  else
    latest_backup=$(ls -1t "${PROJECT_ROOT}/backups/${ENVIRONMENT}"/*.dump 2>/dev/null | head -n 1 || true)
  fi

  if [[ -z "$latest_backup" ]]; then
    echo "[deploy] No backup available for rollback" >&2
    return
  fi

  if [[ -z "${DB_PASSWORD:-}" ]]; then
    echo "[deploy] DB_PASSWORD not set; rollback aborted" >&2
    return
  fi

  echo "[deploy] Restoring database from $latest_backup"
  PGPASSWORD="$DB_PASSWORD" pg_restore \
    --clean --if-exists \
    --host="$DB_HOST" \
    --port="$DB_PORT" \
    --username="$DB_USER" \
    --dbname="$DB_NAME" \
    "$latest_backup"
}

trap rollback ERR

echo "[deploy] Creating database backup"
BACKUP_FILE=$(
  DB_HOST="$DB_HOST" \
  DB_PORT="$DB_PORT" \
  DB_NAME="$DB_NAME" \
  DB_USER="$DB_USER" \
  DB_PASSWORD="${DB_PASSWORD:-}" \
  "$SCRIPT_DIR/backup.sh" "$ENVIRONMENT"
)
echo "[deploy] Backup stored at $BACKUP_FILE"

echo "[deploy] Building and starting services"
docker compose -f "$COMPOSE_FILE" pull
docker compose -f "$COMPOSE_FILE" up -d --build

echo "[deploy] Applying database migrations"
docker compose -f "$COMPOSE_FILE" run --rm "$APP_SERVICE" alembic upgrade head

echo "[deploy] Running partition maintenance"
docker compose -f "$COMPOSE_FILE" run --rm "$APP_SERVICE" bash scripts/create_partitions.sh

echo "[deploy] Performing health check"
curl --fail --silent --show-error "${PUBLIC_HEALTHCHECK_URL:-http://localhost:8000/health/ready}" >/dev/null

echo "[deploy] Deployment completed successfully"

trap - ERR
