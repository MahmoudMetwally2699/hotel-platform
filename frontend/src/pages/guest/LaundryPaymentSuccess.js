/**
 * Laundry Payment Success Page
 * Displays confirmation when laundry payment is completed successfully
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaReceipt, FaHome, FaTshirt, FaCalendarAlt, FaMapMarkerAlt, FaMoneyBillWave } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';
import { useTranslation } from 'react-i18next';

const LaundryPaymentSuccess = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const bookingId = searchParams.get('booking');

  useEffect(() => {
    if (bookingId) {
      const paymentStatus = searchParams.get('paymentStatus');
      const transactionId = searchParams.get('transactionId');

      if (paymentStatus === 'SUCCESS' && transactionId) {
        updateBookingStatusFromPayment();
      } else {
        fetchBookingDetails();
      }
    } else {
      setError('No booking ID provided');
      setLoading(false);
    }
  }, [bookingId, searchParams]);

  const updateBookingStatusFromPayment = async () => {
    try {
      setLoading(true);

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

      await apiClient.post(`/payments/kashier/confirm-payment-public/${bookingId}`, {
        paymentData
      });

      await fetchBookingDetails();
    } catch (err) {
      console.error('Error confirming payment:', err);
      // still try to fetch booking details
      await fetchBookingDetails();
    }
  };

  const fetchBookingDetails = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/client/bookings/${bookingId}`);

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

  const handleViewBookings = () => navigate('/guest/bookings');
  const handleGoHome = () => navigate('/');

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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Confirmation</h2>
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
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <div className="text-green-500 mb-4">
            <FaCheckCircle className="text-8xl mx-auto animate-bounce" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-xl text-gray-600">Your laundry order has been confirmed</p>
        </div>

        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-8">
          <div className="bg-green-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold mb-1">Order Confirmed</h2>
                <p className="text-green-100">Reference: {booking.bookingNumber}</p>
              </div>
              <FaTshirt className="text-4xl text-green-200" />
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center"><FaMoneyBillWave className="mr-2 text-green-500" />Payment Details</h3>
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-md p-4 text-center">
                    <p className="text-sm text-green-600 font-medium">Amount Paid</p>
                    <p className="text-3xl font-bold text-green-700">{formatPriceByLanguage(booking.payment?.paidAmount || booking.pricing?.total || booking.payment?.totalAmount || 0, i18n.language)}</p>
                    <p className="text-sm text-green-600">{booking.payment?.currency || 'EGP'}</p>
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
                </div>
              </div>
            </div>

            {/* Next Steps */}
            <div className="mt-8 pt-6 border-t">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h3>
              <div className="bg-blue-50 rounded-md p-4">
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>You will receive a confirmation SMS or email shortly</li>
                  <li>The hotel staff will contact you if any clarification is required</li>
                  <li>You can view this order in your laundry bookings history</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button onClick={handleViewBookings} className="flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-lg font-medium"><FaReceipt className="mr-2" />View My Bookings</button>
          <button onClick={handleGoHome} className="flex items-center justify-center px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-lg font-medium"><FaHome className="mr-2" />Back to Home</button>
        </div>

        <div className="mt-8 text-center text-gray-600">
          <p className="text-sm">Need help? Contact our support team at <a href="mailto:support@hotelplatform.com" className="text-blue-600 hover:underline">support@hotelplatform.com</a></p>
        </div>
      </div>
    </div>
  );
};

export default LaundryPaymentSuccess;
