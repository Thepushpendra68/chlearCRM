-- =====================================================
-- SUPER ADMIN PLATFORM - ROLLBACK SCRIPT
-- =====================================================
-- ⚠️ WARNING: Use this script only as a LAST RESORT
-- This will completely remove all super admin platform features
-- and DELETE ALL AUDIT LOGS (cannot be recovered)
-- =====================================================

-- Before running this script:
-- 1. Create a backup of audit_logs table
-- 2. Export any critical audit data
-- 3. Notify all stakeholders
-- 4. Get approval from management
-- 5. Document the reason for rollback

-- =====================================================
-- STEP 0: BACKUP (CRITICAL)
-- =====================================================
-- Create backup of audit logs before deletion

-- Option 1: Export to CSV (via Supabase dashboard)
-- Go to: Database → Tables → audit_logs → Export as CSV

-- Option 2: Create backup table
CREATE TABLE IF NOT EXISTS audit_logs_backup_[DATE] AS
SELECT * FROM audit_logs;

-- Verify backup created
SELECT COUNT(*) FROM audit_logs_backup_[DATE];
-- Should match count from audit_logs

-- =====================================================
-- STEP 1: REMOVE SUPER ADMIN ROLE FROM USERS
-- =====================================================

BEGIN;

-- List all super admins (for records)
SELECT
  id,
  email,
  raw_app_meta_data->>'role' as current_role,
  created_at
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'super_admin';

-- Update user_profiles: super_admin → company_admin
UPDATE user_profiles
SET
  role = 'company_admin',
  updated_at = NOW()
WHERE role = 'super_admin';

-- Log how many users were affected
DO $$
DECLARE
  affected_count INTEGER;
BEGIN
  GET DIAGNOSTICS affected_count = ROW_COUNT;
  RAISE NOTICE 'Updated % user profiles from super_admin to company_admin', affected_count;
END $$;

-- Update auth.users metadata
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "company_admin"}'::jsonb
WHERE raw_app_meta_data->>'role' = 'super_admin';

-- Verify no super admins remain
SELECT COUNT(*) as remaining_super_admins
FROM user_profiles
WHERE role = 'super_admin';
-- Expected: 0

SELECT COUNT(*) as remaining_super_admins_auth
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'super_admin';
-- Expected: 0

COMMIT;

-- =====================================================
-- STEP 2: DROP PLATFORM ANALYTICS VIEWS
-- =====================================================

BEGIN;

-- Drop platform analytics views (order matters due to dependencies)
DROP VIEW IF EXISTS platform_recent_activity CASCADE;
DROP VIEW IF EXISTS platform_company_stats CASCADE;
DROP VIEW IF EXISTS platform_overview_stats CASCADE;

-- Verify views removed
SELECT COUNT(*) as remaining_platform_views
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'platform_%';
-- Expected: 0

COMMIT;

-- =====================================================
-- STEP 3: DROP AUDIT LOGS TABLE
-- =====================================================
-- ⚠️ THIS WILL DELETE ALL AUDIT HISTORY PERMANENTLY

BEGIN;

-- Count logs before deletion (for records)
SELECT COUNT(*) as total_audit_logs
FROM audit_logs;

-- Drop the table and all dependencies
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Verify table removed
SELECT COUNT(*) as audit_logs_table_exists
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'audit_logs';
-- Expected: 0

COMMIT;

-- =====================================================
-- STEP 4: REVOKE PERMISSIONS (if needed)
-- =====================================================

BEGIN;

-- Revoke any granted permissions related to platform
-- (Usually not needed if table/views are dropped)
REVOKE ALL ON SCHEMA public FROM authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- Re-grant necessary permissions for main app
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

COMMIT;

-- =====================================================
-- STEP 5: VERIFICATION
-- =====================================================

-- Verify complete rollback
SELECT
  'Super Admin Users' as check_type,
  COUNT(*) as count
FROM user_profiles
WHERE role = 'super_admin'

UNION ALL

SELECT
  'Platform Views' as check_type,
  COUNT(*) as count
FROM information_schema.views
WHERE table_schema = 'public'
AND table_name LIKE 'platform_%'

UNION ALL

SELECT
  'Audit Logs Table' as check_type,
  COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'audit_logs';

-- All counts should be 0

-- =====================================================
-- STEP 6: POST-ROLLBACK ACTIONS
-- =====================================================

-- After running this rollback script:

-- 1. BACKEND: Remove or disable platform routes
--    - Comment out: app.use('/api/platform', platformRoutes);
--    - Or set PLATFORM_ENABLED=false in environment

-- 2. FRONTEND: Remove or disable platform UI
--    - Remove Platform Admin link from sidebar
--    - Set VITE_PLATFORM_ENABLED=false
--    - Redeploy frontend

-- 3. REDEPLOY: Deploy both backend and frontend changes
--    - git revert [commit-hash] or manual changes
--    - Deploy to production

-- 4. NOTIFY: Inform all stakeholders
--    - Platform admin features removed
--    - No super admin access
--    - Reason for rollback
--    - Expected restoration timeline

-- 5. DOCUMENT: Record rollback details
--    - Date/time of rollback
--    - Reason for rollback
--    - Who authorized rollback
--    - Backup location of audit logs
--    - Issues encountered
--    - Lessons learned

-- =====================================================
-- ROLLBACK COMPLETE
-- =====================================================

-- Post-rollback verification checklist:
-- □ Backup of audit_logs saved and verified
-- □ All super_admin roles reverted to company_admin
-- □ Platform views dropped
-- □ Audit logs table dropped
-- □ Backend platform routes disabled/removed
-- □ Frontend platform UI disabled/removed
-- □ Main CRM functionality tested and working
-- □ Stakeholders notified
-- □ Rollback documented

-- =====================================================
-- NOTES FOR FUTURE RE-DEPLOYMENT
-- =====================================================

-- If you want to re-deploy the platform feature later:

-- 1. Run migrations again:
--    - create_audit_logs_table.sql
--    - create_platform_analytics_views.sql

-- 2. Create super admin user(s):
--    - Run super admin creation SQL

-- 3. Deploy code:
--    - Backend with platform routes
--    - Frontend with platform UI

-- 4. Restore audit logs from backup (optional):
--    INSERT INTO audit_logs
--    SELECT * FROM audit_logs_backup_[DATE];

-- =====================================================
-- END OF ROLLBACK SCRIPT
-- =====================================================
