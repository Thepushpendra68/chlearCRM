# Super Admin Platform Implementation Guide

**Sakha CRM - World-Class Platform Administration**

> **Approach:** Hybrid (Option C) - Unified application with dedicated platform routes
> **Timeline:** 9 days for complete implementation
> **Breaking Changes:** None - All changes are additive
> **Rollback:** Full rollback procedures included

---

## Table of Contents

1. [Prerequisites & Setup](#1-prerequisites--setup)
2. [Phase 1: Database Foundation](#phase-1-database-foundation)
3. [Phase 2: Backend Infrastructure](#phase-2-backend-infrastructure)
4. [Phase 3: Frontend Platform UI](#phase-3-frontend-platform-ui)
5. [Phase 4: Advanced Features](#phase-4-advanced-features)
6. [Phase 5: Security & Audit](#phase-5-security--audit)
7. [Testing Strategy](#testing-strategy)
8. [Deployment Checklist](#deployment-checklist)
9. [Rollback Procedures](#rollback-procedures)

---

## 1. Prerequisites & Setup

### 1.1 Create First Super Admin

**⚠️ IMPORTANT:** Do this first before any code changes.

**Option A: Via Supabase SQL Editor** (Recommended)

```sql
-- Step 1: Find your company admin user ID
SELECT id, email, raw_app_meta_data->>'role' as current_role
FROM auth.users
WHERE email = 'your-admin@email.com';  -- Replace with your email

-- Step 2: Update to super_admin (replace USER_ID with actual UUID)
BEGIN;

-- Update user profile
UPDATE user_profiles
SET role = 'super_admin'
WHERE id = 'USER_ID_HERE';

-- Update auth metadata (for JWT claims)
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super_admin"}'::jsonb
WHERE id = 'USER_ID_HERE';

-- Verify changes
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

**Option B: Via MCP Supabase Tools** (If available)

```bash
# Use the Supabase MCP tool to execute the SQL
# Check if you have access to mcp__supabase__execute_sql
```

### 1.2 Verify Super Admin Access

1. **Logout** from your current session
2. **Login** again with the same credentials
3. **Check** the user object in browser console:
   ```javascript
   // Open browser console on /app/dashboard
   console.log(localStorage.getItem('user')); // Should show role: "super_admin"
   ```

### 1.3 Environment Setup Checklist

- [ ] Supabase project is accessible
- [ ] Backend .env has all required variables
- [ ] Frontend .env has Supabase credentials
- [ ] First super admin user created and verified
- [ ] Git branch created for this feature: `git checkout -b feature/super-admin-platform`

---

## Phase 1: Database Foundation

**Timeline:** Day 1
**Files to Create:** 2 SQL migration files

### 1.1 Create Audit Logs Table

**File:** `create_audit_logs_table.sql`

```sql
-- =====================================================
-- AUDIT LOGS TABLE FOR PLATFORM ADMINISTRATION
-- =====================================================

BEGIN;

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who performed the action
  actor_id UUID REFERENCES user_profiles(id),
  actor_email TEXT NOT NULL,
  actor_role user_role NOT NULL,

  -- What action was performed
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,

  -- Additional context
  details JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',

  -- Request context
  ip_address TEXT,
  user_agent TEXT,

  -- Impersonation tracking
  is_impersonation BOOLEAN DEFAULT false,
  impersonated_user_id UUID,

  -- Severity for filtering
  severity TEXT DEFAULT 'info', -- info, warning, critical

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_impersonation ON audit_logs(is_impersonation);

-- RLS Policies - Only super admins can view audit logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_policy" ON audit_logs
  FOR SELECT TO authenticated
  USING (public.get_user_role() = 'super_admin');

CREATE POLICY "audit_logs_insert_policy" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true); -- Anyone can create audit logs

-- No update or delete - audit logs are immutable
CREATE POLICY "audit_logs_no_update" ON audit_logs
  FOR UPDATE TO authenticated
  USING (false);

CREATE POLICY "audit_logs_no_delete" ON audit_logs
  FOR DELETE TO authenticated
  USING (false);

COMMIT;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Run this to verify table creation:
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'audit_logs'
ORDER BY ordinal_position;
```

### 1.2 Create Platform Analytics Views

**File:** `create_platform_analytics_views.sql`

```sql
-- =====================================================
-- PLATFORM ANALYTICS VIEWS
-- =====================================================

BEGIN;

-- Company statistics view
CREATE OR REPLACE VIEW platform_company_stats AS
SELECT
  c.id as company_id,
  c.name as company_name,
  c.company_slug,
  c.status,
  c.plan,
  c.created_at,

  -- User counts
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT CASE WHEN up.is_active = true THEN up.id END) as active_users,
  COUNT(DISTINCT CASE WHEN up.role = 'company_admin' THEN up.id END) as admin_count,
  COUNT(DISTINCT CASE WHEN up.role = 'manager' THEN up.id END) as manager_count,
  COUNT(DISTINCT CASE WHEN up.role = 'sales_rep' THEN up.id END) as sales_rep_count,

  -- Lead counts
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.status = 'new' THEN l.id END) as new_leads,
  COUNT(DISTINCT CASE WHEN l.created_at > NOW() - INTERVAL '30 days' THEN l.id END) as leads_30d,

  -- Activity counts
  COUNT(DISTINCT a.id) as total_activities,
  COUNT(DISTINCT CASE WHEN a.created_at > NOW() - INTERVAL '30 days' THEN a.id END) as activities_30d,

  -- Last activity
  MAX(up.last_login_at) as last_user_login,
  MAX(l.created_at) as last_lead_created,
  MAX(a.created_at) as last_activity_created

FROM companies c
LEFT JOIN user_profiles up ON up.company_id = c.id
LEFT JOIN leads l ON l.company_id = c.id
LEFT JOIN activities a ON a.company_id = c.id

GROUP BY c.id, c.name, c.company_slug, c.status, c.plan, c.created_at;

-- Platform-wide statistics view
CREATE OR REPLACE VIEW platform_overview_stats AS
SELECT
  -- Company stats
  COUNT(DISTINCT c.id) as total_companies,
  COUNT(DISTINCT CASE WHEN c.status = 'active' THEN c.id END) as active_companies,
  COUNT(DISTINCT CASE WHEN c.status = 'trial' THEN c.id END) as trial_companies,

  -- User stats
  COUNT(DISTINCT up.id) as total_users,
  COUNT(DISTINCT CASE WHEN up.is_active = true THEN up.id END) as active_users,
  COUNT(DISTINCT CASE WHEN up.last_login_at > NOW() - INTERVAL '30 days' THEN up.id END) as active_users_30d,

  -- Lead stats
  COUNT(DISTINCT l.id) as total_leads,
  COUNT(DISTINCT CASE WHEN l.created_at > NOW() - INTERVAL '30 days' THEN l.id END) as leads_created_30d,

  -- Activity stats
  COUNT(DISTINCT a.id) as total_activities,
  COUNT(DISTINCT CASE WHEN a.created_at > NOW() - INTERVAL '7 days' THEN a.id END) as activities_7d,

  -- Growth metrics
  COUNT(DISTINCT CASE WHEN c.created_at > NOW() - INTERVAL '30 days' THEN c.id END) as new_companies_30d,
  COUNT(DISTINCT CASE WHEN up.created_at > NOW() - INTERVAL '30 days' THEN up.id END) as new_users_30d

FROM companies c
LEFT JOIN user_profiles up ON up.company_id = c.id
LEFT JOIN leads l ON l.company_id = c.id
LEFT JOIN activities a ON a.company_id = c.id;

-- Recent activity view (for platform dashboard)
CREATE OR REPLACE VIEW platform_recent_activity AS
SELECT
  'company_created' as activity_type,
  c.id as resource_id,
  c.name as resource_name,
  NULL as user_email,
  c.created_at as timestamp
FROM companies c
WHERE c.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'user_created' as activity_type,
  up.id as resource_id,
  up.first_name || ' ' || up.last_name as resource_name,
  au.email as user_email,
  up.created_at as timestamp
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.created_at > NOW() - INTERVAL '7 days'

UNION ALL

SELECT
  'lead_created' as activity_type,
  l.id as resource_id,
  l.name as resource_name,
  NULL as user_email,
  l.created_at as timestamp
FROM leads l
WHERE l.created_at > NOW() - INTERVAL '7 days'

ORDER BY timestamp DESC
LIMIT 50;

COMMIT;

-- Grant access to super admins only
GRANT SELECT ON platform_company_stats TO authenticated;
GRANT SELECT ON platform_overview_stats TO authenticated;
GRANT SELECT ON platform_recent_activity TO authenticated;
```

### 1.3 Execute Migrations

**Via Supabase SQL Editor:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste `create_audit_logs_table.sql`
3. Click "Run"
4. Verify success, then run `create_platform_analytics_views.sql`

**Via MCP Supabase (if available):**
```javascript
// Use mcp__supabase__apply_migration tool
```

---

## Phase 2: Backend Infrastructure

**Timeline:** Days 2-3
**Files to Create:** 8 new files, 3 modifications

### 2.1 Create Audit Service

**File:** `backend/src/services/auditService.js`

```javascript
const { supabaseAdmin } = require('../config/supabase');

/**
 * Audit Service for Platform Administration
 * Logs all critical actions for compliance and security
 */
class AuditService {
  /**
   * Log an audit event
   * @param {Object} params - Audit event parameters
   */
  async logEvent({
    actorId,
    actorEmail,
    actorRole,
    action,
    resourceType,
    resourceId = null,
    details = {},
    metadata = {},
    ipAddress = null,
    userAgent = null,
    isImpersonation = false,
    impersonatedUserId = null,
    severity = 'info'
  }) {
    try {
      const { error } = await supabaseAdmin
        .from('audit_logs')
        .insert({
          actor_id: actorId,
          actor_email: actorEmail,
          actor_role: actorRole,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          details,
          metadata,
          ip_address: ipAddress,
          user_agent: userAgent,
          is_impersonation: isImpersonation,
          impersonated_user_id: impersonatedUserId,
          severity,
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error('[AUDIT] Failed to log event:', error);
        // Don't throw - audit logging should not break the main flow
      }
    } catch (error) {
      console.error('[AUDIT] Exception while logging:', error);
    }
  }

  /**
   * Get audit logs with filtering
   */
  async getLogs({
    page = 1,
    limit = 50,
    actorId = null,
    action = null,
    resourceType = null,
    severity = null,
    startDate = null,
    endDate = null
  }) {
    let query = supabaseAdmin
      .from('audit_logs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    if (actorId) query = query.eq('actor_id', actorId);
    if (action) query = query.eq('action', action);
    if (resourceType) query = query.eq('resource_type', resourceType);
    if (severity) query = query.eq('severity', severity);
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      logs: data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get recent platform activity
   */
  async getRecentActivity(limit = 20) {
    const { data, error } = await supabaseAdmin
      .from('platform_recent_activity')
      .select('*')
      .limit(limit);

    if (error) throw error;
    return data;
  }
}

module.exports = new AuditService();
```

### 2.2 Create Platform Service

**File:** `backend/src/services/platformService.js`

```javascript
const { supabaseAdmin } = require('../config/supabase');
const ApiError = require('../utils/ApiError');

/**
 * Platform Service for Super Admin Operations
 */
class PlatformService {
  /**
   * Get all companies with statistics
   */
  async getCompanies({ page = 1, limit = 20, search = '', status = null }) {
    let query = supabaseAdmin
      .from('platform_company_stats')
      .select('*', { count: 'exact' });

    // Search filter
    if (search) {
      query = query.or(`company_name.ilike.%${search}%,company_slug.ilike.%${search}%`);
    }

    // Status filter
    if (status) {
      query = query.eq('status', status);
    }

    // Pagination
    const offset = (page - 1) * limit;
    query = query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching companies:', error);
      throw new ApiError('Failed to fetch companies', 500);
    }

    return {
      companies: data,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil(count / limit)
      }
    };
  }

  /**
   * Get platform overview statistics
   */
  async getPlatformStats() {
    const { data, error } = await supabaseAdmin
      .from('platform_overview_stats')
      .select('*')
      .single();

    if (error) {
      console.error('Error fetching platform stats:', error);
      throw new ApiError('Failed to fetch platform statistics', 500);
    }

    return data;
  }

  /**
   * Get company details with full information
   */
  async getCompanyDetails(companyId) {
    // Get company info
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();

    if (companyError || !company) {
      throw new ApiError('Company not found', 404);
    }

    // Get users
    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, role, is_active, created_at')
      .eq('company_id', companyId);

    // Get stats
    const { data: stats } = await supabaseAdmin
      .from('platform_company_stats')
      .select('*')
      .eq('company_id', companyId)
      .single();

    return {
      company,
      users: users || [],
      stats: stats || {}
    };
  }

  /**
   * Suspend/Activate company
   */
  async updateCompanyStatus(companyId, status, reason = null) {
    const validStatuses = ['active', 'suspended', 'trial', 'cancelled'];

    if (!validStatuses.includes(status)) {
      throw new ApiError('Invalid status', 400);
    }

    const { data, error } = await supabaseAdmin
      .from('companies')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', companyId)
      .select()
      .single();

    if (error) {
      console.error('Error updating company status:', error);
      throw new ApiError('Failed to update company status', 500);
    }

    return data;
  }

  /**
   * Get all users across platform (for super admin search)
   */
  async searchUsers({ search = '', companyId = null, role = null, limit = 20 }) {
    let query = supabaseAdmin
      .from('user_profiles')
      .select(`
        id,
        company_id,
        role,
        first_name,
        last_name,
        is_active,
        created_at,
        companies(name, company_slug)
      `)
      .limit(limit);

    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }

    if (companyId) {
      query = query.eq('company_id', companyId);
    }

    if (role) {
      query = query.eq('role', role);
    }

    const { data: profiles, error } = await query;

    if (error) {
      console.error('Error searching users:', error);
      throw new ApiError('Failed to search users', 500);
    }

    // Get emails from auth
    const usersWithEmail = await Promise.all(
      (profiles || []).map(async (profile) => {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(profile.id);
        return {
          ...profile,
          email: authUser?.user?.email || null
        };
      })
    );

    return usersWithEmail;
  }
}

module.exports = new PlatformService();
```

### 2.3 Create Platform Controller

**File:** `backend/src/controllers/platformController.js`

```javascript
const platformService = require('../services/platformService');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');

/**
 * Platform Controller - Super Admin Operations
 */
class PlatformController {
  /**
   * Get all companies
   */
  getCompanies = async (req, res, next) => {
    try {
      const { page = 1, limit = 20, search = '', status = null } = req.query;

      const result = await platformService.getCompanies({
        page: parseInt(page),
        limit: parseInt(limit),
        search,
        status
      });

      // Audit log
      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'view_all_companies',
        resourceType: 'platform',
        details: { search, status },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: result.companies,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get platform statistics
   */
  getPlatformStats = async (req, res, next) => {
    try {
      const stats = await platformService.getPlatformStats();

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'view_platform_stats',
        resourceType: 'platform',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get company details
   */
  getCompanyDetails = async (req, res, next) => {
    try {
      const { companyId } = req.params;

      const details = await platformService.getCompanyDetails(companyId);

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'view_company_details',
        resourceType: 'company',
        resourceId: companyId,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: details
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update company status
   */
  updateCompanyStatus = async (req, res, next) => {
    try {
      const { companyId } = req.params;
      const { status, reason } = req.body;

      const company = await platformService.updateCompanyStatus(companyId, status, reason);

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'update_company_status',
        resourceType: 'company',
        resourceId: companyId,
        details: { status, reason },
        severity: 'warning',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: company,
        message: `Company status updated to ${status}`
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search users across platform
   */
  searchUsers = async (req, res, next) => {
    try {
      const { search = '', company_id = null, role = null, limit = 20 } = req.query;

      const users = await platformService.searchUsers({
        search,
        companyId: company_id,
        role,
        limit: parseInt(limit)
      });

      await auditService.logEvent({
        actorId: req.user.id,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'search_platform_users',
        resourceType: 'platform',
        details: { search, company_id, role },
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });

      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get audit logs
   */
  getAuditLogs = async (req, res, next) => {
    try {
      const {
        page = 1,
        limit = 50,
        actor_id = null,
        action = null,
        resource_type = null,
        severity = null,
        start_date = null,
        end_date = null
      } = req.query;

      const result = await auditService.getLogs({
        page: parseInt(page),
        limit: parseInt(limit),
        actorId: actor_id,
        action,
        resourceType: resource_type,
        severity,
        startDate: start_date,
        endDate: end_date
      });

      res.json({
        success: true,
        data: result.logs,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get recent platform activity
   */
  getRecentActivity = async (req, res, next) => {
    try {
      const { limit = 20 } = req.query;

      const activity = await auditService.getRecentActivity(parseInt(limit));

      res.json({
        success: true,
        data: activity
      });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = new PlatformController();
```

### 2.4 Create Platform Routes

**File:** `backend/src/routes/platformRoutes.js`

```javascript
const express = require('express');
const { authenticate, authorize } = require('../middleware/authMiddleware');
const platformController = require('../controllers/platformController');

const router = express.Router();

/**
 * Platform Routes - Super Admin Only
 * All routes require super_admin role
 */

// Authenticate all platform routes
router.use(authenticate);

// Authorize only super admins
router.use(authorize(['super_admin']));

/**
 * @route   GET /api/platform/stats
 * @desc    Get platform-wide statistics
 * @access  Super Admin
 */
router.get('/stats', platformController.getPlatformStats);

/**
 * @route   GET /api/platform/companies
 * @desc    Get all companies with stats
 * @access  Super Admin
 */
router.get('/companies', platformController.getCompanies);

/**
 * @route   GET /api/platform/companies/:companyId
 * @desc    Get company details
 * @access  Super Admin
 */
router.get('/companies/:companyId', platformController.getCompanyDetails);

/**
 * @route   PUT /api/platform/companies/:companyId/status
 * @desc    Update company status (suspend/activate)
 * @access  Super Admin
 */
router.put('/companies/:companyId/status', platformController.updateCompanyStatus);

/**
 * @route   GET /api/platform/users/search
 * @desc    Search users across all companies
 * @access  Super Admin
 */
router.get('/users/search', platformController.searchUsers);

/**
 * @route   GET /api/platform/audit-logs
 * @desc    Get audit logs
 * @access  Super Admin
 */
router.get('/audit-logs', platformController.getAuditLogs);

/**
 * @route   GET /api/platform/activity
 * @desc    Get recent platform activity
 * @access  Super Admin
 */
router.get('/activity', platformController.getRecentActivity);

module.exports = router;
```

### 2.5 Register Platform Routes

**File:** `backend/src/index.js` or `backend/src/app.js` (MODIFY)

```javascript
// Add this import with other route imports
const platformRoutes = require('./routes/platformRoutes');

// Add this route registration with other routes
app.use('/api/platform', platformRoutes);
```

**Find this section in your main app file and add the platform routes:**

```javascript
// Existing routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
// ... other routes

// ADD THIS LINE - Platform routes for super admin
app.use('/api/platform', platformRoutes);
```

---

## Phase 3: Frontend Platform UI

**Timeline:** Days 4-5
**Files to Create:** 12 new files, 4 modifications

### 3.1 Create Platform Service

**File:** `frontend/src/services/platformService.js`

```javascript
import api from './api';

/**
 * Platform Service - Super Admin API calls
 */
const platformService = {
  /**
   * Get platform statistics
   */
  async getPlatformStats() {
    const response = await api.get('/platform/stats');
    return response.data;
  },

  /**
   * Get all companies
   */
  async getCompanies(params = {}) {
    const response = await api.get('/platform/companies', { params });
    return response.data;
  },

  /**
   * Get company details
   */
  async getCompanyDetails(companyId) {
    const response = await api.get(`/platform/companies/${companyId}`);
    return response.data;
  },

  /**
   * Update company status
   */
  async updateCompanyStatus(companyId, status, reason = null) {
    const response = await api.put(`/platform/companies/${companyId}/status`, {
      status,
      reason
    });
    return response.data;
  },

  /**
   * Search users across platform
   */
  async searchUsers(params = {}) {
    const response = await api.get('/platform/users/search', { params });
    return response.data;
  },

  /**
   * Get audit logs
   */
  async getAuditLogs(params = {}) {
    const response = await api.get('/platform/audit-logs', { params });
    return response.data;
  },

  /**
   * Get recent activity
   */
  async getRecentActivity(limit = 20) {
    const response = await api.get('/platform/activity', {
      params: { limit }
    });
    return response.data;
  }
};

export default platformService;
```

### 3.2 Create Platform Layout Component

**File:** `frontend/src/components/Platform/PlatformLayout.jsx`

```javascript
import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformSidebar from './PlatformSidebar';
import PlatformHeader from './PlatformHeader';

const PlatformLayout = () => {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only super admins can access platform
  if (user?.role !== 'super_admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Platform Header */}
      <PlatformHeader />

      <div className="flex">
        {/* Platform Sidebar */}
        <PlatformSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
```

### 3.3 Create Platform Header

**File:** `frontend/src/components/Platform/PlatformHeader.jsx`

```javascript
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeftIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const PlatformHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold">🚀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Platform Admin</h1>
                <p className="text-xs text-purple-200">Sakha CRM</p>
              </div>
            </div>

            <div className="h-8 w-px bg-white bg-opacity-30"></div>

            <Link
              to="/app/dashboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm">Back to App</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-purple-200">{user?.email}</p>
            </div>
            <UserCircleIcon className="h-8 w-8" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PlatformHeader;
```

### 3.4 Create Platform Sidebar

**File:** `frontend/src/components/Platform/PlatformSidebar.jsx`

```javascript
import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '/platform', icon: HomeIcon, exact: true },
  { name: 'Companies', href: '/platform/companies', icon: BuildingOfficeIcon },
  { name: 'Users', href: '/platform/users', icon: UsersIcon },
  { name: 'Analytics', href: '/platform/analytics', icon: ChartBarIcon },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: ShieldCheckIcon },
  { name: 'Activity', href: '/platform/activity', icon: ClockIcon },
];

const PlatformSidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default PlatformSidebar;
```

### 3.5 Create Platform Dashboard

**File:** `frontend/src/pages/Platform/PlatformDashboard.jsx`

```javascript
import { useEffect, useState } from 'react';
import platformService from '../../services/platformService';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const PlatformDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        platformService.getPlatformStats(),
        platformService.getRecentActivity(10)
      ]);

      setStats(statsResponse.data);
      setActivity(activityResponse.data);
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
      toast.error('Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-gray-600 mt-1">Monitor your entire CRM platform at a glance</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Companies"
          value={stats?.total_companies || 0}
          icon={BuildingOfficeIcon}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats?.active_users || 0}
          icon={UsersIcon}
          color="green"
        />
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={DocumentTextIcon}
          color="purple"
        />
        <StatCard
          title="Active (30d)"
          value={stats?.active_users_30d || 0}
          icon={ChartBarIcon}
          color="orange"
        />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">New Companies (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.new_companies_30d || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">New Users (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.new_users_30d || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Leads Created (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.leads_created_30d || 0}
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {activity.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No recent activity</p>
          ) : (
            activity.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.resource_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.activity_type.replace('_', ' ')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
```

### 3.6 Create Companies List Page

**File:** `frontend/src/pages/Platform/Companies.jsx`

```javascript
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import platformService from '../../services/platformService';
import toast from 'react-hot-toast';
import {
  MagnifyingGlassIcon,
  EyeIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  trial: 'bg-blue-100 text-blue-800',
  suspended: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800'
};

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    fetchCompanies();
  }, [page, status]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await platformService.getCompanies({
        page,
        limit: 20,
        search,
        status: status || null
      });

      setCompanies(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchCompanies();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Companies</h2>
        <p className="text-gray-600 mt-1">Manage all companies on the platform</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex items-center space-x-4">
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search companies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-10"
              />
            </div>
          </div>
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="input w-40"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="trial">Trial</option>
            <option value="suspended">Suspended</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Companies Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Company
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Users
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Leads
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                </td>
              </tr>
            ) : companies.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-10 text-center text-gray-500">
                  No companies found
                </td>
              </tr>
            ) : (
              companies.map((company) => (
                <tr key={company.company_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {company.company_name}
                      </p>
                      <p className="text-xs text-gray-500">{company.company_slug}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[company.status]}`}>
                      {company.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {company.active_users} / {company.total_users}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {company.total_leads}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(company.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      to={`/platform/companies/${company.company_id}`}
                      className="inline-flex items-center text-purple-600 hover:text-purple-900"
                    >
                      <EyeIcon className="h-4 w-4 mr-1" />
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pagination.pages}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Companies;
```

### 3.7 Update App.jsx to Include Platform Routes

**File:** `frontend/src/App.jsx` (MODIFY - Add these routes)

```javascript
// Add this import
import PlatformLayout from './components/Platform/PlatformLayout'
import PlatformDashboard from './pages/Platform/PlatformDashboard'
import Companies from './pages/Platform/Companies'

// Add these routes in your Routes component
<Route path="/platform" element={
  <ProtectedRoute>
    <PlatformLayout />
  </ProtectedRoute>
}>
  <Route index element={<PlatformDashboard />} />
  <Route path="companies" element={<Companies />} />
  {/* More platform routes will be added in Phase 4 */}
</Route>
```

### 3.8 Add Platform Link to Main Sidebar

**File:** `frontend/src/components/Layout/Sidebar.jsx` (MODIFY)

Find the navigation section and add:

```javascript
// Add this to the imports
import { CommandLineIcon } from '@heroicons/react/24/outline'

// Add this to utilityNavigation array (only for super_admin)
const utilityNavigation = [
  { name: 'Assignments', href: '/app/assignments', icon: UserPlusIcon, badge: null },
  { name: 'Tasks', href: '/app/tasks', icon: ClipboardDocumentListIcon, badge: badgeCounts.tasks || null },
  { name: 'Users', href: '/app/users', icon: UserGroupIcon, badge: null },
  { name: 'Reports', href: '/app/reports', icon: DocumentChartBarIcon, badge: null },

  // ADD THIS CONDITION
  ...(user?.role === 'super_admin' ? [{
    name: 'Platform Admin',
    href: '/platform',
    icon: CommandLineIcon,
    badge: null,
    className: 'border-t border-gray-200 pt-2 mt-2' // Visual separator
  }] : [])
];
```

---

## Phase 4: Advanced Features

**Timeline:** Days 6-7
**Files to Create:** 4 new files, 2 modifications

### 4.1 Create Impersonation Middleware

**File:** `backend/src/middleware/impersonationMiddleware.js`

```javascript
const { getUserProfile } = require('../config/supabase');
const auditService = require('../services/auditService');
const ApiError = require('../utils/ApiError');

/**
 * Impersonation Middleware
 * Allows super admins to view the system as another user
 */
const impersonate = async (req, res, next) => {
  try {
    const impersonateUserId = req.headers['x-impersonate-user-id'];

    // Only super admins can impersonate
    if (req.user.role !== 'super_admin') {
      return next(ApiError.forbidden('Only super admins can impersonate users'));
    }

    if (!impersonateUserId) {
      return next();
    }

    // Store original user
    req.originalUser = { ...req.user };

    // Get target user profile
    const targetUserProfile = await getUserProfile(impersonateUserId);

    if (!targetUserProfile) {
      return next(ApiError.notFound('Target user not found'));
    }

    // Replace req.user with target user
    req.user = {
      ...targetUserProfile,
      isImpersonated: true,
      impersonatedBy: req.originalUser.id
    };

    // Log impersonation
    await auditService.logEvent({
      actorId: req.originalUser.id,
      actorEmail: req.originalUser.email,
      actorRole: req.originalUser.role,
      action: 'impersonate_user',
      resourceType: 'user',
      resourceId: impersonateUserId,
      details: {
        target_user_email: targetUserProfile.email,
        target_user_name: `${targetUserProfile.first_name} ${targetUserProfile.last_name}`
      },
      isImpersonation: true,
      impersonatedUserId: impersonateUserId,
      severity: 'warning',
      ipAddress: req.ip,
      userAgent: req.headers['user-agent']
    });

    next();
  } catch (error) {
    console.error('Impersonation error:', error);
    next(error);
  }
};

/**
 * End impersonation middleware
 */
const endImpersonation = async (req, res, next) => {
  try {
    if (req.originalUser) {
      await auditService.logEvent({
        actorId: req.originalUser.id,
        actorEmail: req.originalUser.email,
        actorRole: req.originalUser.role,
        action: 'end_impersonation',
        resourceType: 'user',
        resourceId: req.user.id,
        severity: 'info',
        ipAddress: req.ip,
        userAgent: req.headers['user-agent']
      });
    }

    res.json({
      success: true,
      message: 'Impersonation ended'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  impersonate,
  endImpersonation
};
```

### 4.2 Add Impersonation Routes

**File:** `backend/src/routes/platformRoutes.js` (MODIFY - Add these routes)

```javascript
const { impersonate, endImpersonation } = require('../middleware/impersonationMiddleware');

/**
 * @route   POST /api/platform/impersonate/end
 * @desc    End impersonation session
 * @access  Super Admin
 */
router.post('/impersonate/end', endImpersonation);
```

### 4.3 Create Impersonation Banner Component

**File:** `frontend/src/components/Platform/ImpersonationBanner.jsx`

```javascript
import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ImpersonationBanner = ({ impersonatedUser, onEnd }) => {
  const [ending, setEnding] = useState(false);

  const handleEndImpersonation = async () => {
    try {
      setEnding(true);

      // Remove impersonation header
      delete api.defaults.headers.common['x-impersonate-user-id'];

      // Call end impersonation endpoint
      await api.post('/platform/impersonate/end');

      toast.success('Impersonation ended');
      onEnd();

      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Failed to end impersonation:', error);
      toast.error('Failed to end impersonation');
    } finally {
      setEnding(false);
    }
  };

  if (!impersonatedUser) return null;

  return (
    <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <ExclamationTriangleIcon className="h-6 w-6" />
        <div>
          <p className="font-semibold">Impersonation Mode Active</p>
          <p className="text-sm text-amber-100">
            Viewing as: {impersonatedUser.first_name} {impersonatedUser.last_name} ({impersonatedUser.email})
          </p>
        </div>
      </div>
      <button
        onClick={handleEndImpersonation}
        disabled={ending}
        className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
      >
        <XMarkIcon className="h-5 w-5" />
        <span>{ending ? 'Ending...' : 'End Impersonation'}</span>
      </button>
    </div>
  );
};

export default ImpersonationBanner;
```

### 4.4 Create Company Details Page

**File:** `frontend/src/pages/Platform/CompanyDetails.jsx`

```javascript
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import platformService from '../../services/platformService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

const CompanyDetails = () => {
  const { companyId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await platformService.getCompanyDetails(companyId);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch company details:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await platformService.updateCompanyStatus(companyId, newStatus);
      toast.success(`Company status updated to ${newStatus}`);
      fetchCompanyDetails();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update company status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImpersonateUser = (userId) => {
    // Set impersonation header
    api.defaults.headers.common['x-impersonate-user-id'] = userId;

    toast.success('Impersonation started');

    // Redirect to main app
    window.location.href = '/app/dashboard';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Company not found</p>
      </div>
    );
  }

  const { company, users, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/platform/companies" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <p className="text-gray-600">{company.company_slug}</p>
          </div>
        </div>

        {/* Status Dropdown */}
        <select
          value={company.status}
          onChange={(e) => handleUpdateStatus(e.target.value)}
          disabled={updatingStatus}
          className="input"
        >
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_users || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_leads || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Activities (30d)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activities_30d || 0}</p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => handleImpersonateUser(user.id)}
                className="btn-secondary text-sm"
              >
                Impersonate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
```

### 4.5 Add Company Details Route

**File:** `frontend/src/App.jsx` (MODIFY - Add this route)

```javascript
import CompanyDetails from './pages/Platform/CompanyDetails'

// Add this route inside the /platform route group
<Route path="companies/:companyId" element={<CompanyDetails />} />
```

---

## Phase 5: Security & Audit

**Timeline:** Day 8
**Focus:** Enhanced security, rate limiting, audit viewer

### 5.1 Add Rate Limiting for Platform Routes

**File:** `backend/src/middleware/rateLimitMiddleware.js` (CREATE)

```javascript
const rateLimit = require('express-rate-limit');

/**
 * Rate limiter for platform admin routes
 * Super admins get higher limits but still rate limited for security
 */
const platformRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // 500 requests per window (higher than normal users)
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: req.rateLimit.resetTime
    });
  }
});

/**
 * Stricter rate limit for sensitive operations
 */
const strictPlatformRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many sensitive operations, please try again later'
});

module.exports = {
  platformRateLimiter,
  strictPlatformRateLimiter
};
```

### 5.2 Apply Rate Limiting

**File:** `backend/src/routes/platformRoutes.js` (MODIFY)

```javascript
const { platformRateLimiter, strictPlatformRateLimiter } = require('../middleware/rateLimitMiddleware');

// Apply to all platform routes
router.use(platformRateLimiter);

// Apply stricter limit to sensitive routes
router.put('/companies/:companyId/status', strictPlatformRateLimiter, platformController.updateCompanyStatus);
```

### 5.3 Create Audit Logs Viewer

**File:** `frontend/src/pages/Platform/AuditLogs.jsx`

```javascript
import { useEffect, useState } from 'react';
import platformService from '../../services/platformService';
import toast from 'react-hot-toast';
import {
  FunnelIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const SEVERITY_COLORS = {
  info: 'bg-blue-100 text-blue-800',
  warning: 'bg-yellow-100 text-yellow-800',
  critical: 'bg-red-100 text-red-800'
};

const AuditLogs = () => {
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    severity: '',
    page: 1
  });

  useEffect(() => {
    fetchLogs();
  }, [filters.page, filters.action, filters.severity]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const response = await platformService.getAuditLogs({
        page: filters.page,
        limit: 50,
        action: filters.action || null,
        severity: filters.severity || null
      });

      setLogs(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Audit Logs</h2>
        <p className="text-gray-600 mt-1">Platform-wide activity and security logs</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center space-x-4">
        <FunnelIcon className="h-5 w-5 text-gray-400" />
        <select
          value={filters.severity}
          onChange={(e) => setFilters({ ...filters, severity: e.target.value, page: 1 })}
          className="input w-40"
        >
          <option value="">All Severity</option>
          <option value="info">Info</option>
          <option value="warning">Warning</option>
          <option value="critical">Critical</option>
        </select>
        <input
          type="text"
          placeholder="Filter by action..."
          value={filters.action}
          onChange={(e) => setFilters({ ...filters, action: e.target.value, page: 1 })}
          className="input flex-1"
        />
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Timestamp
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Actor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Resource
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Severity
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                  </div>
                </td>
              </tr>
            ) : logs.length === 0 ? (
              <tr>
                <td colSpan="5" className="px-6 py-10 text-center text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.actor_email}</p>
                      <p className="text-xs text-gray-500 capitalize">
                        {log.actor_role.replace('_', ' ')}
                      </p>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.action.replace(/_/g, ' ')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {log.resource_type}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${SEVERITY_COLORS[log.severity]}`}>
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <p className="text-sm text-gray-700">
              Showing page {pagination.page} of {pagination.pages}
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.pages}
                className="btn-secondary px-3 py-2 disabled:opacity-50"
              >
                <ChevronRightIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AuditLogs;
```

### 5.4 Add Audit Logs Route

**File:** `frontend/src/App.jsx` (MODIFY)

```javascript
import AuditLogs from './pages/Platform/AuditLogs'

// Add inside /platform route group
<Route path="audit-logs" element={<AuditLogs />} />
```

---

## Testing Strategy

**Timeline:** Day 9

### Test Checklist

#### Backend Testing

```bash
# Test super admin creation
□ Super admin user created successfully
□ JWT token contains super_admin role
□ Can access platform routes

# Test platform routes
□ GET /api/platform/stats - returns platform stats
□ GET /api/platform/companies - returns all companies
□ GET /api/platform/companies/:id - returns company details
□ PUT /api/platform/companies/:id/status - updates status
□ GET /api/platform/users/search - searches users
□ GET /api/platform/audit-logs - returns audit logs
□ GET /api/platform/activity - returns recent activity

# Test authorization
□ Non-super admins get 403 on platform routes
□ Company admins cannot access platform
□ Managers cannot access platform
□ Sales reps cannot access platform

# Test audit logging
□ All platform actions are logged
□ Impersonation is logged correctly
□ Audit logs contain all required fields
□ Audit logs cannot be modified or deleted
```

#### Frontend Testing

```bash
# Test platform access
□ Super admin sees "Platform Admin" link in sidebar
□ Non-super admins don't see platform link
□ Platform routes redirect non-super admins
□ Platform layout renders correctly

# Test platform dashboard
□ Statistics display correctly
□ Recent activity shows
□ All cards render properly
□ Data refreshes correctly

# Test companies page
□ Companies list loads
□ Search works
□ Status filter works
□ Pagination works
□ "View" button navigates correctly

# Test company details
□ Company info displays
□ User list shows correctly
□ Status dropdown updates company
□ Impersonate button works

# Test impersonation
□ Impersonation starts correctly
□ Banner displays
□ User context switches
□ End impersonation works
□ Audit log created

# Test audit logs
□ Logs display correctly
□ Filters work
□ Pagination works
□ Severity colors correct
```

#### Security Testing

```bash
# Test permissions
□ Only super_admin can access /platform/*
□ Impersonation requires super_admin
□ Rate limiting works
□ Audit logs are immutable

# Test data isolation
□ Company admin cannot see other companies
□ Super admin can see all companies
□ Impersonation respects company boundaries
□ RLS policies enforced correctly
```

---

## Deployment Checklist

### Pre-Deployment

```bash
□ All tests passing
□ Code reviewed
□ Database migrations tested on staging
□ Audit logging verified
□ Rate limiting configured
□ Environment variables set
□ First super admin created
```

### Deployment Steps

```bash
1. Database Migrations
   □ Run create_audit_logs_table.sql
   □ Run create_platform_analytics_views.sql
   □ Verify migrations successful

2. Backend Deployment
   □ Deploy backend changes
   □ Verify platform routes registered
   □ Test platform endpoints
   □ Monitor error logs

3. Frontend Deployment
   □ Build frontend with platform routes
   □ Deploy frontend build
   □ Verify platform UI accessible
   □ Test super admin login

4. Create Super Admin
   □ Run SQL to create first super admin
   □ Verify super admin can login
   □ Test platform access
   □ Verify audit logging

5. Smoke Tests
   □ Login as super admin
   □ Access platform dashboard
   □ View companies list
   □ Test impersonation
   □ Check audit logs
```

### Post-Deployment

```bash
□ Monitor application logs
□ Check audit log entries
□ Verify platform performance
□ Test all critical paths
□ Document any issues
```

---

## Rollback Procedures

### If Issues Occur

**Option 1: Quick Rollback (Frontend Only)**

```bash
# If only frontend issues
1. Revert frontend deployment to previous version
2. Platform routes won't be accessible
3. Main app continues working normally
```

**Option 2: Full Rollback (Backend + Frontend)**

```bash
1. Revert backend deployment
2. Revert frontend deployment
3. Database changes are safe (additive only)
4. Audit logs remain for compliance
```

**Option 3: Disable Platform (Feature Flag)**

```javascript
// Add to backend/src/routes/platformRoutes.js
const PLATFORM_ENABLED = process.env.PLATFORM_ENABLED === 'true';

router.use((req, res, next) => {
  if (!PLATFORM_ENABLED) {
    return res.status(503).json({
      success: false,
      message: 'Platform admin is temporarily disabled'
    });
  }
  next();
});
```

### Database Rollback (If Needed)

```sql
-- Only if absolutely necessary
BEGIN;

-- Drop audit logs table (will lose audit history!)
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

---

## Maintenance & Future Enhancements

### Ongoing Maintenance

```bash
□ Monitor audit logs weekly
□ Review super admin actions
□ Check platform performance
□ Update documentation
□ Review and update permissions
```

### Future Enhancements (Not in this implementation)

1. **Feature Flags Management**
   - UI to toggle features per company
   - A/B testing capabilities

2. **Billing Integration**
   - View company billing
   - Subscription management
   - Usage analytics

3. **Advanced Analytics**
   - Custom reports
   - Data export tools
   - Predictive analytics

4. **Communication Tools**
   - In-app announcements
   - Email broadcasts
   - Support ticket integration

5. **API Management**
   - API key management
   - Rate limit configuration
   - Webhook management

---

## Conclusion

This implementation guide provides a complete, production-ready super admin platform for Sakha CRM. The hybrid approach balances functionality with development efficiency while maintaining security and audit compliance.

### Key Features Delivered

✅ Complete super admin infrastructure
✅ Company management
✅ Platform analytics
✅ User impersonation
✅ Comprehensive audit logging
✅ Security & rate limiting
✅ Rollback procedures
✅ Full documentation

### Timeline Summary

- **Day 1:** Database foundation & first super admin
- **Days 2-3:** Backend infrastructure
- **Days 4-5:** Frontend platform UI
- **Days 6-7:** Advanced features (impersonation, analytics)
- **Day 8:** Security & audit viewer
- **Day 9:** Testing & deployment

**Total:** 9 days for world-class super admin platform

---

## Support & Questions

For questions or issues during implementation:

1. Check the relevant section in this guide
2. Review error logs (audit_logs table)
3. Test in staging environment first
4. Follow rollback procedures if needed

**Remember:** All changes are additive and non-breaking. The main application continues to work normally even if platform features have issues.

---

*End of Implementation Guide*
