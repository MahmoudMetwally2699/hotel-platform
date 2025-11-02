/**
 * Service Provider Earnings Page
 * Displays comprehensive earnings and analytics for service providers
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchProviderEarnings,
  fetchProviderPayouts,
  fetchCategoryAnalytics,
  selectProviderEarnings,
  selectCategoryAnalytics,
  selectServiceLoading,
  selectServiceError,
  selectProviderCurrency
} from '../../redux/slices/serviceSlice';
import { formatPriceByLanguage } from '../../utils/currency';

// Chart.js imports
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement } from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Icons
import {
  BanknotesIcon,
  ChartBarIcon,
  ClockIcon,
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  CalendarDaysIcon,
  ShoppingBagIcon,
  TruckIcon,
  SparklesIcon,
  HomeIcon,
  BuildingStorefrontIcon
} from '@heroicons/react/24/outline';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, BarElement, ArcElement);

const EarningsPage = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const earnings = useSelector(selectProviderEarnings);
  const categoryAnalytics = useSelector(selectCategoryAnalytics);
  const isLoading = useSelector(selectServiceLoading);
  const error = useSelector(selectServiceError);
  const currency = useSelector(selectProviderCurrency);

  const [timeRange, setTimeRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    dispatch(fetchProviderEarnings(timeRange));
    dispatch(fetchCategoryAnalytics(timeRange));
    dispatch(fetchProviderPayouts());
  }, [dispatch, timeRange]);

  // Debug logging
  useEffect(() => {
  }, [earnings, categoryAnalytics]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Format chart data
  const getChartData = () => {
    if (!earnings?.data?.breakdown?.monthly || earnings.data.breakdown.monthly.length === 0) {
      return null;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const chartLabels = earnings.data.breakdown.monthly.map(item =>
      `${monthNames[item.month - 1]} ${item.year}`
    );
    const earningsData = earnings.data.breakdown.monthly.map(item => item.earnings);

    return {
      labels: chartLabels,
      datasets: [
        {
          label: 'Monthly Earnings',
          data: earningsData,
          borderColor: '#3B5787',
          backgroundColor: 'rgba(59, 87, 135, 0.5)',
          tension: 0.3
        }
      ]
    };
  };

  const getBarChartData = () => {
    if (!earnings?.data?.categoryBreakdown) {
      // Create sample data structure for demonstration
      const categories = ['Transportation', 'Laundry', 'Housekeeping', 'Restaurant'];
      const categoryColors = [
        'rgba(59, 87, 135, 0.8)', // Primary blue for Transportation
        'rgba(103, 186, 224, 0.8)', // Light blue for Laundry
        'rgba(59, 87, 135, 0.6)', // Primary blue variant for Housekeeping
        'rgba(103, 186, 224, 0.6)' // Light blue variant for Restaurant
      ];
      const categoryBorderColors = [
        'rgba(59, 87, 135, 1)',
        'rgba(103, 186, 224, 1)',
        'rgba(59, 87, 135, 1)',
        'rgba(103, 186, 224, 1)'
      ];

      return {
        labels: categories,
        datasets: [
          {
            label: 'Earnings ($)',
            data: [0, 0, 0, 0], // Placeholder data
            backgroundColor: categoryColors,
            borderColor: categoryBorderColors,
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }
        ]
      };
    }

    const categories = ['transportation', 'laundry', 'housekeeping', 'restaurant'];
    const categoryLabels = ['Transportation', 'Laundry', 'Housekeeping', 'Restaurant'];
    const categoryColors = [
      'rgba(59, 87, 135, 0.8)', // Primary blue for Transportation
      'rgba(103, 186, 224, 0.8)', // Light blue for Laundry
      'rgba(59, 87, 135, 0.6)', // Primary blue variant for Housekeeping
      'rgba(103, 186, 224, 0.6)' // Light blue variant for Restaurant
    ];
    const categoryBorderColors = [
      'rgba(59, 87, 135, 1)',
      'rgba(103, 186, 224, 1)',
      'rgba(59, 87, 135, 1)',
      'rgba(103, 186, 224, 1)'
    ];

    const earningsData = categories.map(category => {
      const categoryData = getCategoryData(category);
      return categoryData.allTime?.totalEarnings || 0;
    });    return {
      labels: categoryLabels,
      datasets: [
        {
          label: 'Earnings ($)',
          data: earningsData,
          backgroundColor: categoryColors,
          borderColor: categoryBorderColors,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false,
        }
      ]
    };
  };

  // Service category icons mapping
  const getCategoryIcon = (category) => {
    switch (category?.toLowerCase()) {
      case 'laundry': return <SparklesIcon className="h-6 w-6" />;
      case 'transportation': return <TruckIcon className="h-6 w-6" />;
      case 'housekeeping': return <HomeIcon className="h-6 w-6" />;
      case 'restaurant': return <BuildingStorefrontIcon className="h-6 w-6" />;
      default: return <ShoppingBagIcon className="h-6 w-6" />;
    }
  };

  // Helper function to get category data from new analytics endpoint
  const getCategoryData = (category) => {
    if (!categoryAnalytics?.data?.categories) {
      return {
        allTime: { totalEarnings: 0, totalOrders: 0, averagePerOrder: 0 },
        currentPeriod: { totalEarnings: 0, totalOrders: 0, averagePerOrder: 0 }
      };
    }

    // Map frontend categories to backend categories
    const categoryMapping = {
      'restaurant': 'dining',  // Frontend shows 'restaurant' but backend has 'dining'
      'dining': 'dining',
      'laundry': 'laundry',
      'transportation': 'transportation',
      'housekeeping': 'housekeeping'
    };

    const backendCategory = categoryMapping[category.toLowerCase()] || category.toLowerCase();

    const categoryItem = categoryAnalytics.data.categories.find(
      item => item.category && item.category.toLowerCase() === backendCategory
    );

    if (!categoryItem) {
      return {
        allTime: { totalEarnings: 0, totalOrders: 0, averagePerOrder: 0 },
        currentPeriod: { totalEarnings: 0, totalOrders: 0, averagePerOrder: 0 }
      };
    }

    return categoryItem;
  };

  // Enhanced chart data with better colors
  const getEnhancedBarChartData = () => {
    if (!earnings?.data?.breakdown?.byCategory || earnings.data.breakdown.byCategory.length === 0) {
      return null;
    }

    const categoryColors = {
      laundry: 'rgba(103, 186, 224, 0.8)',
      transportation: 'rgba(59, 87, 135, 0.8)',
      housekeeping: 'rgba(59, 87, 135, 0.6)',
      restaurant: 'rgba(103, 186, 224, 0.6)',
      other: 'rgba(0, 0, 0, 0.8)'
    };

    return {
      labels: earnings.data.breakdown.byCategory.map(item =>
        item.category.charAt(0).toUpperCase() + item.category.slice(1)
      ),
      datasets: [
        {
          label: 'Earnings by Service Category',
          data: earnings.data.breakdown.byCategory.map(item => item.earnings),
          backgroundColor: earnings.data.breakdown.byCategory.map(item =>
            categoryColors[item.category.toLowerCase()] || categoryColors.other
          ),
          borderColor: earnings.data.breakdown.byCategory.map(item =>
            categoryColors[item.category.toLowerCase()]?.replace('0.8', '1') || categoryColors.other.replace('0.8', '1')
          ),
          borderWidth: 2,
          borderRadius: 8,
        }
      ]
    };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="w-full px-2 sm:px-3 lg:px-4">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  💰 Earnings & Analytics
                </h1>
                <p className="mt-2 text-sm text-gray-600">
                  Comprehensive overview of your service earnings and performance metrics
                </p>
              </div>
              <div className="flex items-center space-x-3">
                <CalendarDaysIcon className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 sm:px-3 lg:px-4 py-8">
        {error && (
          <div className="mb-6 bg-gray-50 border-l-4 border-[#3B5787] p-4 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-[#3B5787]" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-gray-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Enhanced Earnings Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Available Balance Card */}
          <div className="bg-gradient-to-br from-[#3B5787] to-[#2A4065] overflow-hidden shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <BanknotesIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white/80 truncate">
                      Available Balance
                    </dt>
                    <dd className="text-2xl font-bold text-white">
                      {formatPriceByLanguage(earnings?.data?.availableBalance || 0, i18n.language, currency)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Monthly Earnings Card */}
          <div className="bg-gradient-to-br from-[#67BAE0] to-[#3B5787] overflow-hidden shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ArrowTrendingUpIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white/80 truncate">
                      Monthly Earnings
                    </dt>
                    <dd className="text-2xl font-bold text-white">
                      {formatPriceByLanguage(earnings?.data?.monthlyEarnings || 0, i18n.language, currency)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Earnings YTD Card */}
          <div className="bg-gradient-to-br from-[#3B5787] to-[#67BAE0] overflow-hidden shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ChartBarIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white/80 truncate">
                      Total Earnings YTD
                    </dt>
                    <dd className="text-2xl font-bold text-white">
                      {formatPriceByLanguage(earnings?.data?.yearlyEarnings || 0, i18n.language, currency)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="bg-gradient-to-br from-[#67BAE0] to-[#2A4065] overflow-hidden shadow-xl rounded-2xl transform hover:scale-105 transition-all duration-200">
            <div className="px-6 py-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ShoppingBagIcon className="h-8 w-8 text-white" />
                </div>
                <div className="ml-4 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-white/80 truncate">
                      Total Orders
                    </dt>
                    <dd className="text-2xl font-bold text-white">
                      {earnings?.data?.totalOrders || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Analytics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3 mb-8">
          {/* Pending Earnings */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <ClockIcon className="h-6 w-6 text-[#3B5787]" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Pending Earnings</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPriceByLanguage(earnings?.data?.pending?.pendingEarnings || 0, i18n.language, currency)}
                  </div>
                  <div className="text-xs text-gray-400">
                    {earnings?.data?.pending?.pendingBookings || 0} pending orders
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Average per Order */}
          <div className="bg-white overflow-hidden shadow-lg rounded-xl border border-gray-200">
            <div className="px-6 py-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CurrencyDollarIcon className="h-6 w-6 text-[#67BAE0]" />
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-500">Avg per Order</div>
                  <div className="text-lg font-semibold text-gray-900">
                    {formatPriceByLanguage(earnings?.data?.currentPeriod?.averagePerBooking || 0, i18n.language, currency)}
                  </div>
                  <div className="text-xs text-gray-400">Current period</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Analytics Period</h3>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === '7d'
                    ? 'bg-[#3B5787] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 7 days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === '30d'
                    ? 'bg-[#3B5787] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 30 days
              </button>
              <button
                onClick={() => setTimeRange('90d')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === '90d'
                    ? 'bg-[#3B5787] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last 90 days
              </button>
              <button
                onClick={() => setTimeRange('1y')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === '1y'
                    ? 'bg-[#3B5787] text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Last year
              </button>
            </div>
          </div>
        </div>

        {/* Service Category Analytics */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">🏨 Analytics by Service Category</h3>
              <p className="text-sm text-gray-500">Comprehensive breakdown across all services</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Transportation Analytics */}
              <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#3B5787]/20 rounded-xl p-6 border border-[#3B5787]/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#3B5787] rounded-lg">
                      <TruckIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Transportation</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Earnings</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceByLanguage(getCategoryData('transportation').allTime?.totalEarnings || 0, i18n.language, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold text-gray-900">
                      {getCategoryData('transportation').allTime?.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg per Order</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceByLanguage(getCategoryData('transportation').allTime?.averagePerOrder || 0, i18n.language, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-[#3B5787]">
                      {formatPriceByLanguage(getCategoryData('transportation').currentPeriod?.totalEarnings || 0, i18n.language, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Laundry Analytics */}
              <div className="bg-gradient-to-br from-[#67BAE0]/10 to-[#67BAE0]/20 rounded-xl p-6 border border-[#67BAE0]/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#67BAE0] rounded-lg">
                      <SparklesIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Laundry</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Earnings</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceByLanguage(getCategoryData('laundry').allTime?.totalEarnings || 0, i18n.language, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold text-gray-900">
                      {getCategoryData('laundry').allTime?.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg per Order</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceByLanguage(getCategoryData('laundry').allTime?.averagePerOrder || 0, i18n.language, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-[#67BAE0]">
                      {formatPriceByLanguage(getCategoryData('laundry').currentPeriod?.totalEarnings || 0, i18n.language, currency)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Housekeeping Analytics */}
              <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#3B5787]/20 rounded-xl p-6 border border-[#3B5787]/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#3B5787] rounded-lg">
                      <HomeIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Housekeeping</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold text-gray-900 text-2xl">
                      {getCategoryData('housekeeping').allTime?.totalOrders || 0}
                    </span>
                  </div>
                </div>
              </div>

              {/* Restaurant Analytics */}
              <div className="bg-gradient-to-br from-[#67BAE0]/10 to-[#67BAE0]/20 rounded-xl p-6 border border-[#67BAE0]/30">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-[#67BAE0] rounded-lg">
                      <BuildingStorefrontIcon className="h-6 w-6 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900">Restaurant</h4>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Earnings</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceByLanguage(getCategoryData('restaurant').allTime?.totalEarnings || 0, i18n.language, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Orders</span>
                    <span className="font-semibold text-gray-900">
                      {getCategoryData('restaurant').allTime?.totalOrders || 0}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Avg per Order</span>
                    <span className="font-semibold text-gray-900">
                      {formatPriceByLanguage(getCategoryData('restaurant').allTime?.averagePerOrder || 0, i18n.language, currency)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">This Month</span>
                    <span className="font-semibold text-[#67BAE0]">
                      {formatPriceByLanguage(getCategoryData('restaurant').currentPeriod?.totalEarnings || 0, i18n.language, currency)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Earnings Trend Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              📈 Earnings Trend Over Time
            </h3>
            {getChartData() ? (
              <div style={{ height: '300px' }}>
                <Line
                  data={getChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 20
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: $${context.raw}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '$' + value;
                          }
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900">No earnings data available</p>
                  <p className="text-sm text-gray-500">Start accepting orders to see your earnings trend</p>
                </div>
              </div>
            )}
          </div>

          {/* Service Category Comparison Chart */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              📊 Earnings by Service Category
            </h3>
            {getBarChartData() ? (
              <div style={{ height: '300px' }}>
                <Bar
                  data={getBarChartData()}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'top',
                        labels: {
                          usePointStyle: true,
                          padding: 20
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: function(context) {
                            return `${context.dataset.label}: $${context.raw}`;
                          }
                        }
                      }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: function(value) {
                            return '$' + value;
                          }
                        },
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      },
                      x: {
                        grid: {
                          color: 'rgba(0, 0, 0, 0.05)'
                        }
                      }
                    }
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium text-gray-900">No category data available</p>
                  <p className="text-sm text-gray-500">Category breakdown will appear as you earn from different services</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Time Range Selector */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Analytics Time Range</h3>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'week', label: 'Last Week', icon: '📅' },
                { key: 'month', label: 'Last Month', icon: '📆' },
                { key: 'year', label: 'Last Year', icon: '🗓️' }
              ].map((option) => (
                <button
                  key={option.key}
                  onClick={() => handleTimeRangeChange(option.key)}
                  className={`px-6 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                    timeRange === option.key
                      ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-lg transform scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.icon} {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

      {isLoading ? (
        <div className="text-center py-20">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent"></div>
          </div>
          <p className="text-lg text-gray-600">Loading comprehensive analytics...</p>
        </div>
      ) : (
        <>
          {/* Earnings Charts */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 mb-8">
            {/* Earnings Over Time Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">📈 Earnings Trend Over Time</h3>
              {getChartData() ? (
                <div className="h-80">
                  <Line
                    data={getChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return formatPriceByLanguage(context.raw, i18n.language, currency);
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return formatPriceByLanguage(value, i18n.language, currency);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <ChartBarIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No earnings data available</p>
                </div>
              )}
            </div>

            {/* Earnings by Category Chart */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">🏷️ Earnings by Category</h3>
              {getEnhancedBarChartData() ? (
                <div className="h-80">
                  <Bar
                    data={getEnhancedBarChartData()}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false
                        },
                        tooltip: {
                          callbacks: {
                            label: function(context) {
                              return formatPriceByLanguage(context.raw, i18n.language, currency);
                            }
                          }
                        }
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          ticks: {
                            callback: function(value) {
                              return formatPriceByLanguage(value, i18n.language, currency);
                            }
                          }
                        }
                      }
                    }}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-center h-64">
                  <ShoppingBagIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No category earnings data available</p>
                </div>
              )}
            </div>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default EarningsPage;
