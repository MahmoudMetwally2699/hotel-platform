/**
 * Service Provider Feedback View Component
 * Shows feedback for services provided by the current service provider
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar, FaUser, FaCalendarAlt, FaComment, FaSearch } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const ServiceProviderFeedbackView = () => {
  const { t } = useTranslation();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    rating: '',
    serviceType: 'all',
    search: '',
    page: 1
  });

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.serviceType !== 'all') params.append('serviceType', filters.serviceType);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', '10');

      const response = await apiClient.get(`/service/service-feedback?${params.toString()}`);

      if (response.data.success) {
        setFeedback(response.data.data.feedbacks || []);
        setPagination(response.data.data.pagination || {});
        setStatistics(response.data.data.statistics || {});
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error(t('serviceProvider.feedback.loadErrorToast'));
      // Set empty defaults on error
      setFeedback([]);
      setPagination({});
      setStatistics({});
    } finally {
      setLoading(false);
    }
  }, [filters, t]);

  useEffect(() => {
    fetchFeedback();
  }, [fetchFeedback]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
    }));
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
      1: t('feedback.rating1'),
      2: t('feedback.rating2'),
      3: t('feedback.rating3'),
      4: t('feedback.rating4'),
      5: t('feedback.rating5')
    };
    return labels[rating] || '';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          {t('serviceProvider.feedback.title')}
        </h1>
        <p className="text-gray-600">
          {t('serviceProvider.feedback.subtitle')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('serviceProvider.feedback.statistics.averageRating')}</p>
              <p className="text-2xl font-bold text-blue-600">
                {statistics.averageRating || '0.0'}
              </p>
            </div>
            <div className="text-blue-600">
              <FaStar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('serviceProvider.feedback.statistics.totalReviews')}</p>
              <p className="text-2xl font-bold text-green-600">
                {statistics.totalCount || 0}
              </p>
            </div>
            <div className="text-green-600">
              <FaComment size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('serviceProvider.feedback.statistics.fiveStarReviews')}</p>
              <p className="text-2xl font-bold text-yellow-500">
                {statistics.ratingDistribution?.[5] || 0}
              </p>
            </div>
            <div className="text-yellow-500">
              <FaStar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('serviceProvider.feedback.statistics.lowRatings')}</p>
              <p className="text-2xl font-bold text-red-500">
                {(statistics.ratingDistribution?.[1] || 0) + (statistics.ratingDistribution?.[2] || 0)}
              </p>
            </div>
            <div className="text-red-500">
              <FaStar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-64">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t('serviceProvider.feedback.filters.searchPlaceholder')}
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">{t('serviceProvider.feedback.filters.allRatings')}</option>
            <option value="5">{t('serviceProvider.feedback.filters.fiveStars')}</option>
            <option value="4">{t('serviceProvider.feedback.filters.fourStars')}</option>
            <option value="3">{t('serviceProvider.feedback.filters.threeStars')}</option>
            <option value="2">{t('serviceProvider.feedback.filters.twoStars')}</option>
            <option value="1">{t('serviceProvider.feedback.filters.oneStar')}</option>
          </select>

          {/* Service Type Filter */}
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">{t('serviceProvider.feedback.filters.allServices')}</option>
            <option value="laundry">{t('serviceProvider.feedback.filters.laundry')}</option>
            <option value="transportation">{t('serviceProvider.feedback.filters.transportation')}</option>
            <option value="housekeeping">{t('serviceProvider.feedback.filters.housekeeping')}</option>
            <option value="dining">{t('serviceProvider.feedback.filters.dining')}</option>
          </select>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">{t('serviceProvider.feedback.emptyState.loadingFeedback')}</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center">
            <FaComment className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">{t('serviceProvider.feedback.emptyState.noFeedback')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.guestName || t('serviceProvider.feedback.feedbackCard.anonymous')}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FaCalendarAlt />
                        <span>
                          {new Date(item.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {renderStars(item.rating)}
                    <p className="text-sm text-gray-600 mt-1">
                      {getRatingLabel(item.rating)}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-sm text-gray-600 mb-1">
                    {t('serviceProvider.feedback.feedbackCard.service')}: <span className="font-medium">{item.serviceName}</span>
                    {item.serviceType && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                        {item.serviceType}
                      </span>
                    )}
                  </p>
                </div>

                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{item.comment}</p>
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
                {t('serviceProvider.feedback.pagination.showing', {
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
                  {t('serviceProvider.feedback.pagination.previous')}
                </button>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('serviceProvider.feedback.pagination.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderFeedbackView;
