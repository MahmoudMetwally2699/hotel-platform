/**
 * User Service
 * Handles user-related API requests
 */

import apiClient from './api.service';
import { SUPER_ADMIN_API } from '../config/api.config';

class UserService {
  /**
   * Get all users (for superadmin)
   * @param {Object} queryParams - Query parameters for filtering, pagination, etc.
   * @returns {Promise} - Response from API
   */
  async getAllUsers(queryParams = {}) {
    try {
      const response = await apiClient.get(SUPER_ADMIN_API.USERS, { params: queryParams });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {string} id - User ID
   * @returns {Promise} - Response from API
   */
  async getUserById(id) {
    try {
      const response = await apiClient.get(`${SUPER_ADMIN_API.USERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create user (superadmin only)
   * @param {Object} userData - User data
   * @returns {Promise} - Response from API
   */
  async createUser(userData) {
    try {
      const response = await apiClient.post(SUPER_ADMIN_API.USERS, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} userData - User data to update
   * @returns {Promise} - Response from API
   */
  async updateUser(id, userData) {
    try {
      const response = await apiClient.put(`${SUPER_ADMIN_API.USERS}/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Activate user
   * @param {string} id - User ID
   * @returns {Promise} - Response from API
   */
  async activateUser(id) {
    try {
      const response = await apiClient.patch(`${SUPER_ADMIN_API.USERS}/${id}/activate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deactivate user
   * @param {string} id - User ID
   * @returns {Promise} - Response from API
   */
  async deactivateUser(id) {
    try {
      const response = await apiClient.patch(`${SUPER_ADMIN_API.USERS}/${id}/deactivate`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reset user password
   * @param {string} id - User ID
   * @returns {Promise} - Response from API
   */
  async resetPassword(id) {
    try {
      const response = await apiClient.post(`${SUPER_ADMIN_API.USERS}/${id}/reset-password`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete user
   * @param {string} id - User ID
   * @returns {Promise} - Response from API
   */
  async deleteUser(id) {
    try {
      const response = await apiClient.delete(`${SUPER_ADMIN_API.USERS}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get user statistics
   * @returns {Promise} - Response from API
   */
  async getUserStats() {
    try {
      const response = await apiClient.get(`${SUPER_ADMIN_API.USERS}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export default new UserService();
