/**
 * Hotel Admin Dashboard Page
 * Main dashboard for hotel administrators
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelStats, selectHotelStats } from '../../redux/slices/hotelSlice';
import { fetchRecentBookings, selectRecentBookings } from '../../redux/slices/bookingSlice';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const hotelStats = useSelector(selectHotelStats);
  const recentBookings = useSelector(selectRecentBookings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          dispatch(fetchHotelStats()),
          dispatch(fetchRecentBookings({ limit: 5 }))
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hotel Dashboard</h1>
        <button className="btn-primary">Refresh Data</button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
        </div>
      ) : (
        <>
          {/* Stats Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Total Revenue</span>
              <span className="text-2xl font-bold">${hotelStats?.revenue?.total || 0}</span>
              <span className={`text-sm ${hotelStats?.revenue?.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {hotelStats?.revenue?.trend > 0 ? '↑' : '↓'} {Math.abs(hotelStats?.revenue?.trend || 0)}% from last month
              </span>
            </div>

            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Total Bookings</span>
              <span className="text-2xl font-bold">{hotelStats?.bookings?.total || 0}</span>
              <span className={`text-sm ${hotelStats?.bookings?.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {hotelStats?.bookings?.trend > 0 ? '↑' : '↓'} {Math.abs(hotelStats?.bookings?.trend || 0)}% from last month
              </span>
            </div>

            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Active Services</span>
              <span className="text-2xl font-bold">{hotelStats?.services?.total || 0}</span>
              <span className="text-sm text-gray-500">
                {hotelStats?.services?.categories || 0} categories
              </span>
            </div>

            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Service Providers</span>
              <span className="text-2xl font-bold">{hotelStats?.serviceProviders?.total || 0}</span>
              <span className="text-sm text-gray-500">
                {hotelStats?.serviceProviders?.active || 0} active
              </span>
            </div>
          </div>

          {/* Recent Bookings Table */}
          <div className="card overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 px-6 pt-6">Recent Bookings</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Booking ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentBookings?.length > 0 ? (
                    recentBookings.map((booking) => (
                      <tr key={booking._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{booking.bookingId}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                              {booking.guest?.name?.charAt(0) || 'G'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{booking.guest?.name || 'Unknown'}</div>
                              <div className="text-sm text-gray-500">{booking.guest?.email || 'No email'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{booking.service?.name || 'Unknown Service'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(booking.date).toLocaleDateString()}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${booking.amount?.toFixed(2) || '0.00'}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${booking.status === 'completed' ? 'bg-green-100 text-green-800' :
                                booking.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                booking.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'}`}
                          >
                            {booking.status || 'processing'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4">
              <button className="text-primary-main hover:text-primary-dark font-medium">View all bookings</button>
            </div>
          </div>

          {/* Revenue Chart Placeholder - We'll replace this with a real chart later */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
            <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Revenue chart will be implemented with Chart.js</p>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
