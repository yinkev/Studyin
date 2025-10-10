#!/bin/bash

set -euo pipefail

ENVIRONMENT=${1:-production}

REQUIRED_VARS=(DB_HOST DB_PORT DB_NAME DB_USER)

for var in "${REQUIRED_VARS[@]}"; do
  if [[ -z "${!var:-}" ]]; then
  echo "[backup] Missing required environment variable: $var" >&2
  exit 1
fi
done

if [[ -z "${DB_PASSWORD:-}" ]]; then
  echo "[backup] DB_PASSWORD is not set; exporting empty password" >&2
fi

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_ROOT="backups/${ENVIRONMENT}"
mkdir -p "$BACKUP_ROOT"

BACKUP_FILE="${BACKUP_ROOT}/studyin_${TIMESTAMP}.dump"

echo "[backup] Creating database backup: ${BACKUP_FILE}" >&2

export PGPASSWORD="${DB_PASSWORD:-}"

pg_dump \
  --format=custom \
  --host="$DB_HOST" \
  --port="${DB_PORT}" \
  --username="${DB_USER}" \
  --file="$BACKUP_FILE" \
  "$DB_NAME"

echo "[backup] Backup complete" >&2
echo "$BACKUP_FILE"
