/**
 * Token Helper Utility
 * Functions for working with JWT tokens
 */

import jwt_decode from 'jwt-decode';

/**
 * Get a cookie value by name
 * @param {string} name - The name of the cookie to get
 * @returns {string|null} - Cookie value or null if not found
 */
const getCookie = (name) => {
  const match = document.cookie.match(new RegExp('(^|;\\s*)(' + name + ')=([^;]*)'));
  return match ? decodeURIComponent(match[3]) : null;
};

/**
 * Check if the current token is valid and has a specific role
 * @param {string} requiredRole - The role to check for
 * @returns {boolean} - Whether the token has the required role
 */
export const tokenHasRole = (requiredRole) => {
  try {
    const token = getCookie('jwt');
    if (!token) return false;

    const decoded = jwt_decode(token);

    // First check direct role match
    if (decoded.role === requiredRole) return true;

    // Some APIs use id field, others might use different fields
    return false;
  } catch (error) {
    return false;
  }
};

/**
 * Get user role from token
 * @returns {string|null} - User role or null if not found
 */
export const getRoleFromToken = () => {
  try {
    const token = getCookie('jwt');
    if (!token) return null;

    const decoded = jwt_decode(token);
    return decoded.role;
  } catch (error) {
    return null;
  }
};

const tokenHelper = {
  tokenHasRole,
  getRoleFromToken,
  getCookie
};

export default tokenHelper;
