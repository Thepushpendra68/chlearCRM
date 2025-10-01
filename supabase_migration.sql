-- =====================================================
-- SUPABASE MULTI-TENANT CRM MIGRATION SCRIPT
-- =====================================================
-- This script sets up the complete multi-tenant CRM schema
-- Run this in your Supabase SQL Editor
--
-- IMPORTANT: This will create a completely new schema
-- Make sure to backup any existing data first
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CREATE EXTENSIONS
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable RLS (should already be enabled in Supabase)
-- CREATE EXTENSION IF NOT EXISTS "rls";

-- =====================================================
-- 2. CREATE CUSTOM TYPES
-- =====================================================

-- User role hierarchy
CREATE TYPE user_role AS ENUM (
  'super_admin',     -- Platform-level admin (can see all companies)
  'company_admin',   -- Company-level admin (can manage company users)
  'manager',         -- Department manager (can manage team leads)
  'sales_rep'        -- Individual contributor (can manage assigned leads)
);

-- =====================================================
-- 3. CREATE TABLES
-- =====================================================

-- Companies (Tenants)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  logo_url TEXT,
  industry TEXT,
  size TEXT,
  country TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User profiles (extends auth.users)
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  role user_role DEFAULT 'sales_rep',
  first_name TEXT,
  last_name TEXT,
  avatar_url TEXT,
  phone TEXT,
  title TEXT,
  department TEXT,
  settings JSONB DEFAULT '{}',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  onboarding_completed BOOLEAN DEFAULT false,
  onboarding_steps JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pipeline stages
CREATE TABLE pipeline_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  order_position INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_closed_won BOOLEAN DEFAULT false,
  is_closed_lost BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads
