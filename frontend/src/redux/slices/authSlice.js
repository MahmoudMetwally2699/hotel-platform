/**
 * Auth Slice
 * Manages authentication state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

// Auth service is already instantiated in the imported module

// Helper function to get initial state (empty since we use cookies)
const getInitialAuthState = () => {
  // Since we're using cookies, we don't restore from localStorage
  // The checkAuth action will handle restoring user data from the server
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false, // Set to false initially to prevent stuck loading state
    error: null,
    role: null,
  };
};

// Initial state with localStorage restoration
const initialState = getInitialAuthState();

// Async thunks for auth actions
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password, role }, { rejectWithValue }) => {
    try {
      console.log('Login attempt with:', { email, role });
      const response = await authService.login(email, password, role);
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
    },
    clearLoading: (state) => {
      state.isLoading = false;
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

        // Debug the exact data we're getting
        console.log('Login succeeded! Full payload:', action.payload);
        console.log('Response data extracted:', responseData);
        console.log('User data extracted:', userData);
        console.log('Role set to:', state.role);

        state.error = null;
      })      .addCase(login.rejected, (state, action) => {
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
        if (action.payload.token) {
          state.isAuthenticated = true;

          // Handle both data formats that might come from the API
          const responseData = action.payload.data || action.payload;

          // Extract the actual user object (it might be nested under 'user' property)
          const userData = responseData.user || responseData;
          state.user = userData;
          state.role = userData.role;
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
        }

        state.user = userData;
        state.isAuthenticated = true;

        // DEBUG: Log the user data processing
        console.log('🐛 fetchProfile.fulfilled - extracted userData:', userData);
        console.log('🐛 fetchProfile.fulfilled - userData.role:', userData.role);
        console.log('🐛 fetchProfile.fulfilled - typeof userData.role:', typeof userData.role);

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        console.log('✅ Profile fetched! User:', userData);
        console.log('✅ Role set to:', state.role);
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
export const { setCredentials, clearCredentials, setError, clearError, clearLoading } = authSlice.actions;

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
