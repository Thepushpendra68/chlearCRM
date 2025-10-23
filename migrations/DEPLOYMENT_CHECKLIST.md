# 🚀 DEPLOYMENT CHECKLIST: Migration Tracking System

**Date:** October 22, 2025  
**Priority:** HIGH - Enables future migration management  
**Estimated Duration:** 10-15 minutes  
**Risk Level:** 🟢 LOW (read-only operations only)

---

## 📋 Pre-Deployment Verification

### Database Backup
- [ ] Backup exists in Supabase (verify in Dashboard → Database → Backups)
- [ ] Backup is from TODAY or within last 24 hours
- [ ] Backup size seems reasonable (document size for reference)

**Command to verify backup:**
```bash
# Go to: Supabase Dashboard → Project Settings → Database → Backups
# Take screenshot for reference
```

### Team Notification
- [ ] Notified development team (brief maintenance window)
- [ ] Informed QA team (they can test after deployment)
- [ ] Noted in team Slack/Discord (if applicable)
- [ ] No critical operations scheduled for next 15 minutes

### Prerequisites Verified
- [ ] Access to Supabase SQL Editor confirmed
- [ ] Account has superuser/admin permissions
- [ ] Browser is Chrome/Edge/Firefox (not IE)

---

## 🔄 Deployment Steps

### Step 1: Execute Prerequisites Migration (Prerequisite Schema)

**File:** `migrations/20251022_000_migration_tracking_schema.sql`

**Actions:**

- [ ] Open file in text editor
- [ ] Copy ALL contents (Ctrl+A, Ctrl+C)
- [ ] Go to: **Supabase Dashboard → SQL Editor**
- [ ] **Clear** any existing query in the editor
- [ ] **Paste** migration contents
- [ ] **Review** SQL visually (spot-check syntax)
- [ ] Click **"Run"** button
- [ ] **Wait** for execution (usually < 5 seconds)
- [ ] **Check** for errors (watch bottom panel)

**Expected Outcome:**
```
Success. No rows returned.
```

**Verification Query:**
```sql
-- Run this immediately after to verify
SELECT table_name FROM information_schema.tables 
WHERE table_schema = '_migrations' 
ORDER BY table_name;

-- Should return:
-- migration_dependencies
-- migration_errors
-- schema_migrations
```

- [ ] Paste verification query above into SQL Editor
- [ ] Click **"Run"**
- [ ] Verify 3 tables appear in results
- [ ] Document timestamp of completion

### Step 2: Execute Backfill Migration

**File:** `migrations/20251022_001_backfill_existing_migrations.sql`

**Actions:**

- [ ] Open file in text editor
- [ ] Copy ALL contents
- [ ] Go to: **Supabase Dashboard → SQL Editor**
- [ ] Clear existing query
- [ ] Paste migration contents
- [ ] Review SQL visually
- [ ] Click **"Run"** button
- [ ] Wait for execution
- [ ] Check for errors

**Expected Outcome:**
```
Success. No rows returned.
```

**Verification Query:**
```sql
-- Run this to verify migrations were backfilled
SELECT * FROM _migrations.v_applied_migrations;

-- Should return 8 rows:
-- 1. 20251022_000 - APPLIED
-- 2. 20251022_001 - APPLIED
-- 3. 20251001_005 - APPLIED
-- 4. 20251001_006 - APPLIED
-- 5. 20251014_001 - APPLIED
-- 6. 20251014_002 - APPLIED
-- 7. 20251014_003 - APPLIED
-- 8. 20251017_004 - APPLIED
```

- [ ] Paste verification query above
- [ ] Click **"Run"**
- [ ] Verify 8 rows appear
- [ ] Document timestamp

### Step 3: System Health Check

**Run all verification queries:**

```sql
-- Check 1: Migration statistics
SELECT * FROM _migrations.get_migration_stats();

-- Expected output:
-- total_migrations: 8
-- applied_migrations: 8
-- failed_migrations: 0
-- reverted_migrations: 0
-- current_batch: 4
-- last_applied: 2025-10-22 (today)
```

- [ ] Paste above query
- [ ] Click **"Run"**
- [ ] Verify all metrics correct

```sql
-- Check 2: View all migrations chronologically
SELECT * FROM _migrations.v_applied_migrations 
ORDER BY installed_on DESC;

-- Should show all 8 migrations with SUCCESS status
```

- [ ] Paste above query
- [ ] Click **"Run"**
- [ ] Verify all 8 visible with success=true

```sql
-- Check 3: Check for any errors
SELECT COUNT(*) FROM _migrations.migration_errors;

-- Should return: 0
```

- [ ] Paste above query
- [ ] Click **"Run"**
- [ ] Verify count = 0

### Step 4: Validate Functions Created

```sql
-- Check that utility functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = '_migrations' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Should include:
-- get_migration_stats
-- get_next_batch
```

- [ ] Paste above query
- [ ] Click **"Run"**
- [ ] Verify both functions listed

### Step 5: Test Migration Logging

