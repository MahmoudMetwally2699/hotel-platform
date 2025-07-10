/**
 * Report Slice
 * Manages analytics and reporting data in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Initial state
const initialState = {
  financialReports: null,
  bookingReports: null,
  serviceReports: null,
  userReports: null,
  customReport: null,
  dateRange: {
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(), // First day of current month
    endDate: new Date().toISOString(), // Today
  },
  isLoading: false,
  error: null,
};

// Async thunks for report actions
export const fetchFinancialReports = createAsyncThunk(
  'report/fetchFinancialReports',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reports/financial?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch financial reports');
    }
  }
);

export const fetchBookingReports = createAsyncThunk(
  'report/fetchBookingReports',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reports/bookings?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking reports');
    }
  }
);

export const fetchServiceReports = createAsyncThunk(
  'report/fetchServiceReports',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reports/services?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service reports');
    }
  }
);

export const fetchUserReports = createAsyncThunk(
  'report/fetchUserReports',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/reports/users?startDate=${startDate}&endDate=${endDate}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch user reports');
    }
  }
);

export const generateCustomReport = createAsyncThunk(
  'report/generateCustomReport',
  async (reportParams, { rejectWithValue }) => {
    try {
      const response = await axios.post('/api/reports/custom', reportParams);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to generate custom report');
    }
  }
);

// Create the report slice
const reportSlice = createSlice({
  name: 'report',
  initialState,
  reducers: {
    setDateRange: (state, action) => {
      state.dateRange = action.payload;
    },
    clearReportState: (state) => {
      state.customReport = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Financial reports cases
      .addCase(fetchFinancialReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFinancialReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.financialReports = action.payload;
        state.error = null;
      })
      .addCase(fetchFinancialReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Booking reports cases
      .addCase(fetchBookingReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookingReports = action.payload;
        state.error = null;
      })
      .addCase(fetchBookingReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Service reports cases
      .addCase(fetchServiceReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceReports = action.payload;
        state.error = null;
      })
      .addCase(fetchServiceReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // User reports cases
      .addCase(fetchUserReports.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserReports.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userReports = action.payload;
        state.error = null;
      })
      .addCase(fetchUserReports.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Custom report cases
      .addCase(generateCustomReport.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateCustomReport.fulfilled, (state, action) => {
        state.isLoading = false;
        state.customReport = action.payload;
        state.error = null;
      })
      .addCase(generateCustomReport.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setDateRange, clearReportState } = reportSlice.actions;

export default reportSlice.reducer;

// Selectors
export const selectFinancialReports = (state) => state.report.financialReports;
export const selectBookingReports = (state) => state.report.bookingReports;
export const selectServiceReports = (state) => state.report.serviceReports;
export const selectUserReports = (state) => state.report.userReports;
export const selectCustomReport = (state) => state.report.customReport;
export const selectReportDateRange = (state) => state.report.dateRange;
export const selectReportLoading = (state) => state.report.isLoading;
export const selectReportError = (state) => state.report.error;
