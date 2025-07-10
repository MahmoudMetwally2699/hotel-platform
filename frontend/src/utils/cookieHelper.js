/**
 * Cookie Helper Utility
 * Functions for working with cookies
 */

import jwt_decode from 'jwt-decode';

/**
 * Get a cookie value by name
 * @param {string} name - The name of the cookie to get
 * @returns {string|null} - Cookie value or null if not found
 */
export const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

/**
 * Check if the token in cookies is valid and has a specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} - Whether the token has the required role
 */
export const cookieTokenHasRole = (requiredRole) => {
  try {
    const token = getCookie('jwt');
    if (!token) return false;

    const decoded = jwt_decode(token);

    // Direct role match
    if (decoded.role === requiredRole) return true;

    return false;
  } catch (error) {
    console.error('Error checking cookie token role:', error);
    return false;
  }
};

/**
 * Get user role from token in cookies
 * @returns {string|null} - User role or null if not found
 */
export const getRoleFromCookieToken = () => {
  try {
    const token = getCookie('jwt');
    if (!token) return null;

    const decoded = jwt_decode(token);
    return decoded.role;
  } catch (error) {
    console.error('Error getting role from cookie token:', error);
    return null;
  }
};

/**
 * Get token from cookies
 * @returns {string|null} - JWT token or null if not found
 */
export const getAuthToken = () => {
  return getCookie('jwt');
};

/**
 * Get refresh token from cookies
 * @returns {string|null} - Refresh token or null if not found
 */
export const getRefreshToken = () => {
  return getCookie('refreshToken');
};

const cookieHelper = {
  getCookie,
  cookieTokenHasRole,
  getRoleFromCookieToken,
  getAuthToken,
  getRefreshToken
};

export default cookieHelper;
