/**
 * Generic Service Provider Dashboard
 * A clean, modern analytics dashboard that works for any service type
 * Uses the hotel's branding colors for theming
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  FaDollarSign,
  FaClipboardList,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaHourglass,
  FaTimesCircle,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaEye,
  FaBell,
  FaCalendarAlt,
  FaSpinner,
  FaConciergeBell
} from 'react-icons/fa';
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
import apiClient from '../../services/api.service';
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

const ServiceDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    provider: null,
    hotel: {
      name: '',
      branding: {
        primaryColor: '#2563eb',
        secondaryColor: '#3b82f6',
        accentColor: '#60a5fa'
      }
    },
    counts: {
      totalServices: 0,
      activeServices: 0,
      totalBookings: 0,
      activeBookings: 0
    },
    metrics: {
      totalBookings: 0,
      completedBookings: 0,
      totalEarnings: 0,
      thisMonthEarnings: 0,
      averageRating: 0
    },
    recentBookings: [],
    monthlyEarnings: []
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/service/dashboard');
      if (response.data && response.data.data) {
        setDashboardData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get hotel branding colors with fallbacks
  const branding = dashboardData.hotel?.branding || {
    primaryColor: '#2563eb',
    secondaryColor: '#3b82f6',
    accentColor: '#60a5fa'
  };

  // Get hotel currency
  const currency = dashboardData.hotel?.currency || 'USD';

  // Calculate completion rate
  const completionRate = dashboardData.metrics?.totalBookings > 0
    ? Math.round((dashboardData.metrics.completedBookings / dashboardData.metrics.totalBookings) * 100)
    : 0;

  // Chart configurations with hotel colors
  const revenueChartData = {
    labels: dashboardData.monthlyEarnings?.map(e => `${e._id?.month}/${e._id?.year}`) || [],
    datasets: [
      {
        label: t('dashboard.earnings') || 'Earnings',
        data: dashboardData.monthlyEarnings?.map(e => e.earnings) || [],
        borderColor: branding.primaryColor,
        backgroundColor: `${branding.primaryColor}20`,
        tension: 0.4,
        fill: true,
      },
    ],
  };

  const statusChartData = {
    labels: [t('dashboard.completed') || 'Completed', t('dashboard.active') || 'Active'],
    datasets: [
      {
        data: [
          dashboardData.metrics?.completedBookings || 0,
          dashboardData.counts?.activeBookings || 0
        ],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          branding.primaryColor + 'cc',
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          branding.primaryColor,
        ],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
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
          color: 'rgba(0, 0, 0, 0.05)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 20,
        },
      },
    },
    cutout: '65%',
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: FaCheckCircle },
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: FaHourglass },
      'in-progress': { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaClock },
      confirmed: { bg: 'bg-blue-100', text: 'text-blue-800', icon: FaCheckCircle },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: FaTimesCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {t(`dashboard.orderStatus.${status}`) || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-12 h-12 animate-spin mx-auto mb-4" style={{ color: branding.primaryColor }} />
          <p className="text-gray-600">{t('common.loading') || 'Loading dashboard...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header with Hotel Theme */}
      <div
        className="text-white"
        style={{
          background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor || branding.primaryColor} 100%)`
        }}
      >
        <div className="px-6 py-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">{t('dashboard.title') || 'Dashboard'}</h1>
              <p className="text-white/80 mt-1">
                {dashboardData.hotel?.name || t('dashboard.overview') || 'Your business at a glance'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2 flex items-center gap-2">
                <FaCalendarAlt className="text-white/80" />
                <span className="text-sm">{new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="px-6 py-8 -mt-4">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {/* Total Earnings */}
          <div
            className="rounded-2xl shadow-lg p-6 text-white"
            style={{
              background: `linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor || branding.primaryColor} 100%)`
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-white/80 text-sm font-medium">{t('dashboard.totalEarnings') || 'Total Earnings'}</p>
                <p className="text-3xl font-bold mt-2">
                  {formatPriceByLanguage(dashboardData.metrics?.totalEarnings || 0, i18n.language, currency)}
                </p>
                <p className="text-white/60 text-sm mt-2">
                  {t('dashboard.thisMonth') || 'This month'}: {formatPriceByLanguage(dashboardData.metrics?.thisMonthEarnings || 0, i18n.language, currency)}
                </p>
              </div>
              <div className="bg-white/20 rounded-xl p-3">
                <FaDollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Total Bookings */}
          <div
            className="bg-white rounded-2xl shadow-lg p-6 border-l-4"
            style={{ borderColor: branding.primaryColor }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('dashboard.totalBookings') || 'Total Bookings'}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{dashboardData.metrics?.totalBookings || 0}</p>
                <p className="text-gray-400 text-sm mt-2">
                  {t('dashboard.active') || 'Active'}: {dashboardData.counts?.activeBookings || 0}
                </p>
              </div>
              <div
                className="rounded-xl p-3"
                style={{ backgroundColor: `${branding.primaryColor}15` }}
              >
                <FaClipboardList className="w-6 h-6" style={{ color: branding.primaryColor }} />
              </div>
            </div>
          </div>

          {/* Completion Rate */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('dashboard.completionRate') || 'Completion Rate'}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{completionRate}%</p>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${completionRate}%` }}
                    />
                  </div>
                </div>
              </div>
              <div className="bg-green-100 rounded-xl p-3">
                <FaCheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          {/* Average Rating */}
          <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-yellow-500">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">{t('dashboard.avgRating') || 'Average Rating'}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">
                  {(dashboardData.metrics?.averageRating || 0).toFixed(1)}
                </p>
                <div className="mt-3 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`w-4 h-4 ${star <= Math.round(dashboardData.metrics?.averageRating || 0) ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                </div>
              </div>
              <div className="bg-yellow-100 rounded-xl p-3">
                <FaStar className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Earnings Chart */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                <FaChartLine className="inline-block mr-2" style={{ color: branding.primaryColor }} />
                {t('dashboard.earningsTrend') || 'Earnings Trend'}
              </h3>
            </div>
            <div className="h-64">
              {dashboardData.monthlyEarnings && dashboardData.monthlyEarnings.length > 0 ? (
                <Line data={revenueChartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FaChartLine className="w-12 h-12 mx-auto mb-2" />
                    <p>{t('dashboard.noData') || 'No earnings data yet'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Booking Status Distribution */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              {t('dashboard.bookingStatus') || 'Booking Status'}
            </h3>
            <div className="h-64">
              {(dashboardData.metrics?.completedBookings || dashboardData.counts?.activeBookings) ? (
                <Doughnut data={statusChartData} options={doughnutOptions} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <div className="text-center">
                    <FaClipboardList className="w-12 h-12 mx-auto mb-2" />
                    <p>{t('dashboard.noBookings') || 'No bookings yet'}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div
              className="rounded-xl p-4"
              style={{ backgroundColor: `${branding.primaryColor}15` }}
            >
              <FaConciergeBell className="w-8 h-8" style={{ color: branding.primaryColor }} />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('dashboard.totalServices') || 'Total Services'}</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.counts?.totalServices || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="bg-green-100 rounded-xl p-4">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('dashboard.activeServices') || 'Active Services'}</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.counts?.activeServices || 0}</p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 flex items-center gap-4">
            <div className="bg-green-100 rounded-xl p-4">
              <FaCheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">{t('dashboard.completedBookings') || 'Completed'}</p>
              <p className="text-2xl font-bold text-gray-900">{dashboardData.metrics?.completedBookings || 0}</p>
            </div>
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              <FaBell className="inline-block mr-2" style={{ color: branding.primaryColor }} />
              {t('dashboard.recentBookings') || 'Recent Bookings'}
            </h3>
            <button
              onClick={() => navigate('/service/orders')}
              className="text-sm font-medium flex items-center gap-1 hover:opacity-80"
              style={{ color: branding.primaryColor }}
            >
              {t('dashboard.viewAll') || 'View All'}
              <FaEye className="w-4 h-4" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('dashboard.service') || 'Service'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('dashboard.status') || 'Status'}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    {t('dashboard.date') || 'Date'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {dashboardData.recentBookings && dashboardData.recentBookings.length > 0 ? (
                  dashboardData.recentBookings.slice(0, 5).map((booking) => (
                    <tr key={booking._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {booking.serviceId?.name || t('dashboard.service') || 'Service'}
                        </span>
                        <p className="text-xs text-gray-500">{booking.serviceId?.category}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(booking.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-500">
                          {new Date(booking.createdAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center">
                      <FaClipboardList className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500">{t('dashboard.noRecentBookings') || 'No recent bookings'}</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDashboard;
