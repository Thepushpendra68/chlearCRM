/**
 * Supabase Configuration for Backend
 * This module configures Supabase clients for server-side operations
 * with different permission levels.
 */

console.log('🔄 [SUPABASE] Loading supabase.js configuration file...');
console.log('🔍 [SUPABASE] Environment variables present:', {
  SUPABASE_URL: !!process.env.SUPABASE_URL,
  SUPABASE_ANON_KEY: !!process.env.SUPABASE_ANON_KEY,
  SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_JWT_SECRET: !!process.env.SUPABASE_JWT_SECRET
});

const { createClient } = require('@supabase/supabase-js');

// Validate required environment variables
const requiredEnvVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'SUPABASE_SERVICE_ROLE_KEY', 'SUPABASE_JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
  const errorMessage = `Missing required Supabase environment variables: ${missingEnvVars.join(', ')}`;
  console.error('❌ [SUPABASE]', errorMessage);
  throw new Error(errorMessage);
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
    console.log('🔍 [SUPABASE] Verifying token signature using JWT secret...');
    if (typeof token !== 'string' || token.trim().length === 0) {
      console.error('❌ [SUPABASE] Token is missing or not a string');
      return null;
    }

    console.log('🔍 [SUPABASE] Token length:', token.length);

    // Verify the token signature using the Supabase JWT secret (HS256)
    const jwt = require('jsonwebtoken');
    const jwtSecret = process.env.SUPABASE_JWT_SECRET;

    if (!jwtSecret) {
      console.error('❌ [SUPABASE] Missing SUPABASE_JWT_SECRET environment variable');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret, {
      algorithms: ['HS256'],
    });

    if (!decoded || typeof decoded !== 'object') {
      console.error('❌ [SUPABASE] Failed to verify JWT token');
      return null;
    }

    console.log('✅ [SUPABASE] JWT signature verified successfully');
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
      .select('name, company_slug')
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
      company_slug: company?.company_slug,
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
  const normalizedCompanyData = {
    ...companyData,
    name: companyData.name?.trim() || companyData.name,
    company_slug: companyData.company_slug?.trim().toLowerCase() || null,
    status: companyData.status || 'active',
  };

  const signupOptions = {
    email: userData.email,
    password: userData.password,
    options: {
      data: {
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_name: normalizedCompanyData.name,
        role: 'company_admin',
      },
    },
  };

  if (process.env.SUPABASE_EMAIL_REDIRECT_TO) {
    signupOptions.options.emailRedirectTo = process.env.SUPABASE_EMAIL_REDIRECT_TO;
  }

  let createdUser = null;
  let createdCompany = null;

  try {
    // 1. Create the user via Supabase Auth (sends confirmation email automatically)
    const { data: signUpData, error: signUpError } = await supabaseAnon.auth.signUp(signupOptions);

    if (signUpError) {
      throw signUpError;
    }

    createdUser = signUpData?.user;

    if (!createdUser?.id) {
      throw new Error('Supabase sign up did not return a user ID');
    }

    // 2. Create the company record
    const { data: company, error: companyError } = await supabaseAdmin
      .from('companies')
      .insert({
        ...normalizedCompanyData,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (companyError) {
      throw companyError;
    }

    createdCompany = company;

    // 3. Ensure user has company metadata for RLS-aware JWTs
    const { error: metadataError } = await supabaseAdmin.auth.admin.updateUserById(createdUser.id, {
      app_metadata: {
        ...(createdUser.app_metadata || {}),
        company_id: company.id,
        role: 'company_admin',
      },
      user_metadata: {
        ...(createdUser.user_metadata || {}),
        first_name: userData.first_name,
        last_name: userData.last_name,
        company_id: company.id,
        company_name: normalizedCompanyData.name,
        role: 'company_admin',
      },
    });

    if (metadataError) {
      throw metadataError;
    }

    // 4. Create user profile row (bypasses RLS with service role)
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: createdUser.id,
        company_id: company.id,
        role: 'company_admin',
        first_name: userData.first_name,
        last_name: userData.last_name,
        email_verified: false,
        is_active: true,
        created_by: createdUser.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      throw profileError;
    }

    // 5. Create default pipeline stages for the new company
    const defaultStages = [
      { name: 'New Lead', color: '#3B82F6', order_position: 1, is_closed_won: false, is_closed_lost: false },
      { name: 'Contacted', color: '#06B6D4', order_position: 2, is_closed_won: false, is_closed_lost: false },
      { name: 'Qualified', color: '#10B981', order_position: 3, is_closed_won: false, is_closed_lost: false },
      { name: 'Proposal Sent', color: '#F59E0B', order_position: 4, is_closed_won: false, is_closed_lost: false },
      { name: 'Negotiation', color: '#F97316', order_position: 5, is_closed_won: false, is_closed_lost: false },
      { name: 'Closed Won', color: '#22C55E', order_position: 6, is_closed_won: true, is_closed_lost: false },
      { name: 'Closed Lost', color: '#EF4444', order_position: 7, is_closed_won: false, is_closed_lost: true },
    ];

    const stagesToInsert = defaultStages.map(stage => ({
      ...stage,
      company_id: company.id,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    const { error: stagesError } = await supabaseAdmin
      .from('pipeline_stages')
      .insert(stagesToInsert);

    if (stagesError) {
      console.error('⚠️ [SUPABASE] Error creating default pipeline stages:', stagesError);
      // Don't throw - stages can be created later manually
    } else {
      console.log('✅ [SUPABASE] Created 7 default pipeline stages for company:', company.id);
    }

    return {
      company,
      user: {
        id: createdUser.id,
        email: createdUser.email,
        app_metadata: {
          ...(createdUser.app_metadata || {}),
          company_id: company.id,
          role: 'company_admin',
        },
      },
      profile,
    };
  } catch (error) {
    console.error('Error creating company with admin:', error);

    // Cleanup on failure
    if (createdCompany?.id) {
      await supabaseAdmin.from('companies').delete().eq('id', createdCompany.id);
    }

    if (createdUser?.id) {
      await supabaseAdmin.auth.admin.deleteUser(createdUser.id);
    }

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