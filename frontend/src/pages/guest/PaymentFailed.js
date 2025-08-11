/**
 * Payment Failed Page
 * Displays error message when payment fails or is cancelled
 */

import React, { useState, useEffect } from 'react';
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

  const bookingId = searchParams.get('booking');
  const errorCode = searchParams.get('error');
  const errorMessage = searchParams.get('message');

  useEffect(() => {
    if (bookingId) {
      fetchBookingDetails();
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId]);

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transportation-bookings/${bookingId}`);

      if (response.data.success) {
        setBooking(response.data.data.booking);
      } else {
        setError('Failed to fetch booking details');
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      setError('Failed to load booking information');
    } finally {
      setLoading(false);
    }
  };

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
        toast.error('Failed to create new payment session');
      }
    } catch (error) {
      console.error('Error retrying payment:', error);
      toast.error('Failed to retry payment. Please try again later.');
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
        return 'Payment was cancelled by user';
      case 'timeout':
        return 'Payment session timed out';
      case 'insufficient_funds':
        return 'Insufficient funds in your account';
      case 'card_declined':
        return 'Your card was declined';
      case 'network_error':
        return 'Network error occurred during payment';
      default:
        return 'Payment could not be completed. Please try again.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment information...</p>
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
            Unable to Load Information
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button
              onClick={handleViewBookings}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              View My Bookings
            </button>
            <button
              onClick={handleGoHome}
              className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Error Header */}
        <div className="text-center mb-8">
          <div className="text-red-500 mb-4">
            <FaTimesCircle className="text-8xl mx-auto animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment Failed
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
                <h2 className="text-2xl font-bold mb-1">Booking Pending Payment</h2>
                <p className="text-red-100">Reference: {booking.bookingReference}</p>
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
                  Trip Details
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mr-3 text-green-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">From</p>
                      <p className="text-gray-600">{booking.tripDetails.pickupLocation}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="mr-3 text-red-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">To</p>
                      <p className="text-gray-600">{booking.tripDetails.destination}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <FaCalendarAlt className="mr-3 text-blue-500 mt-1" />
                    <div>
                      <p className="font-medium text-gray-900">Date & Time</p>
                      <p className="text-gray-600">
                        {new Date(booking.tripDetails.scheduledDateTime).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-md p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-medium text-gray-700">Vehicle Type</p>
                        <p className="text-gray-600 capitalize">{booking.vehicleDetails.vehicleType}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Comfort Level</p>
                        <p className="text-gray-600 capitalize">{booking.vehicleDetails.comfortLevel}</p>
                      </div>
                      <div>
                        <p className="font-medium text-gray-700">Passengers</p>
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
                  Payment Information
                </h3>
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-md p-4">
                    <div className="text-center">
                      <p className="text-sm text-red-600 font-medium">Amount Due</p>
                      <p className="text-3xl font-bold text-red-700">
                        {formatPriceByLanguage(booking.payment.totalAmount || booking.quote.finalPrice, i18n.language)}
                      </p>
                      <p className="text-sm text-red-600">{booking.payment.currency || 'EGP'}</p>
                    </div>
                  </div>

                  <div className="bg-orange-50 border border-orange-200 rounded-md p-4">
                    <div className="flex items-start">
                      <FaExclamationTriangle className="text-orange-500 mt-1 mr-3" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">Payment Required</p>
                        <p className="text-sm text-orange-700 mt-1">
                          Your booking is reserved but payment is still required to confirm it.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold text-red-600 text-center">
                      ✗ Payment Status: Failed
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Service Provider Info */}
            {booking.serviceProvider && (
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Service Provider</h3>
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
                      <p className="text-sm text-blue-600">Waiting for payment</p>
                      <p className="text-sm text-blue-600">to confirm booking</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* What Happened */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What Happened?</h3>
              <div className="bg-yellow-50 rounded-md p-4">
                <div className="flex">
                  <FaExclamationTriangle className="text-yellow-400 mr-3 mt-1" />
                  <div>
                    <p className="font-medium text-yellow-800">Payment Issue</p>
                    <p className="text-yellow-700 mt-1">{getErrorMessage()}</p>
                    <p className="text-yellow-700 mt-2 text-sm">
                      Don't worry - your booking is still reserved. You can try paying again or contact support if you need assistance.
                    </p>
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
                Processing...
              </>
            ) : (
              <>
                <FaRedo className="mr-2" />
                Try Payment Again
              </>
            )}
          </button>
          <button
            onClick={handleViewBookings}
            className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-lg font-medium"
          >
            <FaCar className="mr-2" />
            View My Bookings
          </button>
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors text-lg font-medium"
          >
            <FaHome className="mr-2" />
            Back to Home
          </button>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">
            Having trouble with payment? Contact our support team at{' '}
            <a href="mailto:support@hotelplatform.com" className="text-blue-600 hover:underline">
              support@hotelplatform.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailed;
