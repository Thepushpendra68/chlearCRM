-- =====================================================
-- PHASE 1: MODULAR CRM FRAMEWORK - SCHEMA ENHANCEMENT
-- Migration: 001_phase1_schema_enhancement
-- =====================================================
-- This migration adds support for:
-- 1. Custom fields (JSONB) for industry-specific data
-- 2. Industry type tracking for companies
-- 3. Enhanced lead source tracking
-- 4. First name / Last name split from name field
-- 5. Expanded picklist types
--
-- SAFETY: This migration is IDEMPOTENT and NON-DESTRUCTIVE
-- Safe to run multiple times, preserves all existing data
-- =====================================================

BEGIN;

-- =====================================================
-- SECTION 1: ENHANCE LEADS TABLE
-- =====================================================

-- 1.1 Add custom_fields JSONB column for industry-specific data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'custom_fields'
  ) THEN
    ALTER TABLE leads ADD COLUMN custom_fields JSONB DEFAULT '{}';
    RAISE NOTICE 'Added custom_fields column to leads table';
  ELSE
    RAISE NOTICE 'custom_fields column already exists in leads table';
  END IF;
END $$;

-- 1.2 Add GIN index for efficient JSONB queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'leads'
    AND indexname = 'idx_leads_custom_fields'
  ) THEN
    CREATE INDEX idx_leads_custom_fields ON leads USING GIN (custom_fields);
    RAISE NOTICE 'Created GIN index on custom_fields';
  ELSE
    RAISE NOTICE 'GIN index on custom_fields already exists';
  END IF;
END $$;

-- 1.3 Add lead_source column (separate from 'source' for clarity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'lead_source'
  ) THEN
    ALTER TABLE leads ADD COLUMN lead_source VARCHAR(100);
    RAISE NOTICE 'Added lead_source column to leads table';

    -- Backfill lead_source from existing 'source' column
    UPDATE leads SET lead_source = source WHERE lead_source IS NULL AND source IS NOT NULL;
    RAISE NOTICE 'Backfilled lead_source from source column';
  ELSE
    RAISE NOTICE 'lead_source column already exists in leads table';
  END IF;
END $$;

-- 1.4 Create index on lead_source for filtering
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'leads'
    AND indexname = 'idx_leads_lead_source'
  ) THEN
    CREATE INDEX idx_leads_lead_source ON leads(lead_source);
    RAISE NOTICE 'Created index on lead_source';
  ELSE
    RAISE NOTICE 'Index on lead_source already exists';
  END IF;
END $$;

-- 1.5 Add first_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'first_name'
  ) THEN
    ALTER TABLE leads ADD COLUMN first_name VARCHAR(50);
    RAISE NOTICE 'Added first_name column to leads table';
  ELSE
    RAISE NOTICE 'first_name column already exists in leads table';
  END IF;
END $$;

-- 1.6 Add last_name column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'leads'
    AND column_name = 'last_name'
  ) THEN
    ALTER TABLE leads ADD COLUMN last_name VARCHAR(50);
    RAISE NOTICE 'Added last_name column to leads table';
  ELSE
    RAISE NOTICE 'last_name column already exists in leads table';
  END IF;
END $$;

-- 1.7 Backfill first_name and last_name from existing 'name' field
DO $$
DECLARE
  affected_rows INT;
BEGIN
  -- Only update rows where first_name and last_name are NULL but name exists
  UPDATE leads
  SET
    first_name = CASE
      WHEN name IS NOT NULL AND name != ''
      THEN SPLIT_PART(name, ' ', 1)
      ELSE NULL
    END,
    last_name = CASE
      WHEN name IS NOT NULL AND name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
      THEN SUBSTRING(name FROM LENGTH(SPLIT_PART(name, ' ', 1)) + 2)
      ELSE CASE
        WHEN name IS NOT NULL AND name != '' AND ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) = 1
        THEN '' -- Single name goes to first_name, last_name empty
        ELSE NULL
      END
    END
  WHERE (first_name IS NULL OR last_name IS NULL)
    AND name IS NOT NULL
    AND name != '';

  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  RAISE NOTICE 'Backfilled first_name/last_name for % rows', affected_rows;
END $$;

-- =====================================================
-- SECTION 2: ENHANCE COMPANIES TABLE
-- =====================================================

