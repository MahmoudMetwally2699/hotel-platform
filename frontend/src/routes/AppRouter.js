/**
 * App Router Configuration
 * Sets up all routes with proper authentication and role-based access
 */

import React, { Suspense, lazy } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import ProtectedRoute from '../components/common/ProtectedRoute';
import TailwindLayout from '../layouts/TailwindLayout';
import LoadingScreen from '../components/common/LoadingScreen';

// Lazy loaded pages for better performance
// Auth Pages
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));
const SuperAdminLoginPage = lazy(() => import('../pages/auth/SuperAdminLoginPage'));
const HotelAdminLoginPage = lazy(() => import('../pages/auth/HotelAdminLoginPage'));
const HotelForgotPasswordPage = lazy(() => import('../pages/auth/HotelForgotPasswordPage'));
const HotelResetPasswordPage = lazy(() => import('../pages/auth/HotelResetPasswordPage'));
const ServiceProviderLoginPage = lazy(() => import('../pages/auth/ServiceProviderLoginPage'));
const RegisterPage = lazy(() => import('../pages/auth/RegisterPage'));
const ForgotPasswordPage = lazy(() => import('../pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('../pages/auth/ResetPasswordPage'));

// Public Pages
const HomePage = lazy(() => import('../pages/client/HomePage'));
const ServiceListPage = lazy(() => import('../pages/client/ServiceListPage'));
const ServiceDetailsPage = lazy(() => import('../pages/client/ServiceDetailsPage'));
const MyHotelServicesPage = lazy(() => import('../pages/client/MyHotelServicesPage'));
const MyOrdersPage = lazy(() => import('../pages/client/MyOrdersPage'));
const HotelListPage = lazy(() => import('../pages/client/HotelListPage'));
const HotelCategoryServicesPage = lazy(() => import('../pages/client/HotelCategoryServicesPage'));
const LaundryBookingPage = lazy(() => import('../pages/client/LaundryBookingPage'));
const RestaurantBookingPage = lazy(() => import('../pages/client/RestaurantBookingPage'));
const TransportationBookingPage = lazy(() => import('../pages/client/TransportationBookingPage'));
const HousekeepingBookingPage = lazy(() => import('../pages/guest/HousekeepingBookingPage'));
const GuestTransportationBookings = lazy(() => import('../pages/guest/GuestTransportationBookings'));
const GuestLaundryBookings = lazy(() => import('../pages/guest/GuestLaundryBookings'));
const GuestRestaurantBookings = lazy(() => import('../pages/guest/GuestRestaurantBookings'));
const GuestHousekeepingBookings = lazy(() => import('../pages/guest/GuestHousekeepingBookings'));
const PaymentSuccess = lazy(() => import('../pages/guest/PaymentSuccess'));
const PaymentFailed = lazy(() => import('../pages/guest/PaymentFailed'));
const PaymentMethodSelectionPage = lazy(() => import('../pages/client/PaymentMethodSelectionPage'));
const ProfilePage = lazy(() => import('../pages/common/ProfilePage'));
const AdminAccessPage = lazy(() => import('../pages/common/AdminAccessPage'));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('../pages/superadmin/DashboardPage'));
const SuperAdminHotelsPage = lazy(() => import('../pages/superadmin/HotelsPage'));
const SuperAdminHotelAdminsPage = lazy(() => import('../pages/superadmin/HotelAdminsPage'));
const SuperAdminAnalyticsPage = lazy(() => import('../pages/superadmin/AnalyticsPage'));
const SuperAdminPaymentManagementPage = lazy(() => import('../pages/superadmin/PaymentManagementPage'));
const SuperAdminPlatformMetricsPage = lazy(() => import('../pages/superadmin/PlatformMetricsPage'));
const SuperAdminSettingsPage = lazy(() => import('../pages/superadmin/SettingsPage'));
const SuperHotelsPage = lazy(() => import('../pages/superadmin/SuperHotelsPage'));

// Super Hotel Admin Pages
const SuperHotelLogin = lazy(() => import('../pages/admin/SuperHotelLogin'));
const SuperHotelDashboard = lazy(() => import('../pages/admin/SuperHotelDashboard'));
const SuperHotelHotels = lazy(() => import('../pages/admin/SuperHotelHotels'));
const SuperHotelAnalytics = lazy(() => import('../pages/admin/SuperHotelAnalytics'));
const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const SuperHotelAuthWrapper = lazy(() => import('../components/common/SuperHotelAuthWrapper'));

// Hotel Admin Pages
const HotelAdminDashboard = lazy(() => import('../pages/hotel/DashboardPage'));
const HotelAdminOrdersPage = lazy(() => import('../pages/hotel/OrdersPage'));
const HotelAdminServiceProvidersPage = lazy(() => import('../pages/hotel/ServiceProvidersPage'));
const HotelAdminManageProvidersPage = lazy(() => import('../pages/hotel/ManageProvidersPage'));
const HotelAdminServicesPage = lazy(() => import('../pages/hotel/ServicesPage'));
const HotelAdminBookingsPage = lazy(() => import('../pages/hotel/BookingsPage'));
const HotelAdminGuestsPage = lazy(() => import('../pages/hotel/GuestsPage'));
const HotelAdminUserManagementPage = lazy(() => import('../pages/hotel/UserManagementPage'));
const HotelAdminRevenuePage = lazy(() => import('../pages/hotel/RevenuePage'));
const HotelAdminMarkupSettingsPage = lazy(() => import('../pages/hotel/MarkupSettingsPage'));
const HotelAdminProviderAnalyticsPage = lazy(() => import('../pages/hotel/ProviderAnalyticsPage'));
const HotelAdminSettingsPage = lazy(() => import('../pages/hotel/SettingsPage'));
const HotelAdminQRCodePage = lazy(() => import('../pages/hotel/QRCodePage'));
const CategoryProviderManagement = lazy(() => import('../components/hotel/CategoryProviderManagement'));
const ServiceProviderClients = lazy(() => import('../components/hotel/ServiceProviderClients'));
const HotelServiceProviderAnalytics = lazy(() => import('../components/hotel/HotelServiceProviderAnalytics'));

// Service Provider Pages
const TwoTierServiceDashboard = lazy(() => import('../components/service/TwoTierServiceDashboard'));
const MultiCategoryDashboard = lazy(() => import('../pages/service/MultiCategoryDashboard'));
const ServiceProviderOrdersPage = lazy(() => import('../pages/service/OrdersPage'));
const ServiceProviderOrderDetailPage = lazy(() => import('../pages/service/OrderDetailPage'));
const ServiceProviderProcessBookingsPage = lazy(() => import('../pages/service/ProcessBookingsPage'));
const ServiceProviderEarningsPage = lazy(() => import('../pages/service/EarningsPage'));
const ServiceProviderMetricsPage = lazy(() => import('../pages/service/MetricsPage'));
const ServiceProviderSettingsPage = lazy(() => import('../pages/service/SettingsPage'));
const TransportationBookingManagement = lazy(() => import('../pages/service/TransportationBookingManagement'));
const HousekeepingServiceManagement = lazy(() => import('../components/service/HousekeepingServiceManagement'));
const RestaurantServiceCreator = lazy(() => import('../components/service/RestaurantServiceCreator'));
const CategorySelectionDashboard = lazy(() => import('../components/service/CategorySelectionDashboard'));
const ServiceProviderAnalytics = lazy(() => import('../components/service/ServiceProviderAnalytics'));
const ServiceProviderServicesPage = lazy(() => import('../pages/service/ServicesPage'));

// Feedback Pages
const ServiceProviderFeedbackView = lazy(() => import('../components/service/FeedbackView'));
const HotelFeedbackView = lazy(() => import('../components/hotel/FeedbackView'));
const SuperAdminFeedbackView = lazy(() => import('../components/superadmin/FeedbackView'));
const GuestFeedbackView = lazy(() => import('../components/guest/FeedbackView'));

// Error Pages
const NotFoundPage = lazy(() => import('../pages/errors/NotFoundPage'));
const ForbiddenPage = lazy(() => import('../pages/errors/ForbiddenPage'));
const ServerErrorPage = lazy(() => import('../pages/errors/ServerErrorPage'));

const AppRouter = () => {
  return (
    <Suspense fallback={<LoadingScreen />}>      <Routes>        {/* Public Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/super-hotel-admin/login" element={<SuperHotelLogin />} />
        <Route path="/admin" element={<AdminAccessPage />} />
        <Route path="/superadmin/login" element={<SuperAdminLoginPage />} />
        <Route path="/hotel/login" element={<HotelAdminLoginPage />} />
        <Route path="/hotel/forgot-password" element={<HotelForgotPasswordPage />} />
        <Route path="/hotel/reset-password/:token" element={<HotelResetPasswordPage />} />
        <Route path="/serviceprovider/login" element={<ServiceProviderLoginPage />} />        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
        {/* Client/Guest Routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/hotels" element={<HotelListPage />} />
        <Route path="/hotels/:hotelId/categories" element={<TailwindLayout><HotelCategoryServicesPage /></TailwindLayout>} />        <Route path="/hotels/:hotelId/services/:category" element={<TailwindLayout><HotelCategoryServicesPage /></TailwindLayout>} />
        <Route path="/hotels/:hotelId/services/laundry/booking" element={<TailwindLayout><LaundryBookingPage /></TailwindLayout>} />
        <Route path="/hotels/:hotelId/services/restaurant/booking" element={<TailwindLayout><RestaurantBookingPage /></TailwindLayout>} />
        <Route path="/hotels/:hotelId/services/dining/booking" element={<TailwindLayout><RestaurantBookingPage /></TailwindLayout>} />
        <Route path="/hotels/:hotelId/services/transportation/booking" element={<TailwindLayout><TransportationBookingPage /></TailwindLayout>} />
        <Route path="/hotels/:hotelId/services/housekeeping/booking" element={<TailwindLayout><HousekeepingBookingPage /></TailwindLayout>} />
        <Route path="/guest/payment-success" element={<TailwindLayout><PaymentSuccess /></TailwindLayout>} />
        <Route path="/guest/payment-failed" element={<TailwindLayout><PaymentFailed /></TailwindLayout>} />
        <Route path="/payment-method" element={<TailwindLayout><PaymentMethodSelectionPage /></TailwindLayout>} />
        <Route path="/services/:category" element={<ServiceListPage />} />
        <Route path="/services/details/:id" element={<ServiceDetailsPage />} />

        {/* Protected Client/Guest Routes */}
        <Route
          path="/my-transportation-bookings"
          element={
            <ProtectedRoute allowedRoles="guest">
              <TailwindLayout>
                <GuestTransportationBookings />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-laundry-bookings"
          element={
            <ProtectedRoute allowedRoles="guest">
              <TailwindLayout>
                <GuestLaundryBookings />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-restaurant-bookings"
          element={
            <ProtectedRoute allowedRoles="guest">
              <TailwindLayout>
                <GuestRestaurantBookings />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-housekeeping-bookings"
          element={
            <ProtectedRoute allowedRoles="guest">
              <TailwindLayout>
                <GuestHousekeepingBookings />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-hotel-services"
          element={
            <ProtectedRoute>
              <TailwindLayout>
                <MyHotelServicesPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/my-orders"
          element={
            <ProtectedRoute allowedRoles="guest">
              <TailwindLayout>
                <MyOrdersPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <TailwindLayout>
                <ProfilePage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/feedback"
          element={
            <ProtectedRoute allowedRoles="guest">
              <TailwindLayout>
                <GuestFeedbackView />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />

        {/* Super Admin Routes */}
        <Route
          path="/superadmin/dashboard"
          element={            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminDashboard />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        <Route          path="/superadmin/hotels"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminHotelsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/super-hotels"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperHotelsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route          path="/superadmin/hotel-admins"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminHotelAdminsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        <Route          path="/superadmin/platform-metrics"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminPlatformMetricsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route          path="/superadmin/analytics"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminAnalyticsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/payment-management"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminPaymentManagementPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/superadmin/feedback"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminFeedbackView />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route          path="/superadmin/settings"
          element={
            <ProtectedRoute allowedRoles="superadmin">
              <TailwindLayout>
                <SuperAdminSettingsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        {/* Hotel Admin Routes */}
        <Route
          path="/hotel/dashboard"          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminDashboard />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/orders"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminOrdersPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/service-providers"          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminServiceProvidersPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/services"          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminServicesPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/bookings"          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminBookingsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        <Route
          path="/hotel/guests"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminGuestsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/revenue"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminRevenuePage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/feedback"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelFeedbackView />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        <Route
          path="/hotel/manage-providers"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminManageProvidersPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/user-management"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminUserManagementPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        <Route
          path="/hotel/markup-settings"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminMarkupSettingsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/category-providers"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <CategoryProviderManagement />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/provider-analytics"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminProviderAnalyticsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/provider-clients"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <ServiceProviderClients />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/analytics"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelServiceProviderAnalytics />
              </TailwindLayout>
            </ProtectedRoute>
          }        />
        <Route
          path="/hotel/qr-codes"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminQRCodePage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hotel/settings"
          element={
            <ProtectedRoute allowedRoles="hotel">
              <TailwindLayout>
                <HotelAdminSettingsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />

        {/* Service Provider Routes */}
        <Route
          path="/service/dashboard"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <TwoTierServiceDashboard />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/old-dashboard"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <MultiCategoryDashboard />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/categories"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <CategorySelectionDashboard />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/inside-services"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <TwoTierServiceDashboard />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/analytics"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderAnalytics />
              </TailwindLayout>
            </ProtectedRoute>
          }        />        <Route
          path="/service/orders"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderOrdersPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/orders/:orderId"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderOrderDetailPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/services"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderServicesPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/earnings"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderEarningsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/feedback"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderFeedbackView />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />        <Route
          path="/service/process-bookings"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderProcessBookingsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/metrics"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderMetricsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/transportation-bookings"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <TransportationBookingManagement />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/housekeeping"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <HousekeepingServiceManagement onBack={() => window.history.back()} />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/restaurant"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <RestaurantServiceCreator onBack={() => window.history.back()} />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/dining"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <RestaurantServiceCreator onBack={() => window.history.back()} />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/service/settings"
          element={
            <ProtectedRoute allowedRoles="service">
              <TailwindLayout>
                <ServiceProviderSettingsPage />
              </TailwindLayout>
            </ProtectedRoute>
          }
        />

        {/* Super Hotel Admin Routes */}
        <Route
          path="/super-hotel-admin/dashboard"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminLayout><SuperHotelDashboard /></AdminLayout>
            </Suspense>
          }
        />
        <Route
          path="/super-hotel-admin/hotels"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminLayout><SuperHotelHotels /></AdminLayout>
            </Suspense>
          }
        />
        <Route
          path="/super-hotel-admin/analytics"
          element={
            <Suspense fallback={<LoadingScreen />}>
              <AdminLayout><SuperHotelAnalytics /></AdminLayout>
            </Suspense>
          }
        />

        {/* Error Pages */}
        <Route path="/forbidden" element={<ForbiddenPage />} />
        <Route path="/server-error" element={<ServerErrorPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />

        {/* Redirect all other paths to not found */}
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRouter;
