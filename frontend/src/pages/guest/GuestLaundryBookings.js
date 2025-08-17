/**
 * Guest Laundry Bookings Management
 * Shows guest's laundry bookings with payment integration
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';

const GuestLaundryBookings = () => {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/client/bookings?category=laundry');

      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching laundry bookings:', error);
      toast.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async (bookingId) => {
    try {
      console.log('🔵 handlePayNow called with bookingId:', bookingId);

      // Create Kashier payment session
      const response = await apiClient.post('/payments/kashier/create-session', {
        bookingId: bookingId,
        bookingType: 'laundry'
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
      const response = await apiClient.get(`/client/bookings/${bookingId}`);
      if (response.data.success) {
        setSelectedBooking(response.data.data.booking);
      }
    } catch (error) {
      console.error('Error fetching booking details:', error);
      toast.error('Failed to load booking details');
    }
  };

  const formatPriceByLanguage = (amount, language) => {
    if (!amount) return 'N/A';

    const formatter = new Intl.NumberFormat(
      language === 'ar' ? 'ar-EG' : 'en-US',
      {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }
    );

    return formatter.format(amount);
  };

  const getStatusColor = (status) => {
    const statusColors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'payment_pending': 'bg-blue-100 text-blue-800',
      'confirmed': 'bg-green-100 text-green-800',
      'in_progress': 'bg-purple-100 text-purple-800',
      'completed': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return statusColors[status] || 'bg-gray-100 text-gray-800';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': t('common.pending'),
      'payment_pending': 'Payment Pending',
      'confirmed': t('common.confirmed'),
      'in_progress': t('common.inProgress'),
      'completed': t('common.completed'),
      'cancelled': t('common.cancelled')
    };
    return statusLabels[status] || status;
  };

  const filterBookings = (status) => {
    if (status === 'pending') {
      return bookings.filter(b => ['pending', 'payment_pending'].includes(b.status));
    }
    if (status === 'active') {
      return bookings.filter(b => ['confirmed', 'in_progress'].includes(b.status));
    }
    if (status === 'completed') {
      return bookings.filter(b => b.status === 'completed');
    }
    return bookings;
  };

  const filteredBookings = filterBookings(activeTab);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            My Laundry Bookings
          </h1>
          <p className="text-gray-600">
            Manage your laundry service bookings and payments
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {['pending', 'active', 'completed'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab === 'pending' && 'Pending Payment'}
                  {tab === 'active' && 'Active Orders'}
                  {tab === 'completed' && 'Completed'}
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                    {filterBookings(tab).length}
                  </span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Bookings List */}
        <div className="space-y-4">
          {filteredBookings.length === 0 ? (
            <div className="bg-white rounded-lg shadow-sm p-8 text-center">
              <div className="text-6xl mb-4">🧺</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No bookings found
              </h3>
              <p className="text-gray-600">
                You don't have any laundry bookings in this category yet.
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white rounded-lg shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {booking.bookingNumber}
                      </h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Hotel:</span>
                        <p>{booking.hotelId?.name || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Service:</span>
                        <p>{booking.serviceId?.name || 'Laundry Service'}</p>
                      </div>
                      <div>
                        <span className="font-medium">Items:</span>
                        <p>{booking.laundryItems?.length || 0} items</p>
                      </div>
                    </div>

                    <div className="mt-4 flex items-center justify-between">
                      <div className="text-lg font-bold text-green-600">
                        {formatPriceByLanguage(booking.pricing?.total, i18n.language)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.schedule?.preferredDate} at {booking.schedule?.preferredTime}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 ml-6">
                    {booking.status === 'payment_pending' && (
                      <button
                        onClick={() => handlePayNow(booking._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                      >
                        Pay Now
                      </button>
                    )}
                    <button
                      onClick={() => handleViewDetails(booking._id)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-96 overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">Booking Details</h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-gray-900 mb-2">Booking Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Booking Number:</span>
                        <span className="font-medium">{selectedBooking.bookingNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusLabel(selectedBooking.status)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Amount:</span>
                        <span className="font-medium text-green-600">
                          {formatPriceByLanguage(selectedBooking.pricing?.total, i18n.language)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.laundryItems && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Items</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                        {selectedBooking.laundryItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-center text-sm">
                            <div>
                              <span className="font-medium">{item.itemName}</span>
                              <span className="text-gray-500 ml-2">({item.serviceTypeName})</span>
                            </div>
                            <div className="text-right">
                              <div>Qty: {item.quantity}</div>
                              <div className="text-green-600">{formatPriceByLanguage(item.totalPrice, i18n.language)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedBooking.schedule && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Schedule</h3>
                      <div className="bg-gray-50 rounded-lg p-4 text-sm">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">{selectedBooking.schedule.preferredDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Time:</span>
                          <span className="font-medium">{selectedBooking.schedule.preferredTime}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedBooking.payment?.status === 'completed' && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Payment Information</h3>
                      <div className="bg-green-50 rounded-lg p-4 text-sm">
                        <div className="flex justify-between">
                          <span>Payment Status:</span>
                          <span className="text-green-600 font-medium">Completed</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Amount Paid:</span>
                          <span className="font-medium">{formatPriceByLanguage(selectedBooking.payment.paidAmount, i18n.language)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Payment Date:</span>
                          <span className="font-medium">{new Date(selectedBooking.payment.paymentDate).toLocaleString()}</span>
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
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuestLaundryBookings;
