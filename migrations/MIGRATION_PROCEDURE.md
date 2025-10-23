# 📋 Database Migration Procedure & Guidelines

**Last Updated:** October 22, 2025  
**Version:** 1.0  
**Audience:** Database Administrators, Backend Developers, DevOps Engineers

---

## 🚀 Quick Start

### For Urgent Migrations (Production Emergency):
1. Execute pre-migration checks (see below)
2. Run migration in Supabase SQL Editor
3. Verify success immediately
4. Document in migration tracking system

### For Standard Migrations (Planned Changes):
1. Develop and test in local/dev environment
2. Create standardized migration file
3. Get code review approval
4. Schedule maintenance window
5. Execute with full monitoring
6. Verify & document

---

## 📊 Migration Tracking System

### Understanding the Tracking Infrastructure

Your database now has an internal `_migrations` schema that tracks every migration:

```
_migrations/
├── schema_migrations     ← Core tracking table (all migrations recorded here)
├── migration_errors      ← Detailed error logs
├── migration_dependencies ← Documents dependencies between migrations
├── v_applied_migrations  ← View showing all applied migrations
├── v_migration_status    ← View showing current status overview
├── get_migration_stats() ← Function to get detailed stats
└── get_next_batch()      ← Function to get next batch number
```

### Query Migration Status

```sql
-- 🔍 See all migrations applied
SELECT * FROM _migrations.v_applied_migrations;

-- 📊 Get migration statistics
SELECT * FROM _migrations.get_migration_stats();

-- 🔎 Check for failed migrations
SELECT * FROM _migrations.schema_migrations WHERE success = false;

-- 📋 Count migrations by batch
SELECT batch, COUNT(*) FROM _migrations.schema_migrations 
GROUP BY batch ORDER BY batch;
```

---

## ✅ PRE-MIGRATION CHECKLIST

**ALWAYS complete these before executing any migration:**

- [ ] **Backup Created**: Verify database backup exists in Supabase
  - Go to: Project Settings → Database → Backups
  - Confirm recent backup exists (within last 24 hours)

- [ ] **Team Notification**: Inform stakeholders about maintenance window
  - Send notification to development team
  - Update status page if applicable
  - Note estimated duration

- [ ] **Migration Reviewed**: Migration SQL has been reviewed
  - Code reviewed by senior developer
  - Syntax validated
  - No destructive operations without approval

- [ ] **Test Environment**: Migration tested in development first
  - Created in dev/staging environment
  - Verified it achieves intended result
  - Confirmed no unintended side effects

- [ ] **Rollback Plan**: Clear rollback procedure is documented
  - Rollback SQL written and tested
  - Rollback time estimate noted
  - Team knows rollback procedure

- [ ] **Monitoring Ready**: Monitoring/alerts are configured
  - Application error logging ready
  - Performance monitoring running
  - Team on standby

---

## 📝 Migration File Naming Convention

### Standardized Format

```
YYYYMMDD_NNN_description.sql
├── YYYYMMDD = Date (Year-Month-Day)
├── NNN = Sequential number (001, 002, 003...)
└── description = Brief description (lowercase, underscores)
```

### Examples

✅ **Good Examples:**
```
20251022_000_migration_tracking_schema.sql
20251022_001_backfill_existing_migrations.sql
20251023_002_add_email_validation_trigger.sql
20251024_003_add_task_date_validation_trigger.sql
```

❌ **Bad Examples:**
```
migration.sql                    ← No date, no sequence
fix_bug.sql                      ← Ambiguous
20251022_add_feature.sql         ← Missing sequence number
2025-10-22_add_feature.sql       ← Wrong date format (use YYYYMMDD)
```

---

## 🔄 Execution Procedures

### Procedure 1: Execute Migration via Supabase Dashboard (Recommended)

**Steps:**

1. **Prepare Migration File**
   ```
   - Open: migrations/YYYYMMDD_NNN_description.sql
   - Copy entire contents
   ```

