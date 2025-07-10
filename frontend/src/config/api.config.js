/**
 * API Configuration
 * This file contains all API endpoints used in the application
 */

export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Authentication endpoints
export const AUTH_API = {
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  LOGOUT: `${API_BASE_URL}/auth/logout`,
  REFRESH_TOKEN: `${API_BASE_URL}/auth/refresh-token`,
  CHECK: `${API_BASE_URL}/auth/check`,
  FORGOT_PASSWORD: `${API_BASE_URL}/auth/forgot-password`,
  RESET_PASSWORD: `${API_BASE_URL}/auth/reset-password`,
  VERIFY_RESET_TOKEN: `${API_BASE_URL}/auth/verify-reset-token`,
  VERIFY_EMAIL: `${API_BASE_URL}/auth/verify-email`,
  RESEND_VERIFICATION: `${API_BASE_URL}/auth/resend-verification`,
  PROFILE: `${API_BASE_URL}/auth/profile`,
  UPDATE_AVATAR: `${API_BASE_URL}/auth/update-avatar`,
  CHANGE_PASSWORD: `${API_BASE_URL}/auth/change-password`,
};

// Guest/Client endpoints
export const CLIENT_API = {
  HOTELS: `${API_BASE_URL}/client/hotels`,
  SERVICES: `${API_BASE_URL}/client/services`,
  BOOKINGS: `${API_BASE_URL}/client/bookings`,
  REGISTER: `${API_BASE_URL}/client/register`,
  LOGIN: `${API_BASE_URL}/client/login`,
  NOTIFICATIONS: `${API_BASE_URL}/client/notifications`,
};

// SuperAdmin endpoints
export const SUPERADMIN_API = {
  DASHBOARD: `${API_BASE_URL}/superadmin/dashboard`,
  HOTELS: `${API_BASE_URL}/superadmin/hotels`,
  HOTEL_ADMINS: `${API_BASE_URL}/superadmin/hotel-admins`,
  ANALYTICS: `${API_BASE_URL}/superadmin/analytics`,
  DISPUTES: `${API_BASE_URL}/superadmin/disputes`,
  SETTINGS: `${API_BASE_URL}/superadmin/settings`,
  PLATFORM_METRICS: `${API_BASE_URL}/superadmin/platform-metrics`,
};

// Keeping the old name for backwards compatibility
export const SUPER_ADMIN_API = SUPERADMIN_API;

// Hotel Admin endpoints
export const HOTEL_API = {
  DASHBOARD: `${API_BASE_URL}/hotel/dashboard`,
  PROFILE: `${API_BASE_URL}/hotel/profile`,
  SERVICE_PROVIDERS: `${API_BASE_URL}/hotel/service-providers`,
  SERVICES: `${API_BASE_URL}/hotel/services`,
  MARKUP_SETTINGS: `${API_BASE_URL}/hotel/markup-settings`,
  BOOKINGS: `${API_BASE_URL}/hotel/bookings`,
  GUESTS: `${API_BASE_URL}/hotel/guests`,
  REVENUE: `${API_BASE_URL}/hotel/revenue`,
  ANALYTICS: `${API_BASE_URL}/hotel/analytics`,
  USER_MANAGEMENT: `${API_BASE_URL}/hotel/users`,
  MANAGE_PROVIDERS: `${API_BASE_URL}/hotel/manage-providers`,
  PROVIDER_ANALYTICS: `${API_BASE_URL}/hotel/provider-analytics`,
};

// Keeping the old name for backwards compatibility
export const HOTEL_ADMIN_API = HOTEL_API;

// Service Provider endpoints
export const SERVICE_API = {
  DASHBOARD: `${API_BASE_URL}/service/dashboard`,
  PROFILE: `${API_BASE_URL}/service/profile`,
  SERVICES: `${API_BASE_URL}/service/services`,
  ORDERS: `${API_BASE_URL}/service/orders`,
  EARNINGS: `${API_BASE_URL}/service/earnings`,
  ANALYTICS: `${API_BASE_URL}/service/analytics`,
  SUPERADMIN_ANALYTICS: `${API_BASE_URL}/service/superadmin/analytics`,
  STATS: `${API_BASE_URL}/service/stats`,
  LIST: `${API_BASE_URL}/service/providers`,
  DETAILS: `${API_BASE_URL}/service/providers`,
  CATEGORIES: `${API_BASE_URL}/service/categories`,
  PROCESS_BOOKINGS: `${API_BASE_URL}/service/process-bookings`,
  METRICS: `${API_BASE_URL}/service/metrics`,
};

// Keeping the old name for backwards compatibility
export const SERVICE_PROVIDER_API = SERVICE_API;

// Payment endpoints
export const PAYMENT_API = {
  CREATE_INTENT: `${API_BASE_URL}/payments/create-intent`,
  CONFIRM: `${API_BASE_URL}/payments/confirm`,
  HISTORY: `${API_BASE_URL}/payments/history`,
  REFUND: `${API_BASE_URL}/payments/refund`,
};

// Upload endpoints
export const UPLOAD_API = {
  SINGLE: `${API_BASE_URL}/upload/single`,
  MULTIPLE: `${API_BASE_URL}/upload/multiple`,
  HOTEL_IMAGES: `${API_BASE_URL}/upload/hotel-images`,
  SERVICE_IMAGES: `${API_BASE_URL}/upload/service-images`,
  AVATAR: `${API_BASE_URL}/upload/avatar`,
  DOCUMENTS: `${API_BASE_URL}/upload/documents`,
  DELETE: `${API_BASE_URL}/upload/delete`,
};

// Socket.io events
export const SOCKET_EVENTS = {
  BOOKING_CREATED: 'booking:created',
  BOOKING_UPDATED: 'booking:updated',
  BOOKING_CANCELLED: 'booking:cancelled',
  PAYMENT_RECEIVED: 'payment:received',
  SERVICE_APPROVED: 'service:approved',
  SERVICE_REJECTED: 'service:rejected',
  NOTIFICATION: 'notification',
};
