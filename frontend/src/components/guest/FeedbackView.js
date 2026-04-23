/**
 * Guest Feedback View Component
 * Shows pending (unrated) bookings + submitted feedback history
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaCalendarAlt, FaComment, FaSearch, FaTrash, FaClock, FaTshirt, FaCar, FaUtensils, FaConciergeBell } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import FeedbackModal from './FeedbackModal';
import { useTranslation } from 'react-i18next';

const GuestFeedbackView = () => {
  const { t } = useTranslation();
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
      toast.error(t('feedback.messages.loadError', 'Failed to load your feedback'));
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

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
    if (!window.confirm(t('feedback.messages.confirmDelete', 'Are you sure you want to delete this feedback?'))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/client/feedback/${feedbackId}`);
      if (response.data.success) {
        toast.success(t('feedback.messages.deleteSuccess', 'Feedback deleted successfully'));
        fetchFeedback();
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error(t('feedback.messages.deleteError', 'Failed to delete feedback'));
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
    toast.success(t('feedback.messages.thankYou', 'Thank you for your feedback!'));
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
      1: t('feedback.ratings.poor', 'Poor'),
      2: t('feedback.ratings.fair', 'Fair'),
      3: t('feedback.ratings.good', 'Good'),
      4: t('feedback.ratings.veryGood', 'Very Good'),
      5: t('feedback.ratings.excellent', 'Excellent')
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
      laundry: t('feedback.serviceTypes.laundry', 'Laundry'),
      transportation: t('feedback.serviceTypes.transportation', 'Transportation'),
      restaurant: t('feedback.serviceTypes.restaurant', 'Restaurant'),
      dining: t('feedback.serviceTypes.dining', 'Dining'),
      housekeeping: t('feedback.serviceTypes.housekeeping', 'Housekeeping'),
      regular: t('feedback.serviceTypes.service', 'Service')
    };
    return labels[serviceType] || serviceType || t('feedback.serviceTypes.service', 'Service');
  };

  return (
    <div className="p-3 sm:p-6 space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2">
          {t('feedback.title', 'My Feedback')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          {t('feedback.subtitle', 'Rate your past services and view your submitted reviews')}
        </p>
      </div>

      {/* ── PENDING REVIEWS SECTION ── */}
      {(unratedLoading || unratedBookings.length > 0) && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-amber-200">
          {/* Section Header */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 px-4 sm:px-6 py-3 sm:py-4 border-b border-amber-200 flex items-center gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <FaClock className="text-amber-600 text-base sm:text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-sm sm:text-base font-semibold text-amber-900">
                {t('feedback.pending.title', 'Pending Reviews')}
              </h2>
              <p className="text-xs sm:text-sm text-amber-700">
                {t('feedback.pending.subtitle', 'You have services waiting for your rating')}
              </p>
            </div>
            {!unratedLoading && (
              <span className="flex-shrink-0 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                {unratedBookings.length}
              </span>
            )}
          </div>

          {unratedLoading ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto" />
              <p className="mt-3 text-sm text-gray-500">
                {t('feedback.pending.loading', 'Loading pending reviews...')}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {unratedBookings.map((booking) => (
                <div
                  key={booking._id}
                  className="px-4 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 hover:bg-amber-50/40 transition-colors"
                >
                  {/* Top row on mobile: icon + info */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Service icon */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 text-base sm:text-lg">
                      {getServiceIcon(booking.serviceType)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-0.5">
                        <span className="font-medium text-sm sm:text-base text-gray-900 truncate">
                          {booking.serviceDetails?.name || booking.serviceId?.name || booking.serviceId?.title || t('feedback.serviceTypes.service', 'Service')}
                        </span>
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full capitalize">
                          {getServiceTypeLabel(booking.serviceType)}
                        </span>
                        {booking.feedbackRequest?.isSkipped && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                            {t('feedback.pending.previouslySkipped', 'Previously skipped')}
                          </span>
                        )}
                      </div>
                      <div className="text-xs sm:text-sm text-gray-500 flex items-center gap-2 sm:gap-3 flex-wrap">
                        <span className="flex items-center gap-1">
                          <FaCalendarAlt className="text-xs" />
                          {booking.createdAt
                            ? new Date(booking.createdAt).toLocaleDateString()
                            : t('common.notAvailable', 'N/A')}
                        </span>
                        {booking.hotelId?.name && (
                          <span>• {booking.hotelId.name}</span>
                        )}
                        <span className="font-mono text-xs text-gray-400">
                          #{booking.bookingNumber || booking._id?.slice(-8)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rate Now Button */}
                  <button
                    onClick={() => handleRateNow(booking)}
                    className="flex-shrink-0 self-stretch sm:self-center flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 rounded-lg text-white text-sm font-medium transition-all hover:opacity-90 active:scale-95"
                    style={{ background: 'linear-gradient(135deg, #67BAE0 0%, #3B5787 100%)' }}
                  >
                    <FaStar className="text-yellow-300 text-xs" />
                    {t('feedback.pending.rateNow', 'Rate Now')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── QUICK STATS ── */}
      <div className="grid grid-cols-3 gap-3 sm:gap-6">
        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-blue-600">
              {feedback.length}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm">{t('feedback.stats.totalReviews', 'Total Reviews')}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-green-600">
              {feedback.filter(f => f.rating >= 4).length}
            </p>
            <p className="text-gray-600 text-xs sm:text-sm">{t('feedback.stats.positiveReviews', 'Positive Reviews')}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-3 sm:p-6">
          <div className="text-center">
            <p className="text-xl sm:text-2xl font-bold text-yellow-500">
              {feedback.length > 0
                ? (feedback.reduce((acc, f) => acc + f.rating, 0) / feedback.length).toFixed(1)
                : '0.0'
              }
            </p>
            <p className="text-gray-600 text-xs sm:text-sm">{t('feedback.stats.averageRating', 'Average Rating')}</p>
          </div>
        </div>
      </div>

      {/* ── FILTERS ── */}
      <div className="bg-white rounded-lg shadow-sm p-4 sm:p-6">
        <h2 className="text-sm sm:text-base font-semibold text-gray-800 mb-3 sm:mb-4">
          {t('feedback.submittedReviews', 'Submitted Reviews')}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('feedback.filters.searchPlaceholder', 'Search your feedback...')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">{t('feedback.filters.allRatings', 'All Ratings')}</option>
            <option value="5">{t('feedback.filters.stars', '{{count}} Stars', { count: 5 })}</option>
            <option value="4">{t('feedback.filters.stars', '{{count}} Stars', { count: 4 })}</option>
            <option value="3">{t('feedback.filters.stars', '{{count}} Stars', { count: 3 })}</option>
            <option value="2">{t('feedback.filters.stars', '{{count}} Stars', { count: 2 })}</option>
            <option value="1">{t('feedback.filters.star', '{{count}} Star', { count: 1 })}</option>
          </select>

          {/* Service Type Filter */}
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="all">{t('feedback.filters.allServices', 'All Services')}</option>
            <option value="laundry">{t('feedback.serviceTypes.laundry', 'Laundry')}</option>
            <option value="transportation">{t('feedback.serviceTypes.transportation', 'Transportation')}</option>
            <option value="housekeeping">{t('feedback.serviceTypes.housekeeping', 'Housekeeping')}</option>
            <option value="dining">{t('feedback.serviceTypes.dining', 'Dining')}</option>
          </select>
        </div>
      </div>

      {/* ── FEEDBACK LIST ── */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-6 sm:p-8 text-center">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-sm sm:text-base text-gray-600">
              {t('feedback.loading', 'Loading your feedback...')}
            </p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-6 sm:p-8 text-center">
            <FaComment className="text-gray-400 text-3xl sm:text-4xl mx-auto mb-3 sm:mb-4" />
            <p className="text-sm sm:text-base text-gray-600 mb-2">
              {t('feedback.empty.title', "You haven't submitted any feedback yet")}
            </p>
            <p className="text-xs sm:text-sm text-gray-500">
              {t('feedback.empty.subtitle', 'Book a service and share your experience!')}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div key={item._id} className="p-4 sm:p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3 sm:mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2">
                      {renderStars(item.rating)}
                      <span className={`text-sm sm:text-base font-medium ${getStatusColor(item.rating)}`}>
                        {getRatingLabel(item.rating)}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
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
                      title={t('feedback.actions.delete', 'Delete feedback')}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs sm:text-sm mb-2">
                    <span className="text-gray-600">{t('feedback.labels.hotel', 'Hotel')}:</span>
                    <span className="font-medium text-gray-900">{item.hotelName}</span>

                    <span className="text-gray-400">•</span>

                    <span className="text-gray-600">{t('feedback.labels.service', 'Service')}:</span>
                    <span className="font-medium text-gray-900">{item.serviceName}</span>

                    {item.serviceType && (
                      <>
                        <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {getServiceTypeLabel(item.serviceType)}
                        </span>
                      </>
                    )}
                  </div>

                  {item.serviceProviderName && (
                    <p className="text-xs sm:text-sm text-gray-600">
                      {t('feedback.labels.provider', 'Provider')}: <span className="font-medium">{item.serviceProviderName}</span>
                    </p>
                  )}
                </div>

                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                    <p className="text-sm sm:text-base text-gray-700">{item.comment}</p>
                  </div>
                )}

                {/* Booking Reference */}
                {item.bookingId && (
                  <div className="mt-2 sm:mt-3 text-xs text-gray-500">
                    {t('feedback.labels.bookingRef', 'Booking Reference')}: {item.bookingId}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-4 sm:p-6 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <p className="text-xs sm:text-sm text-gray-600">
                {t('feedback.pagination.showing', 'Showing {{from}} to {{to}} of {{total}} results', {
                  from: ((pagination.page - 1) * 10) + 1,
                  to: Math.min(pagination.page * 10, pagination.total),
                  total: pagination.total
                })}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('feedback.pagination.previous', 'Previous')}
                </button>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('feedback.pagination.next', 'Next')}
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
