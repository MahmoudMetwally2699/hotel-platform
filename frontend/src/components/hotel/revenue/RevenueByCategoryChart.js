import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

const RevenueByCategoryChart = ({ data, loading, error }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Service Category</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error loading chart: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.categoryData || data.categoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Service Category</h3>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">No category data available</p>
        </div>
      </div>
    );
  }

  const COLORS = {
    housekeeping: '#3b82f6',
    laundry: '#8b5cf6',
    restaurant: '#f59e0b',
    transportation: '#10b981',
    roomService: '#ec4899',
    maintenance: '#6366f1'
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatLabel = (category) => {
    const labels = {
      housekeeping: 'Housekeeping',
      laundry: 'Laundry',
      restaurant: 'Restaurant',
      transportation: 'Transportation',
      roomService: 'Room Service',
      maintenance: 'Maintenance'
    };
    return labels[category] || category;
  };

  const chartData = data.categoryData.map(item => ({
    name: formatLabel(item.category),
    value: item.revenue,
    percentage: item.percentage,
    bookings: item.bookingCount
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold mb-2">{data.name}</p>
          <p className="text-sm text-gray-600">
            Revenue: <span className="font-semibold text-gray-900">{formatCurrency(data.value)}</span>
          </p>
          <p className="text-sm text-gray-600">
            Share: <span className="font-semibold text-gray-900">{data.percentage}%</span>
          </p>
          <p className="text-sm text-gray-600">
            Bookings: <span className="font-semibold text-gray-900">{data.bookings}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (entry) => {
    return `${entry.percentage}%`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue by Service Category</h3>
      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => {
              const category = data.categoryData[index].category;
              return (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[category] || COLORS[Object.keys(COLORS)[index % Object.keys(COLORS).length]]}
                />
              );
            })}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '14px' }}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 pt-4 border-t">
        <div>
          <p className="text-sm text-gray-600">Total Services</p>
          <p className="text-xl font-bold text-gray-900">{data.categoryData.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Total Bookings</p>
          <p className="text-xl font-bold text-gray-900">
            {data.categoryData.reduce((sum, cat) => sum + cat.bookingCount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueByCategoryChart;
