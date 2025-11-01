/**
 * Ratings Trend Chart Component
 * Multi-line chart showing rating trends over time by service type
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const RatingsTrendChart = ({ data, loading }) => {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="h-96 bg-gray-100 rounded animate-pulse"></div>
      </div>
    );
  }

  if (!data || !data.trendData || data.trendData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('performanceAnalyticsPage.ratingsTrend.title')}</h3>
        <div className="h-96 flex items-center justify-center">
          <p className="text-gray-500">{t('performanceAnalyticsPage.ratingsTrend.noData', 'No trend data available')}</p>
        </div>
      </div>
    );
  }

  // Extract unique service types from the data
  const serviceTypes = new Set();
  data.trendData.forEach(item => {
    Object.keys(item).forEach(key => {
      if (key !== 'period') {
        serviceTypes.add(key);
      }
    });
  });

  const serviceTypesArray = Array.from(serviceTypes);

  // Color scheme for different service types
  const serviceColors = {
    'laundry': '#3B82F6',
    'transportation': '#10B981',
    'restaurant': '#F59E0B',
    'maintenance': '#EF4444',
    'amenities': '#8B5CF6',
    'cleaning': '#06B6D4',
    'tours': '#EC4899',
    'dining': '#F97316',
    'spa': '#14B8A6',
    'fitness': '#6366F1'
  };

  const getServiceColor = (serviceType) => {
    return serviceColors[serviceType] || '#6B7280';
  };

  const formatServiceName = (name) => {
    if (!name) return t('services.service', { defaultValue: 'Service' });
    const key = name.toString();
    return t(`performanceAnalyticsPage.serviceTypes.${key}`, {
      defaultValue: key.charAt(0).toUpperCase() + key.slice(1)
    });
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry, index) => (
              <p key={index} className="text-sm" style={{ color: entry.color }}>
                {entry.name}: <span className="font-medium">{entry.value?.toFixed(1)}/5.0</span>
              </p>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  // Localize X-axis period labels such as "Week 41, 2025"
  const formatPeriod = (value) => {
    if (!value) return '';
    const str = String(value);
    const match = str.match(/Week\s*(\d+)[,\s]+(\d{4})/i);
    if (match) {
      const week = match[1];
      const year = match[2];
      return t('performanceAnalyticsPage.ratingsTrend.weekLabel', {
        week,
        year,
        defaultValue: `Week ${week}, ${year}`
      });
    }
    return str;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 mb-8">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">{t('performanceAnalyticsPage.ratingsTrend.title')}</h3>
        <p className="text-sm text-gray-600 mt-1">{t('performanceAnalyticsPage.ratingsTrend.subtitle')}</p>
      </div>

      <ResponsiveContainer width="100%" height={isRTL ? 520 : 450}>
        <LineChart
          data={data.trendData}
          margin={{ top: 20, right: isRTL ? 40 : 30, left: isRTL ? 30 : 20, bottom: isRTL ? 50 : 45 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey="period"
            tick={{ fill: '#6B7280', fontSize: 12, dy: 10 }}
            angle={isRTL ? 45 : -45}
            textAnchor={isRTL ? 'start' : 'end'}
            tickMargin={16}
            height={isRTL ? 100 : 90}
            tickFormatter={formatPeriod}
          />
          <YAxis
            domain={[0, 5]}
            ticks={[0, 1, 2, 3, 4, 5]}
            tick={{ fill: '#6B7280', fontSize: 12 }}
            label={{ value: t('performanceAnalyticsPage.ratingsTrend.yAxisLabel'), angle: -90, position: 'insideLeft' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="top"
            height={36}
            wrapperStyle={{ paddingTop: '0px', paddingBottom: '20px' }}
            formatter={(value) => formatServiceName(value)}
          />

          {/* Render a line for each service type */}
          {serviceTypesArray.map((serviceType) => (
            <Line
              key={serviceType}
              type="monotone"
              dataKey={serviceType}
              name={formatServiceName(serviceType)}
              stroke={getServiceColor(serviceType)}
              strokeWidth={2}
              dot={{ r: 4, fill: getServiceColor(serviceType) }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          ))}
        </LineChart>
      </ResponsiveContainer>

      {/* Performance indicators */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {serviceTypesArray.map((serviceType) => {
            // Calculate average rating for this service
            const ratings = data.trendData
              .map(item => item[serviceType])
              .filter(rating => rating !== undefined && rating !== null);

            const avgRating = ratings.length > 0
              ? (ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length).toFixed(1)
              : 'N/A';

            return (
              <div key={serviceType} className="flex items-center">
                <div
                  className="w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getServiceColor(serviceType) }}
                ></div>
                <div>
                  <p className="text-xs text-gray-600">{formatServiceName(serviceType)}</p>
                  <p className="text-sm font-semibold text-gray-900">
                    {avgRating !== 'N/A' ? `${avgRating}/5.0` : avgRating}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RatingsTrendChart;