2. **Log Migration Start**
   ```sql
   -- In Supabase SQL Editor
   CALL _migrations.log_migration_start(
     'YYYYMMDD_NNN',
     'Description of what this migration does',
     [next_batch_number]
   );
   ```

3. **Execute Migration**
   ```
   - Go to: Supabase Dashboard → SQL Editor
   - Paste migration SQL contents
   - Click "Run"
   - Wait for completion (watch for errors)
   ```

4. **Verify Success**
   ```sql
   -- Check if migration succeeded
   SELECT * FROM _migrations.schema_migrations 
   WHERE version = 'YYYYMMDD_NNN';
   
   -- Should show: success = true
   ```

5. **Verify Data Integrity**
   ```sql
   -- Test that intended changes were applied
   -- Example: Check new column exists
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'your_table' 
   AND column_name = 'new_column';
   
   -- Example: Check data still intact
   SELECT COUNT(*) FROM your_table;  -- Compare to before count
   ```

6. **Log Completion**
   ```sql
   -- Mark migration as complete
   CALL _migrations.log_migration_complete(
     'YYYYMMDD_NNN',
     [execution_time_in_ms],
     NULL  -- NULL for success, error message if failed
   );
   ```

### Procedure 2: Execute Migration via Node.js CLI (Future)

```bash
# Run pending migrations automatically
npm run migrate

# Check migration status
npm run migrate:status

# Rollback last migration
npm run migrate:rollback
```

---

## 🛠️ Migration Template

**Use this template for all new migrations:**

```sql
-- =====================================================
-- MIGRATION: [Brief Title]
-- =====================================================
-- Purpose: [What does this migration do?]
-- Impact: [What will change? Any downtime?]
-- Rollback: [How to rollback if needed]
-- Testing: [How was this tested?]
-- =====================================================

BEGIN;

-- =====================================================
-- CHANGES
-- =====================================================

-- Step 1: Describe what you're doing
-- Example: Add new column to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS new_column TEXT DEFAULT 'default_value';

-- Step 2: Migrate existing data if needed
UPDATE leads SET new_column = 'migrated_value' WHERE new_column IS NULL;

-- Step 3: Add constraints if needed
ALTER TABLE leads ALTER COLUMN new_column SET NOT NULL;

-- Step 4: Create indexes if needed
CREATE INDEX IF NOT EXISTS idx_leads_new_column ON leads(new_column);

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Verify changes
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'leads' AND column_name = 'new_column';

COMMIT;

-- =====================================================
-- QUERIES TO VERIFY AFTER EXECUTION
-- =====================================================
-- 
-- SELECT COUNT(*) FROM leads;  -- Verify data integrity
-- SELECT * FROM _migrations.v_applied_migrations ORDER BY installed_on DESC LIMIT 5;
-- SELECT * FROM _migrations.get_migration_stats();
--
-- =====================================================
```

---

## 🔙 Rollback Procedures

### When You Need to Rollback

**Signs you need a rollback:**
- ❌ Migration caused unexpected errors
- ❌ Application broke after migration
- ❌ Data was lost or corrupted
- ❌ Performance degraded significantly

### How to Rollback (3 Options)

#### Option 1: Rollback Using Rollback Migration File

```sql
-- 1. Check if rollback file exists
-- File: migrations/rollback/YYYYMMDD_NNN_rollback.sql

-- 2. Review rollback SQL
-- (Always review before executing!)

-- 3. Execute rollback
-- Run the rollback SQL in Supabase SQL Editor

-- 4. Verify
SELECT * FROM _migrations.schema_migrations 
WHERE version = 'YYYYMMDD_NNN';
-- Should show: reverted_at = NOW(), reverted_by = [user]
```

#### Option 2: Restore from Backup

```
1. Go to: Supabase Dashboard → Database → Backups
2. Find backup from BEFORE the migration
3. Click "Restore"
4. Confirm (will overwrite current database)
5. Verify restoration was successful
6. Update migration tracking:
```

