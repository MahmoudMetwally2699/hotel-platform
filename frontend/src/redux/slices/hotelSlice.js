/**
 * Hotel Slice
 * Manages hotel state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import hotelService from '../../services/hotel.service';

// Hotel service is already instantiated in the imported module

// Initial state
const initialState = {
  hotels: [],
  currentHotel: null,
  dashboardStats: null,
  isLoading: false,
  error: null,
};

// Async thunks for hotel actions
export const fetchHotels = createAsyncThunk(
  'hotel/fetchHotels',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hotelService.getAllHotelsForSuperAdmin();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotels');
    }
  }
);

export const fetchHotelById = createAsyncThunk(
  'hotel/fetchHotelById',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await hotelService.getHotelById(hotelId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel details');
    }
  }
);

export const fetchHotelProfile = createAsyncThunk(
  'hotel/fetchHotelProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hotelService.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel profile');
    }
  }
);

export const updateHotelProfile = createAsyncThunk(
  'hotel/updateHotelProfile',
  async ({ hotelId, hotelData }, { rejectWithValue }) => {
    try {
      // If hotelId is provided, use the superadmin method
      if (hotelId) {
        const response = await hotelService.updateHotelProfile(hotelId, hotelData);
        return response;
      } else {
        // If no hotelId, use the hotel admin method (for their own profile)
        const response = await hotelService.updateProfile(hotelData);
        return response;
      }
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update hotel profile');
    }
  }
);

export const createHotel = createAsyncThunk(
  'hotel/createHotel',
  async (hotelData, { rejectWithValue }) => {
    try {
      const response = await hotelService.createHotel(hotelData);
      return response;
    } catch (error) {
      // Extract the most specific error message available
      const errorMessage = error.response?.data?.message ||
                           error.response?.data?.error ||
                           error.message ||
                           'Failed to create hotel';

      return rejectWithValue(errorMessage);
    }
  }
);

export const updateHotel = createAsyncThunk(
  'hotel/updateHotel',
  async ({ id, ...hotelData }, { rejectWithValue }) => {
    try {
      const response = await hotelService.updateHotel(id, hotelData);
      return response;
    } catch (error) {
      // Extract the most specific error message available
      const errorMessage = error.response?.data?.message ||
                           error.response?.data?.error ||
                           error.message ||
                           'Failed to update hotel';

      return rejectWithValue(errorMessage);
    }
  }
);

export const deleteHotel = createAsyncThunk(
  'hotel/deleteHotel',
  async (hotelId, { rejectWithValue }) => {
    try {
      await hotelService.deleteHotel(hotelId);
      return hotelId;
    } catch (error) {
      // Extract the most specific error message available
      const errorMessage = error.response?.data?.message ||
                           error.response?.data?.error ||
                           error.message ||
                           'Failed to delete hotel';

      return rejectWithValue(errorMessage);
    }
  }
);
const hotelSlice = createSlice({
  name: 'hotel',
  initialState,  reducers: {
    setCurrentHotel: (state, action) => {
      state.currentHotel = action.payload;
    },    clearHotelState: (state) => {
      state.currentHotel = null;
      state.dashboardStats = null;
      state.error = null;
    }
  },  extraReducers: (builder) => {
    builder
      .addCase(fetchHotels.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotels.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hotels = action.payload?.data?.hotels || [];
        state.error = null;
      })
      .addCase(fetchHotels.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch hotel by ID cases
      .addCase(fetchHotelById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHotel = action.payload;
        state.error = null;
      })
      .addCase(fetchHotelById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch hotel profile cases (for hotel admin)
      .addCase(fetchHotelProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHotel = action.payload;
        state.error = null;
      })
      .addCase(fetchHotelProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update hotel profile cases
      .addCase(updateHotelProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateHotelProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentHotel = action.payload;

        // Update the hotel in the hotels array as well
        const index = state.hotels.findIndex(h => h._id === action.payload._id);
        if (index !== -1) {
          state.hotels[index] = action.payload;
        }        state.error = null;
      })
      .addCase(updateHotelProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })      // Create hotel cases
      .addCase(createHotel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createHotel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hotels.push(action.payload.data.hotel);
        state.error = null;
      })
      .addCase(createHotel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update hotel cases
      .addCase(updateHotel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateHotel.fulfilled, (state, action) => {
        state.isLoading = false;
        const index = state.hotels.findIndex(h => h._id === action.payload.data._id);
        if (index !== -1) {
          state.hotels[index] = action.payload.data;
        }
        state.error = null;
      })
      .addCase(updateHotel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Delete hotel cases
      .addCase(deleteHotel.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteHotel.fulfilled, (state, action) => {
        state.isLoading = false;
        state.hotels = state.hotels.filter(h => h._id !== action.payload);
        state.error = null;
      })      .addCase(deleteHotel.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch hotel stats cases
      .addCase(fetchHotelStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.dashboardStats = action.payload?.data || null;
        state.error = null;
      })
      .addCase(fetchHotelStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setCurrentHotel, clearHotelState } = hotelSlice.actions;

export default hotelSlice.reducer;

// Selectors
export const selectAllHotels = (state) => state.hotel.hotels;
export const selectCurrentHotel = (state) => state.hotel.currentHotel;
export const selectHotelLoading = (state) => state.hotel.isLoading;
export const selectHotelError = (state) => state.hotel.error;

// Additional selectors for backward compatibility
export const selectHotels = (state) => state.hotel.hotels;
export const selectHotelsLoading = (state) => state.hotel.isLoading;
export const selectHotelList = (state) => state.hotel.hotels;
export const selectHotelListLoading = (state) => state.hotel.isLoading;
export const selectHotelStats = (state) => state.hotel.dashboardStats;
export const selectHotelStatsLoading = (state) => state.hotel.isLoading;

// Additional async thunks for hotel management
export const fetchAllHotels = fetchHotels;
export const fetchHotelStats = createAsyncThunk(
  'hotel/fetchHotelStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await hotelService.getDashboardData();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel statistics');
    }
  }
);

export const approveHotel = createAsyncThunk(
  'hotel/approveHotel',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await hotelService.updateHotelStatus(hotelId, 'APPROVED');
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve hotel');
    }
  }
);

export const suspendHotel = createAsyncThunk(
  'hotel/suspendHotel',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await hotelService.updateHotelStatus(hotelId, 'SUSPENDED');
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to suspend hotel');
    }
  }
);
