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
console.log('🔧 API Service initialized with base URL:', baseURL);

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
    if (process.env.NODE_ENV === 'development') {
      console.log('API Request:', {
        url: config.url,
        method: config.method
      });
    }    // Get token from cookies or localStorage as fallback
    let token = cookieHelper.getAuthToken() || localStorage.getItem('token');

    // Only log in development and when no token is found
    if (process.env.NODE_ENV === 'development' && !token) {
      console.log('API Request Auth Debug: No token found');
    }

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

    // If token exists, check if it's expired
    if (token) {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;

      // If token is expired, try to refresh
      if (decoded.exp < currentTime) {
        try {          // Get refresh token from cookies
          const refreshTokenValue = cookieHelper.getRefreshToken();          if (refreshTokenValue) {
            // Call refresh token endpoint using a new axios instance to avoid infinite loop
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

            // No need to update tokens in localStorage as they should be set via cookies by backend
            // The cookies will be automatically included in future requests

            // Use new token for request
            token = response.data.token;
          } else {
            // No refresh token, redirect to login
            window.location.href = '/login';
            return Promise.reject('Session expired. Please login again.');
          }
        } catch (error) {
          // Refresh token failed, redirect to login
          window.location.href = '/login';
          return Promise.reject('Authentication failed. Please login again.');
        }
      }

      // Add token to headers
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
    return response;
  },
  (error) => {
    // Log the error details with more comprehensive information
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message,
      code: error.code,
      isNetworkError: !error.response && error.request,
      fullError: error
    });

    // Handle network errors specifically
    if (!error.response && error.request) {
      console.error('Network Error - Backend may not be running or CORS issue');
      console.error('Request was made but no response received:', error.request);
      console.error('Check if backend is running on the correct port and CORS is configured');

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
            console.log('401 handling already in progress, skipping redirect');
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
            console.log('401 from auth action (login/register) - passing error to component');
            return Promise.reject(error);
          }

          // Handle auth check failures differently from regular 401s
          if (error.config?.url?.includes('/auth/me')) {
            console.log('401 from auth check - clearing session and redirecting');

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
              console.log(`🌐 Staying on public route: ${currentPath}`);
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
          console.log('401 Unauthorized - Redirecting to login');
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
          // Forbidden - redirect to forbidden page
          console.log('403 Forbidden - Redirecting to forbidden page');
          window.location.href = '/forbidden';
          break;
        case 404:
          // Not found - Just log it but DON'T redirect (let the component handle it)
          console.log('404 Not Found - URL:', error.config?.url);
          break;
        default:
          // Other errors will be handled by the components
          console.log(`${error.response.status} error - Will be handled by component`);
          break;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
