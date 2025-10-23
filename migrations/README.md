# 🗄️ Database Migrations

**Current Status:** ✅ Migration tracking system implemented (October 22, 2025)

---

## 📋 Overview

This directory contains all database schema migrations for the CHLEAR CRM application. Migrations are versioned, tracked, and can be executed via Supabase SQL Editor.

### Key Information
- **Database:** Supabase (PostgreSQL)
- **Tracking:** Yes - All migrations tracked in `_migrations.schema_migrations` table
- **Current Version:** Migration tracking v1.0
- **Total Applied Migrations:** 7 (including tracking system)
- **Last Migration:** October 22, 2025

---

## 🚀 Quick Start

### 1. View Applied Migrations
```sql
SELECT * FROM _migrations.v_applied_migrations;
```

### 2. Get Migration Statistics
```sql
SELECT * FROM _migrations.get_migration_stats();
```

### 3. Execute a New Migration

**Step 1:** Create migration file
```
migrations/YYYYMMDD_NNN_description.sql
```

**Step 2:** Copy contents into Supabase SQL Editor

**Step 3:** Execute and verify
```sql
SELECT * FROM _migrations.schema_migrations 
WHERE version = 'YYYYMMDD_NNN';
```

---

## 📁 Migration Files

### Current Migrations (In Order)

| Sequence | Date | File | Status | Purpose |
|----------|------|------|--------|---------|
| 1 | Oct 22 | `20251022_000_migration_tracking_schema.sql` | ✅ Applied | Create migration tracking infrastructure |
| 2 | Oct 22 | `20251022_001_backfill_existing_migrations.sql` | ✅ Applied | Record existing migrations in tracking table |
| 3 | Oct 1 | `20251001_005_add_user_preferences.sql` | ✅ Applied | Add user preferences table with RLS policies |
| 4 | Oct 1 | `20251001_006_fix_leads_schema.sql` | ✅ Applied | Add missing columns to leads table |
| 5 | Oct 14 | `20251014_001_add_lead_email_company_unique_index.sql` | ✅ Applied | Add unique email constraint per company |
| 6 | Oct 14 | `20251014_002_import_telemetry.sql` | ✅ Applied | Create import telemetry tracking table |
| 7 | Oct 14 | `20251014_003_lead_import_config_tables.sql` | ✅ Applied | Add import configuration tables |
| 8 | Oct 17 | `20251017_004_add_lead_source_labels.sql` | ✅ Applied | Add lead source label support |

---

## 📊 Migration Tracking System

### What's Tracked?

```
_migrations/
├── schema_migrations       ← All migrations recorded here
├── migration_errors        ← Failed migration details
├── migration_dependencies  ← Dependency tracking
├── v_applied_migrations    ← View of applied migrations
├── v_migration_status      ← Current status overview
├── get_migration_stats()   ← Statistics function
└── get_next_batch()        ← Batch number generator
```

### Useful Queries

```sql
-- See all migrations
SELECT * FROM _migrations.v_applied_migrations;

-- Get statistics
SELECT * FROM _migrations.get_migration_stats();

-- Find failed migrations
SELECT * FROM _migrations.schema_migrations WHERE success = false;

-- Count by batch
SELECT batch, COUNT(*) as count 
FROM _migrations.schema_migrations 
GROUP BY batch 
ORDER BY batch;

-- See detailed errors
SELECT version, error_message, attempted_at 
FROM _migrations.migration_errors 
WHERE resolved = false;
```

---

## 📝 Naming Convention

### Format
```
YYYYMMDD_NNN_description.sql
```

### Examples
```
✅ 20251022_000_migration_tracking_schema.sql
✅ 20251022_001_backfill_existing_migrations.sql
✅ 20251023_002_add_email_validation_trigger.sql

❌ migration.sql
❌ fix_bug.sql
❌ 2025-10-22_feature.sql (wrong date format)
```

---

## 🔄 How to Execute Migrations

### Method 1: Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard → SQL Editor**
2. Open migration file from `migrations/` folder
3. Copy SQL contents
4. Paste into SQL Editor
5. Click **"Run"**
6. Verify success in migration tracking table

### Method 2: Verify Execution

