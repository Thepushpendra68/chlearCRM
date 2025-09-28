import axios from 'axios';
import toast from 'react-hot-toast';
import supabase from '../config/supabase';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 60000, // Increased to 60 seconds to handle database queries
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  async (config) => {
    // Use the current session from Supabase client (should be cached)
    const { data: { session } } = await supabase.auth.getSession();

    console.log('🔍 [API] Request interceptor:', {
      url: config.url,
      hasSession: !!session,
      hasToken: !!session?.access_token,
      tokenPrefix: session?.access_token ? session.access_token.substring(0, 20) + '...' : 'none'
    });

    if (session?.access_token) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${session.access_token}`;
      console.log('✅ [API] Added Authorization header');
    } else if (config.headers?.Authorization) {
      delete config.headers.Authorization;
      console.log('⚠️ [API] Removed Authorization header - no valid session');
    }

    return config;
  },
  (error) => Promise.reject(error)
);

let isSigningOut = false;
let hasShownSessionToast = false;

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      console.log('🔍 [API] Response error:', {
        status,
        url: response.config?.url,
        data: data?.message || 'No message'
      });

      switch (status) {
        case 401: {
          console.log('🚪 [API] 401 Unauthorized - signing out user');
          if (!isSigningOut) {
            isSigningOut = true;
            try {
              await supabase.auth.signOut();
            } catch (signOutError) {
              console.error('Failed to sign out after 401:', signOutError);
            } finally {
              isSigningOut = false;
            }
          }

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
          toast.error('Access denied. You don\'t have permission to perform this action.');
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
