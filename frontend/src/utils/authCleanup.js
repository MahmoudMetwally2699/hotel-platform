/**
 * Authentication Cleanup Utilities
 * Provides comprehensive methods to clear authentication data
 */

/**
 * Get cookie value by name
 */
const getCookie = (name) => {
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
 * Check if Super Hotel cookie exists
 */
export const hasSuperHotelCookie = () => {
  return !!getCookie('superHotelJwt');
};

/**
 * Clear all authentication data from localStorage
 * This should be called on logout or when authentication conflicts occur
 */
export const clearAllAuthData = () => {
  // ...existing code...

  // Regular authentication data
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  // Super Hotel authentication data (cookies handled by server)
  localStorage.removeItem('superHotelData');

  // Any other auth-related data that might exist
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('role');

  // ...existing code...
};

/**
 * Clear only regular user authentication data (keep Super Hotel if exists)
 */
export const clearRegularAuthData = () => {
  // ...existing code...

  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  // ...existing code...
};

/**
 * Clear only Super Hotel authentication data (keep regular user if exists)
 */
export const clearSuperHotelAuthData = () => {
  // ...existing code...

  // Clear localStorage data (cookies are handled by server)
  localStorage.removeItem('superHotelData');
  localStorage.removeItem('superHotelToken'); // Also clear token fallback

  // ...existing code...
};

/**
 * Check what authentication data currently exists
 */
export const getAuthDataStatus = () => {
  const regular = {
    hasToken: !!localStorage.getItem('token'),
    hasUser: !!localStorage.getItem('user'),
    hasRefreshToken: !!localStorage.getItem('refreshToken')
  };

  const superHotel = {
    hasData: !!localStorage.getItem('superHotelData'),
    hasCookie: hasSuperHotelCookie()
  };

  return {
    regular,
    superHotel,
    hasAnyAuth: regular.hasToken || regular.hasUser || superHotel.hasCookie || superHotel.hasData
  };
};

/**
 * Detect authentication conflicts (multiple auth types present)
 */
export const detectAuthConflicts = () => {
  const status = getAuthDataStatus();
  const hasRegularAuth = status.regular.hasToken || status.regular.hasUser;
  const hasSuperHotelAuth = status.superHotel.hasCookie || status.superHotel.hasData;

  const conflict = hasRegularAuth && hasSuperHotelAuth;

  // ...existing code...

  return {
    hasConflict: conflict,
    hasRegularAuth,
    hasSuperHotelAuth,
    status
  };
};

/**
 * Resolve authentication conflicts based on current route
 */
export const resolveAuthConflicts = (currentPath = window.location.pathname) => {
  const conflicts = detectAuthConflicts();

  if (!conflicts.hasConflict) {
    return false;
  }

  // If on Super Hotel route, clear regular auth and keep Super Hotel
  if (currentPath.startsWith('/super-hotel-admin')) {
    clearRegularAuthData();
    return true;
  }

  // If on any other route, clear Super Hotel auth and keep regular
  clearSuperHotelAuthData();
  return true;
};
