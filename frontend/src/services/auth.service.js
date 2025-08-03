/**
 * Authentication Service
 * Handles login, registration, and token management
 */

import apiClient from './api.service';
import { AUTH_API, CLIENT_API } from '../config/api.config';
import jwt_decode from 'jwt-decode';
import cookieHelper from '../utils/cookieHelper';

class AuthService {
  constructor() {
    // Debounce mechanism for checkAuth to prevent spam
    this.lastCheckAuthCall = 0;
    this.checkAuthDebounceMs = 1000; // 1 second debounce
    this.pendingCheckAuth = null;
  }  /**
   * Login user with email and password
   * @param {string} email - User's email
   * @param {string} password - User's password
   * @param {string} role - User's role (guest, hotel, service, superadmin)
   * @returns {Promise} - Response from API
   */  async login(email, password, role = 'guest') {
    try {
      let endpoint = AUTH_API.LOGIN;

      // Use specific endpoints for different roles
      if (role === 'guest') {
        endpoint = CLIENT_API.LOGIN;
      }

      console.log(`Making login request to ${endpoint} with role: ${role}`);
      console.log('API Base URL:', apiClient.defaults.baseURL);
      console.log('Full URL:', `${apiClient.defaults.baseURL}${endpoint}`);

      const response = await apiClient.post(endpoint, { email, password, role });
      console.log('Login response received:', response.data);      // Store tokens and user data properly
      if (response.data.data && response.data.data.token) {
        // Store token in localStorage as backup (since cookies might not be working)
        localStorage.setItem('token', response.data.data.token);
        console.log('Token stored in localStorage');
      } else if (response.data.token) {
        // Alternative location for token
        localStorage.setItem('token', response.data.token);
        console.log('Token stored in localStorage from response.data.token');
      }      // Store user data and make sure role is included
      if (response.data.data) {
        response.data.data.role = role; // Explicitly set role from login form
        this.setUserData(response.data.data);
      }

      return response.data;
    } catch (error) {
      console.error('Login error details:', error.response?.data);
      console.error('Login error message:', error.message);
      console.error('Login error code:', error.code);

      // If it's a network error, provide helpful information
      if (error.isNetworkError || (!error.response && error.request)) {
        console.error('❌ Network Error: Cannot connect to backend server');
        console.error('Please ensure:');
        console.error('1. Backend server is running on http://localhost:5000');
        console.error('2. No firewall is blocking the connection');
        console.error('3. CORS is properly configured on the backend');

        throw new Error('Cannot connect to server. Please check if the backend is running.');
      }

      throw error;
    }
  }

  /**
   * Register new user
   * @param {Object} userData - User data including name, email, password, etc.
   * @param {string} role - User's role
   * @returns {Promise} - Response from API
   */
  async register(userData, role = 'guest') {
    try {
      let endpoint = AUTH_API.REGISTER;

      // Use specific endpoints for different roles
      if (role === 'guest') {
        endpoint = CLIENT_API.REGISTER;
      }

      const response = await apiClient.post(endpoint, userData);      // No need to store tokens in localStorage if registration also logs the user in
      // Tokens are now stored as cookies by the backend
      if (response.data.data) {
        this.setUserData(response.data.data);
      }

      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   * @returns {Promise} - Response from API
   */
  async logout() {
    try {
      const response = await apiClient.post(AUTH_API.LOGOUT);
      this.clearSession();
      return response.data;
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  /**
   * Initiate password reset
   * @param {string} email - User's email
   * @returns {Promise} - Response from API
   */
  async forgotPassword(email) {
    try {
      const response = await apiClient.post(AUTH_API.FORGOT_PASSWORD, { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token from email
   * @param {string} password - New password
   * @returns {Promise} - Response from API
   */
  async resetPassword(token, password) {
    try {
      const response = await apiClient.post(AUTH_API.RESET_PASSWORD, {
        token,
        password,
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get user profile
   * @returns {Promise} - Response from API
   */
  async getProfile() {
    try {
      const response = await apiClient.get(AUTH_API.PROFILE);
      this.setUserData(response.data.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user profile (alias for backward compatibility)
   * @returns {Promise} - Response from API
   */
  async getUserProfile() {
    return this.getProfile();
  }

  /**
   * Update user profile
   * @param {Object} userData - User data to update
   * @returns {Promise} - Response from API
   */
  async updateProfile(userData) {
    try {
      const response = await apiClient.put(AUTH_API.PROFILE, userData);
      this.setUserData(response.data.data);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user avatar
   * @param {FormData} formData - Form data with avatar file
   * @returns {Promise} - Response from API
   */
  async updateAvatar(formData) {
    try {
      const response = await apiClient.post(AUTH_API.UPDATE_AVATAR, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   * @param {Object} passwordData - Object containing old and new password
   * @returns {Promise} - Response from API
   */
  async changePassword(passwordData) {
    try {
      const response = await apiClient.post(AUTH_API.CHANGE_PASSWORD, passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }  /**
   * Check authentication status
   * @returns {Promise} - Response with authentication status and user info
   */
  async checkAuth() {
    try {
      const now = Date.now();

      // Debounce checkAuth calls to prevent spam
      if (now - this.lastCheckAuthCall < this.checkAuthDebounceMs) {
        console.log('🔍 checkAuth: Call debounced, returning pending promise');
        if (this.pendingCheckAuth) {
          return this.pendingCheckAuth;
        }
      }

      this.lastCheckAuthCall = now;

      console.log('🔍 checkAuth: Making request to /api/auth/me...');
      // This will trigger the auth interceptor if the token is invalid
      this.pendingCheckAuth = apiClient.get(AUTH_API.CHECK);

      const response = await this.pendingCheckAuth;
      this.pendingCheckAuth = null;

      console.log('✅ checkAuth: Response received:', response.data);

      if (response.data.success) {
        console.log('✅ checkAuth: Auth successful, user data:', response.data.data);
        // Don't store in localStorage since we're using cookies
        // The user data will be managed by Redux
      }

      return response.data;    } catch (error) {
      this.pendingCheckAuth = null;
      console.log('❌ checkAuth: Auth check failed - this is normal for unauthenticated users');

      // Clear session on auth check failure
      this.clearSession();

      // For auth check failures, throw a custom error that suppresses toast
      const authError = {
        ...error,
        suppressToast: true,
        response: {
          ...error.response,
          data: {
            ...error.response?.data,
            suppressToast: true,
            message: 'Authentication check failed'
          }
        }
      };

      throw authError;
    }
  }

  /**
   * Store user data in localStorage
   * @param {Object} userData - User data object
   */  setUserData(userData) {
    console.log('Setting user data in localStorage:', userData);
    localStorage.setItem('user', JSON.stringify(userData));
  }  /**
   * Get user data from localStorage
   * @returns {Object|null} - User data or null
   */
  getUserData() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
  /**
   * Check if user is authenticated
   * @returns {boolean} - True if authenticated
   */
  isAuthenticated() {
    const token = cookieHelper.getAuthToken();
    if (!token) return false;

    // Check if token is expired
    try {
      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get user role from token
   * @returns {string|null} - User role or null
   */
  getUserRole() {
    const token = cookieHelper.getAuthToken();
    if (!token) return null;

    try {
      const decoded = jwt_decode(token);
      return decoded.role;
    } catch (error) {
      return null;
    }
  }  /**
   * Clear session data
   */
  clearSession() {
    // We can't directly clear HttpOnly cookies from JavaScript
    // The backend will handle cookie removal on logout
    // Remove user data and token from localStorage (backup)
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    console.log('🧹 Session data cleared from localStorage');
  }
}

const authService = new AuthService();
export default authService;
