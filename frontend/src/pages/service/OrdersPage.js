/**
 * Service Provider Orders Page
 * Mobile-first with responsive cards and table, client-side pagination
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { FiEye } from 'react-icons/fi';
import {
  fetchProviderOrders,
  updateOrderStatus,
  selectProviderOrders,
  selectServiceLoading,
  selectServiceError
} from '../../redux/slices/serviceSlice';

const getNested = (obj, path) => {
  if (!obj) return undefined;
  if (!path) return obj;
  return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
};

const OrdersPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const orders = useSelector(selectProviderOrders);
  const isLoading = useSelector(selectServiceLoading);
  const error = useSelector(selectServiceError);

  // Laundry service types mapping (from category templates)
  const laundryServiceTypes = {
    'wash_only': {
      name: 'Wash Only',
      description: 'Machine wash with appropriate detergent',
      duration: { value: 24, unit: 'hours' },
      icon: '🧼'
    },
    'iron_only': {
      name: 'Iron Only',
      description: 'Professional ironing and pressing',
      duration: { value: 12, unit: 'hours' },
      icon: '👔'
    },
    'wash_iron': {
      name: 'Wash + Iron',
      description: 'Complete wash and iron service',
      duration: { value: 24, unit: 'hours' },
      isPopular: true,
      icon: '🧺'
    },
    'dry_cleaning': {
      name: 'Dry Cleaning',
      description: 'Professional dry cleaning service',
      duration: { value: 48, unit: 'hours' },
      icon: '🧥'
    }
  };

  // Function to get enhanced service type info
  const getServiceTypeInfo = (serviceType) => {
    if (!serviceType) return null;

    // If serviceType has an ID, try to map it to our templates
    if (serviceType.id && laundryServiceTypes[serviceType.id]) {
      return {
        ...laundryServiceTypes[serviceType.id],
        ...serviceType // Merge with any existing data
      };
    }

    // Return as-is if no mapping found
    return serviceType;
  };

  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [currentOrder, setCurrentOrder] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // NEW: Pagination - fetch all orders but display 10 per page
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10); // Display 10 per page

  useEffect(() => {
    dispatch(fetchProviderOrders()); // Fetch all orders without limit
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchProviderOrders()); // Fetch all orders without limit
  }, [dispatch]);

  const handleStatusChange = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, status: newStatus }))
      .then(result => {
        if (result.type === 'service/updateOrderStatus/fulfilled') {
          if (currentOrder?._id === orderId) setCurrentOrder(co => ({ ...co, status: newStatus }));
          dispatch(fetchProviderOrders()); // Fetch all orders
        } else {
          alert('Failed to update order status: ' + (result.payload ?? 'Unknown error'));
        }
      })
      .catch(err => {
        console.error('Status update error:', err);
        alert('Failed to update order status');
      });
  };

  const handleViewDetails = (order) => {
    setCurrentOrder(order);
    setIsDetailsOpen(true);
  };

  const closeDetails = () => {
    setIsDetailsOpen(false);
    setCurrentOrder(null);
  };

  const handleSort = (key) => {
    setSortConfig(prev => {
      const direction = prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc';
      return { key, direction };
    });
    setPage(1); // reset paging on sort
  };

  const getServiceDisplayName = (order) => {
    // For housekeeping orders, show service category instead of service name
    if (order.serviceType === 'housekeeping') {
      const category = order.serviceDetails?.category || 'housekeeping';

      switch (category) {
        case 'cleaning':
        case 'room cleaning':
          return 'Room Cleaning';
        case 'amenities':
          return 'Amenities Request';
        case 'maintenance':
          return 'Maintenance Request';
        default:
          return 'Housekeeping Service';
      }
    }

    if (order.payment?.paymentMethod === 'cash') {
      // For cash payments, show service type instead of specific service name
      const serviceType = order.serviceType || 'regular';
      switch (serviceType) {
        case 'laundry':
          return 'Laundry Service';
        case 'transportation':
          return 'Transportation Service';
        default:
          return `${serviceType.charAt(0).toUpperCase() + serviceType.slice(1)} Service`;
      }
    } else {
      // For online payments, show the specific service name
      return order.serviceDetails?.name || order.serviceId?.name || order.serviceName || 'N/A';
    }
  };

  // Helper function to get human-readable category names for housekeeping
  const getHousekeepingCategoryName = (specificCategory) => {
    const categoryNames = {
      // Maintenance categories
      'electrical_issues': 'Electrical Issues',
      'plumbing_issues': 'Plumbing Issues',
      'ac_heating': 'AC & Heating',
      'furniture_repair': 'Furniture Repair',
      'electronics_issues': 'Electronics Issues',
      // Room cleaning categories
      'general_cleaning': 'General Room Cleaning',
      'deep_cleaning': 'Deep Cleaning',
      'stain_removal': 'Stain Removal',
      // Amenities categories
      'bathroom_amenities': 'Bathroom Amenities',
      'room_supplies': 'Room Supplies',
      'cleaning_supplies': 'Cleaning Supplies'
    };

    return categoryNames[specificCategory] || specificCategory?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Not specified';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100';
      case 'confirmed':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'in-progress':
        return 'bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100';
    }
  };

  // Normalize all orders (now including housekeeping bookings from the main orders endpoint)
  const allBookings = useMemo(() => {
    return (Array.isArray(orders) ? orders : []).map(order => {
      // Check if this is a housekeeping booking
      const isHousekeeping = order.serviceType === 'housekeeping';

      return {
        ...order,
        orderId: order.bookingNumber || order._id?.slice?.(-8) || '—',
        serviceType: order.serviceType || 'regular',
        displayType: isHousekeeping ? 'Housekeeping Service' : 'Regular Service',
        serviceName: order.serviceName || order.serviceDetails?.name || order.serviceId?.name || 'Service',
        guestName: order.guestDetails?.firstName && order.guestDetails?.lastName
          ? `${order.guestDetails.firstName} ${order.guestDetails.lastName}`
          : order.guestInfo?.name || order.guestId?.firstName + ' ' + order.guestId?.lastName || 'Unknown Guest',
        roomNumber: order.guestDetails?.roomNumber || order.guestInfo?.roomNumber || 'N/A',
        totalAmount: order.totalAmount || 0,
        createdAt: order.createdAt || order.schedule?.preferredDate || order.bookingDate || new Date().toISOString(),
        hotel: order.hotel || order.hotelId || { name: 'Hotel Service' },
        hotelName: order.hotel?.name || order.hotelId?.name || 'Hotel Service',
        serviceDetails: order.serviceDetails || {
          name: order.serviceName || order.serviceId?.name || 'Service',
          category: order.category || order.serviceType || 'general'
        },
        guestDetails: order.guestDetails || {
          firstName: order.guestId?.firstName || 'Guest',
          lastName: order.guestId?.lastName || '',
          email: order.guestId?.email || order.guestDetails?.email || 'no-email@service.local',
          phone: order.guestDetails?.phone || order.guestId?.phone || '',
          roomNumber: order.guestDetails?.roomNumber || 'N/A'
        },
        schedule: order.schedule || {
          preferredDate: order.scheduledDateTime || order.bookingDate || order.createdAt,
          preferredTime: order.preferredTime || '09:00'
        }
      };
    });
  }, [orders]);

  // Filters
  const filteredOrders = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today); lastWeek.setDate(lastWeek.getDate() - 7);
    const lastMonth = new Date(today); lastMonth.setMonth(lastMonth.getMonth() - 1);

    return allBookings.filter(order => {
      const orderDate = new Date(order.createdAt);
      const byStatus = statusFilter === 'all' || order.status === statusFilter;
      const byType = serviceTypeFilter === 'all' || order.serviceType === serviceTypeFilter;

      let byDate = true;
      if (dateFilter === 'today') byDate = orderDate.toDateString() === today.toDateString();
      else if (dateFilter === 'yesterday') byDate = orderDate.toDateString() === yesterday.toDateString();
      else if (dateFilter === 'week') byDate = orderDate >= lastWeek;
      else if (dateFilter === 'month') byDate = orderDate >= lastMonth;

      return byStatus && byType && byDate;
    });
  }, [allBookings, statusFilter, serviceTypeFilter, dateFilter]);

  // Sort
  const sortedOrders = useMemo(() => {
    const arr = [...filteredOrders];
    arr.sort((a, b) => {
      const av = getNested(a, sortConfig.key);
      const bv = getNested(b, sortConfig.key);
      if (av == null && bv == null) return 0;
      if (av == null) return sortConfig.direction === 'asc' ? -1 : 1;
      if (bv == null) return sortConfig.direction === 'asc' ? 1 : -1;

      // dates
      if (sortConfig.key.toLowerCase().includes('date') || sortConfig.key === 'createdAt') {
        const ad = new Date(av).getTime();
        const bd = new Date(bv).getTime();
        return sortConfig.direction === 'asc' ? ad - bd : bd - ad;
      }

      // numbers
      if (typeof av === 'number' && typeof bv === 'number') {
        return sortConfig.direction === 'asc' ? av - bv : bv - av;
      }

      // strings or others
      const as = String(av).toLowerCase();
      const bs = String(bv).toLowerCase();
      if (as < bs) return sortConfig.direction === 'asc' ? -1 : 1;
      if (as > bs) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return arr;
  }, [filteredOrders, sortConfig]);

  // Reset page when filters/sort change
  useEffect(() => {
    setPage(1);
  }, [statusFilter, serviceTypeFilter, dateFilter, sortConfig]);

  // Pagination calculations
  const totalResults = sortedOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalResults / pageSize));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageOrders = sortedOrders.slice(startIdx, endIdx);

  const goToPage = (p) => setPage(Math.min(Math.max(1, p), totalPages));

  // Small helper to render page numbers (compact)
  const renderPageButtons = () => {
    const maxButtons = 5;
    let start = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);

    const btn = [];
    for (let i = start; i <= end; i++) {
      btn.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-2 rounded-md text-sm border transition ${
            i === currentPage
              ? 'bg-[#3B5787] text-white border-[#3B5787]'
              : 'bg-white text-[#3B5787] border-gray-200 hover:bg-gray-50'
          }`}
        >
          {i}
        </button>
      );
    }
    return btn;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="w-full px-2 sm:px-3 lg:px-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50" />
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50" />
          <div className="relative">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">
              {t('serviceProvider.orders.title')}
            </h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
              Manage and track all your service orders in one place
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl relative mb-4 sm:mb-6" role="alert">
            <span className="block sm:inline text-sm sm:text-base">{error}</span>
          </div>
        )}

        {/* Filters + paging header */}
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100 mb-6">
          <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
            <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
              <div className="flex items-center">
                <div className="w-1 h-6 bg-gradient-to-b from-[#3B5787] to-[#67BAE0] rounded-full mr-3" />
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">Filter Orders</h3>
              </div>
              {/* Page size selector (top-right) */}
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm text-gray-600">Rows:</span>
                <select
                  value={pageSize}
                  onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                  className="block pl-3 pr-8 py-2 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] rounded-lg bg-white shadow-sm"
                >
                  {[5, 10, 20, 50].map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="block w-full pl-3 pr-8 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] rounded-lg bg-white shadow-sm"
                >
                  <option value="all">{t('serviceProvider.orders.allOrders')}</option>
                  <option value="pending">{t('common.pending')}</option>
                  <option value="confirmed">{t('common.confirmed')}</option>
                  <option value="in-progress">{t('serviceProvider.orders.inProgress')}</option>
                  <option value="completed">{t('serviceProvider.orders.completed')}</option>
                  <option value="cancelled">{t('serviceProvider.orders.cancelled')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="block w-full pl-3 pr-8 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] rounded-lg bg-white shadow-sm"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="week">Last 7 Days</option>
                  <option value="month">Last 30 Days</option>
                </select>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Service Type</label>
                <select
                  value={serviceTypeFilter}
                  onChange={(e) => setServiceTypeFilter(e.target.value)}
                  className="block w-full pl-3 pr-8 py-2.5 text-sm border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] rounded-lg bg-white shadow-sm"
                >
                  <option value="all">All Services</option>
                  <option value="regular">Regular Services</option>
                  <option value="housekeeping">Housekeeping</option>
                </select>
              </div>

              <div className="flex items-end">
                <div className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 rounded-lg px-4 py-2.5 border border-[#67BAE0]/20 w-full">
                  <div className="text-xs font-medium text-[#3B5787] mb-1">Total Results</div>
                  <div className="text-lg font-bold text-[#3B5787]">{totalResults}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CONTENT */}
        <div className="bg-white shadow-xl rounded-xl sm:rounded-2xl overflow-hidden border border-gray-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 sm:py-24">
              <div className="w-full flex flex-col items-center">
                <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-6 sm:p-8 mb-6 text-white relative overflow-hidden w-full max-w-lg mx-auto">
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50" />
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50" />
                  <div className="relative flex flex-col items-center">
                    <div className="relative mb-4">
                      {/* Outer gradient spinner */}
                      <div className="animate-spin-slow absolute inset-0 rounded-full h-16 w-16 sm:h-20 sm:w-20 bg-gradient-to-r from-[#3B5787] via-[#67BAE0] to-[#3B5787] opacity-40" />
                      {/* Inner white spinner */}
                      <div className="animate-spin rounded-full h-16 w-16 sm:h-20 sm:w-20 border-t-4 border-b-4 border-white mx-auto" />
                      {/* Center icon */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <circle cx="12" cy="12" r="10" strokeWidth="2" stroke="currentColor" fill="none" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
                        </svg>
                      </div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Loading Orders</h3>
                    <p className="text-white/90 text-sm sm:text-base">Please wait while we fetch your latest orders and bookings.</p>
                  </div>
                </div>
              </div>
            </div>
          ) : totalResults > 0 ? (
            <>
              {/* Mobile Cards (<= md) */}
              <div className="md:hidden divide-y divide-gray-100">
                {pageOrders.map(order => (
                  <div key={order._id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-[#3B5787] font-semibold">#{order.bookingNumber || order._id?.slice(-8)}</div>
                        <div className="text-sm font-medium text-gray-900">
                          {getServiceDisplayName(order)}
                        </div>
                        {/* Show issue category for housekeeping orders */}
                        {order.serviceType === 'housekeeping' && order.serviceDetails?.specificCategory && (
                          <div className="text-xs text-purple-600 font-medium mt-1">
                            {getHousekeepingCategoryName(order.serviceDetails.specificCategory)}
                          </div>
                        )}
                        <div className="text-xs text-gray-500">
                          {order.hotel?.name || order.hotelId?.name || order.hotelName || 'N/A'}
                        </div>
                      </div>
                      <div className="text-[#3B5787] font-semibold">
                        ${(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                        {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                      </span>
                      <span className="text-xs text-gray-500">
                        {order.payment?.paymentMethod === 'cash' ? 'Cash' : 'Visa/Card'}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => handleViewDetails(order)}
                        className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-md hover:from-[#2A4A6B] hover:to-[#5BA8CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-200 shadow-sm"
                      >
                        <FiEye className="w-4 h-4 mr-1" />
                        {t('serviceProvider.orders.viewDetails')}
                      </button>
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                        className="text-sm border-[#67BAE0] focus:ring-[#3B5787] focus:border-[#3B5787] rounded-md bg-white shadow-sm"
                        disabled={order.status === 'cancelled' || order.status === 'completed'}
                      >
                        <option value="pending">{t('common.pending')}</option>
                        <option value="confirmed">{t('serviceProvider.orders.confirmOrder')}</option>
                        <option value="in-progress">{t('serviceProvider.orders.markInProgress')}</option>
                        <option value="completed">{t('serviceProvider.orders.markCompleted')}</option>
                        <option value="cancelled">{t('serviceProvider.orders.markCancelled')}</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table (>= md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5">
                    <tr>
                      <th
                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider cursor-pointer hover:bg-[#67BAE0]/10"
                        onClick={() => handleSort('orderId')}
                      >
                        <div className="flex items-center">
                          <span>{t('serviceProvider.orders.orderNumber')}</span>
                          {sortConfig.key === 'orderId' && (
                            <span className="ml-1 text-[#67BAE0]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider cursor-pointer hover:bg-[#67BAE0]/10"
                        onClick={() => handleSort('serviceDetails.name')}
                      >
                        <div className="flex items-center">
                          <span>{t('serviceProvider.orders.service')}</span>
                          {sortConfig.key === 'serviceDetails.name' && (
                            <span className="ml-1 text-[#67BAE0]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider cursor-pointer hover:bg-[#67BAE0]/10"
                        onClick={() => handleSort('hotel.name')}
                      >
                        <div className="flex items-center">
                          <span>{t('serviceProvider.orders.hotel')}</span>
                          {sortConfig.key === 'hotel.name' && (
                            <span className="ml-1 text-[#67BAE0]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider cursor-pointer hover:bg-[#67BAE0]/10"
                        onClick={() => handleSort('totalAmount')}
                      >
                        <div className="flex items-center">
                          <span>{t('serviceProvider.orders.amount')}</span>
                          {sortConfig.key === 'totalAmount' && (
                            <span className="ml-1 text-[#67BAE0]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider">
                        Payment Method
                      </th>
                      <th
                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider cursor-pointer hover:bg-[#67BAE0]/10"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center">
                          <span>{t('serviceProvider.orders.status')}</span>
                          {sortConfig.key === 'status' && (
                            <span className="ml-1 text-[#67BAE0]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th
                        className="px-4 lg:px-6 py-4 text-left text-xs font-semibold text-[#3B5787] uppercase tracking-wider cursor-pointer hover:bg-[#67BAE0]/10"
                        onClick={() => handleSort('createdAt')}
                      >
                        <div className="flex items-center">
                          <span>{t('serviceProvider.orders.createdAt')}</span>
                          {sortConfig.key === 'createdAt' && (
                            <span className="ml-1 text-[#67BAE0]">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                          )}
                        </div>
                      </th>
                      <th className="px-4 lg:px-6 py-4 text-right text-xs font-semibold text-[#3B5787] uppercase tracking-wider">
                        {t('serviceProvider.orders.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-50">
                    {pageOrders.map((order, index) => (
                      <tr
                        key={order._id}
                        className={`hover:bg-gradient-to-r hover:from-[#3B5787]/5 hover:to-[#67BAE0]/5 transition-all duration-200 ${
                          index % 2 === 0 ? 'bg-white' : 'bg-gray-25'
                        }`}
                      >
                        <td className="px-4 lg:px-6 py-4 text-sm font-semibold text-gray-900">
                          <span className="text-[#3B5787] font-medium">#{order.bookingNumber || order._id?.slice(-8)}</span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                          <span className="font-medium text-gray-900">
                            {getServiceDisplayName(order)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                          {order.hotel?.name || order.hotelId?.name || order.hotelName || 'N/A'}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm font-semibold text-[#3B5787]">
                          ${(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-700">
                          {order.payment?.paymentMethod === 'cash' ? 'Cash' : 'Visa/Card'}
                        </td>
                        <td className="px-4 lg:px-6 py-4">
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
                          </span>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-sm text-gray-500">
                          <div className="flex flex-col">
                            <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            <span className="text-xs text-gray-400">
                              {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 lg:px-6 py-4 text-right">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:justify-end">
                            <button
                              onClick={() => handleViewDetails(order)}
                              className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-md hover:from-[#2A4A6B] hover:to-[#5BA8CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-200 shadow-sm"
                            >
                              <FiEye className="w-4 h-4 mr-1" />
                              {t('serviceProvider.orders.viewDetails')}
                            </button>
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="text-sm border-[#67BAE0] focus:ring-[#3B5787] focus:border-[#3B5787] rounded-md bg-white shadow-sm"
                              disabled={order.status === 'cancelled' || order.status === 'completed'}
                            >
                              <option value="pending">{t('common.pending')}</option>
                              <option value="confirmed">{t('serviceProvider.orders.confirmOrder')}</option>
                              <option value="in-progress">{t('serviceProvider.orders.markInProgress')}</option>
                              <option value="completed">{t('serviceProvider.orders.markCompleted')}</option>
                              <option value="cancelled">{t('serviceProvider.orders.markCancelled')}</option>
                            </select>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination footer */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-4 border-t bg-gray-50">
                <div className="text-xs sm:text-sm text-gray-600">
                  Showing <span className="font-semibold">{totalResults === 0 ? 0 : startIdx + 1}</span>–
                  <span className="font-semibold">{Math.min(endIdx, totalResults)}</span> of{' '}
                  <span className="font-semibold">{totalResults}</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-[#3B5787] border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Prev
                  </button>

                  {/* Hide number buttons on very small screens to avoid crowding */}
                  <div className="hidden sm:flex items-center gap-2">
                    {renderPageButtons()}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-md text-sm border ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        : 'bg-white text-[#3B5787] border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-16 bg-gradient-to-br from-white to-gray-50 rounded-xl border-2 border-dashed border-gray-200">
              <div className="bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('serviceProvider.orders.noOrders')}</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {t('serviceProvider.orders.noOrdersDescription')}
              </p>
            </div>
          )}
        </div>

        {/* Details Modal */}
        {isDetailsOpen && currentOrder && (
          <div className="fixed z-50 inset-0 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
              </div>
              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
              <div className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full border border-gray-100">
                <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] px-6 py-4">
                  <h3 className="text-xl font-semibold text-white flex items-center">
                    <div className="bg-white/20 rounded-lg p-2 mr-3">
                      <FiEye className="w-5 h-5 text-white" />
                    </div>
                    Order Details
                    <span className="ml-3 bg-white/20 px-3 py-1 rounded-full text-sm font-medium">
                      #{currentOrder.bookingNumber || currentOrder._id.slice(-8)}
                    </span>
                  </h3>
                </div>

                <div className="bg-white px-6 py-6">
                  <div className="space-y-6">
                    {/* Status and Date */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Status</p>
                        <div className="mt-2">
                          <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(currentOrder.status)}`}>
                            {currentOrder.status.charAt(0).toUpperCase() + currentOrder.status.slice(1)}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Order Date</p>
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {new Date(currentOrder.createdAt).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    {/* Service */}
                    <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 rounded-lg p-4 border border-[#67BAE0]/20">
                      <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Service</p>
                      <p className="mt-2 text-lg font-medium text-gray-900">
                        {getServiceDisplayName(currentOrder)}
                      </p>
                    </div>

                    {/* Schedule & Hotel */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Scheduled Date</p>
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {currentOrder.schedule?.preferredDate
                            ? new Date(currentOrder.schedule.preferredDate).toLocaleDateString()
                            : 'Not scheduled'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {currentOrder.schedule?.preferredTime || 'No time specified'}
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Hotel</p>
                        <p className="mt-2 text-sm font-medium text-gray-900">
                          {currentOrder.hotel?.name || currentOrder.hotelId?.name || currentOrder.hotelName || 'Unknown Hotel'}
                        </p>
                      </div>
                    </div>

                    {/* Guest */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Guest Information</p>
                      <div className="mt-2 space-y-1">
                        <p className="text-sm font-medium text-gray-900">
                          {currentOrder.guestId?.firstName || currentOrder.guestDetails?.firstName || 'Unknown'}{' '}
                          {currentOrder.guestId?.lastName || currentOrder.guestDetails?.lastName || 'Guest'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {currentOrder.guestId?.email || currentOrder.guestDetails?.email || 'No email provided'}
                        </p>
                        <p className="text-xs text-gray-500">{currentOrder.guestDetails?.phone || 'No phone provided'}</p>
                      </div>
                    </div>

                    {/* Service-Specific Details */}
                    {/* Laundry Items */}
                    {((currentOrder.serviceType === 'laundry') ||
                      (currentOrder.serviceDetails?.category === 'laundry') ||
                      (currentOrder.category === 'laundry')) &&
                     currentOrder.bookingConfig?.laundryItems &&
                     currentOrder.bookingConfig.laundryItems.length > 0 && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Laundry Items</p>
                        <div className="space-y-3">
                          {currentOrder.bookingConfig.laundryItems.map((item, index) => {
                            const enhancedServiceType = getServiceTypeInfo(item.serviceType);
                            return (
                            <div key={index} className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-lg">{item.itemIcon || '👕'}</span>
                                    <span className="font-medium text-gray-900">{item.itemName}</span>
                                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                                      {item.itemCategory}
                                    </span>
                                  </div>

                                  {/* Service Type - More Prominent Display */}
                                  <div className="mb-2 p-2 bg-blue-50 rounded-md border border-blue-200">
                                    <div className="flex items-center gap-2">
                                      <span className="text-blue-600 font-medium text-sm">
                                        {enhancedServiceType?.icon || '🧺'} {enhancedServiceType?.name || 'Service Type Not Specified'}
                                      </span>
                                      {enhancedServiceType?.isPopular && (
                                        <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                          ⭐ Popular
                                        </span>
                                      )}
                                    </div>
                                    {enhancedServiceType?.description && (
                                      <div className="mt-1 text-xs text-blue-600">
                                        {enhancedServiceType.description}
                                      </div>
                                    )}
                                    <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
                                      <span>Qty: {item.quantity}</span>
                                      {enhancedServiceType?.duration && (
                                        <span>⏱️ {enhancedServiceType.duration.value} {enhancedServiceType.duration.unit}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    ${item.finalPrice?.toFixed(2) || '0.00'}
                                  </div>
                                  {item.basePrice !== item.finalPrice && (
                                    <div className="text-xs text-gray-500 line-through">
                                      ${item.basePrice?.toFixed(2) || '0.00'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Location Details for Laundry Bookings */}
                    {((currentOrder.serviceType === 'laundry') ||
                      (currentOrder.serviceDetails?.category === 'laundry') ||
                      (currentOrder.category === 'laundry')) &&
                     (currentOrder.location?.pickup?.address || currentOrder.location?.delivery?.address ||
                      currentOrder.location?.pickupLocation || currentOrder.location?.deliveryLocation) && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Pickup & Delivery</p>
                        <div className="bg-white rounded-lg p-3 border border-green-100">
                          {(currentOrder.location?.pickup?.address || currentOrder.location?.pickupLocation) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">📍 Pickup Location: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.pickup?.address || currentOrder.location.pickupLocation}
                              </span>
                            </div>
                          )}
                          {(currentOrder.location?.delivery?.address || currentOrder.location?.deliveryLocation) &&
                           (currentOrder.location.delivery?.address !== currentOrder.location.pickup?.address) &&
                           (currentOrder.location.deliveryLocation !== currentOrder.location.pickupLocation) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">📍 Delivery Location: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.delivery?.address || currentOrder.location.deliveryLocation}
                              </span>
                            </div>
                          )}
                          {(currentOrder.location?.pickup?.instructions || currentOrder.location?.pickupInstructions) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">📝 Instructions: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.pickup?.instructions || currentOrder.location.pickupInstructions}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Laundry Service (Fallback for bookings without detailed items) */}
                    {((currentOrder.serviceType === 'laundry') ||
                      (currentOrder.serviceDetails?.category === 'laundry') ||
                      (currentOrder.category === 'laundry')) &&
                     (!currentOrder.bookingConfig?.laundryItems || currentOrder.bookingConfig.laundryItems.length === 0) && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Laundry Service</p>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          <div className="space-y-2">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Service: </span>
                              <span className="text-sm text-gray-900">
                                {getServiceDisplayName(currentOrder)}
                              </span>
                            </div>
                            <div>
                              <span className="text-sm font-medium text-gray-700">Category: </span>
                              <span className="text-sm text-gray-900 capitalize">
                                {currentOrder.serviceDetails?.subcategory || 'General Laundry'}
                              </span>
                            </div>
                            {currentOrder.bookingConfig?.quantity && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Quantity: </span>
                                <span className="text-sm text-gray-900">{currentOrder.bookingConfig.quantity}</span>
                              </div>
                            )}
                            {currentOrder.bookingConfig?.isExpressService && (
                              <div className="mt-2 inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                                ⚡ Express Service
                              </div>
                            )}
                            <div className="mt-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
                              ⚠️ Detailed item breakdown not available for this booking
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Restaurant Menu Items */}
                    {(currentOrder.serviceType === 'restaurant' || currentOrder.serviceType === 'dining') && currentOrder.bookingConfig?.menuItems && currentOrder.bookingConfig.menuItems.length > 0 && (
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Menu Items</p>
                        <div className="space-y-3">
                          {currentOrder.bookingConfig.menuItems.map((item, index) => (
                            <div key={index} className="bg-white rounded-lg p-3 border border-green-100">
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="font-medium text-gray-900">{item.itemName}</span>
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                      {item.itemCategory}
                                    </span>
                                    {item.isVegetarian && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌱 Veg</span>
                                    )}
                                    {item.isVegan && (
                                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">🌿 Vegan</span>
                                    )}
                                    {item.spicyLevel && item.spicyLevel !== 'mild' && (
                                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">
                                        🌶️ {item.spicyLevel}
                                      </span>
                                    )}
                                  </div>
                                  <div className="mt-1 text-xs text-gray-600">
                                    Quantity: {item.quantity} | Prep Time: {item.preparationTime || 15} min
                                  </div>
                                  {item.description && (
                                    <div className="mt-1 text-xs text-gray-500">{item.description}</div>
                                  )}
                                  {item.allergens && item.allergens.length > 0 && (
                                    <div className="mt-1 text-xs text-orange-600">
                                      ⚠️ Allergens: {item.allergens.join(', ')}
                                    </div>
                                  )}
                                  {item.specialInstructions && (
                                    <div className="mt-1 text-xs text-blue-600">
                                      Special: {item.specialInstructions}
                                    </div>
                                  )}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-medium text-gray-900">
                                    ${item.totalPrice?.toFixed(2) || '0.00'}
                                  </div>
                                  <div className="text-xs text-gray-500">
                                    ${item.price?.toFixed(2) || '0.00'} each
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Restaurant Delivery Location */}
                    {(currentOrder.serviceType === 'restaurant' || currentOrder.serviceType === 'dining') &&
                     (currentOrder.location?.pickup?.address || currentOrder.location?.delivery?.address ||
                      currentOrder.location?.pickupLocation || currentOrder.location?.deliveryLocation) && (
                      <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Delivery Information</p>
                        <div className="bg-white rounded-lg p-3 border border-blue-100">
                          {(currentOrder.location?.delivery?.address || currentOrder.location?.deliveryLocation) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">📍 Delivery Location: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.delivery?.address || currentOrder.location.deliveryLocation}
                              </span>
                            </div>
                          )}
                          {(currentOrder.location?.pickup?.address || currentOrder.location?.pickupLocation) &&
                           (currentOrder.location.pickup?.address !== currentOrder.location.delivery?.address) &&
                           (currentOrder.location.pickupLocation !== currentOrder.location.deliveryLocation) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">📍 Pickup Location: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.pickup?.address || currentOrder.location.pickupLocation}
                              </span>
                            </div>
                          )}
                          {(currentOrder.location?.delivery?.instructions || currentOrder.location?.pickup?.instructions) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">📝 Instructions: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.delivery?.instructions || currentOrder.location.pickup?.instructions}
                              </span>
                            </div>
                          )}
                          {currentOrder.bookingConfig?.specialRequests && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">🍽️ Special Requests: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.bookingConfig.specialRequests}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Transportation Details */}
                    {currentOrder.serviceType === 'transportation' && (
                      <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Transportation Details</p>
                        <div className="bg-white rounded-lg p-3 border border-yellow-100">
                          {currentOrder.resources?.vehicle && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Vehicle: </span>
                              <span className="text-sm text-gray-900">{currentOrder.resources.vehicle}</span>
                            </div>
                          )}
                          {(currentOrder.location?.pickup || currentOrder.location?.pickupLocation) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Pickup: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.pickup?.address || currentOrder.location.pickupLocation || 'Hotel Location'}
                              </span>
                              {(currentOrder.location.pickup?.instructions || currentOrder.location.pickupInstructions) && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Instructions: {currentOrder.location.pickup?.instructions || currentOrder.location.pickupInstructions}
                                </div>
                              )}
                            </div>
                          )}
                          {(currentOrder.location?.delivery || currentOrder.location?.deliveryLocation) && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Delivery: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.location.delivery?.address || currentOrder.location.deliveryLocation || 'Not specified'}
                              </span>
                              {(currentOrder.location.delivery?.instructions) && (
                                <div className="text-xs text-gray-600 mt-1">
                                  Instructions: {currentOrder.location.delivery.instructions}
                                </div>
                              )}
                            </div>
                          )}
                          {currentOrder.schedule?.estimatedDuration && (
                            <div className="mb-2">
                              <span className="text-sm font-medium text-gray-700">Estimated Duration: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.schedule.estimatedDuration.value} {currentOrder.schedule.estimatedDuration.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Housekeeping Details */}
                    {currentOrder.serviceType === 'housekeeping' && (
                      <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Housekeeping Service Details</p>
                        <div className="bg-white rounded-lg p-3 border border-purple-100">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <span className="text-sm font-medium text-gray-700">Service Category: </span>
                              <span className="text-sm text-gray-900 capitalize">
                                {currentOrder.serviceDetails?.category || currentOrder.category || 'Housekeeping'}
                              </span>
                            </div>
                            {/* Issue Category - NEW FIELD */}
                            {currentOrder.serviceDetails?.specificCategory && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Issue Category: </span>
                                <span className="text-sm text-purple-700 font-medium">
                                  {getHousekeepingCategoryName(currentOrder.serviceDetails.specificCategory)}
                                </span>
                              </div>
                            )}
                            {currentOrder.serviceDetails?.subcategory && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Subcategory: </span>
                                <span className="text-sm text-gray-900 capitalize">
                                  {currentOrder.serviceDetails.subcategory}
                                </span>
                              </div>
                            )}
                            <div>
                              <span className="text-sm font-medium text-gray-700">Room Number: </span>
                              <span className="text-sm text-gray-900">
                                {currentOrder.guestDetails?.roomNumber || 'Not specified'}
                              </span>
                            </div>
                            {currentOrder.schedule?.estimatedDuration && (
                              <div>
                                <span className="text-sm font-medium text-gray-700">Estimated Duration: </span>
                                <span className="text-sm text-gray-900">
                                  {currentOrder.schedule.estimatedDuration.value} {currentOrder.schedule.estimatedDuration.unit}
                                </span>
                              </div>
                            )}
                          </div>
                          {currentOrder.bookingConfig?.isExpressService && (
                            <div className="mt-3 inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">
                              ⚡ Express Service
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Service Options & Add-ons */}
                    {((currentOrder.bookingConfig?.selectedOptions && currentOrder.bookingConfig.selectedOptions.length > 0) ||
                      (currentOrder.bookingConfig?.additionalServices && currentOrder.bookingConfig.additionalServices.length > 0)) && (
                      <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-200">
                        <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Service Options & Add-ons</p>

                        {/* Selected Options */}
                        {currentOrder.bookingConfig?.selectedOptions && currentOrder.bookingConfig.selectedOptions.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs font-medium text-gray-700 mb-2">Selected Options:</p>
                            <div className="space-y-1">
                              {currentOrder.bookingConfig.selectedOptions.map((option, index) => (
                                <div key={index} className="flex justify-between text-sm bg-white p-2 rounded border border-indigo-100">
                                  <span>{option.name}: {option.value}</span>
                                  {option.priceModifier !== 0 && (
                                    <span className={option.priceModifier > 0 ? 'text-green-600' : 'text-red-600'}>
                                      {option.priceModifier > 0 ? '+' : ''}${option.priceModifier?.toFixed(2)}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Services */}
                        {currentOrder.bookingConfig?.additionalServices && currentOrder.bookingConfig.additionalServices.length > 0 && (
                          <div>
                            <p className="text-xs font-medium text-gray-700 mb-2">Additional Services:</p>
                            <div className="space-y-1">
                              {currentOrder.bookingConfig.additionalServices.map((service, index) => (
                                <div key={index} className="flex justify-between text-sm bg-white p-2 rounded border border-indigo-100">
                                  <span>{service.name}</span>
                                  <span className="text-green-600">+${service.price?.toFixed(2)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide">Notes/Special Requests</p>
                      <p className="mt-2 text-sm text-gray-700">
                        {currentOrder.bookingDetails?.specialRequests ||
                          currentOrder.bookingConfig?.specialRequests ||
                          currentOrder.bookingConfig?.notes ||
                          currentOrder.notes ||
                          currentOrder.specialRequests ||
                          'No special requests'}
                      </p>
                    </div>

                    {/* Pricing */}
                    <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 rounded-lg p-4 border border-[#67BAE0]/20">
                      <p className="text-sm font-semibold text-[#3B5787] uppercase tracking-wide mb-3">Pricing Details</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Base Price:</span>
                          <span className="font-medium">
                            ${(currentOrder.pricing?.basePrice || currentOrder.basePrice || 0).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Hotel Markup:</span>
                          <span className="font-medium">
                            {(
                              (currentOrder.pricing?.totalAmount || currentOrder.totalAmount || 0) -
                              (currentOrder.pricing?.basePrice || currentOrder.basePrice || 0)
                            ).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{currentOrder.bookingConfig?.quantity || currentOrder.quantity || 1}</span>
                        </div>
                        {currentOrder.bookingConfig?.isExpressService && (
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">⚡ Express Service:</span>
                            <span className="font-medium text-red-600">
                              {currentOrder.pricing?.expressSurcharge > 0
                                ? `$${currentOrder.pricing.expressSurcharge.toFixed(2)}`
                                : 'Yes'
                              }
                            </span>
                          </div>
                        )}
                        <div className="border-t pt-2 flex justify-between font-semibold text-[#3B5787]">
                          <span>Total Amount:</span>
                          <span>${(currentOrder.pricing?.totalAmount || currentOrder.totalAmount || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Payment Method:</span>
                          <span className="font-medium">
                            {currentOrder.payment?.paymentMethod === 'cash' ? 'Cash at Hotel' : 'Online Payment'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row-reverse gap-3">
                    {currentOrder.status !== 'cancelled' && currentOrder.status !== 'completed' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleStatusChange(currentOrder._id, 'completed')}
                          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white text-sm font-medium rounded-lg hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-200 shadow-sm"
                        >
                          Mark as Completed
                        </button>
                        {currentOrder.status !== 'in-progress' && (
                          <button
                            type="button"
                            onClick={() => handleStatusChange(currentOrder._id, 'in-progress')}
                            className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white text-sm font-medium rounded-lg hover:from-[#2A4A6B] hover:to-[#5BA8CC] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-200 shadow-sm"
                          >
                            Mark as In Progress
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleStatusChange(currentOrder._id, 'cancelled')}
                          className="inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 text-white text-sm font-medium rounded-lg hover:from-red-700 hover:to-red-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-200 shadow-sm"
                        >
                          Cancel Order
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={closeDetails}
                      className="inline-flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-200 shadow-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
