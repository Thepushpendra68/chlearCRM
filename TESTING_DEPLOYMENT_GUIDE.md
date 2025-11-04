# Super Admin Platform - Testing & Deployment Guide

## 📋 Table of Contents
1. [Backend Testing](#backend-testing)
2. [Frontend Testing](#frontend-testing)
3. [Security Testing](#security-testing)
4. [Pre-Deployment Checklist](#pre-deployment-checklist)
5. [Deployment Steps](#deployment-steps)
6. [Post-Deployment Verification](#post-deployment-verification)
7. [Rollback Procedures](#rollback-procedures)

---

## 1. Backend Testing

### Automated Testing Script
Run the automated backend test script:

```bash
cd backend
node test-super-admin.js
```

The script will test:
- ✅ Super admin authentication
- ✅ Platform statistics endpoint
- ✅ Companies management (list, search, filter)
- ✅ Company details and status updates
- ✅ User search across platform
- ✅ Audit logs retrieval and filtering
- ✅ Recent activity feed
- ✅ Authorization (non-super admin blocked)
- ✅ Impersonation functionality

### Manual Backend Verification

If automated tests fail, verify manually:

#### 1. Platform Routes Registration
```bash
# Check if platform routes are registered
curl http://localhost:5000/api/platform/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```
**Expected**: 200 OK with platform statistics OR 403 if not super admin

#### 2. Database Views
```sql
-- Verify platform views exist
SELECT * FROM platform_overview_stats;
SELECT * FROM platform_company_stats LIMIT 5;
SELECT * FROM platform_recent_activity LIMIT 10;
```

#### 3. Audit Logging
```sql
-- Check audit logs are being created
SELECT * FROM audit_logs
ORDER BY created_at DESC
LIMIT 10;
```

#### 4. Super Admin Role
```sql
-- Verify super admin user exists
SELECT id, email, raw_app_meta_data->>'role' as role
FROM auth.users
WHERE raw_app_meta_data->>'role' = 'super_admin';
```

---

## 2. Frontend Testing

### Manual Frontend Testing Checklist

#### Platform Access
- [ ] Login as super admin user
- [ ] Verify "Platform Admin" link appears in sidebar
- [ ] Click "Platform Admin" link
- [ ] Verify redirect to `/platform` route
- [ ] Confirm platform layout renders correctly

#### Platform Dashboard (`/platform`)
- [ ] Platform statistics display correctly
  - [ ] Total Companies shows correct count
  - [ ] Active Users shows correct count
  - [ ] Total Leads shows correct count
  - [ ] Active (30d) shows correct count
- [ ] Growth metrics display
  - [ ] New Companies (30d)
  - [ ] New Users (30d)
  - [ ] Leads Created (30d)
- [ ] Recent Activity feed shows data
- [ ] All cards render without errors

#### Companies Page (`/platform/companies`)
- [ ] Companies list loads successfully
- [ ] Search functionality works
  - [ ] Enter company name in search
  - [ ] Click "Search" button
  - [ ] Results filter correctly
- [ ] Status filter works
  - [ ] Select "Active" status
  - [ ] Results show only active companies
  - [ ] Try other statuses
- [ ] Pagination works (if >20 companies)
  - [ ] Navigate to next page
  - [ ] Navigate to previous page
  - [ ] Page numbers update correctly
- [ ] "View" button navigates to company details

#### Company Details (`/platform/companies/:id`)
- [ ] Company information displays
  - [ ] Company name and slug
  - [ ] Current status
  - [ ] Statistics (users, leads, activities)
- [ ] Users list shows correctly
  - [ ] User names display
  - [ ] User roles display
  - [ ] User avatars/icons render
- [ ] Status dropdown works
  - [ ] Change status to different value
  - [ ] Confirm success toast appears
  - [ ] Verify status updated in database
- [ ] "Back to Companies" link works
- [ ] Impersonate button functionality (next section)

#### Impersonation Feature
- [ ] Click "Impersonate" on a user
- [ ] Verify redirect to `/app/dashboard`
- [ ] Confirm impersonation banner appears
  - [ ] Shows warning icon
  - [ ] Displays impersonated user name and email
  - [ ] "End Impersonation" button visible
- [ ] Verify user context switched
  - [ ] Dashboard shows impersonated user's data
  - [ ] Sidebar reflects impersonated user's permissions
- [ ] Test "End Impersonation" button
  - [ ] Click "End Impersonation"
  - [ ] Confirm success toast
  - [ ] Verify banner disappears
  - [ ] Confirm context switched back to super admin

#### Audit Logs Page (`/platform/audit-logs`)
- [ ] Audit logs table loads
- [ ] Logs display with correct columns
  - [ ] Timestamp
  - [ ] Actor (email + role)
  - [ ] Action
  - [ ] Resource
  - [ ] Severity badge with correct color
- [ ] Severity filter works
  - [ ] Select "Warning"
  - [ ] Results filter correctly
  - [ ] Try other severity levels
- [ ] Action filter works
  - [ ] Enter action name
  - [ ] Results filter correctly
- [ ] Pagination works (if >50 logs)

#### Platform Sidebar Navigation
- [ ] All navigation links work
  - [ ] Overview → `/platform`
  - [ ] Companies → `/platform/companies`
  - [ ] Users → `/platform/users` (if implemented)
  - [ ] Analytics → `/platform/analytics` (if implemented)
  - [ ] Audit Logs → `/platform/audit-logs`
  - [ ] Activity → `/platform/activity` (if implemented)
- [ ] Active state highlights correctly
- [ ] Icons display properly

#### Authorization & Security (Frontend)
- [ ] Logout as super admin
- [ ] Login as non-super admin (company admin, manager, or sales rep)
- [ ] Verify "Platform Admin" link does NOT appear in sidebar
- [ ] Try to access `/platform` directly via URL
- [ ] Confirm redirect to `/app/dashboard`
- [ ] Verify no platform routes accessible

#### Responsive Design (Optional)
- [ ] Test on desktop (1920x1080)
- [ ] Test on tablet (768px width)
- [ ] Test on mobile (375px width)
- [ ] Verify layout adapts correctly

---

## 3. Security Testing

### Permission Verification

#### Backend Permission Tests
```bash
# Test 1: Super admin can access platform
curl http://localhost:5000/api/platform/stats \
  -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
# Expected: 200 OK

# Test 2: Company admin cannot access platform
curl http://localhost:5000/api/platform/stats \
  -H "Authorization: Bearer COMPANY_ADMIN_TOKEN"
# Expected: 403 Forbidden

# Test 3: Manager cannot access platform
curl http://localhost:5000/api/platform/stats \
  -H "Authorization: Bearer MANAGER_TOKEN"
# Expected: 403 Forbidden

# Test 4: Sales rep cannot access platform
curl http://localhost:5000/api/platform/stats \
  -H "Authorization: Bearer SALES_REP_TOKEN"
# Expected: 403 Forbidden
```

#### Frontend Permission Tests
- [ ] Super admin sees platform link
- [ ] Company admin does NOT see platform link
- [ ] Manager does NOT see platform link
- [ ] Sales rep does NOT see platform link
- [ ] Direct URL access blocked for non-super admins

### Data Isolation Tests

#### Row Level Security (RLS)
```sql
-- Test 1: Super admin can see all companies
-- Run as super admin user
SELECT COUNT(*) FROM companies;
-- Should see all companies

-- Test 2: Company admin can only see their company
-- Run as company admin user
SELECT COUNT(*) FROM companies;
-- Should see only 1 company (their own)
```

#### Impersonation Audit Trail
- [ ] Start impersonation
- [ ] Perform an action (e.g., view leads)
- [ ] Check audit logs
- [ ] Verify audit log shows:
  - [ ] `is_impersonation = true`
  - [ ] `impersonated_user_id` is set
  - [ ] `actor_id` is super admin
  - [ ] Action details are logged

### Rate Limiting Tests

#### Platform Rate Limits
```bash
# Test general platform rate limit (500 req/15min)
for i in {1..10}; do
  curl http://localhost:5000/api/platform/stats \
    -H "Authorization: Bearer SUPER_ADMIN_TOKEN"
done
# Should all succeed (well under limit)

# Test strict rate limit for status updates (50 req/15min)
# Would need to make 50+ requests to test - skip in manual testing
```

### Audit Log Immutability
```sql
-- Try to update audit log (should fail)
UPDATE audit_logs
SET action = 'modified_action'
WHERE id = (SELECT id FROM audit_logs LIMIT 1);
-- Expected: Permission denied (RLS policy blocks updates)

-- Try to delete audit log (should fail)
DELETE FROM audit_logs
WHERE id = (SELECT id FROM audit_logs LIMIT 1);
-- Expected: Permission denied (RLS policy blocks deletes)
```

---

## 4. Pre-Deployment Checklist

### Code Review
- [ ] All Phase 1-5 code implemented and tested
- [ ] No console.log or debug statements in production code
- [ ] Error handling implemented for all endpoints
- [ ] Input validation added to all forms
- [ ] SQL injection prevention verified (using parameterized queries)

### Environment Variables
- [ ] Backend `.env` has all required variables:
  ```
  SUPABASE_URL=your_url
  SUPABASE_SERVICE_KEY=your_key
  JWT_SECRET=your_secret
  PORT=5000
  NODE_ENV=production
  FRONTEND_URL=your_frontend_url
  ```
- [ ] Frontend `.env` has Supabase credentials:
  ```
  VITE_SUPABASE_URL=your_url
  VITE_SUPABASE_ANON_KEY=your_anon_key
  ```

### Database Prerequisites
- [ ] All migrations executed successfully:
  ```sql
  -- Verify audit_logs table exists
  \dt audit_logs

  -- Verify views exist
  \dv platform_*

  -- Check for errors
  SELECT * FROM audit_logs WHERE severity = 'critical';
  ```

- [ ] First super admin created:
  ```sql
  -- Verify super admin exists
  SELECT id, email, raw_app_meta_data->>'role'
  FROM auth.users
  WHERE raw_app_meta_data->>'role' = 'super_admin';
  ```

- [ ] RLS policies active:
  ```sql
  -- Check RLS enabled
  SELECT tablename, rowsecurity
  FROM pg_tables
  WHERE schemaname = 'public'
  AND tablename IN ('audit_logs', 'companies', 'user_profiles');
  ```

### Staging Environment Testing
- [ ] Deploy to staging environment
- [ ] Run all tests in staging
- [ ] Verify super admin access in staging
- [ ] Test impersonation in staging
- [ ] Verify audit logs in staging
- [ ] Performance test with realistic data volume

### Documentation
- [ ] Update API documentation with platform endpoints
- [ ] Document super admin creation process
- [ ] Document rollback procedures
- [ ] Update user guide with platform features

---

## 5. Deployment Steps

### Step 1: Database Migration

#### Option A: Via Supabase SQL Editor
1. Open Supabase Dashboard → SQL Editor
2. Create new query
3. Paste `create_audit_logs_table.sql`
4. Click "Run"
5. Verify success (no errors)
6. Create another query
7. Paste `create_platform_analytics_views.sql`
8. Click "Run"
9. Verify success

#### Option B: Via MCP Supabase Tools
```bash
# If you have MCP Supabase tools configured
# Apply migration for audit_logs table
# Apply migration for analytics views
```

#### Verification
```sql
-- Verify audit_logs table
SELECT COUNT(*) FROM audit_logs;

-- Verify views
SELECT * FROM platform_overview_stats;
SELECT * FROM platform_company_stats LIMIT 1;
SELECT * FROM platform_recent_activity LIMIT 1;
```

### Step 2: Backend Deployment

#### Local Deployment (Development)
```bash
cd backend
npm install
npm run dev
```

#### Production Deployment (Vercel/Heroku/etc.)
```bash
# Build backend
cd backend
npm install --production

# Set environment variables in hosting platform
# Deploy using platform-specific commands

# Verify deployment
curl https://your-backend-url.com/api/platform/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Verification
- [ ] Backend server starts without errors
- [ ] Platform routes registered (`/api/platform/*`)
- [ ] Health check endpoint responds
- [ ] Database connection successful
- [ ] Audit service initializes

### Step 3: Frontend Deployment

#### Build Frontend
```bash
cd frontend
npm install
npm run build
```

#### Deploy to Vercel
```bash
# If using Vercel CLI
vercel --prod

# Or connect GitHub repo to Vercel dashboard
# Vercel will auto-deploy on push to main branch
```

#### Verification
- [ ] Frontend builds without errors
- [ ] Platform routes included in build
- [ ] Environment variables set correctly
- [ ] Static assets deployed
- [ ] Routing works (refresh on `/platform` doesn't 404)

### Step 4: Create First Super Admin

**⚠️ CRITICAL: Do this immediately after deployment**

```sql
-- Step 1: Find your user ID
SELECT id, email, raw_app_meta_data->>'role' as current_role
FROM auth.users
WHERE email = 'your-admin@email.com';

-- Step 2: Update to super_admin (replace USER_ID)
BEGIN;

UPDATE user_profiles
SET role = 'super_admin'
WHERE id = 'USER_ID_HERE';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE id = 'USER_ID_HERE';

-- Verify
SELECT
  up.id,
  au.email,
  up.role as profile_role,
  au.raw_app_meta_data->>'role' as jwt_role
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.id = 'USER_ID_HERE';

COMMIT;
```

#### Verify Super Admin Access
1. Logout from application
2. Login with super admin credentials
3. Check user object in browser console:
   ```javascript
   console.log(localStorage.getItem('user'));
   // Should show: { ..., role: "super_admin" }
   ```
4. Verify "Platform Admin" link appears in sidebar
5. Click link and access platform dashboard

### Step 5: Smoke Tests (Post-Deployment)

Run these tests immediately after deployment:

#### Critical Path Tests
1. **Login as super admin** ✓
2. **Access platform dashboard** ✓
3. **View companies list** ✓
4. **Open company details** ✓
5. **Check audit logs** ✓
6. **Test impersonation** ✓
7. **End impersonation** ✓

#### Quick Verification Script
```bash
# Run automated tests against production
BASE_URL=https://your-production-url.com npm run test:platform
```

---

## 6. Post-Deployment Verification

### Application Logs
- [ ] Check application error logs (first 1 hour)
- [ ] Monitor API response times
- [ ] Verify no 500 errors on platform routes
- [ ] Check for authentication failures

### Audit Log Monitoring
```sql
-- Check recent audit logs
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Check for any critical severity logs
SELECT * FROM audit_logs
WHERE severity = 'critical'
AND created_at > NOW() - INTERVAL '24 hours';

-- Verify impersonation logs
SELECT * FROM audit_logs
WHERE is_impersonation = true
ORDER BY created_at DESC
LIMIT 10;
```

### Performance Checks
- [ ] Platform dashboard loads in <2 seconds
- [ ] Companies list pagination works smoothly
- [ ] Audit logs query performance acceptable
- [ ] No memory leaks in backend
- [ ] Database connection pool stable

### User Acceptance Testing
- [ ] Super admin can perform all functions
- [ ] Impersonation works correctly
- [ ] Audit trail is complete
- [ ] No UI bugs or broken links
- [ ] Mobile responsiveness (if applicable)

---

## 7. Rollback Procedures

### When to Rollback
Rollback if you encounter:
- ❌ Critical security vulnerability discovered
- ❌ Data corruption or loss
- ❌ Platform completely inaccessible
- ❌ Super admin cannot login
- ❌ Audit logging fails completely
- ❌ Impersonation causes data leaks

### Rollback Option 1: Frontend Only (Quick)

**Use when**: Frontend has issues but backend is stable

```bash
# Revert frontend deployment
git checkout main
cd frontend
npm run build
vercel --prod  # Or your deployment command

# Platform routes won't be accessible
# Main app continues working normally
```

**Impact**:
- ✅ Main CRM app works normally
- ❌ Platform admin temporarily unavailable
- ✅ No data loss
- ✅ No database changes needed

### Rollback Option 2: Full Rollback (Backend + Frontend)

**Use when**: Both frontend and backend have critical issues

```bash
# Revert backend
git revert <commit-hash-of-platform-feature>
cd backend
npm install
npm run start  # Or deployment command

# Revert frontend
cd frontend
npm install
npm run build
vercel --prod  # Or deployment command
```

**Impact**:
- ✅ Returns to previous stable state
- ✅ Database changes are safe (additive only)
- ✅ Audit logs remain for compliance
- ❌ Platform features unavailable

### Rollback Option 3: Disable Platform (Feature Flag)

**Use when**: Want to keep code but disable access

#### Backend Disable
Edit `backend/src/routes/platformRoutes.js`:

```javascript
const PLATFORM_ENABLED = process.env.PLATFORM_ENABLED === 'true';

router.use((req, res, next) => {
  if (!PLATFORM_ENABLED) {
    return res.status(503).json({
      success: false,
      message: 'Platform admin is temporarily disabled for maintenance'
    });
  }
  next();
});
```

Set environment variable:
```bash
PLATFORM_ENABLED=false
```

#### Frontend Disable
Edit `frontend/src/components/Layout/Sidebar.jsx`:

```javascript
const PLATFORM_ENABLED = import.meta.env.VITE_PLATFORM_ENABLED === 'true';

// In utilityNavigation
...(user?.role === 'super_admin' && PLATFORM_ENABLED ? [{ ... }] : [])
```

Set environment variable:
```bash
VITE_PLATFORM_ENABLED=false
```

**Impact**:
- ✅ Code remains in place
- ✅ Can be re-enabled quickly
- ✅ No data loss
- ❌ Platform temporarily unavailable

### Rollback Option 4: Database Rollback (LAST RESORT)

**⚠️ WARNING: Only if absolutely necessary - will lose audit history**

```sql
BEGIN;

-- Drop audit logs table (WILL LOSE AUDIT HISTORY!)
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Drop views
DROP VIEW IF EXISTS platform_company_stats CASCADE;
DROP VIEW IF EXISTS platform_overview_stats CASCADE;
DROP VIEW IF EXISTS platform_recent_activity CASCADE;

-- Revert super admin to company admin
UPDATE user_profiles
SET role = 'company_admin'
WHERE role = 'super_admin';

UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "company_admin"}'::jsonb
WHERE raw_app_meta_data->>'role' = 'super_admin';

-- Verify
SELECT * FROM user_profiles WHERE role = 'super_admin';
-- Should return 0 rows

COMMIT;
```

**Impact**:
- ❌ **LOSES ALL AUDIT LOGS**
- ❌ Removes super admin role from all users
- ✅ Returns database to pre-migration state
- ⚠️ Cannot be undone

### Post-Rollback Steps

1. **Notify stakeholders** of rollback
2. **Document the issue** that caused rollback
3. **Fix the root cause** in development
4. **Test thoroughly** in staging
5. **Plan re-deployment** with fixes
6. **Update rollback procedures** if needed

---

## 8. Monitoring & Maintenance

### Daily Monitoring (First Week)
- [ ] Check audit logs for anomalies
- [ ] Monitor error rates in platform routes
- [ ] Verify super admin access working
- [ ] Check impersonation usage
- [ ] Review performance metrics

### Weekly Monitoring (Ongoing)
- [ ] Review audit log trends
- [ ] Check for unauthorized access attempts
- [ ] Verify data integrity
- [ ] Monitor database query performance
- [ ] Review and archive old audit logs (if needed)

### Monthly Reviews
- [ ] Security audit of platform access
- [ ] Review super admin actions
- [ ] Update documentation
- [ ] Performance optimization review
- [ ] Plan future enhancements

---

## 9. Troubleshooting Guide

### Issue: Super admin cannot access platform
**Symptoms**: 403 Forbidden on platform routes

**Solutions**:
1. Verify super admin role in database:
   ```sql
   SELECT id, email, raw_app_meta_data->>'role'
   FROM auth.users
   WHERE email = 'admin@example.com';
   ```
2. Check JWT token includes role:
   ```javascript
   // In browser console
   const token = localStorage.getItem('token');
   console.log(JSON.parse(atob(token.split('.')[1])));
   ```
3. Logout and login again to refresh token

### Issue: Audit logs not being created
**Symptoms**: Empty audit logs table

**Solutions**:
1. Check audit service initialization:
   ```bash
   # In backend logs
   grep "AUDIT" logs/*.log
   ```
2. Verify database permissions:
   ```sql
   SELECT * FROM audit_logs LIMIT 1;
   -- Should not error
   ```
3. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies
   WHERE tablename = 'audit_logs';
   ```

### Issue: Impersonation not working
**Symptoms**: Context doesn't switch when impersonating

**Solutions**:
1. Check impersonation middleware registered
2. Verify header sent: `x-impersonate-user-id`
3. Check audit logs for impersonation attempts
4. Test with curl:
   ```bash
   curl http://localhost:5000/api/leads \
     -H "Authorization: Bearer TOKEN" \
     -H "x-impersonate-user-id: USER_ID"
   ```

### Issue: Platform views returning empty data
**Symptoms**: Dashboard shows all zeros

**Solutions**:
1. Verify views exist:
   ```sql
   \dv platform_*
   ```
2. Check view permissions:
   ```sql
   GRANT SELECT ON platform_overview_stats TO authenticated;
   ```
3. Test views directly:
   ```sql
   SELECT * FROM platform_company_stats;
   ```

---

## 10. Success Criteria

Deployment is successful when:

✅ **Functionality**
- [ ] Super admin can login and access platform
- [ ] All CRUD operations work on companies
- [ ] Audit logs capture all actions
- [ ] Impersonation works correctly
- [ ] Platform dashboard shows accurate data

✅ **Security**
- [ ] Only super admins can access platform
- [ ] Non-super admins blocked (403 Forbidden)
- [ ] Audit logs are immutable
- [ ] Impersonation is logged
- [ ] RLS policies enforced

✅ **Performance**
- [ ] Platform loads in <2 seconds
- [ ] Audit logs query in <1 second
- [ ] Companies list paginates smoothly
- [ ] No memory leaks detected

✅ **Reliability**
- [ ] No 500 errors in logs
- [ ] Error handling working
- [ ] Rollback procedures tested
- [ ] Backup procedures in place

---

## Need Help?

1. **Check logs**: Backend logs, frontend console, database logs
2. **Review audit logs**: `SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 100`
3. **Test in staging**: Always test fixes in staging first
4. **Rollback if needed**: Use appropriate rollback option
5. **Document issues**: Update this guide with solutions

---

*Remember: All changes are additive and non-breaking. The main application continues to work even if platform features have issues.*
