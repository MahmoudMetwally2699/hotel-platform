import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';
import { selectHotelCurrency } from '../../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../../utils/currency';

const RevenueByCategoryChart = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  const reduxCurrency = useSelector(selectHotelCurrency);
  // Prioritize currency from API response, fallback to Redux
  const currency = data?.currency || reduxCurrency;
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
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.byCategory.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{t('performanceAnalyticsPage.revenue.byCategory.error', 'Error loading chart')}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.categoryData || data.categoryData.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.byCategory.title')}</h3>
        <div className="h-80 flex items-center justify-center bg-gray-50 rounded">
          <p className="text-gray-500">{t('performanceAnalyticsPage.revenue.byCategory.noData')}</p>
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

  const formatPercentDisplay = (value) => {
    // Accepts a 0-100 percentage and returns a locale-aware percent string
    const normalized = (value || 0) / 100;
    return new Intl.NumberFormat(i18n.language || 'en-US', {
      style: 'percent',
      maximumFractionDigits: 0
    }).format(normalized);
  };

  const formatLabel = (category) => {
    return t(`performanceAnalyticsPage.serviceTypes.${category}`, { defaultValue: category });
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
            {t('performanceAnalyticsPage.revenue.byCategory.tooltip.revenue')}: <span className="font-semibold text-gray-900">{formatPriceByLanguage(data.value, i18n.language, currency)}</span>
          </p>
          <p className="text-sm text-gray-600">
            {t('performanceAnalyticsPage.revenue.byCategory.tooltip.share')}: <span className="font-semibold text-gray-900">{formatPercentDisplay(data.percentage)}</span>
          </p>
          <p className="text-sm text-gray-600">
            {t('performanceAnalyticsPage.revenue.byCategory.tooltip.bookings')}: <span className="font-semibold text-gray-900">{data.bookings}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  const renderCustomLabel = (props) => {
    const {
      cx, cy, midAngle, outerRadius, name, percent
    } = props;
    const RAD = Math.PI / 180;
    const radius = outerRadius + 16;
    const x = cx + radius * Math.cos(-midAngle * RAD);
    const y = cy + radius * Math.sin(-midAngle * RAD);
  const dir = i18n.dir();
    const anchorLTR = x > cx ? 'start' : 'end';
    const anchorRTL = x > cx ? 'end' : 'start';
    const textAnchor = dir === 'rtl' ? anchorRTL : anchorLTR;

    const pctStr = new Intl.NumberFormat(i18n.language || 'en-US', {
      style: 'percent',
      maximumFractionDigits: 0
    }).format(percent || 0);

    const labelText = `${name}: ${pctStr}`;

    return (
      <text
        x={x}
        y={y}
        fill="#4b5563"
        textAnchor={textAnchor}
        dominantBaseline="central"
        style={{ direction: dir, unicodeBidi: 'plaintext', fontSize: 12 }}
      >
        {labelText}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.byCategory.title')}</h3>
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
          <p className="text-sm text-gray-600">{t('performanceAnalyticsPage.revenue.byCategory.totalServices')}</p>
          <p className="text-xl font-bold text-gray-900">{data.categoryData.length}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">{t('performanceAnalyticsPage.revenue.byCategory.totalBookings')}</p>
          <p className="text-xl font-bold text-gray-900">
            {data.categoryData.reduce((sum, cat) => sum + cat.bookingCount, 0)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default RevenueByCategoryChart;
