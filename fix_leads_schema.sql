-- Fix leads table schema by adding first_name and last_name columns
-- This migration adds proper first_name and last_name columns to the Supabase leads table

-- Step 1: Add the new columns
ALTER TABLE leads
ADD COLUMN IF NOT EXISTS first_name VARCHAR(50),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(50);

-- Step 2: Migrate existing data from name field to first_name and last_name
UPDATE leads
SET
  first_name = CASE
    WHEN position(' ' in COALESCE(name, '')) > 0
    THEN substring(COALESCE(name, '') from 1 for position(' ' in COALESCE(name, '')) - 1)
    ELSE COALESCE(name, '')
  END,
  last_name = CASE
    WHEN position(' ' in COALESCE(name, '')) > 0
    THEN substring(COALESCE(name, '') from position(' ' in COALESCE(name, '')) + 1)
    ELSE ''
  END
WHERE first_name IS NULL OR last_name IS NULL;

-- Step 3: Set NOT NULL constraints on the new columns
ALTER TABLE leads
ALTER COLUMN first_name SET NOT NULL,
ALTER COLUMN last_name SET NOT NULL;

-- Step 4: Add performance indexes
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads(last_name);
CREATE INDEX IF NOT EXISTS idx_leads_full_name ON leads(first_name, last_name);

-- Step 5: Update the full-text search index to include first_name and last_name
DROP INDEX IF EXISTS leads_search_idx;
CREATE INDEX leads_search_idx ON leads USING gin(
  to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(company, ''))
);

-- Step 6: Add a computed column or trigger to keep name field in sync (optional)
-- We'll keep the name field for backward compatibility
UPDATE leads
SET name = first_name || ' ' || last_name
WHERE name IS NULL OR name = '';

COMMENT ON COLUMN leads.first_name IS 'First name of the lead (required)';
COMMENT ON COLUMN leads.last_name IS 'Last name of the lead (required)';
COMMENT ON COLUMN leads.name IS 'Full name field for backward compatibility (computed from first_name + last_name)';