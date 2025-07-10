/**
 * Service Slice
 * Manages service state in the Redux store
 */

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import serviceProviderService from '../../services/service-provider.service';
import hotelService from '../../services/hotel.service';

// Service provider service is already instantiated in the imported module

// Initial state
const initialState = {
  services: [],
  serviceProviders: [],
  currentService: null,
  currentServiceProvider: null,
  currentOrder: null,
  categories: [],
  providerStats: null,
  providerRecentOrders: [],
  providerOrders: [],
  providerEarnings: null,
  providerPayouts: [],
  serviceProviderStats: null,  // For Super Admin view
  providerProfile: null,
  isLoading: false,
  error: null,
};

// Async thunks for service actions
export const fetchServices = createAsyncThunk(
  'service/fetchServices',
  async ({ hotelId, category }, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServices(hotelId, category);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services');
    }
  }
);

export const fetchServiceById = createAsyncThunk(
  'service/fetchServiceById',
  async (serviceId, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServiceById(serviceId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service details');
    }
  }
);

export const fetchServiceProviders = createAsyncThunk(
  'service/fetchServiceProviders',
  async ({ hotelId, category }, { rejectWithValue }) => {
    try {
      const response = await hotelService.getServiceProviders({ hotelId, category });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service providers');
    }
  }
);

export const fetchServiceProviderById = createAsyncThunk(
  'service/fetchServiceProviderById',
  async (providerId, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServiceProviderById(providerId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service provider details');
    }
  }
);

export const createServiceProvider = createAsyncThunk(
  'service/createServiceProvider',
  async (providerData, { rejectWithValue }) => {
    try {
      const response = await hotelService.createServiceProvider(providerData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create service provider');
    }
  }
);

export const setServiceProviderMarkup = createAsyncThunk(
  'service/setServiceProviderMarkup',
  async ({ providerId, percentage, notes }, { rejectWithValue }) => {
    try {
      const response = await hotelService.setServiceProviderMarkup(providerId, percentage, notes);
      return { providerId, ...response };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to set service provider markup');
    }
  }
);

export const fetchServiceCategories = createAsyncThunk(
  'service/fetchServiceCategories',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServiceCategories();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service categories');
    }
  }
);

// Service Provider Dashboard
export const fetchProviderStats = createAsyncThunk(
  'service/fetchProviderStats',
  async (timeRange = 'week', { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getProviderStats(timeRange);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch provider statistics');
    }
  }
);

// Service Provider Orders
export const fetchProviderRecentOrders = createAsyncThunk(
  'service/fetchProviderRecentOrders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getProviderRecentOrders();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch recent orders');
    }
  }
);

export const fetchProviderOrders = createAsyncThunk(
  'service/fetchProviderOrders',
  async (filters, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getProviderOrders(filters);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
    }
  }
);

export const updateOrderStatus = createAsyncThunk(
  'service/updateOrderStatus',
  async ({ orderId, status, notes }, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.updateOrderStatus(orderId, status, notes);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update order status');
    }
  }
);

// Service Provider Earnings
export const fetchProviderEarnings = createAsyncThunk(
  'service/fetchProviderEarnings',
  async (timeRange = 'month', { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getProviderEarnings(timeRange);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch earnings');
    }
  }
);

export const fetchProviderPayouts = createAsyncThunk(
  'service/fetchProviderPayouts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getProviderPayouts();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch payouts');
    }
  }
);

export const requestPayout = createAsyncThunk(
  'service/requestPayout',
  async (amount, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.requestPayout(amount);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request payout');
    }
  }
);

// Service Provider Profile
export const fetchProviderProfile = createAsyncThunk(
  'service/fetchProviderProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getProfile();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch profile');
    }
  }
);

export const updateProviderProfile = createAsyncThunk(
  'service/updateProviderProfile',
  async (profileData, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.updateProfile(profileData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update profile');
    }
  }
);

export const updateBusinessInfo = createAsyncThunk(
  'service/updateBusinessInfo',
  async (businessData, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.updateBusinessInfo(businessData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update business information');
    }
  }
);

export const updatePaymentInfo = createAsyncThunk(
  'service/updatePaymentInfo',
  async (paymentData, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.updatePaymentInfo(paymentData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update payment information');
    }
  }
);

