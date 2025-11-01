/**
 * Completion Time Chart Component
 *
 * Bar chart showing average completion time by service type
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const CompletionTimeChart = ({ data, loading }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
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
          {t('performanceAnalyticsPage.operational.completionTime.title')}
        </h3>
        <div className="h-80 flex items-center justify-center text-gray-500">
          {t('performanceAnalyticsPage.operational.completionTime.noData')}
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
    key: item.serviceType,
    name: t(`performanceAnalyticsPage.serviceTypes.${item.serviceType}`, {
      defaultValue: item.serviceType.charAt(0).toUpperCase() + item.serviceType.slice(1)
    }),
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
            <span className="font-medium">{t('performanceAnalyticsPage.operational.completionTime.tooltip.average')}:</span> {data['Avg Time']} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('performanceAnalyticsPage.operational.completionTime.tooltip.min')}:</span> {data['Min Time']} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
          </p>
          <p className="text-sm text-gray-600">
            <span className="font-medium">{t('performanceAnalyticsPage.operational.completionTime.tooltip.max')}:</span> {data['Max Time']} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
          </p>
          <p className="text-sm text-gray-600 mt-2">
            <span className="font-medium">{t('performanceAnalyticsPage.operational.completionTime.tooltip.bookings')}:</span> {data.count}
          </p>
        </div>
      );
    }
    return null;
  };

  // RTL-aware custom X-axis tick to prevent clipping/overlap
  const CustomXAxisTick = (props) => {
    const { x, y, payload } = props;
    const angle = isRTL ? 45 : -45;
    const anchor = isRTL ? 'start' : 'end';
    const dx = isRTL ? 6 : -6;
    return (
      <g transform={`translate(${x},${y})`}>
        <text
          dx={dx}
          dy={10}
          textAnchor={anchor}
          transform={`rotate(${angle})`}
          fill="#6B7280"
          fontSize={12}
        >
          {payload.value}
        </text>
      </g>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('performanceAnalyticsPage.operational.completionTime.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('performanceAnalyticsPage.operational.completionTime.subtitle')}
        </p>
      </div>

      <ResponsiveContainer width="100%" height={380}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: isRTL ? 20 : 30, left: isRTL ? 30 : 20, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="name"
            height={80}
            interval={0}
            tickMargin={12}
            tick={<CustomXAxisTick />}
          />
          <YAxis
            label={{ value: t('performanceAnalyticsPage.operational.completionTime.minutes'), angle: -90, position: 'insideLeft', style: { fill: '#6B7280' } }}
            tick={{ fill: '#6B7280' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" height={24} wrapperStyle={{ paddingTop: 6 }} iconType="circle" />
          <Bar
            dataKey="Avg Time"
            name={t('performanceAnalyticsPage.operational.completionTime.legend.averageTime')}
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
