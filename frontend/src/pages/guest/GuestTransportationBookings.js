/**
 * Guest Transportation Bookings Page
 * Shows all transportation bookings for the guest including quotes that need to be reviewed
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaCar,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaClock,
  FaCheck,
  FaTimes,
  FaEye,
  FaMoneyBillWave,
  FaExclamationTriangle,
  FaSpinner
} from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const GuestTransportationBookings = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('payment_pending');
  const [selectedBooking, setSelectedBooking] = useState(null);

  const tabs = [
    { id: 'pending_quote', label: t('transportation.labels.waitingForQuote'), icon: FaClock },
    { id: 'payment_pending', label: t('transportation.labels.readyForPayment'), icon: FaMoneyBillWave },
    { id: 'payment_completed', label: t('transportation.labels.confirmed'), icon: FaCheck }
  ];

  useEffect(() => {
    fetchBookings();
  }, [selectedTab]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transportation-bookings/guest?status=${selectedTab}`);

      if (response.data.success) {
        setBookings(response.data.data.bookings);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('bookings.errors.fetchBookings') || 'Failed to fetch bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (bookingId) => {
    try {
      console.log('🔵 handlePayNow called with bookingId:', bookingId);

      // Create Kashier payment session
      const response = await apiClient.post('/payments/kashier/create-session', {
        bookingId: bookingId
      });

      console.log('✅ Payment session response:', response.data);

      if (response.data.success) {
        const { paymentUrl } = response.data.data;

        // Redirect to Kashier payment page
        window.location.href = paymentUrl;
      }
    } catch (error) {
      console.error('❌ Error creating payment session:', error);
      toast.error(error.response?.data?.message || 'Failed to create payment session');
    }
  };

  const handleViewDetails = async (bookingId) => {
    try {
      const response = await apiClient.get(`/transportation-bookings/${bookingId}`);
      if (response.data.success) {
        setSelectedBooking(response.data.data.booking);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to fetch booking details');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending_quote': 'bg-yellow-100 text-yellow-800',
      'payment_pending': 'bg-orange-100 text-orange-800',
      'payment_completed': 'bg-green-100 text-green-800',
      'completed': 'bg-gray-100 text-gray-800',
      'cancelled': 'bg-red-100 text-red-800',
      'quote_rejected': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const renderBookingCard = (booking) => (
    <div key={booking._id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {booking.bookingReference}
          </h3>
          <p className="text-sm text-gray-600">
            {booking.serviceProvider?.businessName}
          </p>
        </div>
        <div className="text-right">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.bookingStatus)}`}>
            {t(`transportation.status.${booking.bookingStatus}`)}
          </span>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <FaCar className="mr-2" />
            {t(`transportation.vehicleTypes.${booking.vehicleDetails?.vehicleType}`)} - {t(`transportation.comfortLevels.${booking.vehicleDetails?.comfortLevel}`)}
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FaCalendarAlt className="mr-2" />
            <span className="font-medium">{t('transportation.labels.scheduledTime')}:</span>
            <span className="ml-1">{new Date(booking.tripDetails?.scheduledDateTime).toLocaleString()}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center text-sm text-gray-600">
            <FaMapMarkerAlt className="mr-2 text-green-500" />
            <span className="font-medium">{t('transportation.labels.pickup')}:</span>
            <span className="ml-1 truncate">{booking.tripDetails?.pickupLocation}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <FaMapMarkerAlt className="mr-2 text-red-500" />
            <span className="font-medium">{t('transportation.labels.destination')}:</span>
            <span className="ml-1 truncate">{booking.tripDetails?.destination}</span>
          </div>
        </div>
      </div>

      {/* Quote Information */}
      {booking.quote && (
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">{t('transportation.labels.quotedPrice')}:</span>
            <span className="text-xl font-bold text-green-600">
              {formatPriceByLanguage(booking.quote.finalPrice, i18n.language)}
            </span>
          </div>

          {booking.quote.quoteNotes && (
            <p className="text-sm text-gray-600 mb-2">{booking.quote.quoteNotes}</p>
          )}

          <div className="flex justify-between text-xs text-gray-500">
            <span>{t('transportation.labels.quotedAt')}: {new Date(booking.quote.quotedAt).toLocaleString()}</span>
            <span>{t('transportation.labels.expiresAt')}: {new Date(booking.quote.expiresAt).toLocaleString()}</span>
          </div>

          {booking.isQuoteExpired && (
            <div className="mt-2">
              <span className="px-2 py-1 bg-red-100 text-red-600 text-xs rounded-full">
                <FaExclamationTriangle className="inline mr-1" />
                {t('transportation.status.quote_rejected')}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <button
          onClick={() => handleViewDetails(booking._id)}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
        >
          <FaEye className="inline mr-2" />
          {t('transportation.labels.viewDetails')}
        </button>

        {/* Show Pay Now button for payment_pending status (simplified workflow) */}
        {booking.bookingStatus === 'payment_pending' && (
          <button
            onClick={() => handlePayNow(booking._id)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaMoneyBillWave className="inline mr-2" />
            {t('transportation.labels.payNow')}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          <FaCar className="inline mr-3" />
          {t('transportation.myBookings')}
        </h1>
        <p className="mt-2 text-gray-600">{t('transportation.bookingsSubtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="inline mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('transportation.labels.processing')}</p>
        </div>
      ) : bookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map(renderBookingCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaCar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('transportation.noBookings')}
          </h3>
          <p className="text-gray-500 mb-4">
            {t('transportation.noBookingsDescription')}
          </p>
          <button
            onClick={() => navigate('/hotels')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            {t('transportation.bookTransportation')}
          </button>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('transportation.bookingDetails')} - {selectedBooking.bookingReference}
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-6">
                {/* Trip Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Trip Information</h4>
                  <div className="bg-gray-50 rounded-md p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">Vehicle:</span>
                        <p className="text-gray-600">
                          {selectedBooking.vehicleDetails?.vehicleType} - {selectedBooking.vehicleDetails?.comfortLevel}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Passengers:</span>
                        <p className="text-gray-600">{selectedBooking.tripDetails?.passengerCount}</p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Route:</span>
                        <p className="text-gray-600">
                          {selectedBooking.tripDetails?.pickupLocation} → {selectedBooking.tripDetails?.destination}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="font-medium">Scheduled Time:</span>
                        <p className="text-gray-600">
                          {new Date(selectedBooking.tripDetails?.scheduledDateTime).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quote Information */}
                {selectedBooking.quote && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">Quote Information</h4>
                    <div className="bg-blue-50 rounded-md p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">Base Price:</span>
                          <p className="text-gray-700">{formatPriceByLanguage(selectedBooking.quote.basePrice, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Final Price:</span>
                          <p className="text-lg font-bold text-green-600">{formatPriceByLanguage(selectedBooking.quote.finalPrice, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">Quoted At:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.quote.quotedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">Expires At:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.quote.expiresAt).toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedBooking.quote.quoteNotes && (
                        <div>
                          <span className="font-medium">Quote Notes:</span>
                          <p className="text-gray-700 mt-1">{selectedBooking.quote.quoteNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Service Provider Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">Service Provider</h4>
                  <div className="bg-gray-50 rounded-md p-4">
                    <p className="font-medium text-gray-900">{selectedBooking.serviceProvider?.businessName}</p>
                    <p className="text-gray-600">{selectedBooking.serviceProvider?.email}</p>
                    <p className="text-gray-600">{selectedBooking.serviceProvider?.phone}</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>

                {selectedBooking.bookingStatus === 'payment_pending' && (
                  <button
                    onClick={() => {
                      handlePayNow(selectedBooking._id);
                      setSelectedBooking(null);
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Pay Now
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Information Box */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <FaCar className="h-5 w-5 text-blue-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              How Transportation Booking Works
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Submit a transportation request with your destination and preferences</li>
                <li>Service provider will set a price and your booking becomes ready for payment</li>
                <li>Complete payment to confirm your booking immediately</li>
                <li>Receive confirmation and track your service</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuestTransportationBookings;
