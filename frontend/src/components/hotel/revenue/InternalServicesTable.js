import React from 'react';
import { Home, Package, Utensils, Car, Wrench, Shirt } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const InternalServicesTable = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.internal.title')}</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">{t('performanceAnalyticsPage.revenue.errors.loadError', 'Error loading data')}: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.services || data.services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">{t('performanceAnalyticsPage.revenue.internal.title')}</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <Home className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">{t('performanceAnalyticsPage.revenue.internal.noData')}</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    const currency = data?.currency || 'USD';
    return new Intl.NumberFormat(i18n.language || 'en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatServiceName = (type) => t(`performanceAnalyticsPage.serviceTypes.${type}`, { defaultValue: type });

  const getServiceIcon = (type) => {
    const iconMap = {
      housekeeping: <Home className="w-6 h-6 text-blue-600" />,
      laundry: <Shirt className="w-6 h-6 text-indigo-600" />,
      dining: <Utensils className="w-6 h-6 text-orange-600" />,
      transportation: <Car className="w-6 h-6 text-green-600" />,
      maintenance: <Wrench className="w-6 h-6 text-gray-600" />
    };
    return iconMap[type] || <Package className="w-6 h-6 text-purple-600" />;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">{t('performanceAnalyticsPage.revenue.internal.title')}</h3>
        <div className="flex items-center gap-2 text-sm">
          <Home className="w-4 h-4 text-green-600" />
          <span className="text-gray-600">{t('performanceAnalyticsPage.revenue.internal.subtitle')}</span>
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 mb-6 text-white">
        <p className="text-sm opacity-90">{t('performanceAnalyticsPage.revenue.internal.totalInternalRevenue')}</p>
        <p className="text-3xl font-bold">{formatCurrency(data.totalInternalRevenue)}</p>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.internal.columns.service')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.internal.columns.revenue')}</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.internal.columns.bookings')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.internal.columns.avgPerBooking')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.internal.columns.minMax')}</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">{t('performanceAnalyticsPage.revenue.internal.columns.share')}</th>
            </tr>
          </thead>
          <tbody>
            {data.services.map((service, index) => (
              <tr
                key={index}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
              >
                <td className="py-4 px-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {getServiceIcon(service.serviceType)}
                    </div>
                    <span className="font-medium text-gray-900">
                      {formatServiceName(service.serviceType)}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-gray-900">
                    {formatCurrency(service.totalRevenue)}
                  </span>
                </td>
                <td className="py-4 px-4 text-center">
                  <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    <Package className="w-4 h-4" />
                    {service.bookingCount}
                  </span>
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatCurrency(service.avgRevenue)}
                </td>
                <td className="py-4 px-4 text-right text-sm text-gray-600">
                  {formatCurrency(service.minRevenue)} - {formatCurrency(service.maxRevenue)}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full"
                        style={{ width: `${service.percentage}%` }}
                      ></div>
                    </div>
                    <span className="font-semibold text-gray-700 text-sm w-12 text-right">
                      {service.percentage}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.revenue.internal.totals.totalServices')}</p>
          <p className="text-xl font-bold text-gray-900">{data.services.length}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.revenue.internal.totals.totalBookings')}</p>
          <p className="text-xl font-bold text-gray-900">
            {data.services.reduce((sum, s) => sum + s.bookingCount, 0)}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1">{t('performanceAnalyticsPage.revenue.internal.totals.avgRevenuePerBooking')}</p>
          <p className="text-xl font-bold text-gray-900">
            {formatCurrency(
              data.totalInternalRevenue /
              data.services.reduce((sum, s) => sum + s.bookingCount, 0)
            )}
          </p>
        </div>
      </div>
    </div>
  );
};

export default InternalServicesTable;
