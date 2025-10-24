# Super Admin Platform - Deployment Script

## Quick Deployment Guide

This guide provides step-by-step deployment instructions for the Super Admin Platform feature.

---

## Pre-Deployment Verification

### 1. Run Automated Tests

```bash
# Backend tests
cd backend
node test-super-admin.js

# Expected: All tests should pass
# If any fail, fix issues before proceeding
```

### 2. Manual Frontend Verification

Use the `FRONTEND_TESTING_CHECKLIST.md` to manually verify:
- [ ] Platform dashboard loads correctly
- [ ] Companies management works
- [ ] Impersonation functions properly
- [ ] Audit logs display correctly
- [ ] Authorization works (non-super admins blocked)

### 3. Check Environment Variables

**Backend `.env`**:
```bash
cd backend
cat .env | grep -E "SUPABASE|JWT|PORT|NODE_ENV"
```

Required variables:
```
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxx...
JWT_SECRET=your-secret-key
PORT=5000
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.com
```

**Frontend `.env`**:
```bash
cd frontend
cat .env | grep VITE_SUPABASE
```

Required variables:
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

---

## Deployment Steps

### Step 1: Database Migration (Supabase)

#### Option A: Via Supabase Dashboard (Recommended)

1. Open Supabase Dashboard
2. Navigate to SQL Editor
3. Create new query

**Migration 1: Audit Logs Table**

Copy from `SUPER_ADMIN_IMPLEMENTATION.md` Phase 1, Section 1.1:
```sql
-- Copy the entire create_audit_logs_table.sql content
BEGIN;

CREATE TABLE IF NOT EXISTS audit_logs (
  -- ... full table definition
);

-- ... indexes and policies

COMMIT;
```

Click "Run" → Verify no errors

**Migration 2: Platform Analytics Views**

Copy from `SUPER_ADMIN_IMPLEMENTATION.md` Phase 1, Section 1.2:
```sql
-- Copy the entire create_platform_analytics_views.sql content
BEGIN;

CREATE OR REPLACE VIEW platform_company_stats AS
-- ... full view definition

-- ... other views

COMMIT;
```

Click "Run" → Verify no errors

#### Option B: Via MCP Supabase Tools

If you have MCP Supabase tools configured:

```javascript
// Use mcp__supabase__apply_migration
// Migration name: create_audit_logs
// Migration name: create_platform_analytics_views
```

#### Verify Database Migration

Run in Supabase SQL Editor:

```sql
-- Verify audit_logs table exists
SELECT COUNT(*) FROM audit_logs;
-- Expected: 0 (empty table)

-- Verify views exist
SELECT * FROM platform_overview_stats;
-- Expected: 1 row with platform statistics

SELECT * FROM platform_company_stats LIMIT 5;
-- Expected: Up to 5 rows with company statistics

SELECT * FROM platform_recent_activity LIMIT 10;
-- Expected: Recent activity records
```

**✓ Checkpoint**: Database migration successful

---

### Step 2: Create First Super Admin

**⚠️ CRITICAL: Do this BEFORE deploying code**

```sql
-- Step 1: Find your user ID
SELECT id, email, raw_app_meta_data->>'role' as current_role
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Step 2: Copy the ID from results, then run:
BEGIN;

-- Update user profile (replace USER_ID)
UPDATE user_profiles
SET role = 'super_admin'
WHERE id = 'USER_ID_FROM_STEP_1';

-- Update auth metadata (replace USER_ID)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE id = 'USER_ID_FROM_STEP_1';

-- Verify changes
SELECT
  up.id,
  au.email,
  up.role as profile_role,
  au.raw_app_meta_data->>'role' as jwt_role
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.id = 'USER_ID_FROM_STEP_1';

-- If verification looks good, commit:
COMMIT;

-- If something is wrong, rollback:
-- ROLLBACK;
```

**Verification**:
- Profile role should be: `super_admin`
- JWT role should be: `super_admin`

**✓ Checkpoint**: Super admin user created

---

### Step 3: Deploy Backend

#### For Vercel Deployment

1. **Ensure platform routes are registered** in `backend/src/index.js`:
```javascript
const platformRoutes = require('./routes/platformRoutes');
app.use('/api/platform', platformRoutes);
```

2. **Verify middleware** in `backend/src/routes/platformRoutes.js`:
```javascript
router.use(authenticate);
router.use(authorize(['super_admin']));
```

3. **Deploy to Vercel**:
```bash
cd backend
vercel --prod

# Or if using GitHub integration:
git add .
git commit -m "feat: Add super admin platform backend"
git push origin main
# Vercel auto-deploys
```

