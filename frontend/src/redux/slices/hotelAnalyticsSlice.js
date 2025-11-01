/**
 * Hotel Analytics Redux Slice
 * Manages state for hotel performance analytics including ratings, trends, and breakdowns
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Helper to ensure API_URL doesn't duplicate /api
const getApiUrl = () => {
  const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  return baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
};

const API_URL = getApiUrl();

// Initial state
const initialState = {
  // Summary data
  summary: {
    data: null,
    loading: false,
    error: null
  },
  // Breakdown data
  breakdown: {
    data: null,
    loading: false,
    error: null
  },
  // Ratings by type data
  byType: {
    data: null,
    loading: false,
    error: null
  },
  // Trend data
  trend: {
    data: null,
    loading: false,
    error: null
  },
  // Selected date range
  dateRange: {
    startDate: null,
    endDate: null,
    period: 'week' // week, month, day
  }
};

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Async thunks

/**
 * Fetch rating summary metrics
 */
export const fetchRatingSummary = createAsyncThunk(
  'hotelAnalytics/fetchRatingSummary',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/ratings/summary?${params.toString()}`,
        getAuthHeaders()
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch rating summary'
      );
    }
  }
);

/**
 * Fetch detailed ratings breakdown
 */
export const fetchRatingsBreakdown = createAsyncThunk(
  'hotelAnalytics/fetchRatingsBreakdown',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/ratings/breakdown?${params.toString()}`,
        getAuthHeaders()
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch ratings breakdown'
      );
    }
  }
);

/**
 * Fetch ratings by service type (for charts)
 */
export const fetchRatingsByType = createAsyncThunk(
  'hotelAnalytics/fetchRatingsByType',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/ratings/by-type?${params.toString()}`,
        getAuthHeaders()
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch ratings by type'
      );
    }
  }
);

/**
 * Fetch ratings trend over time
 */
export const fetchRatingsTrend = createAsyncThunk(
  'hotelAnalytics/fetchRatingsTrend',
  async ({ startDate, endDate, period, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (period) params.append('period', period);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/ratings/trend?${params.toString()}`,
        getAuthHeaders()
      );

      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch ratings trend'
      );
    }
  }
);

/**
 * Fetch all analytics data at once
 */
export const fetchAllAnalytics = createAsyncThunk(
  'hotelAnalytics/fetchAllAnalytics',
  async ({ startDate, endDate, period }, { dispatch, rejectWithValue }) => {
    try {
      await Promise.all([
        dispatch(fetchRatingSummary({ startDate, endDate })),
        dispatch(fetchRatingsBreakdown({ startDate, endDate })),
        dispatch(fetchRatingsByType({ startDate, endDate })),
        dispatch(fetchRatingsTrend({ startDate, endDate, period }))
      ]);

      return true;
    } catch (error) {
      return rejectWithValue('Failed to fetch analytics data');
    }
  }
);

// Slice
const hotelAnalyticsSlice = createSlice({
  name: 'hotelAnalytics',
  initialState,
  reducers: {
    // Update date range
    setDateRange: (state, action) => {
      state.dateRange = {
        ...state.dateRange,
        ...action.payload
      };
    },
    // Clear all analytics data
    clearAnalytics: (state) => {
      state.summary.data = null;
      state.breakdown.data = null;
      state.byType.data = null;
      state.trend.data = null;
    },
    // Clear specific section error
    clearError: (state, action) => {
      const section = action.payload;
      if (state[section]) {
        state[section].error = null;
      }
    }
  },
  extraReducers: (builder) => {
    // Fetch Rating Summary
    builder
      .addCase(fetchRatingSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchRatingSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
        state.summary.error = null;
      })
      .addCase(fetchRatingSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      });

    // Fetch Ratings Breakdown
    builder
      .addCase(fetchRatingsBreakdown.pending, (state) => {
        state.breakdown.loading = true;
        state.breakdown.error = null;
      })
      .addCase(fetchRatingsBreakdown.fulfilled, (state, action) => {
        state.breakdown.loading = false;
        state.breakdown.data = action.payload;
        state.breakdown.error = null;
      })
      .addCase(fetchRatingsBreakdown.rejected, (state, action) => {
        state.breakdown.loading = false;
        state.breakdown.error = action.payload;
      });

    // Fetch Ratings By Type
    builder
      .addCase(fetchRatingsByType.pending, (state) => {
        state.byType.loading = true;
        state.byType.error = null;
      })
      .addCase(fetchRatingsByType.fulfilled, (state, action) => {
        state.byType.loading = false;
        state.byType.data = action.payload;
        state.byType.error = null;
      })
      .addCase(fetchRatingsByType.rejected, (state, action) => {
        state.byType.loading = false;
        state.byType.error = action.payload;
      });

    // Fetch Ratings Trend
    builder
      .addCase(fetchRatingsTrend.pending, (state) => {
        state.trend.loading = true;
        state.trend.error = null;
      })
      .addCase(fetchRatingsTrend.fulfilled, (state, action) => {
        state.trend.loading = false;
        state.trend.data = action.payload;
        state.trend.error = null;
      })
      .addCase(fetchRatingsTrend.rejected, (state, action) => {
        state.trend.loading = false;
        state.trend.error = action.payload;
      });
  }
});

// Export actions
export const { setDateRange, clearAnalytics, clearError } = hotelAnalyticsSlice.actions;

// Export selectors
export const selectRatingSummary = (state) => state.hotelAnalytics.summary;
export const selectRatingsBreakdown = (state) => state.hotelAnalytics.breakdown;
export const selectRatingsByType = (state) => state.hotelAnalytics.byType;
export const selectRatingsTrend = (state) => state.hotelAnalytics.trend;
export const selectDateRange = (state) => state.hotelAnalytics.dateRange;

// Export reducer
export default hotelAnalyticsSlice.reducer;
