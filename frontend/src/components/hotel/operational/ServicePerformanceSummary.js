/**
 * Service Performance Summary Component
 *
 * Comprehensive summary table showing efficiency metrics across all services
 */

import React from 'react';
import { FiTrendingUp, FiTrendingDown, FiMinus } from 'react-icons/fi';

const ServicePerformanceSummary = ({ completionData, slaData, loading }) => {
  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!completionData || !slaData) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          Service Performance Summary
        </h3>
        <div className="text-center text-gray-500 py-8">
          No performance data available
        </div>
      </div>
    );
  }

  // Merge completion and SLA data by service type
  const completionMap = new Map();
  completionData.completionByService?.forEach(item => {
    completionMap.set(item.serviceType, item);
  });

  const slaMap = new Map();
  slaData.slaByService?.forEach(item => {
    slaMap.set(item.serviceType, item);
  });

  // Get all unique service types
  const allServices = new Set([
    ...completionMap.keys(),
    ...slaMap.keys()
  ]);

  const summaryData = Array.from(allServices).map(serviceType => {
    const completion = completionMap.get(serviceType) || {};
    const sla = slaMap.get(serviceType) || {};

    return {
      serviceType,
      avgCompletionTime: completion.avgCompletionTime || 0,
      minCompletionTime: completion.minCompletionTime || 0,
      maxCompletionTime: completion.maxCompletionTime || 0,
      completionCount: completion.count || 0,
      onTimePercentage: sla.onTimePercentage || 0,
      totalBookings: sla.totalBookings || 0,
      onTimeBookings: sla.onTimeBookings || 0,
      delayedBookings: sla.delayedBookings || 0,
      avgDelay: sla.avgDelay || 0
    };
  }).sort((a, b) => b.totalBookings - a.totalBookings);

  const getPerformanceIndicator = (onTimePercentage) => {
    if (onTimePercentage >= 90) {
      return { icon: FiTrendingUp, color: 'text-green-600', label: 'Excellent' };
    } else if (onTimePercentage >= 70) {
      return { icon: FiMinus, color: 'text-yellow-600', label: 'Good' };
    } else {
      return { icon: FiTrendingDown, color: 'text-red-600', label: 'Needs Improvement' };
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          Service Performance Summary
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Comprehensive efficiency metrics across all services
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Requests
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Time<br/><span className="text-xs normal-case">(min)</span>
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Min/Max<br/><span className="text-xs normal-case">(min)</span>
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                On-Time Rate
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delayed
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Delay<br/><span className="text-xs normal-case">(min)</span>
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Performance
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {summaryData.map((service, index) => {
              const performance = getPerformanceIndicator(service.onTimePercentage);
              const PerformanceIcon = performance.icon;

              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 capitalize">
                      {service.serviceType}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-semibold text-gray-900">
                      {service.totalBookings}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-gray-900">
                      {service.avgCompletionTime}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-xs text-gray-600">
                      {service.minCompletionTime} / {service.maxCompletionTime}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="flex flex-col items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        service.onTimePercentage >= 90 ? 'bg-green-100 text-green-800' :
                        service.onTimePercentage >= 70 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {service.onTimePercentage.toFixed(1)}%
                      </span>
                      <span className="text-xs text-gray-500 mt-1">
                        {service.onTimeBookings}/{service.totalBookings}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm font-medium text-red-600">
                      {service.delayedBookings}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">
                      {service.avgDelay > 0 ? service.avgDelay : '-'}
                    </div>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-center">
                    <div className={`flex items-center justify-center ${performance.color}`}>
                      <PerformanceIcon className="w-4 h-4 mr-1" />
                      <span className="text-xs font-medium">{performance.label}</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Overall Totals */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-blue-700">
              {summaryData.reduce((sum, s) => sum + s.totalBookings, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Total Requests</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700">
              {summaryData.reduce((sum, s) => sum + s.onTimeBookings, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">On Time</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700">
              {summaryData.reduce((sum, s) => sum + s.delayedBookings, 0)}
            </div>
            <div className="text-sm text-gray-600 mt-1">Delayed</div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-purple-700">
              {(() => {
                const total = summaryData.reduce((sum, s) => sum + s.totalBookings, 0);
                const onTime = summaryData.reduce((sum, s) => sum + s.onTimeBookings, 0);
                return total > 0 ? ((onTime / total) * 100).toFixed(1) : 0;
              })()}%
            </div>
            <div className="text-sm text-gray-600 mt-1">Overall Rate</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServicePerformanceSummary;
