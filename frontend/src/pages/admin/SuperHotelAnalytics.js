import React, { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { API_BASE_URL } from '../../config/api.config';
import PaymentAnalytics from '../../components/superadmin/PaymentAnalytics';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
} from 'chart.js';
import { Bar, Line, Doughnut } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  TimeScale
);

const SuperHotelAnalytics = () => {
  const [analyticsData, setAnalyticsData] = useState(null);
  const [availableHotels, setAvailableHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const [selectedHotel, setSelectedHotel] = useState('all');
  const [activeTab, setActiveTab] = useState('overview');

  // Fetch available hotels for dropdown (independent of analytics filter)
  const fetchAvailableHotels = useCallback(async () => {
    try {
      console.log('🏨 Fetching available hotels...');

      // Get SuperHotel token from localStorage
      const superHotelToken = localStorage.getItem('superHotelToken');

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if token exists
      if (superHotelToken) {
        headers['Authorization'] = `Bearer ${superHotelToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/admin/hotels`, {
        method: 'GET',
        headers,
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('🏨 Available hotels data:', data);
        // Extract hotels from nested data structure: data.data.hotels
        const hotels = data.data?.hotels || data.hotels || [];
        console.log('🏨 Extracted hotels:', hotels);
        setAvailableHotels(hotels);
      } else {
        console.error('🏨 Failed to fetch hotels:', response.status);
      }
    } catch (error) {
      console.error('🏨 Error fetching hotels:', error);
      // Set as empty array on error to prevent map() issues
      setAvailableHotels([]);
    }
  }, []);

  const fetchAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching analytics data...');
      console.log(' API_BASE_URL:', API_BASE_URL);

      // Get SuperHotel token from localStorage
      const superHotelToken = localStorage.getItem('superHotelToken');

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if token exists
      if (superHotelToken) {
        headers['Authorization'] = `Bearer ${superHotelToken}`;
      }

      const params = new URLSearchParams({
        timeRange,
        ...(selectedHotel !== 'all' && { hotelId: selectedHotel })
      });

      console.log('🔗 Request URL:', `${API_BASE_URL}/admin/analytics/comprehensive?${params}`);

      const response = await fetch(`${API_BASE_URL}/admin/analytics/comprehensive?${params}`, {
        method: 'GET',
        headers,
        credentials: 'include' // Fallback to cookies
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        if (response.status === 401) {
          // Redirect to login if unauthorized
          toast.error('Session expired. Please log in again.');
          window.location.href = '/super-hotel-admin/login';
          return;
        }
        throw new Error(`Failed to fetch analytics data: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      console.log('✅ Analytics data received:', data);
      setAnalyticsData(data.data);
    } catch (error) {
      console.error('❌ Error fetching analytics:', error);
      toast.error(`Failed to load analytics data: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [timeRange, selectedHotel]);

  useEffect(() => {
    fetchAvailableHotels();
  }, [fetchAvailableHotels]); // Include fetchAvailableHotels in dependency array

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const exportData = async (format = 'json') => {
    try {
      // Get SuperHotel token from localStorage
      const superHotelToken = localStorage.getItem('superHotelToken');

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if token exists
      if (superHotelToken) {
        headers['Authorization'] = `Bearer ${superHotelToken}`;
      }

      const params = new URLSearchParams({
        timeRange,
        format,
        ...(selectedHotel !== 'all' && { hotelId: selectedHotel })
      });

      const response = await fetch(`${API_BASE_URL}/admin/analytics/export?${params}`, {
        method: 'GET',
        headers,
        credentials: 'include' // Use cookie-based authentication
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error('Session expired. Please log in again.');
          window.location.href = '/super-hotel-admin/login';
          return;
        }
        throw new Error('Failed to export data');
      }      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}days-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      } else {
        const data = await response.json();
        const dataStr = JSON.stringify(data, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${timeRange}days-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('Data exported successfully');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <div className="max-w-md mx-auto">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">📊</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Analytics Data Available</h3>
            <p className="text-gray-600 mb-4">
              Please make sure you are logged in and have access to hotel data.
            </p>
            <div className="space-y-2 text-sm text-gray-500">
              <p>• Check if you are logged in as a Super Hotel Admin</p>
              <p>• Verify your account has assigned hotels</p>
              <p>• Ensure there is booking data in the selected time range</p>
            </div>
          </div>
          <div className="space-x-3">
            <button
              onClick={fetchAnalyticsData}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Retry
            </button>
            <a
              href="/super-hotel-admin/login"
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors inline-block"
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Chart data preparations
  const hotelTrackingChart = {
    labels: analyticsData.analytics.hotelTracking?.map(h => h.hotelName) || [],
    datasets: [
      {
        label: 'Total Revenue',
        data: analyticsData.analytics.hotelTracking?.map(h => h.totalRevenue) || [],
        backgroundColor: 'rgba(54, 162, 235, 0.6)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
        yAxisID: 'y'
      },
      {
        label: 'Total Bookings',
        data: analyticsData.analytics.hotelTracking?.map(h => h.totalBookings) || [],
        backgroundColor: 'rgba(255, 99, 132, 0.6)',
        borderColor: 'rgba(255, 99, 132, 1)',
        borderWidth: 1,
        yAxisID: 'y1'
      }
    ]
  };

  const processingTimeChart = {
    labels: analyticsData.analytics.orderProcessingTimes?.map(item =>
      `${item._id.hotelName} - ${item._id.category}`
    ) || [],
    datasets: [{
      label: 'Average Processing Time (minutes)',
      data: analyticsData.analytics.orderProcessingTimes?.map(item => item.averageProcessingTime) || [],
      backgroundColor: analyticsData.analytics.orderProcessingTimes?.map(item =>
        item.averageProcessingTime <= 30 ? 'rgba(34, 197, 94, 0.6)' :
        item.averageProcessingTime <= 60 ? 'rgba(251, 191, 36, 0.6)' :
        'rgba(239, 68, 68, 0.6)'
      ) || [],
      borderColor: analyticsData.analytics.orderProcessingTimes?.map(item =>
        item.averageProcessingTime <= 30 ? 'rgba(34, 197, 94, 1)' :
        item.averageProcessingTime <= 60 ? 'rgba(251, 191, 36, 1)' :
        'rgba(239, 68, 68, 1)'
      ) || [],
      borderWidth: 1
    }]
  };

  const housekeepingIssuesChart = {
    labels: analyticsData.analytics.housekeepingIssues?.map(issue => issue.categoryLabel) || [],
    datasets: [{
      label: 'Total Issues',
      data: analyticsData.analytics.housekeepingIssues?.map(issue => issue.totalIssues) || [],
      backgroundColor: [
        'rgba(239, 68, 68, 0.6)',   // Red for electrical
        'rgba(59, 130, 246, 0.6)',  // Blue for plumbing
        'rgba(34, 197, 94, 0.6)',   // Green for AC
        'rgba(251, 191, 36, 0.6)',  // Yellow for furniture
        'rgba(147, 51, 234, 0.6)',  // Purple for electronics
        'rgba(236, 72, 153, 0.6)',  // Pink for general cleaning
        'rgba(14, 165, 233, 0.6)',  // Sky for deep cleaning
        'rgba(168, 85, 247, 0.6)',  // Violet for stain removal
        'rgba(34, 197, 94, 0.6)',   // Emerald for bathroom
        'rgba(249, 115, 22, 0.6)',  // Orange for room supplies
        'rgba(156, 163, 175, 0.6)'  // Gray for cleaning supplies
      ],
      borderColor: [
        'rgba(239, 68, 68, 1)',
        'rgba(59, 130, 246, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(251, 191, 36, 1)',
        'rgba(147, 51, 234, 1)',
        'rgba(236, 72, 153, 1)',
        'rgba(14, 165, 233, 1)',
        'rgba(168, 85, 247, 1)',
        'rgba(34, 197, 94, 1)',
        'rgba(249, 115, 22, 1)',
        'rgba(156, 163, 175, 1)'
      ],
      borderWidth: 1
    }]
  };

  const revenueDistributionChart = {
    labels: analyticsData.analytics.revenueDistribution?.map(item =>
      `${item._id.hotelName} - Week ${item._id.week}`
    ).slice(0, 10) || [], // Show only recent 10 weeks
    datasets: [{
      label: 'Total Revenue',
      data: analyticsData.analytics.revenueDistribution?.map(item => item.totalRevenue).slice(0, 10) || [],
      borderColor: 'rgba(54, 162, 235, 1)',
      backgroundColor: 'rgba(54, 162, 235, 0.2)',
      tension: 0.1
    }, {
      label: 'Hotel Earnings',
      data: analyticsData.analytics.revenueDistribution?.map(item => item.hotelEarnings).slice(0, 10) || [],
      borderColor: 'rgba(34, 197, 94, 1)',
      backgroundColor: 'rgba(34, 197, 94, 0.2)',
      tension: 0.1
    }]
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'hotels', label: 'Hotel Performance', icon: '🏨' },
    { id: 'processing', label: 'Processing Times', icon: '⏱️' },
    { id: 'housekeeping', label: 'Housekeeping Issues', icon: '🧹' },
    { id: 'revenue', label: 'Revenue Trends', icon: '💰' },
    { id: 'providers', label: 'Service Providers', icon: '👥' },
    { id: 'payments', label: 'Payment Management', icon: '💳' }
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Comprehensive Analytics</h1>
        <p className="text-gray-600">Detailed insights into hotel performance and service analytics</p>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Hotel Filter</label>
            <select
              value={selectedHotel}
              onChange={(e) => setSelectedHotel(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Hotels</option>
              {Array.isArray(availableHotels) && availableHotels.map(hotel => (
                <option key={hotel._id} value={hotel._id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto">
            <label className="block text-sm font-medium text-gray-700 mb-1">Export Data</label>
            <div className="flex gap-2">
              <button
                onClick={() => exportData('json')}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Export JSON
              </button>
              <button
                onClick={() => exportData('csv')}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Hotels</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalHotels}</p>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🏨</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Bookings</p>
              <p className="text-3xl font-bold text-gray-900">{analyticsData.summary.totalBookings.toLocaleString()}</p>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">📋</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-3xl font-bold text-gray-900">${analyticsData.summary.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600">Avg Processing Time</p>
              <p className="text-3xl font-bold text-gray-900">{Math.round(analyticsData.summary.averageProcessingTime)}m</p>
            </div>
            <div className="ml-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Hotel Performance Overview</h3>
                  <div className="h-64">
                    <Bar
                      data={hotelTrackingChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Revenue vs Bookings by Hotel'
                          }
                        },
                        scales: {
                          y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            title: {
                              display: true,
                              text: 'Revenue ($)'
                            }
                          },
                          y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            title: {
                              display: true,
                              text: 'Bookings Count'
                            },
                            grid: {
                              drawOnChartArea: false,
                            },
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Processing Time Analysis</h3>
                  <div className="h-64">
                    <Bar
                      data={processingTimeChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: true,
                            text: 'Average Processing Time by Hotel & Category'
                          }
                        },
                        scales: {
                          x: {
                            ticks: {
                              maxRotation: 45
                            }
                          },
                          y: {
                            title: {
                              display: true,
                              text: 'Minutes'
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Hotels Tab - Show detailed performance table */}
          {activeTab === 'hotels' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Hotel Performance Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel Earnings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Order Value</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Guests</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.analytics.hotelTracking?.map((hotel, index) => (
                      <tr key={hotel._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {hotel.hotelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hotel.totalBookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hotel.completedBookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-green-600 h-2 rounded-full"
                                style={{ width: `${hotel.completionRate}%` }}
                              ></div>
                            </div>
                            <span>{Math.round(hotel.completionRate)}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${hotel.totalRevenue?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${hotel.hotelEarnings?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${Math.round(hotel.averageOrderValue || 0)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {hotel.uniqueGuestCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Processing Tab - Shows order processing times */}
          {activeTab === 'processing' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Order Processing Time Analysis</h3>
                <div className="h-64 mb-6">
                  <Bar data={processingTimeChart} options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Processing Times: Green ≤30min, Yellow ≤1hr, Red >1hr'
                      }
                    }
                  }} />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Time (min)</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Under 30min</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Under 1hr</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Over 4hrs</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.analytics.orderProcessingTimes?.map((item, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {item._id.hotelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="capitalize">{item._id.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            item.averageProcessingTime <= 30 ? 'bg-green-100 text-green-800' :
                            item.averageProcessingTime <= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(item.averageProcessingTime)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.totalOrders}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.round(item.under30MinPercentage)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.round(item.under1HourPercentage)}%
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {Math.round(item.over4HoursPercentage)}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Housekeeping Tab - Shows issue categories and resolution rates */}
          {activeTab === 'housekeeping' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4">Housekeeping Issues Distribution</h3>
                  <div className="h-64">
                    <Doughnut
                      data={housekeepingIssuesChart}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'bottom',
                          },
                          title: {
                            display: true,
                            text: 'Issues by Category'
                          }
                        }
                      }}
                    />
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-4">Resolution Rate by Category</h3>
                  <div className="space-y-3">
                    {analyticsData.analytics.housekeepingIssues?.map((issue, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{issue.categoryLabel}</p>
                          <p className="text-sm text-gray-600">{issue.totalIssues} issues</p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center">
                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{ width: `${issue.resolutionRate}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium">{Math.round(issue.resolutionRate)}%</span>
                          </div>
                          {issue.averageResolutionTime && (
                            <p className="text-xs text-gray-500">
                              Avg: {Math.round(issue.averageResolutionTime)}h
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Issues</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolution Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Resolution Time</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Value</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.analytics.housekeepingIssues?.map((issue, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {issue._id.hotelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.categoryLabel}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.totalIssues}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.completedIssues}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            issue.resolutionRate >= 90 ? 'bg-green-100 text-green-800' :
                            issue.resolutionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(issue.resolutionRate)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {issue.averageResolutionTime ? `${Math.round(issue.averageResolutionTime)}h` : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${issue.totalValue?.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Revenue Tab - Shows revenue trends over time */}
          {activeTab === 'revenue' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Revenue Distribution Trends</h3>
              <div className="h-64 mb-6">
                <Line
                  data={revenueDistributionChart}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                      },
                      title: {
                        display: true,
                        text: 'Revenue Trends Over Time'
                      }
                    },
                    scales: {
                      x: {
                        title: {
                          display: true,
                          text: 'Time Period'
                        }
                      },
                      y: {
                        title: {
                          display: true,
                          text: 'Revenue ($)'
                        }
                      }
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Providers Tab - Shows service provider performance */}
          {activeTab === 'providers' && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Service Provider Performance</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completion Rate</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Rating</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Response Time</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {analyticsData.analytics.serviceProviderPerformance?.map((provider, index) => (
                      <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {provider._id.providerName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider._id.hotelName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="capitalize">{provider._id.category}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.totalBookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.completedBookings}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            provider.completionRate >= 90 ? 'bg-green-100 text-green-800' :
                            provider.completionRate >= 70 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {Math.round(provider.completionRate)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${provider.totalRevenue?.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.averageRating ? (
                            <div className="flex items-center">
                              <span className="mr-1">★</span>
                              <span>{provider.averageRating.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">No ratings</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {provider.averageResponseTime ?
                            `${Math.round(provider.averageResponseTime)}m` :
                            'N/A'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payment Management Tab - Shows payment analytics and hotel payment management */}
          {activeTab === 'payments' && <PaymentAnalytics />}
        </div>
      </div>
    </div>
  );
};

export default SuperHotelAnalytics;
