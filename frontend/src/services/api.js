import axios from 'axios';
import toast from 'react-hot-toast';
import supabase, { ensureSessionInitialized, getCachedSession } from '../config/supabase';

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
  if (!refreshSessionPromise) {
    refreshSessionPromise = supabase.auth
      .refreshSession()
      .then(async ({ data, error }) => {
        if (error) {
          throw error;
        }

        const refreshedSession = data?.session ?? null;

        console.log('[API] Supabase session refresh result:', {
          hasSession: !!refreshedSession,
          hasToken: !!refreshedSession?.access_token,
        });

        await ensureSessionInitialized();
        return getCachedSession();
      })
      .catch((refreshError) => {
        console.error('[API] Token refresh failed:', refreshError);
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
    const token = session?.access_token ?? null;

    console.log('[API] Request interceptor:', {
      url: config.url,
      hasSession: !!session,
      hasToken: !!token,
      tokenPrefix: token ? `${token.substring(0, 20)}...` : 'none',
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
    isSigningOut = false;
  }
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      console.log('[API] Response error:', {
        status,
        url: response.config?.url,
        data: data?.message || 'No message'
      });

      switch (status) {
        case 401: {
          const originalRequest = error.config;
          const hadSession = !!getCachedSession();

          console.log('[API] 401 Unauthorized received');

          if (hadSession && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
              const refreshedSession = await refreshSupabaseSession();
              const refreshedToken = refreshedSession?.access_token;

              if (refreshedToken) {
                console.log('[API] Token refresh succeeded; retrying original request');
                applyAuthorizationHeader(originalRequest, refreshedToken);
                return api(originalRequest);
              }
            } catch (refreshError) {
              console.error('[API] Refresh-and-retry failed:', refreshError);
            }
          }

          await triggerSignOut();

          if (!hasShownSessionToast) {
            hasShownSessionToast = true;
            toast.error('Session expired. Please login again.');
            setTimeout(() => {
              hasShownSessionToast = false;
            }, 3000);
          }
          break;
        }

        case 403:
          toast.error("Access denied. You don't have permission to perform this action.");
          break;

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
