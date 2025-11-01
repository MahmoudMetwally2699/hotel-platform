/**
 * Operational Summary Cards Component
 *
 * Displays 4 key operational efficiency metrics:
 * - Average Response Time
 * - Average Completion Time
 * - SLA Compliance Rate
 * - Delayed Requests
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiClock, FiCheckCircle, FiAlertTriangle, FiTrendingDown, FiTrendingUp } from 'react-icons/fi';

const OperationalSummaryCards = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          {t('performanceAnalyticsPage.operational.summary.noData', 'No data available')}
        </div>
      </div>
    );
  }

  const cards = [
    {
      title: t('performanceAnalyticsPage.operational.summary.avgResponseTime'),
      value: `${data.avgResponseTime} ${t('performanceAnalyticsPage.operational.completionTime.minutesShort')}`,
      trend: data.responseTrend,
      icon: FiClock,
      gradient: 'from-blue-500 to-blue-600',
      trendText: data.responseTrend > 0
        ? t('performanceAnalyticsPage.operational.summary.faster')
        : t('performanceAnalyticsPage.operational.summary.slower'),
      isPositive: data.responseTrend > 0 // Positive = faster (lower time)
    },
    {
      title: t('performanceAnalyticsPage.operational.summary.avgCompletionTime'),
      value: `${data.avgCompletionTime} ${t('performanceAnalyticsPage.operational.completionTime.minutesShort')}`,
      trend: data.completionTrend,
      icon: FiCheckCircle,
      gradient: 'from-purple-500 to-purple-600',
      trendText: data.completionTrend > 0
        ? t('performanceAnalyticsPage.operational.summary.faster')
        : t('performanceAnalyticsPage.operational.summary.slower'),
      isPositive: data.completionTrend > 0
    },
    {
      title: t('performanceAnalyticsPage.operational.summary.slaComplianceRate'),
      value: `${data.slaComplianceRate}%`,
      trend: data.slaTrend,
      icon: FiCheckCircle,
      gradient: 'from-green-500 to-green-600',
      trendText: t('performanceAnalyticsPage.operational.summary.fromTarget', { value: Math.abs(data.slaTrend).toFixed(1) }),
      isPositive: data.slaTrend > 0
    },
    {
      title: t('performanceAnalyticsPage.operational.summary.delayedRequests'),
      value: data.delayedRequests,
      subValue: data.totalRequests > 0
        ? t('performanceAnalyticsPage.operational.summary.ofTotalRequests', { percent: ((data.delayedRequests / data.totalRequests) * 100).toFixed(1) })
        : t('performanceAnalyticsPage.operational.summary.ofTotalRequests', { percent: '0' }),
      icon: FiAlertTriangle,
      gradient: 'from-red-500 to-red-600',
      isNegative: true
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const showTrend = card.trend !== undefined && card.trend !== null && card.trend !== 0;
        const TrendIcon = card.isPositive ? FiTrendingUp : FiTrendingDown;

        return (
          <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className={`bg-gradient-to-r ${card.gradient} p-4 text-white`}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium opacity-90">{card.title}</span>
                <Icon className="w-6 h-6 opacity-80" />
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-3xl font-bold text-gray-800">{card.value}</span>
                {showTrend && (
                  <div className={`flex items-center text-sm font-medium ${
                    card.isPositive ? 'text-green-600' : 'text-red-600'
                  }`}>
                    <TrendIcon className="w-4 h-4 mr-1" />
                    {Math.abs(card.trend).toFixed(1)}%
                  </div>
                )}
              </div>
              <div className="text-sm text-gray-600">
                {card.subValue || card.trendText}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default OperationalSummaryCards;
