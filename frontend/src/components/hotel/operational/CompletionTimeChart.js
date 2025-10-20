/**
 * Completion Time Chart Component
 *
 * Bar chart showing average completion time by service type
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const CompletionTimeChart = ({ data, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || !data.completionByService || data.completionByService.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Average Completion Time by Service (minutes)
        </h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          No completion data available
        </div>
      </div>
    );
  }

  // Service type colors
  const serviceColors = {
    laundry: '#3B82F6',
    housekeeping: '#8B5CF6',
    maintenance: '#F59E0B',
    cleaning: '#10B981',
    amenities: '#EC4899',
    transportation: '#6366F1',
    dining: '#14B8A6',
    restaurant: '#F97316',
    tours: '#06B6D4'
  };

  // Format data for chart
  const chartData = data.completionByService.map(item => ({
    name: item.serviceType.charAt(0).toUpperCase() + item.serviceType.slice(1),
    'Avg Time': item.avgCompletionTime,
    'Min Time': item.minCompletionTime,
    'Max Time': item.maxCompletionTime,
    count: item.count,
    color: serviceColors[item.serviceType] || '#6B7280'
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{data.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Average:</span> {data['Avg Time']} min
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Min:</span> {data['Min Time']} min
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">Max:</span> {data['Max Time']} min
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">Bookings:</span> {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Average Completion Time by Service (minutes)
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Time taken to complete each service after request
        </p>
      </div>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            angle={-45}
            textAnchor="end"
            height={100}
            tick={{ fill: '#6B7280', fontSize: 12 }}
          />
          <YAxis
            label={{ value: 'Minutes', angle: -90, position: 'insideLeft', style: { fill: '#6B7280' } }}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            iconType="circle"
          />
          <Bar
            dataKey="Avg Time"
            name="Average Time"
            radius={[8, 8, 0, 0]}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CompletionTimeChart;
