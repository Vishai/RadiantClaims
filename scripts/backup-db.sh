#!/usr/bin/env bash

# Back up the RadiantClaims Postgres database using pg_dump.
# Creates timestamped dump files under ./backups so the dataset can
# be restored or reseeded after destructive operations.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="$ROOT_DIR/backups"
ENV_FILE="$ROOT_DIR/.env"

error() {
  echo "ERROR: $*" >&2
  exit 1
}

if ! command -v pg_dump >/dev/null 2>&1; then
  error "pg_dump not found. Install PostgreSQL client tools and retry."
fi

# Allow DATABASE_URL to be provided via environment; fall back to .env parsing.
DATABASE_URL="${DATABASE_URL:-}"

if [[ -z "$DATABASE_URL" ]]; then
  if [[ ! -f "$ENV_FILE" ]]; then
    error "DATABASE_URL not set and .env not found at $ENV_FILE"
  fi

  DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | sed -E 's/^DATABASE_URL="?([^"]*)"?/\1/')"
fi

if [[ -z "$DATABASE_URL" ]]; then
  error "Could not determine DATABASE_URL."
fi

mkdir -p "$BACKUP_DIR"

TIMESTAMP="$(date +"%Y%m%d-%H%M%S")"
OUTPUT_FILE="$BACKUP_DIR/radiantclaims-backup-$TIMESTAMP.sql"

echo "📦 Creating Postgres backup..."
echo "   Source: $DATABASE_URL"
echo "   Target: $OUTPUT_FILE"

# --no-owner makes restores easier (avoids ownership errors).
pg_dump \
  --no-owner \
  --format=plain \
  --file="$OUTPUT_FILE" \
  "$DATABASE_URL"

echo "✅ Backup complete."
echo "   Restore with: psql <database> < \"$OUTPUT_FILE\""
