import React, { useState, useEffect } from 'react';
import {
  FaChartLine,
  FaDollarSign,
  FaStar,
  FaUsers,
  FaSpinner,
  FaTshirt,
  FaCar,
  FaMapMarkedAlt,
  FaSpa,
  FaUtensils,
  FaMusic,
  FaShoppingBag,
  FaDumbbell
} from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import axios from 'axios';
import { toast } from 'react-toastify';

const categoryIcons = {
  laundry: FaTshirt,
  transportation: FaCar,
  tours: FaMapMarkedAlt,
  spa: FaSpa,
  dining: FaUtensils,
  entertainment: FaMusic,
  shopping: FaShoppingBag,
  fitness: FaDumbbell
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

const ServiceProviderAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    categoryPerformance: [],
    monthlyTrends: [],
    totalCategories: 0
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30');
  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/service/analytics/categories?timeRange=${timeRange}`);
      setAnalytics(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  const getOverallStats = () => {
    if (!analytics.categoryPerformance.length) return {};

    return analytics.categoryPerformance.reduce((acc, category) => {
      acc.totalRevenue = (acc.totalRevenue || 0) + category.totalRevenue;
      acc.totalOrders = (acc.totalOrders || 0) + category.totalOrders;
      acc.totalRating = (acc.totalRating || 0) + (category.averageRating * category.totalOrders);
      acc.totalRatedOrders = (acc.totalRatedOrders || 0) + category.totalOrders;
      return acc;
    }, {});
  };

  const overallStats = getOverallStats();
  const avgRating = overallStats.totalRatedOrders ? overallStats.totalRating / overallStats.totalRatedOrders : 0;

  // Transform monthly trends for chart
  const chartData = analytics.monthlyTrends.reduce((acc, trend) => {
    const dateKey = `${trend._id.month}/${trend._id.day}`;
    const existing = acc.find(item => item.date === dateKey);

    if (existing) {
      existing[trend._id.category] = trend.dailyRevenue;
      existing[`${trend._id.category}_orders`] = trend.dailyOrders;
    } else {
      acc.push({
        date: dateKey,
        [trend._id.category]: trend.dailyRevenue,
        [`${trend._id.category}_orders`]: trend.dailyOrders
      });
    }

    return acc;
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Analytics</h1>
            <p className="text-gray-600">Performance insights across all service categories</p>
          </div>
          <div>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overall Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-800">
                {formatCurrency(overallStats.totalRevenue || 0)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FaDollarSign className="text-green-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-gray-800">{overallStats.totalOrders || 0}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FaChartLine className="text-blue-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Rating</p>
              <p className="text-2xl font-bold text-gray-800">{avgRating.toFixed(1)}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FaStar className="text-yellow-600 text-xl" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Categories</p>
              <p className="text-2xl font-bold text-gray-800">{analytics.totalCategories}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FaUsers className="text-purple-600 text-xl" />
            </div>
          </div>
        </div>
      </div>

      {/* Category Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category Performance Table */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Category Performance</h2>
          <div className="space-y-4">
            {analytics.categoryPerformance.map((category, index) => {
              const IconComponent = categoryIcons[category._id] || FaSpa;
              return (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center">
                    <div className="p-2 bg-gray-100 rounded-full mr-4">
                      <IconComponent className="text-gray-600 text-lg" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800 capitalize">{category.categoryName}</h3>
                      <p className="text-sm text-gray-600">
                        {category.totalOrders} orders • {category.completionRate.toFixed(1)}% completion
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-800">{formatCurrency(category.totalRevenue)}</p>
                    <div className="flex items-center text-sm text-yellow-600">
                      <FaStar className="mr-1" />
                      {category.averageRating?.toFixed(1) || 'N/A'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Revenue Distribution Pie Chart */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Distribution</h2>
          {analytics.categoryPerformance.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analytics.categoryPerformance}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ categoryName, percent }) => `${categoryName} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="totalRevenue"
                  nameKey="categoryName"
                >
                  {analytics.categoryPerformance.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatCurrency(value)} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Revenue Trends */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Daily Revenue Trends</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              {analytics.categoryPerformance.map((category, index) => (
                <Line
                  key={category._id}
                  type="monotone"
                  dataKey={category._id}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  name={category.categoryName}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No trend data available
          </div>
        )}
      </div>

      {/* Orders by Category */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Orders by Category</h2>
        {analytics.categoryPerformance.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.categoryPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="categoryName" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="totalOrders" fill="#8884d8" name="Total Orders" />
              <Bar dataKey="completedOrders" fill="#82ca9d" name="Completed Orders" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            No data available
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceProviderAnalytics;
