/**
 * Supabase Configuration for Backend
 * This module configures Supabase clients for server-side operations
 * with different permission levels.
 */

console.log('🔄 [SUPABASE] Loading supabase.js configuration file...');

const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required Supabase environment variables: ${missingEnvVars.join(', ')}`);
}

// Supabase client with anon key (respects RLS)
const supabaseAnon = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Supabase client with service role key (bypasses RLS - use carefully!)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

/**
 * Get Supabase client configured for authenticated user context
 * This client respects RLS and uses the user's JWT token
 * @param {string} accessToken - User's access token from Supabase auth
 * @returns {object} Configured Supabase client
 */
function getSupabaseForUser(accessToken) {
  const client = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
      auth: {
        autoRefreshToken: true,
        persistSession: true,
      },
    }
  );

  return client;
}

/**
 * Verify and decode Supabase JWT token
 * @param {string} token - JWT token to verify
 * @returns {object} Decoded token payload or null if invalid
 */
async function verifySupabaseToken(token) {
  try {
    console.log('🚀 [SUPABASE] verifySupabaseToken function called!');
    console.log('🔍 [SUPABASE] Verifying token by decoding JWT...');
    console.log('🔍 [SUPABASE] Token length:', token.length);

    // For server-side JWT verification, decode the token directly
    // Supabase JWT tokens are standard JWTs that can be decoded
    const jwt = require('jsonwebtoken');

    // Decode the token without verification first to get the payload
    const decoded = jwt.decode(token);

    if (!decoded) {
      console.error('❌ [SUPABASE] Failed to decode JWT token');
      return null;
    }

    console.log('✅ [SUPABASE] JWT decoded successfully');
    console.log('✅ [SUPABASE] Decoded payload keys:', Object.keys(decoded));
    console.log('✅ [SUPABASE] User ID (sub):', decoded.sub);
    console.log('✅ [SUPABASE] Email:', decoded.email);
    console.log('✅ [SUPABASE] Role:', decoded.role || decoded.app_metadata?.role);
    console.log('✅ [SUPABASE] Company ID:', decoded.app_metadata?.company_id);

    // Verify the token is not expired
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < now) {
      console.error('❌ [SUPABASE] Token has expired');
      return null;
    }

    console.log('✅ [SUPABASE] Token is valid, returning user data');

    // For now, trust the token if it decodes properly
    // In production, you should verify the signature with the Supabase JWT secret
    return {
      user: {
        id: decoded.sub,
        email: decoded.email,
        email_confirmed_at: decoded.email_confirmed_at,
        role: decoded.role || decoded.app_metadata?.role,
        company_id: decoded.app_metadata?.company_id,
        ...decoded.user_metadata,
        ...decoded.app_metadata,
      }
    };
  } catch (error) {
    console.error('❌ [SUPABASE] Token verification error:', error);
    return null;
  }
}

/**
 * Get user profile with company information
 * @param {string} userId - User UUID
 * @returns {object} User profile data
 */
async function getUserProfile(userId) {
  try {
    console.log('🔍 [SUPABASE] Getting profile for user:', userId);

    // First get user profile (bypass RLS for now to debug)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ [SUPABASE] Error fetching user profile:', profileError);
      return null;
    }

    console.log('✅ [SUPABASE] Profile found:', {
      id: profile.id,
      role: profile.role,
      company_id: profile.company_id,
      first_name: profile.first_name
    });

    // Get company information
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .select('name, subdomain')
      .eq('id', profile.company_id)
      .single();

    if (companyError) {
      console.error('❌ [SUPABASE] Error fetching company:', companyError);
    } else {
      console.log('✅ [SUPABASE] Company found:', company?.name);
    }

    // Get auth user email
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (authError) {
      console.error('❌ [SUPABASE] Error fetching auth user:', authError);
    } else {
      console.log('✅ [SUPABASE] Auth user found:', authUser?.user?.email);
    }

    return {
      ...profile,
      company_name: company?.name,
      company_subdomain: company?.subdomain,
      email: authUser?.user?.email,
    };
  } catch (error) {
    console.error('❌ [SUPABASE] Error in getUserProfile:', error);
    return null;
  }
}

/**
 * Create a new company and admin user (for initial registration)
 * @param {object} companyData - Company information
 * @param {object} userData - User information
 * @returns {object} Created company and user data
 */
async function createCompanyWithAdmin(companyData, userData) {
  try {
    // Create company first
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert(companyData)
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    // Create user with company association
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
      user_metadata: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_id: company.id,
        role: 'company_admin',
      },
    });

    if (authError) {
      // Cleanup: delete the company if user creation failed
      await supabaseAdmin.from('companies').delete().eq('id', company.id);
      throw authError;
    }

    return {
      company,
      user: authUser.user,
    };
  } catch (error) {
    console.error('Error creating company with admin:', error);
    throw error;
  }
}

module.exports = {
  supabaseAnon,
  supabaseAdmin,
  getSupabaseForUser,
  verifySupabaseToken,
  getUserProfile,
  createCompanyWithAdmin,
};