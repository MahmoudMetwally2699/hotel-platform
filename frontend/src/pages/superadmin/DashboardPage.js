import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectHotelList,
  fetchAllHotels,
  selectHotelListLoading
} from '../../redux/slices/hotelSlice';
import {
  fetchBookingStats,
  selectBookingStats,
  selectBookingStatsLoading
} from '../../redux/slices/bookingSlice';

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
  ArcElement
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const DashboardPage = () => {
  const dispatch = useDispatch();
  const hotels = useSelector(selectHotelList);
  const bookingStats = useSelector(selectBookingStats);

  const hotelLoading = useSelector(selectHotelListLoading);
  const bookingStatsLoading = useSelector(selectBookingStatsLoading);

  const [period, setPeriod] = useState('month');

  useEffect(() => {
    dispatch(fetchAllHotels());
    dispatch(fetchBookingStats(period));
  }, [dispatch, period]);

  const loading = hotelLoading || bookingStatsLoading;  // Chart data for revenue by hotel
  const revenueData = {
    labels: Array.isArray(hotels) ? hotels.slice(0, 5).map(hotel => hotel.name) : [],
    datasets: [
      {
        label: 'Total Revenue',
        data: Array.isArray(hotels) ? hotels.slice(0, 5).map(hotel => hotel.totalRevenue || 0) : [],
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgb(54, 162, 235)',
        borderWidth: 1
      }
    ]
  };

  // Chart data for hotel status distribution
  const hotelStatusData = {
    labels: ['Active Hotels', 'Pending Approval', 'Suspended'],
    datasets: [
      {
        data: [
          Array.isArray(hotels) ? hotels.filter(h => h.isActive && h.isPublished).length : 0,
          Array.isArray(hotels) ? hotels.filter(h => !h.isPublished).length : 0,
          Array.isArray(hotels) ? hotels.filter(h => !h.isActive).length : 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(251, 191, 36, 0.8)',
          'rgba(239, 68, 68, 0.8)'
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(251, 191, 36)',
          'rgb(239, 68, 68)'
        ],
        borderWidth: 2
      }
    ]
  };

  // Chart data for hotel geographic distribution
  const geographicData = {
    labels: Array.isArray(hotels) ? [...new Set(hotels.map(h => h.address?.country || 'Unknown'))].slice(0, 6) : [],
    datasets: [
      {
        label: 'Hotels by Country',
        data: Array.isArray(hotels) ? [...new Set(hotels.map(h => h.address?.country || 'Unknown'))].slice(0, 6).map(country =>
          hotels.filter(h => (h.address?.country || 'Unknown') === country).length
        ) : [],
        backgroundColor: 'rgba(139, 69, 19, 0.6)',
        borderColor: 'rgb(139, 69, 19)',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Super Admin Dashboard</h1>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>          {/* Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-500">Total Hotels</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{Array.isArray(hotels) ? hotels.length : 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-500">Active Hotels</h3>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {Array.isArray(hotels) ? hotels.filter(h => h.isActive && h.isPublished).length : 0}
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-500">Total Bookings</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">{bookingStats?.totalBookings || 0}</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-500">Platform Revenue</h3>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${bookingStats?.platformRevenue?.toFixed(2) || '0.00'}
              </p>
            </div>
          </div>

          {/* Time Period Selector */}
          <div className="flex mb-6">
            <div className="bg-white rounded-lg shadow p-4">
              <h3 className="text-sm font-medium text-gray-500 mb-3">Select Period</h3>
              <div className="flex space-x-2">
                <button
                  className={`px-4 py-2 rounded ${period === 'week' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                  onClick={() => setPeriod('week')}
                >
                  Week
                </button>
                <button
                  className={`px-4 py-2 rounded ${period === 'month' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                  onClick={() => setPeriod('month')}
                >
                  Month
                </button>
                <button
                  className={`px-4 py-2 rounded ${period === 'year' ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-800'}`}
                  onClick={() => setPeriod('year')}
                >
                  Year
                </button>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Top 5 Hotels by Revenue</h3>
              {Array.isArray(hotels) && hotels.length > 0 ? (
                <Bar
                  data={revenueData}
                  options={{
                    responsive: true,
                    plugins: {
                      legend: { position: 'top' },
                      title: { display: false }
                    }
                  }}
                />
              ) : (
                <p className="text-gray-500">No hotel data available</p>
              )}
            </div>            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Hotel Status Distribution</h3>
              <div className="h-64">
                <Doughnut
                  data={hotelStatusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { position: 'bottom' }
                    }
                  }}
                />
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-lg shadow mb-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">Recent Platform Activity</h3>
            </div>
            <div className="overflow-hidden overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bookingStats?.recentActivity?.map((activity, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{activity.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.hotelName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{activity.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(activity.date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                  {(!bookingStats?.recentActivity || bookingStats.recentActivity.length === 0) && (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No recent activity</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