```sql
UPDATE _migrations.schema_migrations 
SET reverted_at = NOW(), reverted_by = CURRENT_USER
WHERE version = 'YYYYMMDD_NNN';
```

#### Option 3: Manual Rollback SQL

**If no rollback file exists:**

```sql
-- Write the inverse SQL operations
-- Example: If migration added column, rollback removes it

ALTER TABLE leads DROP COLUMN IF EXISTS new_column;

-- Then mark as reverted
UPDATE _migrations.schema_migrations 
SET reverted_at = NOW(), reverted_by = CURRENT_USER
WHERE version = 'YYYYMMDD_NNN';
```

---

## 🚨 Troubleshooting Failed Migrations

### Problem: Migration Failed with Error

**Steps to diagnose:**

```sql
-- 1. Check error details
SELECT version, error_message, error_detail 
FROM _migrations.schema_migrations 
WHERE success = false;

-- 2. Get detailed error log
SELECT * FROM _migrations.migration_errors 
WHERE version = 'YYYYMMDD_NNN'
ORDER BY attempted_at DESC;

-- 3. Check data state
SELECT COUNT(*) FROM your_table;  -- Is data intact?
```

### Problem: Migration Caused Performance Issues

```sql
-- 1. Check if indexes were created
SELECT indexname, indexdef FROM pg_indexes 
WHERE tablename = 'your_table';

-- 2. Reindex if needed
REINDEX INDEX idx_name;

-- 3. Analyze table statistics
ANALYZE your_table;
```

### Problem: Need to Re-run Migration (Idempotency)

```sql
-- Most migrations use IF EXISTS/IF NOT EXISTS
-- So they can be safely re-run:

-- Option 1: Re-run migration file
-- (Copy-paste contents again in Supabase SQL Editor)

-- Option 2: Check if migration already applied
SELECT * FROM _migrations.schema_migrations 
WHERE version = 'YYYYMMDD_NNN' AND success = true;

-- If already applied and succeeded, don't re-run
```

---

## 📚 Migration Examples

### Example 1: Adding a Validation Trigger

```sql
BEGIN;

-- Create validation function
CREATE OR REPLACE FUNCTION validate_lead_email_unique()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM leads 
      WHERE LOWER(email) = LOWER(NEW.email)
      AND company_id = NEW.company_id
      AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Email already exists in this company';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS check_lead_email_unique ON leads;
CREATE TRIGGER check_lead_email_unique
  BEFORE INSERT OR UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION validate_lead_email_unique();

COMMIT;
```

### Example 2: Adding a New Table

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS lead_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_lead_notes_lead_id ON lead_notes(lead_id);
CREATE INDEX idx_lead_notes_created_by ON lead_notes(created_by);

COMMIT;
```

---

## 🔐 Safety Guidelines

### ✅ DO:
- ✅ Test in dev environment first
- ✅ Use `IF EXISTS` / `IF NOT EXISTS` (idempotent)
- ✅ Backup before production deployment
- ✅ Document what the migration does
- ✅ Use transactions (BEGIN/COMMIT)
- ✅ Verify data after migration
- ✅ Keep migrations focused (one change at a time)

### ❌ DON'T:
- ❌ Skip the pre-migration checklist
- ❌ Execute without backup available
- ❌ Mix multiple unrelated changes in one migration
- ❌ Use destructive operations (DROP, DELETE) without review
- ❌ Execute directly on production without testing
- ❌ Forget to update migration tracking
- ❌ Deploy during peak usage hours without notification

---

## 📞 Getting Help

**If a migration fails:**

1. 📧 Check error message in Supabase dashboard
2. 🔍 Query `_migrations.migration_errors` table
3. 📋 Review migration SQL for syntax errors
4. 🆘 Contact database administrator if unsure
5. 📚 Review migration examples above

---

## 📌 Team Reminders

- Always use standardized file naming
- Always include rollback plan
- Always test before production
- Always document in CHANGELOG.md
- Always update migration tracking table
- Always inform team of maintenance windows

---

**Questions? Refer to the Supabase documentation or ask your database administrator.**

