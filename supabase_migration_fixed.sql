-- =====================================================
-- SUPABASE CRM MIGRATION (PERMISSIONS FIXED)
-- =====================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- User role hierarchy
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
          'super_admin',
          'company_admin',
          'manager',
          'sales_rep'
        );
    END IF;
END $$;

-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- User profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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
  expected_close_date TIMESTAMPTZ,
  notes TEXT,
  priority TEXT DEFAULT 'medium',
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activities
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  user_id UUID REFERENCES user_profiles(id),
  type TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  assigned_to UUID REFERENCES user_profiles(id),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'medium',
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES user_profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Import history
CREATE TABLE IF NOT EXISTS import_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
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

-- Role permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role user_role PRIMARY KEY,
  permissions TEXT[] NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_companies_subdomain ON companies(subdomain);
CREATE INDEX IF NOT EXISTS idx_user_profiles_company ON user_profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_stages_company ON pipeline_stages(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company ON leads(company_id);
CREATE INDEX IF NOT EXISTS idx_activities_company ON activities(company_id);
CREATE INDEX IF NOT EXISTS idx_tasks_company ON tasks(company_id);

-- Enable RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;

-- Simple RLS policies (allow authenticated users)
CREATE POLICY "Enable access for authenticated users" ON companies FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable access for authenticated users" ON user_profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable access for authenticated users" ON pipeline_stages FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable access for authenticated users" ON leads FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable access for authenticated users" ON activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable access for authenticated users" ON tasks FOR ALL TO authenticated USING (true);
CREATE POLICY "Enable access for authenticated users" ON import_history FOR ALL TO authenticated USING (true);

-- Insert role permissions
INSERT INTO role_permissions (role, permissions, description) VALUES
('super_admin', ARRAY['companies:*', 'users:*', 'leads:*', 'activities:*', 'reports:*', 'settings:*'], 'Platform administrator'),
('company_admin', ARRAY['company:*', 'users:*', 'leads:*', 'activities:*', 'reports:*'], 'Company administrator'),
('manager', ARRAY['users:read', 'leads:*', 'activities:*', 'reports:*'], 'Department manager'),
('sales_rep', ARRAY['leads:read', 'leads:write', 'activities:*'], 'Sales representative')
ON CONFLICT (role) DO UPDATE SET permissions = EXCLUDED.permissions;

-- Create view
CREATE OR REPLACE VIEW user_profiles_with_auth AS
SELECT up.*, au.email FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

SELECT '✅ Migration completed successfully!' as result;
