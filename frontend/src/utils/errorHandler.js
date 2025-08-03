/**
 * Error Handler Utility
 * Provides centralized error handling and toast management
 */

import { toast } from 'react-toastify';

/**
 * Show error toast with proper error handling
 * @param {Object} error - Error object from API call
 * @param {string} fallbackMessage - Fallback message if no error message available
 * @param {Object} options - Toast options
 */
export const showErrorToast = (error, fallbackMessage = 'An error occurred', options = {}) => {
  // Check if toast should be suppressed (e.g., for 401 errors that redirect)
  if (error?.suppressToast || error?.response?.data?.suppressToast) {
    console.log('🔇 Toast suppressed for error:', error?.response?.data?.message || error?.message);
    return;
  }

  // Extract error message
  let errorMessage = fallbackMessage;

  if (error?.response?.data?.message) {
    errorMessage = error.response.data.message;
  } else if (error?.message) {
    errorMessage = error.message;
  }

  // Don't show the default auth error message
  if (errorMessage === 'You are not logged in! Please log in to get access.') {
    console.log('🔇 Suppressing default auth error message');
    return;
  }

  // Show the toast
  toast.error(errorMessage, {
    position: "top-right",
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options
  });
};

/**
 * Show success toast
 * @param {string} message - Success message
 * @param {Object} options - Toast options
 */
export const showSuccessToast = (message, options = {}) => {
  toast.success(message, {
    position: "top-right",
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options
  });
};

/**
 * Show warning toast
 * @param {string} message - Warning message
 * @param {Object} options - Toast options
 */
export const showWarningToast = (message, options = {}) => {
  toast.warning(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options
  });
};

/**
 * Show info toast
 * @param {string} message - Info message
 * @param {Object} options - Toast options
 */
export const showInfoToast = (message, options = {}) => {
  toast.info(message, {
    position: "top-right",
    autoClose: 4000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    ...options
  });
};

/**
 * Handle API errors consistently across the application
 * @param {Object} error - Error object from API call
 * @param {string} operation - Description of the operation that failed
 */
export const handleApiError = (error, operation = 'operation') => {
  console.error(`❌ ${operation} failed:`, error);

  // Check if this is a network error
  if (error?.isNetworkError) {
    showErrorToast(
      error,
      'Network error. Please check your connection and try again.'
    );
    return;
  }

  // Check for specific error codes
  if (error?.response?.status) {
    switch (error.response.status) {
      case 401:
        // Don't show toast for 401 - handled by interceptor
        console.log('🔇 401 error handled by API interceptor');
        return;
      case 403:
        showErrorToast(error, 'Access denied. You do not have permission to perform this action.');
        return;
      case 404:
        showErrorToast(error, 'The requested resource was not found.');
        return;
      case 500:
        showErrorToast(error, 'Server error. Please try again later.');
        return;
      default:
        showErrorToast(error, `Failed to ${operation}. Please try again.`);
        return;
    }
  }

  // Fallback error handling
  showErrorToast(error, `Failed to ${operation}. Please try again.`);
};

const errorHandler = {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
  showInfoToast,
  handleApiError
};

export default errorHandler;
