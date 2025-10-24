-- =====================================================
-- ROLLBACK SCRIPT FOR MIGRATION 001
-- Phase 1 Schema Enhancement - ROLLBACK
-- =====================================================
-- ⚠️  WARNING: THIS WILL REMOVE ALL CUSTOM FIELDS DATA!
-- Only run this if you need to completely undo the migration
-- Consider backing up your data first
-- =====================================================

BEGIN;

-- =====================================================
-- CONFIRMATION PROMPT
-- =====================================================
-- Uncomment the following lines to require manual confirmation:
-- DO $$
-- BEGIN
--   RAISE EXCEPTION 'ROLLBACK STOPPED: Remove this block to proceed with rollback';
-- END $$;

-- =====================================================
-- SECTION 1: ROLLBACK LEADS TABLE CHANGES
-- =====================================================

-- 1.1 Drop custom_fields column (⚠️ DATA LOSS)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE leads DROP COLUMN IF EXISTS custom_fields;
    RAISE NOTICE 'Dropped custom_fields column';
  END IF;
END $$;

-- 1.2 Drop custom_fields GIN index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'leads'
    AND indexname = 'idx_leads_custom_fields'
  ) THEN
    DROP INDEX IF EXISTS idx_leads_custom_fields;
    RAISE NOTICE 'Dropped GIN index on custom_fields';
  END IF;
END $$;

-- 1.3 Drop lead_source column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'lead_source'
  ) THEN
    ALTER TABLE leads DROP COLUMN IF EXISTS lead_source;
    RAISE NOTICE 'Dropped lead_source column';
  END IF;
END $$;

-- 1.4 Drop lead_source index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'leads'
    AND indexname = 'idx_leads_lead_source'
  ) THEN
    DROP INDEX IF EXISTS idx_leads_lead_source;
    RAISE NOTICE 'Dropped index on lead_source';
  END IF;
END $$;

-- 1.5 Drop first_name column
-- Note: This preserves the original 'name' field
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE leads DROP COLUMN IF EXISTS first_name;
    RAISE NOTICE 'Dropped first_name column';
  END IF;
END $$;

-- 1.6 Drop last_name column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE leads DROP COLUMN IF EXISTS last_name;
    RAISE NOTICE 'Dropped last_name column';
  END IF;
END $$;

-- =====================================================
-- SECTION 2: ROLLBACK COMPANIES TABLE CHANGES
-- =====================================================

-- 2.1 Option A: Rename industry_type back to industry (if you want the old column name)
-- Uncomment if you want to restore the 'industry' column name:
-- DO $$
-- BEGIN
--   IF EXISTS (
--     SELECT 1 FROM information_schema.columns
--     WHERE table_name = 'companies'
--     AND column_name = 'industry_type'
--   ) THEN
--     ALTER TABLE companies RENAME COLUMN industry_type TO industry;
--     RAISE NOTICE 'Renamed industry_type back to industry';
--   END IF;
-- END $$;

-- 2.1 Option B: Drop industry_type column entirely (more destructive)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies'
    AND column_name = 'industry_type'
  ) THEN
    ALTER TABLE companies DROP COLUMN IF EXISTS industry_type;
    RAISE NOTICE 'Dropped industry_type column';
  END IF;
END $$;

-- 2.2 Drop industry_type index
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'companies'
    AND indexname = 'idx_companies_industry_type'
  ) THEN
    DROP INDEX IF EXISTS idx_companies_industry_type;
    RAISE NOTICE 'Dropped index on industry_type';
  END IF;
END $$;

-- =====================================================
-- SECTION 3: ROLLBACK PICKLIST OPTIONS CHANGES
-- =====================================================

-- 3.1 Drop description column
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_picklist_options'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE lead_picklist_options DROP COLUMN IF EXISTS description;
    RAISE NOTICE 'Dropped description column';
  END IF;
END $$;

-- 3.2 Restore original CHECK constraint (only 'source' and 'status')
DO $$
BEGIN
  -- Drop expanded constraint
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'lead_picklist_options'
    AND constraint_name = 'lead_picklist_options_type_check'
  ) THEN
    ALTER TABLE lead_picklist_options DROP CONSTRAINT lead_picklist_options_type_check;
    RAISE NOTICE 'Dropped expanded type check constraint';
  END IF;

  -- Restore original constraint
  ALTER TABLE lead_picklist_options
  ADD CONSTRAINT lead_picklist_options_type_check
  CHECK (type IN ('source', 'status'));

  RAISE NOTICE 'Restored original type check constraint';
END $$;

-- =====================================================
-- SECTION 4: REMOVE COMMENTS
-- =====================================================

COMMENT ON COLUMN leads.custom_fields IS NULL;
COMMENT ON COLUMN leads.lead_source IS NULL;
COMMENT ON COLUMN leads.first_name IS NULL;
COMMENT ON COLUMN leads.last_name IS NULL;
COMMENT ON COLUMN companies.industry_type IS NULL;
COMMENT ON COLUMN lead_picklist_options.description IS NULL;

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

COMMIT;

-- Print summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'ROLLBACK COMPLETED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'All Phase 1 schema changes have been rolled back.';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes reverted:';
  RAISE NOTICE '  ✗ Removed custom_fields column';
  RAISE NOTICE '  ✗ Removed lead_source column';
  RAISE NOTICE '  ✗ Removed first_name column';
  RAISE NOTICE '  ✗ Removed last_name column';
  RAISE NOTICE '  ✗ Removed industry_type column';
  RAISE NOTICE '  ✗ Removed description column';
  RAISE NOTICE '  ✗ Restored original picklist constraint';
  RAISE NOTICE '  ✗ Removed all indexes';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  Note: Original "name" field preserved in leads table';
  RAISE NOTICE '⚠️  Note: Original "source" field preserved in leads table';
  RAISE NOTICE '=====================================================';
END $$;