CREATE TABLE leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  assigned_to UUID REFERENCES user_profiles(id),
  pipeline_stage_id UUID REFERENCES pipeline_stages(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  company TEXT,
  title TEXT,
  source TEXT,
  status TEXT DEFAULT 'new',
  deal_value DECIMAL(10,2),
  expected_close_date DATE,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignment rules
CREATE TABLE assignment_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule conditions
CREATE TABLE rule_conditions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES assignment_rules(id) ON DELETE CASCADE,
  field TEXT NOT NULL,
  operator TEXT NOT NULL,
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rule actions
CREATE TABLE rule_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  rule_id UUID REFERENCES assignment_rules(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  assignee_id UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date DATE,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import history
CREATE TABLE import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
  filename TEXT NOT NULL,
  total_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  status TEXT DEFAULT 'processing',
  error_details JSONB,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Role permissions lookup table
CREATE TABLE role_permissions (
  role user_role PRIMARY KEY,
  permissions TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. CREATE INDEXES
-- =====================================================

-- Companies
CREATE INDEX idx_companies_subdomain ON companies(subdomain);
CREATE INDEX idx_companies_status ON companies(status);

-- User profiles
CREATE INDEX idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX idx_user_profiles_company_role ON user_profiles(company_id, role);
CREATE INDEX idx_user_profiles_company_active ON user_profiles(company_id, is_active);
CREATE INDEX idx_user_profiles_email_verified ON user_profiles(email_verified);

-- Pipeline stages
CREATE INDEX idx_pipeline_stages_company ON pipeline_stages(company_id);
CREATE INDEX idx_pipeline_stages_company_order ON pipeline_stages(company_id, order_position);

-- Leads
CREATE INDEX idx_leads_company ON leads(company_id);
CREATE INDEX idx_leads_company_status ON leads(company_id, status);
CREATE INDEX idx_leads_company_assigned ON leads(company_id, assigned_to);
CREATE INDEX idx_leads_company_stage ON leads(company_id, pipeline_stage_id);
CREATE INDEX idx_leads_email ON leads(email);
CREATE INDEX idx_leads_created_at ON leads(created_at);

-- Activities
CREATE INDEX idx_activities_company ON activities(company_id);
CREATE INDEX idx_activities_company_lead ON activities(company_id, lead_id);
CREATE INDEX idx_activities_company_user ON activities(company_id, user_id);
CREATE INDEX idx_activities_created_at ON activities(created_at);

-- Assignment rules
CREATE INDEX idx_assignment_rules_company ON assignment_rules(company_id);
CREATE INDEX idx_assignment_rules_company_active ON assignment_rules(company_id, is_active);

-- Rule conditions
CREATE INDEX idx_rule_conditions_company ON rule_conditions(company_id);
CREATE INDEX idx_rule_conditions_rule ON rule_conditions(rule_id);

-- Rule actions
CREATE INDEX idx_rule_actions_company ON rule_actions(company_id);
CREATE INDEX idx_rule_actions_rule ON rule_actions(rule_id);

-- Tasks
CREATE INDEX idx_tasks_company ON tasks(company_id);
CREATE INDEX idx_tasks_company_status ON tasks(company_id, status);
CREATE INDEX idx_tasks_company_assigned ON tasks(company_id, assigned_to);
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Import history
CREATE INDEX idx_import_history_company ON import_history(company_id);
CREATE INDEX idx_import_history_company_status ON import_history(company_id, status);

-- =====================================================
-- 5. ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rule_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 6. CREATE HELPER FUNCTIONS
-- =====================================================

-- Get current user's tenant_id from JWT
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS TEXT AS 
DECLARE
  claims JSONB;
  company_id TEXT;
BEGIN
  PERFORM set_config('search_path', '', true);
  claims := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;

  company_id := COALESCE(
    claims->>'company_id',
    claims->'app_metadata'->>'company_id'
  );

  RETURN COALESCE(company_id, '');
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's role from JWT
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS 
DECLARE
  claims JSONB;
  user_role TEXT;
BEGIN
  PERFORM set_config('search_path', '', true);
  claims := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;

  user_role := COALESCE(
    claims->>'role',
    claims->'app_metadata'->>'role'
  );

  RETURN COALESCE(user_role, 'sales_rep');
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Get current user's UUID
CREATE OR REPLACE FUNCTION public.user_id()
RETURNS UUID AS 
BEGIN
  PERFORM set_config('search_path', '', true);
  RETURN ((COALESCE(current_setting('request.jwt.claims', true), '{}'))::json->>'sub')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user belongs to company
CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id UUID)
RETURNS BOOLEAN AS 
DECLARE
  tenant_id TEXT;
BEGIN
  PERFORM set_config('search_path', '', true);
  tenant_id := public.get_tenant_id();

  RETURN target_company_id::text = public.get_tenant_id() OR public.get_user_role() = 'super_admin';
END;
 LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- 7. CREATE RLS POLICIES
-- =====================================================

-- Companies: Users can only see their own company (except super_admins)
CREATE POLICY company_access_policy ON companies
  FOR ALL TO authenticated
  USING (
    id::text = public.get_tenant_id() OR
    public.get_user_role() = 'super_admin'
  );

-- User profiles: Users can see users from their company
CREATE POLICY user_profiles_tenant_isolation ON user_profiles
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id)
  );

-- Pipeline stages: Tenant isolation
CREATE POLICY pipeline_stages_tenant_isolation ON pipeline_stages
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id)
  );

-- Leads: Complete tenant isolation with role-based access
CREATE POLICY leads_tenant_isolation ON leads
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin', 'company_admin', 'manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  );

-- Activities: Tenant isolation
CREATE POLICY activities_tenant_isolation ON activities
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id)
  );

-- Assignment rules: Tenant isolation with admin access
CREATE POLICY assignment_rules_tenant_isolation ON assignment_rules
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('super_admin', 'company_admin', 'manager')
  );

-- Rule conditions: Tenant isolation
CREATE POLICY rule_conditions_tenant_isolation ON rule_conditions
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id)
  );

-- Rule actions: Tenant isolation
CREATE POLICY rule_actions_tenant_isolation ON rule_actions
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id)
  );

-- Tasks: Tenant isolation with assignee access
CREATE POLICY tasks_tenant_isolation ON tasks
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin', 'company_admin', 'manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  );

-- Import history: Tenant isolation
CREATE POLICY import_history_tenant_isolation ON import_history
  FOR ALL TO authenticated
  USING (
    public.user_belongs_to_company(company_id)
  );

-- =====================================================
-- 8. CREATE TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_id_from_metadata UUID;
  role_from_metadata TEXT;
  default_company_id UUID;
