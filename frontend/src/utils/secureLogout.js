/**
 * Secure Logout Utility
 * Ensures complete session cleanup and prevents unauthorized access
 */

import { clearAllAuthData } from './authCleanup';

/**
 * Performs a secure logout by:
 * 1. Clearing all authentication data
 * 2. Invalidating any cached data
 * 3. Redirecting to login if on protected route
 * @param {Function} navigate - React Router navigate function
 * @param {string} currentPath - Current pathname
 */
export const performSecureLogout = (navigate, currentPath = '/') => {
  try {
    // 1. Clear all authentication data
    clearAllAuthData();

    // 2. Clear any additional session data
    sessionStorage.clear();

    // 3. Clear Redux state is handled by the logout action

    // 4. Clear any cached API data
    if (window.caches) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }

    // 5. Check if user is on a protected route and redirect
    const protectedRoutes = [
      '/hotels/',
      '/my-',
      '/profile',
      '/feedback',
      '/service/',
      '/hotel/',
      '/superadmin/',
      '/super-hotel-admin/'
    ];

    const isOnProtectedRoute = protectedRoutes.some(route =>
      currentPath.startsWith(route)
    );

    if (isOnProtectedRoute) {
      // Redirect to login with the attempted URL for after login redirect
      navigate('/login', {
        state: { from: currentPath },
        replace: true
      });
    } else {
      // If on a public route, redirect to home
      navigate('/', { replace: true });
    }

    // 6. Optional: Show logout success message
    // This could be handled by a toast notification

  } catch (error) {
    console.error('Error during secure logout:', error);
    // Even if there's an error, still navigate to login for security
    navigate('/login', { replace: true });
  }
};

/**
 * Checks if the current route requires authentication
 * @param {string} pathname - Current pathname
 * @returns {boolean} - Whether the route requires authentication
 */
export const isProtectedRoute = (pathname) => {
  const protectedRoutePatterns = [
    /^\/hotels\/[^/]+\/(categories|services)/,
    /^\/my-/,
    /^\/profile/,
    /^\/feedback/,
    /^\/service\//,
    /^\/hotel\//,
    /^\/superadmin\//,
    /^\/super-hotel-admin\//
  ];

  return protectedRoutePatterns.some(pattern => pattern.test(pathname));
};

/**
 * Enhanced token validation that checks expiration and format
 * @param {string} token - JWT token to validate
 * @returns {boolean} - Whether the token is valid
 */
export const isTokenValid = (token) => {
  if (!token) return false;

  try {
    // Check if token has 3 parts (header.payload.signature)
    const parts = token.split('.');
    if (parts.length !== 3) return false;

    // Decode payload to check expiration
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));

    // Check if token is expired
    const currentTime = Date.now() / 1000;
    if (payload.exp && payload.exp < currentTime) {
      return false;
    }

    return true;
  } catch (error) {
    return false;
  }
};

const secureLogoutUtils = {
  performSecureLogout,
  isProtectedRoute,
  isTokenValid
};

export default secureLogoutUtils;
