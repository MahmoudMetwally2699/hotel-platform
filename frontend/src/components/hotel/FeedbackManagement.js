/**
 * Feedback Management Component for Hotel Admin
 * Displays and manages service feedback for the hotel
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaStar,
  FaFilter,
  FaEye,
  FaEyeSlash,
  FaFlag,
  FaCalendarAlt,
  FaUser,
  FaServicestack,
  FaChartBar,
  FaComments
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const FeedbackManagement = () => {
  const { t } = useTranslation();
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    rating: '',
    serviceType: '',
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage, filters]);

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...filters
      });

      const response = await apiClient.get(`/hotel/feedback?${queryParams}`);

      if (response.data.success) {
        setFeedbacks(response.data.data.feedbacks);
        setStatistics(response.data.data.statistics);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Failed to fetch feedbacks:', error);
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleStatusChange = async (feedbackId, newStatus, moderationNotes = '') => {
    try {
      const response = await apiClient.patch(`/feedback/${feedbackId}/status`, {
        status: newStatus,
        moderationNotes
      });

      if (response.data.success) {
        fetchFeedbacks(); // Refresh the list
      }
    } catch (error) {
      console.error('Failed to update feedback status:', error);
      setError('Failed to update feedback status');
    }
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

  const getServiceTypeColor = (serviceType) => {
    const colors = {
      laundry: 'bg-blue-100 text-blue-800',
      transportation: 'bg-green-100 text-green-800',
      restaurant: 'bg-purple-100 text-purple-800',
      housekeeping: 'bg-yellow-100 text-yellow-800',
      regular: 'bg-gray-100 text-gray-800',
    };
    return colors[serviceType] || colors.regular;
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
            <p className="mt-4 text-gray-600">Loading feedback data...</p>
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
            Service Feedback Management
          </h1>
          <p className="text-gray-600">
            Monitor and manage guest feedback for your hotel services
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Average Rating</p>
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
                  <p className="text-sm font-medium text-gray-500">Total Feedback</p>
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
                  <p className="text-sm font-medium text-gray-500">5-Star Reviews</p>
                  <p className="text-3xl font-bold text-green-600">
                    {statistics.ratingsDistribution?.[5] || 0}
                  </p>
                </div>
                <div className="text-green-500">
                  <FaStar size={24} />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Low Ratings (1-2★)</p>
                  <p className="text-3xl font-bold text-red-600">
                    {(statistics.ratingsDistribution?.[1] || 0) + (statistics.ratingsDistribution?.[2] || 0)}
                  </p>
                </div>
                <div className="text-red-500">
                  <FaFlag size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 mb-4 px-4 py-2 rounded-lg transition-colors"
            style={{
              backgroundColor: showFilters ? '#3B5787' : '#F8FAFC',
              color: showFilters ? '#FFFFFF' : '#3B5787'
            }}
          >
            <FaFilter />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating
                </label>
                <select
                  value={filters.rating}
                  onChange={(e) => handleFilterChange('rating', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{ focusRingColor: '#67BAE0' }}
                >
                  <option value="">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={filters.serviceType}
                  onChange={(e) => handleFilterChange('serviceType', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{ focusRingColor: '#67BAE0' }}
                >
                  <option value="">All Services</option>
                  <option value="laundry">Laundry</option>
                  <option value="transportation">Transportation</option>
                  <option value="restaurant">Restaurant</option>
                  <option value="housekeeping">Housekeeping</option>
                  <option value="regular">Regular</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2"
                  style={{ focusRingColor: '#67BAE0' }}
                >
                  <option value="active">Active</option>
                  <option value="hidden">Hidden</option>
                  <option value="flagged">Flagged</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
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
                  <option value="createdAt-desc">Newest First</option>
                  <option value="createdAt-asc">Oldest First</option>
                  <option value="rating-desc">Highest Rating</option>
                  <option value="rating-asc">Lowest Rating</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Feedback List */}
        <div className="bg-white rounded-lg shadow-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-4">
              {error}
            </div>
          )}

          {feedbacks.length === 0 && !loading ? (
            <div className="p-8 text-center text-gray-500">
              <FaComments className="mx-auto text-4xl mb-4 opacity-50" />
              <p>No feedback found for the current filters</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {feedbacks.map((feedback) => (
                <div key={feedback._id} className="p-6 hover:bg-gray-50">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      {/* Header */}
                      <div className="flex items-center gap-3 mb-3">
                        {renderStars(feedback.rating)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getServiceTypeColor(feedback.serviceType)}`}>
                          {feedback.serviceType || 'Regular'}
                        </span>
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

                      {/* Booking Reference */}
                      <p className="text-xs text-gray-500">
                        Booking: {feedback.bookingId?.bookingNumber || feedback.bookingId}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 lg:mt-0 lg:ml-4">
                      {feedback.status === 'active' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(feedback._id, 'hidden')}
                            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
                            title="Hide feedback"
                          >
                            <FaEyeSlash className="text-gray-600" />
                          </button>
                          <button
                            onClick={() => handleStatusChange(feedback._id, 'flagged', 'Flagged for review')}
                            className="p-2 rounded-lg border border-red-300 hover:bg-red-50 transition-colors"
                            title="Flag feedback"
                          >
                            <FaFlag className="text-red-600" />
                          </button>
                        </>
                      )}
                      {feedback.status === 'hidden' && (
                        <button
                          onClick={() => handleStatusChange(feedback._id, 'active')}
                          className="p-2 rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
                          title="Show feedback"
                        >
                          <FaEye className="text-green-600" />
                        </button>
                      )}
                      {feedback.status === 'flagged' && (
                        <button
                          onClick={() => handleStatusChange(feedback._id, 'active')}
                          className="p-2 rounded-lg border border-green-300 hover:bg-green-50 transition-colors"
                          title="Unflag feedback"
                        >
                          <FaEye className="text-green-600" />
                        </button>
                      )}
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
                Previous
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
                Next
              </button>
            </nav>
          </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackManagement;
