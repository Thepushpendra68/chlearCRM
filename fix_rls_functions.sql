-- Fix RLS functions to properly access JWT claims from app_metadata
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
