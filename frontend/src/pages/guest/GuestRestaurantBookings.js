/**
 * Guest Restaurant Bookings Management
 * Shows guest's restaurant bookings with payment integration
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaUtensils,
  FaEye,
  FaTimes,
  FaReceipt,
  FaMapMarkerAlt,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaCheck,
  FaLeaf,
  FaClock
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const GuestRestaurantBookings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debug timestamp
  console.log('🔄 GuestRestaurantBookings component loaded/updated at:', new Date().toISOString());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTab, setSelectedTab] = useState('confirmed');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const itemsPerPage = 10;

  const tabs = [
    { id: 'confirmed', label: t('restaurant.labels.confirmed', 'Confirmed'), icon: FaCheck },
    { id: 'completed', label: t('restaurant.labels.completed', 'Completed'), icon: FaCheck }
  ];

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when tab changes
    fetchBookings();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBookings();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/client/bookings?category=restaurant&status=${selectedTab}&page=${currentPage}&limit=${itemsPerPage}`);

      console.log('🔍 Raw restaurant bookings response:', response.data);

      if (response.data.success) {
        const bookingsData = response.data.data.bookings || [];
        console.log('📋 Restaurant bookings data:', bookingsData);

        setBookings(bookingsData);

        const pagination = response.data.data.pagination;
        const totalBookingsFromApi = pagination?.total || response.data.data.bookings?.length || 0;

        // Calculate total pages correctly
        const calculatedTotalPages = Math.ceil(totalBookingsFromApi / itemsPerPage);
        let totalPagesFromApi = pagination?.totalPages || calculatedTotalPages || 1;

        if (totalBookingsFromApi > itemsPerPage && totalPagesFromApi === 1) {
          totalPagesFromApi = calculatedTotalPages;
        }

        setTotalPages(totalPagesFromApi);
        setTotalBookings(totalBookingsFromApi);
      }
    } catch (error) {
      console.error('Error fetching restaurant bookings:', error);
      toast.error('Failed to load restaurant bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
      'payment_pending': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200',
      'confirmed': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      'in_progress': 'bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] border border-[#67BAE0]/20',
      'ready': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      'delivered': 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
      'completed': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      'cancelled': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': t('common.pending', 'Pending'),
      'payment_pending': 'Payment Pending',
      'confirmed': t('common.confirmed', 'Confirmed'),
      'in_progress': t('common.inProgress', 'In Progress'),
      'ready': 'Ready',
      'delivered': 'Delivered',
      'completed': t('common.completed', 'Completed'),
      'cancelled': t('common.cancelled', 'Cancelled')
    };
    return statusLabels[status] || status;
  };

  const getSpicyLevelDisplay = (level) => {
    const levels = {
      mild: '🌶️',
      medium: '🌶️🌶️',
      hot: '🌶️🌶️🌶️',
      very_hot: '🌶️🌶️🌶️🌶️'
    };
    return levels[level] || '';
  };

  const handleViewDetails = async (bookingId) => {
    try {
      console.log('🔍 Fetching restaurant booking details for ID:', bookingId);

      // First, find the booking in the current bookings list to show something immediately
      const currentBooking = bookings.find(b => b._id === bookingId);
      if (currentBooking) {
        console.log('📋 Setting current booking from list:', currentBooking);
        setSelectedBooking(currentBooking);
      } else {
        console.error('❌ Booking not found in current list:', bookingId);
        toast.error('Booking not found');
        return;
      }

      // Then try to fetch detailed version from API (but don't clear the modal if it fails)
      try {
        const response = await apiClient.get(`/client/bookings/${bookingId}`);
        console.log('📋 Booking details response:', response);
        console.log('📋 Response data:', response.data);

        if (response.data && response.data.success) {
          // The API response might have the booking data directly in response.data.data
          let detailedBooking = response.data.data?.booking || response.data.data;

          console.log('✅ API returned success, checking booking data:', detailedBooking);

          // If we have detailed booking data, merge it with current booking
          if (detailedBooking && typeof detailedBooking === 'object') {
            // Merge the detailed data with the current booking to preserve all fields
            const mergedBooking = {
              ...currentBooking, // Keep original booking data (has bookingNumber, pricing, etc.)
              ...detailedBooking, // Add any additional details from API
              // Ensure we preserve critical fields from the original booking
              _id: currentBooking._id,
              bookingNumber: currentBooking.bookingNumber,
              status: currentBooking.status,
              pricing: currentBooking.pricing,
              createdAt: currentBooking.createdAt
            };

            console.log('✅ Merged booking data:', mergedBooking);
            setSelectedBooking(mergedBooking);
          } else {
            console.log('⚠️ Keeping current booking due to invalid API data structure');
          }
        } else if (response.data && typeof response.data === 'object') {
          // Sometimes the API returns data directly without success wrapper
          // Try to merge this data with our current booking
          const mergedBooking = {
            ...currentBooking, // Keep original booking data (has bookingNumber, pricing, etc.)
            ...response.data, // Add any additional details from API
            // Ensure we preserve critical fields from the original booking
            _id: currentBooking._id,
            bookingNumber: currentBooking.bookingNumber,
            status: currentBooking.status,
            pricing: currentBooking.pricing,
            createdAt: currentBooking.createdAt
          };

          console.log('✅ API returned data directly, merged with current booking:', mergedBooking);
          setSelectedBooking(mergedBooking);
        } else {
          console.log('⚠️ API response without proper data structure:', response.data);
        }
      } catch (apiError) {
        console.log('⚠️ API call failed, keeping current booking from list:', apiError.message);
        // Don't show error toast for API failure, just keep the current booking
      }
    } catch (error) {
      console.error('❌ Error in handleViewDetails:', error);
      toast.error('Failed to load booking information');
    }
  };

  const renderBookingCard = (booking) => (
    <div key={booking._id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2.5 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg flex items-center justify-center shadow-md">
            <FaUtensils className="text-white text-xs sm:text-sm" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900">
              {booking.bookingNumber}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md backdrop-blur-sm ${getStatusColor(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </span>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Ultra Compact Info */}
      <div className="space-y-2 mb-3">
        {/* Hotel & Items in One Row */}
        <div className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 rounded-lg p-2 border border-[#67BAE0]/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-[#3B5787] text-xs" />
              <span className="font-semibold text-gray-900 truncate">
                {booking.hotelId?.name || 'Hotel'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 ml-2">
              <FaUtensils className="text-[#67BAE0] text-xs" />
              <span className="whitespace-nowrap">
                {booking.menuItems?.length || booking.items?.length || booking.bookingConfig?.menuItems?.length || 0} items
              </span>
            </div>
          </div>
        </div>

        {/* Schedule in Compact Row */}
        {(booking.schedule?.preferredDate || booking.scheduledDateTime) && (
          <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 border border-gray-200">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <FaCalendarAlt className="text-[#67BAE0] text-xs flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-gray-700 block">{t('restaurant.labels.schedule', 'Schedule')}:</span>
                  <div className="text-gray-600 truncate">
                    {(() => {
                      if (booking.schedule?.preferredDate) {
                        const date = new Date(booking.schedule.preferredDate).toLocaleDateString();
                        const time = booking.schedule.preferredTime || '12:00';
                        return `${date} at ${time}`;
                      } else if (booking.scheduledDateTime) {
                        const date = new Date(booking.scheduledDateTime).toLocaleDateString();
                        const time = new Date(booking.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return `${date} at ${time}`;
                      }
                      return 'Schedule not set';
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Ultra Compact Pricing */}
      {booking.pricing?.total && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-2 mb-2 border border-emerald-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <FaReceipt className="text-emerald-600 text-xs" />
              <span className="text-xs font-semibold text-gray-700">{t('restaurant.labels.totalAmount', 'Total Amount')}:</span>
            </div>
            <span className="text-base font-bold text-emerald-600 bg-white/70 px-2 py-0.5 rounded-md">
              {(() => {
                const total = booking.pricing?.total ||
                             booking.payment?.paidAmount ||
                             booking.payment?.amount ||
                             booking.totalAmount ||
                             booking.amount;
                return total ? formatPriceByLanguage(total, i18n.language) : 'N/A';
              })()}
            </span>
          </div>
        </div>
      )}

      {/* Ultra Compact Action Buttons */}
      <div className="flex gap-1.5 pt-1.5 border-t border-gray-100 mt-2">
        <button
          onClick={() => handleViewDetails(booking._id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20 border border-[#3B5787]/20 hover:border-[#67BAE0]/30 rounded-md font-medium text-xs transition-all duration-200"
        >
          <FaEye />
          <span>Details</span>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center py-12">
            <FaSpinner className="text-4xl text-[#3B5787] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('restaurant.labels.processing', 'Loading...')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-2xl flex items-center justify-center shadow-lg">
                <FaUtensils className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent">
                  {t('restaurant.myBookings', 'My Restaurant Bookings')}
                </h1>
                <p className="text-gray-600 mt-1">{t('restaurant.bookingsSubtitle', 'Manage your restaurant service bookings')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
            <nav className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-600 hover:text-[#3B5787] hover:bg-[#67BAE0]/10'
                  }`}
                >
                  <tab.icon className="text-sm" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {bookings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookings.map(renderBookingCard)}
            </div>

            {/* Pagination */}
            {(totalPages > 1 || totalBookings > itemsPerPage) && (
              <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings} bookings
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20'
                      }`}
                    >
                      <FaChevronLeft className="text-xs" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        const isActive = pageNumber === currentPage;

                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-8 h-8 rounded-lg font-medium text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-md'
                                  : 'text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return <span key={pageNumber} className="px-2 text-gray-400">...</span>;
                        }
                        return null;
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20'
                      }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-[#3B5787]/20 to-[#67BAE0]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaUtensils className="text-[#3B5787] text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('restaurant.noBookings', 'No bookings found')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('restaurant.noBookingsDescription', 'You don\'t have any restaurant bookings yet.')}
            </p>
            <button
              onClick={() => navigate('/hotels')}
              className="px-4 py-2 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white rounded-md hover:shadow-lg transition-all duration-200"
            >
              {t('restaurant.startBooking', 'Start Booking')}
            </button>
          </div>
        )}

        {/* Modern Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
               onClick={(e) => {
                 // Only close if clicking the backdrop, not the modal content
                 if (e.target === e.currentTarget) {
                   console.log('🔒 Modal backdrop clicked, closing modal');
                   setSelectedBooking(null);
                 }
               }}>
            <div className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
                 onClick={(e) => e.stopPropagation()}>
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-xl flex items-center justify-center shadow-md">
                      <FaUtensils className="text-white text-sm" />
                    </div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent">
                      Booking Details
                    </h2>
                  </div>
                  <button
                    onClick={() => {
                      console.log('🔒 Close button clicked');
                      setSelectedBooking(null);
                    }}
                    className="w-10 h-10 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center justify-center transition-all duration-200 hover:scale-105"
                  >
                    <FaTimes className="text-gray-600" />
                  </button>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-md"></div>
                      Booking Information
                    </h3>
                    <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl p-6 space-y-4 border border-[#67BAE0]/20">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Booking Number:</span>
                        <span className="font-bold text-gray-900">{selectedBooking.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Status:</span>
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusLabel(selectedBooking.status)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Total Amount:</span>
                        <span className="text-xl font-bold text-emerald-600">
                          {(() => {
                            // Try multiple potential locations for the total amount
                            const total = selectedBooking.pricing?.total ||
                                         selectedBooking.payment?.paidAmount ||
                                         selectedBooking.payment?.amount ||
                                         selectedBooking.totalAmount ||
                                         selectedBooking.amount;

                            return total ? formatPriceByLanguage(total, i18n.language) : 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  {(() => {
                    const menuItems = selectedBooking.menuItems || selectedBooking.items || selectedBooking.bookingConfig?.menuItems || [];
                    return menuItems.length > 0 && (
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                          <div className="w-5 h-5 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-md"></div>
                          Menu Items
                        </h3>
                        <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl p-6 space-y-4 border border-[#67BAE0]/20">
                          {menuItems.map((item, index) => (
                          <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-4 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg flex items-center justify-center">
                                <FaUtensils className="text-white text-xs" />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-semibold text-gray-900">{item.itemName}</span>
                                  {item.isVegetarian && (
                                    <span className="text-green-600">
                                      <FaLeaf size={12} />
                                    </span>
                                  )}
                                  {item.isVegan && (
                                    <span className="text-green-600 text-xs">V</span>
                                  )}
                                  {item.spicyLevel && item.spicyLevel !== 'mild' && (
                                    <span className="text-red-600">
                                      {getSpicyLevelDisplay(item.spicyLevel)}
                                    </span>
                                  )}
                                </div>
                                {item.description && (
                                  <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                                )}
                                {item.preparationTime && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <FaClock />
                                    {item.preparationTime}min prep time
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 font-medium">Qty: {item.quantity}</div>
                              <div className="text-lg font-bold text-emerald-600">
                                {item.totalPrice ? formatPriceByLanguage(item.totalPrice, i18n.language) :
                                 (item.price ? formatPriceByLanguage(item.price * item.quantity, i18n.language) : 'N/A')}
                              </div>
                            </div>
                          </div>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Schedule Information */}
                  {(selectedBooking.schedule || selectedBooking.scheduledDateTime) && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-md"></div>
                        Schedule
                      </h3>
                      <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl p-6 space-y-4 border border-[#67BAE0]/20">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Date:</span>
                          <span className="font-bold text-gray-900">
                            {(() => {
                              if (selectedBooking.schedule?.preferredDate) {
                                return new Date(selectedBooking.schedule.preferredDate).toLocaleDateString();
                              } else if (selectedBooking.scheduledDateTime) {
                                return new Date(selectedBooking.scheduledDateTime).toLocaleDateString();
                              }
                              return 'Not set';
                            })()}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Time:</span>
                          <span className="font-bold text-gray-900">
                            {(() => {
                              if (selectedBooking.schedule?.preferredTime) {
                                return selectedBooking.schedule.preferredTime;
                              } else if (selectedBooking.scheduledDateTime) {
                                return new Date(selectedBooking.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              }
                              return 'Not set';
                            })()}
                          </span>
                        </div>
                        {selectedBooking.location?.deliveryLocation && (
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700 font-medium">
                              <FaMapMarkerAlt className="inline mr-1" />
                              Delivery Location:
                            </span>
                            <span className="font-bold text-gray-900">{selectedBooking.location.deliveryLocation}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedBooking.guestDetails?.specialRequests && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-md"></div>
                        Special Requests
                      </h3>
                      <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl p-6 border border-[#67BAE0]/20">
                        <p className="text-gray-700">{selectedBooking.guestDetails.specialRequests}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Information */}
                  {selectedBooking.payment?.status === 'completed' && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-emerald-500 to-green-600 rounded-md"></div>
                        Payment Information
                      </h3>
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 space-y-4 border border-emerald-200">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Payment Status:</span>
                          <span className="text-green-600 font-medium">Completed</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Amount Paid:</span>
                          <span className="font-medium">{formatPriceByLanguage(selectedBooking.payment.paidAmount, i18n.language)}</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 font-medium">Payment Date:</span>
                          <span className="font-medium">{new Date(selectedBooking.payment.paymentDate).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-center mt-8 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-8 py-3 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#67BAE0] hover:to-[#3B5787] text-white rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
                  >
                    Close Details
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestRestaurantBookings;
