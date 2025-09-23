/**
 * Auth Slice
 * Manages authentication state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';
import { cleanupClerkTokens, isClerkToken } from '../../utils/cleanupClerkTokens';
import { resolveAuthConflicts, hasSuperHotelCookie } from '../../utils/authCleanup';

// Auth service is already instantiated in the imported module

// Helper function to get initial state with localStorage backup
const getInitialAuthState = () => {
  try {
    console.log('🔍 Checking authentication state on app init:');
    console.log('🔍 All localStorage keys:', Object.keys(localStorage));
    console.log('🔍 localStorage.token:', localStorage.getItem('token'));
    console.log('🔍 localStorage.superHotelData:', localStorage.getItem('superHotelData'));
    console.log('🔍 superHotelCookie:', hasSuperHotelCookie() ? 'Present' : 'Missing');

    // First, check for and resolve any authentication conflicts
    const conflictResolved = resolveAuthConflicts();
    if (conflictResolved) {
      console.log('🔧 Authentication conflicts resolved, rechecking state...');
    }

    // Check if we have Super Hotel authentication data
    const superHotelData = localStorage.getItem('superHotelData');
    const hasSuperHotelAuth = !!(hasSuperHotelCookie() && superHotelData);

    // Check if we're on a Super Hotel route OR have Super Hotel auth
    const isOnSuperHotelRoute = window.location.pathname.startsWith('/super-hotel-admin') || hasSuperHotelAuth;
    console.log('🔍 Is on Super Hotel route:', isOnSuperHotelRoute);
    console.log('🔍 Has Super Hotel Auth:', hasSuperHotelAuth);

    // Check if we have a valid token in cookies or localStorage
    // First, try localStorage (which we control completely)
    let token = localStorage.getItem('token');
    let storedUser = localStorage.getItem('user');

    // If on Super Hotel route, check Super Hotel auth instead
    if (isOnSuperHotelRoute) {
      if (hasSuperHotelCookie() && superHotelData) {
        console.log('🏨 Using Super Hotel authentication');
        // For Super Hotel, we can't access the cookie value directly from JavaScript
        // We'll use a placeholder token and let the backend validate the cookie
        token = 'superhotel-cookie-auth';
        storedUser = superHotelData;
      }
    }

    // If no token in localStorage, check cookies for our specific JWT token
    if (!token) {
      // Look specifically for the 'jwt' cookie (our application's token, not Clerk's)
      const cookies = document.cookie.split(';');
      for (let cookie of cookies) {
        const [name, value] = cookie.trim().split('=');
        if (name === 'jwt') {
          token = decodeURIComponent(value);
          break;
        }
      }
    }
      console.log('🔍 Checking authentication state on app init:');
    console.log('Token found:', token ? 'Yes (length: ' + token.length + ')' : 'No');
    console.log('🔍 Authentication method:', isOnSuperHotelRoute ? 'Super Hotel' : 'Regular');
    console.log('🔍 Token source:', isOnSuperHotelRoute && token ? 'superHotelCookie' : 'regular token');

    // Check if this token is a Clerk token (which we should ignore)
    if (token && isClerkToken(token)) {
      console.warn('⚠️ Detected Clerk token, ignoring and checking localStorage only');
      token = null; // Ignore Clerk token
      cleanupClerkTokens(); // Clean up any Clerk tokens
    }

    console.log('Token format check:', token ? (token === 'superhotel-cookie-auth' ? 'Super Hotel Cookie Auth' : token.split('.').length === 3 ? 'Valid JWT format' : 'Invalid JWT format') : 'No token');

    // Check if we have user data in localStorage (already retrieved above)
    console.log('Stored user found:', storedUser ? 'Yes' : 'No');
      if (token && storedUser) {
      // Special handling for Super Hotel cookie authentication
      if (token === 'superhotel-cookie-auth') {
        console.log('🏨 Super Hotel cookie authentication detected');
        const userData = JSON.parse(storedUser);

        return {
          user: userData,
          isAuthenticated: true,
          isLoading: false,
          error: null,
          role: 'superHotel',
        };
      }

      // Check if this is a valid JWT token (should have 3 parts separated by dots)
      const tokenParts = token.split('.');

      if (tokenParts.length === 3) {
        // Try to decode JWT token to check if it's still valid
        try {
          // Properly decode JWT token
          const base64Url = tokenParts[1];
          const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
          const decoded = JSON.parse(atob(base64));
          const currentTime = Date.now() / 1000;

          console.log('🔍 Token validation:', {
            tokenExpiry: new Date(decoded.exp * 1000).toLocaleString(),
            currentTime: new Date(currentTime * 1000).toLocaleString(),
            isValid: decoded.exp > currentTime,
            tokenRole: decoded.role,
            userId: decoded.id
          });

          if (decoded.exp > currentTime) {
            // Token is still valid, restore user state
            const userData = JSON.parse(storedUser);
            console.log('✅ Restoring authentication state from localStorage:', userData);

            // Determine role based on authentication type
            let userRole = 'guest'; // default
            if (isOnSuperHotelRoute) {
              userRole = 'superHotel';
            } else {
              userRole = userData.role || decoded.role || 'guest';
            }

            console.log('🔍 Role assignment:', {
              isOnSuperHotelRoute,
              finalRole: userRole,
              userDataRole: userData.role,
              decodedRole: decoded.role
            });

            return {
              user: userData,
              isAuthenticated: true,
              isLoading: false,
              error: null,
              role: userRole,
            };
          } else {
            console.warn('⚠️ JWT token expired but keeping user data - refresh mechanism will handle this');
            // Don't clear localStorage immediately - let the refresh token mechanism handle it
            const userData = JSON.parse(storedUser);

            // Determine role based on authentication type
            let userRole = 'guest'; // default
            if (isOnSuperHotelRoute) {
              userRole = 'superHotel';
            } else {
              userRole = userData.role || decoded.role || 'guest';
            }

            return {
              user: userData,
              isAuthenticated: false, // Mark as not authenticated but keep user data
              isLoading: false,
              error: null,
              role: userRole,
            };
          }
        } catch (error) {
          console.warn('⚠️ Error processing JWT token but keeping user data:', error.message);
          // Don't clear localStorage on token errors - let authentication flow handle verification
          try {
            const userData = JSON.parse(storedUser);
            return {
              user: userData,
              isAuthenticated: false,
              isLoading: false,
              error: null,
              role: userData.role || 'guest',
            };
          } catch (parseError) {
            console.warn('❌ Cannot parse user data, will clear corrupted data');
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } else {
        console.warn('⚠️ Invalid token format (not JWT) - token:', token.substring(0, 20) + '...');
        console.warn('⚠️ This appears to be a Clerk or other third-party token, not our JWT');

        // We have user data but invalid token format - keep user data but mark as not authenticated
        try {
          const userData = JSON.parse(storedUser);
          console.log('⚠️ Keeping user data despite invalid token format');
          return {
            user: userData,
            isAuthenticated: false,
            isLoading: false,
            error: null,
            role: userData.role || 'guest',
          };
        } catch (parseError) {
          console.warn('❌ Cannot parse user data, will clear corrupted data');
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
  } catch (error) {
    console.warn('❌ Error reading stored auth data:', error);
  }

  console.log('🔄 Using default empty auth state');
  // Default empty state
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    error: null,
    role: null,
  };
};

// Initial state with localStorage restoration
const initialState = getInitialAuthState();

// Async thunks for auth actions
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, role, hotelId }, { rejectWithValue }) => {
    try {
      console.log('Login attempt with:', { email, role, hotelId });
      const response = await authService.login(email, password, role, hotelId);
      console.log('Login response:', response);

      // Ensure the role is set correctly in the response
      // This fixes potential mismatches between the selected role in the form
      // and the role stored in the database
      if (response && response.data) {
        console.log('Setting role in response data to:', role);
        // Make sure role is properly set in the data object
        response.data.role = role;
      }

      return response;
    } catch (error) {
      console.error('Login error:', error.response?.data);
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ userData, role }, { rejectWithValue }) => {
    try {
      const response = await authService.register(userData, role);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Logout failed');
    }
  }
);

export const fetchProfile = createAsyncThunk(
  'auth/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getUserProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/checkAuth',
  async (_, { rejectWithValue }) => {
    try {
      console.log('🔍 Checking authentication...');
      const response = await authService.checkAuth();
      console.log('✅ Auth check successful');
      return response;
    } catch (error) {
      console.log('❌ Auth check failed - redirecting to login');
      return rejectWithValue(error.response?.data?.message || 'Authentication check failed');
    }
  }
);

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.role = action.payload.role;
      state.isLoading = false;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
      state.isLoading = false;
      // Note: Cookies are cleared by the server during logout
    },
    setError: (state, action) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    clearError: (state) => {
      state.error = null;
    },    clearLoading: (state) => {
      state.isLoading = false;
    },
    restoreFromLocalStorage: (state, action) => {
      const { user, role, isAuthenticated } = action.payload;
      state.user = user;
      state.role = role;
      state.isAuthenticated = isAuthenticated;
      state.isLoading = false;
      state.error = null;
      console.log('✅ Authentication state restored from localStorage');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;

        // Handle both data formats that might come from the API
        const responseData = action.payload.data || action.payload;

        // Extract the actual user object (it might be nested under 'user' property)
        const userData = responseData.user || responseData;
        state.user = userData;

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        // Store user data in localStorage for persistence across tab refreshes
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User data stored in localStorage for persistence');

        // Debug the exact data we're getting
        console.log('Login succeeded! Full payload:', action.payload);
        console.log('Response data extracted:', responseData);
        console.log('User data extracted:', userData);
        console.log('Role set to:', state.role);

        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.error = action.payload;
        // Clear any stored tokens/session data on login failure
        localStorage.removeItem('token');
        localStorage.removeItem('user');
      })

      // Register cases
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;

        // Check for token in both possible locations
        const token = action.payload.token || action.payload.data?.token;

        if (token) {
          state.isAuthenticated = true;

          // Handle both data formats that might come from the API
          const responseData = action.payload.data || action.payload;

          // Extract the actual user object (it might be nested under 'user' property)
          const userData = responseData.user || responseData;
          state.user = userData;
          state.role = userData.role;

          // Store user data in localStorage for persistence
          localStorage.setItem('user', JSON.stringify(userData));
          console.log('✅ User registered and logged in automatically');
        }
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout cases
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
      })      // Fetch profile cases
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;

        // DEBUG: Log the complete action payload
        console.log('🐛 fetchProfile.fulfilled - Complete action:', action);
        console.log('🐛 fetchProfile.fulfilled - action.payload:', action.payload);
        console.log('🐛 fetchProfile.fulfilled - action.payload.data:', action.payload.data);

        // Handle both data formats that might come from the API
        const responseData = action.payload.data || action.payload;

        // DEBUG: Log the response data processing
        console.log('🐛 fetchProfile.fulfilled - responseData:', responseData);
        console.log('🐛 fetchProfile.fulfilled - responseData.user:', responseData.user);
        console.log('🐛 fetchProfile.fulfilled - responseData.role:', responseData.role);

        // FIXED: Handle the nested response structure correctly
        // The API returns { success: true, data: { user_object } }
        // But sometimes the entire response gets stored as action.payload
        let userData;
        if (responseData.success && responseData.data) {
          // Case 1: Full API response structure
          userData = responseData.data;
        } else if (responseData.user) {
          // Case 2: Data is nested under 'user' property
          userData = responseData.user;
        } else {
          // Case 3: Data is the responseData itself
          userData = responseData;
        }        state.user = userData;
        state.isAuthenticated = true;

        // Store user data in localStorage for persistence across tab refreshes
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('✅ User data stored in localStorage from fetchProfile');

        // DEBUG: Log the user data processing
        console.log('🐛 fetchProfile.fulfilled - extracted userData:', userData);
        console.log('🐛 fetchProfile.fulfilled - userData.role:', userData.role);
        console.log('🐛 fetchProfile.fulfilled - typeof userData.role:', typeof userData.role);
        console.log('🐛 fetchProfile.fulfilled - userData.hotelId:', userData.hotelId);
        console.log('🐛 fetchProfile.fulfilled - userData.selectedHotelId:', userData.selectedHotelId);
        console.log('🐛 fetchProfile.fulfilled - userData._id:', userData._id);
        console.log('🐛 fetchProfile.fulfilled - ALL userData properties:', Object.keys(userData));

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        console.log('✅ Profile fetched! User:', userData);
        console.log('✅ Role set to:', state.role);
        console.log('✅ Hotel ID in user data:', userData.hotelId);
        state.error = null;
      })      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        // Don't set error for profile fetch failures to prevent toast notifications
        // state.error = action.payload;
        console.log('❌ Profile fetch failed - not setting error in state to prevent toast');
      })

      // Check auth cases
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;

        // DEBUG: Log the complete action payload
        console.log('🐛 checkAuth.fulfilled - Complete action:', action);
        console.log('🐛 checkAuth.fulfilled - action.payload:', action.payload);
        console.log('🐛 checkAuth.fulfilled - action.payload.data:', action.payload.data);

        // Handle both data formats that might come from the API
        const responseData = action.payload.data || action.payload;

        // DEBUG: Log the response data processing
        console.log('🐛 checkAuth.fulfilled - responseData:', responseData);
        console.log('🐛 checkAuth.fulfilled - responseData.user:', responseData.user);
        console.log('🐛 checkAuth.fulfilled - responseData.role:', responseData.role);

        // FIXED: Handle the nested response structure correctly
        // The API returns { success: true, data: { user_object } }
        // Super Hotel API returns { status: 'success', data: { superHotel: superHotel_object } }
        // But sometimes the entire response gets stored as action.payload
        let userData;
        if (responseData.success && responseData.data) {
          // Case 1: Regular API response structure { success: true, data: user_object }
          userData = responseData.data;
        } else if (responseData.status === 'success' && responseData.data && responseData.data.superHotel) {
          // Case 2: Super Hotel API response structure { status: 'success', data: { superHotel: superHotel_object } }
          userData = responseData.data.superHotel;
          userData.role = 'superHotel'; // Ensure Super Hotel role is set
        } else if (responseData.user) {
          // Case 3: Data is nested under 'user' property
          userData = responseData.user;
        } else {
          // Case 4: Data is the responseData itself
          userData = responseData;
        }

        state.user = userData;

        // DEBUG: Log the user data processing
        console.log('🐛 checkAuth.fulfilled - extracted userData:', userData);
        console.log('🐛 checkAuth.fulfilled - userData.role:', userData.role);
        console.log('🐛 checkAuth.fulfilled - typeof userData.role:', typeof userData.role);

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        console.log('✅ Auth check succeeded! User:', userData);
        console.log('✅ Role set to:', state.role);
      })      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        // Don't set error for auth check failures to prevent toast notifications
        // state.error = action.payload;
        console.log('❌ Auth check rejected - user not authenticated');
      });
  }
});

// Export actions and reducer
export const { setCredentials, clearCredentials, setError, clearError, clearLoading, restoreFromLocalStorage } = authSlice.actions;

export default authSlice.reducer;

// Selectors
export const selectCurrentUser = (state) => state.auth.user;
export const selectIsAuthenticated = (state) => state.auth.isAuthenticated;
export const selectAuthRole = (state) => state.auth.role;
export const selectAuthError = (state) => state.auth.error;
export const selectAuthLoading = (state) => state.auth.isLoading;

// Additional selectors and thunks for backward compatibility
export const selectUserProfile = (state) => state.auth.user;
export const fetchUserProfile = fetchProfile;
