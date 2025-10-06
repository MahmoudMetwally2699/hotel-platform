/**
 * Authentication Service
 * Handles login, registration, and token management
 */

import apiClient from './api.service';
import { AUTH_API, CLIENT_API } from '../config/api.config';
import jwt_decode from 'jwt-decode';
import cookieHelper from '../utils/cookieHelper';
import { clearAllAuthData } from '../utils/authCleanup';

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
   * @param {string} hotelId - Optional hotel ID for hotel-scoped authentication
   * @returns {Promise} - Response from API
   */
  async login(email, password, role = 'guest', hotelId = null) {
    try {
      let endpoint = AUTH_API.LOGIN;

      // Use specific endpoints for different roles
      if (role === 'guest') {
        endpoint = CLIENT_API.LOGIN;
      }

      console.log(`Making login request to ${endpoint} with role: ${role}${hotelId ? `, hotelId: ${hotelId}` : ''}`);
      console.log('API Base URL:', apiClient.defaults.baseURL);
      console.log('Full URL:', `${apiClient.defaults.baseURL}${endpoint}`);

      // Include hotelId in request if provided
      const loginData = { email, password, role };
      if (hotelId) {
        loginData.hotelId = hotelId;
      }

      const response = await apiClient.post(endpoint, loginData);
      console.log('Login response received:', response.data);

      // Store tokens and user data properly
      // The backend sends tokens in response.data.data.token and response.data.data.refreshToken
      if (response.data?.data?.token) {
        // Store token in localStorage as backup (since HTTP-only cookies can't be read by JS)
        localStorage.setItem('token', response.data.data.token);
        console.log('✅ Token stored in localStorage:', response.data.data.token.substring(0, 20) + '...');
      }

      if (response.data?.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        console.log('✅ Refresh token stored in localStorage');
      }

      // Store user data and make sure role is included
      if (response.data?.data?.user) {
        const userData = response.data.data.user;
        userData.role = role; // Explicitly set role from login form
        this.setUserData(userData);
        console.log('✅ User data stored:', userData);
      } else if (response.data?.data) {
        // Fallback if user data is at a different level
        response.data.data.role = role;
        this.setUserData(response.data.data);
        console.log('✅ User data stored (fallback):', response.data.data);
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

      const response = await apiClient.post(endpoint, userData);

      console.log('Registration response received:', response.data);

      // Store tokens and user data properly (same as login)
      if (response.data?.data?.token) {
        localStorage.setItem('token', response.data.data.token);
        console.log('✅ Token stored in localStorage from registration:', response.data.data.token.substring(0, 20) + '...');
      }

      if (response.data?.data?.refreshToken) {
        localStorage.setItem('refreshToken', response.data.data.refreshToken);
        console.log('✅ Refresh token stored in localStorage from registration');
      }

      // Store user data
      if (response.data?.data?.user) {
        const userData = response.data.data.user;
        this.setUserData(userData);
        console.log('✅ User data stored from registration:', userData);
      } else if (response.data?.data) {
        this.setUserData(response.data.data);
        console.log('✅ User data stored from registration (fallback):', response.data.data);
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
   * @param {string|Object} emailOrData - User's email string or object with email, hotelId, qrToken
   * @returns {Promise} - Response from API
   */
  async forgotPassword(emailOrData) {
    try {
      // Support both old string format and new object format for hotel-scoped reset
      const requestData = typeof emailOrData === 'string'
        ? { email: emailOrData }
        : emailOrData;

      const response = await apiClient.post(AUTH_API.FORGOT_PASSWORD, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param {string} token - Reset token from email
   * @param {string|Object} passwordOrData - New password string or object with password and hotel context
   * @returns {Promise} - Response from API
   */
  async resetPassword(token, passwordOrData) {
    try {
      // Support both old string format and new object format
      const requestData = typeof passwordOrData === 'string'
        ? { password: passwordOrData, passwordConfirm: passwordOrData }
        : passwordOrData;

      const response = await apiClient.patch(`/auth/reset-password/${token}`, requestData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate QR token for login context
   * @param {string} qrToken - QR token to validate
   * @param {string} context - Context: 'login' or 'registration'
   * @returns {Promise} - Response from API
   */
  async validateQRToken(qrToken, context = 'login') {
    try {
      const response = await apiClient.post('/auth/validate-qr', {
        qrToken,
        context
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

      // Check if we're on a Super Hotel route or have Super Hotel data
      const isOnSuperHotelRoute = window.location.pathname.startsWith('/super-hotel-admin');
      const hasSuperHotelData = localStorage.getItem('superHotelData');
      const isSupeHotelAuth = isOnSuperHotelRoute || hasSuperHotelData;

      let endpoint = AUTH_API.CHECK; // Default to regular auth check
      if (isSupeHotelAuth) {
        endpoint = '/api/admin/auth/me'; // Super Hotel auth check
        console.log('🏨 checkAuth: Using Super Hotel authentication endpoint');
      }

      console.log(`🔍 checkAuth: Making request to ${endpoint}...`);
      // This will trigger the auth interceptor if the token is invalid
      this.pendingCheckAuth = apiClient.get(endpoint);

      const response = await this.pendingCheckAuth;
      this.pendingCheckAuth = null;

      console.log('✅ checkAuth: Response received:', response.data);

      if (response.data.success || response.data.status === 'success') {
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
    // Use comprehensive auth cleanup utility
    clearAllAuthData();
  }
}

const authService = new AuthService();
export default authService;
