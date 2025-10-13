import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import { HOTEL_API } from '../../config/api.config';
import apiClient from '../../services/api.service';

/**
 * Modern Hotel Admin Orders                                    : t('hotelAdmin.dashboard.recentOrders.unknownGuest')}Management Page with Category Filtering and Pagination
                         </div>
                        <div className="text-xs text-modern-darkGray">
                          {order.guestId?.email || order.guestDetails?.email || order.guest?.email || t('hotelAdmin.dashboard.recentOrders.noEmail')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1 flex items-center">
                          <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          Room: {order.roomNumber || order.guestDetails?.roomNumber || order.guestInfo?.roomNumber || order.guestId?.roomNumber || 'N/A'}
                        </div>
                      </div>turns {JSX.Element} Orders management page
 */
const OrdersPage = () => {
  const { t } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  // Status update modal state
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
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

      const url = `${HOTEL_API.BOOKINGS}?${params}`;

      const response = await apiClient.get(url);

      const data = response.data.data;

      setBookings(data?.bookings || []);
      setPagination(prev => ({
        ...prev,
        total: data?.pagination?.total || 0,
        totalPages: data?.pagination?.pages || 0
      }));
    } catch (error) {
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, selectedCategory, statusFilter, searchTerm]);

  // Update booking status
  const updateBookingStatus = async (bookingId, newStatus, notes) => {
    try {
      setIsUpdatingStatus(true);
      const response = await apiClient.patch(`${HOTEL_API.BOOKINGS}/${bookingId}/status`, {
        status: newStatus,
        notes: notes
      });

      if (response.data.status === 'success') {
        // Update the booking in the local state
        setBookings(prevBookings =>
          prevBookings.map(booking =>
            booking._id === bookingId
              ? { ...booking, status: newStatus }
              : booking
          )
        );

        // Update selected order if it's the same booking
        if (selectedOrder && selectedOrder._id === bookingId) {
          setSelectedOrder(prev => ({ ...prev, status: newStatus }));
        }

        alert('Booking status updated successfully!');
        setIsStatusModalOpen(false);
        setSelectedStatus('');
        setStatusNotes('');
      }
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert(`Error updating booking status: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Handle status update form submission
  const handleStatusUpdate = (e) => {
    e.preventDefault();
    if (!selectedStatus) {
      alert('Please select a status');
      return;
    }
    updateBookingStatus(selectedOrder._id, selectedStatus, statusNotes);
  };

  // Available statuses for hotel admin
  const availableStatuses = [
    { value: 'pending', label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'completed', label: 'Completed', color: 'bg-green-100 text-green-800' },
    { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-800' }
  ];  useEffect(() => {
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
        <div className="w-full px-6 py-8">
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
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">Room Number</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[180px]">{t('hotelAdmin.orders.table.service')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">{t('hotelAdmin.orders.table.date')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">{t('hotelAdmin.orders.table.amount')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[120px]">Payment Method</th>
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
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-semibold text-gray-900">
                                  {order.roomNumber || order.guestDetails?.roomNumber || order.guestInfo?.roomNumber || order.guestId?.roomNumber || 'N/A'}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-gray-900 truncate max-w-[150px] capitalize">
                                {order.serviceId?.category || order.service?.category || order.serviceType || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-modern-darkGray">
                              {new Date(order.createdAt || order.appointmentDate).toLocaleDateString()}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm font-bold text-gray-900">
                              {(() => {
                                const category = (order.serviceId?.category || order.service?.category || order.serviceType || '').toLowerCase();
                                if (category === 'housekeeping' || category === 'cleaning') {
                                  return '---';
                                }
                                return `$${(order.pricing?.totalAmount ||
                                           order.payment?.totalAmount ||
                                           order.totalAmount ||
                                           order.finalPrice ||
                                           order.quotedPrice || 0).toFixed(2)}`;
                              })()}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap">
                            <span className="text-sm text-gray-700">
                              {(() => {
                                const category = (order.serviceId?.category || order.service?.category || order.serviceType || '').toLowerCase();
                                if (category === 'housekeeping' || category === 'cleaning') {
                                  return '---';
                                }
                                return order.payment?.paymentMethod === 'cash' ? 'Cash' : 'Visa/Card';
                              })()}
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
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {order.serviceId?.category || order.service?.category || order.serviceType || t('hotelAdmin.dashboard.recentOrders.unknownService')}
                        </div>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="text-xs text-modern-darkGray">
                          {new Date(order.createdAt || order.appointmentDate).toLocaleDateString()}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-bold text-gray-900">
                            {(() => {
                              const category = (order.serviceId?.category || order.service?.category || order.serviceType || '').toLowerCase();
                              if (category === 'housekeeping' || category === 'cleaning') {
                                return '---';
                              }
                              return `$${(order.pricing?.totalAmount ||
                                         order.payment?.totalAmount ||
                                         order.totalAmount ||
                                         order.finalPrice ||
                                         order.quotedPrice || 0).toFixed(2)}`;
                            })()}
                          </div>
                          <div className="text-xs text-gray-600">
                            {(() => {
                              const category = (order.serviceId?.category || order.service?.category || order.serviceType || '').toLowerCase();
                              if (category === 'housekeeping' || category === 'cleaning') {
                                return '---';
                              }
                              return order.payment?.paymentMethod === 'cash' ? 'Cash' : 'Visa/Card';
                            })()}
                          </div>
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
                      {(() => {
                        const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || '').toLowerCase();
                        if (category === 'housekeeping' || category === 'cleaning') {
                          return '---';
                        }
                        return `$${(selectedOrder.pricing?.totalAmount ||
                                   selectedOrder.payment?.totalAmount ||
                                   selectedOrder.totalAmount ||
                                   selectedOrder.finalPrice ||
                                   selectedOrder.quotedPrice || 0).toFixed(2)}`;
                      })()}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">Payment Method:</span>
                    <p className="font-medium">
                      {(() => {
                        const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || '').toLowerCase();
                        if (category === 'housekeeping' || category === 'cleaning') {
                          return '---';
                        }
                        return selectedOrder.payment?.paymentMethod === 'cash' ? 'Cash at Hotel' : 'Online Payment';
                      })()}
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
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      const categoryNames = {
                        'housekeeping': 'Housekeeping Service',
                        'cleaning': 'Cleaning Service',
                        'laundry': 'Laundry Service',
                        'transportation': 'Transportation Service',
                        'tours': 'Tours & Travel Service',
                        'restaurant': 'Restaurant Service',
                        'dining': 'Dining Service',
                        'maintenance': 'Maintenance Service',
                        'amenities': 'Amenities Service'
                      };
                      return categoryNames[category] || 'Service';
                    })()}
                  </h5>
                  <div className="space-y-4 text-sm">
                    {/* Basic Service Information */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-600">{t('hotelAdmin.orders.details.category')}:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                          {selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || 'N/A'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">{t('hotelAdmin.orders.details.provider')}:</span>
                        <span className="ml-2 font-medium">
                          {selectedOrder.serviceProviderId?.businessName || selectedOrder.serviceProvider?.businessName || t('hotelAdmin.orders.details.unknownProvider')}
                        </span>
                      </div>
                    </div>

                    {/* Housekeeping Specific Details */}
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      if (category === 'housekeeping' || category === 'cleaning') {
                        return (
                          <div className="bg-blue-50 rounded-lg p-3 space-y-2">
                            <h6 className="font-medium text-blue-900">Housekeeping Details</h6>

                            {/* Category Issues */}
                            {selectedOrder.serviceDetails?.specificCategory && (
                              <div>
                                <span className="text-blue-700 font-medium">Issue Categories:</span>
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {Array.isArray(selectedOrder.serviceDetails.specificCategory)
                                    ? selectedOrder.serviceDetails.specificCategory.map((cat, index) => (
                                        <span key={index} className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                                          {cat.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      ))
                                    : (
                                        <span className="px-2 py-1 bg-blue-200 text-blue-800 rounded text-xs">
                                          {selectedOrder.serviceDetails.specificCategory.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </span>
                                      )
                                  }
                                </div>
                              </div>
                            )}

                            {/* Special Requests */}
                            {(selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests || selectedOrder.bookingDetails?.specialRequests) && (
                              <div>
                                <span className="text-blue-700 font-medium">Special Requests:</span>
                                <p className="text-blue-900 mt-1">
                                  {selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests || selectedOrder.bookingDetails?.specialRequests}
                                </p>
                              </div>
                            )}

                            {/* Room Number */}
                            {selectedOrder.guestDetails?.roomNumber && (
                              <div>
                                <span className="text-blue-700 font-medium">Room Number:</span>
                                <span className="ml-2 text-blue-900">{selectedOrder.guestDetails.roomNumber}</span>
                              </div>
                            )}

                            {/* Urgency Level */}
                            {selectedOrder.schedule?.urgencyLevel && (
                              <div>
                                <span className="text-blue-700 font-medium">Urgency:</span>
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
                        );
                      }
                      return null;
                    })()}

                    {/* Laundry Specific Details */}
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      if (category === 'laundry' && selectedOrder.bookingConfig?.laundryItems?.length > 0) {
                        return (
                          <div className="bg-green-50 rounded-lg p-3 space-y-2">
                            <h6 className="font-medium text-green-900">Laundry Details</h6>

                            {/* Laundry Items */}
                            <div>
                              <span className="text-green-700 font-medium">Items:</span>
                              <div className="mt-2 space-y-2">
                                {selectedOrder.bookingConfig.laundryItems.map((item, index) => (
                                  <div key={index} className="bg-green-100 rounded p-2 text-sm">
                                    <div className="flex justify-between items-start">
                                      <div>
                                        <span className="font-medium text-green-900">{item.itemName}</span>
                                        <span className="ml-2 text-green-700">({item.itemCategory})</span>
                                      </div>
                                      <span className="text-green-800 font-medium">x{item.quantity}</span>
                                    </div>
                                    {item.serviceType && (
                                      <div className="text-green-700 text-xs mt-1">
                                        Service: {item.serviceType.name}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Express Service */}
                            {selectedOrder.bookingConfig?.isExpressService && (
                              <div>
                                <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                                  Express Service
                                </span>
                              </div>
                            )}

                            {/* Special Requests */}
                            {(selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests) && (
                              <div>
                                <span className="text-green-700 font-medium">Special Requests:</span>
                                <p className="text-green-900 mt-1">
                                  {selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Transportation Specific Details */}
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      if (category === 'transportation') {
                        return (
                          <div className="bg-purple-50 rounded-lg p-3 space-y-2">
                            <h6 className="font-medium text-purple-900">Transportation Details</h6>

                            {/* Pickup Location */}
                            {selectedOrder.location?.pickup && (
                              <div>
                                <span className="text-purple-700 font-medium">Pickup Location:</span>
                                <p className="text-purple-900 mt-1">{selectedOrder.location.pickup.address}</p>
                                {selectedOrder.location.pickup.instructions && (
                                  <p className="text-purple-700 text-sm">Instructions: {selectedOrder.location.pickup.instructions}</p>
                                )}
                              </div>
                            )}

                            {/* Delivery Location */}
                            {selectedOrder.location?.delivery && (
                              <div>
                                <span className="text-purple-700 font-medium">Destination:</span>
                                <p className="text-purple-900 mt-1">{selectedOrder.location.delivery.address}</p>
                                {selectedOrder.location.delivery.instructions && (
                                  <p className="text-purple-700 text-sm">Instructions: {selectedOrder.location.delivery.instructions}</p>
                                )}
                              </div>
                            )}

                            {/* Vehicle Type */}
                            {selectedOrder.assignment?.vehicle && (
                              <div>
                                <span className="text-purple-700 font-medium">Vehicle Type:</span>
                                <span className="ml-2 text-purple-900">{selectedOrder.assignment.vehicle}</span>
                              </div>
                            )}

                            {/* Special Requests */}
                            {(selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests) && (
                              <div>
                                <span className="text-purple-700 font-medium">Special Requests:</span>
                                <p className="text-purple-900 mt-1">
                                  {selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Restaurant/Dining Specific Details */}
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      if ((category === 'restaurant' || category === 'dining') && selectedOrder.bookingConfig?.menuItems?.length > 0) {
                        return (
                          <div className="bg-yellow-50 rounded-lg p-3 space-y-2">
                            <h6 className="font-medium text-yellow-900">Menu Items</h6>

                            <div className="space-y-2">
                              {selectedOrder.bookingConfig.menuItems.map((item, index) => (
                                <div key={index} className="bg-yellow-100 rounded p-2 text-sm">
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <span className="font-medium text-yellow-900">{item.itemName}</span>
                                      <span className="ml-2 text-yellow-700">({item.itemCategory})</span>
                                    </div>
                                    <span className="text-yellow-800 font-medium">x{item.quantity}</span>
                                  </div>
                                  {item.description && (
                                    <p className="text-yellow-700 text-xs mt-1">{item.description}</p>
                                  )}
                                  {item.specialInstructions && (
                                    <p className="text-yellow-700 text-xs mt-1 italic">Note: {item.specialInstructions}</p>
                                  )}
                                  <div className="flex gap-2 mt-1">
                                    {item.isVegetarian && (
                                      <span className="px-1 py-0.5 bg-green-200 text-green-800 rounded text-xs">Vegetarian</span>
                                    )}
                                    {item.isVegan && (
                                      <span className="px-1 py-0.5 bg-green-200 text-green-800 rounded text-xs">Vegan</span>
                                    )}
                                    {item.spicyLevel && item.spicyLevel !== 'normal' && (
                                      <span className="px-1 py-0.5 bg-red-200 text-red-800 rounded text-xs">
                                        {item.spicyLevel.replace('_', ' ')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Special Requests */}
                            {(selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests) && (
                              <div>
                                <span className="text-yellow-700 font-medium">Special Requests:</span>
                                <p className="text-yellow-900 mt-1">
                                  {selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Tours/Travel Specific Details */}
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      if (category === 'tours' || category === 'travel') {
                        return (
                          <div className="bg-indigo-50 rounded-lg p-3 space-y-2">
                            <h6 className="font-medium text-indigo-900">Tour Details</h6>

                            {/* Service Location */}
                            {selectedOrder.location?.service && (
                              <div>
                                <span className="text-indigo-700 font-medium">Tour Location:</span>
                                <p className="text-indigo-900 mt-1">{selectedOrder.location.service.address}</p>
                                {selectedOrder.location.service.meetingPoint && (
                                  <p className="text-indigo-700 text-sm">Meeting Point: {selectedOrder.location.service.meetingPoint}</p>
                                )}
                              </div>
                            )}

                            {/* Number of Participants */}
                            {selectedOrder.bookingConfig?.quantity && (
                              <div>
                                <span className="text-indigo-700 font-medium">Participants:</span>
                                <span className="ml-2 text-indigo-900">{selectedOrder.bookingConfig.quantity} person(s)</span>
                              </div>
                            )}

                            {/* Special Requests */}
                            {(selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests) && (
                              <div>
                                <span className="text-indigo-700 font-medium">Special Requests:</span>
                                <p className="text-indigo-900 mt-1">
                                  {selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* General Special Requests (for services not covered above) */}
                    {(() => {
                      const category = (selectedOrder.serviceId?.category || selectedOrder.service?.category || selectedOrder.serviceType || selectedOrder.serviceDetails?.category || '').toLowerCase();
                      const coveredCategories = ['housekeeping', 'cleaning', 'laundry', 'transportation', 'restaurant', 'dining', 'tours', 'travel'];
                      const hasSpecialRequests = selectedOrder.serviceDetails?.specialRequests || selectedOrder.bookingConfig?.specialRequests || selectedOrder.bookingDetails?.specialRequests;

                      if (!coveredCategories.includes(category) && hasSpecialRequests) {
                        return (
                          <div>
                            <span className="text-gray-600">{t('hotelAdmin.orders.details.specialRequests')}:</span>
                            <p className="ml-2 text-gray-900">{hasSpecialRequests}</p>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Additional Services */}
                    {selectedOrder.bookingConfig?.additionalServices?.length > 0 && (
                      <div>
                        <span className="text-gray-600">Additional Services:</span>
                        <div className="mt-1 space-y-1">
                          {selectedOrder.bookingConfig.additionalServices.map((service, index) => (
                            <div key={index} className="flex justify-between bg-gray-100 rounded px-2 py-1 text-sm">
                              <span>{service.name}</span>
                              <span className="font-medium">${service.price.toFixed(2)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Notes */}
                    {selectedOrder.bookingConfig?.notes && (
                      <div>
                        <span className="text-gray-600">Notes:</span>
                        <p className="ml-2 text-gray-900">{selectedOrder.bookingConfig.notes}</p>
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
                    setIsStatusModalOpen(true);
                    setSelectedStatus(selectedOrder.status || 'pending');
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

      {/* Status Update Modal */}
      {isStatusModalOpen && selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsStatusModalOpen(false);
            }
          }}
        >
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-t-2xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Update Order Status</h3>
                <button
                  onClick={() => setIsStatusModalOpen(false)}
                  className="text-white hover:text-gray-200 transition-colors duration-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <form onSubmit={handleStatusUpdate} className="p-6 space-y-4">
              {/* Order Info */}
              <div className="bg-gray-50 rounded-lg p-3 text-sm">
                <div className="font-medium text-gray-900">
                  Order #{selectedOrder.bookingId || selectedOrder._id?.slice(-6)}
                </div>
                <div className="text-gray-600">
                  Current Status:
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedOrder.status === 'completed' ? 'bg-green-100 text-green-800' :
                    selectedOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                    selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    selectedOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {selectedOrder.status || 'processing'}
                  </span>
                </div>
              </div>

              {/* Status Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Status
                </label>
                <div className="space-y-2">
                  {availableStatuses.map((status) => (
                    <label
                      key={status.value}
                      className={`flex items-center p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedStatus === status.value
                          ? 'border-modern-blue bg-blue-50 shadow-sm'
                          : 'border-gray-300 hover:border-modern-blue hover:bg-gray-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="status"
                        value={status.value}
                        checked={selectedStatus === status.value}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="w-4 h-4 text-modern-blue focus:ring-modern-blue"
                        required
                      />
                      <span className={`ml-3 px-3 py-1 rounded-full text-sm font-semibold ${status.color}`}>
                        {status.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  placeholder="Add any notes about this status update..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-transparent"
                  rows={3}
                />
              </div>

              {/* Status Preview */}
              {selectedStatus && (
                <div className="bg-blue-50 rounded-lg p-3">
                  <div className="text-sm text-blue-800">
                    Status will be updated to:
                    <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      availableStatuses.find(s => s.value === selectedStatus)?.color || 'bg-gray-100 text-gray-800'
                    }`}>
                      {availableStatuses.find(s => s.value === selectedStatus)?.label || selectedStatus}
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsStatusModalOpen(false)}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingStatus || !selectedStatus}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-modern-blue to-modern-lightBlue border border-transparent rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdatingStatus ? 'Updating...' : 'Update Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
