/**
 * Payment Success Page
 * Displays confirmation when payment is completed successfully
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaCheckCircle, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaReceipt, FaHome, FaTshirt, FaUtensils } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';
import FeedbackModal from '../../components/guest/FeedbackModal';

const PaymentSuccess = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  const bookingId = searchParams.get('booking') || searchParams.get('bookingRef') || searchParams.get('merchantOrderId');

  useEffect(() => {
    console.log('🔵 PaymentSuccess initialized with:', {
      bookingId,
      allParams: Object.fromEntries(searchParams.entries()),
      paymentStatus: searchParams.get('paymentStatus'),
      paymentMethod: searchParams.get('paymentMethod'),
      serviceType: searchParams.get('serviceType'),
      transactionId: searchParams.get('transactionId')
    });

    if (bookingId && bookingId !== 'undefined' && bookingId !== 'null') {
      // Check if we have payment success parameters from Kashier
      const paymentStatus = searchParams.get('paymentStatus');
      const transactionId = searchParams.get('transactionId');
      const paymentMethod = searchParams.get('paymentMethod');

      if (paymentStatus === 'SUCCESS' && transactionId) {
        // Update booking status first, then fetch details
        updateBookingStatusFromPayment();
      } else if (paymentMethod === 'cash') {
        // For cash payments, directly fetch booking details
        console.log('🔵 Cash payment detected, fetching booking details directly');
        fetchBookingDetails();
      } else {
        fetchBookingDetails();
      }
    } else {
      console.error('🔴 PaymentSuccess: Invalid booking ID:', bookingId);
      setError(t('paymentSuccess.noBookingId'));
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, searchParams]); // Functions are stable, no need to include them

  const updateBookingStatusFromPayment = useCallback(async () => {
    try {
      setLoading(true);

      // Extract payment details from URL parameters
      const paymentData = {
        paymentStatus: searchParams.get('paymentStatus'),
        transactionId: searchParams.get('transactionId'),
        orderReference: searchParams.get('orderReference'),
        merchantOrderId: searchParams.get('merchantOrderId'),
        amount: parseFloat(searchParams.get('amount')),
        currency: searchParams.get('currency'),
        cardBrand: searchParams.get('cardBrand'),
        maskedCard: searchParams.get('maskedCard'),
        signature: searchParams.get('signature')
      };

      console.log('🔵 Updating booking status with payment data:', paymentData);

      // Call backend to update booking status with payment success
      const response = await apiClient.post(`/payments/kashier/confirm-payment-public/${bookingId}`, {
        paymentData
      });

      if (response.data.success) {
        console.log('✅ Booking status updated successfully');
        // Now fetch the updated booking details
        await fetchBookingDetails();
      } else {
        console.log('⚠️ Failed to update booking status, fetching current details');
        await fetchBookingDetails();
      }
    } catch (error) {
      console.error('❌ Error updating booking status:', error);
      // Still try to fetch booking details even if update fails
      await fetchBookingDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId, searchParams]);

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      let response;
      let bookingType = 'unknown';

      // Check if bookingId looks like a booking number (not MongoDB ObjectId)
      const isBookingNumber = bookingId && (
        bookingId.startsWith('LN') ||  // Laundry booking number
        bookingId.startsWith('BK') ||  // Regular booking number
        bookingId.startsWith('TR') ||  // Transportation booking number
        bookingId.startsWith('RS') ||  // Restaurant booking number
        bookingId.length < 24 ||       // Too short for ObjectId
        !bookingId.match(/^[0-9a-fA-F]{24}$/) // Not a valid ObjectId format
      );

      console.log('🔍 Booking ID analysis:', {
        bookingId,
        isBookingNumber,
        length: bookingId?.length,
        startsWithLN: bookingId?.startsWith('LN'),
        startsWithBK: bookingId?.startsWith('BK')
      });

      // Check if this looks like a temporary merchant order ID (TEMP_ prefix or long alphanumeric)
      const isTempId = bookingId.startsWith('TEMP_') || (bookingId.length > 24 && !bookingId.match(/^[0-9a-fA-F]{24}$/));

      if (isTempId || isBookingNumber) {
        // For temporary IDs or booking numbers, use the merchant order endpoint
        try {
          response = await apiClient.get(`/client/bookings/by-merchant-order/${bookingId}`);
          if (response.data && response.data.success) {
            const bookingData = response.data.data;

            // Determine booking type from multiple indicators
            let detectedType = 'unknown';

            // Priority 1: Check URL serviceType parameter first (most reliable for cash payments)
            const urlServiceType = searchParams.get('serviceType');
            if (urlServiceType && ['laundry', 'transportation', 'restaurant', 'dining'].includes(urlServiceType)) {
              detectedType = urlServiceType === 'dining' ? 'restaurant' : urlServiceType;
              console.log('🎯 Using URL serviceType:', urlServiceType, '-> detectedType:', detectedType);
            }
            // Priority 2: Check booking ID pattern
            else if (bookingId.includes('TEMP_LAUNDRY_')) {
              detectedType = 'laundry';
            } else if (bookingId.includes('TEMP_TRANSPORT_')) {
              detectedType = 'transportation';
            } else if (bookingId.includes('TEMP_RESTAURANT_')) {
              detectedType = 'restaurant';
            }
            // Priority 3: Check data structure - look for laundry items in multiple locations
            else if ((bookingData.bookingConfig?.laundryItems && bookingData.bookingConfig.laundryItems.length > 0) ||
                     (bookingData.laundryItems && bookingData.laundryItems.length > 0)) {
              detectedType = 'laundry';
            } else if (bookingData.pickupLocation || bookingData.dropoffLocation || bookingData.tripDetails) {
              detectedType = 'transportation';
            } else if (bookingData.restaurantDetails || bookingData.tableBooking || bookingData.reservationDetails) {
              detectedType = 'restaurant';
            }
            // Check category field
            else if (bookingData.category) {
              detectedType = bookingData.category;
            }
            // Check service type
            else if (bookingData.serviceId?.category) {
              detectedType = bookingData.serviceId.category;
            }
            // Check serviceDetails category
            else if (bookingData.serviceDetails?.category) {
              detectedType = bookingData.serviceDetails.category;
            }
            // Final fallback - assume transportation if no clear indicators
            else {
              detectedType = 'transportation';
            }

            bookingData.bookingType = detectedType;
            console.log('🔍 Booking type detection:', {
              bookingId,
              detectedType,
              hasLaundryItems: !!(bookingData.bookingConfig?.laundryItems?.length || bookingData.laundryItems?.length),
              hasPickupLocation: !!bookingData.pickupLocation,
              hasTripDetails: !!bookingData.tripDetails,
              category: bookingData.category,
              serviceCategory: bookingData.serviceId?.category,
              serviceDetailsCategory: bookingData.serviceDetails?.category
            });            setBooking(bookingData);
            return;
          } else if (response.status === 202) {
            // Booking is still being processed
            setError(t('paymentSuccess.bookingProcessing'));
            return;
          }
        } catch (err) {
          if (err.response?.status === 202) {
            setError(t('paymentSuccess.bookingProcessing'));
            return;
          }
          console.log('Merchant order/booking number lookup failed:', err.message);
          // For temp IDs or booking numbers, don't fall back to standard endpoints - they will fail
          setError(t('paymentSuccess.unableRetrieve'));
          return;
        }
      }

      // Determine booking type from booking reference for standard lookups
      if (bookingId && bookingId.includes('LAUNDRY')) {
        bookingType = 'laundry';
      } else if (bookingId && bookingId.includes('TRANSPORT')) {
        bookingType = 'transportation';
      } else if (bookingId && bookingId.includes('RESTAURANT')) {
        bookingType = 'restaurant';
      }

      // Try the appropriate endpoint first based on booking type
      if (bookingType === 'laundry') {
        try {
          response = await apiClient.get(`/client/bookings/${bookingId}`);
          if (response.data && response.data.success) {
            setBooking({ ...response.data.data.booking, bookingType: 'laundry' });
            return;
          }
        } catch (err) {
          console.log('Laundry booking not found, trying transportation...');
        }
      }

      // Try transportation booking
      try {
        response = await apiClient.get(`/transportation-bookings/${bookingId}`);
        if (response.data && response.data.success) {
          setBooking({ ...response.data.data.booking, bookingType: 'transportation' });
          return;
        }
      } catch (err) {
        console.log('Transportation booking not found, trying laundry...');
      }

      // If transportation failed, try laundry booking
      try {
        const laundryResponse = await apiClient.get(`/client/bookings/${bookingId}`);
        if (laundryResponse.data && laundryResponse.data.success) {
          setBooking({ ...laundryResponse.data.data.booking, bookingType: 'laundry' });
          return;
        }
      } catch (err) {
        console.log('Laundry booking also not found');
      }

      setError(t('paymentSuccess.failedFetch'));
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError(t('paymentSuccess.failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, searchParams, t]);

  const handleViewBookings = () => {
    navigate('/guest/bookings');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const handleFeedbackSubmitted = (feedbackData) => {
    setFeedbackSubmitted(true);
    console.log('Feedback submitted:', feedbackData);
  };

  // Auto-show feedback modal after booking is loaded and payment is confirmed
  useEffect(() => {
    if (booking && !feedbackSubmitted && !showFeedbackModal) {
      // Check if this is a cash payment from URL params
      const paymentMethod = searchParams.get('paymentMethod');
      const isCashPayment = paymentMethod === 'cash' || booking.payment?.paymentMethod === 'cash';

      // Check if payment is completed/confirmed OR if it's a cash payment
      const isPaymentCompleted =
        ['completed', 'confirmed'].includes(booking.status) ||
        ['paid', 'completed'].includes(booking.payment?.status) ||
        isCashPayment; // Cash payments should always show feedback

      console.log('🔍 Feedback Modal Check:', {
        bookingId: booking._id || booking.bookingNumber,
        bookingStatus: booking.status,
        paymentStatus: booking.payment?.status,
        paymentMethod: booking.payment?.paymentMethod,
        urlPaymentMethod: paymentMethod,
        isCashPayment,
        isPaymentCompleted,
        showFeedbackModal,
        feedbackSubmitted
      });

      if (isPaymentCompleted) {
        // Show feedback modal after a short delay for better UX
        const timer = setTimeout(() => {
          setShowFeedbackModal(true);
        }, 2000);

        return () => clearTimeout(timer);
      }
    }
  }, [booking, feedbackSubmitted, showFeedbackModal, searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('paymentSuccess.loading')}</p>
          <p className="text-xs text-gray-400 mt-2">Booking ID: {bookingId}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    console.log('❌ PaymentSuccess Error State:', { error, booking, bookingId });
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <FaCheckCircle className="text-6xl mx-auto mb-4 opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('paymentSuccess.unableLoadConfirmation')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleViewBookings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('paymentSuccess.viewBookings')}
            </button>
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('paymentSuccess.goHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Debug log when booking is successfully loaded
  console.log('✅ PaymentSuccess Rendering with booking:', {
    bookingId,
    bookingType: booking?.bookingType,
    hasLaundryItems: !!(booking?.bookingConfig?.laundryItems?.length || booking?.laundryItems?.length),
    laundryItemsCount: booking?.bookingConfig?.laundryItems?.length || booking?.laundryItems?.length || 0,
    hasPickupLocation: !!booking?.pickupLocation,
    hasTripDetails: !!booking?.tripDetails,
    category: booking?.category,
    serviceCategory: booking?.serviceId?.category,
    serviceDetailsCategory: booking?.serviceDetails?.category,
    bookingStructure: Object.keys(booking || {}),
    bookingConfigStructure: booking?.bookingConfig ? Object.keys(booking.bookingConfig) : []
  });

  // Additional debug for restaurant bookings
  if (booking?.bookingType === 'restaurant') {
    console.log('🍽️ Restaurant booking debug:', {
      fullBooking: booking,
      reservationDetails: booking.reservationDetails,
      bookingConfig: booking.bookingConfig,
      guestDetails: booking.guestDetails,
      serviceDetails: booking.serviceDetails,
      schedule: booking.schedule,
      pricing: booking.pricing,
      bookingDate: booking.bookingDate,
      bookingTime: booking.bookingTime,
      guestCount: booking.guestCount,
      numberOfGuests: booking.numberOfGuests,
      partySize: booking.partySize,
      tablePreference: booking.tablePreference,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime
    });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="w-full px-2 sm:px-3 lg:px-4">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-green-500 mb-4">
            <FaCheckCircle className="text-8xl mx-auto animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('paymentSuccess.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {booking.bookingType === 'laundry'
              ? t('paymentSuccess.laundryConfirmed')
              : booking.bookingType === 'restaurant'
              ? t('paymentSuccess.restaurantConfirmed', 'Your restaurant reservation has been confirmed!')
              : t('paymentSuccess.transportConfirmed')}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">
                  {booking.bookingType === 'laundry'
                    ? t('paymentSuccess.orderConfirmed')
                    : booking.bookingType === 'restaurant'
                    ? t('paymentSuccess.reservationConfirmed', 'Reservation Confirmed')
                    : t('paymentSuccess.bookingConfirmed')}
                </h2>
                <p className="text-green-100">
                  {t('paymentSuccess.reference', { ref: booking.bookingNumber || booking.bookingReference })}
                </p>
              </div>
              {booking.bookingType === 'laundry' ? (
                <FaTshirt className="text-4xl text-green-200" />
              ) : booking.bookingType === 'restaurant' ? (
                <FaUtensils className="text-4xl text-green-200" />
              ) : (
                <FaCar className="text-4xl text-green-200" />
              )}
            </div>
          </div>

          {/* Booking Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Order/Trip Details - Conditional Rendering */}
              <div>
                {booking.bookingType === 'laundry' ? (
                  // Laundry Order Details
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaTshirt className="mr-2 text-blue-500" />
                      {t('paymentSuccess.orderDetails')}
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <p className="font-medium text-gray-900">{t('paymentSuccess.items')}</p>
                        <div className="bg-gray-50 rounded-md p-3 mt-2">
                          {/* Debug info - remove after fixing */}
                          {console.log('🔍 Laundry items debug:', {
                            laundryItems: booking.laundryItems,
                            bookingConfigLaundryItems: booking.bookingConfig?.laundryItems,
                            items: booking.items,
                            allBookingKeys: Object.keys(booking),
                            bookingConfig: booking.bookingConfig
                          })}

                          {/* Try multiple possible field names for laundry items */}
                          {(() => {
                            const laundryItems = booking.bookingConfig?.laundryItems || booking.laundryItems || booking.items || [];

                            if (laundryItems.length > 0) {
                              return laundryItems.map((item, idx) => (
                                <div key={idx} className="flex justify-between text-sm py-1">
                                  <div>
                                    <p className="font-medium">
                                      {item.itemName || item.name || item.serviceName || 'Unknown Item'}
                                      <span className="text-gray-500">
                                        ({item.serviceType?.name || item.serviceTypeName || item.serviceType || item.type || 'Standard'})
                                      </span>
                                    </p>
                                    <p className="text-gray-500 text-xs">
                                      {t('paymentSuccess.quantity')}: {item.quantity || 1}
                                    </p>
                                  </div>
                                  <div className="text-right font-medium">
                                    {formatPriceByLanguage(item.finalPrice || item.totalPrice || item.price || item.amount || 0, 'en')}
                                  </div>
                                </div>
                              ));
                            } else {
                              return (
                                <div className="text-gray-500 text-sm">
                                  <p>No items found in booking data</p>
                                  <p className="text-xs mt-1">Available fields: {Object.keys(booking).join(', ')}</p>
                                  {booking.bookingConfig && (
                                    <p className="text-xs mt-1">BookingConfig fields: {Object.keys(booking.bookingConfig).join(', ')}</p>
                                  )}
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>

                      {(booking.schedule || booking.scheduledDate || booking.pickupDetails) && (
                        <div>
                          <p className="font-medium text-gray-700">{t('paymentSuccess.schedule')}</p>
                          <div className="bg-gray-50 rounded-md p-3 mt-2 text-sm">
                            <p>{t('paymentSuccess.pickupDate')}: {
                              booking.schedule?.preferredDate ||
                              booking.scheduledDate ||
                              booking.pickupDetails?.date ||
                              t('paymentSuccess.notAvailable')
                            }</p>
                            <p>{t('paymentSuccess.pickupTime')}: {
                              booking.schedule?.preferredTime ||
                              booking.scheduledTime ||
                              booking.pickupDetails?.time ||
                              t('paymentSuccess.notAvailable')
                            }</p>
                            <p>{t('paymentSuccess.pickupLocation')}: {
                              booking.location?.pickup?.address ||
                              booking.location?.pickupLocation ||
                              booking.pickupLocation ||
                              booking.guestDetails?.pickupLocation ||
                              booking.guestDetails?.roomNumber ||
                              t('paymentSuccess.notAvailable')
                            }</p>
                            {booking.location?.delivery?.address && booking.location.delivery.address !== booking.location.pickup?.address && (
                              <p>{t('paymentSuccess.deliveryLocation', 'Delivery Location')}: {booking.location.delivery.address}</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                ) : booking.bookingType === 'restaurant' ? (
                  // Restaurant Reservation Details
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaUtensils className="mr-2 text-blue-500" />
                      {t('paymentSuccess.reservationDetails', 'Reservation Details')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <FaCalendarAlt className="mr-3 text-blue-500 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">{t('paymentSuccess.dateTime', 'Date & Time')}</p>
                          <p className="text-gray-600">
                            {(() => {
                              // Try multiple possible field names for date
                              const date = booking.reservationDetails?.date ||
                                           booking.bookingDate ||
                                           booking.scheduledDate ||
                                           booking.schedule?.preferredDate ||
                                           booking.bookingConfig?.date ||
                                           booking.bookingConfig?.scheduledDate;

                              // Try multiple possible field names for time
                              const time = booking.reservationDetails?.time ||
                                           booking.bookingTime ||
                                           booking.scheduledTime ||
                                           booking.schedule?.preferredTime ||
                                           booking.bookingConfig?.time ||
                                           booking.bookingConfig?.scheduledTime;

                              if (date && time) {
                                // Format the date properly if it's an ISO string
                                const formattedDate = date.includes('T') ? new Date(date).toLocaleDateString() : date;
                                return `${formattedDate} at ${time}`;
                              } else if (date) {
                                const formattedDate = date.includes('T') ? new Date(date).toLocaleDateString() : date;
                                return formattedDate;
                              } else if (time) {
                                return `Time: ${time}`;
                              } else {
                                return t('paymentSuccess.notAvailable');
                              }
                            })()}
                          </p>
                        </div>
                      </div>

                      {(booking.guestDetails?.specialRequests || booking.location?.deliveryInstructions) && (
                        <div className="bg-gray-50 rounded-md p-4">
                          <p className="font-medium text-gray-700">{t('paymentSuccess.specialRequests', 'Special Requests')}</p>
                          <p className="text-gray-600">
                            {booking.guestDetails?.specialRequests || booking.location?.deliveryInstructions}
                          </p>
                        </div>
                      )}

                      {/* Ordered Items */}
                      {(booking.bookingConfig?.menuItems && booking.bookingConfig.menuItems.length > 0) && (
                        <div>
                          <p className="font-medium text-gray-700 mb-2">{t('paymentSuccess.orderedItems', 'Ordered Items')}</p>
                          <div className="bg-gray-50 rounded-md p-3 space-y-2">
                            {booking.bookingConfig.menuItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <div>
                                  <p className="font-medium">{item.name || item.itemName || 'Menu Item'}</p>
                                  <p className="text-gray-500 text-xs">
                                    {t('paymentSuccess.quantity')}: {item.quantity || 1}
                                  </p>
                                </div>
                                <div className="text-right font-medium">
                                  {formatPriceByLanguage(item.totalPrice || item.price || 0, 'en')}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {booking.restaurantDetails && (
                        <div className="bg-blue-50 rounded-md p-3">
                          <h4 className="font-medium text-blue-900 mb-2">{t('paymentSuccess.restaurantInfo', 'Restaurant Information')}</h4>
                          <p className="text-blue-800">{booking.restaurantDetails.name}</p>
                          {booking.restaurantDetails.cuisine && (
                            <p className="text-blue-700 text-sm">{booking.restaurantDetails.cuisine} cuisine</p>
                          )}
                          {booking.restaurantDetails.location && (
                            <p className="text-blue-700 text-sm">{booking.restaurantDetails.location}</p>
                          )}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  // Transportation Trip Details
                  <>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                      <FaCar className="mr-2 text-blue-500" />
                      {t('paymentSuccess.tripDetails')}
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="mr-3 text-green-500 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">{t('paymentSuccess.location')}</p>
                          <p className="text-gray-600">{booking.tripDetails?.pickupLocation || 'Hotel Location'}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <FaMapMarkerAlt className="mr-3 text-red-500 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">{t('paymentSuccess.to')}</p>
                          <p className="text-gray-600">{booking.tripDetails?.destination}</p>
                        </div>
                      </div>
                      <div className="flex items-start">
                        <FaCalendarAlt className="mr-3 text-blue-500 mt-1" />
                        <div>
                          <p className="font-medium text-gray-900">{t('paymentSuccess.dateTime')}</p>
                          <p className="text-gray-600">
                            {booking.tripDetails?.scheduledDateTime && new Date(booking.tripDetails.scheduledDateTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-md p-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium text-gray-700">{t('paymentSuccess.vehicleType')}</p>
                            <p className="text-gray-600 capitalize">{booking.vehicleDetails?.vehicleType}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{t('paymentSuccess.comfortLevel')}</p>
                            <p className="text-gray-600 capitalize">{booking.vehicleDetails?.comfortLevel}</p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-700">{t('paymentSuccess.passengers')}</p>
                            <p className="text-gray-600">{booking.tripDetails?.passengerCount}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-green-500" />
                  {t('paymentSuccess.paymentDetails')}
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-md p-4">
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">{t('paymentSuccess.amountPaid')}</p>
                      <p className="text-3xl font-bold text-green-700">
                        {formatPriceByLanguage(
                          booking.payment?.paidAmount ||
                          booking.payment?.totalAmount ||
                          booking.pricing?.total ||
                          0,
                          'en'
                        )}
                      </p>
                      <p className="text-sm text-green-600">{booking.payment?.currency || 'USD'}</p>
                    </div>
                  </div>

                  {booking.payment.paymentDate && (
                    <div>
                      <p className="font-medium text-gray-700">{t('paymentSuccess.paymentDate')}</p>
                      <p className="text-gray-600">
                        {new Date(booking.payment.paymentDate).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {booking.payment.kashier?.transactionId && (
                    <div>
                      <p className="font-medium text-gray-700">{t('paymentSuccess.transactionId')}</p>
                      <p className="text-gray-600 font-mono text-sm">
                        {booking.payment.kashier.transactionId}
                      </p>
                    </div>
                  )}

                  {booking.payment.method && (
                    <div>
                      <p className="font-medium text-gray-700">{t('paymentSuccess.paymentMethod')}</p>
                      <p className="text-gray-600 capitalize">{booking.payment.method}</p>
                    </div>
                  )}

                  {booking.payment.kashier?.cardInfo && (
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="font-medium text-gray-700 mb-2">{t('paymentSuccess.cardDetails')}</p>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          {booking.payment.kashier.cardInfo.cardBrand} {t('paymentSuccess.endingIn')} {booking.payment.kashier.cardInfo.maskedCard?.slice(-4)}
                        </p>
                        {booking.payment.kashier.cardInfo.cardHolderName && (
                          <p className="text-gray-600">
                            {booking.payment.kashier.cardInfo.cardHolderName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold text-green-600 text-center">
                      {t('paymentSuccess.paymentStatusCompleted')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Provider Info */}
            {booking.serviceProvider && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentSuccess.serviceProvider')}</h3>
                <div className="bg-blue-50 rounded-md p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-blue-900">{booking.serviceProvider.businessName}</p>
                      <p className="text-blue-700">{booking.serviceProvider.email}</p>
                      {booking.serviceProvider.phone && (
                        <p className="text-blue-700">{booking.serviceProvider.phone}</p>
                      )}
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-blue-600">{t('paymentSuccess.willContact')}</p>
                      <p className="text-sm text-blue-600">{t('paymentSuccess.withDriverDetails')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentSuccess.whatsNext')}</h3>
              <div className="bg-blue-50 rounded-md p-4">
                {booking.bookingType === 'laundry' ? (
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextLaundry.smsEmail')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextLaundry.hotelContact')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextLaundry.viewHistory')}
                    </li>
                  </ul>
                ) : booking.bookingType === 'restaurant' ? (
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextRestaurant.confirmationEmail', 'You will receive a confirmation email shortly')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextRestaurant.restaurantContact', 'The restaurant will contact you if needed')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextRestaurant.viewReservations', 'You can view this reservation in your booking history')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextRestaurant.arriveOnTime', 'Please arrive on time for your reservation')}
                    </li>
                  </ul>
                ) : (
                  <ul className="space-y-2 text-sm text-blue-800">
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextTransport.email')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextTransport.providerContact')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextTransport.viewBookings')}
                    </li>
                    <li className="flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                      {t('paymentSuccess.nextTransport.beReady')}
                    </li>
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleViewBookings}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <FaReceipt className="mr-2" />
            {t('paymentSuccess.viewBookings')}
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-lg font-medium"
          >
            <FaHome className="mr-2" />
            {booking.bookingType === 'laundry'
              ? t('paymentSuccess.exploreMoreServices')
              : booking.bookingType === 'restaurant'
              ? t('paymentSuccess.makeAnotherReservation', 'Make Another Reservation')
              : t('paymentSuccess.bookAnotherTrip')}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            {t('paymentSuccess.needHelp', { email: 'support@hotelplatform.com' })}
          </p>
        </div>

        {/* Feedback Modal */}
        <FeedbackModal
          isOpen={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          booking={booking}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      </div>
    </div>
  );
};

export default PaymentSuccess;
