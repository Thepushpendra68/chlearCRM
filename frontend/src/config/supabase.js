/**
 * Supabase Configuration for Frontend
 * This module configures the Supabase client for browser-side operations
 * with authentication and real-time capabilities.
 */

import { createClient } from '@supabase/supabase-js';

// Validate required environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error('Missing VITE_SUPABASE_URL environment variable');
}

if (!supabaseAnonKey) {
  throw new Error('Missing VITE_SUPABASE_ANON_KEY environment variable');
}

// Create Supabase client with clean, minimal configuration
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storageKey: 'sb-qlivxpsvlymxfnamxvhz-auth-token',
  },
});

/**
 * Auth helper functions
 */

/**
 * Sign up a new user with company creation
 * @param {object} userData - User registration data
 * @param {object} companyData - Company registration data
 * @returns {object} Authentication result
 */
export async function signUpWithCompany(userData, companyData) {
  try {
    const { data, error } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          first_name: userData.first_name,
          last_name: userData.last_name,
          company_name: companyData.name,
          role: 'company_admin',
        },
      },
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing up with company:', error);
    return { data: null, error };
  }
}

/**
 * Sign in with email and password
 * @param {string} email - User email
 * @param {string} password - User password
 * @returns {object} Authentication result
 */
export async function signIn(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { data: null, error };
  }
}

/**
 * Sign out current user
 * @returns {object} Sign out result
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }

    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
}

/**
 * Get current user session
 * @returns {object} Current session
 */
export async function getCurrentSession() {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return { session: data.session, error: null };
  } catch (error) {
    console.error('Error getting current session:', error);
    return { session: null, error };
  }
}


/**
 * Get current user profile with company information
 * @returns {object} User profile data
 */
export async function getCurrentUserProfile() {
  console.log('🔍 [SUPABASE] Getting current user profile...')

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('❌ [SUPABASE] No active session found');
      return { profile: null, error: sessionError };
    }

    const userId = session.user.id;
    console.log('🔍 [SUPABASE] Fetching profile for user:', userId);

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies(name, subdomain)
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('❌ [SUPABASE] Error fetching user profile:', profileError);
      return { profile: null, error: profileError };
    }

    // Combine with auth user data
    const userProfile = {
      id: profile.id,
      email: session.user.email,
      email_verified: session.user.email_confirmed_at !== null,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      company_id: profile.company_id,
      company_name: profile.companies?.name || '',
      company_subdomain: profile.companies?.subdomain || '',
      avatar_url: profile.avatar_url,
      phone: profile.phone,
      is_active: profile.is_active,
      created_at: profile.created_at,
      updated_at: profile.updated_at
    };

    console.log('✅ [SUPABASE] Profile fetched successfully:', userProfile.email, userProfile.role);
    return { profile: userProfile, error: null };

  } catch (error) {
    console.error('❌ [SUPABASE] Error getting user profile:', error);
    return { profile: null, error };
  }
}

/**
 * Update user profile
 * @param {string} userId - User ID
 * @param {object} updates - Profile updates
 * @returns {object} Update result
 */
export async function updateUserProfile(userId, updates) {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { data: null, error };
  }
}

/**
 * Database helper functions
 */

/**
 * Get all companies (super admin only)
 * @returns {object} Companies data
 */
export async function getCompanies() {
  try {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting companies:', error);
    return { data: null, error };
  }
}

/**
 * Storage helper functions
 */

/**
 * Upload file to company-specific storage
 * @param {File} file - File to upload
 * @param {string} path - Storage path within company folder
 * @param {string} companyId - Company ID for isolation
 * @returns {object} Upload result
 */
export async function uploadFile(file, path, companyId) {
  try {
    const filePath = `${companyId}/${path}`;

    const { data, error } = await supabase.storage
      .from('company-files')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('company-files')
      .getPublicUrl(filePath);

    return {
      data: {
        ...data,
        publicUrl: urlData.publicUrl
      },
      error: null
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    return { data: null, error };
  }
}

/**
 * Real-time subscriptions
 */

/**
 * Subscribe to user profile changes
 * @param {string} userId - User ID to subscribe to
 * @param {function} callback - Callback function for changes
 * @returns {object} Subscription object
 */
export function subscribeToUserProfile(userId, callback) {
  return supabase
    .channel(`user-profile-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_profiles',
        filter: `id=eq.${userId}`,
      },
      callback
    )
    .subscribe();
}

/**
 * Subscribe to company data changes
 * @param {string} companyId - Company ID to subscribe to
 * @param {function} callback - Callback function for changes
 * @returns {object} Subscription object
 */
export function subscribeToCompanyData(companyId, callback) {
  return supabase
    .channel(`company-${companyId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `company_id=eq.${companyId}`,
      },
      callback
    )
    .subscribe();
}

export default supabase;