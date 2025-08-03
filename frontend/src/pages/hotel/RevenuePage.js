import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelStats, selectHotelStats, selectHotelStatsLoading } from '../../redux/slices/hotelSlice';

/**
 * Hotel Admin Revenue Management Page
 * @returns {JSX.Element} Revenue management page
 */
const RevenuePage = () => {
  const dispatch = useDispatch();
  const dashboardStats = useSelector(selectHotelStats);
  const isLoading = useSelector(selectHotelStatsLoading);
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    console.log('🔍 RevenuePage - Fetching hotel stats');
    dispatch(fetchHotelStats());
  }, [dispatch, dateRange]);

  useEffect(() => {
    if (dashboardStats) {
      console.log('🔍 RevenuePage - Dashboard stats:', dashboardStats);
      console.log('🔍 RevenuePage - Revenue stats:', dashboardStats.revenueStats);
      console.log('🔍 RevenuePage - Category performance:', dashboardStats.categoryPerformance);
      console.log('🔍 RevenuePage - Monthly trends:', dashboardStats.monthlyTrends);
    }
  }, [dashboardStats]);

  // Extract revenue data from dashboard stats
  const revenueStats = dashboardStats?.revenueStats || [];
  const categoryPerformance = dashboardStats?.categoryPerformance || [];
  const monthlyTrends = dashboardStats?.monthlyTrends || [];
  const recentBookings = dashboardStats?.recentBookings || [];

  // Calculate metrics from actual data
  const totalRevenue = Array.isArray(revenueStats) && revenueStats.length > 0
    ? revenueStats[0]?.totalRevenue || 0
    : 0;
    const totalBookings = dashboardStats?.counts?.totalBookings || 0;
  const completedBookings = recentBookings.filter(booking =>
    booking.status?.toLowerCase() === 'completed'
  ).length;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Debug logging
  console.log('🔍 Revenue Page Debug:');
  console.log('- dashboardStats:', dashboardStats);
  console.log('- recentBookings:', recentBookings);
  console.log('- totalBookings:', totalBookings);
  console.log('- completedBookings:', completedBookings);
  console.log('- Booking statuses:', recentBookings.map(b => ({ id: b._id?.substring(0, 8), status: b.status })));

  // Calculate completion rate
  const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;

  const chartRevenue = monthlyTrends.map(trend => trend.revenue).slice(-12);

  // Get top 5 categories by revenue
  const topCategories = categoryPerformance.slice(0, 5);

  // Calculate total revenue for percentage calculations
  const totalCategoryRevenue = categoryPerformance.reduce((sum, cat) => sum + cat.revenue, 0);

  // Handle date range change
  const handleDateRangeChange = (range) => {
    setDateRange(range);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Revenue Management</h1>

      {/* Date Range Selection */}
      <div className="flex space-x-2 mb-6">
        <button
          onClick={() => handleDateRangeChange('week')}
          className={`px-4 py-2 rounded-md ${
            dateRange === 'week'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Week
        </button>
        <button
          onClick={() => handleDateRangeChange('month')}
          className={`px-4 py-2 rounded-md ${
            dateRange === 'month'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Month
        </button>
        <button
          onClick={() => handleDateRangeChange('quarter')}
          className={`px-4 py-2 rounded-md ${
            dateRange === 'quarter'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Quarter
        </button>
        <button
          onClick={() => handleDateRangeChange('year')}
          className={`px-4 py-2 rounded-md ${
            dateRange === 'year'
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          This Year
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Total Revenue</h3>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              <div className="text-gray-500 text-sm mt-2">
                <span className="font-medium">Based on completed orders</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Total Bookings</h3>
              <p className="text-2xl font-bold">{totalBookings.toLocaleString()}</p>
              <div className="text-gray-500 text-sm mt-2">
                <span className="font-medium">All time bookings</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Avg. Booking Value</h3>
              <p className="text-2xl font-bold">${avgBookingValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <div className="text-gray-500 text-sm mt-2">
                <span className="font-medium">Average order value</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Completion Rate</h3>
              <p className="text-2xl font-bold">
                {completionRate.toFixed(1)}%
              </p>
              <div className="text-gray-500 text-sm mt-2">
                <span className="font-medium">Orders completed</span>
              </div>
            </div>
          </div>          {/* Revenue Chart */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold mb-4">Revenue Trends</h2>
            {monthlyTrends.length > 0 ? (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Total Months</p>
                    <p className="text-2xl font-bold">{monthlyTrends.length}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Peak Month Revenue</p>
                    <p className="text-2xl font-bold">
                      ${Math.max(...chartRevenue).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-sm text-gray-500">Avg Monthly Revenue</p>
                    <p className="text-2xl font-bold">
                      ${(chartRevenue.reduce((a, b) => a + b, 0) / chartRevenue.length).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="bg-gray-50 p-4 rounded">
                  <p className="text-sm text-gray-600 mb-2">Monthly Revenue Data:</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                    {monthlyTrends.slice(-8).map((trend, index) => (
                      <div key={index} className="bg-white p-2 rounded">
                        <p className="font-medium">
                          {new Date(2024, trend._id.month - 1).toLocaleString('default', { month: 'short' })} {trend._id.year}
                        </p>
                        <p className="text-green-600">${trend.revenue.toLocaleString()}</p>
                        <p className="text-gray-500">{trend.count} orders</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <p className="text-gray-400 mb-2">No revenue data available yet</p>
                  <p className="text-sm text-gray-500">Revenue trends will appear here once orders are completed</p>
                </div>
              </div>
            )}
          </div>

          {/* Revenue by Category & Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
              <div className="space-y-4">
                {topCategories.length > 0 ? (
                  topCategories.map((category, index) => {
                    const percentage = totalCategoryRevenue > 0
                      ? ((category.revenue / totalCategoryRevenue) * 100).toFixed(0)
                      : 0;
                    return (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium capitalize">{category._id || 'Unknown'}</h3>
                          <p className="text-sm text-gray-500">{percentage}% of total • {category.bookings} bookings</p>
                        </div>
                        <span className="font-semibold">${category.revenue.toLocaleString()}</span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No category data available</p>
                  </div>
                )}
              </div>
            </div>            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Recent High-Value Orders</h2>
              <div className="space-y-4">
                {recentBookings.length > 0 ? (
                  recentBookings
                    .filter(booking => booking.pricing?.totalAmount > 0)
                    .slice(0, 5)
                    .map((booking, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <div>
                          <h3 className="font-medium">{booking.serviceId?.name || 'Service Name'}</h3>
                          <p className="text-sm text-gray-500">
                            {booking.serviceId?.category || 'Category'} •
                            Status: {booking.status} •
                            Guest: {booking.guestId?.firstName || 'Unknown'} {booking.guestId?.lastName || ''}
                          </p>
                        </div>
                        <span className="font-semibold">${booking.pricing?.totalAmount?.toFixed(2) || '0.00'}</span>
                      </div>
                    ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent orders available</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Download Report Button */}
          <div className="flex justify-end">
            <button className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Report
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default RevenuePage;
