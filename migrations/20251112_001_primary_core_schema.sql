-- =====================================================
-- PRIMARY CORE SCHEMA (PHASE 1)
-- =====================================================
-- Run this script first to provision the multi-tenant foundation,
-- authentication helpers, and the core CRM entities (companies,
-- users, leads, accounts, contacts, activities, tasks).
--
-- Safe to run in a clean Supabase project. Re-runnable thanks to
-- IF NOT EXISTS guards where supported.
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- Extensions & enums
-- -----------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'user_role'
  ) THEN
    CREATE TYPE user_role AS ENUM (
      'super_admin',
      'company_admin',
      'manager',
      'sales_rep'
    );
  END IF;
END$$;

-- -----------------------------------------------------
-- Helper functions used by RLS and services
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_tenant_id()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_id()
RETURNS UUID AS $$
BEGIN
  PERFORM set_config('search_path', '', true);
  RETURN ((COALESCE(current_setting('request.jwt.claims', true), '{}'))::json->>'sub')::uuid;
EXCEPTION
  WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.user_belongs_to_company(target_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  tenant_id TEXT;
BEGIN
  PERFORM set_config('search_path', '', true);
  tenant_id := public.get_tenant_id();

  RETURN (
    target_company_id IS NOT NULL
    AND tenant_id <> ''
    AND target_company_id = tenant_id::uuid
  ) OR public.get_user_role() = 'super_admin';
EXCEPTION
  WHEN OTHERS THEN
    RETURN public.get_user_role() = 'super_admin';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- -----------------------------------------------------
-- Core tables
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  company_slug text UNIQUE,
  plan text DEFAULT 'starter',
  status text DEFAULT 'active',
  settings jsonb DEFAULT '{}'::jsonb,
  logo_url text,
  industry_type text,
  size text,
  country text,
  timezone text DEFAULT 'UTC',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  role user_role DEFAULT 'sales_rep',
  first_name text,
  last_name text,
  avatar_url text,
  phone text,
  title text,
  department text,
  settings jsonb DEFAULT '{}'::jsonb,
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  email_verified boolean DEFAULT false,
  last_login_at timestamptz,
  timezone text DEFAULT 'UTC',
  language text DEFAULT 'en',
  onboarding_completed boolean DEFAULT false,
  onboarding_steps jsonb DEFAULT '{}'::jsonb,
  created_by uuid,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.role_permissions (
  role user_role PRIMARY KEY,
  permissions text[] NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL UNIQUE REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  theme text DEFAULT 'light' CHECK (theme = ANY (ARRAY['light','dark','system'])),
  items_per_page integer DEFAULT 20 CHECK (items_per_page BETWEEN 10 AND 100),
  default_view text DEFAULT 'list' CHECK (default_view = ANY (ARRAY['list','grid','kanban'])),
  dashboard_widgets jsonb DEFAULT '{"show_tasks": true, "show_pipeline": true, "show_activities": true, "show_recent_leads": true}'::jsonb,
  email_notifications boolean DEFAULT true,
  email_lead_assigned boolean DEFAULT true,
  email_lead_updated boolean DEFAULT false,
  email_task_assigned boolean DEFAULT true,
  email_task_due boolean DEFAULT true,
  email_daily_digest boolean DEFAULT false,
  email_weekly_digest boolean DEFAULT false,
  in_app_notifications boolean DEFAULT true,
  date_format text DEFAULT 'MM/DD/YYYY' CHECK (date_format = ANY (ARRAY['MM/DD/YYYY','DD/MM/YYYY','YYYY-MM-DD'])),
  time_format text DEFAULT '12h' CHECK (time_format = ANY (ARRAY['12h','24h'])),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  color text DEFAULT '#3B82F6',
  order_position integer NOT NULL,
  is_active boolean DEFAULT true,
  is_closed_won boolean DEFAULT false,
  is_closed_lost boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.lead_picklist_options (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type = ANY (ARRAY['source','status','priority','category','industry','custom'])),
  value text NOT NULL,
  label text NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  description text
);

CREATE TABLE IF NOT EXISTS public.accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  parent_account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  name text NOT NULL,
  website text,
  industry text,
  phone text,
  email text,
  address jsonb DEFAULT '{}'::jsonb,
  annual_revenue numeric,
  employee_count integer,
  description text,
  notes text,
  assigned_to uuid REFERENCES public.user_profiles(id),
  status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active','inactive','archived'])),
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text,
  phone text,
  mobile_phone text,
  title text,
  department text,
  linkedin_url text,
  twitter_handle text,
  preferred_contact_method text CHECK (preferred_contact_method = ANY (ARRAY['email','phone','mobile','linkedin'])),
  do_not_call boolean DEFAULT false,
  do_not_email boolean DEFAULT false,
  address jsonb DEFAULT '{}'::jsonb,
  is_primary boolean DEFAULT false,
  is_decision_maker boolean DEFAULT false,
  reporting_to uuid REFERENCES public.contacts(id),
  last_contacted_at timestamptz,
  last_activity_at timestamptz,
  notes text,
  description text,
  status text DEFAULT 'active' CHECK (status = ANY (ARRAY['active','inactive','bounced','unsubscribed','archived'])),
  lifecycle_stage text CHECK (lifecycle_stage = ANY (ARRAY['lead','marketing_qualified','sales_qualified','opportunity','customer','evangelist'])),
  assigned_to uuid REFERENCES public.user_profiles(id),
  custom_fields jsonb DEFAULT '{}'::jsonb,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  assigned_to uuid REFERENCES public.user_profiles(id),
  pipeline_stage_id uuid REFERENCES public.pipeline_stages(id),
  name text NOT NULL,
  email text,
  phone text,
  company text,
  title text,
  source text,
  status text DEFAULT 'new',
  deal_value numeric,
  expected_close_date timestamptz,
  notes text,
  priority text DEFAULT 'medium',
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  assigned_at timestamptz,
  assignment_source text DEFAULT 'manual',
  first_name varchar NOT NULL,
  last_name varchar NOT NULL,
  lead_source text,
  industry text,
  location text,
  lead_score integer DEFAULT 0,
  last_contact_date timestamptz,
  assignment_rule_id uuid,
  custom_fields jsonb DEFAULT '{}'::jsonb,
  account_id uuid REFERENCES public.accounts(id)
);

