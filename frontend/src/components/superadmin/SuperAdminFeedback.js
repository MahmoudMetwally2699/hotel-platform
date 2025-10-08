/**
 * Super Admin Feedback Overview
 * Displays feedback across all hotels and service providers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaStar,
  FaChartBar,
  FaComments,
  FaCalendarAlt,
  FaUser,
  FaServicestack,
  FaBuilding,
  FaSearch
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const SuperAdminFeedback = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filters, setFilters] = useState({
    rating: '',
    serviceType: '',
    status: 'active',
    hotelId: '',
    search: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });

  const fetchFeedbacks = useCallback(async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        page: currentPage,
        limit: 50,
        ...filters
      });

      const response = await apiClient.get(`/superadmin/feedback?${queryParams}`);

      if (response.data.success) {
        setFeedbacks(response.data.data.feedbacks);
        setStatistics(response.data.data.statistics);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error) {
      setError('Failed to load feedback data');
    } finally {
      setLoading(false);
    }
  }, [currentPage, filters]);

  useEffect(() => {
    fetchFeedbacks();
  }, [fetchFeedbacks]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchFeedbacks();
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
            Platform Feedback Overview
          </h1>
          <p className="text-gray-600">
            Monitor guest feedback across all hotels and service providers
          </p>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">Platform Rating</p>
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
                  <p className="text-sm font-medium text-gray-500">Total Reviews</p>
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
                  <p className="text-sm font-medium text-gray-500">Low Ratings</p>
                  <p className="text-3xl font-bold text-red-600">
                    {(statistics.ratingsDistribution?.[1] || 0) + (statistics.ratingsDistribution?.[2] || 0)}
                  </p>
                </div>
                <div className="text-red-500">
                  <FaComments size={24} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="mb-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search feedback comments or guest names..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2"
                  style={{ focusRingColor: '#67BAE0' }}
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-white transition-colors"
                style={{ backgroundColor: '#3B5787' }}
              >
                <FaSearch />
              </button>
            </div>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
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
                <option value="">All</option>
                <option value="5">5★</option>
                <option value="4">4★</option>
                <option value="3">3★</option>
                <option value="2">2★</option>
                <option value="1">1★</option>
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
                <option value="createdAt-desc">Newest</option>
                <option value="createdAt-asc">Oldest</option>
                <option value="rating-desc">Highest Rated</option>
                <option value="rating-asc">Lowest Rated</option>
              </select>
            </div>
          </div>
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
              <p>No feedback found matching your criteria</p>
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

                      {/* Details */}
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <div className="flex items-center gap-1">
                          <FaUser />
                          {feedback.guestName}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaBuilding />
                          {feedback.hotelId?.name || 'Unknown Hotel'}
                        </div>
                        <div className="flex items-center gap-1">
                          <FaServicestack />
                          {feedback.serviceId?.title || 'Service'} - {feedback.serviceProviderId?.businessName || 'Provider'}
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

              {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => i + 1).map(page => (
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

export default SuperAdminFeedback;
