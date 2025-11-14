-- =====================================================
-- MIGRATION TRACKING INFRASTRUCTURE (PREREQUISITE)
-- =====================================================
-- This migration creates the internal schema for tracking
-- all database migrations. This must be run FIRST before
-- any other tracking is applied.
--
-- SAFETY: This only creates NEW schema/tables. It does NOT
-- modify any existing business tables.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE INTERNAL SCHEMA
-- =====================================================
-- All migration tracking lives in _migrations schema
-- This is isolated from business data

CREATE SCHEMA IF NOT EXISTS _migrations;

COMMENT ON SCHEMA _migrations IS
  'Internal schema for database migration tracking. DO NOT modify directly.';

-- =====================================================
-- 2. CREATE MIGRATION TRACKING TABLE
-- =====================================================
-- This table records every migration that has been applied
-- to the database, when it was applied, and whether it succeeded

CREATE TABLE IF NOT EXISTS _migrations.schema_migrations (
  id SERIAL PRIMARY KEY,

  -- Migration identification
  version VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,

  -- Execution details
  installed_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  execution_time_ms INTEGER,
  success BOOLEAN NOT NULL DEFAULT true,
  error_message TEXT,

  -- Organization & tracking
  batch INTEGER NOT NULL DEFAULT 1,
  installed_by TEXT DEFAULT CURRENT_USER,

  -- Audit fields
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reverted_at TIMESTAMP,
  reverted_by TEXT,
  indexed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE _migrations.schema_migrations IS
  'Core migration tracking table. Records all applied migrations with execution metadata.';

COMMENT ON COLUMN _migrations.schema_migrations.version IS
  'Unique migration identifier in format: YYYYMMDD_NNN (e.g., 20251022_001)';

COMMENT ON COLUMN _migrations.schema_migrations.batch IS
  'Batch number for grouping related migrations. Helps understand deployment sequence.';

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_schema_migrations_version
  ON _migrations.schema_migrations(version);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_batch
  ON _migrations.schema_migrations(batch DESC);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_installed_on
  ON _migrations.schema_migrations(installed_on DESC);

CREATE INDEX IF NOT EXISTS idx_schema_migrations_success
  ON _migrations.schema_migrations(success);

-- =====================================================
-- 3. CREATE MIGRATION ERROR LOG TABLE
-- =====================================================
-- Detailed error tracking for troubleshooting failed migrations

CREATE TABLE IF NOT EXISTS _migrations.migration_errors (
  id SERIAL PRIMARY KEY,
  version VARCHAR(50),
  error_code VARCHAR(10),
  error_message TEXT NOT NULL,
  error_detail TEXT,
  sql_context TEXT,
  attempted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  resolved_by TEXT
);

COMMENT ON TABLE _migrations.migration_errors IS
  'Detailed error log for debugging failed migrations. Helps root cause analysis.';

CREATE INDEX IF NOT EXISTS idx_migration_errors_version
  ON _migrations.migration_errors(version);

CREATE INDEX IF NOT EXISTS idx_migration_errors_resolved
  ON _migrations.migration_errors(resolved);

-- =====================================================
-- 4. CREATE MIGRATION DEPENDENCIES TABLE
-- =====================================================
-- Documents which migrations depend on which others
-- (Optional but useful for complex deployments)

CREATE TABLE IF NOT EXISTS _migrations.migration_dependencies (
  id SERIAL PRIMARY KEY,
  migration_version VARCHAR(50) NOT NULL UNIQUE,
  depends_on_version VARCHAR(50),
  dependency_type VARCHAR(50) DEFAULT 'REQUIRED', -- REQUIRED, RECOMMENDED, OPTIONAL
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_migration_deps_version
  ON _migrations.migration_dependencies(migration_version);

-- =====================================================
-- 5. CREATE VIEW: APPLIED MIGRATIONS
-- =====================================================
-- Quick reference view for seeing which migrations have been applied

CREATE OR REPLACE VIEW _migrations.v_applied_migrations AS
SELECT
  version,
  description,
  batch,
  installed_on,
  execution_time_ms,
  success,
  installed_by,
  CASE
    WHEN reverted_at IS NOT NULL THEN 'REVERTED'
    WHEN success = false THEN 'FAILED'
    WHEN success = true THEN 'APPLIED'
    ELSE 'UNKNOWN'
  END as status
FROM _migrations.schema_migrations
ORDER BY installed_on DESC;

-- =====================================================
-- 6. CREATE VIEW: PENDING MIGRATIONS
-- =====================================================
-- This will be used to compare against actual migration files

CREATE OR REPLACE VIEW _migrations.v_migration_status AS
SELECT
  COUNT(*) FILTER (WHERE success = true) as applied_count,
  COUNT(*) FILTER (WHERE success = false) as failed_count,
  COUNT(*) FILTER (WHERE reverted_at IS NOT NULL) as reverted_count,
  MAX(batch) as current_batch,
  MAX(installed_on) as last_migration_date
FROM _migrations.schema_migrations;

-- =====================================================
-- 7. CREATE UTILITY FUNCTION: Get migration stats
-- =====================================================

CREATE OR REPLACE FUNCTION _migrations.get_migration_stats()
RETURNS TABLE (
  total_migrations BIGINT,
  applied_migrations BIGINT,
  failed_migrations BIGINT,
  reverted_migrations BIGINT,
  current_batch INTEGER,
  last_applied TIMESTAMP
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT,
    COUNT(*) FILTER (WHERE success = true)::BIGINT,
    COUNT(*) FILTER (WHERE success = false)::BIGINT,
    COUNT(*) FILTER (WHERE reverted_at IS NOT NULL)::BIGINT,
    COALESCE(MAX(batch), 0)::INTEGER,
    MAX(installed_on)
  FROM _migrations.schema_migrations;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 8. CREATE UTILITY FUNCTION: Get next batch number
-- =====================================================

CREATE OR REPLACE FUNCTION _migrations.get_next_batch()
RETURNS INTEGER AS $$
BEGIN
  RETURN COALESCE(
    (SELECT MAX(batch) + 1 FROM _migrations.schema_migrations),
    1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 9. CREATE LOGGING PROCEDURE: Log migration execution
-- =====================================================

CREATE OR REPLACE PROCEDURE _migrations.log_migration_start(
  p_version VARCHAR,
  p_description TEXT,
  p_batch INTEGER DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch INTEGER;
BEGIN
  v_batch := COALESCE(p_batch, _migrations.get_next_batch());

  INSERT INTO _migrations.schema_migrations
    (version, description, batch, success, installed_by)
  VALUES
    (p_version, p_description, v_batch, false, CURRENT_USER)
  ON CONFLICT (version) DO NOTHING;
END;
$$;

-- =====================================================
-- 10. CREATE LOGGING PROCEDURE: Log migration completion
-- =====================================================

CREATE OR REPLACE PROCEDURE _migrations.log_migration_complete(
  p_version VARCHAR,
  p_execution_time_ms INTEGER DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE _migrations.schema_migrations
  SET
    success = (p_error_message IS NULL),
    execution_time_ms = p_execution_time_ms,
    error_message = p_error_message,
    indexed_at = CURRENT_TIMESTAMP
  WHERE version = p_version;
END;
$$;

-- =====================================================
-- 11. MIGRATION TRACKING TABLE FOR THIS MIGRATION
-- =====================================================
-- Record this migration itself

INSERT INTO _migrations.schema_migrations
  (version, description, batch, success, installed_by)
VALUES
  ('20251022_000', 'PREREQUISITE: migration_tracking_schema', 1, true, CURRENT_USER)
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES (Run these to verify success)
-- =====================================================
--
-- Check tables exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = '_migrations' ORDER BY table_name;
--
-- Check functions exist:
-- SELECT routine_name FROM information_schema.routines
-- WHERE routine_schema = '_migrations' ORDER BY routine_name;
--
-- Check views exist:
-- SELECT table_name FROM information_schema.tables
-- WHERE table_schema = '_migrations' AND table_type = 'VIEW';
--
-- Get migration stats:
-- SELECT * FROM _migrations.get_migration_stats();
--
-- =====================================================

