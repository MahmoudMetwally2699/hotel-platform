import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { HOTEL_API } from '../../config/api.config';
import apiClient from '../../services/api.service';

/**
 * Modern Hotel Admin Orders                                    : t('hotelAdmin.dashboard.recentOrders.unknownGuest')}Management Page with Category Filtering and Pagination
 * @returns {JSX.Element} Orders management page
 */
const OrdersPage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Service categories
  const categories = [
    { id: 'all', name: t('hotelAdmin.orders.categories.all'), icon: '📋' },
    { id: 'laundry', name: t('hotelAdmin.orders.categories.laundry'), icon: '👕' },
    { id: 'transportation', name: t('hotelAdmin.orders.categories.transportation'), icon: '🚗' },
    { id: 'housekeeping', name: t('hotelAdmin.orders.categories.housekeeping'), icon: '🧹' },
    { id: 'dining', name: t('hotelAdmin.orders.categories.dining'), icon: '🍽️' },
  ];

  // Fetch bookings from API
  const fetchBookings = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(selectedCategory !== 'all' && {
          category: selectedCategory
        }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(searchTerm && { search: searchTerm })
      });

      console.log('🔍 HOTEL_API.BOOKINGS:', HOTEL_API.BOOKINGS);
      console.log('🔍 Params:', params.toString());
      const url = `${HOTEL_API.BOOKINGS}?${params}`;
      console.log('🔍 Full URL:', url);
      console.log('🔍 User:', user);
      console.log('🔍 User hotelId:', user?.hotelId);

      const response = await apiClient.get(url);
      console.log('🔍 Raw response:', response);
      console.log('🔍 Response data:', response.data);

      const data = response.data.data;
      console.log('🔍 Parsed data:', data);
      console.log('🔍 Bookings array:', data?.bookings);

      setBookings(data?.bookings || []);
      setPagination(prev => ({
        ...prev,
        total: data?.pagination?.total || 0,
        totalPages: data?.pagination?.pages || 0
      }));
    } catch (error) {
      console.error('❌ Error fetching bookings:', error);
      console.error('❌ Error response:', error.response);
      console.error('❌ Error message:', error.message);
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedCategory, statusFilter, searchTerm, user]);  useEffect(() => {
    if (isAuthenticated) {
      fetchBookings();
    }
  }, [isAuthenticated, fetchBookings]);

  useEffect(() => {
    // Reset to page 1 when filters change
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [selectedCategory, statusFilter, searchTerm]);

  // Get category count
  const getCategoryCount = (categoryId) => {
    if (categoryId === 'all') return bookings.length;
    return bookings.filter(order => {
      const category = order.serviceId?.category?.toLowerCase() ||
                     order.service?.category?.toLowerCase() ||
                     order.category?.toLowerCase() ||
                     order.serviceType?.toLowerCase() || '';

      // Handle special mappings - based on actual database categories
      if (categoryId === 'housekeeping' && (category === 'housekeeping' || category === 'cleaning')) {
        return true;
      }

      return category === categoryId.toLowerCase();
    }).length;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-modern-gray to-white">
      {/* Modern Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-modern-blue">{t('hotelAdmin.orders.title')}</h1>
              <p className="text-modern-darkGray mt-1">{t('hotelAdmin.orders.subtitle')}</p>
            </div>
            <button
              className="bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium flex items-center space-x-2"
              onClick={fetchBookings}
              disabled={isLoading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{isLoading ? t('hotelAdmin.dashboard.refreshing') : t('hotelAdmin.dashboard.refreshData')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-8">
        {/* Modern Category Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50 overflow-hidden mb-8">
          <div className="px-8 py-6 bg-gradient-to-r from-modern-blue to-modern-lightBlue">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              {t('hotelAdmin.orders.filters.filterByCategory')}
            </h2>
            <p className="text-blue-100 mt-1">{t('hotelAdmin.orders.filters.categoryDescription')}</p>
          </div>
          <div className="p-6">
            <div className="flex flex-wrap gap-4">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                    selectedCategory === category.id
                      ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-lg'
                      : 'bg-modern-gray text-modern-darkGray hover:bg-blue-50 hover:text-modern-blue'
                  }`}
                >
                  <span className="text-lg">{category.icon}</span>
                  <span>{category.name}</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    selectedCategory === category.id
                      ? 'bg-white/20 text-white'
                      : 'bg-modern-blue/10 text-modern-blue'
                  }`}>
                    {getCategoryCount(category.id)}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modern Search and Filter Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={t('hotelAdmin.orders.filters.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-modern-blue focus:border-transparent"
                />
                <svg className="w-5 h-5 text-gray-400 absolute left-4 top-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            <div className="lg:w-48">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-modern-blue focus:border-transparent"
              >
                <option value="all">{t('hotelAdmin.orders.filters.allStatuses')}</option>
                <option value="pending">{t('hotelAdmin.orders.filters.pending')}</option>
                <option value="processing">Processing</option>
                <option value="confirmed">{t('hotelAdmin.orders.filters.confirmed')}</option>
                <option value="completed">{t('hotelAdmin.orders.filters.completed')}</option>
                <option value="cancelled">{t('hotelAdmin.orders.filters.cancelled')}</option>
              </select>
            </div>
            <button
              onClick={fetchBookings}
              className="bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium"
            >
              {t('hotelAdmin.common.search')}
            </button>
          </div>
        </div>

        {/* Modern Orders Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50">
          <div className="px-8 py-6 bg-gradient-to-r from-modern-blue to-modern-lightBlue">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {t('navigation.orders')} ({pagination.total})
            </h2>
            <p className="text-blue-100 mt-1">
              {t('hotelAdmin.orders.pagination.summary', {
                page: pagination.page,
                totalPages: pagination.totalPages,
                count: bookings.length
              })}
            </p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-lightBlue border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-modern-blue border-t-transparent animate-ping opacity-20"></div>
              </div>
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-modern-darkGray">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('hotelAdmin.orders.noOrders')}</h3>
                <p className="text-sm text-gray-500">
                  {selectedCategory === 'all'
                    ? t('hotelAdmin.orders.loadingOrders')
                    : `No orders found for ${categories.find(c => c.id === selectedCategory)?.name}.`}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-modern-gray">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[120px]">{t('hotelAdmin.orders.table.orderId')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[200px]">{t('hotelAdmin.orders.table.guest')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[180px]">{t('hotelAdmin.orders.table.service')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[150px]">{t('hotelAdmin.orders.table.provider')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">{t('hotelAdmin.orders.table.date')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">{t('hotelAdmin.orders.table.amount')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">{t('hotelAdmin.orders.table.status')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[120px]">{t('hotelAdmin.orders.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {bookings.map((order) => (
                        <tr key={order._id} className="hover:bg-modern-gray transition-colors duration-200">
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-modern-blue bg-blue-50 px-3 py-1 rounded-full">
                              #{order.bookingId || order._id?.slice(-6)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold text-sm">
                                {order.guestId?.firstName?.charAt(0) || order.guestDetails?.firstName?.charAt(0) || 'G'}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                                  {order.fullGuestName && order.fullGuestName !== 'undefined' && !order.fullGuestName.includes('undefined')
                                    ? order.fullGuestName
                                    : order.guestId?.firstName && order.guestId?.lastName && order.guestId.lastName !== 'undefined'
                                    ? `${order.guestId.firstName} ${order.guestId.lastName}`
                                    : order.guestDetails?.firstName && order.guestDetails?.lastName && order.guestDetails.lastName !== 'undefined'
                                    ? `${order.guestDetails.firstName} ${order.guestDetails.lastName}`
                                    : order.guestId?.firstName
                                    ? order.guestId.firstName
                                    : order.guestDetails?.firstName
                                    ? order.guestDetails.firstName
                                    : order.guest?.firstName && order.guest?.lastName
                                    ? `${order.guest.firstName} ${order.guest.lastName}`
                                    : order.guest?.name
                                    ? order.guest.name
                                    : order.guestId?.name
                                    ? order.guestId.name
                                    : order.guestDetails?.name
                                    ? order.guestDetails.name
                                    : order.customerName
                                    ? order.customerName
                                    : order.guestName
                                    ? order.guestName
                                    : 'Unknown Guest'}
                                </div>
                                <div className="text-xs text-modern-darkGray truncate max-w-[150px]">
                                  {order.guestId?.email || order.guestDetails?.email || order.guest?.email || t('hotelAdmin.dashboard.recentOrders.noEmail')}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                {order.serviceId?.name || order.service?.name || order.serviceName || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                              </span>
                              <div className="flex items-center space-x-2 mt-1">
                                {(order.serviceId?.category || order.service?.category || order.serviceType) && (
                                  <span className="text-xs text-modern-darkGray capitalize bg-blue-50 px-2 py-1 rounded">
                                    {order.serviceId?.category || order.service?.category || order.serviceType}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="text-sm text-modern-darkGray">
                            {order.serviceProviderId?.businessName || order.serviceProvider?.businessName || t('hotelAdmin.dashboard.recentOrders.unknownProvider')}
                          </span>
                          {(order.serviceProviderId?.businessName || order.serviceProvider?.businessName)?.includes('Internal Services') && (
                            <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded mt-1">
                              {t('hotelAdmin.dashboard.recentOrders.hotelManaged')}
                            </span>
                          )}
                        </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-modern-darkGray">
                              {new Date(order.createdAt || order.appointmentDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              ${(order.pricing?.totalAmount ||
                                 order.payment?.totalAmount ||
                                 order.totalAmount ||
                                 order.finalPrice ||
                                 order.quotedPrice || 0).toFixed(2)}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span
                              className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                                order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}
                            >
                              {order.status || 'processing'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-center text-sm font-medium">
                            <button
                              onClick={() => {
                                setSelectedOrder(order);
                                setIsModalOpen(true);
                              }}
                              className="text-modern-blue hover:text-modern-darkBlue font-medium transition-colors duration-200 px-3 py-1 rounded hover:bg-blue-50"
                            >
                              {t('hotelAdmin.orders.details.title')}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4">
                {bookings.map((order) => (
                  <div key={order._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <span className="text-sm font-bold text-modern-blue bg-blue-50 px-3 py-1 rounded-full">
                        #{order.bookingId || order._id?.slice(-6)}
                      </span>
                      <span
                        className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                          order.status === 'completed' ? 'bg-green-100 text-green-800' :
                          order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                          order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {order.status || 'processing'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold text-sm">
                          {order.guestId?.firstName?.charAt(0) || order.guestDetails?.firstName?.charAt(0) || 'G'}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-semibold text-gray-900">
                            {(() => {
                              // Try fullGuestName first (most common case)
                              if (order.fullGuestName) return order.fullGuestName;

                              // Try different combinations, filtering out "undefined" strings
                              const guestIdName = order.guestId?.firstName && order.guestId?.lastName !== "undefined"
                                ? `${order.guestId.firstName} ${order.guestId.lastName}`.replace(' undefined', '').trim()
                                : null;
                              if (guestIdName) return guestIdName;

                              const guestDetailsName = order.guestDetails?.firstName && order.guestDetails?.lastName !== "undefined"
                                ? `${order.guestDetails.firstName} ${order.guestDetails.lastName}`.replace(' undefined', '').trim()
                                : null;
                              if (guestDetailsName) return guestDetailsName;

                              const guestName = order.guest?.firstName && order.guest?.lastName !== "undefined"
                                ? `${order.guest.firstName} ${order.guest.lastName}`.replace(' undefined', '').trim()
                                : null;
                              if (guestName) return guestName;

                              // Fallback to other name fields
                              return order.guest?.name || order.guestId?.name || order.guestDetails?.name ||
                                     order.customerName || order.guestName || t('hotelAdmin.dashboard.recentOrders.unknownGuest');
                            })()}
                          </div>
                          <div className="text-xs text-modern-darkGray">
                            {order.guestId?.email || order.guestDetails?.email || order.guest?.email || t('hotelAdmin.dashboard.recentOrders.noEmail')}
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {order.serviceId?.name || order.service?.name || order.serviceName || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                        </div>
                        <div className="text-xs text-modern-darkGray">
                          {order.serviceProviderId?.businessName || order.serviceProvider?.businessName || t('hotelAdmin.dashboard.recentOrders.unknownProvider')}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-modern-darkGray">
                          {new Date(order.createdAt || order.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="text-sm font-bold text-gray-900">
                          ${(order.pricing?.totalAmount ||
                             order.payment?.totalAmount ||
                             order.totalAmount ||
                             order.finalPrice ||
                             order.quotedPrice || 0).toFixed(2)}
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setIsModalOpen(true);
                        }}
                        className="w-full mt-3 text-modern-blue hover:text-modern-darkBlue font-medium transition-colors duration-200 text-sm"
                      >
                        {t('hotelAdmin.orders.details.title')}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Pagination Controls */}
          {!isLoading && bookings.length > 0 && (
            <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
              <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                  disabled={pagination.page <= 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.previous')}
                </button>
                <button
                  onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                  disabled={pagination.page >= pagination.totalPages}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('common.next')}
                </button>
              </div>
              <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-700">
                    <Trans
                      i18nKey="hotelAdmin.orders.pagination.showing"
                      values={{
                        from: Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total),
                        to: Math.min(pagination.page * pagination.limit, pagination.total),
                        total: pagination.total
                      }}
                      components={{
                        1: <span className="font-medium" />,
                        2: <span className="font-medium" />,
                        3: <span className="font-medium" />
                      }}
                    />
                  </p>
                </div>
                <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                      disabled={pagination.page <= 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Previous</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>

                    {/* Page Numbers */}
                    {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                      let pageNumber;
                      if (pagination.totalPages <= 5) {
                        pageNumber = index + 1;
                      } else if (pagination.page <= 3) {
                        pageNumber = index + 1;
                      } else if (pagination.page >= pagination.totalPages - 2) {
                        pageNumber = pagination.totalPages - 4 + index;
                      } else {
                        pageNumber = pagination.page - 2 + index;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            pagination.page === pageNumber
                              ? 'z-10 bg-modern-blue border-modern-blue text-white'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="sr-only">Next</span>
                      <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">{t('hotelAdmin.orders.details.title')}</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Order Summary */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{t('hotelAdmin.orders.details.orderInformation')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">{t('hotelAdmin.orders.table.orderId')}:</span>
                    <p className="font-medium">#{selectedOrder.bookingId || selectedOrder._id?.slice(-6)}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('hotelAdmin.orders.table.status')}:</span>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ml-2 ${
                        selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                        selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                        selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {selectedOrder.status || 'processing'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('hotelAdmin.orders.table.date')}:</span>
                    <p className="font-medium">{new Date(selectedOrder.createdAt || selectedOrder.appointmentDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">{t('hotelAdmin.orders.table.amount')}:</span>
                    <p className="font-medium text-green-600">
                      ${(selectedOrder.pricing?.totalAmount ||
                         selectedOrder.payment?.totalAmount ||
                         selectedOrder.totalAmount ||
                         selectedOrder.finalPrice ||
                         selectedOrder.quotedPrice || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customer Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('hotelAdmin.orders.details.guestInformation')}</h4>
                <div className="bg-white border rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <div className="h-12 w-12 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold">
                      {(() => {
                        // Try to get first character from fullGuestName first
                        if (selectedOrder.fullGuestName) return selectedOrder.fullGuestName.charAt(0).toUpperCase();

                        // Fallback to other name sources
                        return selectedOrder.guestId?.firstName?.charAt(0) ||
                               selectedOrder.guestDetails?.firstName?.charAt(0) ||
                               selectedOrder.guest?.firstName?.charAt(0) ||
                               selectedOrder.guest?.name?.charAt(0) ||
                               selectedOrder.customerName?.charAt(0) ||
                               selectedOrder.guestName?.charAt(0) || 'G';
                      })().toUpperCase()}
                    </div>
                    <div className="ml-4">
                      <h5 className="font-medium text-gray-900">
                        {(() => {
                          // Try fullGuestName first (most common case)
                          if (selectedOrder.fullGuestName) return selectedOrder.fullGuestName;

                          // Try different combinations, filtering out "undefined" strings
                          const guestIdName = selectedOrder.guestId?.firstName && selectedOrder.guestId?.lastName !== "undefined"
                            ? `${selectedOrder.guestId.firstName} ${selectedOrder.guestId.lastName}`.replace(' undefined', '').trim()
                            : null;
                          if (guestIdName) return guestIdName;

                          const guestDetailsName = selectedOrder.guestDetails?.firstName && selectedOrder.guestDetails?.lastName !== "undefined"
                            ? `${selectedOrder.guestDetails.firstName} ${selectedOrder.guestDetails.lastName}`.replace(' undefined', '').trim()
                            : null;
                          if (guestDetailsName) return guestDetailsName;

                          const guestName = selectedOrder.guest?.firstName && selectedOrder.guest?.lastName !== "undefined"
                            ? `${selectedOrder.guest.firstName} ${selectedOrder.guest.lastName}`.replace(' undefined', '').trim()
                            : null;
                          if (guestName) return guestName;

                          // Fallback to other name fields
                          return selectedOrder.guest?.name || selectedOrder.guestId?.name || selectedOrder.guestDetails?.name ||
                                 selectedOrder.customerName || selectedOrder.guestName || t('hotelAdmin.dashboard.recentOrders.unknownGuest');
                        })()}
                      </h5>
                      <p className="text-sm text-gray-600">{selectedOrder.guestId?.email || selectedOrder.guestDetails?.email || selectedOrder.guest?.email || t('hotelAdmin.dashboard.recentOrders.noEmail')}</p>
                    </div>
                  </div>
                  {selectedOrder.guestId?.phone && (
                    <p className="text-sm text-gray-600">
                      <span className="font-medium">{t('hotelAdmin.orders.details.phone')}:</span> {selectedOrder.guestId.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Service Information */}
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">{t('hotelAdmin.orders.details.serviceDetails')}</h4>
                <div className="bg-white border rounded-lg p-4">
                  <h5 className="font-medium text-gray-900 mb-2">
                    {selectedOrder.serviceId?.name || selectedOrder.service?.name || selectedOrder.serviceName || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="text-gray-600">{t('hotelAdmin.orders.details.category')}:</span>
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                        {selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">{t('hotelAdmin.orders.details.provider')}:</span>
                      <span className="ml-2 font-medium">
                        {selectedOrder.serviceProviderId?.businessName || selectedOrder.serviceProvider?.businessName || t('hotelAdmin.orders.details.unknownProvider')}
                      </span>
                    </div>
                    {selectedOrder.serviceDetails?.specialRequests && (
                      <div>
                        <span className="text-gray-600">{t('hotelAdmin.orders.details.specialRequests')}:</span>
                        <p className="ml-2 text-gray-900">{selectedOrder.serviceDetails.specialRequests}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Schedule Information */}
              {selectedOrder.schedule && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">{t('hotelAdmin.orders.details.scheduleInformation')}</h4>
                  <div className="bg-white border rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedOrder.schedule.preferredDate && (
                        <div>
                          <span className="text-gray-600">{t('hotelAdmin.orders.details.preferredDate')}:</span>
                          <p className="font-medium">{new Date(selectedOrder.schedule.preferredDate).toLocaleDateString()}</p>
                        </div>
                      )}
                      {selectedOrder.schedule.preferredTime && (
                        <div>
                          <span className="text-gray-600">{t('hotelAdmin.orders.details.preferredTime')}:</span>
                          <p className="font-medium">{selectedOrder.schedule.preferredTime}</p>
                        </div>
                      )}
                      {selectedOrder.schedule.urgencyLevel && (
                        <div>
                          <span className="text-gray-600">{t('hotelAdmin.orders.details.urgency')}:</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                            selectedOrder.schedule.urgencyLevel === 'urgent' ? 'bg-red-100 text-red-800' :
                            selectedOrder.schedule.urgencyLevel === 'high' ? 'bg-orange-100 text-orange-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {selectedOrder.schedule.urgencyLevel}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue"
                >
                  {t('hotelAdmin.orders.details.close')}
                </button>
                <button
                  onClick={() => {
                    // Add functionality to update order status if needed
                    console.log('Update order:', selectedOrder._id);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-modern-blue to-modern-lightBlue border border-transparent rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue"
                >
                  {t('hotelAdmin.orders.details.updateStatus')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
