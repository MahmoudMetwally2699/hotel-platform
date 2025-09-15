/**
 * Service Provider Service
 * Handles service provider-related API requests
 */

import apiClient from './api.service';
import { SERVICE_PROVIDER_API, CLIENT_API } from '../config/api.config';
import cookieHelper from '../utils/cookieHelper';

class ServiceProviderService {  /**
   * Get service details (for guests)
   * @param {string} id - Service ID
   * @returns {Promise} - Response from API
   */
  async getServiceDetails(id) {
    try {
      console.log('🔍 getServiceDetails: Fetching service for ID:', id);
      console.log('🔍 getServiceDetails: Full URL:', `${CLIENT_API.SERVICES}/${id}`);
      const response = await apiClient.get(`${CLIENT_API.SERVICES}/${id}`);
      console.log('✅ getServiceDetails: Response received:', response.data);
      return response.data;
    } catch (error) {
      console.log('❌ getServiceDetails: Error occurred:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Get dashboard data (for service provider)
   * @returns {Promise} - Response from API
   */
  async getDashboardData() {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.DASHBOARD);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get provider profile (for service provider)
   * @returns {Promise} - Response from API
   */
  async getProfile() {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.PROFILE);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update provider profile (for service provider)
   * @param {Object} profileData - Profile data to update
   * @returns {Promise} - Response from API
   */
  async updateProfile(profileData) {
    try {
      const response = await apiClient.put(SERVICE_PROVIDER_API.PROFILE, profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all provider services (for service provider)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getServices(queryParams = {}) {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.SERVICES, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get service details (for service provider)
   * @param {string} id - Service ID
   * @returns {Promise} - Response from API
   */
  async getServiceDetail(id) {
    try {
      const response = await apiClient.get(`${SERVICE_PROVIDER_API.SERVICES}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create new service (for service provider)
   * @param {Object} serviceData - Service data
   * @returns {Promise} - Response from API
   */
  async createService(serviceData) {
    try {
      const response = await apiClient.post(SERVICE_PROVIDER_API.SERVICES, serviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update service (for service provider)
   * @param {string} id - Service ID
   * @param {Object} serviceData - Service data to update
   * @returns {Promise} - Response from API
   */
  async updateService(id, serviceData) {
    try {
      const response = await apiClient.put(`${SERVICE_PROVIDER_API.SERVICES}/${id}`, serviceData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete service (for service provider)
   * @param {string} id - Service ID
   * @returns {Promise} - Response from API
   */
  async deleteService(id) {
    try {
      const response = await apiClient.delete(`${SERVICE_PROVIDER_API.SERVICES}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get provider orders (for service provider)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getOrders(queryParams = {}) {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.ORDERS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get order details (for service provider)
   * @param {string} id - Order ID
   * @returns {Promise} - Response from API
   */
  async getOrderDetails(id) {
    try {
      const response = await apiClient.get(`${SERVICE_PROVIDER_API.ORDERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update order status (for service provider)
   * @param {string} id - Order ID
   * @param {string} status - New order status
   * @returns {Promise} - Response from API
   */  async updateOrderStatus(id, status, notes) {
    try {
      const payload = { status };
      if (notes) {
        payload.notes = notes;
      }
      const response = await apiClient.put(`${SERVICE_PROVIDER_API.ORDERS}/${id}/status`, payload);
      // Backend returns { status: 'success', data: { booking } }
      // We need just the booking object
      return response.data.data?.booking || response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get earnings data (for service provider)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getEarnings(queryParams = {}) {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.EARNINGS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get analytics data (for service provider)
   * @param {Object} queryParams - Query parameters for filtering
   * @returns {Promise} - Response from API
   */
  async getAnalytics(queryParams = {}) {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.ANALYTICS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get provider statistics (for dashboard)
   * @param {string} timeRange - Time range for stats (day, week, month, year)
   * @returns {Promise} - Response from API
   */
  async getProviderStats(timeRange = 'week') {
    try {
      const response = await apiClient.get(`${SERVICE_PROVIDER_API.STATS}?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get provider's recent orders (for dashboard)
   * @param {number} limit - Number of recent orders to fetch
   * @returns {Promise} - Response from API
   */
  async getProviderRecentOrders(limit = 10) {
    try {
      // Use regular orders endpoint with limit parameter since /orders/recent doesn't exist
      const response = await apiClient.get(SERVICE_PROVIDER_API.ORDERS, { params: { limit } });
      // Backend returns {success, results, total, pagination, data}
      // We need just the data array
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all provider orders with optional filtering
   * @param {Object} filters - Filter parameters
   * @returns {Promise} - Response from API
   */  async getProviderOrders(filters = {}) {
    try {
      const response = await apiClient.get(SERVICE_PROVIDER_API.ORDERS, { params: filters });
      // Backend returns {success, results, total, pagination, data}
      // We need just the data array
      return response.data.data || [];
    } catch (error) {
      throw error;
    }
  }
  // updateOrderStatus already defined elsewhere

  /**
   * Get provider earnings data
   * @param {string} timeRange - Time range for earnings data
   * @returns {Promise} - Response from API
   */  async getProviderEarnings(timeRange = 'month') {
    try {
      const response = await apiClient.get(`${SERVICE_PROVIDER_API.EARNINGS}?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get detailed category analytics
   * @param {string} timeRange - Time range for analytics data
   * @returns {Promise} - Response from API
   */
  async getCategoryAnalytics(timeRange = 'month') {
    try {
      const response = await apiClient.get(`/service/analytics/categories?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get provider payout history
   * @returns {Promise} - Response from API
   */
  async getProviderPayouts() {
    try {
      const response = await apiClient.get(`${SERVICE_PROVIDER_API.EARNINGS}/payouts`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Request a new payout
   * @param {number} amount - Amount to request
   * @returns {Promise} - Response from API
   */
  async requestPayout(amount) {
    try {
      const response = await apiClient.post(`${SERVICE_PROVIDER_API.EARNINGS}/payouts`, { amount });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update business information
   * @param {Object} businessData - Business data to update
   * @returns {Promise} - Response from API
   */
  async updateBusinessInfo(businessData) {
    try {
      const response = await apiClient.put(`${SERVICE_PROVIDER_API.PROFILE}/business`, businessData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update payment information
   * @param {Object} paymentData - Payment data to update
   * @returns {Promise} - Response from API
   */
  async updatePaymentInfo(paymentData) {
    try {
      const response = await apiClient.put(`${SERVICE_PROVIDER_API.PROFILE}/payment`, paymentData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
  /**
   * Get service provider statistics (for Super Admin or Service Provider)
   * @param {string} providerId - Optional provider ID (required for SuperAdmin)
   * @param {string} timeframe - Optional timeframe (week, month, year)
   * @returns {Promise} - Response from API
   */
  async getServiceProviderStats(providerId = null, timeframe = 'week') {
    try {
      const params = {};
      if (providerId) params.providerId = providerId;
      if (timeframe) params.timeframe = timeframe;

      const response = await apiClient.get(`${SERVICE_PROVIDER_API.ANALYTICS}/stats`, { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get superadmin analytics data for all service providers
   * @param {string} timeframe - Timeframe for analytics (week, month, year)
   * @returns {Promise} - Response from API
   */  async getSuperAdminAnalytics(timeframe = 'week') {
    try {
      // Add Authorization header explicitly to avoid 401 issues
      const token = cookieHelper.getAuthToken();

      if (!token) {
        throw new Error('Authentication token not found');
      }

      const response = await apiClient.get(
        `${SERVICE_PROVIDER_API.SUPERADMIN_ANALYTICS}?timeframe=${timeframe}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to fetch superadmin analytics:', error);
      throw error;
    }
  }

  /**
   * Get order details by ID
   * @param {string} id - Order ID
   * @returns {Promise} - Response from API
   */
  async getOrderById(id) {
    try {
      const response = await apiClient.get(`${SERVICE_PROVIDER_API.ORDERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

const serviceProviderService = new ServiceProviderService();
export default serviceProviderService;
