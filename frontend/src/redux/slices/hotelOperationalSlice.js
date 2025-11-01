/**
 * Hotel Operational Efficiency Analytics Redux Slice
 *
 * Manages state for operational efficiency metrics including:
 * - Response time and completion time tracking
 * - SLA compliance monitoring
 * - Service performance analysis
 * - Detailed timing analytics
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Async thunk for fetching operational summary
export const fetchOperationalSummary = createAsyncThunk(
  'hotelOperational/fetchSummary',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_BASE_URL}/api/hotel/analytics/operational/summary?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch operational summary'
      );
    }
  }
);

// Async thunk for fetching completion time by service
export const fetchCompletionByService = createAsyncThunk(
  'hotelOperational/fetchCompletionByService',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_BASE_URL}/api/hotel/analytics/operational/completion-by-service?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch completion by service'
      );
    }
  }
);

// Async thunk for fetching SLA performance by service
export const fetchSLAByService = createAsyncThunk(
  'hotelOperational/fetchSLAByService',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_BASE_URL}/api/hotel/analytics/operational/sla-by-service?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch SLA by service'
      );
    }
  }
);

// Async thunk for fetching SLA distribution
export const fetchSLADistribution = createAsyncThunk(
  'hotelOperational/fetchSLADistribution',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_BASE_URL}/api/hotel/analytics/operational/sla-distribution?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch SLA distribution'
      );
    }
  }
);

// Async thunk for fetching service details
export const fetchServiceDetails = createAsyncThunk(
  'hotelOperational/fetchServiceDetails',
  async ({ startDate, endDate, serviceType }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (serviceType && serviceType !== 'all') params.append('serviceType', serviceType);

      const response = await axios.get(
        `${API_BASE_URL}/api/hotel/analytics/operational/service-details?${params.toString()}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      return response.data.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch service details'
      );
    }
  }
);

const initialState = {
  summary: {
    data: null,
    loading: false,
    error: null
  },
  completionByService: {
    data: null,
    loading: false,
    error: null
  },
  slaByService: {
    data: null,
    loading: false,
    error: null
  },
  slaDistribution: {
    data: null,
    loading: false,
    error: null
  },
  serviceDetails: {
    data: null,
    loading: false,
    error: null
  }
};

const hotelOperationalSlice = createSlice({
  name: 'hotelOperational',
  initialState,
  reducers: {
    clearOperationalData: (state) => {
      state.summary.data = null;
      state.completionByService.data = null;
      state.slaByService.data = null;
      state.slaDistribution.data = null;
      state.serviceDetails.data = null;
    },
    clearOperationalErrors: (state) => {
      state.summary.error = null;
      state.completionByService.error = null;
      state.slaByService.error = null;
      state.slaDistribution.error = null;
      state.serviceDetails.error = null;
    }
  },
  extraReducers: (builder) => {
    // Operational Summary
    builder
      .addCase(fetchOperationalSummary.pending, (state) => {
        state.summary.loading = true;
        state.summary.error = null;
      })
      .addCase(fetchOperationalSummary.fulfilled, (state, action) => {
        state.summary.loading = false;
        state.summary.data = action.payload;
      })
      .addCase(fetchOperationalSummary.rejected, (state, action) => {
        state.summary.loading = false;
        state.summary.error = action.payload;
      });

    // Completion By Service
    builder
      .addCase(fetchCompletionByService.pending, (state) => {
        state.completionByService.loading = true;
        state.completionByService.error = null;
      })
      .addCase(fetchCompletionByService.fulfilled, (state, action) => {
        state.completionByService.loading = false;
        state.completionByService.data = action.payload;
      })
      .addCase(fetchCompletionByService.rejected, (state, action) => {
        state.completionByService.loading = false;
        state.completionByService.error = action.payload;
      });

    // SLA By Service
    builder
      .addCase(fetchSLAByService.pending, (state) => {
        state.slaByService.loading = true;
        state.slaByService.error = null;
      })
      .addCase(fetchSLAByService.fulfilled, (state, action) => {
        state.slaByService.loading = false;
        state.slaByService.data = action.payload;
      })
      .addCase(fetchSLAByService.rejected, (state, action) => {
        state.slaByService.loading = false;
        state.slaByService.error = action.payload;
      });

    // SLA Distribution
    builder
      .addCase(fetchSLADistribution.pending, (state) => {
        state.slaDistribution.loading = true;
        state.slaDistribution.error = null;
      })
      .addCase(fetchSLADistribution.fulfilled, (state, action) => {
        state.slaDistribution.loading = false;
        state.slaDistribution.data = action.payload;
      })
      .addCase(fetchSLADistribution.rejected, (state, action) => {
        state.slaDistribution.loading = false;
        state.slaDistribution.error = action.payload;
      });

    // Service Details
    builder
      .addCase(fetchServiceDetails.pending, (state) => {
        state.serviceDetails.loading = true;
        state.serviceDetails.error = null;
      })
      .addCase(fetchServiceDetails.fulfilled, (state, action) => {
        state.serviceDetails.loading = false;
        state.serviceDetails.data = action.payload;
      })
      .addCase(fetchServiceDetails.rejected, (state, action) => {
        state.serviceDetails.loading = false;
        state.serviceDetails.error = action.payload;
      });
  }
});

export const { clearOperationalData, clearOperationalErrors } = hotelOperationalSlice.actions;

export default hotelOperationalSlice.reducer;
