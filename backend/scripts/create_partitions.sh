#!/bin/bash

set -euo pipefail

DB_NAME="${DB_NAME:-studyin}"
DB_USER="${DB_USER:-studyin_user}"
DB_HOST="${DB_HOST:-localhost}"

if [[ -n "${DB_PASSWORD:-}" ]]; then
    export PGPASSWORD="$DB_PASSWORD"
fi

echo "🔧 Ensuring user_question_attempts partitions are provisioned..."

psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" <<'SQL'
DO $$
DECLARE
    start_month DATE := date_trunc('month', CURRENT_DATE)::date;
    month_offset INTEGER;
    partition_start DATE;
    partition_end DATE;
    partition_suffix TEXT;
    partition_name TEXT;
BEGIN
    EXECUTE 'CREATE TABLE IF NOT EXISTS user_question_attempts_archive '
        'PARTITION OF user_question_attempts DEFAULT;';

    FOR month_offset IN 0..17 LOOP
        partition_start := (start_month + (month_offset - 1) * INTERVAL '1 month')::date;
        partition_end := (partition_start + INTERVAL '1 month')::date;
        partition_suffix := to_char(partition_start, 'YYYY_MM');
        partition_name := format('user_question_attempts_%s', partition_suffix);

        EXECUTE format(
            'CREATE TABLE IF NOT EXISTS %I PARTITION OF user_question_attempts '
            'FOR VALUES FROM (%L) TO (%L);',
            partition_name,
            partition_start,
            partition_end
        );

        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_attempts_%s_user_id '
            'ON %I (user_id, answered_at);',
            partition_suffix,
            partition_name
        );

        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_attempts_%s_question_id '
            'ON %I (question_id);',
            partition_suffix,
            partition_name
        );

        EXECUTE format(
            'CREATE INDEX IF NOT EXISTS idx_attempts_%s_session_id '
            'ON %I (session_id) WHERE session_id IS NOT NULL;',
            partition_suffix,
            partition_name
        );
    END LOOP;
END $$;
SQL

echo "✅ Partition maintenance complete"
