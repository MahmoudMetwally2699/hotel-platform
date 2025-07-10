import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchBookingStats, selectBookingStats, selectBookingStatsLoading } from '../../redux/slices/bookingSlice';
import useAuth from '../../hooks/useAuth';

/**
 * Hotel Admin Revenue Management Page
 * @returns {JSX.Element} Revenue management page
 */
const RevenuePage = () => {
  const dispatch = useDispatch();
  const bookingStats = useSelector(selectBookingStats);
  const isLoading = useSelector(selectBookingStatsLoading);
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState('month');

  useEffect(() => {
    if (user?.hotelId) {
      dispatch(fetchBookingStats());
    }
  }, [dispatch, user, dateRange]);

  // Calculate revenue metrics
  const totalRevenue = bookingStats?.revenue || 0;
  const totalBookings = bookingStats?.total || 0;
  const completedBookings = bookingStats?.completed || 0;
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  // Mock data for chart (would be replaced with real data from API)
  const revenueData = {
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    datasets: [
      {
        label: 'Revenue',
        data: [4500, 5200, 4800, 6000, 5500, 7000, 6500, 8000, 7500, 9000, 8500, 10000],
      }
    ]
  };

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Total Revenue</h3>
              <p className="text-2xl font-bold">${totalRevenue.toLocaleString()}</p>
              <div className="text-green-500 text-sm mt-2">
                <span className="font-medium">+5.3%</span> vs. last {dateRange}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Total Bookings</h3>
              <p className="text-2xl font-bold">{totalBookings.toLocaleString()}</p>
              <div className="text-green-500 text-sm mt-2">
                <span className="font-medium">+3.1%</span> vs. last {dateRange}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Avg. Booking Value</h3>
              <p className="text-2xl font-bold">${avgBookingValue.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</p>
              <div className="text-green-500 text-sm mt-2">
                <span className="font-medium">+2.2%</span> vs. last {dateRange}
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h3 className="text-gray-500 text-sm">Completion Rate</h3>
              <p className="text-2xl font-bold">
                {totalBookings > 0 ? ((completedBookings / totalBookings) * 100).toFixed(1) : 0}%
              </p>
              <div className="text-green-500 text-sm mt-2">
                <span className="font-medium">+1.8%</span> vs. last {dateRange}
              </div>
            </div>
          </div>

          {/* Revenue Chart (placeholder) */}
          <div className="bg-white p-6 rounded-lg shadow border border-gray-200 mb-8">
            <h2 className="text-lg font-semibold mb-4">Revenue Over Time</h2>
            <div className="h-64 flex items-center justify-center bg-gray-50">
              <p className="text-gray-400">Revenue chart would be displayed here</p>
            </div>
          </div>

          {/* Revenue by Category & Service */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Revenue by Category</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Laundry</h3>
                    <p className="text-sm text-gray-500">32% of total</p>
                  </div>
                  <span className="font-semibold">${(totalRevenue * 0.32).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Transportation</h3>
                    <p className="text-sm text-gray-500">28% of total</p>
                  </div>
                  <span className="font-semibold">${(totalRevenue * 0.28).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Tourism</h3>
                    <p className="text-sm text-gray-500">20% of total</p>
                  </div>
                  <span className="font-semibold">${(totalRevenue * 0.20).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Food & Beverage</h3>
                    <p className="text-sm text-gray-500">15% of total</p>
                  </div>
                  <span className="font-semibold">${(totalRevenue * 0.15).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Wellness & Spa</h3>
                    <p className="text-sm text-gray-500">5% of total</p>
                  </div>
                  <span className="font-semibold">${(totalRevenue * 0.05).toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
              <h2 className="text-lg font-semibold mb-4">Top Services by Revenue</h2>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">City Tour Package</h3>
                    <p className="text-sm text-gray-500">Tourism • 42 bookings</p>
                  </div>
                  <span className="font-semibold">$4,200</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Airport Transfer</h3>
                    <p className="text-sm text-gray-500">Transportation • 78 bookings</p>
                  </div>
                  <span className="font-semibold">$3,900</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Full Spa Package</h3>
                    <p className="text-sm text-gray-500">Wellness • 25 bookings</p>
                  </div>
                  <span className="font-semibold">$3,750</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Premium Laundry</h3>
                    <p className="text-sm text-gray-500">Laundry • 112 bookings</p>
                  </div>
                  <span className="font-semibold">$3,360</span>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-medium">Fine Dining Experience</h3>
                    <p className="text-sm text-gray-500">Food • 32 bookings</p>
                  </div>
                  <span className="font-semibold">$2,560</span>
                </div>
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
