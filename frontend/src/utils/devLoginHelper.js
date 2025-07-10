/**
 * Development Login Helper
 *
 * This file contains helper functions for quick login during development
 * WARNING: This file should only be used during development and testing
 */

import axios from 'axios';
import { AUTH_API } from '../config/api.config';
import cookieHelper from './cookieHelper';

/**
 * Login as a specific role for development purposes
 * @param {string} role - The role to login as (superadmin, hotel, service, guest)
 * @returns {Promise} - A promise that resolves when login is complete
 */
export const devLogin = async (role = 'superadmin') => {
  try {
    let credentials = {
      email: '',
      password: '',
      role: role
    };

    // Set default test credentials based on role
    switch (role) {
      case 'superadmin':
        credentials.email = 'admin@hotelplatform.com';
        credentials.password = 'Admin123!';
        break;
      case 'hotel':
        credentials.email = 'hotel@test.com';
        credentials.password = 'Hotel123!';
        break;
      case 'service':
        credentials.email = 'service@test.com';
        credentials.password = 'Service123!';
        break;
      case 'guest':
        credentials.email = 'guest@test.com';
        credentials.password = 'Guest123!';
        break;
      default:
        throw new Error('Invalid role');
    }

    console.log(`Attempting to login as ${role} with email: ${credentials.email}`);

    // Call the login API
    const response = await axios.post(AUTH_API.LOGIN, credentials);    // No need to store tokens as they're now in cookies
    // Just log the response for debugging purposes

    console.log(`Successfully logged in as ${role}`);
    console.log('Login response:', response.data);

    return {
      success: true,
      message: `Logged in as ${role}`,
      data: response.data
    };
  } catch (error) {
    console.error('Development login failed:', error.response?.data || error.message);
    return {
      success: false,
      message: error.response?.data?.message || error.message,
      error
    };
  }
};

/**
 * Check if user is logged in
 * @returns {boolean} - True if user is logged in
 */
export const isLoggedIn = () => {
  return !!cookieHelper.getAuthToken();
};

/**
 * Get current user role from token
 * @returns {string|null} - User role or null if not logged in
 */
export const getCurrentRole = () => {
  const token = cookieHelper.getAuthToken();
  if (!token) return null;

  try {
    const decoded = JSON.parse(atob(token.split('.')[1]));
    return decoded.role;
  } catch (e) {
    console.error('Error decoding token:', e);
    return null;
  }
};
