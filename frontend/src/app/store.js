import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../redux/slices/authSlice';
import hotelReducer from '../redux/slices/hotelSlice';
import serviceReducer from '../redux/slices/serviceSlice';
import bookingReducer from '../redux/slices/bookingSlice';
import notificationReducer from '../redux/slices/notificationSlice';
import userReducer from '../redux/slices/userSlice';
import hotelAnalyticsReducer from '../redux/slices/hotelAnalyticsSlice';
import hotelOperationalReducer from '../redux/slices/hotelOperationalSlice';
import hotelRevenueReducer from '../redux/slices/hotelRevenueSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    hotel: hotelReducer,
    service: serviceReducer,
    booking: bookingReducer,
    notification: notificationReducer,
    user: userReducer,
    hotelAnalytics: hotelAnalyticsReducer,
    hotelOperational: hotelOperationalReducer,
    hotelRevenue: hotelRevenueReducer,
  },
});
