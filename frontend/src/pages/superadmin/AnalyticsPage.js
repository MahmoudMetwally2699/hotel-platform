/**
 * SuperAdmin Analytics Page
 * Displays platform-wide analytics and data visualizations
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchHotelStats,
  selectHotelStats,
  selectHotelStatsLoading
} from '../../redux/slices/hotelSlice';
import {
  fetchBookingStats,
  selectBookingStats,
  selectBookingStatsLoading
} from '../../redux/slices/bookingSlice';
import {
  Bar,
  Line,
  Doughnut
} from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const SuperAdminAnalyticsPage = () => {
  const dispatch = useDispatch();
  const hotelStats = useSelector(selectHotelStats);
  const bookingStats = useSelector(selectBookingStats);
  const isHotelStatsLoading = useSelector(selectHotelStatsLoading);
  const isBookingStatsLoading = useSelector(selectBookingStatsLoading);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    dispatch(fetchHotelStats(timeRange));
    dispatch(fetchBookingStats(timeRange));
  }, [dispatch, timeRange]);

  // Revenue by Service Category data
  const revenueByCategory = {
    labels: bookingStats?.revenueByCategoryLabels || ['Laundry', 'Transportation', 'Tourism'],
    datasets: [
      {
        label: 'Revenue by Service Category',
        data: bookingStats?.revenueByCategoryData || [0, 0, 0],
        backgroundColor: [
          'rgba(54, 162, 235, 0.5)',
          'rgba(255, 99, 132, 0.5)',
          'rgba(255, 206, 86, 0.5)',
        ],
        borderColor: [
          'rgba(54, 162, 235, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  // Monthly bookings data
  const monthlyBookings = {
    labels: bookingStats?.monthlyBookingsLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Monthly Bookings',
        data: bookingStats?.monthlyBookingsData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  // Hotel Registrations Over Time
  const hotelRegistrations = {
    labels: hotelStats?.registrationsLabels || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Hotel Registrations',
        data: hotelStats?.registrationsData || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
        fill: false,
        borderColor: 'rgba(153, 102, 255, 1)',
        tension: 0.1,
      },
    ],
  };

  // Hotels by Status data
  const hotelsByStatus = {
    labels: ['Active', 'Pending', 'Suspended'],
    datasets: [
      {
        label: 'Hotels by Status',
        data: [
          hotelStats?.activeHotels || 0,
          hotelStats?.pendingHotels || 0,
          hotelStats?.suspendedHotels || 0
        ],
        backgroundColor: [
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
          'rgba(255, 99, 132, 0.5)',
        ],
        borderColor: [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(255, 99, 132, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  if (isHotelStatsLoading || isBookingStatsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Analytics</h1>
          <p className="mt-2 text-sm text-gray-700">
            Comprehensive analytics and insights for the entire platform
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            id="timeRange"
            name="timeRange"
            className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
          >
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Hotels</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{hotelStats?.totalHotels || 0}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {hotelStats?.hotelGrowthRate || 0}%
              </span>{' '}
              increase from previous {timeRange}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Total Bookings</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{bookingStats?.totalBookings || 0}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {bookingStats?.bookingGrowthRate || 0}%
              </span>{' '}
              increase from previous {timeRange}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Platform Revenue</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">${bookingStats?.totalRevenue || 0}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {bookingStats?.revenueGrowthRate || 0}%
              </span>{' '}
              increase from previous {timeRange}
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <dt className="text-sm font-medium text-gray-500 truncate">Active Users</dt>
            <dd className="mt-1 text-3xl font-semibold text-gray-900">{bookingStats?.activeUsers || 0}</dd>
          </div>
          <div className="bg-gray-50 px-4 py-4 sm:px-6">
            <div className="text-sm">
              <span className="font-medium text-green-600">
                {bookingStats?.userGrowthRate || 0}%
              </span>{' '}
              increase from previous {timeRange}
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="mt-8 grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* Revenue by Service Category */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Revenue by Service Category</h3>
          <div className="h-64">
            <Doughnut data={revenueByCategory} options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
              },
            }} />
          </div>
        </div>

        {/* Monthly Bookings */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Monthly Bookings</h3>
          <div className="h-64">
            <Bar data={monthlyBookings} options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }} />
          </div>
        </div>

        {/* Hotel Registrations */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Hotel Registrations Over Time</h3>
          <div className="h-64">
            <Line data={hotelRegistrations} options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  display: false,
                },
              },
            }} />
          </div>
        </div>

        {/* Hotels by Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Hotels by Status</h3>
          <div className="h-64">
            <Doughnut data={hotelsByStatus} options={{
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                },
              },
            }} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminAnalyticsPage;
