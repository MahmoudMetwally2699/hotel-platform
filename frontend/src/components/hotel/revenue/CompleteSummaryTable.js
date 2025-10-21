import React, { useState } from 'react';
import { BarChart3, Package } from 'lucide-react';

const CompleteSummaryTable = ({ data, loading, error }) => {
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
        <h3 className="text-lg font-semibold mb-4">Complete Revenue Summary</h3>
        <div className="bg-red-50 border border-red-200 rounded p-4">
          <p className="text-red-600">Error loading data: {error}</p>
        </div>
      </div>
    );
  }

  if (!data || !data.services || data.services.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Complete Revenue Summary</h3>
        <div className="bg-gray-50 rounded p-8 text-center">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">No revenue data available</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value || 0);
  };

  const formatServiceName = (type) => {
    const names = {
      housekeeping: 'Housekeeping',
      laundry: 'Laundry',
      restaurant: 'Restaurant',
      transportation: 'Transportation',
      roomService: 'Room Service',
      maintenance: 'Maintenance'
    };
    return names[type] || type;
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
          Internal
        </span>
      );
    }
    return (
      <span className="inline-block px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
        External
      </span>
    );
  };

  const getPerformanceIndicator = (profitMargin, category) => {
    if (category === 'Internal') {
      return <span className="text-gray-500 text-sm">N/A</span>;
    }

    if (profitMargin >= 20) {
      return <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">Excellent</span>;
    } else if (profitMargin >= 10) {
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-medium">Good</span>;
    } else {
      return <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">Fair</span>;
    }
  };

  const filteredServices = filterCategory === 'all'
    ? data.services
    : data.services.filter(s => s.category === filterCategory);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Complete Revenue Summary</h3>

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
            All Services
          </button>
          <button
            onClick={() => setFilterCategory('Internal')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'Internal'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Internal
          </button>
          <button
            onClick={() => setFilterCategory('External')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filterCategory === 'External'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            External
          </button>
        </div>
      </div>

      {/* Grand Totals Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 mb-6 text-white">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <p className="text-sm opacity-90 mb-1">Grand Total Revenue</p>
            <p className="text-3xl font-bold">{formatCurrency(data.totals.grandTotalRevenue)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Base Price (Provider)</p>
            <p className="text-2xl font-bold">{formatCurrency(data.totals.totalBasePrice)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Hotel Profit (Markup)</p>
            <p className="text-2xl font-bold">{formatCurrency(data.totals.totalHotelProfit)}</p>
          </div>
          <div>
            <p className="text-sm opacity-90 mb-1">Overall Profit Margin</p>
            <p className="text-3xl font-bold">{data.totals.overallProfitMargin}%</p>
          </div>
        </div>
      </div>

      {/* Services Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Service</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Category</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Total Revenue</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Base Price</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Hotel Profit</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Bookings</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Avg/Booking</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Revenue Share</th>
              <th className="text-right py-3 px-4 font-semibold text-gray-700">Markup %</th>
              <th className="text-center py-3 px-4 font-semibold text-gray-700">Performance</th>
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
                  {formatCurrency(service.totalRevenue)}
                </td>
                <td className="py-4 px-4 text-right text-gray-700">
                  {formatCurrency(service.basePrice)}
                </td>
                <td className="py-4 px-4 text-right">
                  <span className="font-semibold text-green-600">
                    {formatCurrency(service.hotelProfit)}
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
                TOTAL ({filteredServices.length} services)
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {formatCurrency(filteredServices.reduce((sum, s) => sum + s.totalRevenue, 0))}
              </td>
              <td className="py-4 px-4 text-right text-gray-900">
                {formatCurrency(filteredServices.reduce((sum, s) => sum + s.basePrice, 0))}
              </td>
              <td className="py-4 px-4 text-right text-green-600">
                {formatCurrency(filteredServices.reduce((sum, s) => sum + s.hotelProfit, 0))}
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
