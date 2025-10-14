-- Migration: Fix leads table schema to match application code
-- This migration adds missing columns that the application expects

-- Add first_name and last_name columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='leads' AND column_name='first_name') THEN
    ALTER TABLE leads ADD COLUMN first_name TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='leads' AND column_name='last_name') THEN
    ALTER TABLE leads ADD COLUMN last_name TEXT;
  END IF;
END $$;

-- Migrate existing 'name' data to first_name and last_name
UPDATE leads
SET first_name = SPLIT_PART(name, ' ', 1),
    last_name = CASE
      WHEN ARRAY_LENGTH(STRING_TO_ARRAY(name, ' '), 1) > 1
      THEN SUBSTRING(name FROM POSITION(' ' IN name) + 1)
      ELSE ''
    END
WHERE first_name IS NULL OR last_name IS NULL;

-- Add job_title column (rename from title)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='leads' AND column_name='job_title') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='leads' AND column_name='title') THEN
      -- Rename title to job_title
      ALTER TABLE leads RENAME COLUMN title TO job_title;
    ELSE
      -- Create job_title
      ALTER TABLE leads ADD COLUMN job_title TEXT;
    END IF;
  END IF;
END $$;

-- Add lead_source column (rename from source)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='leads' AND column_name='lead_source') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name='leads' AND column_name='source') THEN
      -- Rename source to lead_source
      ALTER TABLE leads RENAME COLUMN source TO lead_source;
    ELSE
      -- Create lead_source
      ALTER TABLE leads ADD COLUMN lead_source TEXT DEFAULT 'other';
    END IF;
  END IF;
END $$;

-- Add probability column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='leads' AND column_name='probability') THEN
    ALTER TABLE leads ADD COLUMN probability INTEGER DEFAULT 0 CHECK (probability >= 0 AND probability <= 100);
  END IF;
END $$;

-- Make first_name and last_name NOT NULL after migration
ALTER TABLE leads ALTER COLUMN first_name SET NOT NULL;
ALTER TABLE leads ALTER COLUMN last_name SET NOT NULL;

-- Drop the old 'name' column if it still exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='leads' AND column_name='name') THEN
    ALTER TABLE leads DROP COLUMN name;
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_leads_first_name ON leads(first_name);
CREATE INDEX IF NOT EXISTS idx_leads_last_name ON leads(last_name);
CREATE INDEX IF NOT EXISTS idx_leads_lead_source ON leads(lead_source);

COMMENT ON COLUMN leads.first_name IS 'Contact first name';
COMMENT ON COLUMN leads.last_name IS 'Contact last name';
COMMENT ON COLUMN leads.job_title IS 'Contact job title/position';
COMMENT ON COLUMN leads.lead_source IS 'Source of the lead';
COMMENT ON COLUMN leads.probability IS 'Probability of closing (0-100)';
