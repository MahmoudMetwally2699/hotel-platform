/**
 * Service Provider Feedback View
 * Displays feedback for service provider's services
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaStar,
  FaChartBar,
  FaComments,
  FaCalendarAlt,
  FaUser,
  FaServicestack
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const ServiceProviderFeedback = () => {
  const { t } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    rating: '',
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const response = await apiClient.get(`/service/feedback?${queryParams}`);

      if (response.data.success) {
        setFeedbacks(response.data.data.feedbacks);
        setStatistics(response.data.data.statistics);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      setError(t('serviceProvider.feedback.loadError'));
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters, t]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
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

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'text-green-600';
    if (rating >= 3) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading && feedbacks.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('serviceProvider.feedback.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            <FaComments className="inline mr-3" style={{ color: '#3B5787' }} />
            {t('serviceProvider.feedback.title')}
          </h1>
          <p className="text-gray-600">
            {t('serviceProvider.feedback.subtitle')}
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('serviceProvider.feedback.statistics.averageRating')}</p>
                  <p className={`text-3xl font-bold ${getRatingColor(statistics.averageRating)}`}>
                    {statistics.averageRating || '0.0'}
                  </p>
                </div>
                <div style={{ color: '#67BAE0' }}>
                  <FaStar size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('serviceProvider.feedback.statistics.totalReviews')}</p>
                  <p className="text-3xl font-bold" style={{ color: '#3B5787' }}>
                    {statistics.totalFeedbacks || 0}
                  </p>
                </div>
                <div style={{ color: '#67BAE0' }}>
                  <FaChartBar size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{t('serviceProvider.feedback.statistics.fiveStarReviews')}</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statistics.ratingsDistribution?.[5] || 0}
                  </p>
                </div>
                <div className="text-green-500">
                  <FaStar size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceProvider.feedback.filters.rating')}
              </label>
              <select
                value={filters.rating}
                onChange={(e) => handleFilterChange('rating', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#67BAE0' }}
              >
                <option value="">{t('serviceProvider.feedback.filters.allRatings')}</option>
                <option value="5">{t('serviceProvider.feedback.filters.fiveStars')}</option>
                <option value="4">{t('serviceProvider.feedback.filters.fourStars')}</option>
                <option value="3">{t('serviceProvider.feedback.filters.threeStars')}</option>
                <option value="2">{t('serviceProvider.feedback.filters.twoStars')}</option>
                <option value="1">{t('serviceProvider.feedback.filters.oneStar')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceProvider.feedback.filters.status')}
              </label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#67BAE0' }}
              >
                <option value="active">{t('serviceProvider.feedback.filters.active')}</option>
                <option value="hidden">{t('serviceProvider.feedback.filters.hidden')}</option>
                <option value="flagged">{t('serviceProvider.feedback.filters.flagged')}</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('serviceProvider.feedback.filters.sortBy')}
              </label>
              <select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onChange={(e) => {
                  const [sortBy, sortOrder] = e.target.value.split('-');
                  handleFilterChange('sortBy', sortBy);
                  handleFilterChange('sortOrder', sortOrder);
                }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                style={{ focusRingColor: '#67BAE0' }}
              >
                <option value="createdAt-desc">{t('serviceProvider.feedback.filters.newestFirst')}</option>
                <option value="createdAt-asc">{t('serviceProvider.feedback.filters.oldestFirst')}</option>
                <option value="rating-desc">{t('serviceProvider.feedback.filters.highestRating')}</option>
                <option value="rating-asc">{t('serviceProvider.feedback.filters.lowestRating')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {t('serviceProvider.feedback.loadError')}
            </div>
          )}

          {feedbacks.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500">
              <FaComments className="mx-auto text-4xl mb-4 opacity-50" />
              <p>{t('serviceProvider.feedback.emptyState.noFeedback')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {renderStars(feedback.rating)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          feedback.status === 'active' ? 'bg-green-100 text-green-800' :
                          feedback.status === 'hidden' ? 'bg-gray-100 text-gray-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {feedback.status}
                        </span>
                      </div>

                      {/* Guest and Service Info */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <FaUser />
                          {feedback.guestName}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaServicestack />
                          {feedback.serviceId?.title || 'Service'}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaCalendarAlt />
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Comment */}
                      {feedback.comment && (
                        <div className="bg-gray-50 rounded-lg p-4 mb-3">
                          <p className="text-gray-700">{feedback.comment}</p>
                        </div>
                      )}

                      {/* Hotel Info */}
                      <p className="text-xs text-gray-500">
                        {t('serviceProvider.feedback.feedbackCard.hotel')}: {feedback.hotelId?.name || t('serviceProvider.feedback.feedbackCard.unknown')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-8">
            <nav className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('serviceProvider.feedback.pagination.previous')}
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg border ${
                    currentPage === page
                      ? 'border-transparent text-white'
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                  style={{
                    backgroundColor: currentPage === page ? '#3B5787' : 'transparent',
                    color: currentPage === page ? '#FFFFFF' : '#374151'
                  }}
                >
                  {page}
                </button>
              ))}

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-2 rounded-lg border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                {t('serviceProvider.feedback.pagination.next')}
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderFeedback;
