import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  selectReportsData,
  fetchReportsData,
  selectReportsLoading,
  selectReportsError,
  exportReport
} from '../../redux/slices/reportSlice';
import { format, subMonths, subDays, parseISO } from 'date-fns';

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
import { Line, Bar } from 'react-chartjs-2';
import { formatPriceByLanguage } from '../../utils/currency';

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

const ReportsPage = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const reportsData = useSelector(selectReportsData);
  const loading = useSelector(selectReportsLoading);
  const error = useSelector(selectReportsError);

  // Platform default currency for aggregated super admin reports
  const platformCurrency = 'USD';

  const [reportType, setReportType] = useState('revenue');
  const [timeRange, setTimeRange] = useState('month');
  const [dateRange, setDateRange] = useState({
    start: format(subMonths(new Date(), 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    dispatch(fetchReportsData({
      type: reportType,
      timeRange,
      startDate: dateRange.start,
      endDate: dateRange.end,
      category: categoryFilter
    }));
  }, [dispatch, reportType, timeRange, dateRange, categoryFilter]);

  const handleTimeRangeChange = (range) => {
    let startDate;

    switch (range) {
      case 'week':
        startDate = format(subDays(new Date(), 7), 'yyyy-MM-dd');
        break;
      case 'month':
        startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
        break;
      case 'quarter':
        startDate = format(subMonths(new Date(), 3), 'yyyy-MM-dd');
        break;
      case 'year':
        startDate = format(subMonths(new Date(), 12), 'yyyy-MM-dd');
        break;
      default:
        startDate = format(subMonths(new Date(), 1), 'yyyy-MM-dd');
    }

    setTimeRange(range);
    setDateRange({
      start: startDate,
      end: format(new Date(), 'yyyy-MM-dd')
    });
  };

  const handleExport = (format) => {
    dispatch(exportReport({
      type: reportType,
      timeRange,
      startDate: dateRange.start,
      endDate: dateRange.end,
      category: categoryFilter,
      format
    }));
  };

  // Prepare chart data based on report type
  const getChartData = () => {
    if (!reportsData || !reportsData.timeSeries) return null;

    const labels = reportsData.timeSeries.map(item => {
      const date = parseISO(item.date);
      return timeRange === 'week' || timeRange === 'month'
        ? format(date, 'MMM dd')
        : format(date, 'MMM yyyy');
    });

    switch (reportType) {
      case 'revenue':
        return {
          labels,
          datasets: [
            {
              label: 'Total Revenue',
              data: reportsData.timeSeries.map(item => item.totalRevenue || 0),
              borderColor: 'rgb(53, 162, 235)',
              backgroundColor: 'rgba(53, 162, 235, 0.5)',
            },
            {
              label: 'Platform Revenue',
              data: reportsData.timeSeries.map(item => item.platformRevenue || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }
          ]
        };

      case 'bookings':
        return {
          labels,
          datasets: [
            {
              label: 'Total Bookings',
              data: reportsData.timeSeries.map(item => item.totalBookings || 0),
              borderColor: 'rgb(255, 99, 132)',
              backgroundColor: 'rgba(255, 99, 132, 0.5)',
            },
            {
              label: 'Completed Bookings',
              data: reportsData.timeSeries.map(item => item.completedBookings || 0),
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
            },
            {
              label: 'Cancelled Bookings',
              data: reportsData.timeSeries.map(item => item.cancelledBookings || 0),
              borderColor: 'rgb(255, 206, 86)',
              backgroundColor: 'rgba(255, 206, 86, 0.5)',
            }
          ]
        };

      case 'services':
        return {
          labels,
          datasets: [
            {
              label: 'Services Added',
              data: reportsData.timeSeries.map(item => item.servicesAdded || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }
          ]
        };

      case 'providers':
        return {
          labels,
          datasets: [
            {
              label: 'New Providers',
              data: reportsData.timeSeries.map(item => item.newProviders || 0),
              borderColor: 'rgb(153, 102, 255)',
              backgroundColor: 'rgba(153, 102, 255, 0.5)',
            },
            {
              label: 'Active Providers',
              data: reportsData.timeSeries.map(item => item.activeProviders || 0),
              borderColor: 'rgb(75, 192, 192)',
              backgroundColor: 'rgba(75, 192, 192, 0.5)',
            }
          ]
        };

      case 'hotels':
        return {
          labels,
          datasets: [
            {
              label: 'New Hotels',
              data: reportsData.timeSeries.map(item => item.newHotels || 0),
              borderColor: 'rgb(255, 159, 64)',
              backgroundColor: 'rgba(255, 159, 64, 0.5)',
            },
            {
              label: 'Active Hotels',
              data: reportsData.timeSeries.map(item => item.activeHotels || 0),
              borderColor: 'rgb(54, 162, 235)',
              backgroundColor: 'rgba(54, 162, 235, 0.5)',
            }
          ]
        };

      default:
        return null;
    }
  };

  // Get chart options based on report type
  const getChartOptions = () => {
    const baseOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'top',
        },
        tooltip: {
          mode: 'index',
          intersect: false,
        }
      },
      scales: {
        x: {
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: 'rgba(0, 0, 0, 0.05)'
          }
        }
      }
    };

    if (reportType === 'revenue') {
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          title: {
            display: true,
            text: 'Revenue Overview'
          },
          tooltip: {
            ...baseOptions.plugins.tooltip,
            callbacks: {
              label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.parsed.y !== null) {
                  label += formatPriceByLanguage(context.parsed.y, i18n.language, platformCurrency);
                }
                return label;
              }
            }
          }
        }
      };
    }

    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        title: {
          display: true,
          text: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Overview`
        }
      }
    };
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Reports & Analytics</h1>

      {/* Report Configuration */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Report Type */}
          <div>
            <label htmlFor="reportType" className="block text-sm font-medium text-gray-700 mb-1">
              Report Type
            </label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="revenue">Revenue</option>
              <option value="bookings">Bookings</option>
              <option value="services">Services</option>
              <option value="providers">Service Providers</option>
              <option value="hotels">Hotels</option>
            </select>
          </div>

          {/* Time Range */}
          <div>
            <label htmlFor="timeRange" className="block text-sm font-medium text-gray-700 mb-1">
              Time Range
            </label>
            <div className="flex rounded-md shadow-sm">
              <button
                type="button"
                onClick={() => handleTimeRangeChange('week')}
                className={`py-2 px-3 text-sm font-medium ${
                  timeRange === 'week'
                    ? 'bg-blue-50 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } rounded-l-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              >
                Week
              </button>
              <button
                type="button"
                onClick={() => handleTimeRangeChange('month')}
                className={`py-2 px-3 text-sm font-medium ${
                  timeRange === 'month'
                    ? 'bg-blue-50 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } -ml-px focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              >
                Month
              </button>
              <button
                type="button"
                onClick={() => handleTimeRangeChange('quarter')}
                className={`py-2 px-3 text-sm font-medium ${
                  timeRange === 'quarter'
                    ? 'bg-blue-50 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } -ml-px focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              >
                Quarter
              </button>
              <button
                type="button"
                onClick={() => handleTimeRangeChange('year')}
                className={`py-2 px-3 text-sm font-medium ${
                  timeRange === 'year'
                    ? 'bg-blue-50 text-blue-700 border border-blue-300'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                } -ml-px rounded-r-md focus:z-10 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500`}
              >
                Year
              </button>
            </div>
          </div>

          {/* Custom Date Range */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Custom Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter (only if applicable) */}
          {['bookings', 'services', 'providers'].includes(reportType) && (
            <div>
              <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="categoryFilter"
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full rounded-md border border-gray-300 shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="laundry">Laundry</option>
                <option value="transportation">Transportation</option>
                <option value="tours">Tours</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Report Summary Cards */}
      {!loading && reportsData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {reportType === 'revenue' && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Revenue</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatPriceByLanguage(reportsData.summary?.totalRevenue || 0, i18n.language, platformCurrency)}
                </p>
                <p className={`mt-1 text-sm ${
                  reportsData.summary?.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportsData.summary?.revenueGrowth >= 0 ? '↑' : '↓'} {Math.abs(reportsData.summary?.revenueGrowth || 0).toFixed(1)}%
                  <span className="text-gray-500"> from previous period</span>
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Platform Revenue</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatPriceByLanguage(reportsData.summary?.platformRevenue || 0, i18n.language, platformCurrency)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.platformRevenuePercentage?.toFixed(1) || '0.0'}% of total revenue
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Hotel Revenue</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatPriceByLanguage(reportsData.summary?.hotelRevenue || 0, i18n.language, platformCurrency)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.hotelRevenuePercentage?.toFixed(1) || '0.0'}% of total revenue
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Provider Revenue</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatPriceByLanguage(reportsData.summary?.providerRevenue || 0, i18n.language, platformCurrency)}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.providerRevenuePercentage?.toFixed(1) || '0.0'}% of total revenue
                </p>
              </div>
            </>
          )}

          {reportType === 'bookings' && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Bookings</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.totalBookings || '0'}
                </p>
                <p className={`mt-1 text-sm ${
                  reportsData.summary?.bookingsGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportsData.summary?.bookingsGrowth >= 0 ? '↑' : '↓'} {Math.abs(reportsData.summary?.bookingsGrowth || 0).toFixed(1)}%
                  <span className="text-gray-500"> from previous period</span>
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Completed Bookings</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.completedBookings || '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.completedBookingsPercentage?.toFixed(1) || '0.0'}% completion rate
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Cancelled Bookings</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.cancelledBookings || '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.cancelledBookingsPercentage?.toFixed(1) || '0.0'}% cancellation rate
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Average Booking Value</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatPriceByLanguage(reportsData.summary?.averageBookingValue || 0, i18n.language, platformCurrency)}
                </p>
                <p className={`mt-1 text-sm ${
                  reportsData.summary?.averageValueGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportsData.summary?.averageValueGrowth >= 0 ? '↑' : '↓'} {Math.abs(reportsData.summary?.averageValueGrowth || 0).toFixed(1)}%
                </p>
              </div>
            </>
          )}

          {reportType === 'services' && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Services</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.totalServices || '0'}
                </p>
                <p className={`mt-1 text-sm ${
                  reportsData.summary?.servicesGrowth >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {reportsData.summary?.servicesGrowth >= 0 ? '↑' : '↓'} {Math.abs(reportsData.summary?.servicesGrowth || 0).toFixed(1)}%
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Services By Category</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Laundry:</span>
                    <span className="text-sm font-medium">{reportsData.summary?.laundryServices || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transportation:</span>
                    <span className="text-sm font-medium">{reportsData.summary?.transportationServices || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tours:</span>
                    <span className="text-sm font-medium">{reportsData.summary?.toursServices || '0'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Average Service Price</h3>                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {formatPriceByLanguage(reportsData.summary?.averageServicePrice, i18n.language) || '0.00'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Average Markup</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.averageMarkup?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </>
          )}

          {reportType === 'providers' && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Providers</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.totalProviders || '0'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">New Providers</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.newProviders || '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">in selected period</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Active Providers</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.activeProviders || '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.activeProvidersPercentage?.toFixed(1) || '0.0'}% of total
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">By Category</h3>
                <div className="mt-2 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Laundry:</span>
                    <span className="text-sm font-medium">{reportsData.summary?.laundryProviders || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Transportation:</span>
                    <span className="text-sm font-medium">{reportsData.summary?.transportationProviders || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tours:</span>
                    <span className="text-sm font-medium">{reportsData.summary?.toursProviders || '0'}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {reportType === 'hotels' && (
            <>
              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Total Hotels</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.totalHotels || '0'}
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">New Hotels</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.newHotels || '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">in selected period</p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Active Hotels</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.activeHotels || '0'}
                </p>
                <p className="mt-1 text-sm text-gray-500">
                  {reportsData.summary?.activeHotelsPercentage?.toFixed(1) || '0.0'}% of total
                </p>
              </div>

              <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-sm font-medium text-gray-500">Average Markup</h3>
                <p className="mt-2 text-3xl font-bold text-gray-900">
                  {reportsData.summary?.averageHotelMarkup?.toFixed(1) || '0.0'}%
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* Main Chart */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Trends
          </h2>

          <div className="flex space-x-2">
            <button
              onClick={() => handleExport('csv')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              CSV
            </button>

            <button
              onClick={() => handleExport('excel')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Excel
            </button>

            <button
              onClick={() => handleExport('pdf')}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <svg className="mr-1.5 h-4 w-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              PDF
            </button>
          </div>
        </div>

        <div className="h-80">
          {loading ? (
            <div className="flex justify-center items-center h-full">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-red-500">
                Error loading chart data: {error}
              </div>
            </div>
          ) : (
            getChartData() ? (
              reportType === 'bookings' ? (
                <Bar
                  data={getChartData()}
                  options={getChartOptions()}
                />
              ) : (
                <Line
                  data={getChartData()}
                  options={getChartOptions()}
                />
              )
            ) : (
              <div className="flex justify-center items-center h-full">
                <div className="text-gray-500">
                  No data available for the selected criteria
                </div>
              </div>
            )
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg font-medium text-gray-900">Detailed Data</h3>
        </div>

        <div className="border-t border-gray-200 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : reportsData?.tableData?.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {/* Dynamically render headers based on report type */}
                  {reportType === 'revenue' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Platform Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hotel Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                    </>
                  )}

                  {reportType === 'bookings' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Completed</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cancelled</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Value</th>
                    </>
                  )}

                  {reportType === 'services' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Services Added</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laundry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transportation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tours</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Price</th>
                    </>
                  )}

                  {reportType === 'providers' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Providers</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Laundry</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transportation</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tours</th>
                    </>
                  )}

                  {reportType === 'hotels' && (
                    <>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Hotels</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Active</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bookings</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg. Markup</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {reportsData.tableData.map((row, index) => (
                  <tr key={index}>
                    {/* Dynamically render cells based on report type */}
                    {reportType === 'revenue' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(row.date), timeRange === 'year' ? 'MMM yyyy' : 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.totalRevenue || 0, i18n.language, platformCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.platformRevenue || 0, i18n.language, platformCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.hotelRevenue || 0, i18n.language, platformCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.providerRevenue || 0, i18n.language, platformCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.totalBookings || '0'}
                        </td>
                      </>
                    )}

                    {reportType === 'bookings' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(row.date), timeRange === 'year' ? 'MMM yyyy' : 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.totalBookings || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.completedBookings || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.cancelledBookings || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.revenue || 0, i18n.language, platformCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.averageBookingValue || 0, i18n.language, platformCurrency)}
                        </td>
                      </>
                    )}

                    {reportType === 'services' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(row.date), timeRange === 'year' ? 'MMM yyyy' : 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.servicesAdded || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.laundryServices || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.transportationServices || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.toursServices || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.averageServicePrice || 0, i18n.language, platformCurrency)}
                        </td>
                      </>
                    )}

                    {reportType === 'providers' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(row.date), timeRange === 'year' ? 'MMM yyyy' : 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.newProviders || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.activeProviders || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.laundryProviders || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.transportationProviders || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.toursProviders || '0'}
                        </td>
                      </>
                    )}

                    {reportType === 'hotels' && (
                      <>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {format(parseISO(row.date), timeRange === 'year' ? 'MMM yyyy' : 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.newHotels || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.activeHotels || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatPriceByLanguage(row.hotelRevenue || 0, i18n.language, platformCurrency)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.totalBookings || '0'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {row.averageMarkup?.toFixed(1) || '0.0'}%
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex justify-center items-center h-40">
              <div className="text-gray-500">
                No data available for the selected criteria
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
