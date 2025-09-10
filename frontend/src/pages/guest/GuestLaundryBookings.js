/**
 * Guest Laundry Bookings Management
 * Shows guest's laundry bookings with payment integration
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
  FaTshirt,
  FaEye,
  FaMoneyBillWave,
  FaTimes,
  FaMapMarkerAlt,
  FaSpinner,
  FaChevronLeft,
  FaChevronRight,
  FaCalendarAlt,
  FaCheck
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const GuestLaundryBookings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Debug timestamp
  console.log('🔄 GuestLaundryBookings component loaded/updated at:', new Date().toISOString());
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedTab, setSelectedTab] = useState('confirmed');

  // Debug selectedBooking changes
  useEffect(() => {
    console.log('🎯 selectedBooking state changed:', selectedBooking);
    if (selectedBooking === null) {
      console.log('🔴 selectedBooking was set to null - modal will close');
      console.trace('Stack trace for selectedBooking null:');
    } else if (selectedBooking) {
      console.log('🟢 selectedBooking was set to:', selectedBooking.bookingNumber);
    }
  }, [selectedBooking]);

  // Add error handler to catch any errors that might close the modal
  useEffect(() => {
    const handleError = (error) => {
      console.error('🔥 Global error caught:', error);
      alert(`🔥 Global error caught: ${error.message || error}\nThis might cause the modal to close unexpectedly.`);
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', (event) => {
      console.error('🔥 Unhandled promise rejection:', event.reason);
      alert(`🔥 Unhandled promise rejection: ${event.reason?.message || event.reason}\nThis might cause the modal to close unexpectedly.`);
    });

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  }, []);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const itemsPerPage = 10;

  const tabs = [
    { id: 'confirmed', label: t('laundry.labels.confirmed', 'Confirmed'), icon: FaCheck },
    { id: 'completed', label: t('laundry.labels.completed', 'Completed'), icon: FaCheck }
  ];

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when tab changes
    fetchBookings();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBookings();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debug effect to track selectedBooking changes
  useEffect(() => {
    if (selectedBooking) {
      console.log('🔄 selectedBooking changed:', selectedBooking.bookingNumber);
    } else {
      console.log('🔄 selectedBooking set to null - modal should close');
      // Log stack trace to see what caused this
      console.trace('selectedBooking set to null');
    }
  }, [selectedBooking]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/client/bookings?category=laundry&status=${selectedTab}&page=${currentPage}&limit=${itemsPerPage}`);

      console.log('🔍 Raw laundry bookings response:', response.data);

      if (response.data.success) {
        const bookingsData = response.data.data.bookings || [];
        console.log('📋 Bookings data:', bookingsData);

        // Log first booking to see structure
        if (bookingsData.length > 0) {
          console.log('🔍 First booking structure:', bookingsData[0]);
          console.log('🔍 Items in first booking:', {
            laundryItems: bookingsData[0].laundryItems,
            items: bookingsData[0].items,
            selectedItems: bookingsData[0].selectedItems,
            bookingItems: bookingsData[0].bookingItems
          });
        }

        setBookings(bookingsData);

        const pagination = response.data.data.pagination;
        const totalBookingsFromApi = pagination?.total || response.data.data.bookings?.length || 0;

        // Calculate total pages correctly
        const calculatedTotalPages = Math.ceil(totalBookingsFromApi / itemsPerPage);
        let totalPagesFromApi = pagination?.totalPages || calculatedTotalPages || 1;

        // Override if API totalPages seems incorrect
        if (totalBookingsFromApi > itemsPerPage && totalPagesFromApi === 1) {
          totalPagesFromApi = calculatedTotalPages;
        }

        setTotalPages(totalPagesFromApi);
        setTotalBookings(totalBookingsFromApi);
      }
    } catch (error) {
      console.error('Error fetching laundry bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (bookingId) => {
    try {
      console.log('🔵 handlePayNow called with bookingId:', bookingId);

      // Create Kashier payment session
      const response = await apiClient.post('/payments/kashier/create-session', {
        bookingId: bookingId,
        bookingType: 'laundry'
      });

      console.log('✅ Payment session response:', response.data);

      if (response.data.success) {
        const { paymentUrl } = response.data.data;
        // Redirect to Kashier payment page
        window.location.href = paymentUrl;
      }
    } catch (error) {
      console.error('❌ Error creating payment session:', error);
      toast.error(error.response?.data?.message || 'Failed to create payment session');
    }
  };

  const handleViewDetails = async (bookingId) => {
    try {
      console.log('🔍 Fetching booking details for ID:', bookingId);

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
          // or the entire response.data might be the booking data
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

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
      'payment_pending': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200',
      'confirmed': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      'in_progress': 'bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] border border-[#67BAE0]/20',
      'completed': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      'cancelled': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': t('common.pending') || 'Pending',
      'payment_pending': 'Payment Pending',
      'confirmed': t('common.confirmed') || 'Confirmed',
      'in_progress': t('common.inProgress') || 'In Progress',
      'completed': t('common.completed') || 'Completed',
      'cancelled': t('common.cancelled') || 'Cancelled'
    };
    return statusLabels[status] || status;
  };

  const renderBookingCard = (booking) => (
    <div key={booking._id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2.5 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg flex items-center justify-center shadow-md">
            <FaTshirt className="text-white text-xs sm:text-sm" />
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
              <FaTshirt className="text-[#67BAE0] text-xs" />
              <span className="whitespace-nowrap">
                {(() => {
                  const itemsCount = booking.bookingConfig?.laundryItems?.length ||
                                   booking.laundryItems?.length ||
                                   booking.items?.length ||
                                   booking.selectedItems?.length ||
                                   booking.bookingDetails?.laundryItems?.length ||
                                   booking.bookingDetails?.items?.length ||
                                   booking.bookingConfig?.menuItems?.length || // From API response structure
                                   (booking.bookingConfig?.quantity > 0 ? booking.bookingConfig.quantity : 0) || // Fallback to quantity if available
                                   0;
                  console.log('📊 Items count for booking:', booking._id, 'Count:', itemsCount, 'Sources:', {
                    bookingConfigLaundryItems: booking.bookingConfig?.laundryItems?.length,
                    bookingConfigMenuItems: booking.bookingConfig?.menuItems?.length,
                    bookingConfigQuantity: booking.bookingConfig?.quantity,
                    laundryItems: booking.laundryItems?.length,
                    items: booking.items?.length,
                    selectedItems: booking.selectedItems?.length,
                    bookingDetailsLaundryItems: booking.bookingDetails?.laundryItems?.length,
                    bookingDetailsItems: booking.bookingDetails?.items?.length
                  });
                  return itemsCount;
                })()} items
              </span>
            </div>
          </div>
        </div>

        {/* Schedule in Compact Row */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 border border-gray-200">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-1 min-w-0 flex-1">
              <FaCalendarAlt className="text-[#67BAE0] text-xs flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-700 block">{t('laundry.labels.schedule', 'Schedule')}:</span>
                <div className="text-gray-600 truncate">
                  {(() => {
                    if (booking.schedule?.preferredDate) {
                      const date = new Date(booking.schedule.preferredDate).toLocaleDateString();
                      const time = booking.schedule.preferredTime || '09:00';
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
      </div>

      {/* Ultra Compact Pricing */}
      {booking.pricing?.total && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-2 mb-2 border border-emerald-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <FaMoneyBillWave className="text-emerald-600 text-xs" />
              <span className="text-xs font-semibold text-gray-700">{t('laundry.labels.totalAmount', 'Total Amount')}:</span>
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

        {/* Show Pay Now button for payment_pending status */}
        {booking.status === 'payment_pending' && (
          <button
            onClick={() => handlePayNow(booking._id)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-md font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200"
          >
            <FaMoneyBillWave />
            <span>Pay</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-2xl flex items-center justify-center shadow-lg">
                <FaTshirt className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent">
                  {t('laundry.myBookings', 'My Laundry Bookings')}
                </h1>
                <p className="text-gray-600 mt-1">{t('laundry.bookingsSubtitle', 'Manage your laundry service bookings')}</p>
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
        {loading ? (
          <div className="text-center py-12">
            <FaSpinner className="text-4xl text-[#3B5787] animate-spin mx-auto mb-4" />
            <p className="text-gray-600">{t('laundry.labels.processing', 'Loading...')}</p>
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {bookings.map(renderBookingCard)}
            </div>

            {/* Pagination */}
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
              {(totalPages > 1 || totalBookings > itemsPerPage) && (
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
                          return (
                            <span key={pageNumber} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
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
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-[#3B5787]/20 to-[#67BAE0]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaTshirt className="text-[#3B5787] text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('laundry.noBookings', 'No bookings found')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('laundry.noBookingsDescription', 'You don\'t have any laundry bookings yet.')}
            </p>
            <button
              onClick={() => navigate('/hotels')}
              className="px-4 py-2 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white rounded-md hover:shadow-lg transition-all duration-200"
            >
              {t('laundry.startBooking', 'Start Booking')}
            </button>
          </div>
        )}

        {/* Modern Booking Details Modal */}
        {selectedBooking && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              // Only close if clicking the backdrop, not the modal content
              if (e.target === e.currentTarget) {
                console.log('🔒 Modal backdrop clicked, closing modal');
                setSelectedBooking(null);
              }
            }}
          >
            <div
              className="bg-white/95 backdrop-blur-md rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-white/20"
              onClick={(e) => {
                // Prevent modal from closing when clicking inside the modal content
                e.stopPropagation();
              }}
            >
              <div className="p-6 sm:p-8">
                {(() => {
                  try {
                    console.log('🎨 Rendering modal content for booking:', selectedBooking?.bookingNumber);
                    return (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-xl flex items-center justify-center shadow-md">
                              <FaTshirt className="text-white text-sm" />
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
                      </>
                    );
                  } catch (error) {
                    console.error('❌ Error rendering modal header:', error);
                    return (
                      <div className="p-4 bg-red-100 border border-red-300 rounded-lg">
                        <p className="text-red-700">Error rendering modal header: {error.message}</p>
                        <button
                          onClick={() => setSelectedBooking(null)}
                          className="mt-2 px-4 py-2 bg-red-600 text-white rounded"
                        >
                          Close
                        </button>
                      </div>
                    );
                  }
                })()}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <div className="w-5 h-5 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-md"></div>
                      Booking Information
                    </h3>
                    <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl p-6 space-y-4 border border-[#67BAE0]/20">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 font-medium">Booking Number:</span>
                        <span className="font-bold text-gray-900">{selectedBooking.bookingNumber || 'N/A'}</span>
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

                            console.log('💰 Total amount sources:', {
                              pricingTotal: selectedBooking.pricing?.total,
                              paymentPaidAmount: selectedBooking.payment?.paidAmount,
                              paymentAmount: selectedBooking.payment?.amount,
                              totalAmount: selectedBooking.totalAmount,
                              amount: selectedBooking.amount,
                              selectedTotal: total
                            });

                            return total ? formatPriceByLanguage(total, i18n.language) : 'N/A';
                          })()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {(() => {
                    let laundryItems = selectedBooking.bookingConfig?.laundryItems ||
                                      selectedBooking.laundryItems ||
                                      selectedBooking.items ||
                                      selectedBooking.selectedItems ||
                                      selectedBooking.bookingDetails?.laundryItems ||
                                      selectedBooking.bookingDetails?.items ||
                                      selectedBooking.bookingConfig?.menuItems ||
                                      [];

                    // Show items section if we have items OR if we have service details (for fallback)
                    return laundryItems.length > 0 || selectedBooking.serviceDetails;
                  })() && (
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <div className="w-5 h-5 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-md"></div>
                        Laundry Items
                      </h3>
                      <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl p-6 space-y-4 border border-[#67BAE0]/20">
                        {(() => {
                          let laundryItems = selectedBooking.bookingConfig?.laundryItems ||
                                            selectedBooking.laundryItems ||
                                            selectedBooking.items ||
                                            selectedBooking.selectedItems ||
                                            selectedBooking.bookingDetails?.laundryItems ||
                                            selectedBooking.bookingDetails?.items ||
                                            selectedBooking.bookingConfig?.menuItems ||
                                            [];

                          // If no traditional items found but we have service details, create a fallback item
                          if (laundryItems.length === 0 && selectedBooking.serviceDetails) {
                            const totalAmount = selectedBooking.pricing?.total ||
                                               selectedBooking.payment?.paidAmount ||
                                               selectedBooking.payment?.amount ||
                                               selectedBooking.totalAmount ||
                                               selectedBooking.amount ||
                                               0;

                            laundryItems = [{
                              itemName: selectedBooking.serviceDetails.name || 'Laundry Service',
                              serviceTypeName: selectedBooking.serviceDetails.category || 'General',
                              quantity: selectedBooking.bookingConfig?.quantity || 1,
                              totalPrice: totalAmount,
                              isFallback: true
                            }];
                          }

                          console.log('🛍️ Modal laundry items:', laundryItems, 'Booking:', selectedBooking);
                          console.log('🛍️ Items analysis:', laundryItems.map(item => ({
                            name: item.itemName,
                            totalPrice: item.totalPrice,
                            price: item.price,
                            amount: item.amount,
                            isFallback: item.isFallback,
                            quantity: item.quantity
                          })));
                          return laundryItems;
                        })().map((item, index) => (
                          <div key={index} className="bg-white/70 backdrop-blur-sm rounded-lg p-4 flex justify-between items-center shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg flex items-center justify-center">
                                <FaTshirt className="text-white text-xs" />
                              </div>
                              <div>
                                <span className="font-semibold text-gray-900">{item.itemName || 'Laundry Service'}</span>
                                <p className="text-sm text-gray-600">({item.serviceTypeName || 'Service'})</p>
                                {item.isFallback && <p className="text-xs text-blue-600 italic">Service Details</p>}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-gray-600 font-medium">Qty: {item.quantity || 1}</div>
                              <div className="text-lg font-bold text-emerald-600">
                                {(() => {
                                  const bookingTotal = selectedBooking.pricing?.total ||
                                                      selectedBooking.payment?.paidAmount ||
                                                      selectedBooking.payment?.amount ||
                                                      selectedBooking.totalAmount ||
                                                      selectedBooking.amount;

                                  // Get all items for this booking
                                  const allItems = selectedBooking.bookingConfig?.laundryItems ||
                                                  selectedBooking.laundryItems ||
                                                  selectedBooking.items || [];

                                  let itemPrice;

                                  // Check if this is a fallback item
                                  if (item.isFallback) {
                                    itemPrice = bookingTotal;
                                  }
                                  // PRIORITY 1: Use actual individual item pricing if available
                                  else if (item.basePrice) {
                                    // Use the base price from laundry booking (individual item price)
                                    itemPrice = item.basePrice * (item.quantity || 1);
                                    console.log(`✅ USING ACTUAL PRICE: ${item.itemName} = ${item.basePrice} × ${item.quantity || 1} = ${itemPrice}`);
                                  }
                                  else if (item.price && item.quantity && item.price !== bookingTotal) {
                                    // Use individual price × quantity if it's not the booking total
                                    itemPrice = item.price * item.quantity;
                                    console.log(`✅ USING ITEM PRICE: ${item.itemName} = ${item.price} × ${item.quantity} = ${itemPrice}`);
                                  }
                                  else if (item.price && item.price !== bookingTotal) {
                                    // Use individual price if it's not the booking total
                                    itemPrice = item.price;
                                    console.log(`✅ USING SINGLE PRICE: ${item.itemName} = ${item.price}`);
                                  }
                                  // FALLBACK: Check if multiple items all have the same price as the total (definitely wrong)
                                  else if (allItems.length > 1) {
                                    // Check if all items have the same totalPrice and it matches the booking total
                                    const allItemsSamePrice = allItems.every(itm =>
                                      itm.totalPrice && Math.abs(itm.totalPrice - bookingTotal) < 0.01
                                    );

                                    if (allItemsSamePrice) {
                                      // All items showing total price - definitely incorrect, divide evenly
                                      itemPrice = bookingTotal / allItems.length;
                                      console.log(`🔧 FALLBACK FIXED: All ${allItems.length} items had same price as total (${bookingTotal}), divided evenly: ${itemPrice}`);
                                    } else {
                                      // Use the item's totalPrice even if it might be wrong
                                      itemPrice = item.totalPrice || bookingTotal / allItems.length;
                                    }
                                  }
                                  // Single item - use its own pricing
                                  else {
                                    itemPrice = item.totalPrice || bookingTotal;
                                  }

                                  // Final fallback
                                  if (!itemPrice && bookingTotal) {
                                    itemPrice = bookingTotal;
                                  }

                                  console.log('💰 Enhanced item price for', item.itemName, ':', {
                                    itemTotalPrice: item.totalPrice,
                                    itemPrice: item.price,
                                    itemQuantity: item.quantity,
                                    itemAmount: item.amount,
                                    bookingTotal: bookingTotal,
                                    allItemsCount: allItems.length,
                                    selectedPrice: itemPrice,
                                    isFallback: item.isFallback,
                                    isSuspiciousPrice: item.totalPrice && Math.abs(item.totalPrice - bookingTotal) < 0.01
                                  });

                                  return itemPrice ? formatPriceByLanguage(itemPrice, i18n.language) : 'N/A';
                                })()}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
                      </div>
                    </div>
                  )}

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

export default GuestLaundryBookings;
