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
      {/* Header - More compact on mobile */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <button
                onClick={handleGoBack}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                disabled={processingPayment}
              >
                <FaArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-gray-900">
                  {t('payment.selectPaymentMethod', 'Select Payment Method')}
                </h1>
                <p className="text-xs sm:text-sm text-gray-600 hidden sm:block">
                  {t('payment.selectPreferredMethod', 'Choose your preferred payment method to complete the booking')}
                </p>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-green-600">
              <FaShieldAlt className="w-5 h-5" />
              <span className="font-medium">{t('payment.secure', 'Secure')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content - More compact layout on mobile */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-8">
        <div className="flex flex-col space-y-3 lg:grid lg:grid-cols-3 lg:gap-8 lg:space-y-0">
          {/* Order Summary - Show first on mobile, compact */}
          <div className="lg:col-span-1 lg:order-2">
            <div className="bg-white rounded-lg shadow-sm border p-3 sm:p-4 lg:p-6 lg:sticky lg:top-8">
              {/* Mobile: Show total prominently */}
              <div className="flex items-center justify-between mb-3 lg:hidden">
                <span className="text-lg font-semibold text-gray-900">Total:</span>
                <span className="text-xl font-bold text-gray-900">
                  {new Intl.NumberFormat('en-US', {
                    style: 'currency',
                    currency: currency,
                    minimumFractionDigits: 2,
                  }).format(getDisplayAmount())}
                </span>
              </div>

              {/* Desktop: Full order summary */}
              <div className="hidden lg:block">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('payment.orderSummary', 'Order Summary')}
                </h3>

                {/* Service Details */}
                {bookingData && (
                  <div className="space-y-3 mb-6">
                    {serviceType && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('payment.service', 'Service')}:</span>
                        <span className="font-medium">{serviceType.charAt(0).toUpperCase() + serviceType.slice(1)}</span>
                      </div>
                    )}

                    {bookingData.quantity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('payment.quantity', 'Quantity')}:</span>
                        <span className="font-medium">{bookingData.quantity}</span>
                      </div>
                    )}

                    {bookingData.schedule?.preferredDate && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('payment.date', 'Date')}:</span>
                        <span className="font-medium">
                          {new Date(bookingData.schedule.preferredDate).toLocaleDateString()}
                        </span>
                      </div>
                    )}

                    {bookingData.schedule?.preferredTime && (
                      <div className="flex justify-between text-sm">
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
              </div>

              {/* Payment Method Summary - Compact */}
              <div className="bg-gray-50 rounded-lg p-2 sm:p-3 mb-3 sm:mb-4">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-900 text-sm">
                    {t('payment.selectedMethod', 'Method')}:
                  </span>
                  <div className="flex items-center space-x-2">
                    {paymentMethod === 'online' ? (
                      <>
                        <FaCreditCard className="w-4 h-4 text-blue-600" />
                        <span className="text-gray-700 text-sm">{t('payment.methods.online.title', 'Pay Online')}</span>
                      </>
                    ) : (
                      <>
                        <FaMoneyBillWave className="w-4 h-4 text-green-600" />
                        <span className="text-gray-700 text-sm">{t('payment.methods.cash.title', 'Pay at Hotel')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Proceed Button - More prominent on mobile */}
              <button
                onClick={handleProceedToPayment}
                disabled={!paymentMethod || processingPayment}
                className={`
                  w-full py-3 sm:py-4 px-4 sm:px-6 rounded-lg font-semibold text-white transition-all duration-200 text-base
                  ${paymentMethod === 'online'
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-green-600 hover:bg-green-700'
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${processingPayment ? 'opacity-50' : 'hover:shadow-lg'}
                `}
              >
                {processingPayment ? (
                  <div className="flex items-center justify-center space-x-2">
                    <FaSpinner className="w-4 h-4 animate-spin" />
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
            </div>
          </div>

          {/* Payment Method Selection - More compact on mobile */}
          <div className="lg:col-span-2 lg:order-1">
            <PaymentMethodSelection
              selectedMethod={paymentMethod}
              onMethodChange={handlePaymentMethodChange}
              totalAmount={getDisplayAmount()}
              currency={currency}
              showPricing={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodSelectionPage;
