/**
 * Ratings Breakdown Table Component
 * Displays detailed ratings breakdown by service type with star distribution
 */

import React, { useState } from 'react';
import { FiStar, FiChevronDown, FiChevronUp } from 'react-icons/fi';

const RatingsBreakdownTable = ({ data, loading }) => {
  const [expandedRows, setExpandedRows] = useState(new Set());

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.breakdown || data.breakdown.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Ratings Breakdown</h3>
        <p className="text-gray-500 text-center py-8">No ratings data available</p>
      </div>
    );
  }

  const toggleRow = (serviceType) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(serviceType)) {
      newExpanded.delete(serviceType);
    } else {
      newExpanded.add(serviceType);
    }
    setExpandedRows(newExpanded);
  };

  const formatServiceName = (serviceType, housekeepingType = null) => {
    if (housekeepingType) {
      return `${housekeepingType.charAt(0).toUpperCase()}${housekeepingType.slice(1)}`;
    }
    return serviceType.charAt(0).toUpperCase() + serviceType.slice(1);
  };

  const renderStarRating = (avgRating) => {
    const fullStars = Math.floor(avgRating);
    const hasHalfStar = avgRating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

    return (
      <div className="flex items-center">
        {[...Array(fullStars)].map((_, i) => (
          <FiStar key={`full-${i}`} className="w-4 h-4 text-yellow-400 fill-current" />
        ))}
        {hasHalfStar && (
          <FiStar className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
        )}{[...Array(emptyStars)].map((_, i) => (
          <FiStar key={`empty-${i}`} className="w-4 h-4 text-gray-300" />
        ))}
        <span className="ml-2 text-sm font-medium text-gray-700">
          {avgRating.toFixed(1)}
        </span>
      </div>
    );
  };

  const renderRow = (item, isSubCategory = false) => {
    const isHousekeeping = item.serviceType === 'housekeeping';
    const isExpanded = expandedRows.has(item.serviceType);
    const hasSubCategories = isHousekeeping && item.subCategories && item.subCategories.length > 0;

    return (
      <React.Fragment key={item.serviceType || item.housekeepingType}>
        <tr className={`${isSubCategory ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors`}>
          <td className={`px-6 py-4 whitespace-nowrap ${isSubCategory ? 'pl-12' : ''}`}>
            <div className="flex items-center">
              {hasSubCategories && !isSubCategory && (
                <button
                  onClick={() => toggleRow(item.serviceType)}
                  className="mr-2 p-1 hover:bg-gray-200 rounded"
                >
                  {isExpanded ? (
                    <FiChevronUp className="w-4 h-4 text-gray-600" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 text-gray-600" />
                  )}
                </button>
              )}
              <span className={`text-sm ${isSubCategory ? 'text-gray-600' : 'font-medium text-gray-900'}`}>
                {formatServiceName(item.serviceType, item.housekeepingType)}
              </span>
            </div>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
            {item.totalRequests}
          </td>
          <td className="px-6 py-4 whitespace-nowrap">
            {renderStarRating(item.avgRating)}
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded-full">
              {item.star5}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-blue-800 bg-blue-100 rounded-full">
              {item.star4}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-yellow-800 bg-yellow-100 rounded-full">
              {item.star3}
            </span>
          </td>
          <td className="px-6 py-4 whitespace-nowrap text-center">
            <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium text-red-800 bg-red-100 rounded-full">
              {item.star1_2}
            </span>
          </td>
        </tr>

        {/* Render sub-categories for housekeeping */}
        {hasSubCategories && isExpanded && item.subCategories.map((subItem) => (
          renderRow(subItem, true)
        ))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-8">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Detailed Ratings Breakdown</h3>
        <p className="text-sm text-gray-600 mt-1">Performance metrics by service category</p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Type
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Total Requests
              </th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Avg Rating
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                5 Stars
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                4 Stars
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                3 Stars
              </th>
              <th scope="col" className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                1-2 Stars
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {data.breakdown.map((item) => renderRow(item))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default RatingsBreakdownTable;
