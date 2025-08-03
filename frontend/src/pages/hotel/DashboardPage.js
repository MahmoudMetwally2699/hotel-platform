/**
 * Hotel Admin Dashboard Page
 * Main dashboard for hotel administrators
 */

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelStats, selectHotelStats, selectHotelStatsLoading } from '../../redux/slices/hotelSlice';

const DashboardPage = () => {
  const dispatch = useDispatch();
  const dashboardStats = useSelector(selectHotelStats);
  const isLoading = useSelector(selectHotelStatsLoading);
  useEffect(() => {
    dispatch(fetchHotelStats());
  }, [dispatch]);
  // Extract stats from dashboard data
  const stats = dashboardStats ? {
    revenue: {
      total: dashboardStats.revenueStats?.[0]?.totalRevenue || 0,
      trend: 5.3 // This would be calculated from monthlyTrends in real implementation
    },
    bookings: {
      total: dashboardStats.counts?.totalBookings || 0,
      trend: 3.1 // This would be calculated from monthlyTrends in real implementation
    },
    services: {
      total: dashboardStats.counts?.activeServices || 0,
      categories: dashboardStats.servicesByCategory?.length || 0
    },
    serviceProviders: {
      total: dashboardStats.counts?.totalProviders || 0,
      active: dashboardStats.counts?.activeProviders || 0
    }
  } : {
    revenue: { total: 0, trend: 0 },
    bookings: { total: 0, trend: 0 },
    services: { total: 0, categories: 0 },
    serviceProviders: { total: 0, active: 0 }
  };

  const recentOrders = dashboardStats?.recentBookings || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Hotel Dashboard</h1>
        <button
          className="btn-primary"
          onClick={() => dispatch(fetchHotelStats())}
          disabled={isLoading}
        >
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
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
              <span className="text-2xl font-bold">${stats.revenue.total.toFixed(2)}</span>
              <span className={`text-sm ${stats.revenue.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.revenue.trend > 0 ? '↑' : '↓'} {Math.abs(stats.revenue.trend)}% from last month
              </span>
            </div>

            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Total Bookings</span>
              <span className="text-2xl font-bold">{stats.bookings.total}</span>
              <span className={`text-sm ${stats.bookings.trend > 0 ? 'text-green-500' : 'text-red-500'}`}>
                {stats.bookings.trend > 0 ? '↑' : '↓'} {Math.abs(stats.bookings.trend)}% from last month
              </span>
            </div>

            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Active Services</span>
              <span className="text-2xl font-bold">{stats.services.total}</span>
              <span className="text-sm text-gray-500">
                {stats.services.categories} categories
              </span>
            </div>

            <div className="card flex flex-col p-4">
              <span className="text-gray-500 text-sm">Service Providers</span>
              <span className="text-2xl font-bold">{stats.serviceProviders.total}</span>
              <span className="text-sm text-gray-500">
                {stats.serviceProviders.active} active
              </span>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="card overflow-hidden">
            <h2 className="text-lg font-semibold mb-4 px-6 pt-6">Recent Orders</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Guest</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Service</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders?.length > 0 ? (
                    recentOrders.map((order) => (
                      <tr key={order._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">#{order.bookingId || order._id?.slice(-6)}</td>                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium text-gray-600">
                              {order.guestId?.firstName?.charAt(0) || order.guestDetails?.firstName?.charAt(0) || 'G'}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {order.guestId?.firstName && order.guestId?.lastName
                                  ? `${order.guestId.firstName} ${order.guestId.lastName}`
                                  : order.guestDetails?.firstName && order.guestDetails?.lastName
                                  ? `${order.guestDetails.firstName} ${order.guestDetails.lastName}`
                                  : 'Unknown Guest'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {order.guestId?.email || order.guestDetails?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {order.serviceId?.name || 'Unknown Service'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {order.serviceProviderId?.businessName || 'Unknown Provider'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(order.createdAt || order.date).toLocaleDateString()}
                        </td>                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          ${(order.pricing?.totalAmount || order.totalAmount || 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                              ${order.status === 'completed' ? 'bg-green-100 text-green-800' :
                                order.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'}`}
                          >
                            {order.status || 'processing'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent orders found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4">
              <button className="text-primary-main hover:text-primary-dark font-medium">View all orders</button>
            </div>
          </div>

          {/* Revenue Overview */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">Revenue Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-blue-800">Hotel Commission</h3>
                <p className="text-2xl font-bold text-blue-900">
                  ${(dashboardStats?.revenueStats?.[0]?.hotelEarnings || 0).toFixed(2)}
                </p>
                <p className="text-sm text-blue-600">From service markup</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-green-800">Total Revenue</h3>
                <p className="text-2xl font-bold text-green-900">
                  ${(dashboardStats?.revenueStats?.[0]?.totalRevenue || 0).toFixed(2)}
                </p>
                <p className="text-sm text-green-600">All services combined</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <h3 className="text-sm font-medium text-purple-800">Average Order Value</h3>
                <p className="text-2xl font-bold text-purple-900">
                  ${(dashboardStats?.revenueStats?.[0]?.averageOrderValue || 0).toFixed(2)}
                </p>
                <p className="text-sm text-purple-600">Per booking</p>
              </div>
            </div>
            {dashboardStats?.categoryPerformance?.length > 0 && (
              <div>
                <h3 className="text-md font-medium mb-3">Performance by Category</h3>
                <div className="space-y-2">
                  {dashboardStats.categoryPerformance.map((category, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium capitalize">{category._id}</span>
                        <span className="text-sm text-gray-500 ml-2">({category.bookings} orders)</span>
                      </div>
                      <span className="font-semibold">${category.revenue.toFixed(2)}</span>
                    </div>                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
