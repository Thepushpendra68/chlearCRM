-- =====================================================
-- Migration: Rename subdomain to company_slug
-- Date: 2025-01-15
-- Description: Rename the 'subdomain' column to 'company_slug'
--              to better reflect that it's a unique identifier,
--              not an actual DNS subdomain.
-- =====================================================

-- Step 1: Rename the column
ALTER TABLE companies
RENAME COLUMN subdomain TO company_slug;

-- Step 2: Rename the unique constraint (if explicitly named)
-- Note: Unique constraint on subdomain should automatically carry over
-- but we'll verify it exists on the new column name

-- Step 3: Drop the old index and create a new one with updated name
DROP INDEX IF EXISTS idx_companies_subdomain;
CREATE INDEX idx_companies_company_slug ON companies(company_slug);

-- Step 4: Add a comment to the column for documentation
COMMENT ON COLUMN companies.company_slug IS 'URL-friendly unique identifier for the company (not a real DNS subdomain)';

-- Verification queries (run these to confirm migration):
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'companies' AND column_name = 'company_slug';
--
-- SELECT indexname, indexdef
-- FROM pg_indexes
-- WHERE tablename = 'companies' AND indexname = 'idx_companies_company_slug';
