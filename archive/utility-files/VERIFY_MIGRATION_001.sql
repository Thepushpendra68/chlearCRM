-- =====================================================
-- VERIFICATION SCRIPT FOR MIGRATION 001
-- Phase 1 Schema Enhancement - Verification
-- =====================================================
-- Run this script to verify all changes were applied correctly
-- =====================================================

-- =====================================================
-- CHECK 1: LEADS TABLE COLUMNS
-- =====================================================
SELECT
  'leads.custom_fields' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'custom_fields'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column missing'
  END AS status
UNION ALL
SELECT
  'leads.lead_source' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'lead_source'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column missing'
  END AS status
UNION ALL
SELECT
  'leads.first_name' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'first_name'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column missing'
  END AS status
UNION ALL
SELECT
  'leads.last_name' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'leads' AND column_name = 'last_name'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column missing'
  END AS status;

-- =====================================================
-- CHECK 2: COMPANIES TABLE COLUMNS
-- =====================================================
SELECT
  'companies.industry_type' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'companies' AND column_name = 'industry_type'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column missing'
  END AS status;

-- =====================================================
-- CHECK 3: PICKLIST OPTIONS TABLE
-- =====================================================
SELECT
  'lead_picklist_options.description' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_name = 'lead_picklist_options' AND column_name = 'description'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Column missing'
  END AS status;

-- =====================================================
-- CHECK 4: INDEXES
-- =====================================================
SELECT
  'idx_leads_custom_fields' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'leads' AND indexname = 'idx_leads_custom_fields'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Index missing'
  END AS status
UNION ALL
SELECT
  'idx_leads_lead_source' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'leads' AND indexname = 'idx_leads_lead_source'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Index missing'
  END AS status
UNION ALL
SELECT
  'idx_companies_industry_type' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes
      WHERE tablename = 'companies' AND indexname = 'idx_companies_industry_type'
    ) THEN '✓ PASS'
    ELSE '✗ FAIL - Index missing'
  END AS status;

-- =====================================================
-- CHECK 5: DATA BACKFILL
-- =====================================================
SELECT
  'Leads with first_name populated' AS check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - ' || COUNT(*) || ' leads have first_name'
    ELSE '⚠ WARNING - No leads found or not backfilled'
  END AS status
FROM leads
WHERE first_name IS NOT NULL AND first_name != '';

SELECT
  'Companies with industry_type' AS check_name,
  CASE
    WHEN COUNT(*) > 0 THEN '✓ PASS - ' || COUNT(*) || ' companies have industry_type'
    ELSE '⚠ WARNING - No companies found'
  END AS status
FROM companies
WHERE industry_type IS NOT NULL;

-- =====================================================
-- CHECK 6: CONSTRAINT VERIFICATION
-- =====================================================
SELECT
  'Picklist type constraint expanded' AS check_name,
  CASE
    WHEN EXISTS (
      SELECT 1 FROM information_schema.check_constraints
      WHERE constraint_name = 'lead_picklist_options_type_check'
      AND check_clause LIKE '%priority%'
    ) THEN '✓ PASS - Constraint includes new types'
    ELSE '✗ FAIL - Constraint not updated'
  END AS status;

-- =====================================================
-- SUMMARY: SAMPLE DATA VERIFICATION
-- =====================================================
-- Show sample of migrated data
SELECT
  '=== SAMPLE LEADS DATA ===' AS section,
  '' AS data;

SELECT
  id,
  first_name,
  last_name,
  name AS original_name,
  lead_source,
  source AS original_source,
  custom_fields
FROM leads
LIMIT 5;

SELECT
  '=== COMPANIES INDUSTRY TYPES ===' AS section,
  '' AS data;

SELECT
  id,
  name,
  industry_type
FROM companies
LIMIT 10;

-- =====================================================
-- COMPLETION MESSAGE
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'VERIFICATION COMPLETE';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Review the results above to ensure all checks pass.';
  RAISE NOTICE '';
  RAISE NOTICE 'If any checks show ✗ FAIL, re-run the migration script.';
  RAISE NOTICE 'If all checks show ✓ PASS, migration was successful!';
  RAISE NOTICE '=====================================================';
END $$;
