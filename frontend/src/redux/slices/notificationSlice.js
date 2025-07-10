/**
 * Notification Slice
 * Manages notification state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import notificationService from '../../services/notification.service';

// Notification service is already instantiated in the imported module

// Initial state
const initialState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Async thunks for notification actions
export const fetchNotifications = createAsyncThunk(
  'notification/fetchNotifications',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.getUserNotifications();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch notifications');
    }
  }
);

export const markAsRead = createAsyncThunk(
  'notification/markAsRead',
  async (notificationId, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAsRead(notificationId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark notification as read');
    }
  }
);

export const markAllAsRead = createAsyncThunk(
  'notification/markAllAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await notificationService.markAllAsRead();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to mark all notifications as read');
    }
  }
);

// Create the notification slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    clearNotifications: (state) => {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch notifications cases
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.isLoading = false;
        state.notifications = action.payload;
        state.unreadCount = action.payload.filter(notification => !notification.isRead).length;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Mark notification as read cases
      .addCase(markAsRead.pending, (state) => {
        state.error = null;
      })
      .addCase(markAsRead.fulfilled, (state, action) => {
        const index = state.notifications.findIndex(notification => notification._id === action.payload._id);
        if (index !== -1) {
          state.notifications[index] = action.payload;
          if (!state.notifications[index].isRead && state.unreadCount > 0) {
            state.unreadCount -= 1;
          }
          state.notifications[index].isRead = true;
        }
        state.error = null;
      })
      .addCase(markAsRead.rejected, (state, action) => {
        state.error = action.payload;
      })

      // Mark all notifications as read cases
      .addCase(markAllAsRead.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(markAllAsRead.fulfilled, (state) => {
        state.isLoading = false;
        state.notifications = state.notifications.map(notification => ({
          ...notification,
          isRead: true
        }));
        state.unreadCount = 0;
        state.error = null;
      })
      .addCase(markAllAsRead.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { addNotification, clearNotifications } = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state) => state.notification.notifications;
export const selectUnreadCount = (state) => state.notification.unreadCount;
export const selectNotificationLoading = (state) => state.notification.isLoading;
export const selectNotificationError = (state) => state.notification.error;
