/**
 * API Configuration
 * This file contains all API endpoints used in the application
 */

// Dynamic API base URL configuration for different environments
const getApiBaseUrl = () => {
  // Always use the environment variable or fallback to localhost
  // This works for both development and production
  return process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Authentication endpoints
export const AUTH_API = {
  REGISTER: `/auth/register`,
  LOGIN: `/auth/login`,
  LOGOUT: `/auth/logout`,
  REFRESH_TOKEN: `/auth/refresh-token`, // Use relative path for consistency
  CHECK: `/auth/me`, // Fixed to match backend route
  FORGOT_PASSWORD: `/auth/forgot-password`,
  RESET_PASSWORD: `/auth/reset-password`,
  VERIFY_RESET_TOKEN: `/auth/verify-reset-token`,
  PROFILE: `/auth/profile`,
  UPDATE_AVATAR: `/auth/update-avatar`,
  CHANGE_PASSWORD: `/auth/change-password`,
};

// Guest/Client endpoints
export const CLIENT_API = {
  HOTELS: `/client/hotels`,
  SERVICES: `/client/services`,
  BOOKINGS: `/client/bookings`,
  REGISTER: `/auth/register`, // Use auth register endpoint for clients
  LOGIN: `/auth/login`, // Use auth login endpoint for clients
  NOTIFICATIONS: `/client/notifications`,
};

// SuperAdmin endpoints
export const SUPERADMIN_API = {
  DASHBOARD: `/superadmin/dashboard`,
  HOTELS: `/superadmin/hotels`,
  HOTEL_ADMINS: `/superadmin/hotel-admins`,
  ANALYTICS: `/superadmin/analytics`,
  DISPUTES: `/superadmin/disputes`,
  SETTINGS: `/superadmin/settings`,
  PLATFORM_METRICS: `/superadmin/platform-metrics`,
};

// Keeping the old name for backwards compatibility
export const SUPER_ADMIN_API = SUPERADMIN_API;

// Hotel Admin endpoints
export const HOTEL_API = {
  DASHBOARD: `/hotel/dashboard`,
  PROFILE: `/hotel/profile`,
  SERVICE_PROVIDERS: `/hotel/service-providers`,
  SERVICES: `/hotel/services`,
  MARKUP_SETTINGS: `/hotel/markup-settings`,
  BOOKINGS: `/hotel/bookings`,
  GUESTS: `/hotel/guests`,
  REVENUE: `/hotel/revenue`,
  ANALYTICS: `/hotel/analytics`,
  USER_MANAGEMENT: `/hotel/users`,
  MANAGE_PROVIDERS: `/hotel/manage-providers`,
  PROVIDER_ANALYTICS: `/hotel/provider-analytics`,
};

// Keeping the old name for backwards compatibility
export const HOTEL_ADMIN_API = HOTEL_API;

// Service Provider endpoints
export const SERVICE_API = {
  DASHBOARD: `/service/dashboard`,
  PROFILE: `/service/profile`,
  SERVICES: `/service/services`,
  ORDERS: `/service/orders`,
  EARNINGS: `/service/earnings`,
  ANALYTICS: `/service/analytics`,
  SUPERADMIN_ANALYTICS: `/service/superadmin/analytics`,
  STATS: `/service/stats`,
  LIST: `/service/providers`,
  DETAILS: `/service/providers`,
  CATEGORIES: `/service/categories`,
  CATEGORY_TEMPLATES: `/service/category-templates`,
  SERVICES_BY_CATEGORY: `/service/services-by-category`,
  PROCESS_BOOKINGS: `/service/process-bookings`,
  METRICS: `/service/metrics`,
};

// Keeping the old name for backwards compatibility
export const SERVICE_PROVIDER_API = SERVICE_API;

// Payment endpoints
export const PAYMENT_API = {
  CREATE_INTENT: `/payments/create-intent`,
  CONFIRM: `/payments/confirm`,
  HISTORY: `/payments/history`,
  REFUND: `/payments/refund`,
};

// Upload endpoints
export const UPLOAD_API = {
  SINGLE: `/upload/single`,
  MULTIPLE: `/upload/multiple`,
  HOTEL_IMAGES: `/upload/hotel-images`,
  SERVICE_IMAGES: `/upload/service-images`,
  AVATAR: `/upload/avatar`,
  DOCUMENTS: `/upload/documents`,
  DELETE: `/upload/delete`,
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
