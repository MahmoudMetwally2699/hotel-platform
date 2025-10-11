/**
 * Guest Transportation Bookings Page
 * Shows all transportation bookings for the guest including quotes that need to be reviewed
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaEye,
  FaMoneyBillWave,
  FaChevronLeft,
  FaChevronRight
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const GuestTransportationBookings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('payment_pending');
  const [selectedBooking, setSelectedBooking] = useState(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const itemsPerPage = 10;

  // Initialize selectedTab from URL parameter and refresh for new bookings
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      // Map URL tab parameter to internal tab id
      const tabMapping = {
        'waitingForQuote': 'pending_quote',
        'readyForPayment': 'payment_pending',
        'completed': 'completed'
      };
      const mappedTab = tabMapping[tabParam] || 'payment_pending';
      setSelectedTab(mappedTab);
    }
  }, [searchParams]);

  // Special effect to handle new booking refresh
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'waitingForQuote' && selectedTab === 'pending_quote') {
      // Only run this when both conditions are met
      const timeoutId = setTimeout(() => {
        // Force a fresh fetch without showing loading state
        fetchBookings();
      }, 800); // Shorter delay

      return () => clearTimeout(timeoutId);
    }
  }, [selectedTab, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const tabs = [
    { id: 'pending_quote', label: t('transportation.labels.waitingForQuote'), icon: FaClock },
    { id: 'payment_pending', label: t('transportation.labels.readyForPayment'), icon: FaMoneyBillWave },
    { id: 'completed', label: t('transportation.labels.completed'), icon: FaCheck }
  ];

  // Initial data fetch on component mount
  useEffect(() => {
    fetchBookings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Refresh data when returning to this page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        fetchBookings();
      }
    };

    const handleFocus = () => {
      fetchBookings();
    };

    // Listen for page visibility changes (when user switches tabs/apps and comes back)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Listen for window focus (when user clicks back on the window)
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when tab changes
    fetchBookings();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBookings();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transportation-bookings/guest?status=${selectedTab}&page=${currentPage}&limit=${itemsPerPage}`);

      if (response.data.success) {
        setBookings(response.data.data.bookings);



        const pagination = response.data.data.pagination;
        const totalBookingsFromApi = pagination?.total || response.data.data.bookings?.length || 0;

        // Calculate total pages correctly - force calculation if API doesn't provide correct totalPages
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
      console.error('Error fetching bookings:', error);
      toast.error(t('bookings.errors.fetchBookings') || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  }, [selectedTab, currentPage, itemsPerPage, t]);

  const handlePayNow = async (booking) => {

    // For payment_pending status, redirect to payment method selection to complete payment
    const amount = booking.quote?.finalPrice || booking.totalAmount || 0;
    const currency = booking.pricing?.currency || 'USD';

    const paymentUrl = `/payment-method?bookingId=${booking._id}&amount=${amount}&currency=${currency}&serviceType=transportation`;

    // Navigate to payment method selection page with booking details
    navigate(paymentUrl);
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const response = await apiClient.get(`/transportation-bookings/${bookingId}`);
      if (response.data.success) {
        setSelectedBooking(response.data.data.booking);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to fetch booking details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending_quote': 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
      'payment_pending': 'bg-gradient-to-r from-orange-100 to-red-100 text-orange-800 border border-orange-200',
      'payment_completed': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      'completed': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      'cancelled': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200',
      'quote_rejected': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
  };

  const renderBookingCard = (booking) => (
    <div key={booking._id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2.5 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg flex items-center justify-center shadow-md">
            <FaCar className="text-white text-xs sm:text-sm" />
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900">
              {booking.bookingReference}
            </h3>
            <p className="text-xs text-gray-600 font-medium">
              {booking.serviceProvider?.businessName}
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md backdrop-blur-sm ${getStatusColor(booking.bookingStatus)}`}>
            {t(`transportation.status.${booking.bookingStatus}`)}
          </span>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Ultra Compact Info */}
      <div className="space-y-2 mb-3">
        {/* Vehicle Type & Date in One Row */}
        <div className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 rounded-lg p-2 border border-[#67BAE0]/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <FaCar className="text-[#3B5787] text-xs" />
              <span className="font-semibold text-gray-900 truncate">
                {t(`transportation.vehicleTypes.${booking.vehicleDetails?.vehicleType}`)} - {t(`transportation.comfortLevels.${booking.vehicleDetails?.comfortLevel}`)}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 ml-2">
              <FaCalendarAlt className="text-[#67BAE0] text-xs" />
              <span className="whitespace-nowrap">
                {new Date(booking.tripDetails?.scheduledDateTime).toLocaleDateString()} {new Date(booking.tripDetails?.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>

        {/* Pickup & Destination in One Compact Row */}
        <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg p-2 border border-gray-200">
          <div className="flex items-start justify-between gap-2 text-xs">
            <div className="flex items-start gap-1 min-w-0 flex-1">
              <FaMapMarkerAlt className="text-green-600 text-xs mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-700 block">{t('transportation.labels.location')}:</span>
                <div className="text-gray-600 truncate">{booking.tripDetails?.pickupLocation || booking.hotel?.address || booking.hotel?.location || t('transportation.labels.hotelLocation', 'Hotel Location')}</div>
              </div>
            </div>
            <div className="flex items-start gap-1 min-w-0 flex-1">
              <FaMapMarkerAlt className="text-red-500 text-xs mt-0.5 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <span className="font-medium text-gray-700 block">{t('transportation.labels.destination')}:</span>
                <div className="text-gray-600 truncate">{booking.tripDetails?.destination}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ultra Compact Quote */}
      {booking.quote && (
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 rounded-lg p-2 mb-2 border border-emerald-200">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <FaMoneyBillWave className="text-emerald-600 text-xs" />
              <span className="text-xs font-semibold text-gray-700">{t('transportation.labels.quotedPrice')}:</span>
            </div>
            <span className="text-base font-bold text-emerald-600 bg-white/70 px-2 py-0.5 rounded-md">
              {formatPriceByLanguage(booking.quote.finalPrice, i18n.language)}
            </span>
          </div>

          {booking.quote.quoteNotes && (
            <div className="bg-white/50 rounded-lg p-2 mb-2">
              <p className="text-xs text-gray-700 italic">"{booking.quote.quoteNotes}"</p>
            </div>
          )}
        </div>
      )}

      {/* Ultra Compact Action Buttons */}
      <div className="flex gap-1.5 pt-1.5 border-t border-gray-100 mt-2">
        <button
          onClick={() => handleViewDetails(booking._id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20 border border-[#3B5787]/20 hover:border-[#67BAE0]/30 rounded-md font-medium text-xs transition-all duration-200"
        >
          <FaEye />
          <span>{t('common.details', 'Details')}</span>
        </button>

        {/* Show Pay Now button only for payment_pending status (quote ready for payment) */}
        {booking.bookingStatus === 'payment_pending' && (
          <button
            onClick={() => handlePayNow(booking)}
            className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-md font-semibold text-xs shadow-md hover:shadow-lg transition-all duration-200"
          >
            <FaMoneyBillWave />
            <span>{t('common.pay', 'Pay')}</span>
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/10">
      <div className="w-full px-2 sm:px-3 lg:px-4 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-2xl flex items-center justify-center shadow-lg">
                <FaCar className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent">
                  {t('transportation.myBookings')}
                </h1>
                <p className="text-gray-600 mt-1">{t('transportation.bookingsSubtitle')}</p>
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
                  onClick={() => {
                    setSelectedTab(tab.id);
                    // Update URL parameter
                    const urlMapping = {
                      'pending_quote': 'waitingForQuote',
                      'payment_pending': 'readyForPayment',
                      'completed': 'completed'
                    };
                    const urlTab = urlMapping[tab.id] || 'readyForPayment';
                    navigate(`/my-transportation-bookings?tab=${urlTab}`, { replace: true });
                  }}
                  className={`flex-1 py-3 px-2 md:px-4 rounded-xl font-medium text-xs md:text-sm transition-all duration-300 flex items-center justify-center gap-1 md:gap-2 ${
                    selectedTab === tab.id
                      ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-lg'
                      : 'text-gray-600 hover:text-[#3B5787] hover:bg-[#67BAE0]/10'
                  }`}
                >
                  <tab.icon className="text-xs md:text-sm flex-shrink-0" />
                  <span className="hidden md:inline truncate">{tab.label}</span>
                  <span className="md:hidden text-xs truncate">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

      {/* Content */}
      {loading ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
            <div className="relative flex flex-col items-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">My Transportation Bookings</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('transportation.labels.processing')}</p>
            </div>
          </div>
          <div className="w-full px-2 sm:px-3 lg:px-4">
            <div className="flex justify-center items-center h-96">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-[#3B5787] border-t-transparent animate-ping opacity-20"></div>
              </div>
            </div>
          </div>
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
            <FaCar className="text-[#3B5787] text-2xl" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('transportation.noBookings')}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('transportation.noBookingsDescription')}
          </p>
          <button
            onClick={() => navigate('/hotels')}
            className="px-4 py-2 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white rounded-md hover:shadow-lg transition-all duration-200"
          >
            {t('transportation.bookTransportation')}
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('transportation.bookingDetails')} - {selectedBooking.bookingReference}
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-6">
                {/* Trip Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t('transportation.modal.tripInformation')}</h4>
                  <div className="bg-gray-50 rounded-md p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">{t('transportation.modal.vehicle')}:</span>
                        <p className="text-gray-600">
                          {selectedBooking.vehicleDetails?.vehicleType} - {selectedBooking.vehicleDetails?.comfortLevel}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">{t('transportation.modal.passengers')}:</span>
                        <p className="text-gray-600">{selectedBooking.tripDetails?.passengerCount}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">{t('transportation.modal.route')}:</span>
                        <p className="text-gray-600">
                          {selectedBooking.tripDetails?.pickupLocation} → {selectedBooking.tripDetails?.destination}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">{t('transportation.modal.scheduledTime')}:</span>
                        <p className="text-gray-600">
                          {new Date(selectedBooking.tripDetails?.scheduledDateTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote Information */}
                {selectedBooking.quote && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{t('transportation.modal.quoteInformation')}</h4>
                    <div className="bg-blue-50 rounded-md p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">{t('transportation.modal.basePrice')}:</span>
                          <p className="text-gray-700">{formatPriceByLanguage(selectedBooking.quote.basePrice, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.modal.finalPrice')}:</span>
                          <p className="text-lg font-bold text-green-600">{formatPriceByLanguage(selectedBooking.quote.finalPrice, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.modal.quotedAt')}:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.quote.quotedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.modal.expiresAt')}:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.quote.expiresAt).toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedBooking.quote.quoteNotes && (
                        <div>
                          <span className="font-medium">{t('transportation.modal.quoteNotes')}:</span>
                          <p className="text-gray-700 mt-1">{selectedBooking.quote.quoteNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Service Provider Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t('transportation.modal.serviceProvider')}</h4>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="font-medium text-gray-900">{selectedBooking.serviceProvider?.businessName}</p>
                    <p className="text-gray-600">{selectedBooking.serviceProvider?.email}</p>
                    <p className="text-gray-600">{selectedBooking.serviceProvider?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('transportation.modal.close')}
                </button>

                {selectedBooking.bookingStatus === 'payment_pending' && (
                  <button
                    onClick={() => {
                      handlePayNow(selectedBooking._id);
                      setSelectedBooking(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    {t('transportation.modal.payNow')}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaCar className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {t('transportation.info.title')}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>{t('transportation.info.steps.step1')}</li>
                <li>{t('transportation.info.steps.step2')}</li>
                <li>{t('transportation.info.steps.step3')}</li>
                <li>{t('transportation.info.steps.step4')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default GuestTransportationBookings;
