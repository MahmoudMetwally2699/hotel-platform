/**
 * Platform Metrics Page
 * Displays platform-wide metrics for super admins
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { useTranslation } from 'react-i18next';
import { SUPERADMIN_API } from '../../config/api.config';
import { formatPriceByLanguage } from '../../utils/currency';

const PlatformMetricsPage = () => {
  const { i18n } = useTranslation();
  const [metrics, setMetrics] = useState({
    totalHotels: 0,
    totalServiceProviders: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0,
    platformGrowth: {
      hotels: [],
      serviceProviders: [],
      users: []
    },
    systemHealth: {
      uptime: 0,
      serverLoad: 0,
      memoryUsage: 0,
      apiRequests: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPlatformMetrics = async () => {
      try {
        setLoading(true);
        const response = await axios.get(SUPERADMIN_API.PLATFORM_METRICS);
        setMetrics(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load platform metrics');
        toast.error('Failed to load platform metrics');
        setLoading(false);
        console.error('Error fetching platform metrics:', err);
      }
    };

    fetchPlatformMetrics();
  }, []);

  if (loading) return <div className="flex items-center justify-center h-screen">Loading metrics...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Platform Metrics</h1>

      {/* Platform Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Platform Users</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Hotels</p>
              <p className="text-xl font-bold">{metrics.totalHotels}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Service Providers</p>
              <p className="text-xl font-bold">{metrics.totalServiceProviders}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Users</p>
              <p className="text-xl font-bold">{metrics.totalUsers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">Platform Activity</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Total Bookings</p>
              <p className="text-xl font-bold">{metrics.totalBookings}</p>
            </div>            <div>
              <p className="text-sm text-gray-500">Total Revenue</p>
              <p className="text-xl font-bold">{formatPriceByLanguage(metrics.totalRevenue, i18n.language)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">API Requests (24h)</p>
              <p className="text-xl font-bold">{metrics.systemHealth.apiRequests}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-2">System Health</h2>
          <div className="space-y-2">
            <div>
              <p className="text-sm text-gray-500">Server Uptime</p>
              <p className="text-xl font-bold">{Math.floor(metrics.systemHealth.uptime / 86400)} days</p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-blue-600 h-2.5 rounded-full" style={{ width: `${metrics.systemHealth.serverLoad}%` }}></div>
            </div>
            <p className="text-xs text-gray-500">Server Load: {metrics.systemHealth.serverLoad}%</p>

            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${metrics.systemHealth.memoryUsage}%` }}></div>
            </div>
            <p className="text-xs text-gray-500">Memory Usage: {metrics.systemHealth.memoryUsage}%</p>
          </div>
        </div>
      </div>

      {/* Growth Charts */}
      <div className="bg-white p-6 rounded-lg shadow mb-8">
        <h2 className="text-xl font-semibold mb-4">Platform Growth</h2>
        <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
          <p className="text-gray-500">Growth Chart Placeholder</p>
          {/* In a real implementation, you would use Chart.js or similar to render charts */}
        </div>
      </div>

      {/* Hotel Distribution */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Regional Distribution</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Map Visualization Placeholder</p>
            {/* In a real implementation, you would use a map library */}
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold mb-4">Service Category Distribution</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Pie Chart Placeholder</p>
            {/* In a real implementation, you would use Chart.js or similar */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformMetricsPage;
