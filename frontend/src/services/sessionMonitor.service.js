/**
 * Session Monitor Service
 *
 * Monitors user session for account deactivation and handles automatic logout
 * Checks session status periodically and forces logout if account is deactivated
 */

import apiClient from './api.service';
import { store } from '../app/store';
import { logout } from '../redux/slices/authSlice';
import { toast } from 'react-toastify';

class SessionMonitor {
  constructor() {
    this.intervalId = null;
    this.isMonitoring = false;
    this.checkInterval = 5 * 60 * 1000; // Check every 5 minutes
  }

  /**
   * Start monitoring the user session
   */
  startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;

    // Check immediately
    this.checkSession();

    // Set up periodic checks
    this.intervalId = setInterval(() => {
      this.checkSession();
    }, this.checkInterval);

    console.log('🔍 Session monitoring started');
  }

  /**
   * Stop monitoring the user session
   */
  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isMonitoring = false;
    console.log('🔍 Session monitoring stopped');
  }

  /**
   * Check if the user session is still valid
   */
  async checkSession() {
    try {
      const state = store.getState();
      const { isAuthenticated, token } = state.auth;

      // Only check if user is logged in
      if (!isAuthenticated || !token) {
        return;
      }

      // Make a lightweight API call to verify session
      await apiClient.get('/auth/verify-session');

    } catch (error) {
      if (error.response?.status === 401) {
        const errorMessage = error.response?.data?.message || 'Session expired';

        // Check if it's a checkout expiration
        if (errorMessage.includes('checkout time has passed')) {
          this.handleCheckoutExpiration();
        } else if (errorMessage.includes('deactivated')) {
          this.handleAccountDeactivation();
        } else {
          this.handleSessionExpiration();
        }
      }
    }
  }

  /**
   * Handle account deactivation due to checkout expiration
   */
  handleCheckoutExpiration() {
    console.log('🏨 Account deactivated - checkout time expired');

    // Force logout
    store.dispatch(logout());

    // Show specific message for checkout expiration
    toast.error(
      'Your checkout time has passed and your account has been deactivated. Please contact hotel reception for assistance.',
      {
        position: 'top-center',
        autoClose: 10000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      }
    );

    // Stop monitoring
    this.stopMonitoring();

    // Redirect to login page after a delay
    setTimeout(() => {
      window.location.href = '/login?reason=checkout_expired';
    }, 2000);
  }

  /**
   * Handle general account deactivation
   */
  handleAccountDeactivation() {
    console.log('🚫 Account deactivated');

    // Force logout
    store.dispatch(logout());

    // Show general deactivation message
    toast.error(
      'Your account has been deactivated. Please contact support for assistance.',
      {
        position: 'top-center',
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
      }
    );

    // Stop monitoring
    this.stopMonitoring();

    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login?reason=deactivated';
    }, 2000);
  }

  /**
   * Handle general session expiration
   */
  handleSessionExpiration() {
    console.log('⏰ Session expired');

    // Force logout
    store.dispatch(logout());

    // Show session expiration message
    toast.warning(
      'Your session has expired. Please log in again.',
      {
        position: 'top-center',
        autoClose: 5000,
      }
    );

    // Stop monitoring
    this.stopMonitoring();

    // Redirect to login page
    setTimeout(() => {
      window.location.href = '/login?reason=session_expired';
    }, 1500);
  }

  /**
   * Get monitoring status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      checkInterval: this.checkInterval,
      hasInterval: !!this.intervalId
    };
  }

  /**
   * Update check interval
   */
  setCheckInterval(interval) {
    this.checkInterval = interval;

    if (this.isMonitoring) {
      this.stopMonitoring();
      this.startMonitoring();
    }
  }
}

// Create singleton instance
const sessionMonitor = new SessionMonitor();

export default sessionMonitor;
