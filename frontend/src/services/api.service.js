/**
 * API Service
 * Handles all HTTP requests using axios with interceptors for authentication
 */

import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { API_BASE_URL } from '../config/api.config';
import cookieHelper from '../utils/cookieHelper';

// Ensure API_BASE_URL is correct
const baseURL = API_BASE_URL || 'http://localhost:5000/api';
// ...existing code...

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This ensures cookies are sent with cross-origin requests
  timeout: 10000, // 10 second timeout
});

// Add request interceptor
apiClient.interceptors.request.use(
  async (config) => {    // Log the request details (only in development)
    // ...existing code...

    // Skip authentication for public endpoints
    const isPublicEndpoint = config.url?.includes('/auth/login') ||
                             config.url?.includes('/auth/register') ||
                             config.url?.includes('/auth/validate-qr') ||
                             config.url?.includes('/auth/forgot-password') ||
                             config.url?.includes('/auth/reset-password');

    // If this is a public endpoint, don't add authentication
    if (isPublicEndpoint) {
      return config;
    }

    // Check if we're on SuperHotel routes and get SuperHotel token
    const isOnSuperHotelRoute = window.location.pathname.startsWith('/super-hotel-admin');
    let token;

    if (isOnSuperHotelRoute) {
      // For SuperHotel routes, use SuperHotel token from localStorage
      token = localStorage.getItem('superHotelToken');
  // ...existing code...
    } else {
      // For regular routes, get token from cookies or localStorage as fallback
      token = cookieHelper.getAuthToken() || localStorage.getItem('token');

      // Only log in development and when no token is found
      if (process.env.NODE_ENV === 'development' && !token) {
  // ...existing code...
      }
    }

    // If token exists, check if it's expired (only for regular tokens, skip for SuperHotel)
    if (token && !isOnSuperHotelRoute) {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;

      // If token is expired, try to refresh
      if (decoded.exp < currentTime) {
        try {
          const refreshTokenValue = cookieHelper.getRefreshToken();
          if (refreshTokenValue) {
            const refreshClient = axios.create({
              baseURL: baseURL,
              withCredentials: true,
              headers: {
                'Content-Type': 'application/json',
              }
            });

            const response = await refreshClient.post('/auth/refresh-token', {
              refreshToken: refreshTokenValue,
            });

            token = response.data.token;
          } else {
            window.location.href = '/login';
            return Promise.reject('Session expired. Please login again.');
          }
        } catch (error) {
          window.location.href = '/login';
          return Promise.reject('Authentication failed. Please login again.');
        }
      }
    }

    // Add token to headers if we have one
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);// Track if we're already handling a 401 to prevent loops
let is401HandlingInProgress = false;

// Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Reset 401 handling flag on successful responses
    is401HandlingInProgress = false;

    // Handle cash payment redirects globally
    if (response.data && response.data.redirectUrl && response.data.paymentMethod === 'cash') {
  // ...existing code...

      // Use setTimeout to prevent navigation during current response handling
      setTimeout(() => {
        window.location.href = response.data.redirectUrl;
      }, 100);
    } else if (response.data && response.data.data && response.data.data.redirectUrl && response.data.data.paymentMethod === 'cash') {
  // ...existing code...

      // Use setTimeout to prevent navigation during current response handling
      setTimeout(() => {
        window.location.href = response.data.data.redirectUrl;
      }, 100);
    }

    return response;
  },
  (error) => {
    // Log the error details with more comprehensive information
    // ...existing code...

    // Handle network errors specifically
    if (!error.response && error.request) {
  // ...existing code...

      // Return a more descriptive error for network issues
      return Promise.reject({
        message: 'Network Error: Cannot connect to server. Please check if the backend is running.',
        isNetworkError: true,
        originalError: error
      });
    }

    // Handle specific error codes
    if (error.response) {
  switch (error.response.status) {        case 401:
          // If the 401 comes from login/register or related auth actions, don't override the message
          // or redirect — let the component handle the error so it can show e.g. "Incorrect email or password".
          const url = error.config?.url || '';
          const isAuthAction = url.includes('/auth/login') || url.includes('/auth/register') || url.includes('/auth/refresh-token') || url.includes('/auth/forgot-password') || url.includes('/auth/reset-password') || url.includes('/auth/validate-qr');

          if (is401HandlingInProgress) {
            // ...existing code...
            return Promise.reject({
              ...error,
              suppressToast: true,
              response: {
                ...error.response,
                data: {
                  ...error.response?.data,
                  suppressToast: true,
                  message: 'Authentication in progress...'
                }
              }
            });
          }

          // For login/register and other direct auth actions, return the original error
          // so UI can render the backend's specific message (e.g. invalid credentials).
          if (isAuthAction) {
            // ...existing code...
            return Promise.reject(error);
          }

          // Handle auth check failures differently from regular 401s
          if (error.config?.url?.includes('/auth/me')) {
            // ...existing code...

            // Clear any stored session data
            localStorage.removeItem('token');
            localStorage.removeItem('user');

            // Check if we're on a public route - if so, don't redirect
            const publicRoutes = ['/admin', '/login', '/register', '/forgot-password', '/', '/hotels'];
            const currentPath = window.location.pathname;
            const isPublicRoute = publicRoutes.some(route => {
              if (route === '/') {
                return currentPath === '/';
              }
              return currentPath.startsWith(route);
            });

            if (isPublicRoute) {
              // ...existing code...
            } else {
              // For auth check failures on protected routes, redirect
              setTimeout(() => {
                if (window.location.pathname !== '/login') {
                  window.location.href = '/login';
                }
              }, 100);
            }

            return Promise.reject({
              ...error,
              suppressToast: true,
              response: {
                ...error.response,
                data: {
                  ...error.response?.data,
                  suppressToast: true,
                  message: 'Session expired. Redirecting to login...'
                }
              }
            });
          }

          is401HandlingInProgress = true;

          // Unauthorized - redirect to login for other protected endpoints
          // ...existing code...
          // Clear any stored session data
          localStorage.removeItem('token');
          localStorage.removeItem('user');

          // Add a small delay to allow logging to complete and prevent race conditions
          setTimeout(() => {
            is401HandlingInProgress = false;
            if (window.location.pathname !== '/login') {
              window.location.href = '/login';
            }
          }, 100);

          // Return a custom error object that prevents the toast from showing
          return Promise.reject({
            ...error,
            response: {
              ...error.response,
              data: {
                ...error.response?.data,
                suppressToast: true, // Flag to suppress toast notifications
                message: 'Session expired. Redirecting to login...'
              }
            },
            suppressToast: true
          });
        case 403:
          // Check if this is an auth action (login, register, etc.)
          const url403 = error.config?.url || '';
          const isAuthAction403 = url403.includes('/auth/login') || url403.includes('/auth/register') || url403.includes('/auth/refresh-token') || url403.includes('/auth/forgot-password') || url403.includes('/auth/reset-password') || url403.includes('/auth/validate-qr');

          if (isAuthAction403) {
            // For auth actions (like login), let the component handle the 403 error
            // ...existing code...
            return Promise.reject(error);
          }

          // For non-auth actions, redirect to forbidden page
          // ...existing code...
          window.location.href = '/forbidden';
          break;
        case 404:
          // Not found - Just log it but DON'T redirect (let the component handle it)
          // ...existing code...
          break;
        default:
          // Other errors will be handled by the components
          // ...existing code...
          break;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
