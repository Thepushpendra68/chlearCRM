-- =====================================================
-- CREATE MISSING VIEW: user_profiles_with_auth
-- =====================================================
-- This view joins user_profiles with auth.users to provide
-- complete user information including email and last sign-in
-- =====================================================

-- Drop the view if it already exists
DROP VIEW IF EXISTS user_profiles_with_auth CASCADE;

-- Create the view
CREATE VIEW user_profiles_with_auth
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
  -- Include email and auth-specific fields from auth.users
  au.email,
  au.email_confirmed_at,
  au.last_sign_in_at,
  au.raw_app_meta_data,
  au.raw_user_meta_data,
  au.created_at as auth_created_at
FROM user_profiles up
LEFT JOIN auth.users au ON up.id = au.id;

-- Grant SELECT permission to authenticated users
-- (RLS policies on user_profiles will still apply)
GRANT SELECT ON user_profiles_with_auth TO authenticated;

-- =====================================================
-- VIEW CREATED SUCCESSFULLY
-- =====================================================
-- This view is now available for backend queries
-- =====================================================
