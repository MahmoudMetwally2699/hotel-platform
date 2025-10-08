/**
 * Payment Failed Page
 * Displays error message when payment fails or is cancelled
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaRedo, FaHome, FaExclamationTriangle } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';
import { useTranslation } from 'react-i18next';

const PaymentFailed = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retrying, setRetrying] = useState(false);

  const bookingId = searchParams.get('booking') || searchParams.get('bookingRef') || searchParams.get('merchantOrderId');
  const errorCode = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  const fetchBookingDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transportation-bookings/${bookingId}`);

      if (response.data.success) {
        setBooking(response.data.data.booking);
      } else {
        setError(t('paymentFailed.failedFetch'));
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError(t('paymentFailed.failedLoad'));
    } finally {
      setLoading(false);
    }
  }, [bookingId, t]);

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError(t('paymentFailed.noBookingId'));
      setLoading(false);
    }
  }, [bookingId, fetchBookingDetails, t]);

  const handleRetryPayment = async () => {
    try {
      setRetrying(true);

      // Create new payment session
      const response = await apiClient.post('/payments/kashier/create-session', {
        bookingId: booking._id
      });

      if (response.data.success) {
        const { paymentUrl } = response.data.data;
        // Redirect to Kashier payment page
        window.location.href = paymentUrl;
      } else {
        toast.error(t('paymentFailed.failedCreateSession'));
      }
    } catch (err) {
      console.error('Error retrying payment:', err);
      toast.error(t('paymentFailed.failedRetry'));
    } finally {
      setRetrying(false);
    }
  };

  const handleViewBookings = () => {
    navigate('/guest/bookings');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  const getErrorMessage = () => {
    if (errorMessage) {
      return decodeURIComponent(errorMessage);
    }

    switch (errorCode) {
      case 'cancelled':
        return t('paymentFailed.errorMessages.cancelled');
      case 'timeout':
        return t('paymentFailed.errorMessages.timeout');
      case 'insufficient_funds':
        return t('paymentFailed.errorMessages.insufficientFunds');
      case 'card_declined':
        return t('paymentFailed.errorMessages.cardDeclined');
      case 'network_error':
        return t('paymentFailed.errorMessages.network');
      default:
        return t('paymentFailed.errorMessages.default');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('paymentFailed.loading')}</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <FaTimesCircle className="text-6xl mx-auto mb-4 opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {t('paymentFailed.unableLoadInformation')}
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleViewBookings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              {t('paymentFailed.viewBookings')}
            </button>
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              {t('paymentFailed.goHome')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
      <div className="w-full px-2 sm:px-3 lg:px-4">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="text-red-500 mb-4">
            <FaTimesCircle className="text-8xl mx-auto animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            {t('paymentFailed.title')}
          </h1>
          <p className="text-xl text-gray-600">
            {getErrorMessage()}
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">{t('paymentFailed.bookingPending')}</h2>
                <p className="text-red-100">{t('paymentFailed.reference', { ref: booking.bookingReference })}</p>
              </div>
              <FaCar className="text-4xl text-red-200" />
            </div>
          </div>

          {/* Booking Information */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Trip Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaCar className="mr-2 text-blue-500" />
                  {t('paymentFailed.tripDetails')}
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mr-3 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{t('paymentFailed.location')}</p>
                      <p className="text-gray-600">{booking.tripDetails.pickupLocation || 'Hotel Location'}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mr-3 text-red-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{t('paymentFailed.to')}</p>
                      <p className="text-gray-600">{booking.tripDetails.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaCalendarAlt className="mr-3 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">{t('paymentFailed.dateTime')}</p>
                      <p className="text-gray-600">{new Date(booking.tripDetails.scheduledDateTime).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">{t('paymentFailed.vehicleType')}</p>
                        <p className="text-gray-600 capitalize">{booking.vehicleDetails.vehicleType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">{t('paymentFailed.comfortLevel')}</p>
                        <p className="text-gray-600 capitalize">{booking.vehicleDetails.comfortLevel}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">{t('paymentFailed.passengers')}</p>
                        <p className="text-gray-600">{booking.tripDetails.passengerCount}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Details */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <FaMoneyBillWave className="mr-2 text-red-500" />
                  {t('paymentFailed.paymentInformation')}
                </h3>
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-md p-4">
                    <div className="text-center">
                      <p className="text-sm text-red-600 font-medium">{t('paymentFailed.amountDue')}</p>
                      <p className="text-3xl font-bold text-red-700">{formatPriceByLanguage(booking.payment.totalAmount || booking.quote.finalPrice, i18n.language)}</p>
                      <p className="text-sm text-red-600">{booking.payment.currency || 'USD'}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-orange-500 mt-1 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">{t('paymentFailed.paymentRequiredTitle')}</p>
                        <p className="text-sm text-orange-700 mt-1">{t('paymentFailed.paymentRequiredDesc')}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold text-red-600 text-center">{t('paymentFailed.paymentStatusFailed')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Provider Info */}
            {booking.serviceProvider && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentFailed.serviceProvider')}</h3>
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
                      <p className="text-sm text-blue-600">{t('paymentFailed.waitingForPayment')}</p>
                      <p className="text-sm text-blue-600">{t('paymentFailed.toConfirmBooking')}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What Happened */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('paymentFailed.whatHappened')}</h3>
              <div className="bg-yellow-50 rounded-md p-4">
                <div className="flex">
                  <FaExclamationTriangle className="text-yellow-400 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-yellow-800">{t('paymentFailed.paymentIssue')}</p>
                    <p className="text-yellow-700 mt-1">{getErrorMessage()}</p>
                    <p className="text-yellow-700 mt-2 text-sm">{t('paymentFailed.stillReserved')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={handleRetryPayment}
            disabled={retrying}
            className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-lg font-medium disabled:opacity-50"
          >
            {retrying ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                {t('paymentFailed.processing')}
              </>
            ) : (
              <>
                <FaRedo className="mr-2" />
                {t('paymentFailed.tryAgain')}
              </>
            )}
          </button>
          <button
            onClick={handleViewBookings}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <FaCar className="mr-2" />
            {t('paymentFailed.viewBookings')}
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-lg font-medium"
          >
            <FaHome className="mr-2" />
            {t('paymentFailed.backToHome')}
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            {t('paymentFailed.needHelp', { email: 'support@hotelplatform.com' })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
