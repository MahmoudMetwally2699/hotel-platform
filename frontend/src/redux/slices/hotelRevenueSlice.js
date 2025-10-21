import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunks for revenue analytics
export const fetchRevenueSummary = createAsyncThunk(
  'hotelRevenue/fetchSummary',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/revenue/summary?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('📊 Revenue Summary Response:', response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue summary');
    }
  }
);

export const fetchRevenueComparison = createAsyncThunk(
  'hotelRevenue/fetchComparison',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/revenue/comparison?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log('📊 Revenue Comparison Response:', response.data);
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue comparison');
    }
  }
);

export const fetchRevenueByCategory = createAsyncThunk(
  'hotelRevenue/fetchByCategory',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/revenue/by-category?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch revenue by category');
    }
  }
);

export const fetchInternalServices = createAsyncThunk(
  'hotelRevenue/fetchInternalServices',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/revenue/internal-services?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch internal services');
    }
  }
);

export const fetchExternalProviders = createAsyncThunk(
  'hotelRevenue/fetchExternalProviders',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/revenue/external-providers?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch external providers');
    }
  }
);

export const fetchCompleteSummary = createAsyncThunk(
  'hotelRevenue/fetchCompleteSummary',
  async ({ startDate, endDate }, { rejectWithValue }) => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axios.get(
        `${API_URL}/hotel/analytics/revenue/complete-summary?${params.toString()}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch complete summary');
    }
  }
);

const hotelRevenueSlice = createSlice({
  name: 'hotelRevenue',
  initialState: {
    summary: {
      data: null,
      loading: false,
      error: null
    },
    comparison: {
      data: null,
      loading: false,
      error: null
    },
    byCategory: {
      data: null,
      loading: false,
      error: null
    },
    internalServices: {
      data: null,
      loading: false,
      error: null
    },
    externalProviders: {
      data: null,
      loading: false,
      error: null
    },
    completeSummary: {
      data: null,
      loading: false,
      error: null
    }
  },
  reducers: {
    clearRevenueData: (state) => {
      state.summary.data = null;
      state.comparison.data = null;
      state.byCategory.data = null;
      state.internalServices.data = null;
      state.externalProviders.data = null;
      state.completeSummary.data = null;
    }
  },
  extraReducers: (builder) => {
    // Revenue Summary
    builder
      .addCase(fetchRevenueSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchRevenueSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchRevenueSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      });

    // Revenue Comparison
    builder
      .addCase(fetchRevenueComparison.pending, (state) => {
        state.comparison.loading = true;
        state.comparison.error = null;
      })
      .addCase(fetchRevenueComparison.fulfilled, (state, action) => {
        state.comparison.loading = false;
        state.comparison.data = action.payload;
      })
      .addCase(fetchRevenueComparison.rejected, (state, action) => {
        state.comparison.loading = false;
        state.comparison.error = action.payload;
      });

    // Revenue by Category
    builder
      .addCase(fetchRevenueByCategory.pending, (state) => {
        state.byCategory.loading = true;
        state.byCategory.error = null;
      })
      .addCase(fetchRevenueByCategory.fulfilled, (state, action) => {
        state.byCategory.loading = false;
        state.byCategory.data = action.payload;
      })
      .addCase(fetchRevenueByCategory.rejected, (state, action) => {
        state.byCategory.loading = false;
        state.byCategory.error = action.payload;
      });

    // Internal Services
    builder
      .addCase(fetchInternalServices.pending, (state) => {
        state.internalServices.loading = true;
        state.internalServices.error = null;
      })
      .addCase(fetchInternalServices.fulfilled, (state, action) => {
        state.internalServices.loading = false;
        state.internalServices.data = action.payload;
      })
      .addCase(fetchInternalServices.rejected, (state, action) => {
        state.internalServices.loading = false;
        state.internalServices.error = action.payload;
      });

    // External Providers
    builder
      .addCase(fetchExternalProviders.pending, (state) => {
        state.externalProviders.loading = true;
        state.externalProviders.error = null;
      })
      .addCase(fetchExternalProviders.fulfilled, (state, action) => {
        state.externalProviders.loading = false;
        state.externalProviders.data = action.payload;
      })
      .addCase(fetchExternalProviders.rejected, (state, action) => {
        state.externalProviders.loading = false;
        state.externalProviders.error = action.payload;
      });

    // Complete Summary
    builder
      .addCase(fetchCompleteSummary.pending, (state) => {
        state.completeSummary.loading = true;
        state.completeSummary.error = null;
      })
      .addCase(fetchCompleteSummary.fulfilled, (state, action) => {
        state.completeSummary.loading = false;
        state.completeSummary.data = action.payload;
      })
      .addCase(fetchCompleteSummary.rejected, (state, action) => {
        state.completeSummary.loading = false;
        state.completeSummary.error = action.payload;
      });
  }
});

export const { clearRevenueData } = hotelRevenueSlice.actions;
export default hotelRevenueSlice.reducer;
