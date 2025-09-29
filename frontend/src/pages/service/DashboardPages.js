/**
 * Service Provider Dashboard Page
 * Shows key metrics, recent bookings, and service status information
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  fetchProviderStats,
  fetchProviderRecentOrders,
  selectProviderStats,
  selectProviderRecentOrders,
  selectServiceLoading
} from '../../redux/slices/serviceSlice';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import QuickActionsMenu from '../../components/service/QuickActionsMenu';
import UpcomingBookings from '../../components/service/UpcomingBookings';
import { formatPriceByLanguage } from '../../utils/currency';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const stats = useSelector(selectProviderStats);
  const recentOrders = useSelector(selectProviderRecentOrders);
  const isLoading = useSelector(selectServiceLoading);
  const [timeRange, setTimeRange] = useState('week'); // 'day', 'week', 'month', 'year'
  const { t, i18n } = useTranslation();

  useEffect(() => {
    dispatch(fetchProviderStats(timeRange));
    dispatch(fetchProviderRecentOrders());
  }, [dispatch, timeRange]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
  };

  // Mock data for charts - would be replaced by real data from API
  const revenueChartData = {
    labels: stats?.revenueData?.labels || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [
      {
        label: 'Revenue',
        data: stats?.revenueData?.data || [150, 250, 180, 350, 220, 300, 280],
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const serviceDistributionData = {
    labels: stats?.serviceDistribution?.labels || ['Laundry', 'Transportation', 'Tourism', 'Food', 'Others'],
    datasets: [
      {
        data: stats?.serviceDistribution?.data || [35, 25, 20, 15, 5],
        backgroundColor: [
          'rgba(54, 162, 235, 0.8)',
          'rgba(255, 99, 132, 0.8)',
          'rgba(75, 192, 192, 0.8)',
          'rgba(255, 206, 86, 0.8)',
          'rgba(153, 102, 255, 0.8)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-r from-modern-blue via-primary-main to-modern-lightBlue text-white py-8 px-2 sm:px-3 lg:px-4">
          <div className="w-full">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div>
                <h1 className="text-3xl font-bold">Service Provider Dashboard</h1>
                <p className="text-blue-100 mt-2">Loading your dashboard data...</p>
              </div>
            </div>
          </div>
        </div>

        {/* Beautiful Loading Animation */}
        <div className="w-full px-6 py-8">
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-lightBlue border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-modern-blue border-t-transparent animate-ping opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      {/* Header Section with Gradient Background */}
      <div className="bg-gradient-to-r from-modern-blue via-primary-main to-modern-lightBlue text-white py-8 px-2 sm:px-3 lg:px-4">
        <div className="w-full">
          <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-white mb-2">{t('dashboard.title')}</h1>
              <p className="text-white/90 text-lg">{t('dashboard.welcome', { providerName: stats?.providerName || 'Service Provider' })}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white/90 text-sm">Last updated: </span>
                <span className="text-white font-medium">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-2 sm:px-3 lg:px-4 -mt-4 relative z-10">
        {/* Time Range Selector - Modern Card Style */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">Analytics Period</h3>
              <p className="text-gray-600 text-sm">Choose the time range for your dashboard metrics</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleTimeRangeChange('day')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeRange === 'day'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {t('dashboard.timeRange.today')}
              </button>
              <button
                onClick={() => handleTimeRangeChange('week')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeRange === 'week'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {t('dashboard.timeRange.thisWeek')}
              </button>
              <button
                onClick={() => handleTimeRangeChange('month')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeRange === 'month'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {t('dashboard.timeRange.thisMonth')}
              </button>
              <button
                onClick={() => handleTimeRangeChange('year')}
                className={`px-6 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  timeRange === 'year'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
                }`}
              >
                {t('dashboard.timeRange.thisYear')}
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Menu */}
        <div className="mb-8">
          <QuickActionsMenu />
        </div>

        {/* Stats Cards - Modern Design */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {/* Total Revenue Card */}
          <div className="group relative bg-gradient-to-br from-modern-blue to-modern-lightBlue rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-white/20 backdrop-blur-sm rounded-full p-3">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-white/80 text-sm font-medium">{t('dashboard.totalRevenue')}</p>
                  <p className="text-2xl font-bold text-white">{formatPriceByLanguage(stats?.totalRevenue || 0, i18n.language)}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/90 text-xs">vs last period</span>
                <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                  stats?.revenueTrend > 0
                    ? 'bg-green-500/20 text-green-100'
                    : 'bg-red-500/20 text-red-100'
                }`}>
                  {stats?.revenueTrend > 0 ? '↗' : '↘'} {Math.abs(stats?.revenueTrend || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Total Orders Card */}
          <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 border-modern-lightBlue">
            <div className="absolute inset-0 bg-gradient-to-br from-modern-lightBlue/5 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-modern-lightBlue/10 rounded-full p-3">
                  <svg className="h-8 w-8 text-modern-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm font-medium">{t('dashboard.totalOrders')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">vs last period</span>
                <span className={`flex items-center text-xs font-semibold px-2 py-1 rounded-full ${
                  stats?.ordersTrend > 0
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {stats?.ordersTrend > 0 ? '↗' : '↘'} {Math.abs(stats?.ordersTrend || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Active Services Card */}
          <div className="group relative bg-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border-l-4 border-modern-blue">
            <div className="absolute inset-0 bg-gradient-to-br from-modern-blue/5 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-modern-blue/10 rounded-full p-3">
                  <svg className="h-8 w-8 text-modern-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm font-medium">{t('dashboard.activeServices')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeServices || 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">vs last period</span>
                <span className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                  ↗ {stats?.activeServicesTrend?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>

          {/* Partnered Hotels Card */}
          <div className="group relative bg-gradient-to-br from-gray-50 to-white rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200">
            <div className="absolute inset-0 bg-gradient-to-br from-modern-lightBlue/10 to-transparent"></div>
            <div className="relative p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gradient-to-br from-modern-blue to-modern-lightBlue rounded-full p-3">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="text-right">
                  <p className="text-gray-600 text-sm font-medium">{t('dashboard.partneredHotels')}</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.partneredHotels || 0}</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-500 text-xs">vs last period</span>
                <span className="flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-green-100 text-green-800">
                  ↗ {stats?.partneredHotelsTrend?.toFixed(1) || 0}%
                </span>
              </div>
            </div>
          </div>
        </div>        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3 mb-8">
          {/* Upcoming Bookings - Modern Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-modern-blue to-modern-lightBlue px-6 py-4">
                <h3 className="text-lg font-semibold text-white">Upcoming Bookings</h3>
              </div>
              <div className="p-0">
                <UpcomingBookings bookings={stats?.upcomingBookings || []} />
              </div>
            </div>
          </div>

          {/* Charts Container */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Line Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.revenueTrend')}</h3>
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-modern-blue rounded-full"></div>
                    <span className="text-sm text-gray-600">Revenue</span>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div className="h-64">
                  <Line
                    data={revenueChartData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          display: false,
                        },
                      },
                      scales: {
                        y: {
                          beginAtZero: true,
                          grid: {
                            color: '#f3f4f6',
                          },
                          ticks: {
                            color: '#6b7280',
                            callback: function(value) {
                              return '$' + value;
                            }
                          }
                        },
                        x: {
                          grid: {
                            display: false,
                          },
                          ticks: {
                            color: '#6b7280',
                          }
                        }
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Service Distribution Doughnut Chart */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">{t('dashboard.serviceDistribution')}</h3>
              </div>
              <div className="p-6">
                <div className="h-64 flex items-center justify-center">
                  <Doughnut
                    data={serviceDistributionData}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: {
                          position: 'right',
                          labels: {
                            usePointStyle: true,
                            padding: 20,
                            color: '#374151',
                          }
                        },
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      {/* Performance metrics */}
      <div className="mt-8 bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">{t('dashboard.performanceMetrics')}</h3>
        </div>
        <div className="px-6 py-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('dashboard.avgResponseTime')}</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {stats?.avgResponseTime || '15'} {t('dashboard.minutes')}
                <span className="text-sm font-medium text-green-600 ml-2">
                  ↓ {stats?.avgResponseTimeTrend || '5%'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('dashboard.completionRate')}</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {stats?.completionRate || '98'}%
                <span className="text-sm font-medium text-green-600 ml-2">
                  ↑ {stats?.completionRateTrend || '2%'}
                </span>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">{t('dashboard.avgRating')}</dt>
              <dd className="mt-1 text-lg font-semibold text-gray-900">
                {stats?.avgRating || '4.8'}/5
                <span className="text-sm font-medium text-green-600 ml-2">
                  ↑ {stats?.avgRatingTrend || '0.2'}
                </span>
              </dd>
              <div className="mt-2 flex items-center">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg
                    key={star}
                    className={`h-5 w-5 ${star <= Math.round(stats?.avgRating || 4.8) ? 'text-yellow-400' : 'text-gray-300'}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">{t('dashboard.recentOrders')}</h2>
        <div className="mt-4 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="flex flex-col">
            <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.orderId')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.service')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.hotel')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.guest')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.status')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.amount')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.date')}
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {t('dashboard.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {recentOrders && recentOrders.length > 0 ? (
                      recentOrders.map((order) => (
                        <tr key={order._id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {order.orderId}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.service.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.hotel.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {order.guest.firstName} {order.guest.lastName}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${order.status === 'completed' ? 'bg-green-100 text-green-800' : ''}
                              ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                              ${order.status === 'in-progress' ? 'bg-blue-100 text-blue-800' : ''}
                              ${order.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                            `}>
                              {t(`dashboard.orderStatus.${order.status}`)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatPriceByLanguage(order.totalAmount, i18n.language)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <a href={`/service/orders/${order._id}`} className="text-blue-600 hover:text-blue-900">
                              {t('dashboard.view')}
                            </a>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                          {t('dashboard.noRecentOrders')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Bookings */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">{t('dashboard.upcomingBookings')}</h2>
        <div className="mt-4 bg-white shadow sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('dashboard.nextBooking')}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {stats?.nextBooking?.service.name || t('dashboard.na')}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">{t('dashboard.scheduledDate')}</dt>
                <dd className="mt-1 text-lg font-semibold text-gray-900">
                  {stats?.nextBooking?.scheduledDate ? new Date(stats.nextBooking.scheduledDate).toLocaleString() : t('dashboard.na')}
                </dd>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-200">
            <div className="px-4 py-3 sm:px-6">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-500">{t('dashboard.allUpcomingBookings')}</h3>
                <a href="/service/bookings" className="text-sm font-semibold text-blue-600 hover:text-blue-500">
                  {t('dashboard.viewAll')}
                </a>
              </div>
            </div>
            <div className="bg-white divide-y divide-gray-200">
              {stats?.upcomingBookings && stats.upcomingBookings.length > 0 ? (
                stats.upcomingBookings.map((booking) => (
                  <div key={booking._id} className="px-4 py-3 sm:px-6 flex justify-between items-center">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{booking.service.name}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {booking.guest.firstName} {booking.guest.lastName}
                      </p>
                    </div>
                    <div className="ml-4 flex-shrink-0">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full
                        ${booking.status === 'confirmed' ? 'bg-green-100 text-green-800' : ''}
                        ${booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : ''}
                        ${booking.status === 'cancelled' ? 'bg-red-100 text-red-800' : ''}
                      `}>
                        {t(`dashboard.bookingStatus.${booking.status}`)}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 sm:px-6 text-center text-sm text-gray-500">
                  {t('dashboard.noUpcomingBookings')}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  );
};

export default DashboardPage;