CREATE TABLE IF NOT EXISTS public.lead_contacts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  role text,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.user_profiles(id),
  type text NOT NULL,
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  subject text,
  activity_type text,
  scheduled_at timestamptz,
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  duration_minutes integer,
  outcome text,
  updated_at timestamptz DEFAULT now(),
  account_id uuid REFERENCES public.accounts(id),
  contact_id uuid REFERENCES public.contacts(id)
);

CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  assigned_to uuid REFERENCES public.user_profiles(id),
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  created_by uuid REFERENCES public.user_profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  account_id uuid REFERENCES public.accounts(id),
  contact_id uuid REFERENCES public.contacts(id)
);

-- -----------------------------------------------------
-- Helpful indexes
-- -----------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_companies_slug ON public.companies (company_slug);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON public.user_profiles (company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_company ON public.accounts (company_id);
CREATE INDEX IF NOT EXISTS idx_accounts_assigned ON public.accounts (company_id, assigned_to);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts (company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company ON public.leads (company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON public.activities (company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON public.tasks (company_id, assigned_to);

-- -----------------------------------------------------
-- Enable RLS
-- -----------------------------------------------------
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_picklist_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------
-- Policies (core objects)
-- -----------------------------------------------------
CREATE POLICY IF NOT EXISTS companies_select_policy ON public.companies
  FOR SELECT TO authenticated
  USING (id::text = public.get_tenant_id() OR public.get_user_role() = 'super_admin');

CREATE POLICY IF NOT EXISTS companies_insert_policy ON public.companies
  FOR INSERT TO authenticated
  WITH CHECK (public.get_user_role() = 'super_admin');

CREATE POLICY IF NOT EXISTS companies_update_policy ON public.companies
  FOR UPDATE TO authenticated
  USING (id::text = public.get_tenant_id() OR public.get_user_role() = 'super_admin')
  WITH CHECK (id::text = public.get_tenant_id() OR public.get_user_role() = 'super_admin');

CREATE POLICY IF NOT EXISTS user_profiles_select_policy ON public.user_profiles
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS user_profiles_insert_policy ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS user_profiles_update_policy ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS pipeline_stages_select_policy ON public.pipeline_stages
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS pipeline_stages_insert_policy ON public.pipeline_stages
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS pipeline_stages_update_policy ON public.pipeline_stages
  FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS lead_picklist_select_policy ON public.lead_picklist_options
  FOR SELECT TO authenticated
  USING (company_id IS NULL OR public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS lead_picklist_insert_policy ON public.lead_picklist_options
  FOR INSERT TO authenticated
  WITH CHECK (
    (company_id IS NULL AND public.get_user_role() = 'super_admin')
    OR (company_id IS NOT NULL AND public.user_belongs_to_company(company_id) AND public.get_user_role() IN ('company_admin','manager'))
  );

CREATE POLICY IF NOT EXISTS lead_picklist_update_policy ON public.lead_picklist_options
  FOR UPDATE TO authenticated
  USING (
    (company_id IS NULL AND public.get_user_role() = 'super_admin')
    OR (company_id IS NOT NULL AND public.user_belongs_to_company(company_id) AND public.get_user_role() IN ('company_admin','manager'))
  )
  WITH CHECK (
    (company_id IS NULL AND public.get_user_role() = 'super_admin')
    OR (company_id IS NOT NULL AND public.user_belongs_to_company(company_id) AND public.get_user_role() IN ('company_admin','manager'))
  );

CREATE POLICY IF NOT EXISTS accounts_select_policy ON public.accounts
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin','company_admin','manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  );

CREATE POLICY IF NOT EXISTS accounts_insert_policy ON public.accounts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS accounts_update_policy ON public.accounts
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin','company_admin','manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  )
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS accounts_delete_policy ON public.accounts
  FOR DELETE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('super_admin','company_admin','manager')
  );

CREATE POLICY IF NOT EXISTS contacts_select_policy ON public.contacts
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS contacts_insert_policy ON public.contacts
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS contacts_update_policy ON public.contacts
  FOR UPDATE TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS contacts_delete_policy ON public.contacts
  FOR DELETE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    public.get_user_role() IN ('super_admin','company_admin','manager')
  );

CREATE POLICY IF NOT EXISTS leads_select_policy ON public.leads
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin','company_admin','manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  );

