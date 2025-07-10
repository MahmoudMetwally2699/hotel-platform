/**
 * API Service
 * Handles all HTTP requests using axios with interceptors for authentication
 */

import axios from 'axios';
import jwt_decode from 'jwt-decode';
import { AUTH_API } from '../config/api.config';
import cookieHelper from '../utils/cookieHelper';

// Create axios instance with default config
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // This ensures cookies are sent with cross-origin requests
});

// Add request interceptor
apiClient.interceptors.request.use(
  async (config) => {
    // Log the request details
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      data: config.data
    });    // Get token from cookies or localStorage as fallback
    let token = cookieHelper.getAuthToken() || localStorage.getItem('token');

    console.log('API Request Auth Debug:', {
      hasCookieToken: !!cookieHelper.getAuthToken(),
      hasLocalStorageToken: !!localStorage.getItem('token'),
      finalToken: !!token
    });

    // If token exists, check if it's expired
    if (token) {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;

      // If token is expired, try to refresh
      if (decoded.exp < currentTime) {
        try {          // Get refresh token from cookies
          const refreshTokenValue = cookieHelper.getRefreshToken();

          if (refreshTokenValue) {
            // Call refresh token endpoint
            const response = await axios.post(AUTH_API.REFRESH_TOKEN, {
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
);  // Add response interceptor
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log the error details
    console.error('API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });    // Handle specific error codes
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - redirect to login
          // No need to clear localStorage as we're using cookies
          console.log('401 Unauthorized - Redirecting to login');
          // Add a small delay to allow logging to complete
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
          break;
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
