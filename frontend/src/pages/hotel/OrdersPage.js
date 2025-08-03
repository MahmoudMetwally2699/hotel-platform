import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelBookingsForAdmin, selectAllBookings, selectBookingLoading } from '../../redux/slices/bookingSlice';
import useAuth from '../../hooks/useAuth';

/**
 * Hotel Admin Orders Management Page with Category Filtering
 * @returns {JSX.Element} Orders management page
 */
const OrdersPage = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectAllBookings);
  const isLoading = useSelector(selectBookingLoading);
  const { user } = useAuth();
    console.log('🔍 OrdersPage - Full auth context:', useAuth());
  console.log('🔍 OrdersPage - User object:', user);
  console.log('🔍 OrdersPage - Bookings array:', bookings);
  console.log('🔍 OrdersPage - Bookings type:', typeof bookings);
  console.log('🔍 OrdersPage - Is bookings array:', Array.isArray(bookings));
  console.log('🔍 OrdersPage - Loading state:', isLoading);

  // Add debug logging for bookings structure
  useEffect(() => {
    console.log('🔍 OrdersPage - Bookings changed:', bookings);
    console.log('🔍 OrdersPage - Bookings type:', typeof bookings);
    console.log('🔍 OrdersPage - Is bookings array:', Array.isArray(bookings));
    if (bookings && typeof bookings === 'object' && !Array.isArray(bookings)) {
      console.log('🔍 OrdersPage - Bookings keys:', Object.keys(bookings));
    }
  }, [bookings]);

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Service categories
  const categories = [
    { id: 'all', name: 'All Categories', icon: '📋' },
    { id: 'laundry', name: 'Laundry', icon: '👕' },
    { id: 'transportation', name: 'Transportation', icon: '🚗' },
    { id: 'tourism', name: 'Travel & Tourism', icon: '🏖️' },
  ];  useEffect(() => {
    console.log('🔍 OrdersPage useEffect - user:', user);
    console.log('🔍 OrdersPage - Dispatching fetchHotelBookingsForAdmin()');
    dispatch(fetchHotelBookingsForAdmin());
  }, [dispatch, user]);

  // Debug logging to check the data structure
  useEffect(() => {
    if (bookings.length > 0) {
      console.log('Orders Page - Bookings data:', bookings);
      console.log('Orders Page - First booking structure:', bookings[0]);
      console.log('Orders Page - Service field:', bookings[0]?.serviceId);
      console.log('Orders Page - Guest field:', bookings[0]?.guestId);
    }
  }, [bookings]);  // Filter orders by category, search term, and status
  const filteredOrders = Array.isArray(bookings) ? bookings.filter(order => {
    console.log('🔍 Filtering order:', order);
    console.log('🔍 Order service:', order.service);
    console.log('🔍 Order serviceId:', order.serviceId);
    console.log('🔍 Order guest:', order.guest);
    console.log('🔍 Order guestId:', order.guestId);
    console.log('🔍 Order guestDetails:', order.guestDetails);

    const matchesCategory = selectedCategory === 'all' ||
      order.serviceId?.category?.toLowerCase() === selectedCategory.toLowerCase();

    const matchesSearch = searchTerm === '' ||
      order.guestId?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.guestId?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.guestDetails?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.guestDetails?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.serviceId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order._id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || order.status === statusFilter;

    console.log('🔍 Filter results - category:', matchesCategory, 'search:', matchesSearch, 'status:', matchesStatus);
    return matchesCategory && matchesSearch && matchesStatus;
  }) : [];  // Get order count by category
  const getCategoryCount = (categoryId) => {
    if (!Array.isArray(bookings)) {
      console.log('🔍 getCategoryCount - bookings is not an array:', bookings);
      return 0;
    }
    if (categoryId === 'all') return bookings.length;
    return bookings.filter(order =>
      order.serviceId?.category?.toLowerCase() === categoryId.toLowerCase()
    ).length;
  };

  // Handle viewing order details
  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    setIsModalOpen(true);
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  // Get status color
  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-purple-100 text-purple-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders by Category</h1>
        <p className="text-gray-600 mt-2">View and manage orders filtered by service categories</p>
      </div>

      {/* Category Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`${
                selectedCategory === category.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
            >
              <span className="text-lg">{category.icon}</span>
              <span>{category.name}</span>
              <span className={`${
                selectedCategory === category.id ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'
              } ml-2 py-0.5 px-2.5 rounded-full text-xs font-medium`}>
                {getCategoryCount(category.id)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search and Filter Controls */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search orders..."
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="w-full lg:w-48">
          <select
            className="block w-full px-3 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="in-progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {selectedCategory === 'all'
                  ? 'No orders available for any category.'
                  : `No orders found for ${categories.find(c => c.id === selectedCategory)?.name}.`}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <li key={order._id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {order.serviceId?.category === 'laundry' ? '👕' :
                               order.serviceId?.category === 'transportation' ? '🚗' :
                               order.serviceId?.category === 'tourism' ? '🏖️' : '📋'}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="flex items-center">
                            <div className="text-sm font-medium text-gray-900">
                              Order #{order._id.substring(0, 8)}...
                            </div>
                            <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                              {order.status}
                            </span>
                          </div>
                          <div className="mt-1">
                            <div className="text-sm text-gray-900">
                              {order.serviceId?.name || 'Service name not available'}
                            </div>
                            <div className="text-sm text-gray-500">
                              Category: {order.serviceId?.category || 'N/A'} •
                              Guest: {order.guestId?.firstName || order.guestDetails?.firstName || 'N/A'} {order.guestId?.lastName || order.guestDetails?.lastName || ''}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-gray-900">
                            ${order.pricing?.totalAmount?.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(order.appointmentDate || order.createdAt)}
                          </div>
                        </div>
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Order Details Modal */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Order Details</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Order ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder._id}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                      {selectedOrder.status}
                    </span>
                  </div>                  <div>
                    <label className="block text-sm font-medium text-gray-700">Service</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.serviceId?.name || 'N/A'}</p>
                    <p className="text-xs text-gray-500">Category: {selectedOrder.serviceId?.category || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Guest</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {selectedOrder.guestId?.firstName || selectedOrder.guestDetails?.firstName || 'N/A'} {selectedOrder.guestId?.lastName || selectedOrder.guestDetails?.lastName || ''}
                    </p>
                    <p className="text-xs text-gray-500">{selectedOrder.guestId?.email || selectedOrder.guestDetails?.email || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Total Amount</label>
                    <p className="mt-1 text-sm text-gray-900">${selectedOrder.pricing?.totalAmount?.toFixed(2) || '0.00'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Appointment Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedOrder.appointmentDate || selectedOrder.createdAt)}</p>
                  </div>
                </div>

                {selectedOrder.special_instructions && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Special Instructions</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedOrder.special_instructions}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500"
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
