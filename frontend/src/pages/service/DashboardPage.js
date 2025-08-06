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
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-800">{t('dashboard.title')}</h1>
        <span className="text-sm text-gray-500">{t('dashboard.welcome', { providerName: stats?.providerName || 'Service Provider' })}</span>
      </div>

      {/* Quick Actions Menu */}
      <div className="mt-6">
        <QuickActionsMenu />
      </div>

      {/* Time range selector */}
      <div className="mt-6 mb-6">
        <div className="flex flex-wrap space-x-2">
          <button
            onClick={() => handleTimeRangeChange('day')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              timeRange === 'day' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('dashboard.timeRange.today')}
          </button>
          <button
            onClick={() => handleTimeRangeChange('week')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              timeRange === 'week' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('dashboard.timeRange.thisWeek')}
          </button>
          <button
            onClick={() => handleTimeRangeChange('month')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              timeRange === 'month' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('dashboard.timeRange.thisMonth')}
          </button>
          <button
            onClick={() => handleTimeRangeChange('year')}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              timeRange === 'year' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {t('dashboard.timeRange.thisYear')}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.totalRevenue')}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{formatPriceByLanguage(stats?.totalRevenue || 0, i18n.language)}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-gray-500">
                {stats?.revenueTrend > 0 ?
                  <span className="text-green-600">+{stats?.revenueTrend?.toFixed(1)}% {t('dashboard.fromLastPeriod')}</span> :
                  <span className="text-red-600">{stats?.revenueTrend?.toFixed(1)}% {t('dashboard.fromLastPeriod')}</span>
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-green-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.totalOrders')}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats?.totalOrders || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-gray-500">
                {stats?.ordersTrend > 0 ?
                  <span className="text-green-600">+{stats?.ordersTrend?.toFixed(1)}% {t('dashboard.fromLastPeriod')}</span> :
                  <span className="text-red-600">{stats?.ordersTrend?.toFixed(1)}% {t('dashboard.fromLastPeriod')}</span>
                }
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-yellow-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.activeServices')}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats?.activeServices || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {stats?.activeServicesTrend > 0 ? '+' : ''}{stats?.activeServicesTrend?.toFixed(1) || 0}% {t('dashboard.fromLastPeriod')}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-indigo-500 rounded-md p-3">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">{t('dashboard.partneredHotels')}</dt>
                  <dd>
                    <div className="text-lg font-medium text-gray-900">{stats?.partneredHotels || 0}</div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-4 py-2 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {stats?.partneredHotelsTrend > 0 ? '+' : ''}{stats?.partneredHotelsTrend?.toFixed(1) || 0}% {t('dashboard.fromLastPeriod')}
              </span>
            </div>
          </div>
        </div>
      </div>      {/* Upcoming Bookings and Charts Layout */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Upcoming Bookings - Takes up 1/3 of the width on large screens */}
        <div className="lg:col-span-1">
          <UpcomingBookings bookings={stats?.upcomingBookings || []} />
        </div>

        {/* Charts Container - Takes up 2/3 of the width on large screens */}
        <div className="lg:col-span-2 grid grid-cols-1 gap-5">
          {/* Revenue Line Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.revenueTrend')}</h3>
            <div className="h-64">
              <Line
                data={revenueChartData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'top',
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '$' + value;
                        }
                      }
                    }
                  }
                }}
              />
            </div>
          </div>

          {/* Service Distribution Doughnut Chart */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">{t('dashboard.serviceDistribution')}</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={serviceDistributionData}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: {
                      position: 'right',
                    },
                  }
                }}
              />
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
  );
};

export default DashboardPage;
