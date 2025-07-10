/**
 * Auth Slice
 * Manages authentication state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService from '../../services/auth.service';

// Auth service is already instantiated in the imported module

// Helper function to get initial state from localStorage
const getInitialAuthState = () => {
  try {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      const userData = JSON.parse(user);
      return {
        user: userData,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        role: userData.role,
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
    // Clear corrupted data
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

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

// Create the auth slice
const authSlice = createSlice({
  name: 'auth',
  initialState,  reducers: {
    setCredentials: (state, action) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.role = action.payload.role;
    },
    clearCredentials: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.error = null;
      // Also clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    },
    hydrateAuth: (state) => {
      // Restore auth state from localStorage
      try {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('user');

        if (token && user) {
          const userData = JSON.parse(user);
          state.user = userData;
          state.isAuthenticated = true;
          state.role = userData.role;
          state.error = null;
        }
      } catch (error) {
        console.error('Error hydrating auth state:', error);
        state.user = null;
        state.isAuthenticated = false;
        state.role = null;
      }
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login cases
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;

        // Handle both data formats that might come from the API
        const userData = action.payload.data || action.payload;
        state.user = userData;

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        // Debug the exact data we're getting
        console.log('Login succeeded! Full payload:', action.payload);
        console.log('User data extracted:', userData);
        console.log('Role set to:', state.role);

        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
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
          state.user = action.payload.data;
          state.role = action.payload.data.role;
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
      })

      // Fetch profile cases
      .addCase(fetchProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.isLoading = false;

        // Handle both data formats that might come from the API
        const userData = action.payload.data || action.payload;
        state.user = userData;
        state.isAuthenticated = true;

        // Extract role, ensuring it exists
        state.role = userData.role || 'guest';

        console.log('Profile fetched! User:', userData);
        console.log('Role set to:', state.role);

        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setCredentials, clearCredentials, hydrateAuth, setError } = authSlice.actions;

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
