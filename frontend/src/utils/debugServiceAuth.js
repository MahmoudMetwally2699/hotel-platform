/**
 * Debug Service Provider Authentication
 * Helps debug authentication issues for service provider routes
 */

import cookieHelper from '../utils/cookieHelper';
import jwt_decode from 'jwt-decode';

const debugServiceAuth = () => {
  console.log('=== Service Provider Auth Debug ===');

  // Check tokens
  const token = cookieHelper.getAuthToken();
  const refreshToken = cookieHelper.getRefreshToken();

  console.log('Auth Token exists:', !!token);
  console.log('Refresh Token exists:', !!refreshToken);

  if (token) {
    try {
      const decoded = jwt_decode(token);
      console.log('Token decoded:', {
        userId: decoded.userId,
        role: decoded.role,
        serviceProviderId: decoded.serviceProviderId,
        hotelId: decoded.hotelId,
        exp: decoded.exp,
        isExpired: decoded.exp < Date.now() / 1000
      });
    } catch (error) {
      console.error('Error decoding token:', error);
    }
  }

  // Check localStorage as fallback
  const localToken = localStorage.getItem('token');
  if (localToken && localToken !== token) {
    console.log('LocalStorage token differs from cookie token');
    try {
      const decoded = jwt_decode(localToken);
      console.log('LocalStorage token decoded:', {
        userId: decoded.userId,
        role: decoded.role,
        serviceProviderId: decoded.serviceProviderId,
        hotelId: decoded.hotelId,
        exp: decoded.exp,
        isExpired: decoded.exp < Date.now() / 1000
      });
    } catch (error) {
      console.error('Error decoding localStorage token:', error);
    }
  }

  console.log('=== End Debug ===');
};

export default debugServiceAuth;
