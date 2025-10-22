import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Package } from 'lucide-react';

const ServicePopularityTable = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Service Popularity & Revenue Analysis</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.services || data.services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Service Popularity & Revenue Analysis</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <p className="text-gray-500">No service data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatServiceName = (service) => {
    const names = {
      housekeeping: 'Housekeeping',
      laundry: 'Laundry',
      restaurant: 'Restaurant',
      transportation: 'Transportation',
      maintenance: 'Maintenance',
      cleaning: 'Cleaning',
      amenities: 'Amenities'
    };
    return names[service] || service;
  };

  const pieData = data.services.map(service => ({
    name: formatServiceName(service.serviceType),
    value: service.totalRequests
  }));

  const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-2">Service Popularity & Revenue Analysis</h3>
      <p className="text-sm text-gray-600 mb-6">Most active and in-demand services with spending metrics</p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Request Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${entry.name}: ${entry.value}`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Services Table */}
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-4">Detailed Metrics</h4>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.services.map((service, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-semibold text-gray-900">
                    {formatServiceName(service.serviceType)}
                  </h5>
                  <span className="text-sm font-medium text-blue-600">
                    {service.popularityPercentage}%
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600">Requests</p>
                    <p className="font-semibold text-gray-900 flex items-center gap-1">
                      <Package className="w-4 h-4" />
                      {service.totalRequests}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Revenue</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(service.totalRevenue)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Avg Spending</p>
                    <p className="font-semibold text-gray-900">
                      {formatCurrency(service.avgSpending)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Customers</p>
                    <p className="font-semibold text-gray-900">
                      {service.uniqueCustomers}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePopularityTable;
