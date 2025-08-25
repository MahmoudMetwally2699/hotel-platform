/**
 * Service Provider Orders Page
 * Displays and manages all bookings/orders for a service provider
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchProviderOrders,
  updateOrderStatus,
  selectProviderOrders,
  selectServiceLoading,
  selectServiceError
} from '../../redux/slices/serviceSlice';
import apiClient from '../../services/api.service';

const OrdersPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const orders = useSelector(selectProviderOrders);
  const isLoading = useSelector(selectServiceLoading);
  const error = useSelector(selectServiceError);

  const [housekeepingBookings, setHousekeepingBookings] = useState([]);
  const [housekeepingLoading, setHousekeepingLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all'); // New filter for service types
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });  useEffect(() => {
    // Fetch regular orders
    dispatch(fetchProviderOrders());

    // Fetch housekeeping bookings
    fetchHousekeepingBookings();
  }, [dispatch]);

  const fetchHousekeepingBookings = async () => {
    try {
      setHousekeepingLoading(true);
      console.log('🔧 OrdersPage: Fetching housekeeping bookings...');
      const response = await apiClient.get('/service/housekeeping-bookings');
      console.log('🔧 OrdersPage: Housekeeping bookings response:', response.data);
      setHousekeepingBookings(response.data.data || []);
    } catch (error) {
      console.error('🔧 OrdersPage: Error fetching housekeeping bookings:', error);
      setHousekeepingBookings([]);
    } finally {
      setHousekeepingLoading(false);
    }
  };
  const handleStatusChange = (orderId, newStatus) => {
    console.log('🔧 OrdersPage: Updating status for order', orderId, 'to', newStatus);

    // Check if this is a housekeeping booking by finding it in housekeepingBookings
    const isHousekeepingBooking = housekeepingBookings.some(booking => booking._id === orderId);

    if (isHousekeepingBooking) {
      // Handle housekeeping booking status update
      apiClient.put(`/service/housekeeping-bookings/${orderId}/status`, { status: newStatus })
        .then((response) => {
          console.log('🔧 OrdersPage: Housekeeping booking status updated:', response.data);

          // Update local state
          setHousekeepingBookings(prev =>
            prev.map(booking =>
              booking._id === orderId ? { ...booking, status: newStatus } : booking
            )
          );

          // Update currentOrder if it's the one being updated
          if (currentOrder && currentOrder._id === orderId) {
            setCurrentOrder({
              ...currentOrder,
              status: newStatus
            });
          }
        })
        .catch((error) => {
          console.error('🔧 OrdersPage: Housekeeping booking status update failed:', error);
          alert('Failed to update housekeeping booking status');
        });
    } else {
      // Handle regular order status update
      dispatch(updateOrderStatus({ orderId, status: newStatus }))
        .then((result) => {
          console.log('🔧 OrdersPage: Status update result:', result);

          if (result.type === 'service/updateOrderStatus/fulfilled') {
            // Update the currentOrder if it's the one being updated
            if (currentOrder && currentOrder._id === orderId) {
              setCurrentOrder({
                ...currentOrder,
                status: newStatus
              });
            }

            // Refresh the orders list to get the latest data
            dispatch(fetchProviderOrders());
          } else if (result.type === 'service/updateOrderStatus/rejected') {
            console.error('🔧 OrdersPage: Status update failed:', result.payload);
            alert('Failed to update order status: ' + result.payload);
          }
        })
        .catch((error) => {
          console.error('🔧 OrdersPage: Status update error:', error);
          alert('Failed to update order status');
        });
    }
  };const handleViewDetails = (order) => {
    console.log('🔧 OrdersPage: handleViewDetails called with order =', order);
    console.log('🔧 OrdersPage: order structure:', {
      id: order._id,
      serviceId: order.serviceId,
      hotelId: order.hotelId,
      guestId: order.guestId,
      guestDetails: order.guestDetails,
      pricing: order.pricing,
      schedule: order.schedule,
      bookingConfig: order.bookingConfig,
      bookingNumber: order.bookingNumber
    });
    setCurrentOrder(order);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setCurrentOrder(null);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  // Combine regular orders and housekeeping bookings
  const allBookings = [
    ...(Array.isArray(orders) ? orders : []).map(order => ({
      ...order,
      serviceType: order.serviceType || 'regular',
      displayType: 'Regular Service'
    })),
    ...(Array.isArray(housekeepingBookings) ? housekeepingBookings : []).map(booking => ({
      ...booking,
      serviceType: 'housekeeping',
      displayType: 'Housekeeping Service',
      // Normalize the data structure to match regular orders
      serviceName: booking.serviceName || booking.serviceDetails?.name || 'Housekeeping Service',
      guestName: booking.guestDetails?.firstName && booking.guestDetails?.lastName
        ? `${booking.guestDetails.firstName} ${booking.guestDetails.lastName}`
        : booking.guestInfo?.name || 'Unknown Guest',
      roomNumber: booking.guestDetails?.roomNumber || booking.guestInfo?.roomNumber || 'N/A',
      totalAmount: booking.totalAmount || 0,
      createdAt: booking.bookingDate || booking.createdAt,
      // Add hotel information
      hotel: booking.hotel || { name: 'Hotel Service' },
      hotelName: booking.hotel?.name || 'Hotel Service',
      // Add service details
      serviceDetails: {
        name: booking.serviceName || booking.serviceDetails?.name || 'Housekeeping Service',
        category: 'housekeeping'
      },
      // Add guest details in the expected format
      guestDetails: {
        firstName: booking.guestDetails?.firstName || 'Guest',
        lastName: booking.guestDetails?.lastName || '',
        email: booking.guestDetails?.email || 'no-email@housekeeping.local',
        phone: booking.guestDetails?.phone || '',
        roomNumber: booking.guestDetails?.roomNumber || 'N/A'
      },
      // Add schedule information
      schedule: {
        preferredDate: booking.schedule?.preferredDate || booking.bookingDate,
        preferredTime: booking.schedule?.preferredTime || '09:00'
      }
    }))
  ];

  console.log('🔧 OrdersPage: Regular orders:', orders);
  console.log('🔧 OrdersPage: Housekeeping bookings:', housekeepingBookings);
  console.log('🔧 OrdersPage: Combined allBookings:', allBookings);

  // Filter combined bookings based on selected filters
  const filteredOrders = allBookings.filter((order) => {
    let passesStatusFilter = statusFilter === 'all' || order.status === statusFilter;
    let passesServiceTypeFilter = serviceTypeFilter === 'all' || order.serviceType === serviceTypeFilter;

    let passesDateFilter = true;
    const orderDate = new Date(order.createdAt);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today);
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    if (dateFilter === 'today') {
      passesDateFilter = orderDate.toDateString() === today.toDateString();
    } else if (dateFilter === 'yesterday') {
      passesDateFilter = orderDate.toDateString() === yesterday.toDateString();
    } else if (dateFilter === 'week') {
      passesDateFilter = orderDate >= lastWeek;
    } else if (dateFilter === 'month') {
      passesDateFilter = orderDate >= lastMonth;
    }

    return passesStatusFilter && passesDateFilter && passesServiceTypeFilter;
  });

  // Sort filtered orders
  const sortedOrders = [...filteredOrders].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">{t('serviceProvider.orders.title')}</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between">
          <div className="flex space-x-2 mb-2 sm:mb-0">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >              <option value="all">{t('serviceProvider.orders.allOrders')}</option>
              <option value="pending">{t('common.pending')}</option>
              <option value="confirmed">{t('common.confirmed')}</option>
              <option value="in-progress">{t('serviceProvider.orders.inProgress')}</option>
              <option value="completed">{t('serviceProvider.orders.completed')}</option>
              <option value="cancelled">{t('serviceProvider.orders.cancelled')}</option>
            </select>

            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="yesterday">Yesterday</option>
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
            </select>

            <select
              value={serviceTypeFilter}
              onChange={(e) => setServiceTypeFilter(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="all">All Services</option>
              <option value="regular">Regular Services</option>
              <option value="housekeeping">Housekeeping</option>
            </select>
          </div>

          <div className="text-sm text-gray-500">
            {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-3 text-gray-600">Loading orders...</p>
          </div>
        ) : sortedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('orderId')}
                  >
                    {t('serviceProvider.orders.orderNumber')}
                    {sortConfig.key === 'orderId' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('service.name')}
                  >
                    {t('serviceProvider.orders.service')}
                    {sortConfig.key === 'service.name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('hotel.name')}
                  >
                    {t('serviceProvider.orders.hotel')}
                    {sortConfig.key === 'hotel.name' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('totalAmount')}
                  >
                    {t('serviceProvider.orders.amount')}
                    {sortConfig.key === 'totalAmount' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    {t('serviceProvider.orders.status')}
                    {sortConfig.key === 'status' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('createdAt')}
                  >
                    {t('serviceProvider.orders.createdAt')}
                    {sortConfig.key === 'createdAt' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('serviceProvider.orders.actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">                {sortedOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {order.bookingNumber || order._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.serviceDetails?.name || order.serviceId?.name || order.serviceName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {order.hotel?.name || order.hotelId?.name || order.hotelName || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                        ${order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                        ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                        ${order.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : ''}
                        ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        {t('serviceProvider.orders.viewDetails')}
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="text-sm border-gray-300 focus:ring-blue-500 focus:border-blue-500 rounded-md"
                        disabled={order.status === 'cancelled' || order.status === 'completed'}
                      >                        <option value="pending">{t('common.pending')}</option>
                        <option value="confirmed">{t('serviceProvider.orders.confirmOrder')}</option>
                        <option value="in-progress">{t('serviceProvider.orders.markInProgress')}</option>
                        <option value="completed">{t('serviceProvider.orders.markCompleted')}</option>
                        <option value="cancelled">{t('serviceProvider.orders.markCancelled')}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-10">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('serviceProvider.orders.noOrders')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {statusFilter !== 'all' || dateFilter !== 'all'
                ? t('serviceProvider.orders.noOrdersDescription')
                : t('serviceProvider.orders.noOrdersDescription')}
            </p>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {isDetailsOpen && currentOrder && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">
                      Order Details
                      <span className="ml-2 text-sm text-gray-500">#{currentOrder.bookingNumber || currentOrder._id}</span>
                    </h3>

                    <div className="mt-4 border-t border-gray-200 pt-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <p className="mt-1 text-sm text-gray-900">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${currentOrder.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                              ${currentOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${currentOrder.status === 'confirmed' ? 'bg-blue-100 text-blue-800' : ''}
                              ${currentOrder.status === 'in-progress' ? 'bg-purple-100 text-purple-800' : ''}
                              ${currentOrder.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Order Date</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {new Date(currentOrder.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Service</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.serviceDetails?.name || currentOrder.serviceId?.name || currentOrder.serviceName || 'Unknown Service'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Scheduled Date</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {currentOrder.schedule?.preferredDate ?
                              new Date(currentOrder.schedule.preferredDate).toLocaleDateString() :
                              'Not scheduled'
                            }
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Scheduled Time</p>
                          <p className="mt-1 text-sm text-gray-900">{currentOrder.schedule?.preferredTime || 'Not specified'}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Hotel</p>
                          <p className="mt-1 text-sm text-gray-900">
                            {currentOrder.hotel?.name || currentOrder.hotelId?.name || currentOrder.hotelName || 'Unknown Hotel'}
                          </p>
                        </div><div>
                          <p className="text-sm font-medium text-gray-500">Room Number</p>
                          <p className="mt-1 text-sm text-gray-900">{currentOrder.guestDetails?.roomNumber || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Guest</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.guestId?.firstName || currentOrder.guestDetails?.firstName || 'Unknown'} {currentOrder.guestId?.lastName || currentOrder.guestDetails?.lastName || 'Guest'}
                        </p>
                        <p className="mt-1 text-sm text-gray-500">{currentOrder.guestId?.email || currentOrder.guestDetails?.email || 'No email provided'}</p>
                        <p className="mt-1 text-sm text-gray-500">{currentOrder.guestDetails?.phone || 'No phone provided'}</p>
                      </div>                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Notes/Special Requests</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.bookingDetails?.specialRequests || currentOrder.bookingConfig?.specialRequests || currentOrder.bookingConfig?.notes || currentOrder.notes || currentOrder.specialRequests || 'No special requests'}
                        </p>
                      </div>

                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-500">Quantity</p>
                        <p className="mt-1 text-sm text-gray-900">
                          {currentOrder.bookingConfig?.quantity || currentOrder.quantity || 1}
                        </p>
                      </div>

                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500">Base Price</p>
                          <p className="text-sm text-gray-900">${(currentOrder.pricing?.basePrice || currentOrder.basePrice || 0).toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between mb-2">
                          <p className="text-sm font-medium text-gray-500">Hotel Markup</p>
                          <p className="text-sm text-gray-900">${((currentOrder.pricing?.totalAmount || currentOrder.totalAmount || 0) - (currentOrder.pricing?.basePrice || currentOrder.basePrice || 0)).toFixed(2)}</p>
                        </div>
                        <div className="flex justify-between font-medium">
                          <p className="text-sm text-gray-900">Total Amount</p>
                          <p className="text-sm text-gray-900">${(currentOrder.pricing?.totalAmount || currentOrder.totalAmount || 0).toFixed(2)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {currentOrder.status !== 'cancelled' && currentOrder.status !== 'completed' && (
                  <div className="sm:flex sm:flex-row-reverse">
                    <button
                      type="button"
                      onClick={() => handleStatusChange(currentOrder._id, 'completed')}
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Mark as Completed
                    </button>
                    {currentOrder.status !== 'in-progress' && (
                      <button
                        type="button"
                        onClick={() => handleStatusChange(currentOrder._id, 'in-progress')}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Mark as In Progress
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleStatusChange(currentOrder._id, 'cancelled')}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                    >
                      Cancel Order
                    </button>
                  </div>
                )}
                <button
                  type="button"
                  onClick={closeDetails}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Close
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
