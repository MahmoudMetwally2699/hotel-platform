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
  const cookies = document.cookie.split(';');
  for (let cookie of cookies) {
    const [cookieName, cookieValue] = cookie.trim().split('=');
    if (cookieName === name) {
      return decodeURIComponent(cookieValue);
    }
  }
  return null;
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
    return null;
  }
};

/**
 * Get token from cookies or localStorage as fallback
 * @returns {string|null} - JWT token or null if not found
 */
export const getAuthToken = () => {
  // First try to get from cookies (HTTP-only cookies can't be read by JS, but non-HTTP-only can)
  const cookieToken = getCookie('jwt');
  if (cookieToken) {
    return cookieToken;
  }

  // Fallback to localStorage
  const localToken = localStorage.getItem('token');
  if (localToken) {
    return localToken;
  }

  return null;
};

/**
 * Get refresh token from cookies or localStorage as fallback
 * @returns {string|null} - Refresh token or null if not found
 */
export const getRefreshToken = () => {
  // First try to get from cookies
  const cookieRefreshToken = getCookie('refreshToken');
  if (cookieRefreshToken) {
    return cookieRefreshToken;
  }

  // Fallback to localStorage
  const localRefreshToken = localStorage.getItem('refreshToken');
  if (localRefreshToken) {
    return localRefreshToken;
  }

  return null;
};

const cookieHelper = {
  getCookie,
  cookieTokenHasRole,
  getRoleFromCookieToken,
  getAuthToken,
  getRefreshToken
};

export default cookieHelper;