BEGIN
  -- Get company_id and role from user metadata
  company_id_from_metadata := (NEW.raw_user_meta_data->>'company_id')::UUID;
  role_from_metadata := COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep');

  -- If no company_id provided, this might be a super admin creating their own company
  IF company_id_from_metadata IS NULL THEN
    -- Check if this is the first user (super admin scenario)
    IF NOT EXISTS (SELECT 1 FROM user_profiles LIMIT 1) THEN
      -- Create a default company for the first user
      INSERT INTO companies (name, subdomain, status)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'my-company'), ' ', '-')),
        'active'
      )
      RETURNING id INTO default_company_id;

      company_id_from_metadata := default_company_id;
      role_from_metadata := 'company_admin'; -- First user becomes company admin
    ELSE
      -- This shouldn't happen in normal flow - throw error
      RAISE EXCEPTION 'Company ID is required for user creation';
    END IF;
  END IF;

  -- Set company_id and role in app_metadata (secure, used for JWT claims)
  UPDATE auth.users
  SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object(
      'company_id', company_id_from_metadata,
      'role', role_from_metadata
    )
  WHERE id = NEW.id;

  -- Create user profile
  INSERT INTO user_profiles (
    id,
    company_id,
    role,
    first_name,
    last_name,
    email_verified,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    company_id_from_metadata,
    role_from_metadata::user_role,
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'last_name',
    NEW.email_confirmed_at IS NOT NULL,
    NOW(),
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();

-- Function to handle user updates
CREATE OR REPLACE FUNCTION auth.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Update email verification status in user_profiles
  IF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    UPDATE user_profiles
    SET
      email_verified = true,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  -- Update last login time
  IF OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at AND NEW.last_sign_in_at IS NOT NULL THEN
    UPDATE user_profiles
    SET
      last_login_at = NEW.last_sign_in_at,
      updated_at = NOW()
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for user updates
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_user_update();

-- =====================================================
-- 9. INSERT DEFAULT DATA
-- =====================================================

-- Insert role permissions
INSERT INTO role_permissions (role, permissions, description) VALUES
(
  'super_admin',
  ARRAY[
    'companies:*', 'users:*', 'leads:*', 'activities:*',
    'reports:*', 'settings:*', 'billing:*', 'support:*'
  ],
  'Platform administrator with full system access'
),
(
  'company_admin',
  ARRAY[
    'company:read', 'company:write', 'users:create', 'users:read', 'users:write',
    'users:delete', 'leads:*', 'activities:*', 'reports:*', 'settings:read', 'settings:write'
  ],
  'Company administrator with full company-level access'
),
(
  'manager',
  ARRAY[
    'users:read', 'leads:*', 'activities:*', 'reports:read', 'reports:write',
    'assignments:read', 'assignments:write', 'pipeline:read', 'pipeline:write'
  ],
  'Department manager with team and lead management access'
),
(
  'sales_rep',
  ARRAY[
    'leads:read', 'leads:write', 'activities:read', 'activities:write',
    'reports:read', 'assignments:read', 'profile:read', 'profile:write'
  ],
  'Sales representative with limited access to assigned leads'
);

-- =====================================================
-- 10. CREATE VIEWS
-- =====================================================

-- User profiles with auth data
CREATE OR REPLACE VIEW user_profiles_with_auth AS
SELECT
  up.id,
  up.company_id,
  up.role,
  up.first_name,
  up.last_name,
  up.avatar_url,
  up.phone,
  up.title,
  up.department,
  up.settings,
  up.permissions,
  up.is_active,
  up.email_verified,
  up.last_login_at,
  up.timezone,
  up.language,
  up.onboarding_completed,
  up.onboarding_steps,
  up.created_by,
  up.created_at,
  up.updated_at,
  au.email,
  au.email_confirmed_at,
  au.created_at as auth_created_at,
  au.updated_at as auth_updated_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

COMMIT;

-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
--
-- Next steps:
-- 1. Set up custom access token hook in Supabase Edge Functions
-- 2. Configure storage buckets with RLS policies
-- 3. Test the multi-tenant functionality
-- 4. Migrate existing data if needed
--
-- =====================================================