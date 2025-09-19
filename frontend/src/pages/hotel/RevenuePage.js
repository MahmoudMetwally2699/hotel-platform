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
    <div className="min-h-screen bg-gradient-to-br from-[#67BAE0]/10 via-white to-[#3B5787]/10">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Modern Header Section */}
        <div className="mb-8">
          <div className="bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 bg-white bg-opacity-20 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                  <h1 className="text-2xl font-bold text-white">Revenue Analytics</h1>
                </div>
                <p className="text-blue-100 text-sm">Track your hotel's financial performance and revenue streams</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-white">
                  ${totalRevenue.toLocaleString()}
                </div>
                <div className="text-blue-100 text-sm">Total Revenue</div>
              </div>
            </div>
          </div>
        </div>

        {/* Date Range Selection */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-modern-darkGray mb-3">Time Period</h3>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleDateRangeChange('week')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === 'week'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-md'
                    : 'bg-gray-50 text-modern-darkGray hover:bg-gray-100 hover:shadow-sm'
                }`}
              >
                This Week
              </button>
              <button
                onClick={() => handleDateRangeChange('month')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === 'month'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-md'
                    : 'bg-gray-50 text-modern-darkGray hover:bg-gray-100 hover:shadow-sm'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => handleDateRangeChange('quarter')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === 'quarter'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-md'
                    : 'bg-gray-50 text-modern-darkGray hover:bg-gray-100 hover:shadow-sm'
                }`}
              >
                This Quarter
              </button>
              <button
                onClick={() => handleDateRangeChange('year')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  dateRange === 'year'
                    ? 'bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white shadow-md'
                    : 'bg-gray-50 text-modern-darkGray hover:bg-gray-100 hover:shadow-sm'
                }`}
              >
                This Year
              </button>
            </div>
          </div>
        </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#3B5787]"></div>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-r from-modern-blue to-modern-lightBlue p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Revenue</p>
                  <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
              </div>
              <div className="text-blue-100 text-sm mt-2">
                <span className="font-medium">Based on completed orders</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#67BAE0] to-[#3B5787] p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Total Bookings</p>
                  <p className="text-2xl font-bold">{totalBookings.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                  </svg>
                </div>
              </div>
              <div className="text-white/80 text-sm mt-2">
                <span className="font-medium">All time bookings</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#2A4065] to-[#3B5787] p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Avg. Booking Value</p>
                  <p className="text-2xl font-bold">${avgBookingValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
              </div>
              <div className="text-white/80 text-sm mt-2">
                <span className="font-medium">Average order value</span>
              </div>
            </div>

            <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] p-6 rounded-xl shadow-lg text-white">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm">Completion Rate</p>
                  <p className="text-2xl font-bold">{completionRate.toFixed(1)}%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="text-white/80 text-sm mt-2">
                <span className="font-medium">Orders completed</span>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 mb-8 overflow-hidden">
            <div className="bg-gradient-to-r from-modern-blue to-modern-lightBlue p-6">
              <h2 className="text-xl font-semibold text-white">Revenue Trends</h2>
              <p className="text-blue-100 text-sm mt-1">Monthly performance overview</p>
            </div>
            <div className="p-6">
              {monthlyTrends.length > 0 ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                      <p className="text-sm text-modern-darkGray font-medium">Total Months</p>
                      <p className="text-3xl font-bold text-modern-blue mt-1">{monthlyTrends.length}</p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-[#67BAE0]/20 to-[#67BAE0]/40 rounded-lg">
                      <p className="text-sm text-modern-darkGray font-medium">Peak Month Revenue</p>
                      <p className="text-3xl font-bold text-[#3B5787] mt-1">
                        ${Math.max(...chartRevenue).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-center p-4 bg-gradient-to-br from-[#3B5787]/20 to-[#3B5787]/40 rounded-lg">
                      <p className="text-sm text-modern-darkGray font-medium">Avg Monthly Revenue</p>
                      <p className="text-3xl font-bold text-[#2A4065] mt-1">
                        ${(chartRevenue.reduce((a, b) => a + b, 0) / chartRevenue.length).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-6 rounded-xl">
                    <p className="text-modern-darkGray font-semibold mb-4">Monthly Revenue Data</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {monthlyTrends.slice(-8).map((trend, index) => (
                        <div key={index} className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          <p className="font-semibold text-modern-darkGray">
                            {new Date(2024, trend._id.month - 1).toLocaleString('default', { month: 'short' })} {trend._id.year}
                          </p>
                          <p className="text-[#3B5787] font-bold text-lg">${trend.revenue.toLocaleString()}</p>
                          <p className="text-modern-gray text-sm">{trend.count} orders</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-modern-lightBlue/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-modern-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-modern-darkGray font-medium mb-2">No revenue data available yet</p>
                    <p className="text-modern-gray">Revenue trends will appear here once orders are completed</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Revenue by Category & Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] p-6">
                <h2 className="text-xl font-semibold text-white">Revenue by Category</h2>
                <p className="text-white/80 text-sm mt-1">Performance breakdown</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {topCategories.length > 0 ? (
                    topCategories.map((category, index) => {
                      const percentage = totalCategoryRevenue > 0
                        ? ((category.revenue / totalCategoryRevenue) * 100).toFixed(0)
                        : 0;
                      return (
                        <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
                          <div>
                            <h3 className="font-semibold capitalize text-modern-darkGray">{category._id || 'Unknown'}</h3>
                            <p className="text-sm text-modern-gray">{percentage}% of total • {category.bookings} bookings</p>
                          </div>
                          <span className="font-bold text-[#3B5787] text-lg">${category.revenue.toLocaleString()}</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#67BAE0]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <p className="text-modern-gray">No category data available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#67BAE0] to-[#3B5787] p-6">
                <h2 className="text-xl font-semibold text-white">Recent High-Value Orders</h2>
                <p className="text-white/80 text-sm mt-1">Top performing bookings</p>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {recentBookings.length > 0 ? (
                    recentBookings
                      .filter(booking => booking.pricing?.totalAmount > 0)
                      .slice(0, 5)
                      .map((booking, index) => (
                        <div key={index} className="flex justify-between items-center p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg hover:shadow-md transition-shadow">
                          <div>
                            <h3 className="font-semibold text-modern-darkGray">{booking.serviceId?.name || 'Service Name'}</h3>
                            <p className="text-sm text-modern-gray">
                              {booking.serviceId?.category || 'Category'} • Status: <span className="font-medium">{booking.status}</span>
                            </p>
                            <p className="text-xs text-modern-gray mt-1">
                              Guest: {booking.guestId?.firstName || 'Unknown'} {booking.guestId?.lastName || ''}
                            </p>
                          </div>
                          <span className="font-bold text-[#3B5787] text-lg">${booking.pricing?.totalAmount?.toFixed(2) || '0.00'}</span>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-[#67BAE0]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                        </svg>
                      </div>
                      <p className="text-modern-gray">No recent orders available</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Download Report Button */}
          <div className="flex justify-end">
            <button className="px-6 py-3 bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white rounded-xl hover:from-modern-blue/90 hover:to-modern-lightBlue/90 transition-all duration-200 flex items-center shadow-lg hover:shadow-xl">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Download Report
            </button>
          </div>
        </>
      )}
      </div>
    </div>
  );
};

export default RevenuePage;
