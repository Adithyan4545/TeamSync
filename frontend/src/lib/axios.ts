import axios from 'axios';
import { toast } from 'react-hot-toast';
import { deleteCookie } from 'cookies-next';

// Base URL for backend API
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  withCredentials: true, // send httpOnly cookies
});

let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor – you can add auth header if needed for non-cookie auth
api.interceptors.request.use((config: any) => {
  // No token needed because access token will be sent in Authorization header manually after login
  return config;
});

// Response interceptor – handle token refresh on 401
api.interceptors.response.use(
  (response: any) => response,
  async (error: any) => {
    const originalRequest = error.config;
    // Do not intercept 401s for login or refresh-token to prevent infinite loops
    if (
      error.response && 
      error.response.status === 401 && 
      !originalRequest._retry &&
      originalRequest.url !== '/auth/login' &&
      originalRequest.url !== '/auth/refresh-token'
    ) {
      if (isRefreshing) {
        return new Promise(function(resolve, reject) {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers['Authorization'] = `Bearer ${token}`;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const res = await api.post('/auth/refresh-token');
        if (res.data.success) {
          const newAccess = res.data.data.accessToken;
          api.defaults.headers.common['Authorization'] = `Bearer ${newAccess}`;
          originalRequest.headers['Authorization'] = `Bearer ${newAccess}`;
          processQueue(null, newAccess);
          return api(originalRequest);
        }
      } catch (refreshError: any) {
        processQueue(refreshError, null);
        if (refreshError.response && (refreshError.response.status === 401 || refreshError.response.status === 403)) {
          deleteCookie('refreshToken');
          delete api.defaults.headers.common['Authorization'];
          toast.error('Session expired. Please login again.');
          // Optionally redirect to login
          if (typeof window !== 'undefined' && window.location.pathname !== '/auth/login') {
            window.location.href = '/auth/login';
          }
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    // Show error toast for other errors (skip auth routes which handle their own toast)
    const isAuthRoute = originalRequest.url?.startsWith('/auth/');
    if (!isAuthRoute) {
      if (error.response && error.response.data && error.response.data.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('An unexpected error occurred');
      }
    }
    return Promise.reject(error);
  }
);

export default api;