```sql
-- After execution, verify:
SELECT * FROM _migrations.schema_migrations 
WHERE version = 'YYYYMMDD_NNN';

-- Should show:
-- version = 'YYYYMMDD_NNN'
-- success = true
-- installed_on = recent timestamp
```

---

## 🔙 Rollback Procedure

### Option 1: Using Rollback File
```sql
-- Execute corresponding rollback file
-- File: rollback/YYYYMMDD_NNN_rollback.sql
```

### Option 2: Database Restore
```
1. Go to Supabase Dashboard → Database → Backups
2. Find backup BEFORE the migration
3. Click "Restore"
4. Confirm
```

### Option 3: Manual Rollback
```sql
-- Write SQL to undo the migration
-- Then mark as reverted:
UPDATE _migrations.schema_migrations 
SET reverted_at = NOW(), reverted_by = CURRENT_USER
WHERE version = 'YYYYMMDD_NNN';
```

---

## 🛠️ Migration Template

```sql
-- =====================================================
-- MIGRATION: [Brief Title]
-- =====================================================
-- Purpose: [What does this do?]
-- Impact: [What changes?]
-- Rollback: [How to revert?]
-- =====================================================

BEGIN;

-- Your migration SQL here
-- Use IF EXISTS / IF NOT EXISTS for idempotency

COMMIT;
```

---

## ✅ Pre-Migration Checklist

Before executing ANY migration:

- [ ] Backup exists (Supabase Dashboard → Backups)
- [ ] Migration tested in dev environment
- [ ] Team notified of maintenance window
- [ ] Rollback procedure documented
- [ ] Monitoring/alerts configured
- [ ] No conflicting operations running

See **MIGRATION_PROCEDURE.md** for complete checklist.

---

## 📚 Full Documentation

For complete migration procedures, guidelines, and troubleshooting:

👉 **Read: [MIGRATION_PROCEDURE.md](./MIGRATION_PROCEDURE.md)**

Topics covered:
- Pre-migration checklist
- Step-by-step execution guide
- Rollback procedures
- Troubleshooting failed migrations
- Migration examples
- Safety guidelines

---

## 🚨 Troubleshooting

### Problem: Migration Failed
```sql
-- Check error details
SELECT version, error_message, error_detail 
FROM _migrations.schema_migrations 
WHERE success = false;
```

### Problem: Can't Find Migration Status
```sql
-- Get next batch number for new migration
SELECT _migrations.get_next_batch();
```

### Problem: Need to Revert a Migration
See [MIGRATION_PROCEDURE.md](./MIGRATION_PROCEDURE.md) → **Rollback Procedures**

---

## 📞 Need Help?

1. 📖 Read **MIGRATION_PROCEDURE.md** (this folder)
2. 🔍 Check migration error logs: `SELECT * FROM _migrations.migration_errors;`
3. 💬 Ask database administrator
4. 📝 Review similar completed migrations above

---

## 🔐 Safety Reminders

✅ **DO:**
- Use `IF EXISTS` / `IF NOT EXISTS` (idempotent)
- Test in dev first
- Document rollback plan
- Backup before production
- Update migration tracking

❌ **DON'T:**
- Skip pre-migration checks
- Mix multiple unrelated changes
- Execute without backup
- Use destructive operations without review
- Deploy during peak hours without notification

---

## 📋 File Structure

```
migrations/
├── README.md                                    ← You are here
├── MIGRATION_PROCEDURE.md                       ← Complete procedures
├── 20251022_000_migration_tracking_schema.sql   ← Prerequisite
├── 20251022_001_backfill_existing_migrations.sql
├── 20251001_005_add_user_preferences.sql
├── 20251001_006_fix_leads_schema.sql
├── 20251014_001_add_lead_email_company_unique_index.sql
├── 20251014_002_import_telemetry.sql
├── 20251014_003_lead_import_config_tables.sql
├── 20251017_004_add_lead_source_labels.sql
└── rollback/                                    ← Rollback scripts
    ├── 20251022_000_rollback.sql
    ├── 20251022_001_rollback.sql
    └── ... (future rollback files)
```

---

**Last Updated:** October 22, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
