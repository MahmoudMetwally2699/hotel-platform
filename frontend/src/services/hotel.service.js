/**
 * Hotel Service
 * Handles hotel-related API requests
 */

import apiClient from './api.service';
import { HOTEL_ADMIN_API, CLIENT_API, SUPERADMIN_API } from '../config/api.config';
import jwt_decode from 'jwt-decode';
import cookieHelper from '../utils/cookieHelper';

class HotelService {
  /**
   * Get all hotels (for guests)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getAllHotels(queryParams = {}) {
    try {
      const response = await apiClient.get(CLIENT_API.HOTELS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel details (for guests)
   * @param {string} id - Hotel ID
   * @returns {Promise} - Response from API
   */
  async getHotelDetails(id) {
    try {
      const response = await apiClient.get(`${CLIENT_API.HOTELS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel services (for guests)
   * @param {string} id - Hotel ID
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */  async getHotelServices(id, queryParams = {}) {
    try {
  // ...existing code...
      const response = await apiClient.get(`${CLIENT_API.HOTELS}/${id}/services`, { params: queryParams });
  // ...existing code...
      return response.data;
    } catch (error) {
  // ...existing code...
      throw error;
    }
  }

  /**
   * Get hotel dashboard data (for hotel admin)
   * @returns {Promise} - Response from API
   */
  async getDashboardData() {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.DASHBOARD);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel profile (for hotel admin)
   * @returns {Promise} - Response from API
   */
  async getProfile() {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.PROFILE);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update hotel profile (for hotel admin)
   * @param {Object} hotelData - Hotel data to update
   * @returns {Promise} - Response from API
   */
  async updateProfile(hotelData) {
    try {
      const response = await apiClient.put(HOTEL_ADMIN_API.PROFILE, hotelData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel service providers (for hotel admin)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getServiceProviders(queryParams = {}) {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.SERVICE_PROVIDERS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get service provider details (for hotel admin)
   * @param {string} id - Service provider ID
   * @returns {Promise} - Response from API
   */
  async getServiceProviderDetails(id) {
    try {
      const response = await apiClient.get(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create service provider (for hotel admin)
   * @param {Object} providerData - Service provider data
   * @returns {Promise} - Response from API
   */
  async createServiceProvider(providerData) {
    try {
      const response = await apiClient.post(HOTEL_ADMIN_API.SERVICE_PROVIDERS, providerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update service provider (for hotel admin)
   * @param {string} id - Service provider ID
   * @param {Object} providerData - Service provider data to update
   * @returns {Promise} - Response from API
   */
  async updateServiceProvider(id, providerData) {
    try {
      const response = await apiClient.put(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${id}`, providerData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Set markup percentage for service provider (for hotel admin)
   * @param {string} id - Service provider ID
   * @param {number} percentage - Markup percentage
   * @param {string} notes - Optional notes
   * @returns {Promise} - Response from API
   */
  async setServiceProviderMarkup(id, percentage, notes = '') {
    try {
      const response = await apiClient.put(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${id}/markup`, {
        percentage,
        notes
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update service provider business license (for hotel admin)
   * @param {string} id - Service provider ID
   * @param {Object} payload - Fields to update (e.g., { expiryDate, number, issuedBy, issuedDate })
   * @returns {Promise} - Response from API
   */
  async updateServiceProviderLicense(id, payload) {
    try {
      const response = await apiClient.put(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${id}/license`, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset service provider password (for hotel admin)
   * @param {string} id - Service provider ID
   * @param {string} newPassword - New password to set
   * @returns {Promise} - Response from API
   */
  async resetServiceProviderPassword(id, newPassword) {
    try {
      const response = await apiClient.post(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${id}/reset-password`, {
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete service provider (for hotel admin)
   * @param {string} id - Service provider ID
   * @returns {Promise} - Response from API
   */
  async deleteServiceProvider(id) {
    try {
      const response = await apiClient.delete(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get markup settings (for hotel admin)
   * @returns {Promise} - Response from API
   */
  async getMarkupSettings() {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.MARKUP_SETTINGS);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update markup settings (for hotel admin)
   * @param {Object} markupData - Markup settings data
   * @returns {Promise} - Response from API
   */
  async updateMarkupSettings(markupData) {
    try {
      const response = await apiClient.put(HOTEL_ADMIN_API.MARKUP_SETTINGS, markupData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get hotel bookings (for hotel admin)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getBookings(queryParams = {}) {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.BOOKINGS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get booking details (for hotel admin)
   * @param {string} id - Booking ID
   * @returns {Promise} - Response from API
   */
  async getBookingDetails(id) {
    try {
      const response = await apiClient.get(`${HOTEL_ADMIN_API.BOOKINGS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update booking status (for hotel admin)
   * @param {string} id - Booking ID
   * @param {string} status - New booking status
   * @returns {Promise} - Response from API
   */
  async updateBookingStatus(id, status) {
    try {
      const response = await apiClient.put(`${HOTEL_ADMIN_API.BOOKINGS}/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get revenue reports (for hotel admin)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getRevenueReports(queryParams = {}) {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.REVENUE, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get analytics data (for hotel admin)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getAnalytics(queryParams = {}) {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.ANALYTICS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  // Superadmin hotel management methods
  /**
   * Create a new hotel (for superadmin)
   * @param {Object} hotelData - Hotel data
   * @returns {Promise} - Response from API
   */
  async createHotel(hotelData) {
    try {      // Authentication will be handled by the backend through the Authorization header

  // ...existing code...
      const token = cookieHelper.getAuthToken() || localStorage.getItem('token');
  // ...existing code...
      const headers = {
        'Authorization': `Bearer ${token}`
      };

      const response = await apiClient.post(SUPERADMIN_API.HOTELS, hotelData, { headers });
  // ...existing code...
      return response.data;
    } catch (error) {
  // ...existing code...
      throw error;
    }
  }

  /**
   * Update hotel (for superadmin)
   * @param {string} id - Hotel ID
   * @param {Object} hotelData - Updated hotel data
   * @returns {Promise} - Response from API
   */
  async updateHotel(id, hotelData) {
    try {
      const response = await apiClient.put(`${SUPERADMIN_API.HOTELS}/${id}`, hotelData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete hotel (for superadmin)
   * @param {string} id - Hotel ID
   * @returns {Promise} - Response from API
   */
  async deleteHotel(id) {
    try {
      const response = await apiClient.delete(`${SUPERADMIN_API.HOTELS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get hotel by ID (for superadmin)
   * @param {string} id - Hotel ID
   * @returns {Promise} - Response from API
   */
  async getHotelById(id) {
    try {
      const response = await apiClient.get(`${SUPERADMIN_API.HOTELS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all hotels (for superadmin)
   * @returns {Promise} - Response from API
   */
  async getAllHotelsForSuperAdmin() {
    try {
  // ...existing code...
      const response = await apiClient.get(SUPERADMIN_API.HOTELS);
  // ...existing code...
      return response.data;
    } catch (error) {
  // ...existing code...
      throw error;
    }
  }
  /**
   * Debug helper - Check authentication status
   * @returns {Object} Authentication status
   */
  checkAuth() {
    const token = cookieHelper.getAuthToken();
    const refreshToken = cookieHelper.getRefreshToken();
    const userData = localStorage.getItem('user');

  // ...existing code...

    if (token) {
      try {
        // eslint-disable-next-line no-unused-vars
        const decoded = jwt_decode(token);
        // ...existing code...
      } catch (error) {
        // ...existing code...
      }
    }

    return {
      isAuthenticated: !!token,
      hasRefreshToken: !!refreshToken,
      hasUserData: !!userData,
      token,
      refreshToken,
      userData: userData ? JSON.parse(userData) : null
    };
  }

  /**
   * Generate QR code for hotel guest registration
   * @returns {Promise} - Response from API
   */
  async generateQRCode() {
    try {
      const response = await apiClient.get('/hotel/qr/generate');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Regenerate QR code with new token
   * @returns {Promise} - Response from API
   */
  async regenerateQRCode() {
    try {
      const response = await apiClient.post('/hotel/qr/regenerate');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download QR code as PNG file
   * @param {Object} options - Download options (size, etc.)
   * @returns {Promise} - Response from API
   */
  async downloadQRCode(options = {}) {
    try {
      const response = await apiClient.get('/hotel/qr/download', {
        params: options,
        responseType: 'blob'
      });
      return response;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get QR code information and metadata
   * @returns {Promise} - Response from API
   */
  async getQRInfo() {
    try {
      const response = await apiClient.get('/hotel/qr/info');
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Validate QR token for guest registration
   * @param {string} qrToken - QR token to validate
   * @returns {Promise} - Response from API
   */
  async validateQRToken(qrToken) {
    try {
  // ...existing code...
      const response = await apiClient.post('/auth/validate-qr', { qrToken });
  // ...existing code...
      return response.data;
    } catch (error) {
  // ...existing code...
      throw error;
    }
  }

  /**
   * Get hotel guests with pagination and filtering
   * @param {Object} params - Query parameters (page, limit, search, status)
   * @returns {Promise} - Response from API
   */
  async getHotelGuests(params = {}) {
    try {
      const response = await apiClient.get(HOTEL_ADMIN_API.GUESTS, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update guest active status
   * @param {string} guestId - Guest ID
   * @param {boolean} isActive - New active status
   * @returns {Promise} - Response from API
   */
  async updateGuestStatus(guestId, isActive) {
    try {
      const response = await apiClient.patch(`${HOTEL_ADMIN_API.GUESTS}/${guestId}/status`, { isActive });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update guest information (room, check-in/out dates)
   * @param {string} guestId - Guest ID
   * @param {Object} updateData - Update data (roomNumber, checkInDate, checkOutDate)
   * @returns {Promise} - Response from API
   */
  async updateGuestInfo(guestId, updateData) {
    try {
      const response = await apiClient.patch(`${HOTEL_ADMIN_API.GUESTS}/${guestId}`, updateData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update guest channel
   * @param {string} guestId - Guest ID
   * @param {string} channel - New channel (Travel Agency, Corporate, Direct)
   * @returns {Promise} - Response from API
   */
  async updateGuestChannel(guestId, channel) {
    try {
      const response = await apiClient.patch(`${HOTEL_ADMIN_API.GUESTS}/${guestId}/channel`, { channel });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activate guest in loyalty program
   * @param {string} guestId - Guest ID
   * @returns {Promise} - Response from API
   */
  async activateGuestLoyalty(guestId) {
    try {
      const response = await apiClient.post(`${HOTEL_ADMIN_API.GUESTS}/${guestId}/loyalty/activate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate guest from loyalty program
   * @param {string} guestId - Guest ID
   * @returns {Promise} - Response from API
   */
  async deactivateGuestLoyalty(guestId) {
    try {
      const response = await apiClient.delete(`${HOTEL_ADMIN_API.GUESTS}/${guestId}/loyalty/deactivate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

}

const hotelService = new HotelService();
export default hotelService;
