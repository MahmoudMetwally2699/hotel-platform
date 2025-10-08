/**
 * Debug Service Provider Authentication
 * Helps debug authentication issues for service provider routes
 */

import cookieHelper from '../utils/cookieHelper';
import jwt_decode from 'jwt-decode';

const debugServiceAuth = () => {
  // ...existing code...

  // Check tokens
  const token = cookieHelper.getAuthToken();
  const refreshToken = cookieHelper.getRefreshToken();

  // ...existing code...

  if (token) {
    try {
      const decoded = jwt_decode(token);
      // ...existing code...
    } catch (error) {
      // ...existing code...
    }
  }

  // Check localStorage as fallback
  const localToken = localStorage.getItem('token');
  if (localToken && localToken !== token) {
    try {
      const decoded = jwt_decode(localToken);
      // ...existing code...
    } catch (error) {
      // ...existing code...
    }
  }

  // ...existing code...
};

export default debugServiceAuth;
