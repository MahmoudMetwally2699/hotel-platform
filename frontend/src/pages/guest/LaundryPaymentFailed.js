/**
 * Laundry Payment Failed Page
 * Displays error message when laundry payment fails or is cancelled
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaTimesCircle, FaRedo, FaHome, FaTshirt, FaExclamationTriangle, FaMoneyBillWave } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';

const LaundryPaymentFailed = () => {
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
      const response = await apiClient.get(`/client/bookings/${bookingId}`);

      if (response.data.success) {
        setBooking(response.data.data.booking);
      } else {
        setError('Failed to fetch booking details');
      }
    } catch (err) {
      console.error('Error fetching booking details:', err);
      setError('Failed to load booking information');
    } finally {
      setLoading(false);
    }
  };

  const handleRetryPayment = async () => {
    try {
      setRetrying(true);

      // Create new payment session for laundry booking
      const response = await apiClient.post('/payments/kashier/create-session', {
        bookingId: booking._id,
        bookingType: 'laundry'
      });

      if (response.data.success) {
        const { paymentUrl } = response.data.data;
        window.location.href = paymentUrl;
      } else {
        toast.error('Failed to create new payment session');
      }
    } catch (err) {
      console.error('Error retrying payment:', err);
      toast.error('Failed to retry payment. Please try again later.');
    } finally {
      setRetrying(false);
    }
  };

  const handleViewBookings = () => navigate('/guest/bookings');
  const handleGoHome = () => navigate('/');

  const getErrorMessage = () => {
    if (errorMessage) return decodeURIComponent(errorMessage);

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Payment Details</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-y-3">
            <button onClick={handleViewBookings} className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">View My Bookings</button>
            <button onClick={handleGoHome} className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">Go Home</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="text-red-500 mb-4">
            <FaTimesCircle className="text-8xl mx-auto animate-pulse" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Failed</h1>
          <p className="text-xl text-gray-600">{getErrorMessage()}</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          <div className="bg-red-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Booking Pending Payment</h2>
                <p className="text-red-100">Reference: {booking.bookingNumber}</p>
              </div>
              <FaTshirt className="text-4xl text-red-200" />
            </div>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><FaTshirt className="mr-2 text-blue-500" />Order Details</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-gray-900">Items</p>
                    <div className="bg-gray-50 rounded-md p-3 mt-2">
                      {booking.laundryItems?.map((it, idx) => (
                        <div key={idx} className="flex justify-between text-sm py-1">
                          <div>
                            <p className="font-medium">{it.itemName} <span className="text-gray-500">({it.serviceTypeName})</span></p>
                            <p className="text-gray-500 text-xs">Qty: {it.quantity}</p>
                          </div>
                          <div className="text-right font-medium">{formatPriceByLanguage(it.totalPrice || it.price || 0, i18n.language)}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {booking.schedule && (
                    <div>
                      <p className="font-medium text-gray-700">Schedule</p>
                      <div className="bg-gray-50 rounded-md p-3 mt-2 text-sm">
                        <p>Pickup Date: {booking.schedule?.preferredDate}</p>
                        <p>Pickup Time: {booking.schedule?.preferredTime}</p>
                        <p>Pickup Location: {booking.guestDetails?.roomNumber || booking.guestDetails?.pickupLocation || 'N/A'}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><FaMoneyBillWave className="mr-2 text-red-500" />Payment Information</h3>
                <div className="space-y-4">
                  <div className="bg-red-50 rounded-md p-4 text-center">
                    <p className="text-sm text-red-600 font-medium">Amount Due</p>
                    <p className="text-3xl font-bold text-red-700">{formatPriceByLanguage(booking.payment?.totalAmount || booking.pricing?.total || 0, i18n.language)}</p>
                    <p className="text-sm text-red-600">{booking.payment?.currency || 'EGP'}</p>
                  </div>

                  {booking.payment?.paymentDate && (
                    <div>
                      <p className="font-medium text-gray-700">Payment Date</p>
                      <p className="text-gray-600">{new Date(booking.payment.paymentDate).toLocaleString()}</p>
                    </div>
                  )}

                  {booking.payment?.kashier?.transactionId && (
                    <div>
                      <p className="font-medium text-gray-700">Transaction ID</p>
                      <p className="text-gray-600 font-mono text-sm">{booking.payment.kashier.transactionId}</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-lg font-semibold text-yellow-600 text-center">✗ Payment Status: Failed</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
              <button onClick={handleRetryPayment} disabled={retrying} className="flex items-center justify-center px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 text-lg font-medium disabled:opacity-50">
                {retrying ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <FaRedo className="mr-2" /> Try Payment Again
                  </>
                )}
              </button>

              <button onClick={handleViewBookings} className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium"><FaTshirt className="mr-2" />View My Bookings</button>
              <button onClick={handleGoHome} className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-lg font-medium"><FaHome className="mr-2" />Back to Home</button>
            </div>

            <div className="mt-8 text-center text-gray-600">
              <p className="text-sm">Having trouble with payment? Contact our support team at <a href="mailto:support@hotelplatform.com" className="text-blue-600 hover:underline">support@hotelplatform.com</a></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LaundryPaymentFailed;
