/**
 * Guest Feedback View Component
 * Shows pending (unrated) bookings + submitted feedback history
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaCalendarAlt, FaComment, FaSearch, FaTrash, FaClock, FaTshirt, FaCar, FaUtensils, FaConciergeBell } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import FeedbackModal from './FeedbackModal';

const GuestFeedbackView = () => {
  const [feedback, setFeedback] = useState([]);
  const [unratedBookings, setUnratedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unratedLoading, setUnratedLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    rating: '',
    serviceType: 'all',
    search: '',
    page: 1
  });

  // Feedback modal state
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const fetchUnratedBookings = useCallback(async () => {
    setUnratedLoading(true);
    try {
      const response = await apiClient.get('/client/unrated-bookings');
      if (response.data.success) {
        setUnratedBookings(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching unrated bookings:', error);
    } finally {
      setUnratedLoading(false);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.serviceType !== 'all') params.append('serviceType', filters.serviceType);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', '10');

      const response = await apiClient.get(`/client/feedback?${params.toString()}`);

      if (response.data.success) {
        setFeedback(response.data.data.feedbacks || []);
        setPagination(response.data.data.pagination || {});
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load your feedback');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchUnratedBookings();
  }, [fetchUnratedBookings]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleDeleteFeedback = async (feedbackId) => {
    if (!window.confirm('Are you sure you want to delete this feedback?')) {
      return;
    }

    try {
      const response = await apiClient.delete(`/client/feedback/${feedbackId}`);
      if (response.data.success) {
        toast.success('Feedback deleted successfully');
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
    }
  };

  const handleRateNow = (booking) => {
    setSelectedBooking(booking);
    setIsFeedbackModalOpen(true);
  };

  const handleFeedbackSubmitted = () => {
    setIsFeedbackModalOpen(false);
    setSelectedBooking(null);
    // Refresh both lists
    fetchUnratedBookings();
    fetchFeedback();
    toast.success('Thank you for your feedback!');
  };

  const handleModalClose = () => {
    setIsFeedbackModalOpen(false);
    setSelectedBooking(null);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={`text-sm ${
              star <= rating ? 'text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || '';
  };

  const getStatusColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getServiceIcon = (serviceType) => {
    switch (serviceType) {
      case 'laundry': return <FaTshirt className="text-blue-500" />;
      case 'transportation': return <FaCar className="text-green-500" />;
      case 'restaurant':
      case 'dining': return <FaUtensils className="text-orange-500" />;
      default: return <FaConciergeBell className="text-purple-500" />;
    }
  };

  const getServiceTypeLabel = (serviceType) => {
    const labels = {
      laundry: 'Laundry',
      transportation: 'Transportation',
      restaurant: 'Restaurant',
      dining: 'Dining',
      housekeeping: 'Housekeeping',
      regular: 'Service'
    };
    return labels[serviceType] || serviceType || 'Service';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          My Feedback
        </h1>
        <p className="text-gray-600">
          Rate your past services and view your submitted reviews
        </p>
      </div>

      {/* ── PENDING REVIEWS SECTION ── */}
      {(unratedLoading || unratedBookings.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-200">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-6 py-4 border-b border-amber-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <FaClock className="text-amber-600 text-lg" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-amber-900">Pending Reviews</h2>
              <p className="text-sm text-amber-700">You have services waiting for your rating</p>
            </div>
            {!unratedLoading && (
              <span className="ml-auto bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unratedBookings.length}
              </span>
            )}
          </div>

          {unratedLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
              <p className="mt-3 text-sm text-gray-500">Loading pending reviews...</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {unratedBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-amber-50/40 transition-colors"
                >
                  {/* Service icon */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-lg">
                    {getServiceIcon(booking.serviceType)}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-0.5">
                      <span className="font-medium text-gray-900 truncate">
                        {booking.serviceDetails?.name || booking.serviceId?.name || booking.serviceId?.title || 'Service'}
                      </span>
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                        {getServiceTypeLabel(booking.serviceType)}
                      </span>
                      {booking.feedbackRequest?.isSkipped && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                          Previously skipped
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 flex items-center gap-3 flex-wrap">
                      <span className="flex items-center gap-1">
                        <FaCalendarAlt className="text-xs" />
                        {booking.createdAt
                          ? new Date(booking.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </span>
                      {booking.hotelId?.name && (
                        <span>• {booking.hotelId.name}</span>
                      )}
                      <span className="font-mono text-xs text-gray-400">
                        #{booking.bookingNumber || booking._id?.slice(-8)}
                      </span>
                    </div>
                  </div>

                  {/* Rate Now Button */}
                  <button
                    onClick={() => handleRateNow(booking)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #67BAE0 0%, #3B5787 100%)' }}
                  >
                    <FaStar className="text-yellow-300 text-xs" />
                    Rate Now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">
              {feedback.length}
            </p>
            <p className="text-gray-600 text-sm">Total Reviews</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">
              {feedback.filter(f => f.rating >= 4).length}
            </p>
            <p className="text-gray-600 text-sm">Positive Reviews</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">
              {feedback.length > 0
                ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)
                : '0.0'
              }
            </p>
            <p className="text-gray-600 text-sm">Average Rating</p>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">Submitted Reviews</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search your feedback..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Ratings</option>
            <option value="5">5 Stars</option>
            <option value="4">4 Stars</option>
            <option value="3">3 Stars</option>
            <option value="2">2 Stars</option>
            <option value="1">1 Star</option>
          </select>

          {/* Service Type Filter */}
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Services</option>
            <option value="laundry">Laundry</option>
            <option value="transportation">Transportation</option>
            <option value="housekeeping">Housekeeping</option>
            <option value="dining">Dining</option>
          </select>
        </div>
      </div>

      {/* ── FEEDBACK LIST ── */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading your feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center">
            <FaComment className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600 mb-2">You haven't submitted any feedback yet</p>
            <p className="text-sm text-gray-500">Book a service and share your experience!</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(item.rating)}
                      <span className={`font-medium ${getStatusColor(item.rating)}`}>
                        {getRatingLabel(item.rating)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 flex items-center gap-2">
                      <FaCalendarAlt />
                      <span>
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDeleteFeedback(item._id)}
                      className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete feedback"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex flex-wrap items-center gap-2 text-sm mb-2">
                    <span className="text-gray-600">Hotel:</span>
                    <span className="font-medium text-gray-900">{item.hotelName}</span>

                    <span className="text-gray-400">•</span>

                    <span className="text-gray-600">Service:</span>
                    <span className="font-medium text-gray-900">{item.serviceName}</span>

                    {item.serviceType && (
                      <>
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.serviceType}
                        </span>
                      </>
                    )}
                  </div>

                  {item.serviceProviderName && (
                    <p className="text-sm text-gray-600">
                      Provider: <span className="font-medium">{item.serviceProviderName}</span>
                    </p>
                  )}
                </div>

                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{item.comment}</p>
                  </div>
                )}

                {/* Booking Reference */}
                {item.bookingId && (
                  <div className="mt-3 text-xs text-gray-500">
                    Booking Reference: {item.bookingId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * 10) + 1} to {Math.min(pagination.page * 10, pagination.total)} of {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Modal for rating a skipped booking */}
      {isFeedbackModalOpen && selectedBooking && (
        <FeedbackModal
          isOpen={isFeedbackModalOpen}
          onClose={handleModalClose}
          booking={selectedBooking}
          onFeedbackSubmitted={handleFeedbackSubmitted}
        />
      )}
    </div>
  );
};

export default GuestFeedbackView;