CREATE POLICY IF NOT EXISTS leads_insert_policy ON public.leads
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS leads_update_policy ON public.leads
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin','company_admin','manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  )
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS lead_contacts_rw_policy ON public.lead_contacts
  FOR ALL TO authenticated
  USING (public.user_belongs_to_company(company_id))
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS activities_select_policy ON public.activities
  FOR SELECT TO authenticated
  USING (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS activities_insert_policy ON public.activities
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS tasks_select_policy ON public.tasks
  FOR SELECT TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin','company_admin','manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  );

CREATE POLICY IF NOT EXISTS tasks_insert_policy ON public.tasks
  FOR INSERT TO authenticated
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS tasks_update_policy ON public.tasks
  FOR UPDATE TO authenticated
  USING (
    public.user_belongs_to_company(company_id) AND
    (
      public.get_user_role() IN ('super_admin','company_admin','manager') OR
      (public.get_user_role() = 'sales_rep' AND assigned_to = public.user_id())
    )
  )
  WITH CHECK (public.user_belongs_to_company(company_id));

CREATE POLICY IF NOT EXISTS user_preferences_rw_policy ON public.user_preferences
  FOR ALL TO authenticated
  USING (user_id = public.user_id())
  WITH CHECK (user_id = public.user_id());

-- -----------------------------------------------------
-- Auth triggers to seed user metadata & profiles
-- -----------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_id_from_metadata uuid;
  role_from_metadata text;
  default_company_id uuid;
BEGIN
  PERFORM set_config('search_path', '', true);

  BEGIN
    company_id_from_metadata := (NEW.raw_user_meta_data->>'company_id')::uuid;
  EXCEPTION
    WHEN OTHERS THEN
      company_id_from_metadata := NULL;
  END;

  role_from_metadata := COALESCE(NEW.raw_user_meta_data->>'role', 'sales_rep');

  IF company_id_from_metadata IS NULL THEN
    IF NOT EXISTS (SELECT 1 FROM public.user_profiles LIMIT 1) THEN
      INSERT INTO public.companies (name, company_slug, status)
      VALUES (
        COALESCE(NEW.raw_user_meta_data->>'company_name', 'My Company'),
        LOWER(REPLACE(COALESCE(NEW.raw_user_meta_data->>'company_name', 'my-company'), ' ', '-')),
        'active'
      )
      RETURNING id INTO default_company_id;

      company_id_from_metadata := default_company_id;
      role_from_metadata := 'company_admin';
    ELSE
      RAISE EXCEPTION 'company_id is required for additional users';
    END IF;
  END IF;

  NEW.raw_app_meta_data := COALESCE(NEW.raw_app_meta_data, '{}'::jsonb) ||
    jsonb_build_object('company_id', company_id_from_metadata, 'role', role_from_metadata);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.handle_user_profile_creation()
