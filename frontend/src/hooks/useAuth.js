/**
 * useAuth hook
 * Custom hook for authentication state and operations
 * Enhanced with better token validation and role checking
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import jwt_decode from 'jwt-decode';
import { selectCurrentUser, selectIsAuthenticated, selectAuthRole, fetchProfile, logout, restoreFromLocalStorage } from '../redux/slices/authSlice';
// import socketService from '../services/socket.service';
import cookieHelper from '../utils/cookieHelper';

export const useAuth = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const currentUser = useSelector(selectCurrentUser);
  const isAuthenticated = useSelector(selectIsAuthenticated);

  // Debug auth state immediately when hook is called
  console.log('🔍 useAuth hook called - Current state:', {
    isAuthenticated,
    currentUser: currentUser ? 'Present' : 'Missing',
    currentUserId: currentUser?._id,
    currentUserRole: currentUser?.role
  });
  const role = useSelector(selectAuthRole);

  // Track if we've already checked authentication to prevent loops
  const [authChecked, setAuthChecked] = React.useState(false);
  /**
   * Initialize authentication state on component mount
   */
  useEffect(() => {
    // Prevent multiple authentication checks
    if (authChecked) return;

    const token = cookieHelper.getAuthToken() || localStorage.getItem('token');

    if (token) {
      try {
        // Check token expiration
        const decoded = jwt_decode(token);
        const currentTime = Date.now() / 1000;

        console.log('Token validation check:', {
          decodedToken: decoded,
          tokenExpiration: new Date(decoded.exp * 1000).toLocaleString(),
          currentTime: new Date(currentTime * 1000).toLocaleString(),
          isExpired: decoded.exp < currentTime,
          tokenRole: decoded.role || 'not_found_in_token'
        });

        if (decoded.exp < currentTime) {
          // Token is expired, log out
          console.warn('Token expired, logging out');
          setAuthChecked(true);
          dispatch(logout());
          navigate('/login');        } else if (!isAuthenticated) {
          // Token is valid but user might not be authenticated in Redux
          // Check if we have user data in localStorage first
          const storedUser = localStorage.getItem('user');
          console.log('🔍 useAuth - Checking stored user data:', storedUser ? 'Found' : 'Not found');

          if (storedUser) {
            try {
              const userData = JSON.parse(storedUser);
              console.log('✅ Restoring authentication from localStorage:', userData.email);
              console.log('🔍 useAuth - Stored user data:', userData);
                // Manually update Redux state to restore authentication
              // This is faster than making an API call
              dispatch(restoreFromLocalStorage({
                user: userData,
                role: userData.role || decoded.role,
                isAuthenticated: true
              }));              setAuthChecked(true);
              // socketService.init(dispatch, token, userData.role || decoded.role);
              return;
            } catch (error) {
              console.warn('Invalid stored user data, fetching from server:', error);
            }
          }

          // No stored user data or invalid, fetch profile from server
          console.log('🔄 useAuth - Token valid, fetching profile from server...');
          dispatch(fetchProfile())
            .unwrap()
            .then(data => {
              console.log('✅ useAuth - Profile fetch successful:', data);
              setAuthChecked(true);
              // Initialize socket connection only after profile is loaded
              // socketService.init(dispatch, token, data?.role || decoded.role);
            })
            .catch(error => {
              console.error('❌ useAuth - Profile fetch failed:', error);
              setAuthChecked(true);
              // If profile fetch fails but token is valid, try to recover
              if (decoded.role) {
                console.log('🔄 useAuth - Attempting recovery with token data');
                // We could set some basic user data from the token here if needed
              } else {
                // No way to recover, log out
                console.log('❌ useAuth - No way to recover, logging out');
                dispatch(logout());
                navigate('/login');
              }
            });
        } else {
          // We're authenticated, ensure socket is connected
          console.log('✅ useAuth - Already authenticated, ensuring socket connection');
          console.log('🔍 useAuth - Current user in Redux:', currentUser);
          console.log('🔍 useAuth - Is authenticated:', isAuthenticated);
          console.log('🔍 useAuth - Role:', role);
          setAuthChecked(true);
          // socketService.init(dispatch, token, decoded.role || role);
        }
      } catch (error) {
        console.error('Token validation error:', error);
        setAuthChecked(true);
        // Invalid token, log out
        dispatch(logout());
        navigate('/login');
      }
    } else {
      // No token found
      setAuthChecked(true);
    }    // Cleanup function
    return () => {
      // socketService.disconnect();
    };
  }, [dispatch, isAuthenticated, navigate, role, currentUser, authChecked]);

  /**
   * Handle user logout
   */
  const handleLogout = () => {    dispatch(logout())
      .unwrap()
      .then(() => {
        // Disconnect socket and redirect to login
        // socketService.disconnect();
        navigate('/login');
      })
      .catch((error) => {
        console.error('Logout failed', error);
      });
  };
  /**
   * Check if user has required role
   * @param {Array<string>} allowedRoles - Array of allowed roles
   * @returns {boolean} - Whether user has required role
   */  const hasRole = (allowedRoles) => {
    console.log('🔍 hasRole check in useAuth:', { userRole: role, allowedRoles });
    console.log('🔍 Current auth state:', { isAuthenticated, role, currentUser });

    // If not authenticated, don't even bother checking
    if (!isAuthenticated) {
      console.log('❌ Not authenticated, role check failed');
      return false;
    }

    // If no role in Redux state, try to get it from token
    if (!role) {
      console.log('⚠️ No role in Redux state, checking token...');
      try {
        const token = cookieHelper.getAuthToken();
        if (token) {
          const decoded = jwt_decode(token);
          if (decoded.role) {
            console.log('🔍 Found role in token:', decoded.role);

            // Check with token role
            if (Array.isArray(allowedRoles)) {
              const result = allowedRoles.includes(decoded.role);
              console.log('🔍 Token role array check result:', result);
              return result;
            } else {
              const result = decoded.role === allowedRoles;
              console.log('🔍 Token role direct match result:', result);
              return result;
            }
          }
        }
      } catch (error) {
        console.error('❌ Failed to extract role from token:', error);
      }

      console.log('❌ No role found in Redux or token');
      return false;
    }

    // We have a role in Redux state, check normally
    if (Array.isArray(allowedRoles)) {
      const result = allowedRoles.includes(role);
      console.log('🔍 Array check result:', { role, allowedRoles, result });
      return result;
    }

    const result = role === allowedRoles;
    console.log('🔍 Direct match result:', { role, allowedRoles, result });
    return result;
  };
  /**
   * Checks token validity and returns decoded token if valid
   * @returns {Object|null} - Decoded token or null if invalid
   */
  const checkToken = () => {
    try {
      const token = cookieHelper.getAuthToken();
      if (!token) return null;

      const decoded = jwt_decode(token);
      const currentTime = Date.now() / 1000;

      if (decoded.exp < currentTime) {
        console.warn('Token expired on check:', new Date(decoded.exp * 1000).toLocaleString());
        return null;
      }

      return decoded;
    } catch (error) {
      console.error('Token check error:', error);
      return null;
    }
  };
  /**
   * Refreshes authentication state from cookies
   * Useful when token is updated but Redux state might be stale
   */
  const refreshAuthState = () => {
    try {
      const decoded = checkToken();
      if (decoded && !isAuthenticated) {
        console.log('Refreshing auth state from token');
        dispatch(fetchProfile());
      }
    } catch (error) {
      console.error('Error refreshing auth state:', error);
    }
  };

  return {
    currentUser,
    isAuthenticated,
    role,
    logout: handleLogout,
    hasRole,
    checkToken,
    refreshAuthState
  };
};

export default useAuth;