// Super Admin - Service Provider Stats
export const fetchServiceProviderStats = createAsyncThunk(
  'service/fetchServiceProviderStats',
  async ({ providerId = null, timeframe = 'week' } = {}, { rejectWithValue, getState }) => {
    try {
      const { auth } = getState();
      let response;      // For superadmin without provider ID, use the superadmin endpoint
      if (auth.user?.role === 'superadmin' && !providerId) {
        response = await serviceProviderService.getSuperAdminAnalytics(timeframe);
      } else {
        // For service providers or superadmin with providerId
        response = await serviceProviderService.getServiceProviderStats(providerId, timeframe);
      }

      return response.data;
    } catch (error) {
      console.error('Error fetching stats:', error);
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch service provider statistics');
    }
  }
);

export const fetchOrderById = createAsyncThunk(
  'service/fetchOrderById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getOrderById(orderId);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch order details');
    }
  }
);

// Add missing thunks for backward compatibility
export const fetchServiceDetails = fetchServiceById;
export const fetchProviderServices = createAsyncThunk(
  'service/fetchProviderServices',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServices();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch provider services');
    }
  }
);

export const fetchAllServiceProviders = createAsyncThunk(
  'service/fetchAllServiceProviders',
  async (_, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServiceProviders();
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch all service providers');
    }
  }
);

export const createService = createAsyncThunk(
  'service/createService',
  async (serviceData, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.createService(serviceData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create service');
    }
  }
);

export const updateService = createAsyncThunk(
  'service/updateService',
  async ({ id, serviceData }, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.updateService(id, serviceData);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update service');
    }
  }
);

export const deleteService = createAsyncThunk(
  'service/deleteService',
  async (id, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.deleteService(id);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete service');
    }
  }
);

export const fetchServicesByCategory = createAsyncThunk(
  'service/fetchServicesByCategory',
  async ({ category, hotelId }, { rejectWithValue }) => {
    try {
      const response = await serviceProviderService.getServices(hotelId, category);
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch services by category');
    }
  }
);

export const approveServiceProvider = createAsyncThunk(
  'service/approveServiceProvider',
  async (providerId, { rejectWithValue }) => {
    try {
      // Implement actual API call when available
      const response = { success: true, providerId };
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to approve service provider');
    }
  }
);

export const suspendServiceProvider = createAsyncThunk(
  'service/suspendServiceProvider',
  async (providerId, { rejectWithValue }) => {
    try {
      // Implement actual API call when available
      const response = { success: true, providerId };
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to suspend service provider');
    }
  }
);

export const deleteServiceProvider = createAsyncThunk(
  'service/deleteServiceProvider',
  async (providerId, { rejectWithValue }) => {
    try {
      // Implement actual API call when available
      const response = { success: true, providerId };
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete service provider');
    }
  }
);

