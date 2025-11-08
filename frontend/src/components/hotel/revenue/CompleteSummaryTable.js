import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { BarChart3, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { selectHotelCurrency } from '../../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../../utils/currency';

const CompleteSummaryTable = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  const reduxCurrency = useSelector(selectHotelCurrency);
  // Prioritize currency from API response, fallback to Redux
  const currency = data?.currency || reduxCurrency;
  const [filterCategory, setFilterCategory] = useState('all');

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.complete.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{t('performanceAnalyticsPage.revenue.errors.loadError', 'Error loading data')}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.services || data.services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.complete.title')}</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{t('performanceAnalyticsPage.revenue.complete.noData')}</p>
        </div>
      </div>
    );
  }

  const formatServiceName = (type) => {
    return t(`performanceAnalyticsPage.serviceTypes.${type}`, { defaultValue: type });
  };

  const getServiceIcon = (type) => {
    const icons = {
      housekeeping: '🧹',
      laundry: '👔',
      restaurant: '🍽️',
      transportation: '🚗',
      roomService: '🛎️',
      maintenance: '🔧'
    };
    return icons[type] || '📦';
  };

  const getCategoryBadge = (category) => {
    if (category === 'Internal') {
      return (
        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
          {t('performanceAnalyticsPage.revenue.complete.badges.internal')}
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
        {t('performanceAnalyticsPage.revenue.complete.badges.external')}
      </span>
    );
  };

  const getPerformanceIndicator = (profitMargin, category) => {
    if (category === 'Internal') {
      return <span className="text-gray-500 text-sm">{t('common.na', 'N/A')}</span>;
    }

    if (profitMargin >= 20) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">{t('performanceAnalyticsPage.revenue.complete.performance.excellent')}</span>;
    } else if (profitMargin >= 10) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">{t('performanceAnalyticsPage.revenue.complete.performance.good')}</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">{t('performanceAnalyticsPage.revenue.complete.performance.fair')}</span>;
    }
  };

  const filteredServices = filterCategory === 'all'
    ? data.services
    : data.services.filter(s => s.category === filterCategory);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
  <h3 className="text-lg font-semibold">{t('performanceAnalyticsPage.revenue.complete.title')}</h3>

        {/* Category Filter */}
        <div className="flex gap-2">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('performanceAnalyticsPage.revenue.complete.filters.all')}
          </button>
          <button
            onClick={() => setFilterCategory('Internal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'Internal'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('performanceAnalyticsPage.revenue.complete.filters.internal')}
          </button>
          <button
            onClick={() => setFilterCategory('External')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'External'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t('performanceAnalyticsPage.revenue.complete.filters.external')}
          </button>
        </div>
      </div>

      {/* Grand Totals Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm opacity-90 mb-1">{t('performanceAnalyticsPage.revenue.complete.banner.grandTotalRevenue')}</p>
            <p className="text-3xl font-bold">{formatPriceByLanguage(data.totals.grandTotalRevenue, i18n.language, currency)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">{t('performanceAnalyticsPage.revenue.complete.banner.basePrice')}</p>
            <p className="text-2xl font-bold">{formatPriceByLanguage(data.totals.totalBasePrice, i18n.language, currency)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">{t('performanceAnalyticsPage.revenue.complete.banner.hotelProfit')}</p>
            <p className="text-2xl font-bold">{formatPriceByLanguage(data.totals.totalHotelProfit, i18n.language, currency)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">{t('performanceAnalyticsPage.revenue.complete.banner.overallProfitMargin')}</p>
            <p className="text-3xl font-bold">{data.totals.overallProfitMargin}%</p>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.service')}</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.category')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.totalRevenue')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.basePrice')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.hotelProfit')}</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.bookings')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.avgPerBooking')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.revenueShare')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.markupPercent')}</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.complete.columns.performance')}</th>
            </tr>
          </thead>
          <tbody>
            {filteredServices.map((service, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getServiceIcon(service.serviceType)}</span>
                    <span className="font-medium text-gray-900">
                      {formatServiceName(service.serviceType)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-center">
                  {getCategoryBadge(service.category)}
                </td>
                <td className="py-4 px-4 text-right font-semibold text-gray-900">
                  {formatPriceByLanguage(service.totalRevenue, i18n.language, currency)}
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatPriceByLanguage(service.basePrice, i18n.language, currency)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-green-600">
                    {formatPriceByLanguage(service.hotelProfit, i18n.language, currency)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <Package className="w-4 h-4" />
                    {service.bookingCount}
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatPriceByLanguage(service.avgRevenue, i18n.language, currency)}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${Math.min(service.revenueShare, 100)}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-700 text-sm w-12 text-right">
                      {service.revenueShare}%
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  {service.avgMarkupPercentage > 0 ? (
                    <span className="font-semibold text-gray-700">
                      {service.avgMarkupPercentage}%
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">—</span>
                  )}
                </td>
                <td className="py-4 px-4 text-center">
                  {getPerformanceIndicator(service.profitMargin, service.category)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50 font-bold">
            <tr className="border-t-2 border-gray-300">
              <td colSpan="2" className="py-4 px-4 text-gray-900">
                {t('performanceAnalyticsPage.revenue.complete.totalLabel', { count: filteredServices.length })}
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {formatPriceByLanguage(filteredServices.reduce((sum, s) => sum + s.totalRevenue, 0), i18n.language, currency)}
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {formatPriceByLanguage(filteredServices.reduce((sum, s) => sum + s.basePrice, 0), i18n.language, currency)}
              </td>
              <td className="py-4 px-4 text-right text-green-600">
                {formatPriceByLanguage(filteredServices.reduce((sum, s) => sum + s.hotelProfit, 0), i18n.language, currency)}
              </td>
              <td className="py-4 px-4 text-center text-gray-900">
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <Package className="w-4 h-4" />
                  {filteredServices.reduce((sum, s) => sum + s.bookingCount, 0)}
                </span>
              </td>
              <td colSpan="4" className="py-4 px-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};

export default CompleteSummaryTable;