4. **Set environment variables** in Vercel Dashboard:
   - SUPABASE_URL
   - SUPABASE_SERVICE_KEY
   - JWT_SECRET
   - NODE_ENV=production
   - FRONTEND_URL

#### For Other Hosting (Heroku, Railway, etc.)

```bash
cd backend

# Install production dependencies
npm install --production

# Set environment variables on platform
# Deploy using platform-specific command

# Examples:
# Heroku: git push heroku main
# Railway: railway up
# DigitalOcean: doctl apps create-deployment <app-id>
```

#### Verify Backend Deployment

```bash
# Test health endpoint
curl https://your-backend-url.com/health

# Test platform stats (should return 403 without auth)
curl https://your-backend-url.com/api/platform/stats

# Test with auth token (login first to get token)
curl https://your-backend-url.com/api/platform/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**✓ Checkpoint**: Backend deployed successfully

---

### Step 4: Deploy Frontend

#### Build Frontend

```bash
cd frontend
npm install
npm run build

# Verify build success
ls -la dist/
# Should see index.html, assets/, etc.
```

#### Deploy to Vercel

```bash
# Option 1: Vercel CLI
cd frontend
vercel --prod

# Option 2: GitHub Integration
git add .
git commit -m "feat: Add super admin platform frontend"
git push origin main
# Vercel auto-deploys
```

#### Configure Frontend Environment Variables

In Vercel Dashboard (or hosting platform):
```
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

#### Verify Frontend Deployment

1. Open browser: `https://your-frontend-url.com`
2. Login as super admin
3. Check sidebar for "Platform Admin" link
4. Click link
5. Verify platform dashboard loads

**✓ Checkpoint**: Frontend deployed successfully

---

### Step 5: Verify Super Admin Access

1. **Logout** if currently logged in
2. **Login** with super admin credentials
3. **Check localStorage** in browser console:
   ```javascript
   JSON.parse(localStorage.getItem('user'))
   // Should show: { ..., role: "super_admin" }
   ```
4. **Verify platform link** appears in sidebar
5. **Access platform** → should load without errors

**✓ Checkpoint**: Super admin access verified

---

### Step 6: Smoke Tests (Post-Deployment)

Run these critical path tests immediately:

#### Test 1: Platform Dashboard
- [ ] Navigate to `/platform`
- [ ] Verify statistics load
- [ ] Check recent activity displays

#### Test 2: Companies Management
- [ ] Navigate to `/platform/companies`
- [ ] Verify companies list loads
- [ ] Test search functionality
- [ ] Test status filter

#### Test 3: Company Details
- [ ] Click "View" on a company
- [ ] Verify details load
- [ ] Test status update
- [ ] Verify users list displays

#### Test 4: Impersonation
- [ ] Click "Impersonate" on a user
- [ ] Verify redirect and banner
- [ ] Check user context switched
- [ ] Test "End Impersonation"
- [ ] Verify context restored

#### Test 5: Audit Logs
- [ ] Navigate to `/platform/audit-logs`
- [ ] Verify logs display
- [ ] Test severity filter
- [ ] Test action filter

#### Test 6: Authorization
- [ ] Logout as super admin
- [ ] Login as non-super admin
- [ ] Verify platform link NOT visible
- [ ] Try to access `/platform` directly
- [ ] Verify blocked/redirected

**✓ Checkpoint**: All smoke tests passed

---

### Step 7: Monitor Deployment

#### Check Application Logs

**Vercel**:
```bash
vercel logs --follow
```

**Other Platforms**: Use platform-specific logging

Look for:
- [ ] No 500 errors
- [ ] No unhandled exceptions
- [ ] Platform routes responding
- [ ] Audit logs being created

#### Check Audit Logs

```sql
-- Recent audit logs (last hour)
SELECT * FROM audit_logs
WHERE created_at > NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- Any critical errors
SELECT * FROM audit_logs
WHERE severity = 'critical'
AND created_at > NOW() - INTERVAL '24 hours';
```

#### Monitor Performance

- [ ] Platform dashboard loads in <2s
- [ ] Companies list loads in <2s
- [ ] Company details load in <2s
- [ ] No memory leaks
- [ ] Database queries performant

**✓ Checkpoint**: Monitoring in place

---

## Post-Deployment Tasks

### 1. Update Documentation

- [ ] Document super admin credentials (securely)
- [ ] Update API documentation with platform endpoints
- [ ] Update user guide with platform features
- [ ] Document any deployment-specific configurations

