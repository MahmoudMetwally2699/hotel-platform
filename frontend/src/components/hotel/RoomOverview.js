/**
 * Room Overview Component
 * Displays a visual grid of hotel rooms with their service request statuses
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import hotelService from '../../services/hotel.service';
import { useTheme } from '../../context/ThemeContext';
import { selectHotelCurrency } from '../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../utils/currency';

const RoomOverview = () => {
  const { t, i18n } = useTranslation();
  const { theme } = useTheme();
  const currency = useSelector(selectHotelCurrency);
  const [roomData, setRoomData] = useState({ rooms: [], totalRooms: 0, occupiedRooms: 0, roomsWithRequests: 0 });
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDetails, setBookingDetails] = useState([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const titleText = t('hotelAdmin.roomOverview.title');
  const subtitleText = t('hotelAdmin.roomOverview.subtitle');
  const textLooksRtl = /[\u0590-\u05FF\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(
    `${titleText} ${subtitleText}`
  );
  const storedLang =
    typeof window !== 'undefined' && typeof window?.localStorage?.getItem === 'function'
      ? window.localStorage.getItem('i18nextLng')
      : '';
  const resolvedLang =
    (typeof i18n?.resolvedLanguage === 'string' && i18n.resolvedLanguage) ||
    (typeof i18n?.language === 'string' && i18n.language) ||
    (Array.isArray(i18n?.languages) && typeof i18n.languages[0] === 'string' && i18n.languages[0]) ||
    (typeof storedLang === 'string' && storedLang) ||
    '';
  const normalizedLang = String(resolvedLang).toLowerCase();
  const isRtl =
    (typeof document !== 'undefined' && document?.documentElement?.dir === 'rtl') ||
    (typeof document !== 'undefined' && document?.body?.dir === 'rtl') ||
    (typeof i18n?.dir === 'function' && i18n.dir() === 'rtl') ||
    normalizedLang.startsWith('ar') ||
    normalizedLang.startsWith('fa') ||
    normalizedLang.startsWith('he') ||
    normalizedLang.startsWith('ur') ||
    textLooksRtl;

  useEffect(() => {
    fetchRoomStatus();
  }, []);

  const fetchRoomStatus = async () => {
    try {
      setLoading(true);
      const response = await hotelService.getRoomStatusOverview();
      setRoomData(response.data || { rooms: [], totalRooms: 0, occupiedRooms: 0, roomsWithRequests: 0 });
    } catch (error) {
      console.error('Error fetching room status:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatRequestTime = (createdAt) => {
    if (!createdAt) return '';
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // Fetch detailed booking info when room is selected
  const handleRoomClick = async (room) => {
    if (!room.serviceRequests || room.serviceRequests.length === 0) return;

    setSelectedRoom(room);
    setLoadingDetails(true);
    setBookingDetails([]);

    try {
      // Fetch details for each booking
      const detailsPromises = room.serviceRequests.map(async (request) => {
        try {
          // Try regular booking first
          const response = await hotelService.getBookingDetails(request.bookingId);
          return response.data || response;
        } catch (error) {
          // Try transportation booking if regular fails
          try {
            const transportResponse = await hotelService.getTransportationBookingDetails(request.bookingId);
            return transportResponse.data || transportResponse;
          } catch (transportError) {
            console.error('Error fetching booking details:', error);
            return { ...request, error: true };
          }
        }
      });

      const details = await Promise.all(detailsPromises);
      setBookingDetails(details);
    } catch (error) {
      console.error('Error fetching booking details:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // Determine room status and color based on service requests
  const getRoomStatus = (room) => {
    if (!room.serviceRequests || room.serviceRequests.length === 0) {
      return { type: 'no-request', label: t('hotelAdmin.roomOverview.statusLabels.noRequests'), color: 'bg-white text-gray-700' };
    }

    // Check if any service is from external provider
    if (hasExternalProvider(room)) {
      return { type: 'external', label: t('hotelAdmin.roomOverview.statusLabels.external'), color: 'bg-orange-500 text-white' };
    }

    // Get the most recent service request
    const latestRequest = room.serviceRequests[0];

    // Map service types to status categories (Transportation, Laundry, Dining, Housekeeping)
    const statusMap = {
      // Housekeeping subcategories - all green
      'cleaning': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      'maintenance': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      'amenities': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      'housekeeping': { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' },
      // Main services
      'laundry': { type: 'laundry', label: t('hotelAdmin.roomOverview.statusLabels.laundry'), color: 'bg-purple-500 text-white' },
      'dining': { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500 text-white' },
      'restaurant': { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500 text-white' },
      'transportation': { type: 'transportation', label: t('hotelAdmin.roomOverview.statusLabels.transportation'), color: 'bg-gray-700 text-white' }
    };

    return statusMap[latestRequest.type] || { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500 text-white' };
  };

  // Check if room has any external provider service
  const hasExternalProvider = (room) => {
    return room.serviceRequests.some(req => req.isExternal);
  };

  // Extract floor from room number (e.g., "101" -> "1", "205" -> "2")
  const getFloor = (roomNumber) => {
    const match = roomNumber.match(/^(\d+)/);
    if (match && match[1].length >= 2) {
      return match[1][0];
    }
    return '1';
  };

  // Group rooms by floor
  const groupRoomsByFloor = () => {
    const floors = {};
    roomData.rooms.forEach(room => {
      const floor = getFloor(room.roomNumber);
      if (!floors[floor]) {
        floors[floor] = [];
      }
      floors[floor].push(room);
    });

    // Sort rooms within each floor by room number
    Object.keys(floors).forEach(floor => {
      floors[floor].sort((a, b) => {
        const numA = parseInt(a.roomNumber.match(/\d+/)?.[0] || 0);
        const numB = parseInt(b.roomNumber.match(/\d+/)?.[0] || 0);
        return numA - numB;
      });
    });

    return floors;
  };

  // Filter rooms based on selected type
  const getFilteredRooms = () => {
    let filtered = roomData.rooms;

    if (selectedType !== 'all') {
      filtered = filtered.filter(room => {
        const status = getRoomStatus(room);
        return status.type === selectedType;
      });
    }

    return filtered;
  };

  const filteredRooms = getFilteredRooms();

  // Status legend
  const statusLegend = [
    { type: 'no-request', label: t('hotelAdmin.roomOverview.statusLabels.noRequests'), color: 'bg-white border border-gray-300' },
    { type: 'housekeeping', label: t('hotelAdmin.roomOverview.statusLabels.housekeeping'), color: 'bg-green-500' },
    { type: 'laundry', label: t('hotelAdmin.roomOverview.statusLabels.laundry'), color: 'bg-purple-500' },
    { type: 'dining', label: t('hotelAdmin.roomOverview.statusLabels.dining'), color: 'bg-pink-500' },
    { type: 'transportation', label: t('hotelAdmin.roomOverview.statusLabels.transportation'), color: 'bg-gray-700' },
    { type: 'external', label: t('hotelAdmin.roomOverview.statusLabels.external'), color: 'bg-orange-500' }
  ];

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-modern-lightBlue border-t-transparent"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden" dir={isRtl ? 'rtl' : 'ltr'}>
      {/* Header Bar (matches screenshot style) */}
      <div
        className="p-4 sm:p-5 border-b"
        style={{ borderColor: `${theme.primaryColor}55`, backgroundColor: '#fff' }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className={`flex items-center gap-3 ${isRtl ? 'text-right' : 'text-left'}`}>
            <div className="h-10 w-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${theme.primaryColor}12` }}>
              <svg className="w-6 h-6" style={{ color: theme.primaryColor }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-lg sm:text-xl font-bold" style={{ color: theme.primaryColor }}>{titleText}</div>
              <div className="text-sm text-modern-darkGray">{subtitleText}</div>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Type dropdown (existing functionality) */}
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-4 py-2 rounded-full bg-white border text-sm font-semibold text-gray-700 hover:shadow-sm"
              style={{ borderColor: `${theme.primaryColor}55` }}
            >
              <option value="all">{t('hotelAdmin.roomOverview.allTypes')}</option>
              {statusLegend.map(status => (
                <option key={status.type} value={status.type}>{status.label}</option>
              ))}
            </select>

            <button
              type="button"
              onClick={fetchRoomStatus}
              className="px-3 py-2 rounded-full bg-white border hover:shadow-sm transition"
              style={{ borderColor: `${theme.primaryColor}55`, color: theme.primaryColor }}
              title={t('hotelAdmin.roomOverview.refresh')}
              aria-label={t('hotelAdmin.roomOverview.refresh')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Legend row */}
      <div className="px-4 sm:px-5 py-3 border-b border-gray-200">
        <div className={`flex flex-wrap items-center gap-4 ${isRtl ? 'justify-end flex-row-reverse' : 'justify-start'}`}>
          {statusLegend.map(status => (
            <div key={status.type} className="flex items-center gap-2">
              <span className={`inline-block w-2.5 h-2.5 rounded-full ${status.color}`}></span>
              <span className="text-xs font-semibold text-gray-700">{status.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      <div className="p-4 sm:p-5 bg-white">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 font-medium">{t('hotelAdmin.roomOverview.noRoomsFound')}</p>
            <p className="text-gray-400 text-sm mt-1">{t('hotelAdmin.roomOverview.tryAdjustingFilters')}</p>
          </div>
        ) : (
          <div className="bg-gray-200 p-px rounded-lg overflow-hidden">
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-px">
              {filteredRooms.map(room => {
                const status = getRoomStatus(room);
                const hasRequests = room.serviceRequests && room.serviceRequests.length > 0;
                return (
                  <div
                    key={room.roomNumber}
                    className={`relative h-12 sm:h-14 flex items-center justify-center ${status.color} ${hasRequests ? 'cursor-pointer hover:opacity-80 transition-opacity' : 'cursor-default'}`}
                    title={`${t('hotelAdmin.roomOverview.room')} ${room.roomNumber}${room.guestName ? ' - ' + room.guestName : ''}\n${status.label}${room.serviceRequests.length > 0 ? `\n${room.serviceRequests.length} ${t('hotelAdmin.roomOverview.requests')}` : ''}`}
                    onClick={() => hasRequests && handleRoomClick(room)}
                  >
                    <span className="text-sm font-bold">{room.roomNumber}</span>
                    {room.serviceRequests.length > 1 && (
                      <div className="absolute top-1 right-1 bg-red-500 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {room.serviceRequests.length}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRoom && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRoom(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            dir={isRtl ? 'rtl' : 'ltr'}
          >
            {/* Modal Header */}
            <div
              className="p-5 border-b flex items-center justify-between"
              style={{ borderColor: `${theme.primaryColor}30` }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="h-12 w-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  {selectedRoom.roomNumber}
                </div>
                <div>
                  <h3 className="text-lg font-bold" style={{ color: theme.primaryColor }}>
                    {t('hotelAdmin.roomOverview.room')} {selectedRoom.roomNumber}
                  </h3>
                  {selectedRoom.guestName && (
                    <p className="text-sm text-gray-600">{selectedRoom.guestName}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => setSelectedRoom(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body - Service Requests List */}
            <div className="p-5 overflow-y-auto max-h-[70vh]">
              <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                {t('hotelAdmin.roomOverview.serviceRequests')} ({selectedRoom.serviceRequests?.length || 0})
              </h4>

              {loadingDetails ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: `${theme.primaryColor}40`, borderTopColor: 'transparent' }}></div>
                </div>
              ) : bookingDetails.length > 0 ? (
                <div className="space-y-6">
                  {bookingDetails.map((booking, index) => {
                    if (booking.error) {
                      return (
                        <div key={index} className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                          <p className="text-sm text-gray-500">{t('hotelAdmin.roomOverview.errorLoadingDetails')}</p>
                        </div>
                      );
                    }

                    const status = booking.status || booking.bookingStatus || 'pending';
                    const category = booking.serviceDetails?.category || booking.serviceId?.category || booking.serviceType || 'service';
                    const isTransportation = category === 'transportation' || booking.bookingType === 'transportation';

                    // Get guest info
                    const guest = booking.guestId || booking.guestDetails || {};
                    const guestName = `${guest.firstName || ''} ${guest.lastName || ''}`.trim() || guest.name || 'Guest';
                    const guestEmail = guest.email || '';
                    const guestPhone = guest.phone || booking.guestDetails?.phone || '';

                    // Get provider info
                    const provider = booking.serviceProviderId || {};
                    const providerName = provider.businessName || provider.name || 'Hotel Service';

                    // Get amount
                    const amount = booking.pricing?.totalAmount || booking.payment?.totalAmount || booking.totalAmount || booking.finalPrice || 0;
                    const paymentMethod = booking.payment?.method || booking.paymentMethod || 'Cash at Hotel';

                    // Get schedule info
                    const preferredDate = booking.serviceDetails?.preferredDate || booking.schedule?.date || booking.pickupDetails?.date || booking.createdAt;
                    const preferredTime = booking.serviceDetails?.preferredTime || booking.schedule?.time || booking.pickupDetails?.time || '';

                    return (
                      <div key={booking._id || index} className="rounded-xl border border-gray-200 overflow-hidden">
                        {/* Order Information Header */}
                        <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <h5 className="text-sm font-bold text-gray-700 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              {t('hotelAdmin.roomOverview.orderInformation')}
                            </h5>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              status === 'completed' ? 'bg-green-100 text-green-700' :
                              status === 'confirmed' || status === 'quote_accepted' || status === 'payment_completed' ? 'bg-blue-100 text-blue-700' :
                              status === 'pending' || status === 'pending_quote' || status === 'quote_sent' ? 'bg-yellow-100 text-yellow-700' :
                              status === 'cancelled' || status === 'quote_rejected' ? 'bg-red-100 text-red-700' :
                              status === 'in-progress' || status === 'service_active' ? 'bg-indigo-100 text-indigo-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {status}
                            </span>
                          </div>
                        </div>

                        <div className="p-4 space-y-4">
                          {/* Order Info Grid */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500 font-medium">{t('hotelAdmin.roomOverview.orderId')}</p>
                              <p className="text-sm font-bold" style={{ color: theme.primaryColor }}>
                                #{booking.bookingId || booking._id?.slice(-6) || 'N/A'}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">{t('hotelAdmin.roomOverview.date')}</p>
                              <p className="text-sm font-semibold text-gray-800">{formatDate(booking.createdAt)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">{t('hotelAdmin.roomOverview.amount')}</p>
                              <p className="text-sm font-bold text-gray-800">{formatPriceByLanguage(amount, i18n.language, currency)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500 font-medium">{t('hotelAdmin.roomOverview.paymentMethod')}</p>
                              <p className="text-sm font-semibold text-gray-800 capitalize">{paymentMethod}</p>
                            </div>
                          </div>

                          {/* Guest Information */}
                          <div className="pt-4 border-t border-gray-100">
                            <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                              {t('hotelAdmin.roomOverview.guestInformation')}
                            </h6>
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primaryColor }}>
                                {guestName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-800">{guestName}</p>
                                {guestEmail && <p className="text-xs text-gray-500">{guestEmail}</p>}
                                {guestPhone && (
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    {guestPhone}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Service Details */}
                          <div className="pt-4 border-t border-gray-100">
                            <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                              </svg>
                              {t('hotelAdmin.roomOverview.serviceDetails')}
                            </h6>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('hotelAdmin.roomOverview.serviceName')}</span>
                                <span className="text-sm font-semibold text-gray-800 capitalize">
                                  {booking.serviceId?.name || booking.serviceDetails?.serviceName || `${category} Service`}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('hotelAdmin.roomOverview.category')}</span>
                                <span className="text-sm font-semibold text-gray-800 capitalize">{category}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-gray-600">{t('hotelAdmin.roomOverview.provider')}</span>
                                <span className="text-sm font-semibold text-gray-800">{providerName}</span>
                              </div>

                              {/* Laundry specific details */}
                              {category === 'laundry' && booking.serviceDetails?.laundryDetails && (
                                <div className="mt-3 p-3 bg-purple-50 rounded-lg">
                                  <p className="text-xs font-bold text-purple-700 mb-2">{t('hotelAdmin.roomOverview.laundryDetails')}</p>
                                  {booking.serviceDetails.laundryDetails.items?.length > 0 && (
                                    <div className="space-y-1">
                                      <p className="text-xs text-purple-600 font-medium">{t('hotelAdmin.roomOverview.items')}:</p>
                                      {booking.serviceDetails.laundryDetails.items.map((item, idx) => (
                                        <p key={idx} className="text-sm text-purple-800 pl-2">
                                          • {item.name || item.type} {item.quantity && `x${item.quantity}`}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                  {booking.serviceDetails.laundryDetails.serviceType && (
                                    <p className="text-sm text-purple-800 mt-2">
                                      <span className="font-medium">{t('hotelAdmin.roomOverview.serviceType')}:</span> {booking.serviceDetails.laundryDetails.serviceType}
                                    </p>
                                  )}
                                  {booking.serviceDetails.laundryDetails.isExpress && (
                                    <span className="inline-block mt-2 px-2 py-1 bg-purple-200 text-purple-800 text-xs font-bold rounded-full">
                                      ⚡ {t('hotelAdmin.roomOverview.expressService')}
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* Dining/Restaurant specific details */}
                              {(category === 'dining' || category === 'restaurant') && booking.serviceDetails?.diningDetails && (
                                <div className="mt-3 p-3 bg-pink-50 rounded-lg">
                                  <p className="text-xs font-bold text-pink-700 mb-2">{t('hotelAdmin.roomOverview.diningDetails')}</p>
                                  {booking.serviceDetails.diningDetails.items?.length > 0 && (
                                    <div className="space-y-1">
                                      {booking.serviceDetails.diningDetails.items.map((item, idx) => (
                                        <p key={idx} className="text-sm text-pink-800 pl-2">
                                          • {item.name} {item.quantity && `x${item.quantity}`} {item.price && `- £${item.price}`}
                                        </p>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}

                              {/* Housekeeping specific details */}
                              {category === 'housekeeping' && booking.serviceDetails?.housekeepingType && (
                                <div className="mt-3 p-3 bg-green-50 rounded-lg">
                                  <p className="text-xs font-bold text-green-700 mb-2">{t('hotelAdmin.roomOverview.housekeepingDetails')}</p>
                                  <p className="text-sm text-green-800 capitalize">
                                    <span className="font-medium">{t('hotelAdmin.roomOverview.type')}:</span> {booking.serviceDetails.housekeepingType}
                                  </p>
                                </div>
                              )}

                              {/* Transportation specific details */}
                              {isTransportation && (
                                <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                  <p className="text-xs font-bold text-gray-700 mb-2">{t('hotelAdmin.roomOverview.transportationDetails')}</p>
                                  {booking.pickupDetails && (
                                    <>
                                      <p className="text-sm text-gray-800">
                                        <span className="font-medium">{t('hotelAdmin.roomOverview.pickup')}:</span> {booking.pickupDetails.location || booking.pickupDetails.address}
                                      </p>
                                      <p className="text-sm text-gray-800">
                                        <span className="font-medium">{t('hotelAdmin.roomOverview.dropoff')}:</span> {booking.dropoffDetails?.location || booking.dropoffDetails?.address}
                                      </p>
                                    </>
                                  )}
                                  {booking.vehicleType && (
                                    <p className="text-sm text-gray-800 capitalize">
                                      <span className="font-medium">{t('hotelAdmin.roomOverview.vehicle')}:</span> {booking.vehicleType}
                                    </p>
                                  )}
                                </div>
                              )}

                              {/* Special Requests / Notes */}
                              {(booking.serviceDetails?.specialRequests || booking.notes || booking.specialInstructions) && (
                                <div className="mt-3 p-3 bg-yellow-50 rounded-lg border border-yellow-100">
                                  <p className="text-xs font-bold text-yellow-700 mb-1">{t('hotelAdmin.roomOverview.specialRequests')}</p>
                                  <p className="text-sm text-yellow-800 italic">
                                    "{booking.serviceDetails?.specialRequests || booking.notes || booking.specialInstructions}"
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Schedule Information */}
                          {(preferredDate || preferredTime) && (
                            <div className="pt-4 border-t border-gray-100">
                              <h6 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {t('hotelAdmin.roomOverview.scheduleInformation')}
                              </h6>
                              <div className="grid grid-cols-2 gap-4">
                                {preferredDate && (
                                  <div>
                                    <p className="text-xs text-gray-500 font-medium">{t('hotelAdmin.roomOverview.preferredDate')}</p>
                                    <p className="text-sm font-semibold text-gray-800">{formatDate(preferredDate)}</p>
                                  </div>
                                )}
                                {preferredTime && (
                                  <div>
                                    <p className="text-xs text-gray-500 font-medium">{t('hotelAdmin.roomOverview.preferredTime')}</p>
                                    <p className="text-sm font-semibold text-gray-800">{preferredTime}</p>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : selectedRoom.serviceRequests && selectedRoom.serviceRequests.length > 0 ? (
                /* Fallback to basic display if no details fetched */
                <div className="space-y-3">
                  {selectedRoom.serviceRequests.map((request, index) => {
                    const typeColors = {
                      housekeeping: 'bg-green-100 text-green-700 border-green-200',
                      cleaning: 'bg-green-100 text-green-700 border-green-200',
                      laundry: 'bg-purple-100 text-purple-700 border-purple-200',
                      dining: 'bg-pink-100 text-pink-700 border-pink-200',
                      restaurant: 'bg-pink-100 text-pink-700 border-pink-200',
                      transportation: 'bg-gray-100 text-gray-700 border-gray-200',
                    };
                    const colorClass = typeColors[request.type] || 'bg-blue-100 text-blue-700 border-blue-200';

                    return (
                      <div key={request._id || index} className={`p-4 rounded-xl border ${colorClass.split(' ')[0]} ${colorClass.split(' ')[2]}`}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold capitalize ${colorClass}`}>
                            {request.type}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                            request.status === 'completed' ? 'bg-green-100 text-green-700' :
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {request.status || 'pending'}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{formatRequestTime(request.createdAt)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p>{t('hotelAdmin.roomOverview.noRequests')}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedRoom(null)}
                className="w-full py-2.5 px-4 rounded-xl font-semibold text-white transition-colors"
                style={{ backgroundColor: theme.primaryColor }}
              >
                {t('hotelAdmin.roomOverview.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoomOverview;
