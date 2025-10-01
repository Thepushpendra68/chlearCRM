-- Fix RLS policies for user_profiles to allow users to read their own profile
-- This fixes the 406 error when fetching user profile after email confirmation

-- Drop existing policy
DROP POLICY IF EXISTS "user_profiles_select_policy" ON user_profiles;

-- Create new policy that allows users to read their own profile OR profiles in their company
CREATE POLICY "user_profiles_select_policy" ON user_profiles
  FOR SELECT TO authenticated
  USING (
    -- Allow users to read their own profile (by matching user ID)
    id = auth.uid()
    OR
    -- Allow users to read profiles in their company
    public.user_belongs_to_company(company_id)
  );

-- Also ensure the update policy allows users to update their own profile
DROP POLICY IF EXISTS "user_profiles_update_policy" ON user_profiles;

CREATE POLICY "user_profiles_update_policy" ON user_profiles
  FOR UPDATE TO authenticated
  USING (
    -- Allow users to update their own profile
    id = auth.uid()
    OR
    -- Allow company admins to update profiles in their company
    public.user_belongs_to_company(company_id)
  )
  WITH CHECK (
    -- Allow users to update their own profile
    id = auth.uid()
    OR
    -- Allow company admins to update profiles in their company
    public.user_belongs_to_company(company_id)
  );