// Create the service slice
const serviceSlice = createSlice({
  name: 'service',
  initialState,
  reducers: {
    setCurrentService: (state, action) => {
      state.currentService = action.payload;
    },
    setCurrentServiceProvider: (state, action) => {
      state.currentServiceProvider = action.payload;
    },
    clearServiceState: (state) => {
      state.currentService = null;
      state.currentServiceProvider = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch services cases
      .addCase(fetchServices.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServices.fulfilled, (state, action) => {
        state.isLoading = false;
        state.services = action.payload;
        state.error = null;
      })
      .addCase(fetchServices.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch service by ID cases
      .addCase(fetchServiceById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentService = action.payload;
        state.error = null;
      })
      .addCase(fetchServiceById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch service providers cases
      .addCase(fetchServiceProviders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(fetchServiceProviders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceProviders = action.payload.data?.serviceProviders || action.payload;
        state.error = null;
      })
      .addCase(fetchServiceProviders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Create service provider cases
      .addCase(createServiceProvider.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createServiceProvider.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceProviders.push(action.payload);
        state.error = null;
      })
      .addCase(createServiceProvider.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Set service provider markup cases
      .addCase(setServiceProviderMarkup.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })      .addCase(setServiceProviderMarkup.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the specific service provider with the new markup
        const { providerId, data } = action.payload;
        const provider = state.serviceProviders.find(sp => sp._id === providerId);
        if (provider && data?.markup) {
          provider.markup = data.markup;
        }
        state.error = null;
      })
      .addCase(setServiceProviderMarkup.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch service categories cases
      .addCase(fetchServiceCategories.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceCategories.fulfilled, (state, action) => {
        state.isLoading = false;
        state.categories = action.payload;
        state.error = null;
      })
      .addCase(fetchServiceCategories.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider stats cases
      .addCase(fetchProviderStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerStats = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider recent orders cases
      .addCase(fetchProviderRecentOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderRecentOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerRecentOrders = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderRecentOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider orders cases
      .addCase(fetchProviderOrders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderOrders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerOrders = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderOrders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider earnings cases
      .addCase(fetchProviderEarnings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderEarnings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerEarnings = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderEarnings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider payouts cases
      .addCase(fetchProviderPayouts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderPayouts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerPayouts = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderPayouts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch service provider stats cases (Super Admin)
      .addCase(fetchServiceProviderStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchServiceProviderStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.serviceProviderStats = action.payload;
        state.error = null;
      })
      .addCase(fetchServiceProviderStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch order by ID cases
      .addCase(fetchOrderById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentOrder = action.payload;
        state.error = null;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update order status cases
      .addCase(updateOrderStatus.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateOrderStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        // Update the order in providerOrders array
        const updatedOrder = action.payload;
        state.providerOrders = state.providerOrders.map(order =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
        // Update current order if it matches
        if (state.currentOrder && state.currentOrder._id === updatedOrder._id) {
          state.currentOrder = updatedOrder;
        }
        // Update the order in providerRecentOrders if present
        state.providerRecentOrders = state.providerRecentOrders.map(order =>
          order._id === updatedOrder._id ? updatedOrder : order
        );
        state.error = null;
      })
      .addCase(updateOrderStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Request payout cases
      .addCase(requestPayout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(requestPayout.fulfilled, (state, action) => {
        state.isLoading = false;
        // Add the new payout to the payouts array
        state.providerPayouts = [action.payload, ...state.providerPayouts];
        // Update earnings to reflect the payout
        if (state.providerEarnings) {
          state.providerEarnings.availableBalance -= action.payload.amount;
          state.providerEarnings.pendingBalance += action.payload.amount;
        }
        state.error = null;
      })
      .addCase(requestPayout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Fetch provider profile cases
      .addCase(fetchProviderProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProviderProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerProfile = action.payload;
        state.error = null;
      })
      .addCase(fetchProviderProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update provider profile cases
      .addCase(updateProviderProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProviderProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerProfile = { ...state.providerProfile, ...action.payload };
        state.error = null;
      })
      .addCase(updateProviderProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update business info cases
      .addCase(updateBusinessInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateBusinessInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerProfile = {
          ...state.providerProfile,
          business: { ...state.providerProfile?.business, ...action.payload }
        };
        state.error = null;
      })
      .addCase(updateBusinessInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Update payment info cases
      .addCase(updatePaymentInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updatePaymentInfo.fulfilled, (state, action) => {
        state.isLoading = false;
        state.providerProfile = {
          ...state.providerProfile,
          paymentInfo: { ...state.providerProfile?.paymentInfo, ...action.payload }
        };
        state.error = null;
      })
      .addCase(updatePaymentInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

// Export actions and reducer
export const { setCurrentService, setCurrentServiceProvider, clearServiceState } = serviceSlice.actions;

export default serviceSlice.reducer;

// Selectors
export const selectServices = (state) => state.service.services;
export const selectProviders = (state) => state.service.providers;
export const selectCategories = (state) => state.service.categories;
export const selectProviderServices = (state) => state.service.providerServices;
export const selectProviderStats = (state) => state.service.providerStats;
export const selectProviderRecentOrders = (state) => state.service.providerRecentOrders;
export const selectProviderOrders = (state) => state.service.providerOrders;
export const selectCurrentOrder = (state) => state.service.currentOrder;
export const selectProviderEarnings = (state) => state.service.providerEarnings;
export const selectProviderPayouts = (state) => state.service.providerPayouts;
export const selectProviderProfile = (state) => state.service.providerProfile;
export const selectIsLoading = (state) => state.service.isLoading;
export const selectError = (state) => state.service.error;

// Selector exports with clear naming
export const selectAllServices = (state) => state.service.services;
export const selectServiceProviders = (state) => state.service.serviceProviders;
export const selectCurrentService = (state) => state.service.currentService;
export const selectCurrentServiceProvider = (state) => state.service.currentServiceProvider;
export const selectServiceCategories = (state) => state.service.categories;
export const selectServiceLoading = (state) => state.service.isLoading;
export const selectServiceError = (state) => state.service.error;

// Additional selector aliases for backward compatibility
export const selectAllServiceProviders = selectServiceProviders;
export const selectServiceProviderLoading = selectServiceLoading;
export const selectServiceDetails = selectCurrentService;
export const selectServicesLoading = selectServiceLoading;
export const selectServicesByCategory = selectAllServices;
export const selectServiceProviderStats = (state) => state.service.serviceProviderStats;
export const selectServiceProviderStatsLoading = (state) => state.service.isLoading;
