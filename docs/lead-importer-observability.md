# Lead Import Observability Guide

The lead-importer revamp emits structured telemetry and stores rollups so teams can monitor import health without diving into raw logs. Use this guide to understand what ships out of the box and how to extend it.

## Data Sources

| Store | Purpose | Notes |
| --- | --- | --- |
| `import_history.summary` | Persisted outcome snapshot for every import attempt. | Contains `stats` (total/valid/invalid), `warnings`, `errors`, and optional `timings`. Populated even when bulk insert is skipped. |
| `import_telemetry` | Time-series telemetry for dry runs and committed imports. | New table created via `migrations/20251014_import_telemetry.sql`. One row per validation/import event. |
| Audit log (`audit_logs`) | High-level events for governance. | `IMPORT_*` actions now include totals, valid/invalid counts, and config version. |
| Structured console logs | Realtime signal for observability stacks. | Every validation/import emits a JSON payload prefixed with `[ImportTelemetry]`. Ship these into Logflare, Datadog, etc. |
| Super Admin dashboard | At-a-glance telemetry in the Platform Overview (`/app/platform`). | Calls `/api/platform/imports/telemetry` (recorded as `IMPORT_TELEMETRY_VIEWED` in audit logs). |

## What Gets Recorded

Both dry-run and import execution paths capture:

- `stats`: `{ total, valid, invalid }` from the validation engine.
- `warning_count` and `error_count`: counts of per-row warnings/errors surfaced to the user.
- `duplicate_policy` and `config_version`: the policies that shaped the run.
- `duration_ms`: aggregate processing time (parse + validate + insert for imports).
- `metadata`: contextual fields such as `file_name`, `attempted_count`, `inserted_count`, and `failed_count`.

The backend will fall back gracefully if the telemetry table is missing (warning is logged once), so you can roll out migrations safely ahead of deploys.

## Example Queries

```sql
-- Most recent import attempts with success ratios
SELECT
  h.created_at,
  h.filename,
  (h.successful_records)::int AS success_count,
  (h.failed_records)::int AS fail_count,
  (h.summary->'stats'->>'valid')::int AS valid_after_validation,
  (h.summary->'timings'->>'validation_ms')::int AS validation_ms,
  h.duplicate_policy,
  h.mode
FROM import_history h
ORDER BY h.created_at DESC
LIMIT 25;
```

```sql
-- Dry run vs import performance trends
SELECT
  phase,
  date_trunc('day', created_at) AS day,
  avg((stats->>'total')::int) AS avg_rows,
  avg(warning_count) AS avg_warnings,
  avg(error_count) AS avg_errors,
  percentile_cont(0.95) WITHIN GROUP (ORDER BY duration_ms) AS p95_duration_ms
FROM import_telemetry
GROUP BY 1, 2
ORDER BY 2 DESC;
```

```sql
-- Identify duplicate-heavy sources
SELECT
  (metadata->>'file_name') AS file_name,
  sum(error_count) AS total_errors,
  sum((stats->>'invalid')::int) AS total_invalid,
  max(duplicate_policy) AS duplicate_policy
FROM import_telemetry
WHERE phase = 'import'
GROUP BY 1
ORDER BY total_errors DESC
LIMIT 10;
```

## Deployment Checklist

1. Run both SQL migrations locally or via Supabase SQL editor:
   - `migrations/20251014_lead_import_config_tables.sql`
   - `migrations/20251014_import_telemetry.sql`
2. Verify the `import_telemetry` table exists (`select * from import_telemetry limit 1;`).
3. Forward structured logs by setting `LOG_AGGREGATOR_URL` (and optional `LOG_AGGREGATOR_TOKEN`). The backend will POST JSON payloads for every telemetry run while still writing `[ImportTelemetry] ...` to stdout.

## Extending Telemetry

- **Dashboards:** Use the telemetry table to build Grafana or Supabase dashboards showing failure rates and p95 validation time.
- **Alerts:** Configure your monitoring tool to alert when `error_count` spikes or when `duration_ms` exceeds expected thresholds.
- **Data retention:** If telemetry volume grows, attach a retention policy (e.g., Supabase configurable retention or scheduled purge job).

## Related Docs

- `docs/lead-importer-prd.md` — Product context and roadmap.
- `docs/lead-importer-prd.md#metrics--monitoring` — Targets and KPIs tied to this instrumentation.
