/**
 * Service Details Table Component
 *
 * Detailed table showing timing analysis for individual service requests
 */

import React, { useState } from 'react';
import { FiCheckCircle, FiXCircle, FiClock, FiAlertCircle } from 'react-icons/fi';

const ServiceDetailsTable = ({ data, loading }) => {
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
          Service Performance Details
        </h3>
        <div className="text-center text-gray-500 py-8">
          No service details available
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
      met: { bg: 'bg-green-100', text: 'text-green-800', label: 'Met', icon: FiCheckCircle },
      missed: { bg: 'bg-red-100', text: 'text-red-800', label: 'Missed', icon: FiXCircle },
      'at-risk': { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'At Risk', icon: FiAlertCircle },
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Pending', icon: FiClock }
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
    return date.toLocaleDateString('en-US', {
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
          Service Performance Details
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Detailed timing analysis for service requests (minutes)
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Booking #
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Guest
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Response Time
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Completion Time
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Service Time
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                SLA Status
              </th>
              <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.map((service, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {service.bookingNumber || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900 capitalize">
                    {service.serviceType}
                  </div>
                  <div className="text-xs text-gray-500">
                    {service.serviceName || 'N/A'}
                  </div>
                </td>
                <td className="px-4 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {service.guestName || 'N/A'}
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
                        {service.actualResponseTime} min
                      </span>
                      {service.responseDelay > 0 && (
                        <span className="text-xs text-red-500">
                          +{service.responseDelay} min
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
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
                        {service.actualCompletionTime} min
                      </span>
                      {service.completionDelay > 0 && (
                        <span className="text-xs text-red-500">
                          +{service.completionDelay} min
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {service.actualServiceTime != null ? (
                    <span className="text-sm text-gray-900">
                      {service.actualServiceTime} min
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">N/A</span>
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
            Showing <span className="font-medium">{startIndex + 1}</span> to{' '}
            <span className="font-medium">{Math.min(endIndex, serviceDetails.length)}</span> of{' '}
            <span className="font-medium">{serviceDetails.length}</span> results
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
              Previous
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
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceDetailsTable;
