#!/bin/bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "Usage: $0 <NEW_PASSWORD> [encrypt|plain]"
  exit 1
fi

NEW_PASSWORD="$1"
MODE="${2:-encrypt}"

DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$DIR"

# Optional: ensure DB backup
mkdir -p db
if [ -f db/baby-tracker.db ]; then
  cp "db/baby-tracker.db" "db/baby-tracker.db.backup-$(date +%F-%H%M%S)"
  echo "Backup created."
fi

npx --yes tsx scripts/reset-admin-password.ts "$NEW_PASSWORD" "$MODE"

echo "Admin password reset complete (mode=$MODE)."


