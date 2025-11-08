/**
 * Service Details Table Component
 *
 * Detailed table showing timing analysis for individual service requests
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const ServiceDetailsTable = ({ data, loading }) => {
  const { t, i18n } = useTranslation();
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6 animate-pulse"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!data || !data.serviceDetails || data.serviceDetails.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-6">
          {t('performanceAnalyticsPage.operational.serviceDetails.title')}
        </h3>
        <div className="text-center text-gray-500 py-8">
          {t('performanceAnalyticsPage.operational.serviceDetails.noData', 'No service details available')}
        </div>
      </div>
    );
  }

  const serviceDetails = data.serviceDetails;
  const totalPages = Math.ceil(serviceDetails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentItems = serviceDetails.slice(startIndex, endIndex);

  const getSLAStatusBadge = (status) => {
    const config = {
      met: { bg: 'bg-green-100', text: 'text-green-800', label: t('performanceAnalyticsPage.operational.serviceDetails.slaStatus.met'), icon: FiCheckCircle },
      missed: { bg: 'bg-red-100', text: 'text-red-800', label: t('performanceAnalyticsPage.operational.serviceDetails.slaStatus.missed'), icon: FiXCircle },
      'at-risk': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('performanceAnalyticsPage.operational.serviceDetails.slaStatus.atRisk'), icon: FiAlertCircle },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: t('performanceAnalyticsPage.operational.serviceDetails.slaStatus.pending'), icon: FiClock }
    };

    const { bg, text, label, icon: Icon } = config[status] || config.pending;

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
        <Icon className="w-3 h-3 mr-1" />
        {label}
      </span>
    );
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(i18n.language || 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-800">
          {t('performanceAnalyticsPage.operational.serviceDetails.title')}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {t('performanceAnalyticsPage.operational.serviceDetails.subtitle')}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.booking')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.service')}
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.guest')}
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.responseTime')}
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.completionTime')}
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.serviceTime')}
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.slaStatus')}
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {t('performanceAnalyticsPage.operational.serviceDetails.columns.date')}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((service, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {service.bookingNumber || t('common.notAvailable', 'N/A')}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 capitalize">
                    {t(`performanceAnalyticsPage.serviceTypes.${service.serviceType}`, service.serviceType)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {(() => {
                      // For transportation, show vehicle type if available
                      if (service.serviceType === 'transportation') {
                        return service.serviceName ||
                               service.vehicleType ||
                               service.vehicleDetails?.vehicleType ||
                               'Vehicle';
                      }
                      // For other services, show the service name
                      return service.serviceName || t('common.notAvailable', 'N/A');
                    })()}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {(() => {
                      if (!service.guestName) return t('common.notAvailable', 'N/A');

                      // Split the name and check for duplicates
                      const nameParts = service.guestName.trim().split(' ').filter(Boolean);

                      // If we have exactly 2 parts and they're the same, show only one
                      if (nameParts.length === 2 && nameParts[0] === nameParts[1]) {
                        return nameParts[0];
                      }

                      // Otherwise return the full name
                      return service.guestName;
                    })()}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {service.actualResponseTime != null ? (
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-medium ${
                        service.isResponseOnTime === true ? 'text-green-600' :
                        service.isResponseOnTime === false ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {service.actualResponseTime} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
                      </span>
                      {service.responseDelay > 0 && (
                        <span className="text-xs text-red-500">
                          +{service.responseDelay} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">{t('common.notAvailable', 'N/A')}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {service.actualCompletionTime != null ? (
                    <div className="flex flex-col items-center">
                      <span className={`text-sm font-medium ${
                        service.isCompletionOnTime === true ? 'text-green-600' :
                        service.isCompletionOnTime === false ? 'text-red-600' :
                        'text-gray-600'
                      }`}>
                        {service.actualCompletionTime} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
                      </span>
                      {service.completionDelay > 0 && (
                        <span className="text-xs text-red-500">
                          +{service.completionDelay} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">{t('common.notAvailable', 'N/A')}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {service.actualServiceTime != null ? (
                    <span className="text-sm text-gray-900">
                      {service.actualServiceTime} {t('performanceAnalyticsPage.operational.completionTime.minutesShort')}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">{t('common.notAvailable', 'N/A')}</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {getSLAStatusBadge(service.slaStatus)}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  <div className="text-xs text-gray-600">
                    {formatDate(service.createdAt)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-700">
            {t('performanceAnalyticsPage.operational.serviceDetails.pagination.showRange', {
              from: startIndex + 1,
              to: Math.min(endIndex, serviceDetails.length),
              total: serviceDetails.length
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {t('common.previous', 'Previous')}
            </button>
            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, i) => {
                const pageNum = i + 1;
                // Show first page, last page, current page, and pages around current
                if (
                  pageNum === 1 ||
                  pageNum === totalPages ||
                  (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 py-2 text-sm font-medium rounded-md ${
                        currentPage === pageNum
                          ? 'bg-blue-600 text-white'
                          : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                } else if (pageNum === currentPage - 2 || pageNum === currentPage + 2) {
                  return <span key={i} className="px-2 text-gray-500">...</span>;
                }
                return null;
              })}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 text-sm font-medium rounded-md ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
              }`}
            >
              {t('common.next', 'Next')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailsTable;
