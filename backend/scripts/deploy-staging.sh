#!/bin/bash

set -euo pipefail

SCRIPT_DIR=$(cd -- "$(dirname "${BASH_SOURCE[0]}")" >/dev/null 2>&1 && pwd)

COMPOSE_FILE=${COMPOSE_FILE:-"${SCRIPT_DIR}/../docker/docker-compose.staging.yml"}
APP_SERVICE=${APP_SERVICE:-api}
ENVIRONMENT=staging PUBLIC_HEALTHCHECK_URL=${PUBLIC_HEALTHCHECK_URL:-"https://staging.studyin.app/health/ready"} \
COMPOSE_FILE="$COMPOSE_FILE" \
APP_SERVICE="$APP_SERVICE" \
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/../.env.staging}" \
"$SCRIPT_DIR/deploy.sh"
