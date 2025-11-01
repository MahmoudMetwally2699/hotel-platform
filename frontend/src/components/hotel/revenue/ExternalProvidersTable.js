import React, { useState } from 'react';
import { Users, TrendingUp, DollarSign, Percent } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const ExternalProvidersTable = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  const [sortBy, setSortBy] = useState('totalRevenue');
  const [sortOrder, setSortOrder] = useState('desc');

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
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.external.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{t('performanceAnalyticsPage.revenue.errors.loadError', 'Error loading data')}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.providers || data.providers.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.external.title')}</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <Users className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{t('performanceAnalyticsPage.revenue.external.noData')}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat(i18n.language || 'en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatServiceName = (type) => t(`performanceAnalyticsPage.serviceTypes.${type}`, { defaultValue: type });

  const getServiceColor = (type) => {
    const colors = {
      laundry: 'bg-purple-100 text-purple-700',
      restaurant: 'bg-orange-100 text-orange-700',
      transportation: 'bg-green-100 text-green-700'
    };
    return colors[type] || 'bg-gray-100 text-gray-700';
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedProviders = [...data.providers].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return (aValue > bValue ? 1 : -1) * modifier;
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{t('performanceAnalyticsPage.revenue.external.title')}</h3>
        <div className="flex items-center gap-2 text-sm">
          <Users className="w-4 h-4 text-purple-600" />
          <span className="text-gray-600">{t('performanceAnalyticsPage.revenue.external.subtitle')}</span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-5 h-5" />
            <p className="text-sm opacity-90">{t('performanceAnalyticsPage.revenue.external.cards.totalRevenue')}</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(data.totals.totalRevenue)}</p>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5" />
            <p className="text-sm opacity-90">{t('performanceAnalyticsPage.revenue.external.cards.providerEarnings')}</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(data.totals.totalProviderEarnings)}</p>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5" />
            <p className="text-sm opacity-90">{t('performanceAnalyticsPage.revenue.external.cards.hotelCommission')}</p>
          </div>
          <p className="text-2xl font-bold">{formatCurrency(data.totals.totalHotelCommission)}</p>
        </div>

        <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg p-4 text-white">
          <div className="flex items-center gap-2 mb-1">
            <Percent className="w-5 h-5" />
            <p className="text-sm opacity-90">{t('performanceAnalyticsPage.revenue.external.cards.avgProfitMargin')}</p>
          </div>
          <p className="text-2xl font-bold">{data.totals.avgProfitMargin}%</p>
        </div>
      </div>

      {/* Providers Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.external.columns.provider')}</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.external.columns.service')}</th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('totalRevenue')}
              >
                {t('performanceAnalyticsPage.revenue.external.columns.totalRevenue')} {sortBy === 'totalRevenue' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.external.columns.providerEarns')}</th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('hotelCommission')}
              >
                {t('performanceAnalyticsPage.revenue.external.columns.hotelCommission')} {sortBy === 'hotelCommission' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.external.columns.bookings')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.external.columns.markupPercent')}</th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('profitMargin')}
              >
                {t('performanceAnalyticsPage.revenue.external.columns.profitMargin')} {sortBy === 'profitMargin' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedProviders.map((provider, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="font-medium text-gray-900">{provider.providerName}</div>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getServiceColor(provider.serviceType)}`}>
                    {formatServiceName(provider.serviceType)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(provider.totalRevenue)}
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatCurrency(provider.providerEarnings)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-green-600">
                    {formatCurrency(provider.hotelCommission)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {provider.bookingCount}
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {provider.avgMarkupPercentage}%
                </td>
                <td className="py-4 px-4 text-right">
                  <span className={`font-semibold ${
                    provider.profitMargin >= 20 ? 'text-green-600' :
                    provider.profitMargin >= 10 ? 'text-yellow-600' :
                    'text-red-600'
                  }`}>
                    {provider.profitMargin}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ExternalProvidersTable;
