/**
 * Guest Restaurant Bookings Management
 * Shows guest's restaurant bookings with payment integration
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaUtensils,
  FaEye,
  FaTimes,
  FaReceipt,
  FaClock,
  FaMapMarkerAlt,
  FaLeaf
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const GuestRestaurantBookings = () => {
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
      const response = await apiClient.get('/client/bookings?category=restaurant');

      if (response.data.success) {
        setBookings(response.data.data.bookings || []);
      }
    } catch (error) {
      console.error('Error fetching restaurant bookings:', error);
      toast.error('Failed to load restaurant bookings');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get status color classes
   */
  const getStatusColor = (status) => {
    const statusColors = {
      pending: 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
      confirmed: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      in_progress: 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200',
      ready: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      delivered: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border border-green-200',
      completed: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      cancelled: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
    };
    return statusColors[status] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
  };

  /**
   * Get status label
   */
  const getStatusLabel = (status) => {
    const statusLabels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      in_progress: 'Preparing',
      ready: 'Ready',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled'
    };
    return statusLabels[status] || status;
  };

  /**
   * Format price based on language
   */
  const formatPriceByLanguage = (price, language) => {
    if (!price) return '$0.00';
    return `$${parseFloat(price).toFixed(2)}`;
  };

  /**
   * Filter bookings by status
   */
  const filterBookings = (tab) => {
    switch (tab) {
      case 'pending':
        return bookings.filter(b => ['pending', 'confirmed', 'in_progress'].includes(b.status));
      case 'active':
        return bookings.filter(b => ['ready', 'delivered'].includes(b.status));
      case 'completed':
        return bookings.filter(b => ['completed'].includes(b.status));
      case 'cancelled':
        return bookings.filter(b => ['cancelled'].includes(b.status));
      default:
        return bookings;
    }
  };

  const filteredBookings = filterBookings(activeTab);

  /**
   * Get spicy level display
   */
  const getSpicyLevelDisplay = (level) => {
    const levels = {
      mild: '🌶️',
      medium: '🌶️🌶️',
      hot: '🌶️🌶️🌶️',
      very_hot: '🌶️🌶️🌶️🌶️'
    };
    return levels[level] || '';
  };

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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-red-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header with Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaUtensils className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                My Restaurant Orders
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your restaurant orders and track delivery status
              </p>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2 mb-8">
          <nav className="flex flex-wrap gap-2">
            {[
              { key: 'pending', label: 'Pending', count: filterBookings('pending').length },
              { key: 'active', label: 'Active', count: filterBookings('active').length },
              { key: 'completed', label: 'Completed', count: filterBookings('completed').length },
              { key: 'cancelled', label: 'Cancelled', count: filterBookings('cancelled').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-fit px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      activeTab === tab.key
                        ? 'bg-white/20 text-white'
                        : 'bg-orange-100 text-orange-600'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaUtensils className="text-orange-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No {activeTab} orders found
              </h3>
              <p className="text-gray-600 text-lg">
                {activeTab === 'pending' && "You don't have any pending restaurant orders."}
                {activeTab === 'active' && "You don't have any active restaurant orders."}
                {activeTab === 'completed' && "You don't have any completed restaurant orders."}
                {activeTab === 'cancelled' && "You don't have any cancelled restaurant orders."}
              </p>
            </div>
          ) : (
            filteredBookings.map((booking) => (
              <div key={booking._id} className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
                {/* Header with Order Number and Status */}
                <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-md">
                      <FaUtensils className="text-white text-sm" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Order #{booking.bookingNumber || booking._id?.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500 font-medium">
                        {new Date(booking.createdAt).toLocaleDateString()} at{' '}
                        {new Date(booking.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md backdrop-blur-sm ${getStatusColor(booking.status)}`}>
                      {getStatusLabel(booking.status)}
                    </span>
                  </div>
                </div>

                {/* Service Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaMapMarkerAlt className="text-blue-500 text-sm" />
                      <span className="font-semibold text-blue-800 text-sm">Hotel</span>
                    </div>
                    <p className="text-gray-800 font-medium">{booking.hotelId?.name || 'N/A'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-orange-50 to-red-100 rounded-xl p-4 border border-orange-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaUtensils className="text-orange-500 text-sm" />
                      <span className="font-semibold text-orange-800 text-sm">Restaurant</span>
                    </div>
                    <p className="text-gray-800 font-medium">{booking.serviceId?.name || 'Restaurant Service'}</p>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center gap-2 mb-2">
                      <FaReceipt className="text-green-500 text-sm" />
                      <span className="font-semibold text-green-800 text-sm">Menu Items</span>
                    </div>
                    <p className="text-gray-800 font-medium">{booking.menuItems?.length || 0} items</p>
                  </div>
                </div>

                {/* Total Amount and Action Button */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div className="bg-gradient-to-br from-emerald-50 to-green-100 rounded-xl p-4 border border-emerald-200 sm:min-w-fit">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-semibold text-emerald-800 text-sm">Total Amount</span>
                    </div>
                    <p className="text-2xl font-bold text-emerald-600">
                      {formatPriceByLanguage(booking.pricing?.total, i18n.language)}
                    </p>
                  </div>

                  <button
                    onClick={() => setSelectedBooking(booking)}
                    className="flex items-center justify-center gap-2 px-6 py-3 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                  >
                    <FaEye />
                    <span>View Details</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Booking Details Modal */}
        {selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                {/* Modal Header */}
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">
                    Order Details
                  </h2>
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <FaTimes size={24} />
                  </button>
                </div>

                {/* Order Information */}
                <div className="space-y-6">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">Order Information</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Order Number:</span>
                        <p className="font-medium">#{selectedBooking.bookingNumber || selectedBooking._id?.slice(-8)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Status:</span>
                        <span className={`inline-block px-2 py-1 rounded text-xs font-medium ml-2 ${getStatusColor(selectedBooking.status)}`}>
                          {getStatusLabel(selectedBooking.status)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Order Date:</span>
                        <p className="font-medium">{new Date(selectedBooking.createdAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Total Amount:</span>
                        <span className="font-medium text-green-600">
                          {formatPriceByLanguage(selectedBooking.pricing?.total, i18n.language)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Schedule Information */}
                  {selectedBooking.schedule && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-2">
                        <FaClock className="inline mr-2" />
                        Schedule & Delivery
                      </h3>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600">Preferred Date:</span>
                          <p className="font-medium">{selectedBooking.schedule.preferredDate}</p>
                        </div>
                        <div>
                          <span className="text-gray-600">Preferred Time:</span>
                          <p className="font-medium">{selectedBooking.schedule.preferredTime}</p>
                        </div>
                        {selectedBooking.location?.deliveryLocation && (
                          <div className="col-span-2">
                            <span className="text-gray-600">
                              <FaMapMarkerAlt className="inline mr-1" />
                              Delivery Location:
                            </span>
                            <p className="font-medium">{selectedBooking.location.deliveryLocation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Menu Items */}
                  {selectedBooking.menuItems && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Menu Items</h3>
                      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                        {selectedBooking.menuItems.map((item, index) => (
                          <div key={index} className="flex justify-between items-start text-sm">
                            <div className="flex-1">
                              <div className="flex items-center">
                                <span className="font-medium">{item.itemName}</span>
                                {item.isVegetarian && (
                                  <span className="ml-2 text-green-600">
                                    <FaLeaf size={12} />
                                  </span>
                                )}
                                {item.isVegan && (
                                  <span className="ml-1 text-green-600 text-xs">V</span>
                                )}
                                {item.spicyLevel && item.spicyLevel !== 'mild' && (
                                  <span className="ml-2 text-red-600">
                                    {getSpicyLevelDisplay(item.spicyLevel)}
                                  </span>
                                )}
                              </div>
                              {item.description && (
                                <p className="text-gray-600 text-xs mt-1">{item.description}</p>
                              )}
                              <div className="text-gray-500 text-xs mt-1">
                                Qty: {item.quantity} × ${item.price}
                                {item.preparationTime && (
                                  <span className="ml-2">
                                    <FaClock className="inline mr-1" />
                                    {item.preparationTime}min
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-4">
                              <div className="font-medium">${item.totalPrice || (item.price * item.quantity)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Special Requests */}
                  {selectedBooking.guestDetails?.specialRequests && (
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Special Requests</h3>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm">{selectedBooking.guestDetails.specialRequests}</p>
                      </div>
                    </div>
                  )}

                  {/* Payment Information */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      <FaReceipt className="inline mr-2" />
                      Payment Summary
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Subtotal:</span>
                        <span>{formatPriceByLanguage(selectedBooking.pricing?.subtotal, i18n.language)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg border-t pt-2">
                        <span>Total:</span>
                        <span className="text-green-600">
                          {formatPriceByLanguage(selectedBooking.pricing?.total, i18n.language)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setSelectedBooking(null)}
                    className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
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

export default GuestRestaurantBookings;