RETURNS TRIGGER AS $$
DECLARE
  company_id_from_metadata uuid;
  role_from_metadata user_role;
BEGIN
  PERFORM set_config('search_path', '', true);

  BEGIN
    company_id_from_metadata := (NEW.raw_app_meta_data->>'company_id')::uuid;
    role_from_metadata := (NEW.raw_app_meta_data->>'role')::user_role;
  EXCEPTION
    WHEN OTHERS THEN
      company_id_from_metadata := NULL;
      role_from_metadata := 'sales_rep';
  END;

  IF company_id_from_metadata IS NOT NULL THEN
    INSERT INTO public.user_profiles (
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
      role_from_metadata,
      NEW.raw_user_meta_data->>'first_name',
      NEW.raw_user_meta_data->>'last_name',
      NEW.email_confirmed_at IS NOT NULL,
      now(),
      now()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created_before ON auth.users;
CREATE TRIGGER on_auth_user_created_before
  BEFORE INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS on_auth_user_created_after ON auth.users;
CREATE TRIGGER on_auth_user_created_after
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_user_profile_creation();

-- -----------------------------------------------------
-- Seed data
-- -----------------------------------------------------
INSERT INTO public.role_permissions (role, permissions, description) VALUES
  ('super_admin', ARRAY['companies:*','users:*','leads:*','activities:*','reports:*','settings:*','billing:*','support:*'], 'Platform administrator'),
  ('company_admin', ARRAY['company:read','company:write','users:create','users:read','users:write','users:delete','leads:*','activities:*','reports:*','settings:read','settings:write'], 'Company administrator'),
  ('manager', ARRAY['users:read','leads:*','activities:*','reports:read','reports:write','assignments:read','assignments:write','pipeline:read','pipeline:write'], 'Department manager'),
  ('sales_rep', ARRAY['leads:read','leads:write','activities:read','activities:write','reports:read','assignments:read','profile:read','profile:write'], 'Sales representative')
ON CONFLICT (role) DO NOTHING;

INSERT INTO public.lead_picklist_options (company_id, type, value, label, sort_order, is_active, metadata, created_at, updated_at)
VALUES
  (NULL, 'source', 'website', 'Website', 1, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'referral', 'Referral', 2, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'outbound_call', 'Outbound Call', 3, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'social_paid', 'Social/Paid Campaign', 4, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'event', 'Event', 5, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'partner', 'Partner', 6, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'email', 'Email', 7, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'advertisement', 'Advertisement', 8, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'other', 'Other', 9, true, '{}'::jsonb, now(), now()),
  (NULL, 'source', 'import', 'Import (System)', 99, true, '{"is_system": true}'::jsonb, now(), now()),
  (NULL, 'status', 'new', 'New', 1, true, '{}'::jsonb, now(), now()),
  (NULL, 'status', 'contacted', 'Contacted', 2, true, '{}'::jsonb, now(), now()),
  (NULL, 'status', 'qualified', 'Qualified', 3, true, '{}'::jsonb, now(), now()),
  (NULL, 'status', 'proposal', 'Proposal Sent', 4, true, '{}'::jsonb, now(), now()),
  (NULL, 'status', 'negotiation', 'Negotiation', 5, true, '{}'::jsonb, now(), now()),
  (NULL, 'status', 'won', 'Closed Won', 6, true, '{"is_won": true}'::jsonb, now(), now()),
  (NULL, 'status', 'lost', 'Closed Lost', 7, true, '{"is_lost": true}'::jsonb, now(), now()),
  (NULL, 'status', 'nurture', 'Nurture', 8, true, '{"is_nurture": true}'::jsonb, now(), now())
ON CONFLICT DO NOTHING;

-- -----------------------------------------------------
-- Secure view for lightweight profile reads
-- -----------------------------------------------------
DROP VIEW IF EXISTS public.user_profiles_limited;
CREATE VIEW public.user_profiles_limited
WITH (security_invoker = true) AS
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
  (SELECT email FROM auth.users WHERE id = up.id) AS email
FROM public.user_profiles up;

COMMIT;

-- =====================================================
-- END PRIMARY CORE SCHEMA
-- =====================================================
