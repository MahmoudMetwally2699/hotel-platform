/**
 * Provider Analytics Page
 * Hotel admins can view analytics for service providers in their hotel
 */

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { HOTEL_API } from '../../config/api.config';

const ProviderAnalyticsPage = () => {
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      try {
        setLoading(true);
        const response = await axios.get(HOTEL_API.MANAGE_PROVIDERS);
        setProviders(response.data);

        // Auto-select the first provider
        if (response.data.length > 0) {
          setSelectedProvider(response.data[0]._id);
        }

        setLoading(false);
      } catch (err) {
        setError('Failed to load service providers');
        toast.error('Failed to load service providers');
        setLoading(false);
        console.error('Error fetching providers:', err);
      }
    };

    fetchProviders();
  }, []);

  // Fetch analytics when provider or timeframe changes
  useEffect(() => {
    if (!selectedProvider) return;

    const fetchAnalytics = async () => {
      try {
        setAnalyticsLoading(true);        const response = await axios.get(
          `${HOTEL_API.PROVIDER_ANALYTICS}/${selectedProvider}`,
          { params: { timeframe } }
        );
        setAnalytics(response.data);
        setAnalyticsLoading(false);
      } catch (err) {
        toast.error('Failed to load provider analytics');
        console.error('Error fetching analytics:', err);
        setAnalyticsLoading(false);
      }
    };

    fetchAnalytics();
  }, [selectedProvider, timeframe]);

  // Calculate performance metrics
  const performanceMetrics = useMemo(() => {
    if (!analytics) return null;

    const {
      totalBookings = 0,
      completedBookings = 0,
      cancelledBookings = 0,
      totalRevenue = 0,
      hotelRevenue = 0,
      avgRating = 0,
      customerSatisfaction = 0
    } = analytics;

    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings) * 100 : 0;

    return {
      completionRate,
      cancellationRate,
      totalRevenue,
      hotelRevenue,
      avgRating,
      customerSatisfaction
    };
  }, [analytics]);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading providers...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Service Provider Analytics</h1>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <label htmlFor="provider-select" className="block text-sm font-medium text-gray-700 mb-1">
              Select Provider
            </label>
            <select
              id="provider-select"
              value={selectedProvider || ''}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              {providers.map(provider => (
                <option key={provider._id} value={provider._id}>
                  {provider.name} ({provider.serviceType})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="timeframe-select" className="block text-sm font-medium text-gray-700 mb-1">
              Timeframe
            </label>
            <select
              id="timeframe-select"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="week">Last 7 Days</option>
              <option value="month">Last 30 Days</option>
              <option value="quarter">Last 3 Months</option>
              <option value="year">Last 12 Months</option>
            </select>
          </div>
        </div>
      </div>

      {analyticsLoading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-500">Loading analytics...</p>
        </div>
      ) : (
        selectedProvider && analytics ? (
          <>
            {/* Performance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Bookings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">{analytics.totalBookings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completion Rate</p>
                    <p className="text-2xl font-bold">{performanceMetrics.completionRate.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Completed</p>
                    <p className="text-xl font-medium text-green-600">{analytics.completedBookings}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Cancelled</p>
                    <p className="text-xl font-medium text-red-600">{analytics.cancelledBookings}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Revenue</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total</p>
                    <p className="text-2xl font-bold">${performanceMetrics.totalRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Hotel Share</p>
                    <p className="text-2xl font-bold">${performanceMetrics.hotelRevenue.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Avg. Order Value</p>
                    <p className="text-xl font-medium">
                      ${analytics.totalBookings > 0
                        ? (performanceMetrics.totalRevenue / analytics.totalBookings).toFixed(2)
                        : '0.00'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Margin %</p>
                    <p className="text-xl font-medium">
                      {performanceMetrics.totalRevenue > 0
                        ? ((performanceMetrics.hotelRevenue / performanceMetrics.totalRevenue) * 100).toFixed(1)
                        : '0.0'}%
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white shadow-md rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-2">Customer Satisfaction</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Rating</p>
                    <div className="flex items-center mt-1">
                      <p className="text-2xl font-bold mr-1">{performanceMetrics.avgRating.toFixed(1)}</p>
                      <div className="text-yellow-400">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Satisfaction</p>
                    <p className="text-2xl font-bold">{performanceMetrics.customerSatisfaction.toFixed(1)}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reviews</p>
                    <p className="text-xl font-medium">{analytics.reviewCount || 0}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Repeat Customers</p>
                    <p className="text-xl font-medium">{analytics.repeatCustomerRate || 0}%</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Trends */}
            <div className="bg-white shadow-md rounded-lg p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4">Booking Trends</h3>
              <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
                <p className="text-gray-500">Booking trends chart will be displayed here</p>
                {/* In a real implementation, use a chart library like Chart.js or Recharts */}
              </div>
            </div>

            {/* Top Services */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Top Services</h3>
                <p className="text-sm text-gray-500">Best performing services by revenue</p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Rating</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analytics.topServices && analytics.topServices.length > 0 ? (
                      analytics.topServices.map((service, index) => (
                        <tr key={service.id || index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{service.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">{service.bookings}</td>
                          <td className="px-6 py-4 whitespace-nowrap">${service.revenue.toFixed(2)}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <span className="mr-1">{service.rating.toFixed(1)}</span>
                              <span className="text-yellow-400">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              </span>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                          No service data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer Reviews */}
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold">Latest Reviews</h3>
              </div>

              {analytics.latestReviews && analytics.latestReviews.length > 0 ? (
                <div className="divide-y divide-gray-200">
                  {analytics.latestReviews.map((review, index) => (
                    <div key={review.id || index} className="p-6">
                      <div className="flex items-center mb-2">
                        <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-4 w-4"
                              viewBox="0 0 20 20"
                              fill={i < review.rating ? 'currentColor' : 'none'}
                              stroke={i >= review.rating ? 'currentColor' : 'none'}
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <span className="text-sm text-gray-500 ml-2">
                          {review.userName} • {new Date(review.date).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-gray-700">{review.comment}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500">
                  No reviews available
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="bg-white shadow-md rounded-lg p-6 text-center">
            <p className="text-gray-500">Select a provider to view analytics</p>
          </div>
        )
      )}
    </div>
  );
};

export default ProviderAnalyticsPage;
