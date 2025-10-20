/**
 * Ratings By Type Chart Component
 * Dual-axis bar chart showing average ratings and request counts
 */

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';

const RatingsByTypeChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || !data.chartData || data.chartData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings by Service Type</h3>
        <div className="h-80 flex items-center justify-center">
          <p className="text-gray-500">No chart data available</p>
        </div>
      </div>
    );
  }

  // Format data for the chart
  const chartData = data.chartData.map(item => ({
    name: formatServiceName(item.name),
    avgRating: item.avgRating,
    requestCount: item.requestCount
  }));

  // Format service name for display
  function formatServiceName(name) {
    if (!name) return 'Unknown';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // Color scheme for different service types
  const getBarColor = (name) => {
    const colors = {
      'Laundry': '#3B82F6',
      'Housekeeping': '#8B5CF6',
      'Transportation': '#10B981',
      'Restaurant': '#F59E0B',
      'Dining': '#EC4899',
      'Tours': '#06B6D4',
      'Maintenance': '#EF4444',
      'Amenities': '#8B5CF6',
      'Cleaning': '#14B8A6'
    };
    return colors[name] || '#6B7280';
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{payload[0].payload.name}</p>
          <div className="space-y-1">
            <p className="text-sm text-blue-600">
              Avg Rating: <span className="font-medium">{payload[0].value.toFixed(2)}/5.0</span>
            </p>
            <p className="text-sm text-green-600">
              Total Requests: <span className="font-medium">{payload[1].value}</span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Ratings by Service Type</h3>
        <p className="text-sm text-gray-600 mt-1">Average rating and request volume comparison</p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis
            yAxisId="left"
            orientation="left"
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: 'Average Rating', angle: -90, position: 'insideLeft', style: { fill: '#3B82F6' } }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: 'Request Count', angle: 90, position: 'insideRight', style: { fill: '#10B981' } }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ paddingBottom: '20px' }}
          />
          <Bar
            yAxisId="left"
            dataKey="avgRating"
            name="Average Rating"
            fill="#3B82F6"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={getBarColor(entry.name)} opacity={0.8} />
            ))}
          </Bar>
          <Bar
            yAxisId="right"
            dataKey="requestCount"
            name="Request Count"
            fill="#10B981"
            radius={[8, 8, 0, 0]}
            opacity={0.6}
          />
        </BarChart>
      </ResponsiveContainer>

      {/* Legend for service type colors */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 mb-3">Service Type Colors:</p>
        <div className="flex flex-wrap gap-4">
          {chartData.map((item, index) => (
            <div key={index} className="flex items-center">
              <div
                className="w-3 h-3 rounded mr-2"
                style={{ backgroundColor: getBarColor(item.name) }}
              ></div>
              <span className="text-xs text-gray-700">{item.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RatingsByTypeChart;
