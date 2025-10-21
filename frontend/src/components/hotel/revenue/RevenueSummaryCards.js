import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Home,
  Users,
  Percent
} from 'lucide-react';

const RevenueSummaryCards = ({ data, loading, error }) => {
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
        <p className="text-red-600">Error loading revenue summary: {error}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No revenue data available</p>
      </div>
    );
  }

  const cards = [
    {
      title: 'Total Revenue',
      value: data.totalRevenue,
      trend: data.trend,
      icon: DollarSign,
      gradient: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600'
    },
    {
      title: 'Internal Services Revenue',
      value: data.internalRevenue,
      icon: Home,
      gradient: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      iconColor: 'text-green-600'
    },
    {
      title: 'External Services Revenue',
      value: data.externalRevenue,
      icon: Users,
      gradient: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600'
    },
    {
      title: 'Commission Earned',
      value: data.externalCommission,
      icon: Percent,
      gradient: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      iconColor: 'text-orange-600'
    }
  ];

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        const showTrend = card.trend !== undefined && card.trend !== 0;
        const isPositive = card.trend > 0;

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
                {showTrend && (
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm font-medium ${
                    isPositive
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {isPositive ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    <span>{Math.abs(card.trend).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-1">{card.title}</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(card.value)}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RevenueSummaryCards;
