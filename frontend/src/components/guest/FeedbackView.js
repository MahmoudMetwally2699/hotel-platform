/**
 * Guest Feedback View Component
 * Shows feedback history for the logged-in guest
 */

import React, { useState, useEffect, useCallback } from 'react';
import { FaStar, FaCalendarAlt, FaComment, FaSearch, FaEdit, FaTrash } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const GuestFeedbackView = () => {
  const [feedback, setFeedback] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});
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
    fetchFeedback();
  }, [fetchFeedback]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1 // Reset to first page when filtering
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
        fetchFeedback(); // Refresh the list
      }
    } catch (error) {
      console.error('Error deleting feedback:', error);
      toast.error('Failed to delete feedback');
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          My Feedback History
        </h1>
        <p className="text-gray-600">
          View and manage your service feedback and reviews
        </p>
      </div>

      {/* Quick Stats */}
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
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

      {/* Feedback List */}
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
                      className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                      title="Edit feedback"
                    >
                      <FaEdit />
                    </button>
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
    </div>
  );
};

export default GuestFeedbackView;
