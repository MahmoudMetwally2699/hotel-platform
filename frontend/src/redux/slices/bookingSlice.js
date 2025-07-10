/**
 * Booking Slice
 * Manages booking state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import bookingService from '../../services/booking.service';

// Booking service is already instantiated in the imported module

// Initial state
const initialState = {
  bookings: [],
  currentBooking: null,
  isLoading: false,
  error: null,
};

// Async thunks for booking actions
export const fetchUserBookings = createAsyncThunk(
  'booking/fetchUserBookings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getUserBookings();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch bookings');
    }
  }
);

export const fetchHotelBookings = createAsyncThunk(
  'booking/fetchHotelBookings',
  async (hotelId, { rejectWithValue }) => {
    try {
      const response = await bookingService.getHotelBookings(hotelId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch hotel bookings');
    }
  }
);

export const fetchProviderBookings = createAsyncThunk(
  'booking/fetchProviderBookings',
  async (providerId, { rejectWithValue }) => {
    try {
      const response = await bookingService.getProviderBookings(providerId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch provider bookings');
    }
  }
);

export const fetchBookingById = createAsyncThunk(
  'booking/fetchBookingById',
  async (bookingId, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingById(bookingId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking details');
    }
  }
);

export const createBooking = createAsyncThunk(
  'booking/createBooking',
  async (bookingData, { rejectWithValue }) => {
    try {
      const response = await bookingService.createBooking(bookingData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create booking');
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  'booking/updateBookingStatus',
  async ({ bookingId, status }, { rejectWithValue }) => {
    try {
      const response = await bookingService.updateBookingStatus(bookingId, status);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update booking status');
    }
  }
);

// Create the booking slice
const bookingSlice = createSlice({
  name: 'booking',
  initialState,
  reducers: {
    setCurrentBooking: (state, action) => {
      state.currentBooking = action.payload;
    },
    clearBookingState: (state) => {
      state.currentBooking = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch user bookings cases
      .addCase(fetchUserBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchUserBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch hotel bookings cases
      .addCase(fetchHotelBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchHotelBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchHotelBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider bookings cases
      .addCase(fetchProviderBookings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderBookings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.bookings = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderBookings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch booking by ID cases
      .addCase(fetchBookingById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBookingById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        state.error = null;
      })
      .addCase(fetchBookingById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create booking cases
      .addCase(createBooking.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;
        state.bookings.push(action.payload);
        state.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update booking status cases
      .addCase(updateBookingStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBookingStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentBooking = action.payload;

        // Update the booking in the bookings array as well
        const index = state.bookings.findIndex(b => b._id === action.payload._id);
        if (index !== -1) {
          state.bookings[index] = action.payload;
        }

        state.error = null;
      })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setCurrentBooking, clearBookingState } = bookingSlice.actions;

export default bookingSlice.reducer;

// Selectors
export const selectAllBookings = (state) => state.booking.bookings;
export const selectCurrentBooking = (state) => state.booking.currentBooking;
export const selectBookingLoading = (state) => state.booking.isLoading;
export const selectBookingError = (state) => state.booking.error;

// Additional selectors for backward compatibility
export const selectUserBookings = (state) => state.booking.bookings;
export const selectBookingStats = (state) => ({
  total: state.booking.bookings.length,
  completed: state.booking.bookings.filter(b => b.status === 'COMPLETED').length,
  pending: state.booking.bookings.filter(b => b.status === 'PENDING').length,
  cancelled: state.booking.bookings.filter(b => b.status === 'CANCELLED').length,
  revenue: state.booking.bookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0)
});
export const selectBookingStatsLoading = (state) => state.booking.isLoading;
export const selectRecentBookings = (state) =>
  [...state.booking.bookings]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

// Additional thunks for backward compatibility
export const fetchBookings = fetchUserBookings;
export const fetchBookingStats = createAsyncThunk(
  'booking/fetchBookingStats',
  async (_, { rejectWithValue }) => {
    try {
      const response = await bookingService.getBookingStats();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch booking statistics');
    }
  }
);

export const fetchRecentBookings = createAsyncThunk(
  'booking/fetchRecentBookings',
  async (limit = 5, { rejectWithValue }) => {
    try {
      const response = await bookingService.getRecentBookings(limit);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent bookings');
    }
  }
);
