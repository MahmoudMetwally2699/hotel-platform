/**
 * Settings Slice
 * Manages platform settings state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { SUPER_ADMIN_API } from '../../config/api.config';

// Initial state
const initialState = {
  platformSettings: null,
  paymentSettings: null,
  emailSettings: null,
  generalSettings: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchPlatformSettings = createAsyncThunk(
  'settings/fetchPlatformSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(SUPER_ADMIN_API.SETTINGS);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch platform settings');
    }
  }
);

export const updatePlatformSettings = createAsyncThunk(
  'settings/updatePlatformSettings',
  async (settingsData, { rejectWithValue }) => {
    try {
      const response = await axios.put(SUPER_ADMIN_API.SETTINGS, settingsData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update platform settings');
    }
  }
);

export const fetchPaymentSettings = createAsyncThunk(
  'settings/fetchPaymentSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${SUPER_ADMIN_API.SETTINGS}/payment`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payment settings');
    }
  }
);

export const updatePaymentSettings = createAsyncThunk(
  'settings/updatePaymentSettings',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${SUPER_ADMIN_API.SETTINGS}/payment`, paymentData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment settings');
    }
  }
);

export const fetchEmailSettings = createAsyncThunk(
  'settings/fetchEmailSettings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${SUPER_ADMIN_API.SETTINGS}/email`);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch email settings');
    }
  }
);

export const updateEmailSettings = createAsyncThunk(
  'settings/updateEmailSettings',
  async (emailData, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${SUPER_ADMIN_API.SETTINGS}/email`, emailData);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update email settings');
    }
  }
);

// Create the settings slice
const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    resetSettings: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch platform settings
      .addCase(fetchPlatformSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPlatformSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platformSettings = action.payload;
        state.error = null;
      })
      .addCase(fetchPlatformSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update platform settings
      .addCase(updatePlatformSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePlatformSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.platformSettings = action.payload;
        state.error = null;
      })
      .addCase(updatePlatformSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch payment settings
      .addCase(fetchPaymentSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPaymentSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentSettings = action.payload;
        state.error = null;
      })
      .addCase(fetchPaymentSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update payment settings
      .addCase(updatePaymentSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePaymentSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.paymentSettings = action.payload;
        state.error = null;
      })
      .addCase(updatePaymentSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch email settings
      .addCase(fetchEmailSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEmailSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emailSettings = action.payload;
        state.error = null;
      })
      .addCase(fetchEmailSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update email settings
      .addCase(updateEmailSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateEmailSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.emailSettings = action.payload;
        state.error = null;
      })
      .addCase(updateEmailSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { resetSettings } = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectPlatformSettings = (state) => state.settings.platformSettings;
export const selectPaymentSettings = (state) => state.settings.paymentSettings;
export const selectEmailSettings = (state) => state.settings.emailSettings;
export const selectGeneralSettings = (state) => state.settings.generalSettings;
export const selectSettingsLoading = (state) => state.settings.isLoading;
export const selectSettingsError = (state) => state.settings.error;

// Additional selectors and functions for backward compatibility
export const selectSettings = (state) => ({
  platform: state.settings.platformSettings,
  payment: state.settings.paymentSettings,
  email: state.settings.emailSettings,
  general: state.settings.generalSettings
});

export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async (_, { dispatch }) => {
    // Fetch all settings at once
    await Promise.all([
      dispatch(fetchPlatformSettings()),
      dispatch(fetchPaymentSettings()),
      dispatch(fetchEmailSettings())
    ]);
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (settingsData, { dispatch }) => {
    const { platform, payment, email } = settingsData;

    // Update all provided settings
    if (platform) await dispatch(updatePlatformSettings(platform));
    if (payment) await dispatch(updatePaymentSettings(payment));
    if (email) await dispatch(updateEmailSettings(email));
  }
);
