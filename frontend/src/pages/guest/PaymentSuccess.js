/**
 * Payment Success Page
 * Displays confirmation when payment is completed successfully
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaCar, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave, FaReceipt, FaHome } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';
import { useTranslation } from 'react-i18next';

const PaymentSuccess = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bookingId = searchParams.get('booking');

  useEffect(() => {
    if (bookingId) {
      // Check if we have payment success parameters from Kashier
      const paymentStatus = searchParams.get('paymentStatus');
      const transactionId = searchParams.get('transactionId');
      
      if (paymentStatus === 'SUCCESS' && transactionId) {
        // Update booking status first, then fetch details
        updateBookingStatusFromPayment();
      } else {
        fetchBookingDetails();
      }
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId, searchParams]); // Add searchParams to dependencies

  const updateBookingStatusFromPayment = async () => {
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
  };

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

  const handleViewBookings = () => {
    navigate('/guest/bookings');
  };

  const handleGoHome = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment confirmation...</p>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-red-500 mb-4">
            <FaCheckCircle className="text-6xl mx-auto mb-4 opacity-50" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Unable to Load Confirmation
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-8">
          <div className="text-green-500 mb-4">
            <FaCheckCircle className="text-8xl mx-auto animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Payment Successful!
          </h1>
          <p className="text-xl text-gray-600">
            Your transportation booking has been confirmed
          </p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          {/* Header */}
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Booking Confirmed</h2>
                <p className="text-green-100">Reference: {booking.bookingReference}</p>
              </div>
              <FaCar className="text-4xl text-green-200" />
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
                  <FaMoneyBillWave className="mr-2 text-green-500" />
                  Payment Details
                </h3>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-md p-4">
                    <div className="text-center">
                      <p className="text-sm text-green-600 font-medium">Amount Paid</p>
                      <p className="text-3xl font-bold text-green-700">
                        {formatPriceByLanguage(booking.payment.paidAmount || booking.payment.totalAmount, i18n.language)}
                      </p>
                      <p className="text-sm text-green-600">{booking.payment.currency}</p>
                    </div>
                  </div>

                  {booking.payment.paymentDate && (
                    <div>
                      <p className="font-medium text-gray-700">Payment Date</p>
                      <p className="text-gray-600">
                        {new Date(booking.payment.paymentDate).toLocaleString()}
                      </p>
                    </div>
                  )}

                  {booking.payment.kashier?.transactionId && (
                    <div>
                      <p className="font-medium text-gray-700">Transaction ID</p>
                      <p className="text-gray-600 font-mono text-sm">
                        {booking.payment.kashier.transactionId}
                      </p>
                    </div>
                  )}

                  {booking.payment.method && (
                    <div>
                      <p className="font-medium text-gray-700">Payment Method</p>
                      <p className="text-gray-600 capitalize">{booking.payment.method}</p>
                    </div>
                  )}

                  {booking.payment.kashier?.cardInfo && (
                    <div className="bg-gray-50 rounded-md p-3">
                      <p className="font-medium text-gray-700 mb-2">Card Details</p>
                      <div className="text-sm space-y-1">
                        <p className="text-gray-600">
                          {booking.payment.kashier.cardInfo.cardBrand} ending in {booking.payment.kashier.cardInfo.maskedCard?.slice(-4)}
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
                      ✓ Payment Status: Completed
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
                      <p className="text-sm text-blue-600">They will contact you soon</p>
                      <p className="text-sm text-blue-600">with driver details</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Next Steps */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="bg-blue-50 rounded-md p-4">
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    You will receive a confirmation email shortly
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    The service provider will contact you with driver details
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    You can view this booking in your booking history
                  </li>
                  <li className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                    Be ready at your pickup location 10 minutes before the scheduled time
                  </li>
                </ul>
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
            Need help? Contact our support team at{' '}
            <a href="mailto:support@hotelplatform.com" className="text-blue-600 hover:underline">
              support@hotelplatform.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;
