/**
 * Rating Summary Cards Component
 * Displays key performance metrics in card format
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FiStar, FiTrendingUp, FiTrendingDown, FiMessageSquare } from 'react-icons/fi';

const RatingSummaryCards = ({ data, loading }) => {
  const { t } = useTranslation();
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="h-8 bg-gray-200 rounded w-3/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!data) {
    return null;
  }

  const { avgRating, totalReviews, ratingTrend, reviewsTrend, highestRatedService } = data;

  // Render star icons based on rating
  const renderStars = (rating) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FiStar key={`full-${i}`} className="w-5 h-5 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <FiStar className="w-5 h-5 text-yellow-400 fill-current opacity-50" />
        )}
        {[...Array(emptyStars)].map((_, i) => (
          <FiStar key={`empty-${i}`} className="w-5 h-5 text-gray-300" />
        ))}
      </div>
    );
  };

  // Render trend indicator
  const renderTrend = (trend) => {
    if (!trend || trend === 0) {
      return <span className="text-gray-500 text-sm">{t('performanceAnalyticsPage.ratingSummaryCards.noChange')}</span>;
    }

    const isPositive = trend > 0;
    const TrendIcon = isPositive ? FiTrendingUp : FiTrendingDown;
    const colorClass = isPositive ? 'text-green-600' : 'text-red-600';

    return (
      <div className={`flex items-center ${colorClass} text-sm font-medium`}>
        <TrendIcon className="w-4 h-4 mr-1" />
        <span>{Math.abs(trend).toFixed(1)}%</span>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {/* Average Rating Card */}
      <div className="rounded-lg shadow-lg p-6 text-white" style={{ background: 'linear-gradient(to bottom right, #3B5787, #2A4065)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold opacity-90">{t('performanceAnalyticsPage.ratingSummaryCards.averageRating')}</h3>
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <FiStar className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-baseline mb-2">
          <span className="text-4xl font-bold">{avgRating.toFixed(1)}</span>
          <span className="text-xl ml-2 opacity-75">/5.0</span>
        </div>
        <div className="mb-3">
          {renderStars(avgRating)}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-75">{t('performanceAnalyticsPage.ratingSummaryCards.thisPeriod')}</span>
          {renderTrend(ratingTrend)}
        </div>
      </div>

      {/* Total Reviews Card */}
      <div className="rounded-lg shadow-lg p-6 text-white" style={{ background: 'linear-gradient(to bottom right, #2A4065, #3B5787)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold opacity-90">{t('performanceAnalyticsPage.ratingSummaryCards.totalReviews')}</h3>
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <FiMessageSquare className="w-6 h-6" />
          </div>
        </div>
        <div className="flex items-baseline mb-2">
          <span className="text-4xl font-bold">{totalReviews}</span>
          <span className="text-xl ml-2 opacity-75">{t('performanceAnalyticsPage.ratingSummaryCards.reviews')}</span>
        </div>
        <div className="mb-3 h-5"></div>
        <div className="flex items-center justify-between">
          <span className="text-sm opacity-75">{t('performanceAnalyticsPage.ratingSummaryCards.vsPrevious')}</span>
          {renderTrend(reviewsTrend)}
        </div>
      </div>

      {/* Highest Rated Service Card */}
      <div className="rounded-lg shadow-lg p-6 text-white" style={{ background: 'linear-gradient(to bottom right, #3B5787, #2A4065)' }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold opacity-90">{t('performanceAnalyticsPage.ratingSummaryCards.topService')}</h3>
          <div className="bg-white bg-opacity-20 rounded-full p-2">
            <FiTrendingUp className="w-6 h-6" />
          </div>
        </div>
        <div className="mb-2">
          <p className="text-2xl font-bold truncate">{highestRatedService.name}</p>
        </div>
        <div className="flex items-center mb-2">
          <FiStar className="w-5 h-5 text-yellow-300 fill-current mr-1" />
          <span className="text-xl font-semibold">{highestRatedService.rating.toFixed(1)}</span>
        </div>
        <div className="text-sm opacity-75">
          {t('performanceAnalyticsPage.ratingSummaryCards.basedOn', { count: highestRatedService.totalReviews })}
        </div>
      </div>
    </div>
  );
};

export default RatingSummaryCards;
