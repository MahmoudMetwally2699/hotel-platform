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
    // First, check for and resolve any authentication conflicts
    const conflictResolved = resolveAuthConflicts();
    if (conflictResolved) {
    }

    // Check if we have Super Hotel authentication data
    const superHotelData = localStorage.getItem('superHotelData');
    const hasSuperHotelAuth = !!(hasSuperHotelCookie() && superHotelData);

    // Check if we're on a Super Hotel route OR have Super Hotel auth
    const isOnSuperHotelRoute = window.location.pathname.startsWith('/super-hotel-admin') || hasSuperHotelAuth;

    // Check if we have a valid token in cookies or localStorage
    // First, try localStorage (which we control completely)
    let token = localStorage.getItem('token');
    let storedUser = localStorage.getItem('user');

    // If on Super Hotel route, check Super Hotel auth instead
    if (isOnSuperHotelRoute) {
      const superHotelToken = localStorage.getItem('superHotelToken');
      if ((hasSuperHotelCookie() || superHotelToken) && superHotelData) {
        // Use the actual token from localStorage if available, otherwise use placeholder
        token = superHotelToken || 'superhotel-cookie-auth';
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

    // Check if this token is a Clerk token (which we should ignore)
    if (token && isClerkToken(token)) {
      token = null; // Ignore Clerk token
      cleanupClerkTokens(); // Clean up any Clerk tokens
    }

    // Check if we have user data in localStorage (already retrieved above)
    if (token && storedUser) {
      // Special handling for Super Hotel cookie authentication
      if (token === 'superhotel-cookie-auth') {
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

          if (decoded.exp > currentTime) {
            // Token is still valid, restore user state
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
              isAuthenticated: true,
              isLoading: false,
              error: null,
              role: userRole,
            };
          } else {
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
            localStorage.removeItem('user');
            localStorage.removeItem('token');
          }
        }
      } else {
        // We have user data but invalid token format - keep user data but mark as not authenticated
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
          localStorage.removeItem('user');
          localStorage.removeItem('token');
        }
      }
    }
  } catch (error) {
  }

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
      const response = await authService.login(email, password, role, hotelId);

      // Ensure the role is set correctly in the response
      // This fixes potential mismatches between the selected role in the form
      // and the role stored in the database
      if (response && response.data) {
        // Make sure role is properly set in the data object
        response.data.role = role;
      }

      return response;
    } catch (error) {
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
      const response = await authService.checkAuth();
      return response;
    } catch (error) {
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
    }
  },
  /* eslint-disable */
  extraReducers: (builder) => {
    builder.addCase(login.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(login.fulfilled, (state, action) => {
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

      // Debug the exact data we're getting
      // This will be removed in production

      state.error = null;
    });

    builder.addCase(login.rejected, (state, action) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;

      // Handle specific error cases
      const errorMessage = action.payload;

      // Check for inactive account errors
      if (errorMessage && (
        errorMessage.includes('account is inactive') ||
        errorMessage.includes('account has been deactivated') ||
        errorMessage.includes('deactivated') ||
        errorMessage.includes('checkout time has passed') ||
        errorMessage.includes('contact hotel reception') ||
        errorMessage.includes('contact the hotel reception')
      )) {
        // Import toast dynamically to avoid circular dependency
        import('react-hot-toast').then(({ toast }) => {
          if (errorMessage.includes('checkout time has passed')) {
            toast.error('Your account has been deactivated because your checkout time has passed. Please contact hotel reception to reactivate your account.', {
              duration: 8000,
              position: 'top-center',
            });
          } else if (errorMessage.includes('deactivated')) {
            // For any deactivation message, show the specific message from backend
            toast.error(errorMessage, {
              duration: 8000,
              position: 'top-center',
            });
          } else {
            toast.error('Your account is inactive. Please contact hotel reception to reactivate your account.', {
              duration: 6000,
              position: 'top-center',
            });
          }
        });
      }

      state.error = errorMessage;
      // Clear any stored tokens/session data on login failure
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    });

    builder.addCase(register.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(register.fulfilled, (state, action) => {
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
      }
      state.error = null;
    });

    builder.addCase(register.rejected, (state, action) => {
      state.isLoading = false;
      state.error = action.payload;
    });

    // Logout cases
    builder.addCase(logout.pending, (state) => {
      state.isLoading = true;
    });

    builder.addCase(logout.fulfilled, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
      state.error = null;
    });

    builder.addCase(logout.rejected, (state) => {
      state.isLoading = false;
      state.isAuthenticated = false;
      state.user = null;
      state.role = null;
    });

    // Fetch profile cases
    builder.addCase(fetchProfile.pending, (state) => {
      state.isLoading = true;
      state.error = null;
    });

    builder.addCase(fetchProfile.fulfilled, (state, action) => {
      state.isLoading = false;

      // Handle both data formats that might come from the API
      const responseData = action.payload.data || action.payload;

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

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        state.error = null;
      })      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        // Don't set error for profile fetch failures to prevent toast notifications
        // state.error = action.payload;
      })

      // Check auth cases
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;

        // Handle both data formats that might come from the API
        const responseData = action.payload.data || action.payload;

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

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';
      })      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.role = null;
        // Don't set error for auth check failures to prevent toast notifications
        // state.error = action.payload;
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
