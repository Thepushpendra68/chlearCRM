# Supabase Database Setup - Quick Fix

## Issue Summary
The company registration is failing because the database schema and auth triggers are not properly set up in Supabase.

## Quick Solution

### Step 1: Manual SQL Execution in Supabase
Go to your Supabase project → SQL Editor and execute the following SQL statements **one by one**:

#### A. Create Basic Tables
```sql
-- 1. Create user roles enum
CREATE TYPE user_role AS ENUM (
  'super_admin',
  'company_admin',
  'manager',
  'sales_rep'
);

-- 2. Create companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subdomain TEXT UNIQUE,
  plan TEXT DEFAULT 'starter',
  status TEXT DEFAULT 'active',
  settings JSONB DEFAULT '{}',
  industry TEXT,
  size TEXT,
  country TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create user_profiles table
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'sales_rep',
  first_name TEXT,
  last_name TEXT,
  email_verified BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}',
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### B. Create Auth Trigger (CRITICAL)
```sql
-- Auth trigger to handle new user registration
CREATE OR REPLACE FUNCTION auth.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  company_id_from_metadata UUID;
  role_from_metadata TEXT;
  default_company_id UUID;
BEGIN
  -- Get company_name from user metadata (sent by frontend)
  role_from_metadata := COALESCE(NEW.raw_user_meta_data->>'role', 'company_admin');

  -- Check if this is a new company registration
  IF NEW.raw_user_meta_data->>'company_name' IS NOT NULL THEN
    -- Create a new company
    INSERT INTO companies (name, subdomain, status)
    VALUES (
      NEW.raw_user_meta_data->>'company_name',
      LOWER(REPLACE(NEW.raw_user_meta_data->>'company_name', ' ', '-')),
      'active'
    )
    RETURNING id INTO default_company_id;

    company_id_from_metadata := default_company_id;
    role_from_metadata := 'company_admin'; -- First user becomes company admin
  END IF;

  -- Set company_id and role in app_metadata
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

-- Create the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auth.handle_new_user();
```

#### C. Create View for User Profiles with Auth Data
```sql
-- Create a view that combines user_profiles with auth data
CREATE OR REPLACE VIEW user_profiles_with_auth AS
SELECT
  up.*,
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  c.name as company_name,
  c.subdomain as company_subdomain
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id
LEFT JOIN companies c ON up.company_id = c.id;
```

#### D. Enable Row Level Security (RLS)
```sql
-- Enable RLS on tables
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic policies (allow all for now, refine later)
CREATE POLICY "Allow all operations for authenticated users" ON companies
  FOR ALL TO authenticated USING (true);

CREATE POLICY "Allow all operations for authenticated users" ON user_profiles
  FOR ALL TO authenticated USING (true);
```

### Step 2: Test the Setup
After running the SQL above, test the company registration:

1. Go to `/register-company`
2. Fill out the company registration form
3. Submit the form
4. Check your email for verification
5. Click verification link
6. Try logging in

### Step 3: Verify in Supabase Dashboard
After registration, check:
1. **Auth → Users** - Should see your user
2. **Database → companies** - Should see your company
3. **Database → user_profiles** - Should see your profile with company_id

## What This Fixes

1. **Company Creation**: The trigger now properly creates a company from the `company_name` metadata
2. **User Profile**: Automatically creates user profile linked to the company
3. **Auth Integration**: Syncs data between Supabase Auth and your custom tables
4. **Dashboard Loading**: Once user profile exists with company_id, dashboard will load properly

## Environment Variables
Ensure your `frontend/.env` has:
```
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Next Steps (Optional)
After this basic setup works, you can:
1. Run the full migration SQL file for additional features
2. Set up proper RLS policies
3. Add leads, pipeline, and other CRM tables

This minimal setup should resolve the immediate issues with company registration and dashboard loading.