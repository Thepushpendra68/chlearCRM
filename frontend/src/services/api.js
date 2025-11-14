import axios from 'axios';
import toast from 'react-hot-toast';
import supabase, { ensureSessionInitialized, getCachedSession } from '../config/supabase';
import { emitForcedLogout } from '../utils/authEvents';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Increased to 60 seconds to handle database queries
  headers: {
    'Content-Type': 'application/json',
  },
});

const applyAuthorizationHeader = (config, token) => {
  if (config.headers?.set) {
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    } else if (typeof config.headers.delete === 'function') {
      config.headers.delete('Authorization');
    } else {
      config.headers.set('Authorization', undefined);
    }
    return config;
  }

  const headers = config.headers ?? {};
  if (!config.headers) {
    config.headers = headers;
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  } else if ('Authorization' in headers) {
    delete headers.Authorization;
  }

  return config;
};

let refreshSessionPromise = null;

const refreshSupabaseSession = async () => {
  // Check if we have a refresh token
  const currentSession = getCachedSession();
  if (!currentSession?.refresh_token) {
    const error = new Error('No refresh token available');
    console.error('[API] Cannot refresh session:', error.message);
    throw error;
  }

  // Check if refresh token might be expired
  if (currentSession.expires_at) {
    const expiresIn = (currentSession.expires_at * 1000) - Date.now();
    if (expiresIn < -3600000) { // Expired more than 1 hour ago
      const error = new Error('Session expired too long ago, refresh token likely invalid');
      console.error('[API] Session expired too long:', Math.round(Math.abs(expiresIn) / 1000 / 60), 'minutes ago');
      throw error;
    }
  }

  if (!refreshSessionPromise) {
    refreshSessionPromise = supabase.auth
      .refreshSession(currentSession)
      .then(async ({ data, error }) => {
        if (error) {
          console.error('[API] Supabase refreshSession error:', {
            message: error.message,
            status: error.status,
            name: error.name
          });
          throw error;
        }

        const refreshedSession = data?.session ?? null;

        if (!refreshedSession) {
          throw new Error('Refresh returned no session');
        }

        console.log('[API] Supabase session refresh result:', {
          hasSession: !!refreshedSession,
          hasToken: !!refreshedSession?.access_token,
          newExpiresAt: refreshedSession.expires_at ? new Date(refreshedSession.expires_at * 1000).toISOString() : 'none',
          newExpiresIn: refreshedSession.expires_at ? Math.round((refreshedSession.expires_at * 1000 - Date.now()) / 1000) : 'none'
        });

        // Update cached session
        await ensureSessionInitialized();
        return getCachedSession();
      })
      .catch((refreshError) => {
        console.error('[API] Token refresh failed:', {
          message: refreshError.message,
          status: refreshError.status,
          name: refreshError.name,
          error: refreshError
        });
        throw refreshError;
      })
      .finally(() => {
        refreshSessionPromise = null;
      });
  }

  return refreshSessionPromise;
};

