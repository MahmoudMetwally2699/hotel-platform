/**
 * Guest Payment Requests Page
 * Shows pending quotes and allows guests to accept/reject and pay for transportation services
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { FaCar, FaMoneyBillWave, FaClock, FaMapMarkerAlt, FaCalendarAlt, FaCheck, FaCreditCard } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const GuestPaymentRequests = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [paymentRequests, setPaymentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  useEffect(() => {
    fetchPaymentRequests();
  }, []);

  const fetchPaymentRequests = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/transportation-bookings/guest/payment-requests');

      if (response.data.success) {
        setPaymentRequests(response.data.data.paymentRequests);
      }
    } catch (error) {
      toast.error(t('paymentRequests.errors.fetchRequests'));
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (bookingId) => {
    try {
      setProcessingPayment(true);

      // Create Kashier payment session
      const response = await apiClient.post('/payments/kashier/create-session', {
        bookingId: bookingId
      });

      if (response.data.success) {
        const { paymentUrl } = response.data.data;

        // Redirect to Kashier payment page
        window.location.href = paymentUrl;
      }
    } catch (error) {
      toast.error(error.response?.data?.message || t('paymentRequests.errors.paymentSession'));
    } finally {
      setProcessingPayment(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'payment_pending': 'bg-orange-100 text-orange-800',
      'payment_completed': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderPaymentRequestCard = (request) => (
    <div key={request._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {request.bookingReference}
          </h3>
          <p className="text-sm text-gray-600">
            {request.serviceProvider?.businessName}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(request.bookingStatus)}`}>
            {t(`paymentRequests.status.${request.bookingStatus}`)}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FaCar className="mr-2" />
          {t(`paymentRequests.vehicleTypes.${request.vehicleDetails.vehicleType}`)} - {t(`paymentRequests.comfortLevels.${request.vehicleDetails.comfortLevel}`)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FaCalendarAlt className="mr-2" />
          {new Date(request.tripDetails.scheduledDateTime).toLocaleDateString()}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FaMapMarkerAlt className="mr-2 text-green-500" />
          <span className="font-medium">{t('paymentRequests.pickup')}:</span>
          <span className="ml-2">{request.tripDetails.pickupLocation}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FaMapMarkerAlt className="mr-2 text-red-500" />
          <span className="font-medium">{t('paymentRequests.destination')}:</span>
          <span className="ml-2">{request.tripDetails.destination}</span>
        </div>
      </div>

      {request.quote && (
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{t('paymentRequests.quotedPrice')}:</span>
            <span className="text-xl font-bold text-green-600">
              {formatPriceByLanguage(request.quote.finalPrice, i18n.language)}
            </span>
          </div>

          {request.quote.quoteNotes && (
            <p className="text-sm text-gray-600 mb-2">{request.quote.quoteNotes}</p>
          )}

          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('paymentRequests.quotedAt')}: {new Date(request.quote.quotedAt).toLocaleString()}</span>
            <span>{t('paymentRequests.expiresAt')}: {new Date(request.quote.expiresAt).toLocaleString()}</span>
          </div>
        </div>
      )}

      <div className="flex justify-end space-x-2">
        {request.bookingStatus === 'payment_pending' && (
          <div className="flex space-x-2">
            <button
              onClick={() => handlePayNow(request._id)}
              disabled={processingPayment}
              className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors disabled:opacity-50"
            >
              {processingPayment ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white inline mr-2"></div>
                  {t('paymentRequests.processing')}
                </>
              ) : (
                <>
                  <FaCreditCard className="inline mr-2" />
                  {t('paymentRequests.payNow') || 'Pay Now'}
                </>
              )}
            </button>
          </div>
        )}

        {request.bookingStatus === 'payment_completed' && (
          <span className="px-4 py-2 bg-green-100 text-green-800 rounded-md">
            <FaCheck className="inline mr-2" />
            {t('paymentRequests.paid')}
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-2 sm:px-3 lg:px-4 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          <FaMoneyBillWave className="inline mr-3" />
          {t('paymentRequests.title')}
        </h1>
        <p className="mt-2 text-gray-600">{t('paymentRequests.subtitle')}</p>
      </div>

      {paymentRequests.length > 0 ? (
        <div className="space-y-6">
          {paymentRequests.map(renderPaymentRequestCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaMoneyBillWave className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('paymentRequests.noRequests')}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('paymentRequests.noRequestsDescription')}
          </p>
          <button
            onClick={() => navigate('/hotels')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('paymentRequests.browseServices')}
          </button>
        </div>
      )}

      {/* Information Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaClock className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              {t('paymentRequests.importantNote')}
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>{t('paymentRequests.notePoint1')}</li>
                <li>{t('paymentRequests.notePoint2')}</li>
                <li>{t('paymentRequests.notePoint3')}</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestPaymentRequests;
