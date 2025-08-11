/**
 * Transportation Booking Management Page
 * Handles quote creation, booking management, and payment tracking for service providers
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaCar, FaMoneyBillWave, FaClock, FaUser, FaMapMarkerAlt, FaCalendarAlt, FaCheck, FaTimes, FaEye, FaQuoteLeft } from 'react-icons/fa';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const TransportationBookingManagement = () => {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState('pending_quote');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    basePrice: '',
    notes: '',
    expirationHours: 24
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  });

  // Tab configuration
  const tabs = [
    { id: 'pending_quote', label: t('transportation.tabs.pendingQuotes'), icon: FaQuoteLeft },
    { id: 'payment_pending', label: t('transportation.tabs.pendingPayment') || 'Pending Payment', icon: FaClock },
    { id: 'payment_completed', label: t('transportation.tabs.confirmed'), icon: FaCheck },
    { id: 'completed', label: t('transportation.tabs.completed'), icon: FaCheck },
  ];

  useEffect(() => {
    fetchBookings();
  }, [selectedTab, pagination.page]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`/transportation-bookings/provider?status=${selectedTab}&page=${pagination.page}&limit=${pagination.limit}`);

      if (response.data.success) {
        setBookings(response.data.data.bookings);
        setPagination(response.data.data.pagination);
      }
    } catch (error) {
      console.error('Error fetching bookings:', error);
      toast.error(t('transportation.errors.fetchBookings'));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateQuote = async (bookingId) => {
    try {
      if (!quoteForm.basePrice || quoteForm.basePrice <= 0) {
        toast.error(t('transportation.errors.invalidPrice'));
        return;
      }

      const response = await apiClient.put(`/transportation-bookings/${bookingId}/quote`, {
        basePrice: parseFloat(quoteForm.basePrice),
        notes: quoteForm.notes,
        expirationHours: quoteForm.expirationHours
      });

      if (response.data.success) {
        toast.success(t('transportation.success.quoteCreated'));
        setSelectedBooking(null);
        setQuoteForm({ basePrice: '', notes: '', expirationHours: 24 });
        fetchBookings(); // Refresh the list
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      toast.error(error.response?.data?.message || t('transportation.errors.createQuote'));
    }
  };

  const handleViewBooking = async (bookingId) => {
    try {
      const response = await apiClient.get(`/transportation-bookings/${bookingId}`);
      if (response.data.success) {
        setSelectedBooking(response.data.data.booking);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error(t('transportation.errors.fetchBookingDetails'));
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
            {booking.guest?.firstName} {booking.guest?.lastName}
          </p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.bookingStatus)}`}>
          {t(`transportation.status.${booking.bookingStatus}`)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FaCar className="mr-2" />
          {t(`transportation.vehicleTypes.${booking.vehicleDetails.vehicleType}`)} - {t(`transportation.comfortLevels.${booking.vehicleDetails.comfortLevel}`)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FaUser className="mr-2" />
          {booking.tripDetails.passengerCount} {t('transportation.passengers')}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center text-sm text-gray-600">
          <FaMapMarkerAlt className="mr-2 text-green-500" />
          <span className="font-medium">{t('transportation.pickup')}:</span>
          <span className="ml-2">{booking.tripDetails.pickupLocation}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FaMapMarkerAlt className="mr-2 text-red-500" />
          <span className="font-medium">{t('transportation.destination')}:</span>
          <span className="ml-2">{booking.tripDetails.destination}</span>
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <FaCalendarAlt className="mr-2" />
          <span className="font-medium">{t('transportation.scheduledTime')}:</span>
          <span className="ml-2">
            {new Date(booking.tripDetails.scheduledDateTime).toLocaleString()}
          </span>
        </div>
      </div>

      {booking.quote && (
        <div className="bg-gray-50 rounded-md p-3 mb-4">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">{t('transportation.quotedPrice')}:</span>
            <span className="text-lg font-bold text-green-600">
              {formatPriceByLanguage(booking.quote.finalPrice, i18n.language)}
            </span>
          </div>
          {booking.quote.quoteNotes && (
            <p className="text-sm text-gray-600 mt-2">{booking.quote.quoteNotes}</p>
          )}
        </div>
      )}

      <div className="flex justify-end space-x-2">
        <button
          onClick={() => handleViewBooking(booking._id)}
          className="px-4 py-2 text-blue-600 hover:text-blue-800 border border-blue-300 rounded-md hover:bg-blue-50 transition-colors"
        >
          <FaEye className="inline mr-2" />
          {t('common.view')}
        </button>

        {booking.bookingStatus === 'pending_quote' && (
          <button
            onClick={() => {
              setSelectedBooking(booking);
              setQuoteForm({ basePrice: '', notes: '', expirationHours: 24 });
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            <FaMoneyBillWave className="inline mr-2" />
            {t('transportation.createQuote')}
          </button>
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          <FaCar className="inline mr-3" />
          {t('transportation.title')}
        </h1>
        <p className="mt-2 text-gray-600">{t('transportation.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
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

      {/* Bookings Grid */}
      {bookings.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {bookings.map(renderBookingCard)}
        </div>
      ) : (
        <div className="text-center py-12">
          <FaCar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('transportation.noBookings')}
          </h3>
          <p className="text-gray-500">
            {t('transportation.noBookingsDescription')}
          </p>
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="mt-8 flex justify-center">
          <div className="flex space-x-2">
            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
              disabled={pagination.page <= 1}
              className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.previous')}
            </button>

            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setPagination(prev => ({ ...prev, page }))}
                className={`px-3 py-2 rounded-md ${
                  pagination.page === page
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
              disabled={pagination.page >= pagination.pages}
              className="px-3 py-2 rounded-md bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {t('common.next')}
            </button>
          </div>
        </div>
      )}

      {/* Quote Creation Modal */}
      {selectedBooking && selectedBooking.bookingStatus === 'pending_quote' && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  {t('transportation.createQuoteFor')} {selectedBooking.bookingReference}
                </h3>
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              {/* Trip Details Summary */}
              <div className="bg-gray-50 rounded-md p-4 mb-6">
                <h4 className="font-medium text-gray-900 mb-3">{t('transportation.tripDetails')}</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">{t('transportation.vehicle')}:</span>
                    <p className="text-gray-600">
                      {t(`transportation.vehicleTypes.${selectedBooking.vehicleDetails.vehicleType}`)} -
                      {t(`transportation.comfortLevels.${selectedBooking.vehicleDetails.comfortLevel}`)}
                    </p>
                  </div>
                  <div>
                    <span className="font-medium">{t('transportation.passengers')}:</span>
                    <p className="text-gray-600">{selectedBooking.tripDetails.passengerCount}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">{t('transportation.route')}:</span>
                    <p className="text-gray-600">
                      {selectedBooking.tripDetails.pickupLocation} → {selectedBooking.tripDetails.destination}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">{t('transportation.scheduledTime')}:</span>
                    <p className="text-gray-600">
                      {new Date(selectedBooking.tripDetails.scheduledDateTime).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quote Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('transportation.basePrice')} *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quoteForm.basePrice}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, basePrice: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('transportation.enterBasePrice')}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {t('transportation.basePriceNote')}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('transportation.quoteNotes')}
                  </label>
                  <textarea
                    value={quoteForm.notes}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, notes: e.target.value }))}
                    rows="3"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={t('transportation.quoteNotesPlaceholder')}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('transportation.quoteExpiration')}
                  </label>
                  <select
                    value={quoteForm.expirationHours}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, expirationHours: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={12}>12 {t('transportation.hours')}</option>
                    <option value={24}>24 {t('transportation.hours')}</option>
                    <option value={48}>48 {t('transportation.hours')}</option>
                    <option value={72}>72 {t('transportation.hours')}</option>
                  </select>
                </div>

                {/* Price Preview */}
                {quoteForm.basePrice && (
                  <div className="bg-blue-50 rounded-md p-4">
                    <h4 className="font-medium text-blue-900 mb-2">{t('transportation.priceBreakdown')}</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>{t('transportation.basePrice')}:</span>
                        <span>{formatPriceByLanguage(parseFloat(quoteForm.basePrice), i18n.language)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>{t('transportation.hotelMarkup')} ({selectedBooking.hotelMarkup.percentage}%):</span>
                        <span>{formatPriceByLanguage(parseFloat(quoteForm.basePrice) * (selectedBooking.hotelMarkup.percentage / 100), i18n.language)}</span>
                      </div>
                      <div className="border-t pt-1 flex justify-between font-medium text-blue-900">
                        <span>{t('transportation.finalPrice')}:</span>
                        <span>{formatPriceByLanguage(parseFloat(quoteForm.basePrice) * (1 + selectedBooking.hotelMarkup.percentage / 100), i18n.language)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleCreateQuote(selectedBooking._id)}
                  disabled={!quoteForm.basePrice || quoteForm.basePrice <= 0}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {t('transportation.sendQuote')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && selectedBooking.bookingStatus !== 'pending_quote' && (
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
                {/* Guest Information */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t('transportation.guestInformation')}</h4>
                  <div className="bg-gray-50 rounded-md p-4 grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">{t('transportation.name')}:</span>
                      <p className="text-gray-600">{selectedBooking.guest?.firstName} {selectedBooking.guest?.lastName}</p>
                    </div>
                    <div>
                      <span className="font-medium">{t('transportation.email')}:</span>
                      <p className="text-gray-600">{selectedBooking.guest?.email}</p>
                    </div>
                  </div>
                </div>

                {/* Trip Details */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-3">{t('transportation.tripDetails')}</h4>
                  <div className="bg-gray-50 rounded-md p-4 space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="font-medium">{t('transportation.vehicle')}:</span>
                        <p className="text-gray-600">
                          {t(`transportation.vehicleTypes.${selectedBooking.vehicleDetails.vehicleType}`)} -
                          {t(`transportation.comfortLevels.${selectedBooking.vehicleDetails.comfortLevel}`)}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">{t('transportation.passengers')}:</span>
                        <p className="text-gray-600">{selectedBooking.tripDetails.passengerCount}</p>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium">{t('transportation.pickup')}:</span>
                      <p className="text-gray-600">{selectedBooking.tripDetails.pickupLocation}</p>
                    </div>
                    <div>
                      <span className="font-medium">{t('transportation.destination')}:</span>
                      <p className="text-gray-600">{selectedBooking.tripDetails.destination}</p>
                    </div>
                    <div>
                      <span className="font-medium">{t('transportation.scheduledTime')}:</span>
                      <p className="text-gray-600">
                        {new Date(selectedBooking.tripDetails.scheduledDateTime).toLocaleString()}
                      </p>
                    </div>
                    {selectedBooking.tripDetails.specialRequirements && (
                      <div>
                        <span className="font-medium">{t('transportation.specialRequirements')}:</span>
                        <p className="text-gray-600">{selectedBooking.tripDetails.specialRequirements}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quote Information */}
                {selectedBooking.quote && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{t('transportation.quoteInformation')}</h4>
                    <div className="bg-blue-50 rounded-md p-4">
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="font-medium">{t('transportation.basePrice')}:</span>
                          <p className="text-gray-700">{formatPriceByLanguage(selectedBooking.quote.basePrice, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.finalPrice')}:</span>
                          <p className="text-lg font-bold text-green-600">{formatPriceByLanguage(selectedBooking.quote.finalPrice, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.quotedAt')}:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.quote.quotedAt).toLocaleString()}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.expiresAt')}:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.quote.expiresAt).toLocaleString()}</p>
                        </div>
                      </div>
                      {selectedBooking.quote.quoteNotes && (
                        <div>
                          <span className="font-medium">{t('transportation.quoteNotes')}:</span>
                          <p className="text-gray-700 mt-1">{selectedBooking.quote.quoteNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Payment Information */}
                {selectedBooking.payment && selectedBooking.payment.status === 'completed' && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-3">{t('transportation.paymentInformation')}</h4>
                    <div className="bg-green-50 rounded-md p-4 text-sm">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <span className="font-medium">{t('transportation.paymentStatus')}:</span>
                          <p className="text-green-600 font-medium">{t('transportation.paymentCompleted')}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.paidAmount')}:</span>
                          <p className="text-gray-700">{formatPriceByLanguage(selectedBooking.payment.paidAmount, i18n.language)}</p>
                        </div>
                        <div>
                          <span className="font-medium">{t('transportation.paymentDate')}:</span>
                          <p className="text-gray-700">{new Date(selectedBooking.payment.paymentDate).toLocaleString()}</p>
                        </div>
                        {selectedBooking.payment.kashier.transactionId && (
                          <div>
                            <span className="font-medium">{t('transportation.transactionId')}:</span>
                            <p className="text-gray-700">{selectedBooking.payment.kashier.transactionId}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  {t('common.close')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportationBookingManagement;
