/**
 * Booking Service
 * Handles all booking-related API calls
 */

import apiClient from './api.service';
import { CLIENT_API, HOTEL_ADMIN_API } from '../config/api.config';

class BookingService {
  /**
   * Create a new booking
   * @param {Object} bookingData - Booking data
   * @returns {Promise} - Response from API
   */
  async createBooking(bookingData) {
    try {
      const response = await apiClient.post(CLIENT_API.BOOKINGS, bookingData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user's bookings
   * @returns {Promise} - Response from API
   */
  async getUserBookings() {
    try {
      const response = await apiClient.get(CLIENT_API.BOOKINGS);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel's bookings (for authenticated hotel admin)
   * @returns {Promise} - Response from API
   */
  async getHotelBookingsForAdmin() {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.BOOKINGS);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel's bookings
   * @param {string} hotelId - Hotel ID
   * @returns {Promise} - Response from API
   */
  async getHotelBookings(hotelId) {
    try {
      const response = await apiClient.get(`${HOTEL_ADMIN_API.BOOKINGS}?hotelId=${hotelId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get service provider's bookings
   * @param {string} providerId - Service provider ID
   * @returns {Promise} - Response from API
   */
  async getProviderBookings(providerId) {
    try {
      const response = await apiClient.get(`${CLIENT_API.BOOKINGS}/provider/${providerId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get booking details by ID
   * @param {string} bookingId - Booking ID
   * @returns {Promise} - Response from API
   */
  async getBookingById(bookingId) {
    try {
      const response = await apiClient.get(`${CLIENT_API.BOOKINGS}/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update booking status
   * @param {string} bookingId - Booking ID
   * @param {string} status - New status (confirmed, completed, cancelled, etc.)
   * @returns {Promise} - Response from API
   */
  async updateBookingStatus(bookingId, status) {
    try {
      const response = await apiClient.patch(`${CLIENT_API.BOOKINGS}/${bookingId}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel booking
   * @param {string} bookingId - Booking ID
   * @param {string} reason - Cancellation reason
   * @returns {Promise} - Response from API
   */
  async cancelBooking(bookingId, reason) {
    try {
      const response = await apiClient.patch(`${CLIENT_API.BOOKINGS}/${bookingId}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create payment intent for booking
   * @param {string} bookingId - Booking ID
   * @returns {Promise} - Response from API with client secret
   */
  async createPaymentIntent(bookingId) {
    try {
      const response = await apiClient.post(`${CLIENT_API.BOOKINGS}/${bookingId}/payment-intent`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get pending feedback requests
   * @returns {Promise} - Response from API
   */
  async getPendingFeedback() {
    try {
      const response = await apiClient.get(`/client/pending-feedback`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Skip feedback request
   * @param {string} bookingId - Booking ID
   * @returns {Promise} - Response from API
   */
  async skipFeedback(bookingId) {
    try {
      const response = await apiClient.post(`${CLIENT_API.BOOKINGS}/${bookingId}/skip-feedback`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const bookingService = new BookingService();
export default bookingService;
