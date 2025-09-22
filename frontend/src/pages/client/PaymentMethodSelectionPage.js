/**
 * Payment Method Selection Page
 * Standalone page for payment method selection before checkout
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaArrowLeft,
  FaSpinner,
  FaShieldAlt,
  FaCreditCard,
  FaMoneyBillWave
} from 'react-icons/fa';
import PaymentMethodSelection from '../../components/client/PaymentMethodSelection';
import apiClient from '../../services/api.service';

const PaymentMethodSelectionPage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [paymentMethod, setPaymentMethod] = useState('online');
  const [loading, setLoading] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  // Get booking data from URL params or localStorage
  const bookingId = searchParams.get('bookingId');
  const amount = searchParams.get('amount');
  const currency = searchParams.get('currency') || 'EGP';
  const serviceType = searchParams.get('serviceType') || 'regular';

  console.log('🔄 PaymentMethodSelectionPage - URL params:', {
    bookingId,
    amount,
    currency,
    serviceType
  });

  useEffect(() => {
    // Try to get booking data from localStorage if not in URL
    const savedBookingData = localStorage.getItem('pendingBookingData');
    if (savedBookingData) {
      try {
        const data = JSON.parse(savedBookingData);
        setBookingData(data);
      } catch (error) {
        console.error('Error parsing booking data:', error);
      }
    }
  }, []);

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  const handleProceedToPayment = async () => {
    if (!paymentMethod) {
      toast.error(t('payment.selectMethodFirst', 'Please select a payment method'));
      return;
    }

    setProcessingPayment(true);

    try {
      if (paymentMethod === 'online') {
        // Proceed to online payment (Kashier.io)
        await handleOnlinePayment();
      } else {
        // Process cash payment booking
        await handleCashPayment();
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      toast.error(t('payment.processingError', 'Error processing payment. Please try again.'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleOnlinePayment = async () => {
    try {
      let paymentData;

      if (bookingId) {
        // Create payment session for existing booking
        const response = await apiClient.post('/payments/kashier/create-session', {
          bookingId,
          bookingType: serviceType
        });
        paymentData = response.data;
      } else if (bookingData) {
        // Create payment session with booking data
        const response = await apiClient.post('/payments/kashier/create-payment-session', {
          bookingData: { ...bookingData, paymentMethod: 'online' },
          bookingType: serviceType,
          amount: amount || bookingData.totalAmount,
          currency
        });
        paymentData = response.data;
      } else {
        throw new Error('No booking data available');
      }

      if (paymentData.success) {
        // Redirect to Kashier payment page
        window.location.href = paymentData.data.paymentUrl;
      } else {
        throw new Error(paymentData.message || 'Failed to create payment session');
      }
    } catch (error) {
      console.error('Online payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to process online payment');
    }
  };

  const handleCashPayment = async () => {
    try {
      if (bookingId) {
        // Update existing booking to cash payment
        const urlServiceType = searchParams.get('serviceType');
        console.log('🔄 PaymentMethodSelectionPage - serviceType from URL:', urlServiceType);
        const endpoint = urlServiceType === 'transportation'
          ? `/transportation-bookings/${bookingId}/payment-method`
          : `/client/bookings/${bookingId}/payment-method`;

        console.log('🔄 PaymentMethodSelectionPage - using endpoint:', endpoint);

        const response = await apiClient.put(endpoint, {
          paymentMethod: 'cash'
        });

        if (response.data.success) {
          toast.success(t('payment.cashBookingSuccess', 'Booking confirmed! Payment will be collected at the hotel.'));

          // Navigate to appropriate bookings list - get serviceType from searchParams
          const urlServiceType = searchParams.get('serviceType');
          switch (urlServiceType) {
            case 'laundry':
              navigate('/my-laundry-bookings');
              break;
            case 'transportation':
              navigate('/my-bookings');
              break;
            case 'restaurant':
              navigate('/my-restaurant-bookings');
              break;
            case 'housekeeping':
              navigate('/my-housekeeping-bookings');
              break;
            default:
              navigate('/my-bookings');
          }
        }
      } else if (bookingData) {
        // Create new booking with cash payment
        const bookingPayload = { ...bookingData, paymentMethod: 'cash' };

        let response;
        switch (serviceType) {
          case 'laundry':
            response = await apiClient.post('/client/bookings/laundry', bookingPayload);
            break;
          case 'transportation':
            response = await apiClient.post('/client/bookings/transportation', bookingPayload);
            break;
          default:
            response = await apiClient.post('/client/bookings', bookingPayload);
        }

        if (response.data.success) {
          // Clear stored booking data
          localStorage.removeItem('pendingBookingData');

          toast.success(t('payment.cashBookingCreated', 'Booking created successfully! Payment will be collected at the hotel.'));

          // Navigate to the appropriate bookings list based on service type
          switch (serviceType) {
            case 'laundry':
              navigate('/my-laundry-bookings');
              break;
            case 'transportation':
              navigate('/my-bookings');
              break;
            case 'restaurant':
              navigate('/my-restaurant-bookings');
              break;
            case 'housekeeping':
              navigate('/my-housekeeping-bookings');
              break;
            default:
              navigate('/my-bookings');
          }
        }
      } else {
        throw new Error('No booking data available');
      }
    } catch (error) {
      console.error('Cash payment error:', error);
      throw new Error(error.response?.data?.message || 'Failed to process cash payment');
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getDisplayAmount = () => {
    if (amount) return parseFloat(amount);
    if (bookingData?.totalAmount) return bookingData.totalAmount;
    if (bookingData?.pricing?.total) return bookingData.pricing.total;
    return 0;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleGoBack}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={processingPayment}
              >
                <FaArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('payment.selectPaymentMethod', 'Select Payment Method')}
                </h1>
                <p className="text-gray-600">
                  {t('payment.selectPreferredMethod', 'Choose your preferred payment method to complete the booking')}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-2 text-green-600">
              <FaShieldAlt className="w-5 h-5" />
              <span className="font-medium">{t('payment.secure', 'Secure')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Payment Method Selection */}
          <div className="lg:col-span-2">
            <PaymentMethodSelection
              selectedMethod={paymentMethod}
              onMethodChange={handlePaymentMethodChange}
              totalAmount={getDisplayAmount()}
              currency={currency}
              showPricing={true}
            />
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {t('payment.orderSummary', 'Order Summary')}
              </h3>

              {/* Service Details */}
              {bookingData && (
                <div className="space-y-3 mb-6">
                  {serviceType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payment.service', 'Service')}:</span>
                      <span className="font-medium">{serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</span>
                    </div>
                  )}

                  {bookingData.quantity && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payment.quantity', 'Quantity')}:</span>
                      <span className="font-medium">{bookingData.quantity}</span>
                    </div>
                  )}

                  {bookingData.schedule?.preferredDate && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payment.date', 'Date')}:</span>
                      <span className="font-medium">
                        {new Date(bookingData.schedule.preferredDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {bookingData.schedule?.preferredTime && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('payment.time', 'Time')}:</span>
                      <span className="font-medium">{bookingData.schedule.preferredTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Total Amount */}
              <div className="border-t pt-4 mb-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">
                    {t('payment.total', 'Total')}:
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: currency,
                      minimumFractionDigits: 2,
                    }).format(getDisplayAmount())}
                  </span>
                </div>
              </div>

              {/* Payment Method Summary */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-2">
                  {t('payment.selectedMethod', 'Selected Method')}:
                </h4>
                <div className="flex items-center space-x-3">
                  {paymentMethod === 'online' ? (
                    <>
                      <FaCreditCard className="w-5 h-5 text-blue-600" />
                      <span className="text-gray-700">{t('payment.methods.online.title', 'Pay Online')}</span>
                    </>
                  ) : (
                    <>
                      <FaMoneyBillWave className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700">{t('payment.methods.cash.title', 'Pay at Hotel')}</span>
                    </>
                  )}
                </div>
              </div>

              {/* Proceed Button */}
              <button
                onClick={handleProceedToPayment}
                disabled={!paymentMethod || processingPayment}
                className={`
                  w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-200
                  ${paymentMethod === 'online'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${processingPayment ? 'opacity-50' : 'hover:shadow-lg transform hover:scale-[1.02]'}
                `}
              >
                {processingPayment ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FaSpinner className="w-5 h-5 animate-spin" />
                    <span>{t('payment.processing', 'Processing...')}</span>
                  </div>
                ) : (
                  <>
                    {paymentMethod === 'online'
                      ? t('payment.proceedToPayment', 'Proceed to Payment')
                      : t('payment.confirmBooking', 'Confirm Booking')
                    }
                  </>
                )}
              </button>

              {/* Additional Info */}
              <div className="mt-4 text-xs text-gray-500 text-center">
                {paymentMethod === 'online'
                  ? t('payment.onlineInfo', 'You will be redirected to our secure payment gateway')
                  : t('payment.cashInfo', 'Your booking will be confirmed immediately')
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelectionPage;
