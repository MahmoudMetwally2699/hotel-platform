/**
 * Super Admin Feedback View Component
 * Shows feedback for all services across all hotels in the platform
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaUser, FaCalendarAlt, FaComment, FaSearch, FaBuilding, FaChartBar } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const SuperAdminFeedbackView = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState({});
  const [hotels, setHotels] = useState([]);
  const [filters, setFilters] = useState({
    rating: '',
    serviceType: 'all',
    hotel: '',
    serviceProvider: '',
    search: '',
    page: 1,
    dateFrom: '',
    dateTo: ''
  });

  const fetchHotels = useCallback(async () => {
    try {
      const response = await apiClient.get('/superadmin/hotels');
      if (response.data.success) {
        setHotels(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
    }
  }, []);

  const fetchFeedback = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.rating) params.append('rating', filters.rating);
      if (filters.serviceType !== 'all') params.append('serviceType', filters.serviceType);
      if (filters.hotel) params.append('hotel', filters.hotel);
      if (filters.serviceProvider) params.append('serviceProvider', filters.serviceProvider);
      if (filters.search) params.append('search', filters.search);
      if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
      if (filters.dateTo) params.append('dateTo', filters.dateTo);
      params.append('page', filters.page.toString());
      params.append('limit', '12');

      const response = await apiClient.get(`/superadmin/superadmin-feedback?${params.toString()}`);

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
    fetchHotels();
  }, [fetchHotels]);

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
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || '';
  };

  const getStatusColor = (rating) => {
    if (rating >= 4) return 'bg-green-100 text-green-800';
    if (rating >= 3) return 'bg-yellow-100 text-yellow-800';
    return 'bg-red-100 text-red-800';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Platform Feedback Analytics
        </h1>
        <p className="text-gray-600">
          Comprehensive feedback analysis across all hotels and services
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Platform Rating</p>
              <p className="text-xl font-bold text-blue-600">
                {statistics.averageRating || '0.0'}
              </p>
            </div>
            <FaStar className="text-blue-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Total Reviews</p>
              <p className="text-xl font-bold text-green-600">
                {statistics.totalCount || 0}
              </p>
            </div>
            <FaComment className="text-green-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Active Hotels</p>
              <p className="text-xl font-bold text-purple-600">
                {statistics.hotelsCount || 0}
              </p>
            </div>
            <FaBuilding className="text-purple-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Service Providers</p>
              <p className="text-xl font-bold text-orange-600">
                {statistics.serviceProvidersCount || 0}
              </p>
            </div>
            <FaChartBar className="text-orange-600" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Excellent (5★)</p>
              <p className="text-xl font-bold text-yellow-500">
                {statistics.ratingDistribution?.[5] || 0}
              </p>
            </div>
            <FaStar className="text-yellow-500" size={20} />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Critical (≤2★)</p>
              <p className="text-xl font-bold text-red-500">
                {(statistics.ratingDistribution?.[1] || 0) + (statistics.ratingDistribution?.[2] || 0)}
              </p>
            </div>
            <FaStar className="text-red-500" size={20} />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          {/* Search */}
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search feedback..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Hotel Filter */}
          <select
            value={filters.hotel}
            onChange={(e) => handleFilterChange('hotel', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Hotels</option>
            {hotels.map((hotel) => (
              <option key={hotel._id} value={hotel._id}>
                {hotel.name}
              </option>
            ))}
          </select>

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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Service Provider Filter */}
          <input
            type="text"
            placeholder="Service provider name..."
            value={filters.serviceProvider}
            onChange={(e) => handleFilterChange('serviceProvider', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Date From Filter */}
          <input
            type="date"
            placeholder="From date"
            value={filters.dateFrom}
            onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />

          {/* Date To Filter */}
          <input
            type="date"
            placeholder="To date"
            value={filters.dateTo}
            onChange={(e) => handleFilterChange('dateTo', e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-sm">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading feedback...</p>
          </div>
        ) : feedback.length === 0 ? (
          <div className="p-8 text-center">
            <FaComment className="text-gray-400 text-4xl mx-auto mb-4" />
            <p className="text-gray-600">No feedback found</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {feedback.map((item) => (
              <div key={item._id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      <FaUser className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {item.guestName || 'Anonymous'}
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
                    <p className={`text-sm mt-1 px-2 py-1 rounded-full ${getStatusColor(item.rating)}`}>
                      {getRatingLabel(item.rating)}
                    </p>
                  </div>
                </div>

                <div className="mb-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Hotel: </span>
                      <span className="font-medium text-gray-900">{item.hotelName}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Service: </span>
                      <span className="font-medium text-gray-900">{item.serviceName}</span>
                      {item.serviceType && (
                        <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                          {item.serviceType}
                        </span>
                      )}
                    </div>
                    {item.serviceProviderName && (
                      <div>
                        <span className="text-gray-600">Provider: </span>
                        <span className="font-medium text-gray-900">{item.serviceProviderName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {item.comment && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-3">
                    <p className="text-gray-700">{item.comment}</p>
                  </div>
                )}

                {/* Admin Actions */}
                <div className="flex gap-2 flex-wrap">
                  <button className="text-sm px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                    View Details
                  </button>
                  <button className="text-sm px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 transition-colors">
                    Hotel Dashboard
                  </button>
                  {item.rating <= 2 && (
                    <button className="text-sm px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                      Escalate Issue
                    </button>
                  )}
                  {item.rating >= 4 && (
                    <button className="text-sm px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                      Feature Review
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.pages > 1 && (
          <div className="p-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                Showing {((pagination.page - 1) * 12) + 1} to {Math.min(pagination.page * 12, pagination.total)} of {pagination.total} results
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleFilterChange('page', filters.page - 1)}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <span className="px-3 py-2 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
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
    </div>
  );
};

export default SuperAdminFeedbackView;
