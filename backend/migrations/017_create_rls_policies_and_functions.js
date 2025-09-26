/**
 * Migration: Create RLS policies and helper functions
 * This migration creates Row Level Security policies and helper functions
 * for tenant isolation and role-based access control.
 */

exports.up = function(knex) {
  return knex.schema.raw(`
    -- Helper function to get current user's tenant_id from JWT
        CREATE OR REPLACE FUNCTION public.get_tenant_id()
    RETURNS TEXT AS
    DECLARE
      claims JSONB;
      app_metadata JSONB;
      company_id TEXT;
    BEGIN
      PERFORM set_config('search_path', '', true);
      claims := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;

      -- Try to get company_id from app_metadata first (Supabase standard)
      app_metadata := COALESCE(claims->'app_metadata', '{}'::jsonb);
      company_id := COALESCE(
        app_metadata->>'company_id',
        claims->>'company_id'
      );

      RETURN COALESCE(company_id, '');
    END;
     LANGUAGE plpgsql SECURITY DEFINER;

    -- Helper function to get current user's role from JWT
        CREATE OR REPLACE FUNCTION public.get_user_role()
    RETURNS TEXT AS
    DECLARE
      claims JSONB;
      app_metadata JSONB;
      user_role TEXT;
    BEGIN
      PERFORM set_config('search_path', '', true);
      claims := COALESCE(current_setting('request.jwt.claims', true), '{}')::jsonb;

      -- Try to get role from app_metadata first (Supabase standard)
      app_metadata := COALESCE(claims->'app_metadata', '{}'::jsonb);
      user_role := COALESCE(
        app_metadata->>'role',
        claims->>'role'
      );

      RETURN COALESCE(user_role, 'sales_rep');
    END;
     LANGUAGE plpgsql SECURITY DEFINER;

    -- Helper function to get current user's UUID
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

    -- Function to check if user can manage other users
    CREATE OR REPLACE FUNCTION public.can_manage_users()
    RETURNS BOOLEAN AS $$
    BEGIN
      RETURN public.get_user_role() IN ('super_admin', 'company_admin');
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to check if user can access specific lead
    CREATE OR REPLACE FUNCTION public.can_access_lead(lead_id UUID)
    RETURNS BOOLEAN AS $$
    DECLARE
      user_role TEXT := public.get_user_role();
      lead_company UUID;
      lead_assignee UUID;
    BEGIN
      SELECT company_id, assigned_to INTO lead_company, lead_assignee
      FROM leads WHERE id = lead_id;

      -- Check tenant isolation first
      IF lead_company::text != public.get_tenant_id() THEN
        RETURN FALSE;
      END IF;

      -- Role-based access
      IF user_role IN ('super_admin', 'company_admin', 'manager') THEN
        RETURN TRUE;
      ELSIF user_role = 'sales_rep' THEN
        -- Sales reps can only see assigned leads
        RETURN lead_assignee = public.user_id();
      END IF;

      RETURN FALSE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to check if user belongs to company
        CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id UUID)
    RETURNS BOOLEAN AS 
    DECLARE
      tenant_id TEXT;
    BEGIN
      PERFORM set_config('search_path', '', true);
      tenant_id := public.get_tenant_id();

      RETURN (
        target_company_id IS NOT NULL AND
        tenant_id <> '' AND
        target_company_id = tenant_id::uuid
      ) OR public.get_user_role() = 'super_admin';
    EXCEPTION
      WHEN OTHERS THEN
        RETURN public.get_user_role() = 'super_admin';
    END;
     LANGUAGE plpgsql SECURITY DEFINER;

    -- Enable RLS on all tables
    ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
    ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
    ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
    ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
    ALTER TABLE lead_assignment_rules ENABLE ROW LEVEL SECURITY;
    ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
    ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

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

    -- Activities: Tenant isolation with lead access
    CREATE POLICY activities_tenant_isolation ON activities
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

    -- Lead assignment rules: Tenant isolation with admin access
    CREATE POLICY lead_assignment_rules_tenant_isolation ON lead_assignment_rules
      FOR ALL TO authenticated
      USING (
        public.user_belongs_to_company(company_id) AND
        public.get_user_role() IN ('super_admin', 'company_admin', 'manager')
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
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    -- Disable RLS on all tables
    ALTER TABLE companies DISABLE ROW LEVEL SECURITY;
    ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;
    ALTER TABLE leads DISABLE ROW LEVEL SECURITY;
    ALTER TABLE activities DISABLE ROW LEVEL SECURITY;
    ALTER TABLE pipeline_stages DISABLE ROW LEVEL SECURITY;
    ALTER TABLE lead_assignment_rules DISABLE ROW LEVEL SECURITY;
    ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;
    ALTER TABLE import_history DISABLE ROW LEVEL SECURITY;

    -- Drop policies
    DROP POLICY IF EXISTS company_access_policy ON companies;
    DROP POLICY IF EXISTS user_profiles_tenant_isolation ON user_profiles;
    DROP POLICY IF EXISTS leads_tenant_isolation ON leads;
    DROP POLICY IF EXISTS activities_tenant_isolation ON activities;
    DROP POLICY IF EXISTS pipeline_stages_tenant_isolation ON pipeline_stages;
    DROP POLICY IF EXISTS lead_assignment_rules_tenant_isolation ON lead_assignment_rules;
    DROP POLICY IF EXISTS tasks_tenant_isolation ON tasks;
    DROP POLICY IF EXISTS import_history_tenant_isolation ON import_history;

    -- Drop functions
    DROP FUNCTION IF EXISTS public.get_tenant_id();
    DROP FUNCTION IF EXISTS public.get_user_role();
    DROP FUNCTION IF EXISTS public.user_id();
    DROP FUNCTION IF EXISTS public.can_manage_users();
    DROP FUNCTION IF EXISTS public.can_access_lead(UUID);
    DROP FUNCTION IF EXISTS public.user_belongs_to_company(UUID);
  `);
};
