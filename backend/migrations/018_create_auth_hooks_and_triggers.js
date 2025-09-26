/**
 * Migration: Create auth hooks and triggers for Supabase integration
 * This migration creates triggers and functions to handle user creation,
 * JWT claims customization, and profile management for Supabase auth.
 */

exports.up = function(knex) {
  return knex.schema.raw(`
    -- Function to handle new user creation and profile setup
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

    -- Trigger to handle new user creation
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION auth.handle_new_user();

    -- Function to handle user updates (email confirmation, etc.)
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

    -- Trigger to handle user updates
    DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
    CREATE TRIGGER on_auth_user_updated
      AFTER UPDATE ON auth.users
      FOR EACH ROW
      EXECUTE FUNCTION auth.handle_user_update();

    -- Function to handle user profile updates (sync to auth.users app_metadata)
    CREATE OR REPLACE FUNCTION handle_user_profile_update()
    RETURNS TRIGGER AS $$
    BEGIN
      -- Sync role changes to auth.users app_metadata
      IF OLD.role IS DISTINCT FROM NEW.role THEN
        UPDATE auth.users
        SET raw_app_meta_data = COALESCE(raw_app_meta_data, '{}'::jsonb) ||
          jsonb_build_object('role', NEW.role)
        WHERE id = NEW.id;
      END IF;

      -- Update the updated_at timestamp
      NEW.updated_at = NOW();

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Trigger to handle user profile updates
    DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;
    CREATE TRIGGER on_user_profile_updated
      BEFORE UPDATE ON user_profiles
      FOR EACH ROW
      EXECUTE FUNCTION handle_user_profile_update();

    -- Function for custom JWT claims (to be used in Supabase custom access token hook)
    CREATE OR REPLACE FUNCTION auth.get_custom_claims(user_id UUID)
    RETURNS JSONB AS $$
    DECLARE
      user_profile RECORD;
      custom_claims JSONB := '{}'::jsonb;
    BEGIN
      -- Get user profile information
      SELECT
        company_id,
        role,
        permissions,
        is_active
      INTO user_profile
      FROM user_profiles
      WHERE id = user_id AND is_active = true;

      IF user_profile IS NOT NULL THEN
        custom_claims := jsonb_build_object(
          'company_id', user_profile.company_id,
          'role', user_profile.role,
          'permissions', COALESCE(user_profile.permissions, '{}'::jsonb),
          'is_active', user_profile.is_active
        );
      END IF;

      RETURN custom_claims;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;

    -- Function to validate company access (used in policies)
    CREATE OR REPLACE FUNCTION auth.validate_company_access(target_company_id UUID, required_role TEXT DEFAULT NULL)
    RETURNS BOOLEAN AS $$
    DECLARE
      user_company_id UUID;
      user_role TEXT;
    BEGIN
      -- Get user's company and role from JWT claims
      user_company_id := (public.get_tenant_id())::UUID;
      user_role := public.get_user_role();

      -- Super admin can access any company
      IF user_role = 'super_admin' THEN
        RETURN TRUE;
      END IF;

      -- User must belong to the target company
      IF user_company_id != target_company_id THEN
        RETURN FALSE;
      END IF;

      -- Check required role if specified
      IF required_role IS NOT NULL THEN
        CASE required_role
          WHEN 'company_admin' THEN
            RETURN user_role IN ('super_admin', 'company_admin');
          WHEN 'manager' THEN
            RETURN user_role IN ('super_admin', 'company_admin', 'manager');
          WHEN 'sales_rep' THEN
            RETURN user_role IN ('super_admin', 'company_admin', 'manager', 'sales_rep');
          ELSE
            RETURN FALSE;
        END CASE;
      END IF;

      RETURN TRUE;
    END;
    $$ LANGUAGE plpgsql SECURITY DEFINER;
  `);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    -- Drop triggers
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
    DROP TRIGGER IF EXISTS on_user_profile_updated ON user_profiles;

    -- Drop functions
    DROP FUNCTION IF EXISTS auth.handle_new_user();
    DROP FUNCTION IF EXISTS auth.handle_user_update();
    DROP FUNCTION IF EXISTS handle_user_profile_update();
    DROP FUNCTION IF EXISTS auth.get_custom_claims(UUID);
    DROP FUNCTION IF EXISTS auth.validate_company_access(UUID, TEXT);
  `);
};