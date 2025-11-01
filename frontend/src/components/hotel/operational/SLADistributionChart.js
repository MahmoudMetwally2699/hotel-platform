/**
 * SLA Distribution Chart Component
 *
 * Pie chart showing overall SLA status distribution
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const SLADistributionChart = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="h-80 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || !data.distribution || data.distribution.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {t('performanceAnalyticsPage.operational.slaDistribution.title')}
        </h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          {t('performanceAnalyticsPage.operational.slaDistribution.noData')}
        </div>
      </div>
    );
  }

  const COLORS = {
    onTime: '#10B981',
    delayed: '#EF4444',
    atRisk: '#F59E0B',
    pending: '#6B7280'
  };

  // Filter out items with zero values for better visualization
  const toKey = (name) => {
    if (!name) return 'pending';
    const n = name.toLowerCase();
    if (n.includes('on') && n.includes('time')) return 'onTime';
    if (n.includes('risk')) return 'atRisk';
    if (n.includes('delay')) return 'delayed';
    if (n.includes('pending')) return 'pending';
    return n.replace(/\s+/g, '');
  };

  const chartData = data.distribution
    .filter(item => item.value > 0)
    .map(item => {
      const key = toKey(item.name);
      const display = t(`performanceAnalyticsPage.operational.slaDistribution.status.${key}`, {
        defaultValue: item.name
      });
      return { ...item, key, name: display };
    });

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{data.name}</p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('performanceAnalyticsPage.operational.slaDistribution.count')}:</span> {data.value}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('performanceAnalyticsPage.operational.slaDistribution.percentage')}:</span> {data.percentage}%
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = ({  cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null; // Don't show label for very small slices

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        className="text-sm font-semibold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Overall SLA Distribution
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Total service completion status
        </p>
      </div>

      <ResponsiveContainer width="100%" height={350}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.key] || '#6B7280'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value, entry) => (
              <span className="text-sm">
                {value}: <span className="font-semibold">{entry.payload.value}</span>
                <span className="text-gray-500"> ({entry.payload.percentage}%)</span>
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>

      {/* Summary Stats */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {data.distribution.map((item, index) => {
            const bgColor = {
              onTime: 'bg-green-50',
              delayed: 'bg-red-50',
              atRisk: 'bg-orange-50',
              pending: 'bg-gray-50'
            }[toKey(item.name)];

            const textColor = {
              onTime: 'text-green-700',
              delayed: 'text-red-700',
              atRisk: 'text-orange-700',
              pending: 'text-gray-700'
            }[toKey(item.name)];

            return (
              <div key={index} className={`${bgColor} rounded-lg p-4 text-center`}>
                <div className={`text-2xl font-bold ${textColor}`}>
                  {item.value}
                </div>
                <div className="text-sm text-gray-600 mt-1">{t(`performanceAnalyticsPage.operational.slaDistribution.status.${toKey(item.name)}`, { defaultValue: item.name })}</div>
                <div className="text-xs text-gray-500 mt-1">{item.percentage}%</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default SLADistributionChart;
