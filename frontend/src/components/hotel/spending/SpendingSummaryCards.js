import React from 'react';
import { useSelector } from 'react-redux';
import { DollarSign, Users, FileText, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { selectHotelCurrency } from '../../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../../utils/currency';

const SpendingSummaryCards = ({ data, loading, error }) => {
  const { t, i18n } = useTranslation();
  const currency = useSelector(selectHotelCurrency);
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-600">{t('performanceAnalyticsPage.spending.errors.summaryError', 'Error loading spending summary')}: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">{t('performanceAnalyticsPage.spending.noData', 'No spending data available')}</p>
      </div>
    );
  }

  const formatServiceName = (service) => t(`performanceAnalyticsPage.serviceTypes.${service}`, { defaultValue: service });

  const cards = [
    {
      title: t('performanceAnalyticsPage.spending.summary.avgCustomerSpending'),
      value: formatPriceByLanguage(data.avgCustomerSpending, i18n.language, currency),
      icon: DollarSign,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: t('performanceAnalyticsPage.spending.summary.totalCustomersServed'),
      value: data.totalCustomers,
      icon: Users,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: t('performanceAnalyticsPage.spending.summary.totalServiceRequests'),
      value: data.totalServiceRequests,
      icon: FileText,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: t('performanceAnalyticsPage.spending.summary.mostPopularService'),
      value: formatServiceName(data.mostPopularService),
      subValue: t('performanceAnalyticsPage.spending.summary.requestsSuffix', { count: data.mostPopularServiceCount }),
      icon: Star,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;

        return (
          <div
            key={index}
            className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300"
          >
            <div className={`bg-gradient-to-r ${card.gradient} p-4 rounded-t-lg`}>
              <div className="flex items-center justify-between">
                <div className={`${card.bgColor} p-3 rounded-lg`}>
                  <Icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {card.value}
              </p>
              {card.subValue && (
                <p className="text-xs text-gray-500 mt-1">{card.subValue}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SpendingSummaryCards;
