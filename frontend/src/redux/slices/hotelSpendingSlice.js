import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks for customer spending analytics
export const fetchSpendingSummary = createAsyncThunk(
  'hotelSpending/fetchSummary',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_URL}/api/hotel/analytics/spending/summary?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch spending summary');
    }
  }
);

export const fetchSpendingTrend = createAsyncThunk(
  'hotelSpending/fetchTrend',
  async ({ startDate, endDate, period = 'week' }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      params.append('period', period);

      const response = await axios.get(
        `${API_URL}/api/hotel/analytics/spending/trend?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch spending trend');
    }
  }
);

export const fetchServiceRequests = createAsyncThunk(
  'hotelSpending/fetchServiceRequests',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/api/hotel/analytics/spending/service-requests?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service requests');
    }
  }
);

export const fetchServicePopularity = createAsyncThunk(
  'hotelSpending/fetchServicePopularity',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/api/hotel/analytics/spending/service-popularity?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service popularity');
    }
  }
);

export const fetchComprehensivePerformance = createAsyncThunk(
  'hotelSpending/fetchComprehensive',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/api/hotel/analytics/spending/comprehensive?${params.toString()}`,
        { headers: { Authorization: `Bearer ${token}` }}
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch comprehensive performance');
    }
  }
);

const hotelSpendingSlice = createSlice({
  name: 'hotelSpending',
  initialState: {
    summary: { data: null, loading: false, error: null },
    trend: { data: null, loading: false, error: null },
    serviceRequests: { data: null, loading: false, error: null },
    servicePopularity: { data: null, loading: false, error: null },
    comprehensive: { data: null, loading: false, error: null }
  },
  reducers: {
    clearSpendingData: (state) => {
      state.summary.data = null;
      state.trend.data = null;
      state.serviceRequests.data = null;
      state.servicePopularity.data = null;
      state.comprehensive.data = null;
    }
  },
  extraReducers: (builder) => {
    // Spending Summary
    builder
      .addCase(fetchSpendingSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchSpendingSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchSpendingSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      });

    // Spending Trend
    builder
      .addCase(fetchSpendingTrend.pending, (state) => {
        state.trend.loading = true;
        state.trend.error = null;
      })
      .addCase(fetchSpendingTrend.fulfilled, (state, action) => {
        state.trend.loading = false;
        state.trend.data = action.payload;
      })
      .addCase(fetchSpendingTrend.rejected, (state, action) => {
        state.trend.loading = false;
        state.trend.error = action.payload;
      });

    // Service Requests
    builder
      .addCase(fetchServiceRequests.pending, (state) => {
        state.serviceRequests.loading = true;
        state.serviceRequests.error = null;
      })
      .addCase(fetchServiceRequests.fulfilled, (state, action) => {
        state.serviceRequests.loading = false;
        state.serviceRequests.data = action.payload;
      })
      .addCase(fetchServiceRequests.rejected, (state, action) => {
        state.serviceRequests.loading = false;
        state.serviceRequests.error = action.payload;
      });

    // Service Popularity
    builder
      .addCase(fetchServicePopularity.pending, (state) => {
        state.servicePopularity.loading = true;
        state.servicePopularity.error = null;
      })
      .addCase(fetchServicePopularity.fulfilled, (state, action) => {
        state.servicePopularity.loading = false;
        state.servicePopularity.data = action.payload;
      })
      .addCase(fetchServicePopularity.rejected, (state, action) => {
        state.servicePopularity.loading = false;
        state.servicePopularity.error = action.payload;
      });

    // Comprehensive Performance
    builder
      .addCase(fetchComprehensivePerformance.pending, (state) => {
        state.comprehensive.loading = true;
        state.comprehensive.error = null;
      })
      .addCase(fetchComprehensivePerformance.fulfilled, (state, action) => {
        state.comprehensive.loading = false;
        state.comprehensive.data = action.payload;
      })
      .addCase(fetchComprehensivePerformance.rejected, (state, action) => {
        state.comprehensive.loading = false;
        state.comprehensive.error = action.payload;
      });
  }
});

export const { clearSpendingData } = hotelSpendingSlice.actions;
export default hotelSpendingSlice.reducer;
