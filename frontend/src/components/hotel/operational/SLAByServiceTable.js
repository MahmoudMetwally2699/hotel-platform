/**
 * SLA By Service Table Component
 *
 * Table showing SLA performance by service type
 * Displays on-time vs delayed completions
 */

import React from 'react';
import { FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

const SLAByServiceTable = ({ data, loading }) => {
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

  if (!data || !data.slaByService || data.slaByService.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          SLA Performance by Service
        </h3>
        <div className="text-center text-gray-500 py-8">
          No SLA data available
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          SLA Performance by Service
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          On-time vs. delayed service completions
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Bookings
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                On Time
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Delayed
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                On-Time %
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Delay
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.slaByService.map((service, index) => {
              const onTimePercent = service.onTimePercentage;
              const isGood = onTimePercent >= 90;
              const isWarning = onTimePercent >= 70 && onTimePercent < 90;

              return (
                <tr key={index} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="text-sm font-medium text-gray-900 capitalize">
                        {service.serviceType}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="text-sm text-gray-900">{service.totalBookings}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <FiCheckCircle className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {service.onTimeBookings}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center">
                      <FiXCircle className="w-4 h-4 text-red-500 mr-2" />
                      <span className="text-sm font-medium text-gray-900">
                        {service.delayedBookings}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      isGood ? 'bg-green-100 text-green-800' :
                      isWarning ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {onTimePercent.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center text-sm text-gray-900">
                      {service.avgDelay > 0 && (
                        <>
                          <FiClock className="w-4 h-4 text-orange-500 mr-1" />
                          <span>{service.avgDelay} min</span>
                        </>
                      )}
                      {service.avgDelay === 0 && (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="mt-6 pt-4 border-t border-gray-200">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-gray-900">
              {data.slaByService.reduce((sum, s) => sum + s.totalBookings, 0)}
            </div>
            <div className="text-sm text-gray-600">Total Bookings</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">
              {data.slaByService.reduce((sum, s) => sum + s.onTimeBookings, 0)}
            </div>
            <div className="text-sm text-gray-600">On Time</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">
              {data.slaByService.reduce((sum, s) => sum + s.delayedBookings, 0)}
            </div>
            <div className="text-sm text-gray-600">Delayed</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SLAByServiceTable;
