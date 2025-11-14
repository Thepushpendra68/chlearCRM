BEGIN;

CREATE TABLE IF NOT EXISTS import_telemetry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  phase TEXT NOT NULL CHECK (phase IN ('dry_run', 'import')),
  stats JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_count INTEGER NOT NULL DEFAULT 0,
  warning_count INTEGER NOT NULL DEFAULT 0,
  duplicate_policy TEXT,
  config_version INTEGER,
  duration_ms INTEGER,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS import_telemetry_company_created_idx
  ON import_telemetry (company_id, created_at DESC);

CREATE INDEX IF NOT EXISTS import_telemetry_phase_idx
  ON import_telemetry (phase);

COMMIT;
