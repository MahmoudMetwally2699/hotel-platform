/**
 * Hotel Admin Dashboard Page
 * Main dashboard for hotel administrators
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchHotelStats, selectHotelStats, selectHotelStatsLoading, selectHotelCurrency } from '../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../utils/currency';
import RoomOverview from '../../components/hotel/RoomOverview';
import { useTheme } from '../../context/ThemeContext';

const DashboardPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const dashboardStats = useSelector(selectHotelStats);
  const isLoading = useSelector(selectHotelStatsLoading);
  const currency = useSelector(selectHotelCurrency);
  const isRtl = i18n.dir() === 'rtl';

  useEffect(() => {
    dispatch(fetchHotelStats());
  }, [dispatch]);
  // Extract stats from dashboard data
  const stats = dashboardStats ? {
    revenue: {
      total: dashboardStats.revenueStats?.[0]?.totalRevenue || 0,
      trend: 5.3 // This would be calculated from monthlyTrends in real implementation
    },
    bookings: {
      total: dashboardStats.counts?.totalBookings || 0,
      trend: 3.1 // This would be calculated from monthlyTrends in real implementation
    },
    services: {
      total: dashboardStats.counts?.activeServices || 0,
      categories: dashboardStats.servicesByCategory?.length || 0
    },
    serviceProviders: {
      total: dashboardStats.counts?.totalProviders || 0,
      active: dashboardStats.counts?.activeProviders || 0
    }
  } : {
    revenue: { total: 0, trend: 0 },
    bookings: { total: 0, trend: 0 },
    services: { total: 0, categories: 0 },
    serviceProviders: { total: 0, active: 0 }
  };

  const recentOrders = dashboardStats?.recentBookings || [];

  // Debug logging to understand data structure
  useEffect(() => {

  }, [dashboardStats]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="w-full space-y-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-lightBlue border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-modern-blue border-t-transparent animate-ping opacity-20"></div>
            </div>
          </div>
        ) : (
          <>
            {/* Stats Grid (flat cards like screenshot) */}
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className={`${isRtl ? 'text-right' : 'text-left'}`}>
                <h1 className="text-xl sm:text-2xl font-bold" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.title')}</h1>
                <p className="text-sm text-modern-darkGray mt-1">{t('hotelAdmin.dashboard.subtitle')}</p>
              </div>
              <button
                className="inline-flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-full border bg-white hover:shadow-sm transition"
                style={{ borderColor: `${theme.primaryColor}40`, color: theme.primaryColor }}
                onClick={() => dispatch(fetchHotelStats())}
                disabled={isLoading}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{isLoading ? t('hotelAdmin.dashboard.refreshing') : t('hotelAdmin.dashboard.refreshData')}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Revenue Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stats.revenue.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.revenue.trend > 0 ? '+' : ''}{stats.revenue.trend}%
                  </span>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}12` }}>
                    <svg className="w-6 h-6" style={{ color: theme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className={`${isRtl ? 'text-right' : 'text-left'} mt-4`}>
                  <div className="text-sm text-modern-darkGray font-semibold">{t('hotelAdmin.dashboard.stats.totalRevenue')}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: theme.primaryColor }}>{formatPriceByLanguage(stats.revenue.total, i18n.language, currency)}</div>
                  <div className="text-xs text-modern-darkGray mt-1">{t('hotelAdmin.dashboard.stats.vsLastMonth')}</div>
                </div>
              </div>

              {/* Bookings Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${stats.bookings.trend > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {stats.bookings.trend > 0 ? '+' : ''}{stats.bookings.trend}%
                  </span>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}12` }}>
                    <svg className="w-6 h-6" style={{ color: theme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                  </div>
                </div>
                <div className={`${isRtl ? 'text-right' : 'text-left'} mt-4`}>
                  <div className="text-sm text-modern-darkGray font-semibold">{t('hotelAdmin.dashboard.stats.totalBookings')}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: theme.primaryColor }}>{stats.bookings.total}</div>
                  <div className="text-xs text-modern-darkGray mt-1">{t('hotelAdmin.dashboard.stats.vsLastMonth')}</div>
                </div>
              </div>

              {/* Services Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: `${theme.primaryColor}12`, color: theme.primaryColor }}>
                    {stats.services.categories} {t('hotelAdmin.dashboard.stats.categories')}
                  </span>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}12` }}>
                    <svg className="w-6 h-6" style={{ color: theme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className={`${isRtl ? 'text-right' : 'text-left'} mt-4`}>
                  <div className="text-sm text-modern-darkGray font-semibold">{t('hotelAdmin.dashboard.stats.activeServices')}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: theme.primaryColor }}>{stats.services.total}</div>
                  <div className="text-xs text-modern-darkGray mt-1">{t('hotelAdmin.dashboard.stats.acrossAllCategories')}</div>
                </div>
              </div>

              {/* Service Providers Card */}
              <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
                <div className="flex items-start justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                    {stats.serviceProviders.active} {t('hotelAdmin.dashboard.stats.active')}
                  </span>
                  <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}12` }}>
                    <svg className="w-6 h-6" style={{ color: theme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className={`${isRtl ? 'text-right' : 'text-left'} mt-4`}>
                  <div className="text-sm text-modern-darkGray font-semibold">{t('hotelAdmin.dashboard.stats.serviceProviders')}</div>
                  <div className="text-2xl font-bold mt-1" style={{ color: theme.primaryColor }}>{stats.serviceProviders.total}</div>
                  <div className="text-xs text-modern-darkGray mt-1">{t('hotelAdmin.dashboard.stats.totalRegistered')}</div>
                </div>
              </div>
            </div>

            {/* Room Request Overview */}
            <RoomOverview />

            {/* Modern Recent Orders Table */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden">
              <div className="px-8 py-6" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t('hotelAdmin.dashboard.recentOrders.title')}
                </h2>
                <p className="text-blue-100 mt-1">{t('hotelAdmin.dashboard.recentOrders.subtitle')}</p>
              </div>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="min-w-full">
                  <thead className="bg-modern-gray">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.orderId')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.guest')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.service')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.provider')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.date')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.amount')}</th>
                      <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: theme.primaryColor }}>{t('hotelAdmin.dashboard.recentOrders.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {recentOrders?.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order._id} className="hover:bg-modern-gray transition-colors duration-200">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }}>
                              #{order.bookingId || order._id?.slice(-6)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primaryColor }}>
                                {order.guestId?.firstName?.charAt(0) || order.guestDetails?.firstName?.charAt(0) || 'G'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900">
                                  {(() => {
                                    const guest = order.guestId || order.guestDetails || order.guest || {};
                                    const firstName = guest.firstName?.trim() || '';
                                    const lastName = guest.lastName?.trim() || '';

                                    // Check if both names exist and are valid (not 'undefined' string)
                                    if (firstName && lastName &&
                                        lastName !== 'undefined' &&
                                        firstName !== lastName) {
                                      return `${firstName} ${lastName}`;
                                    }

                                    // If only first name or names are the same, return first name only
                                    if (firstName) return firstName;

                                    // Fallback to other name fields
                                    return guest.name ||
                                           order.fullGuestName ||
                                           order.customerName ||
                                           order.guestName ||
                                           t('hotelAdmin.dashboard.recentOrders.unknownGuest');
                                  })()}
                                </div>
                                <div className="text-sm text-modern-darkGray">
                                  {order.guestId?.email || order.guestDetails?.email || order.guest?.email || t('hotelAdmin.dashboard.recentOrders.noEmail')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 capitalize">
                                {order.serviceId?.category || order.serviceDetails?.category || order.serviceType || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col">
                              <span className="text-sm text-modern-darkGray">
                                {order.serviceProviderId?.businessName || t('hotelAdmin.dashboard.recentOrders.unknownProvider')}
                              </span>
                              {order.serviceProviderId?.businessName?.includes('Internal Services') && (
                                <span className="text-xs px-2 py-1 rounded mt-1" style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }}>
                                  {t('hotelAdmin.dashboard.recentOrders.hotelManaged')}
                                </span>
                              )}
                              {typeof order.serviceProviderId === 'string' && (
                                <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded mt-1">
                                  ID: {order.serviceProviderId.slice(-6)}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm text-modern-darkGray">
                              {new Date(order.createdAt || order.date).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {formatPriceByLanguage(
                                order.pricing?.totalAmount ||
                                order.payment?.totalAmount ||
                                order.totalAmount ||
                                order.finalPrice ||
                                order.quotedPrice || 0,
                                i18n.language,
                                currency
                              )}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full
                                ${(order.status === 'completed' || order.bookingStatus === 'completed') ? 'bg-green-100 text-green-800' :
                                  (order.status === 'cancelled' || order.bookingStatus === 'cancelled') ? 'bg-red-100 text-red-800' :
                                  (order.status === 'pending' || order.bookingStatus === 'pending_quote' || order.bookingStatus === 'quote_sent' || order.bookingStatus === 'payment_pending') ? 'bg-yellow-100 text-yellow-800' :
                                  (order.status === 'confirmed' || order.bookingStatus === 'quote_accepted' || order.bookingStatus === 'payment_completed') ? '' :
                                  (order.bookingStatus === 'service_active') ? 'bg-indigo-100 text-indigo-800' :
                                  'bg-gray-100 text-gray-800'}`}
                              style={(order.status === 'confirmed' || order.bookingStatus === 'quote_accepted' || order.bookingStatus === 'payment_completed') ? { backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor } : {}}
                            >
                              {(() => {
                                // Map transportation booking statuses to display names
                                const bookingStatus = order.bookingStatus || order.status;
                                const statusMap = {
                                  'pending_quote': 'pending',
                                  'quote_sent': 'pending',
                                  'payment_pending': 'pending',
                                  'quote_accepted': 'confirmed',
                                  'payment_completed': 'confirmed',
                                  'service_active': 'in progress',
                                  'completed': 'completed',
                                  'cancelled': 'cancelled',
                                  'quote_rejected': 'cancelled',
                                  'quote_expired': 'cancelled'
                                };
                                return statusMap[bookingStatus] || bookingStatus || 'processing';
                              })()}
                            </span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-12 text-center">
                          <div className="text-modern-darkGray">
                            <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-sm">{t('hotelAdmin.dashboard.recentOrders.noOrders')}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden">
                {recentOrders?.length > 0 ? (
                  <div className="space-y-4 p-4">
                    {recentOrders.map((order) => (
                      <div key={order._id} className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow duration-200">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }}>
                            #{order.bookingId || order._id?.slice(-6)}
                          </span>
                          <span
                            className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full
                              ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? '' :
                                'bg-gray-100 text-gray-800'}`}
                            style={order.status === 'confirmed' ? { backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor } : {}}
                          >
                            {order.status || 'processing'}
                          </span>
                        </div>

                        <div className="flex items-center mb-3">
                          <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primaryColor }}>
                            {order.guestId?.firstName?.charAt(0) || order.guestDetails?.firstName?.charAt(0) || 'G'}
                          </div>
                          <div className="ml-3 flex-1">
                            <div className="text-sm font-semibold text-gray-900">
                              {(() => {
                                const guest = order.guestId || order.guestDetails || order.guest || {};
                                const firstName = guest.firstName?.trim() || '';
                                const lastName = guest.lastName?.trim() || '';

                                // Check if both names exist and are valid (not 'undefined' string)
                                if (firstName && lastName &&
                                    lastName !== 'undefined' &&
                                    firstName !== lastName) {
                                  return `${firstName} ${lastName}`;
                                }

                                // If only first name or names are the same, return first name only
                                if (firstName) return firstName;

                                // Fallback to other name fields
                                return guest.name ||
                                       order.fullGuestName ||
                                       order.customerName ||
                                       order.guestName ||
                                       t('hotelAdmin.dashboard.recentOrders.unknownGuest');
                              })()}
                            </div>
                            <div className="text-xs text-modern-darkGray">
                              {order.guestId?.email || order.guestDetails?.email || t('hotelAdmin.dashboard.recentOrders.noEmail')}
                            </div>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-modern-darkGray">{t('hotelAdmin.dashboard.recentOrders.service')}</span>
                            <div className="text-right">
                              <div className="text-sm font-medium text-gray-900 capitalize">
                                {order.serviceId?.category || order.serviceDetails?.category || order.serviceType || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                              </div>
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-modern-darkGray">{t('hotelAdmin.dashboard.recentOrders.provider')}</span>
                            <div className="text-right">
                              <div className="text-sm text-modern-darkGray">
                                {order.serviceProviderId?.businessName || t('hotelAdmin.dashboard.recentOrders.unknownProvider')}
                              </div>
                              {order.serviceProviderId?.businessName?.includes('Internal Services') && (
                                <span className="text-xs px-2 py-1 rounded" style={{ color: theme.primaryColor, backgroundColor: `${theme.primaryColor}10` }}>
                                  {t('hotelAdmin.dashboard.recentOrders.hotelManaged')}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex justify-between items-center">
                            <span className="text-xs font-medium text-modern-darkGray">{t('hotelAdmin.dashboard.recentOrders.date')}</span>
                            <span className="text-sm text-modern-darkGray">
                              {new Date(order.createdAt || order.date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                            <span className="text-sm font-medium text-modern-darkGray">{t('hotelAdmin.dashboard.recentOrders.amount')}</span>
                            <span className="text-lg font-bold text-gray-900">
                              ${(order.pricing?.totalAmount ||
                                 order.payment?.totalAmount ||
                                 order.totalAmount ||
                                 order.finalPrice ||
                                 order.quotedPrice || 0).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <div className="text-modern-darkGray">
                      <svg className="mx-auto h-12 w-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <p className="text-sm">{t('hotelAdmin.dashboard.recentOrders.noOrders')}</p>
                    </div>
                  </div>
                )}
              </div>
              <div className="px-8 py-4 bg-modern-gray border-t border-gray-100">
                <button className="text-modern-blue hover:text-modern-darkBlue font-semibold flex items-center transition-colors duration-200">
                  <span>{t('hotelAdmin.dashboard.quickActions.viewOrders')}</span>
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modern Revenue Overview */}
            <div className="bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden">
              <div className="px-8 py-6" style={{ background: `linear-gradient(to right, ${theme.secondaryColor}, ${theme.primaryColor})` }}>
                <h2 className="text-xl font-bold text-white flex items-center">
                  <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {t('hotelAdmin.revenue.title')}
                </h2>
                <p className="text-blue-100 mt-1">{t('hotelAdmin.revenue.subtitle')}</p>
              </div>

              <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  {/* Hotel Commission Card */}
                  <div className="relative p-6 rounded-2xl text-white overflow-hidden" style={{ backgroundColor: theme.primaryColor }}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-6 -translate-y-6"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium opacity-90 mb-2">{t('hotelAdmin.revenue.stats.hotelCommission')}</h3>
                      <p className="text-2xl font-bold mb-2">
                        {formatPriceByLanguage(dashboardStats?.revenueStats?.[0]?.hotelEarnings || 0, i18n.language, currency)}
                      </p>
                      <p className="text-sm opacity-75">{t('hotelAdmin.revenue.stats.totalRevenue')}</p>
                    </div>
                  </div>

                  {/* Total Revenue Card */}
                  <div className="relative p-6 rounded-2xl text-white overflow-hidden" style={{ backgroundColor: theme.secondaryColor }}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-6 -translate-y-6"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium opacity-90 mb-2">{t('hotelAdmin.revenue.stats.totalRevenue')}</h3>
                      <p className="text-2xl font-bold mb-2">
                        {formatPriceByLanguage(dashboardStats?.revenueStats?.[0]?.totalRevenue || 0, i18n.language, currency)}
                      </p>
                      <p className="text-sm opacity-75">{t('hotelAdmin.revenue.stats.totalBookings')}</p>
                    </div>
                  </div>

                  {/* Average Order Value Card */}
                  <div className="relative p-6 rounded-2xl text-white overflow-hidden" style={{ backgroundColor: theme.primaryColor }}>
                    <div className="absolute top-0 right-0 w-20 h-20 bg-white opacity-10 rounded-full transform translate-x-6 -translate-y-6"></div>
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-4">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3-3-3h1m1 4h6m-7-7h7m-7 0V8a3 3 0 013-3h3a3 3 0 013 3v8a3 3 0 01-3 3h-3a3 3 0 01-3-3z" />
                        </svg>
                      </div>
                      <h3 className="text-sm font-medium opacity-90 mb-2">{t('hotelAdmin.revenue.stats.averageOrder')}</h3>
                      <p className="text-2xl font-bold mb-2">
                        {formatPriceByLanguage(dashboardStats?.revenueStats?.[0]?.averageOrderValue || 0, i18n.language, currency)}
                      </p>
                      <p className="text-sm opacity-75">{t('hotelAdmin.revenue.stats.totalBookings')}</p>
                    </div>
                  </div>
                </div>

                {/* Category Performance */}
                {dashboardStats?.categoryPerformance?.length > 0 && (
                  <div>
                    <h3 className="text-lg font-bold mb-6 flex items-center" style={{ color: theme.primaryColor }}>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                      </svg>
                      {t('hotelAdmin.revenue.charts.revenueByCategory')}
                    </h3>
                    <div className="space-y-4">
                      {dashboardStats.categoryPerformance.map((category, index) => (
                        <div key={index} className="rounded-xl p-4 sm:p-6 hover:shadow-md transition-shadow duration-300" style={{ backgroundColor: theme.backgroundColor }}>
                          {/* Desktop Layout */}
                          <div className="hidden sm:flex justify-between items-center">
                            <div className="flex items-center">
                              <div className="h-3 w-3 rounded-full mr-4" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}></div>
                              <div>
                                <span className="font-bold capitalize text-lg" style={{ color: theme.primaryColor }}>{category._id}</span>
                                <div className="flex items-center mt-1">
                                  <svg className="w-4 h-4 text-modern-darkGray mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                  </svg>
                                  <span className="text-sm text-modern-darkGray">{category.bookings} {t('hotelAdmin.dashboard.recentOrders.orderId')}</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className="font-bold text-2xl" style={{ color: theme.primaryColor }}>{formatPriceByLanguage(category.revenue, i18n.language, currency)}</span>
                              <div className="text-xs text-modern-darkGray">Revenue</div>
                            </div>
                          </div>

                          {/* Mobile Layout */}
                          <div className="sm:hidden">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center">
                                <div className="h-3 w-3 rounded-full mr-3" style={{ background: `linear-gradient(to right, ${theme.primaryColor}, ${theme.secondaryColor})` }}></div>
                                <span className="font-bold capitalize text-base" style={{ color: theme.primaryColor }}>{category._id}</span>
                              </div>
                              <span className="font-bold text-xl" style={{ color: theme.primaryColor }}>{formatPriceByLanguage(category.revenue, i18n.language, currency)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <svg className="w-4 h-4 text-modern-darkGray mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                                <span className="text-sm text-modern-darkGray">{category.bookings} {t('hotelAdmin.dashboard.recentOrders.orderId')}</span>
                              </div>
                              <span className="text-xs text-modern-darkGray">{t('hotelAdmin.revenue.stats.totalRevenue')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
