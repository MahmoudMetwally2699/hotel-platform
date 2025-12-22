/**
 * Hotel Admin Feedback View Component
 * Shows feedback for all services in the hotel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar, FaUser, FaCalendarAlt, FaComment, FaSearch, FaBuilding } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';

const HotelFeedbackView = () => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});
  const [filters, setFilters] = useState({
    rating: '',
    serviceType: 'all',
    serviceProvider: '',
    search: '',
    page: 1
  });

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.serviceType !== 'all') params.append('serviceType', filters.serviceType);
      if (filters.serviceProvider) params.append('serviceProvider', filters.serviceProvider);
      if (filters.search) params.append('search', filters.search);
      params.append('page', filters.page.toString());
      params.append('limit', '10');

      const response = await apiClient.get(`/hotel/hotel-feedback?${params.toString()}`);

      if (response.data.success) {
        setFeedback(response.data.data.feedbacks || []);
        setPagination(response.data.data.pagination || {});
        setStatistics(response.data.data.statistics || {});
      }
    } catch (error) {
      console.error('Error fetching feedback:', error);
      toast.error('Failed to load feedback');
      // Set empty defaults on error
      setFeedback([]);
      setPagination({});
      setStatistics({});
    } finally {
      setLoading(false);
    }
  }, [filters]);

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
      1: t('hotelAdmin.feedback.ratings.poor'),
      2: t('hotelAdmin.feedback.ratings.fair'),
      3: t('hotelAdmin.feedback.ratings.good'),
      4: t('hotelAdmin.feedback.ratings.veryGood'),
      5: t('hotelAdmin.feedback.ratings.excellent')
    };
    return labels[rating] || '';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-2" style={{ color: theme.primaryColor }}>
          {t('hotelAdmin.feedback.title')}
        </h1>
        <p className="text-gray-600">
          {t('hotelAdmin.feedback.subtitle')}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('hotelAdmin.feedback.statistics.overallRating')}</p>
              <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
                {statistics.averageRating || '0.0'}
              </p>
            </div>
            <div style={{ color: theme.primaryColor }}>
              <FaStar size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('hotelAdmin.feedback.statistics.totalReviews')}</p>
              <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
                {statistics.totalCount || 0}
              </p>
            </div>
            <div style={{ color: theme.primaryColor }}>
              <FaComment size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('hotelAdmin.feedback.statistics.serviceProviders')}</p>
              <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
                {statistics.serviceProvidersCount || 0}
              </p>
            </div>
            <div style={{ color: theme.primaryColor }}>
              <FaBuilding size={24} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">{t('hotelAdmin.feedback.statistics.excellent')}</p>
              <p className="text-2xl font-bold" style={{ color: theme.primaryColor }}>
                {(statistics.ratingDistribution && statistics.ratingDistribution[5]) || 0}
              </p>
            </div>
            <div style={{ color: theme.primaryColor }}>
              <FaStar size={24} />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder={t('hotelAdmin.feedback.filters.searchPlaceholder')}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
              onFocus={(e) => e.target.style.setProperty('--tw-ring-opacity', '1')}
            />
          </div>

          {/* Rating Filter */}
          <select
            value={filters.rating}
            onChange={(e) => handleFilterChange('rating', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          >
            <option value="">{t('hotelAdmin.feedback.filters.allRatings')}</option>
            <option value="5">{t('hotelAdmin.feedback.filters.5stars')}</option>
            <option value="4">{t('hotelAdmin.feedback.filters.4stars')}</option>
            <option value="3">{t('hotelAdmin.feedback.filters.3stars')}</option>
            <option value="2">{t('hotelAdmin.feedback.filters.2stars')}</option>
            <option value="1">{t('hotelAdmin.feedback.filters.1star')}</option>
          </select>

          {/* Service Type Filter */}
          <select
            value={filters.serviceType}
            onChange={(e) => handleFilterChange('serviceType', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          >
            <option value="all">{t('hotelAdmin.feedback.filters.allServices')}</option>
            <option value="laundry">{t('hotelAdmin.feedback.filters.laundry')}</option>
            <option value="transportation">{t('hotelAdmin.feedback.filters.transportation')}</option>
            <option value="housekeeping">{t('hotelAdmin.feedback.filters.housekeeping')}</option>
            <option value="dining">{t('hotelAdmin.feedback.filters.dining')}</option>
          </select>

          {/* Service Provider Filter */}
          <input
            type="text"
            placeholder={t('hotelAdmin.feedback.filters.providerPlaceholder')}
            value={filters.serviceProvider}
            onChange={(e) => handleFilterChange('serviceProvider', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:border-transparent"
          />
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto" style={{ borderColor: '#3B5787' }}></div>
            <p className="mt-4 text-gray-600">{t('hotelAdmin.feedback.loading')}</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center">
            <FaComment className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">{t('hotelAdmin.feedback.noFeedback')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: '#E8EDF4', color: '#3B5787' }}>
                      <FaUser />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {(() => {
                          if (!item.guestName) return t('hotelAdmin.feedback.anonymous');

                          // Split the name and check for duplicates
                          const nameParts = item.guestName.trim().split(' ').filter(Boolean);

                          // If we have exactly 2 parts and they're the same, show only one
                          if (nameParts.length === 2 && nameParts[0] === nameParts[1]) {
                            return nameParts[0];
                          }

                          // Otherwise return the full name
                          return item.guestName;
                        })()}
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
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-gray-600">{t('hotelAdmin.feedback.service')}:</span>
                    <span className="font-medium text-gray-900">{item.serviceName}</span>

                    {item.serviceType && (
                      <span className="px-2 py-1 rounded-full text-xs" style={{ backgroundColor: '#E8EDF4', color: '#3B5787' }}>
                        {item.serviceType}
                      </span>
                    )}

                    {item.serviceProviderName && (
                      <>
                        <span className="text-gray-400">•</span>
                        <span className="text-gray-600">{t('hotelAdmin.feedback.provider')}:</span>
                        <span className="font-medium text-gray-900">{item.serviceProviderName}</span>
                      </>
                    )}
                  </div>
                </div>

                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-gray-700">{item.comment}</p>
                  </div>
                )}

                {/* Quick Actions for Hotel Admin */}
                {item.rating <= 2 && (
                  <div className="mt-3 flex gap-2">
                    <button className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                      {t('hotelAdmin.feedback.actions.followUp')}
                    </button>
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
                {t('hotelAdmin.feedback.pagination.showing', {
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
                  {t('hotelAdmin.feedback.pagination.previous')}
                </button>
                <button
                  onClick={() => handleFilterChange('page', filters.page + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  {t('hotelAdmin.feedback.pagination.next')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelFeedbackView;
