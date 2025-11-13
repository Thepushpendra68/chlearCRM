BEGIN;

CREATE TABLE IF NOT EXISTS import_configs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  schema_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  duplicate_policy_default TEXT NOT NULL DEFAULT 'skip',
  version INTEGER NOT NULL DEFAULT 1,
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS import_configs_company_id_idx
  ON import_configs(company_id);

CREATE TABLE IF NOT EXISTS import_mappings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies (id) ON DELETE CASCADE,
  source_key TEXT NOT NULL,
  mapping_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by UUID REFERENCES user_profiles(id),
  updated_by UUID REFERENCES user_profiles(id),
  usage_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS import_mappings_company_source_idx
  ON import_mappings(company_id, source_key);

ALTER TABLE import_history
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'apply',
  ADD COLUMN IF NOT EXISTS duplicate_policy TEXT,
  ADD COLUMN IF NOT EXISTS config_version INTEGER,
  ADD COLUMN IF NOT EXISTS validation_errors JSONB,
  ADD COLUMN IF NOT EXISTS validation_warnings JSONB,
  ADD COLUMN IF NOT EXISTS summary JSONB,
  ADD COLUMN IF NOT EXISTS error_report_url TEXT;

ALTER TABLE import_history
  ALTER COLUMN mode SET DEFAULT 'apply';

COMMIT;
