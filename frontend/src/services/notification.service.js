/**
 * Notification Service
 * Handles all notification-related API calls
 */

import apiClient from './api.service';
import { CLIENT_API } from '../config/api.config';

class NotificationService {
  /**
   * Get user's notifications
   * @returns {Promise} - Response from API
   */
  async getUserNotifications() {
    try {
      const response = await apiClient.get(`${CLIENT_API.NOTIFICATIONS}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark notification as read
   * @param {string} notificationId - Notification ID
   * @returns {Promise} - Response from API
   */
  async markAsRead(notificationId) {
    try {
      const response = await apiClient.patch(`${CLIENT_API.NOTIFICATIONS}/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   * @returns {Promise} - Response from API
   */
  async markAllAsRead() {
    try {
      const response = await apiClient.patch(`${CLIENT_API.NOTIFICATIONS}/read-all`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete notification
   * @param {string} notificationId - Notification ID
   * @returns {Promise} - Response from API
   */
  async deleteNotification(notificationId) {
    try {
      const response = await apiClient.delete(`${CLIENT_API.NOTIFICATIONS}/${notificationId}`);
      return response.data;
    } catch (error) {
      throw error;
    }  }
}

const notificationService = new NotificationService();
export default notificationService;
