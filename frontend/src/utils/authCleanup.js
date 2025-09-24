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
  console.log('🧹 Clearing all authentication data...');

  // Regular authentication data
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  // Super Hotel authentication data (cookies handled by server)
  localStorage.removeItem('superHotelData');

  // Any other auth-related data that might exist
  localStorage.removeItem('isAuthenticated');
  localStorage.removeItem('role');

  console.log('✅ All authentication data cleared');
};

/**
 * Clear only regular user authentication data (keep Super Hotel if exists)
 */
export const clearRegularAuthData = () => {
  console.log('🧹 Clearing regular authentication data...');

  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');

  console.log('✅ Regular authentication data cleared');
};

/**
 * Clear only Super Hotel authentication data (keep regular user if exists)
 */
export const clearSuperHotelAuthData = () => {
  console.log('🧹 Clearing Super Hotel authentication data...');

  // Clear localStorage data (cookies are handled by server)
  localStorage.removeItem('superHotelData');
  localStorage.removeItem('superHotelToken'); // Also clear token fallback

  console.log('✅ Super Hotel authentication data cleared');
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

  if (conflict) {
    console.warn('⚠️ Authentication conflict detected:', {
      regular: status.regular,
      superHotel: status.superHotel
    });
  }

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
    console.log('✅ No authentication conflicts detected');
    return false;
  }

  console.log('🔧 Resolving authentication conflicts...');

  // If on Super Hotel route, clear regular auth and keep Super Hotel
  if (currentPath.startsWith('/super-hotel-admin')) {
    console.log('📍 On Super Hotel route - clearing regular auth data');
    clearRegularAuthData();
    return true;
  }

  // If on any other route, clear Super Hotel auth and keep regular
  console.log('📍 On regular route - clearing Super Hotel auth data');
  clearSuperHotelAuthData();
  return true;
};