api.interceptors.request.use(
  async (config) => {
    try {
      await ensureSessionInitialized();
    } catch (sessionInitError) {
      console.error('[API] Failed to ensure session before request:', sessionInitError);
    }

    const session = getCachedSession();
    let token = session?.access_token ?? null;

    // Proactively refresh token if it's about to expire (within 5 minutes)
    if (session?.expires_at && session?.refresh_token) {
      const expiresIn = (session.expires_at * 1000) - Date.now();
      const fiveMinutes = 5 * 60 * 1000; // 5 minutes in milliseconds
      
      if (expiresIn > 0 && expiresIn < fiveMinutes) {
        console.log('[API] Token expiring soon, proactively refreshing...', {
          expiresIn: Math.round(expiresIn / 1000),
          seconds: 'seconds'
        });
        
        try {
          const refreshedSession = await refreshSupabaseSession();
          if (refreshedSession?.access_token) {
            token = refreshedSession.access_token;
            console.log('[API] Proactive refresh successful');
          }
        } catch (refreshError) {
          console.warn('[API] Proactive refresh failed, using current token:', refreshError.message);
          // Continue with current token - it might still work
        }
      }
    }

    console.log('[API] Request interceptor:', {
      url: config.url,
      method: config.method,
      hasSession: !!session,
      hasToken: !!token,
      tokenPrefix: token ? `${token.substring(0, 20)}...` : 'none',
      tokenLength: token ? token.length : 0,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : 'none',
      expiresIn: session?.expires_at ? Math.round((session.expires_at * 1000 - Date.now()) / 1000) : 'none',
      hasRefreshToken: !!session?.refresh_token
    });

    applyAuthorizationHeader(config, token);

    if (token) {
      console.log('[API] Authorization header attached');
    } else {
      console.log('[API] Authorization header cleared (no active session)');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isSigningOut = false;
let hasShownSessionToast = false;

const triggerSignOut = async () => {
  if (isSigningOut) {
    return;
  }

  isSigningOut = true;
  try {
    await supabase.auth.signOut();
  } catch (signOutError) {
    console.error('Failed to sign out after 401:', signOutError);
  } finally {
    emitForcedLogout();
    isSigningOut = false;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      // Backend returns: { success: false, error: { message, code } }
      const errorMessage = data?.error?.message || data?.message || data?.error || JSON.stringify(data) || 'No message';
      
      console.log('[API] Response error:', {
        status,
        url: response.config?.url,
        method: response.config?.method,
        errorMessage,
        fullData: data,
        errorCode: data?.error?.code,
        headers: response.headers,
        hasAuthHeader: !!response.config?.headers?.Authorization,
        authHeaderValue: response.config?.headers?.Authorization ? 
          response.config.headers.Authorization.substring(0, 30) + '...' : 'none'
      });

      switch (status) {
        case 401: {
          const originalRequest = error.config;
          const currentSession = getCachedSession();
          const hadSession = !!currentSession;
          const hasRefreshToken = !!currentSession?.refresh_token;

          // Detect Meta (WhatsApp) OAuth token errors so we DON'T log the user out
          const isMetaAccessTokenError =
            typeof errorMessage === 'string' &&
            errorMessage.toLowerCase().includes('error validating access token');

          if (isMetaAccessTokenError) {
            console.log('[API] 401 from Meta WhatsApp access token, not Supabase auth. Skipping sign-out.');

            // Show a clear message guiding the user to update WhatsApp settings
            toast.error('Your WhatsApp access token has expired. Please open WhatsApp Settings and update the Meta access token.', {
              duration: 6000,
            });

            // Do NOT attempt Supabase refresh or sign out; just reject so caller can handle
            return Promise.reject(error);
          }

          console.log('[API] 401 Unauthorized received', {
            hadSession,
            hasRefreshToken,
            isRetry: originalRequest?._retry,
            errorMessage
          });

          // Only try refresh if:
          // 1. We have a session
          // 2. We have a refresh token
          // 3. This isn't already a retry
          if (hadSession && hasRefreshToken && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              console.log('[API] Attempting to refresh session and retry request...');
              const refreshedSession = await refreshSupabaseSession();
              const refreshedToken = refreshedSession?.access_token;

              if (refreshedToken) {
                console.log('[API] Token refresh succeeded; retrying original request');
                applyAuthorizationHeader(originalRequest, refreshedToken);
                return api(originalRequest);
              } else {
                console.error('[API] Refresh succeeded but no token returned');
              }
            } catch (refreshError) {
              console.error('[API] Refresh-and-retry failed:', {
                message: refreshError.message,
                status: refreshError.status,
                name: refreshError.name
              });
            }
          } else {
            if (!hasRefreshToken) {
              console.log('[API] No refresh token available, cannot refresh');
            }
            if (originalRequest?._retry) {
              console.log('[API] Already retried, refresh failed');
            }
          }

          // If we get here, refresh failed or wasn't possible
          await triggerSignOut();

          if (!hasShownSessionToast) {
            hasShownSessionToast = true;
            const message = hasRefreshToken 
              ? 'Session expired and could not be refreshed. Please login again.'
              : 'Session expired. Please login again.';
            toast.error(message);
            setTimeout(() => {
              hasShownSessionToast = false;
            }, 3000);
          }
          break;
        }

        case 403: {
          const message = data?.message || "Access denied. You don't have permission to perform this action.";
          toast.error(message);
          break;
        }

        case 404:
          toast.error('Resource not found.');
          break;

        case 422:
          if (data?.error && Array.isArray(data.error)) {
            data.error.forEach((err) => {
              toast.error(err.msg || err.message || 'Validation error');
            });
          } else {
            toast.error(data?.message || 'Validation error');
          }
          break;

        case 429:
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
          toast.error('Server error. Please try again later.');
          break;

        default:
          toast.error(data?.message || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      if (['ECONNABORTED', 'NETWORK_ERROR'].includes(error.code)) {
        toast.error('Network timeout. Please check your connection and try again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } else {
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
