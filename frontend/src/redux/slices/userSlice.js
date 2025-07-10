/**
 * User Slice
 * Manages user data (not related to authentication) in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import userService from '../../services/user.service';

// Initial state
const initialState = {
  users: [],
  currentUser: null,
  stats: {
    totalUsers: 0,
    activeUsers: 0,
    inactiveUsers: 0,
    newUsersToday: 0,
    usersByRole: {
      GUEST: 0,
      HOTEL_ADMIN: 0,
      SERVICE_PROVIDER: 0,
      SUPER_ADMIN: 0,
    },
  },
  isLoading: false,
  error: null,
};

// Async thunks for user actions
export const fetchUsers = createAsyncThunk(
  'user/fetchUsers',
  async ({ page = 1, limit = 10, role = null, searchTerm = null } = {}, { rejectWithValue }) => {
    try {
      const queryParams = { page, limit };
      if (role) queryParams.role = role;
      if (searchTerm) queryParams.search = searchTerm;

      const response = await userService.getAllUsers(queryParams);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch users');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'user/fetchUserById',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.getUserById(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user details');
    }
  }
);

export const fetchUserStats = createAsyncThunk(
  'user/fetchUserStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getUserStats();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user statistics');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'user/updateUserStatus',
  async ({ userId, status }, { rejectWithValue }) => {
    try {
      let response;
      if (status === 'ACTIVE') {
        response = await userService.activateUser(userId);
      } else {
        response = await userService.deactivateUser(userId);
      }
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update user status');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'user/deleteUser',
  async (userId, { rejectWithValue }) => {
    try {
      await userService.deleteUser(userId);
      return userId; // Return the id for filtering from state
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete user');
    }
  }
);

// Create the user slice
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    clearUserState: (state) => {
      state.currentUser = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch users cases
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = action.payload.users;
        state.error = null;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch user by ID cases
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentUser = action.payload;
        state.error = null;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch user stats cases
      .addCase(fetchUserStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
        state.error = null;
      })
      .addCase(fetchUserStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update user status cases
      .addCase(updateUserStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        state.isLoading = false;

        // Update user in users array
        const index = state.users.findIndex(user => user._id === action.payload._id);
        if (index !== -1) {
          state.users[index] = action.payload;
        }

        // Update currentUser if it's the same user
        if (state.currentUser?._id === action.payload._id) {
          state.currentUser = action.payload;
        }

        state.error = null;
      })
      .addCase(updateUserStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete user cases
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.users = state.users.filter(user => user._id !== action.payload);

        // Clear currentUser if it's the deleted user
        if (state.currentUser?._id === action.payload) {
          state.currentUser = null;
        }

        state.error = null;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setCurrentUser, clearUserState } = userSlice.actions;

export default userSlice.reducer;

// Selectors
export const selectAllUsers = (state) => state.user.users;
export const selectCurrentUser = (state) => state.user.currentUser;
export const selectUserStats = (state) => state.user.stats;
export const selectUserLoading = (state) => state.user.isLoading;
export const selectUserError = (state) => state.user.error;
export const selectUsersByRole = (state, role) =>
  state.user.users.filter(user => user.role === role);
export const selectUserProfile = (state) => state.user.currentUser;

// Additional selectors and functions for backward compatibility
export const selectUsers = (state) => state.user.users;
export const selectUsersLoading = (state) => state.user.isLoading;

// Additional async thunks for user management
export const fetchHotelAdmins = createAsyncThunk(
  'user/fetchHotelAdmins',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getAllUsers({ role: 'HOTEL_ADMIN' });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel admins');
    }
  }
);

export const approveUser = createAsyncThunk(
  'user/approveUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.activateUser(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve user');
    }
  }
);

export const suspendUser = createAsyncThunk(
  'user/suspendUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.deactivateUser(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to suspend user');
    }
  }
);

export const activateUser = createAsyncThunk(
  'user/activateUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.activateUser(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to activate user');
    }
  }
);

export const deactivateUser = createAsyncThunk(
  'user/deactivateUser',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.deactivateUser(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to deactivate user');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'user/resetPassword',
  async (userId, { rejectWithValue }) => {
    try {
      const response = await userService.resetPassword(userId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to reset user password');
    }
  }
);
