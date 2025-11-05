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

// Session management helpers ensure we always have a cached auth session
let cachedSession = null;
let sessionReady = false;
let sessionInitPromise = null;
const sessionSubscribers = new Set();

function notifySessionSubscribers(session) {
  sessionSubscribers.forEach((subscriber) => {
    try {
      subscriber(session);
    } catch (subscriberError) {
      console.error('dY"? [SUPABASE] Session subscriber error:', subscriberError);
    }
  });
}

function setCachedSession(session) {
  cachedSession = session ?? null;
  sessionReady = true;
  notifySessionSubscribers(cachedSession);
}

export function getCachedSession() {
  return cachedSession;
}

export function isSessionInitialized() {
  return sessionReady;
}

export function onSessionChange(callback) {
  sessionSubscribers.add(callback);
  if (sessionReady) {
    try {
      callback(cachedSession);
    } catch (subscriberError) {
      console.error('dY"? [SUPABASE] Session subscriber error:', subscriberError);
    }
  }
  return () => sessionSubscribers.delete(callback);
}

export async function ensureSessionInitialized() {
  if (sessionReady && !sessionInitPromise) {
    return cachedSession;
  }

  if (!sessionInitPromise) {
    sessionInitPromise = supabase.auth
      .getSession()
      .then(({ data }) => {
        setCachedSession(data?.session ?? null);
        return cachedSession;
      })
      .catch((error) => {
        console.error('dY"? [SUPABASE] Failed to initialize session:', error);
        setCachedSession(null);
        return null;
      })
      .finally(() => {
        sessionInitPromise = null;
      });
  }

  return sessionInitPromise;
}

// Warm the session cache immediately so downstream code can rely on it
ensureSessionInitialized();

supabase.auth.onAuthStateChange((event, session) => {
  console.log('dY", [SUPABASE] Auth state change:', event);
  setCachedSession(session ?? null);
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
    // Create a timeout promise to prevent hanging on expired tokens
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Sign out timeout')), 5000)
    );

    // Race between signOut and timeout
    try {
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
    } catch (timeoutError) {
      // If timeout or network error, clear local session storage directly
      console.warn('Sign out request timed out or failed, clearing local session:', timeoutError.message);
      
      // Clear Supabase session storage directly
      const storageKey = supabase.auth?.storageKey || 'sb-qlivxpsvlymxfnamxvhz-auth-token';
      localStorage.removeItem(storageKey);
      sessionStorage.removeItem(storageKey);
      
      // Also clear any auth-related items
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('auth') || key.includes('session')) {
          localStorage.removeItem(key);
        }
      });
    }

    // Clear the cached session
    setCachedSession(null);
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    // Always return success for logout - we want to clear the client state regardless
    return { error: null };
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
  console.log('[SUPABASE] Getting current user profile...')

  try {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      console.log('[SUPABASE] No active session found');
      return { profile: null, error: sessionError };
    }

    const userId = session.user.id;
    console.log('[SUPABASE] Fetching profile for user:', userId);

    // Fetch user profile from database
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select(`
        *,
        companies(name, company_slug)
      `)
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[SUPABASE] Error fetching user profile:', profileError);
      return { profile: null, error: profileError };
    }

    let profileRecord = profile;

    // Auto-sync email verification state after user confirms their address
    if (!profile.email_verified && session.user.email_confirmed_at) {
      const { data: updatedProfile, error: emailSyncError } = await supabase
        .from('user_profiles')
        .update({
          email_verified: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select(`
          *,
          companies(name, company_slug)
        `)
        .single();
      if (!emailSyncError && updatedProfile) {
        profileRecord = updatedProfile;
      } else {
        profileRecord = { ...profile, email_verified: true };
      }
    }

    // Combine with auth user data
    const userProfile = {
      id: profileRecord.id,
      email: session.user.email,
      email_verified: session.user.email_confirmed_at !== null,
      first_name: profileRecord.first_name,
      last_name: profileRecord.last_name,
      role: profileRecord.role,
      company_id: profileRecord.company_id,
      company_name: profileRecord.companies?.name || '',
      company_slug: profileRecord.companies?.company_slug || '',
      avatar_url: profileRecord.avatar_url,
      phone: profileRecord.phone,
      is_active: profileRecord.is_active,
      created_at: profileRecord.created_at,
      updated_at: profileRecord.updated_at
    };

    console.log('[SUPABASE] Profile fetched successfully:', userProfile.email, userProfile.role);
    return { profile: userProfile, error: null };

  } catch (error) {
    console.error('[SUPABASE] Error getting user profile:', error);
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

    // Prefer configured bucket, fallback to 'public'
    const preferredBucket = import.meta.env.VITE_SUPABASE_STORAGE_BUCKET || 'company-files';
    const tryUpload = async (bucket) => {
      return await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });
    };

    let bucketUsed = preferredBucket;
    let { data, error } = await tryUpload(bucketUsed);
    if (error && (error.statusCode === 404 || `${error.message}`.toLowerCase().includes('bucket not found'))) {
      // Retry with public bucket
      bucketUsed = 'public';
      ({ data, error } = await tryUpload(bucketUsed));
    }

    if (error) {
      throw error;
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucketUsed)
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