```sql
-- Test logging procedure (just to verify it works)
CALL _migrations.log_migration_start(
  '20251022_TEST',
  'Test migration - can be safely deleted',
  99
);

-- Should succeed silently
```

- [ ] Paste above
- [ ] Click **"Run"**
- [ ] Should show "Success"

```sql
-- Verify test record was created
SELECT version, description, success 
FROM _migrations.schema_migrations 
WHERE version = '20251022_TEST';

-- Should show our test record
```

- [ ] Paste above
- [ ] Click **"Run"**
- [ ] Verify test record appears

```sql
-- Clean up test record
DELETE FROM _migrations.schema_migrations 
WHERE version = '20251022_TEST';

-- Should return: 1 row deleted
```

- [ ] Paste above
- [ ] Click **"Run"**
- [ ] Verify deletion

- [ ] Mark test as successful

---

## ✅ Post-Deployment Verification

### Application Health Check

- [ ] Backend application still running
- [ ] No errors in application logs
- [ ] Frontend still loads without errors
- [ ] Can still login successfully
- [ ] Can still query leads/tasks (normal operations work)

**Steps:**

1. Open browser → Your app URL
2. Try to login
3. Navigate to different pages
4. Check browser console (F12) for JavaScript errors
5. Watch backend logs (docker logs or terminal)

- [ ] All checks passed

### Team Notification

- [ ] Notify team: "Migration tracking system deployed successfully"
- [ ] Provide link to `MIGRATION_PROCEDURE.md` for reference
- [ ] Share example query: `SELECT * FROM _migrations.v_applied_migrations;`

---

## 📊 Success Criteria (Must All Pass ✅)

| Check | Expected | Result |
|-------|----------|--------|
| **Migration 20251022_000 execution** | Success, no errors | ✅ or ❌ |
| **Migration 20251022_001 execution** | Success, no errors | ✅ or ❌ |
| **_migrations schema exists** | 3 tables created | ✅ or ❌ |
| **8 migrations in tracking table** | All with success=true | ✅ or ❌ |
| **No migration errors** | Error count = 0 | ✅ or ❌ |
| **Functions created** | 2 functions callable | ✅ or ❌ |
| **Application still working** | No errors | ✅ or ❌ |

**All criteria MUST show ✅ before considering deployment successful.**

---

## 🔙 Rollback Procedure (If Needed)

**⚠️ Only execute if something goes wrong**

```sql
-- Option 1: Drop migration tracking system entirely
DROP SCHEMA IF EXISTS _migrations CASCADE;

-- This will remove:
-- - All tracking tables
-- - All views
-- - All functions
-- - All procedures
```

**Then:**
- Restore from backup if needed
- Retry in 1 hour
- Contact database administrator

---

## 📝 Deployment Log

**Fill in as you go:**

| Item | Status | Time | Notes |
|------|--------|------|-------|
| Backup verified | [ ] | __:__ | |
| Migration 20251022_000 executed | [ ] | __:__ | |
| Migration 20251022_001 executed | [ ] | __:__ | |
| Schema verification | [ ] | __:__ | |
| Health checks | [ ] | __:__ | |
| Team notified | [ ] | __:__ | |
| **DEPLOYMENT COMPLETE** | [ ] | __:__ | |

---

## 🆘 If Something Goes Wrong

### Problem: Migration Failed with Error

1. **Read the error message carefully**
2. **Don't panic** - no data was changed (read-only schema)
3. **Screenshot the error**
4. **Check:** `SELECT * FROM _migrations.migration_errors;`
5. **Contact:** Senior developer or database administrator

### Problem: Application Broke After Deployment

1. **Verify backend can connect to database:**
   ```bash
   # Check backend logs for Supabase connection errors
   ```

2. **If no database connection:**
   - Drop _migrations schema: `DROP SCHEMA _migrations CASCADE;`
   - Restart application
   - Try again

### Problem: Can't Execute Migration

1. **Verify permissions:** Admin access to Supabase
2. **Verify SQL syntax:** Copy-paste carefully
3. **Try again:** Sometimes SQL Editor needs refresh
4. **Clear cache:** Clear browser cache, retry

---

## 📞 Support Contacts

- **Database Issue:** [Database Administrator Name]
- **Application Issue:** [Backend Lead Name]
- **Deployment Question:** [DevOps/Senior Dev Name]

---

## ✨ After Successful Deployment

1. ✅ Create ticket/issue: "Migration tracking system deployed"
2. ✅ Add comment with verification query results
3. ✅ Share `MIGRATION_PROCEDURE.md` with team
4. ✅ Update project README with migration tracking note
5. ✅ Plan follow-up: Deploy validation triggers in Phase 2

---

**Important:** Ensure you have read and understood `MIGRATION_PROCEDURE.md` BEFORE executing these migrations.

**Questions?** Re-read the procedure document or ask for help.

🎯 **Goal:** Make database migrations systematic, trackable, and safe.

**Status:** Ready for deployment ✅

