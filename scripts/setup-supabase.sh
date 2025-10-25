#!/usr/bin/env bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")"/.. && pwd)"
cd "$REPO_ROOT"

if ! command -v supabase >/dev/null 2>&1; then
  cat <<'MSG'
Supabase CLI is required but not found on your PATH.
Install it first: https://supabase.com/docs/guides/cli
MSG
  exit 1
fi

if [ ! -f "supabase/config.toml" ]; then
  cat <<'MSG'
No Supabase project is linked yet. Linking requires your project reference
and database password (if prompted). You can export SUPABASE_PROJECT_REF and
SUPABASE_DB_PASSWORD or enter them interactively when prompted.
MSG
fi

PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
DB_PASSWORD="${SUPABASE_DB_PASSWORD:-}"

if [ -z "$PROJECT_REF" ]; then
  read -rp "Enter the Supabase project ref (e.g. abcd1234): " PROJECT_REF
fi

LINK_ARGS=(link --project-ref "$PROJECT_REF")
if [ -n "$DB_PASSWORD" ]; then
  LINK_ARGS+=(--password "$DB_PASSWORD")
fi

# Link the local repo to the Supabase project so migrations apply remotely.
if [ ! -f "supabase/config.toml" ]; then
  echo "Linking to Supabase project $PROJECT_REF..."
  supabase "${LINK_ARGS[@]}"
else
  echo "Supabase project already linked; skipping link step."
fi

# Apply all checked-in migrations to the remote database.
echo "Applying migrations to Supabase project $PROJECT_REF..."
supabase db push

echo "Regenerating Supabase TypeScript types..."
supabase gen types typescript --linked --schema public \
  > src/integrations/supabase/types.ts

echo "Supabase project $PROJECT_REF is now in sync with the repository schema."
