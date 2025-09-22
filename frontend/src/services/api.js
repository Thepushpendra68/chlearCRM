import axios from 'axios';
import toast from 'react-hot-toast';

// Create axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  timeout: 30000, // Increased to 30 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response } = error;

    if (response) {
      const { status, data } = response;

      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
          break;

        case 403:
          // Forbidden
          toast.error('Access denied. You don\'t have permission to perform this action.');
          break;

        case 404:
          // Not found
          toast.error('Resource not found.');
          break;

        case 422:
          // Validation error
          if (data.error && Array.isArray(data.error)) {
            data.error.forEach(err => {
              toast.error(err.msg || err.message || 'Validation error');
            });
          } else {
            toast.error(data.message || 'Validation error');
          }
          break;

        case 429:
          // Rate limit exceeded
          toast.error('Too many requests. Please try again later.');
          break;

        case 500:
          // Server error
          toast.error('Server error. Please try again later.');
          break;

        default:
          // Other errors
          toast.error(data?.message || 'An error occurred. Please try again.');
      }
    } else if (error.request) {
      // Network error - add retry logic for network failures
      if (error.code === 'ECONNABORTED' || error.code === 'NETWORK_ERROR') {
        toast.error('Network timeout. Please check your connection and try again.');
      } else {
        toast.error('Network error. Please check your connection.');
      }
    } else {
      // Other error
      toast.error('An unexpected error occurred.');
    }

    return Promise.reject(error);
  }
);

export default api;