### 2. Notify Stakeholders

Send notification with:
- Deployment completion time
- List of new features deployed
- Known limitations (if any)
- Support contact information

### 3. Schedule Follow-up Reviews

- [ ] Day 1: Check for any critical issues
- [ ] Day 3: Review audit logs and usage
- [ ] Week 1: Performance review
- [ ] Week 2: User feedback collection
- [ ] Month 1: Security audit

---

## Deployment Verification Checklist

Before marking deployment complete, verify:

### Functionality ✓
- [ ] Super admin can login
- [ ] Platform dashboard loads with correct data
- [ ] Companies CRUD operations work
- [ ] Company details display correctly
- [ ] Status updates work
- [ ] User search works
- [ ] Impersonation works end-to-end
- [ ] Audit logs display and filter correctly
- [ ] Recent activity displays

### Security ✓
- [ ] Only super admins can access platform
- [ ] Non-super admins blocked (403 Forbidden)
- [ ] Audit logs are immutable
- [ ] Impersonation is logged
- [ ] RLS policies enforced
- [ ] Rate limiting active

### Performance ✓
- [ ] Platform loads in <2 seconds
- [ ] Audit logs query in <1 second
- [ ] No memory leaks detected
- [ ] Database queries optimized

### Reliability ✓
- [ ] No 500 errors in logs
- [ ] Error handling working
- [ ] Loading states display correctly
- [ ] Empty states handle gracefully

---

## Rollback Plan (If Issues Occur)

### Quick Rollback (Frontend Only)

If frontend has issues but backend is stable:

```bash
# Revert frontend to previous deployment
git revert <commit-hash>
git push origin main

# Or in Vercel:
# Go to Deployments → Find previous working deployment → Promote to Production
```

### Full Rollback (Backend + Frontend)

If critical issues in both:

```bash
# Revert both deployments
git revert <commit-hash-platform-feature>
git push origin main

# Redeploy previous version
```

### Database Rollback (LAST RESORT)

**⚠️ WARNING: This will DELETE ALL AUDIT LOGS**

Only use if database corruption or critical security issue:

```sql
BEGIN;

-- Drop audit logs table
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

COMMIT;
```

### Feature Flag Disable

To disable without rollback:

**Backend** (`backend/src/routes/platformRoutes.js`):
```javascript
const PLATFORM_ENABLED = process.env.PLATFORM_ENABLED === 'true';

router.use((req, res, next) => {
  if (!PLATFORM_ENABLED) {
    return res.status(503).json({
      success: false,
      message: 'Platform temporarily disabled for maintenance'
    });
  }
  next();
});
```

**Frontend** (`.env`):
```bash
VITE_PLATFORM_ENABLED=false
```

Update sidebar to check this flag.

---

## Troubleshooting Common Issues

### Issue: Super admin can't access platform

**Solution**:
1. Check super admin role in database
2. Logout and login again (refresh JWT)
3. Verify token includes role claim
4. Check backend logs for authorization errors

### Issue: Audit logs not being created

**Solution**:
1. Check audit service initialization
2. Verify database permissions
3. Check RLS policies
4. Review backend logs for errors

### Issue: Platform views show no data

**Solution**:
1. Verify views exist in database
2. Check view permissions granted
3. Test views directly in SQL
4. Ensure companies/users exist in database

### Issue: Impersonation fails

**Solution**:
1. Check impersonation middleware registered
2. Verify header being sent
3. Check audit logs for attempts
4. Test with curl/Postman first

---

## Success Criteria

Deployment is successful when:

✅ **All smoke tests pass**
✅ **No critical errors in logs**
✅ **Super admin can access all platform features**
✅ **Audit logging working correctly**
✅ **Authorization properly enforced**
✅ **Performance meets requirements**
✅ **Rollback plan tested and ready**

---

## Deployment Completion

Once all verification passes:

- [ ] Mark deployment as complete in project management tool
- [ ] Send completion notification to stakeholders
- [ ] Update changelog with deployed features
- [ ] Close deployment ticket/issue
- [ ] Schedule post-deployment review meeting

**Deployed by**: _______________
**Date**: _______________
**Version**: _______________
**Deployment ID**: _______________

---

## Next Steps

After successful deployment:

1. **Monitor** for first 24 hours closely
2. **Collect feedback** from super admins
3. **Plan iterations** based on feedback
4. **Schedule** regular security audits
5. **Consider** future enhancements from Phase 10 of implementation guide

---

*Remember: The platform feature is additive and non-breaking. Main CRM functionality continues to work even if platform features have issues.*