-- 2.1 Check if 'industry' column exists (from original schema)
-- If yes, rename to industry_type for consistency
-- If no, add industry_type column
DO $$
BEGIN
  -- Check if 'industry' column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'companies'
    AND column_name = 'industry'
  ) THEN
    -- Rename 'industry' to 'industry_type' if not already renamed
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies'
      AND column_name = 'industry_type'
    ) THEN
      ALTER TABLE companies RENAME COLUMN industry TO industry_type;
      RAISE NOTICE 'Renamed industry column to industry_type';
    ELSE
      RAISE NOTICE 'industry_type column already exists (industry column may need manual cleanup)';
    END IF;
  ELSE
    -- Add industry_type if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies'
      AND column_name = 'industry_type'
    ) THEN
      ALTER TABLE companies ADD COLUMN industry_type VARCHAR(50) DEFAULT 'generic';
      RAISE NOTICE 'Added industry_type column to companies table';
    ELSE
      RAISE NOTICE 'industry_type column already exists';
    END IF;
  END IF;
END $$;

-- 2.2 Update NULL or empty industry_type values to 'generic'
UPDATE companies
SET industry_type = 'generic'
WHERE industry_type IS NULL OR industry_type = '';

-- 2.3 Create index on industry_type
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE tablename = 'companies'
    AND indexname = 'idx_companies_industry_type'
  ) THEN
    CREATE INDEX idx_companies_industry_type ON companies(industry_type);
    RAISE NOTICE 'Created index on industry_type';
  ELSE
    RAISE NOTICE 'Index on industry_type already exists';
  END IF;
END $$;

-- =====================================================
-- SECTION 3: ENHANCE LEAD_PICKLIST_OPTIONS TABLE
-- =====================================================

-- 3.1 Add description column for better documentation
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'lead_picklist_options'
    AND column_name = 'description'
  ) THEN
    ALTER TABLE lead_picklist_options ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column to lead_picklist_options table';
  ELSE
    RAISE NOTICE 'description column already exists in lead_picklist_options table';
  END IF;
END $$;

-- 3.2 Drop and recreate CHECK constraint with expanded types
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_name = 'lead_picklist_options'
    AND constraint_name = 'lead_picklist_options_type_check'
  ) THEN
    ALTER TABLE lead_picklist_options DROP CONSTRAINT lead_picklist_options_type_check;
    RAISE NOTICE 'Dropped old type check constraint';
  END IF;

  -- Add new constraint with expanded types
  ALTER TABLE lead_picklist_options
  ADD CONSTRAINT lead_picklist_options_type_check
  CHECK (type IN ('source', 'status', 'priority', 'category', 'industry', 'custom'));

  RAISE NOTICE 'Added expanded type check constraint';
END $$;

-- =====================================================
-- SECTION 4: ADD HELPFUL COMMENTS
-- =====================================================

COMMENT ON COLUMN leads.custom_fields IS 'Industry-specific custom fields stored as JSONB. Allows unlimited fields without schema changes.';
COMMENT ON COLUMN leads.lead_source IS 'Enhanced lead source tracking. Use this instead of source for new implementations.';
COMMENT ON COLUMN leads.first_name IS 'Lead first name (split from name field for better data quality)';
COMMENT ON COLUMN leads.last_name IS 'Lead last name (split from name field for better data quality)';
COMMENT ON COLUMN companies.industry_type IS 'Industry type identifier (generic, school, real_estate, etc.) - determines configuration to load';
COMMENT ON COLUMN lead_picklist_options.description IS 'Optional description for picklist option documentation';

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================

COMMIT;

-- Print summary
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'MIGRATION COMPLETED SUCCESSFULLY';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Schema enhancement for Phase 1 Modular CRM complete!';
  RAISE NOTICE '';
  RAISE NOTICE 'Changes applied:';
  RAISE NOTICE '  ✓ leads.custom_fields (JSONB) - for industry-specific data';
  RAISE NOTICE '  ✓ leads.lead_source (VARCHAR) - enhanced source tracking';
  RAISE NOTICE '  ✓ leads.first_name (VARCHAR) - split from name';
  RAISE NOTICE '  ✓ leads.last_name (VARCHAR) - split from name';
  RAISE NOTICE '  ✓ companies.industry_type (VARCHAR) - config selector';
  RAISE NOTICE '  ✓ lead_picklist_options.description (TEXT) - documentation';
  RAISE NOTICE '  ✓ Expanded picklist types (6 types supported)';
  RAISE NOTICE '  ✓ Indexes created for performance';
  RAISE NOTICE '';
  RAISE NOTICE 'All existing data preserved. Backward compatible.';
  RAISE NOTICE '=====================================================';
END $$;
