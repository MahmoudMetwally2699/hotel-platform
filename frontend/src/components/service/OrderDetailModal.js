/**
 * Order Detail Modal Component
 * Displays detailed information about an order
 */

import React from 'react';

const OrderDetailModal = ({
  order,
  isOpen,
  onClose,
  onStatusChange
}) => {
  if (!isOpen || !order) return null;

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get status badge color based on status
  const getStatusBadgeClass = (status) => {
    switch(status.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in-progress':
        return 'bg-indigo-100 text-indigo-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Handle status change
  const handleStatusChange = (newStatus) => {
    if (onStatusChange) {
      onStatusChange(order._id, newStatus);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-3xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center border-b pb-3">
          <h3 className="text-lg font-medium text-gray-900">
            Order Details: {order.orderId}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </button>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <h4 className="font-medium text-gray-800">Order Information</h4>
            <div className="mt-2 space-y-2">
              <div>
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`ml-2 px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Created:</span>
                <span className="ml-2 text-sm text-gray-800">{formatDate(order.createdAt)}</span>
              </div>
              {order.scheduledDate && (
                <div>
                  <span className="text-sm text-gray-500">Scheduled For:</span>
                  <span className="ml-2 text-sm text-gray-800">{formatDate(order.scheduledDate)}</span>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Service:</span>
                <span className="ml-2 text-sm text-gray-800">{order.service?.name || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Hotel:</span>
                <span className="ml-2 text-sm text-gray-800">{order.hotel?.name || 'N/A'}</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-800">Guest Information</h4>
            <div className="mt-2 space-y-2">
              <div>
                <span className="text-sm text-gray-500">Name:</span>
                <span className="ml-2 text-sm text-gray-800">
                  {order.guest?.firstName} {order.guest?.lastName}
                </span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Email:</span>
                <span className="ml-2 text-sm text-gray-800">{order.guest?.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Phone:</span>
                <span className="ml-2 text-sm text-gray-800">{order.guest?.phone || 'N/A'}</span>
              </div>
              <div>
                <span className="text-sm text-gray-500">Room:</span>
                <span className="ml-2 text-sm text-gray-800">{order.roomNumber || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4">          <h4 className="font-medium text-gray-800">Pricing Details</h4>
          <div className="mt-2 bg-gray-50 p-4 rounded">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Total Amount:</span>
              <span className="text-sm font-bold">${order.totalAmount?.toFixed(2) || '0.00'}</span>
            </div>
          </div>
        </div>

        {order.specialRequests && (
          <div className="mt-4">
            <h4 className="font-medium text-gray-800">Special Requests</h4>
            <div className="mt-2 bg-gray-50 p-4 rounded text-sm text-gray-700">
              {order.specialRequests}
            </div>
          </div>
        )}

        <div className="mt-4">
          <h4 className="font-medium text-gray-800">Order Timeline</h4>
          <div className="mt-2 space-y-4">
            {order.timeline && order.timeline.map((event, index) => (
              <div key={index} className="flex">
                <div className="mr-3">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-800">{event.status}</p>
                  <p className="text-sm text-gray-500">{formatDate(event.timestamp)}</p>
                  {event.notes && <p className="text-sm text-gray-600 mt-1">{event.notes}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-6 border-t pt-4 flex justify-end space-x-3">
          {order.status === 'pending' && (
            <button
              onClick={() => handleStatusChange('confirmed')}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
            >
              Confirm Order
            </button>
          )}
          {order.status === 'confirmed' && (
            <button
              onClick={() => handleStatusChange('in-progress')}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none"
            >
              Start Service
            </button>
          )}
          {order.status === 'in-progress' && (
            <button
              onClick={() => handleStatusChange('completed')}
              className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none"
            >
              Complete Service
            </button>
          )}
          {['pending', 'confirmed'].includes(order.status) && (
            <button
              onClick={() => handleStatusChange('cancelled')}
              className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50 focus:outline-none"
            >
              Cancel Order
            </button>
          )}
          <button
            onClick={onClose}
            className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailModal;
