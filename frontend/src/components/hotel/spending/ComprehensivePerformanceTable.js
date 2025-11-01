import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { TrendingUp, TrendingDown, Users, DollarSign, Package, Repeat } from 'lucide-react';

const ComprehensivePerformanceTable = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  const [sortBy, setSortBy] = useState('totalRequests');
  const [sortOrder, setSortOrder] = useState('desc');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.spending.comprehensive.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{t('performanceAnalyticsPage.spending.errors.loadError', 'Error loading data')}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.services || data.services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.spending.comprehensive.title')}</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <p className="text-gray-500">{t('performanceAnalyticsPage.spending.comprehensive.noData')}</p>
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

  const formatServiceName = (service) => t(`performanceAnalyticsPage.serviceTypes.${service}`, { defaultValue: service });

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const sortedServices = [...data.services].sort((a, b) => {
    const aValue = a[sortBy];
    const bValue = b[sortBy];
    const modifier = sortOrder === 'asc' ? 1 : -1;
    return (aValue > bValue ? 1 : -1) * modifier;
  });

  const GrowthIndicator = ({ value }) => {
    if (value === 0) {
      return <span className="text-gray-500 text-sm">{t('common.na', 'N/A')}</span>;
    }
    return (
      <div className={`flex items-center gap-1 ${value > 0 ? 'text-green-600' : 'text-red-600'}`}>
        {value > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
        <span className="font-semibold">{Math.abs(value).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
  <h3 className="text-lg font-semibold mb-2">{t('performanceAnalyticsPage.spending.comprehensive.title')}</h3>
  <p className="text-sm text-gray-600 mb-6">{t('performanceAnalyticsPage.spending.comprehensive.subtitle')}</p>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.spending.comprehensive.columns.service')}</th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('totalRequests')}
              >
                <div className="flex items-center justify-end gap-1">
                  <Package className="w-4 h-4" />
                  {t('performanceAnalyticsPage.spending.comprehensive.columns.requests')} {sortBy === 'totalRequests' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('totalRevenue')}
              >
                <div className="flex items-center justify-end gap-1">
                  <DollarSign className="w-4 h-4" />
                  {t('performanceAnalyticsPage.spending.comprehensive.columns.revenue')} {sortBy === 'totalRevenue' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                {t('performanceAnalyticsPage.spending.comprehensive.columns.avgSpending')}
              </th>
              <th
                className="text-right py-3 px-4 font-semibold text-gray-700 cursor-pointer hover:text-blue-600"
                onClick={() => handleSort('uniqueCustomers')}
              >
                <div className="flex items-center justify-end gap-1">
                  <Users className="w-4 h-4" />
                  {t('performanceAnalyticsPage.spending.comprehensive.columns.customers')} {sortBy === 'uniqueCustomers' && (sortOrder === 'asc' ? '↑' : '↓')}
                </div>
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {t('performanceAnalyticsPage.spending.comprehensive.columns.requestGrowth')}
              </th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">
                {t('performanceAnalyticsPage.spending.comprehensive.columns.revenueGrowth')}
              </th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">
                <div className="flex items-center justify-end gap-1">
                  <Repeat className="w-4 h-4" />
                  {t('performanceAnalyticsPage.spending.comprehensive.columns.repeatRate')}
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedServices.map((service, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <span className="font-medium text-gray-900">
                    {formatServiceName(service.serviceType)}
                  </span>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {service.totalRequests}
                  </span>
                </td>
                <td className="py-4 px-4 text-right font-semibold text-gray-900">
                  {formatCurrency(service.totalRevenue)}
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatCurrency(service.avgSpending)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                    {service.uniqueCustomers}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <GrowthIndicator value={service.requestGrowth} />
                </td>
                <td className="py-4 px-4 text-center">
                  <GrowthIndicator value={service.revenueGrowth} />
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-purple-600">
                    {service.repeatCustomerRate.toFixed(2)}x
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.spending.comprehensive.totals.totalRequests')}</p>
          <p className="text-xl font-bold text-gray-900">
            {sortedServices.reduce((sum, s) => sum + s.totalRequests, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.spending.comprehensive.totals.totalRevenue')}</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(sortedServices.reduce((sum, s) => sum + s.totalRevenue, 0))}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.spending.comprehensive.totals.uniqueCustomers')}</p>
          <p className="text-xl font-bold text-gray-900">
            {sortedServices.reduce((sum, s) => sum + s.uniqueCustomers, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.spending.comprehensive.totals.avgRepeatRate')}</p>
          <p className="text-xl font-bold text-gray-900">
            {(sortedServices.reduce((sum, s) => sum + s.repeatCustomerRate, 0) / sortedServices.length).toFixed(2)}x
          </p>
        </div>
      </div>
    </div>
  );
};

export default ComprehensivePerformanceTable;
