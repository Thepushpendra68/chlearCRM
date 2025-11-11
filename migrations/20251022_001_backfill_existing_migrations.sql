-- =====================================================
-- BACKFILL EXISTING MIGRATIONS INTO TRACKING TABLE
-- =====================================================
-- This migration records all existing migrations that were
-- applied before the tracking system was implemented.
--
-- This ensures we don't re-apply existing migrations and
-- maintain a complete history.
--
-- SAFETY: This only inserts records. It doesn't modify
-- any existing database objects.
-- =====================================================

BEGIN;

-- =====================================================
-- 1. BACKFILL EXISTING MIGRATIONS
-- =====================================================
-- Insert all known migrations that have already been applied

INSERT INTO _migrations.schema_migrations
  (version, description, batch, success, installed_by, installed_on)
VALUES
  -- Batch 1: Initial migrations (estimated dates)
  ('20251001_005', 'add_user_preferences', 1, true, 'system', NOW() - INTERVAL '22 days'),
  ('20251001_006', 'fix_leads_schema', 1, true, 'system', NOW() - INTERVAL '22 days'),

  -- Batch 2: Mid-October migrations (estimated dates)
  ('20251014_001', 'add_lead_email_company_unique_index', 2, true, 'system', NOW() - INTERVAL '8 days'),
  ('20251014_002', 'import_telemetry', 2, true, 'system', NOW() - INTERVAL '8 days'),
  ('20251014_003', 'lead_import_config_tables', 2, true, 'system', NOW() - INTERVAL '8 days'),

  -- Batch 3: Late October migrations
  ('20251017_004', 'add_lead_source_labels', 3, true, 'system', NOW() - INTERVAL '5 days')
ON CONFLICT (version) DO NOTHING;

-- =====================================================
-- 2. LOG THIS BACKFILL MIGRATION
-- =====================================================

INSERT INTO _migrations.schema_migrations
  (version, description, batch, success, installed_by)
VALUES
  ('20251022_001', 'backfill_existing_migrations', 4, true, CURRENT_USER)
ON CONFLICT (version) DO NOTHING;

COMMIT;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
--
-- View all backfilled migrations:
-- SELECT * FROM _migrations.v_applied_migrations;
--
-- Get migration stats:
-- SELECT * FROM _migrations.get_migration_stats();
--
-- Count by batch:
-- SELECT batch, COUNT(*) FROM _migrations.schema_migrations
-- GROUP BY batch ORDER BY batch;
--
-- =====================================================

