# Database Migrations

## Running the Schema Fix Migration

The `fix_leads_schema.sql` migration fixes a critical schema mismatch between the application code and the database.

### What It Does:

1. **Adds missing columns** that the application expects:
   - `first_name` and `last_name` (splits existing `name` field)
   - `job_title` (renames from `title`)
   - `lead_source` (renames from `source`)
   - `probability` (adds new column for win probability 0-100)

2. **Migrates existing data** safely without data loss

3. **Adds performance indexes** on frequently queried fields

4. **Sets NOT NULL constraints** on required fields

### How to Run:

#### Option 1: Via Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy the contents of `fix_leads_schema.sql`
4. Paste and run the SQL
5. Verify success (should show "Success. No rows returned")

#### Option 2: Via psql Command Line
```bash
psql postgresql://[YOUR_SUPABASE_CONNECTION_STRING] -f migrations/fix_leads_schema.sql
```

#### Option 3: Via Supabase CLI (if installed)
```bash
supabase db push migrations/fix_leads_schema.sql
```

### Verification:

After running the migration, verify the schema:

```sql
-- Check that new columns exist
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leads'
ORDER BY ordinal_position;
```

Expected columns should include:
- first_name (text, NOT NULL)
- last_name (text, NOT NULL)
- job_title (text, nullable)
- lead_source (text, nullable)
- probability (integer, nullable)

### Rollback (if needed):

```sql
-- Recreate original schema (WARNING: This will lose data)
ALTER TABLE leads ADD COLUMN name TEXT;
UPDATE leads SET name = CONCAT(first_name, ' ', last_name);
ALTER TABLE leads RENAME COLUMN job_title TO title;
ALTER TABLE leads RENAME COLUMN lead_source TO source;
ALTER TABLE leads DROP COLUMN probability;
ALTER TABLE leads DROP COLUMN first_name;
ALTER TABLE leads DROP COLUMN last_name;
```

## What This Fixes:

### Before Migration:
- Import feature fails with "column not found" errors
- Code expects columns that don't exist in database
- Inconsistent data model between application and database

### After Migration:
- Import works seamlessly
- All application features use correct column names
- Database matches application expectations
- Column whitelisting prevents future schema issues
