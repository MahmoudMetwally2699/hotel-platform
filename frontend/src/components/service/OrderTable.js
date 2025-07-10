/**
 * Order Table Component
 * Reusable table component for displaying service orders with filtering and sorting
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';

const OrderTable = ({
  orders = [],
  isLoading = false,
  onStatusChange,
  onSort,
  sortConfig = { key: 'createdAt', direction: 'desc' }
}) => {
  const navigate = useNavigate();

  // Handle click on order row to navigate to details
  const handleOrderClick = (orderId) => {
    navigate(`/service/orders/${orderId}`);
  };

  // Handle status change button click
  const handleStatusChange = (e, orderId, newStatus) => {
    e.stopPropagation(); // Prevent row click
    if (onStatusChange) {
      onStatusChange(orderId, newStatus);
    }
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

  // Handle column header click for sorting
  const handleHeaderClick = (key) => {
    if (onSort) {
      const direction = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      onSort(key, direction);
    }
  };

  // Get sort direction indicator
  const getSortDirectionIndicator = (key) => {
    if (sortConfig.key === key) {
      return sortConfig.direction === 'asc' ? '↑' : '↓';
    }
    return '';
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-10">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-10 sm:px-6 text-center text-gray-500">
          No orders found
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('orderId')}
              >
                Order ID {getSortDirectionIndicator('orderId')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('service.name')}
              >
                Service {getSortDirectionIndicator('service.name')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('hotel.name')}
              >
                Hotel {getSortDirectionIndicator('hotel.name')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('guest.firstName')}
              >
                Guest {getSortDirectionIndicator('guest.firstName')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('status')}
              >
                Status {getSortDirectionIndicator('status')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('totalAmount')}
              >
                Amount {getSortDirectionIndicator('totalAmount')}
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                onClick={() => handleHeaderClick('createdAt')}
              >
                Date {getSortDirectionIndicator('createdAt')}
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr
                key={order._id}
                onClick={() => handleOrderClick(order._id)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderId}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.service?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.hotel?.name || 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {order.guest?.firstName} {order.guest?.lastName}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(order.status)}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ${order.totalAmount.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {formatDate(order.createdAt)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-2" onClick={e => e.stopPropagation()}>
                    {order.status === 'pending' && (
                      <button
                        onClick={(e) => handleStatusChange(e, order._id, 'confirmed')}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded"
                      >
                        Confirm
                      </button>
                    )}
                    {order.status === 'confirmed' && (
                      <button
                        onClick={(e) => handleStatusChange(e, order._id, 'in-progress')}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded"
                      >
                        Start
                      </button>
                    )}
                    {order.status === 'in-progress' && (
                      <button
                        onClick={(e) => handleStatusChange(e, order._id, 'completed')}
                        className="text-green-600 hover:text-green-900 bg-green-50 hover:bg-green-100 px-2 py-1 rounded"
                      >
                        Complete
                      </button>
                    )}
                    {['pending', 'confirmed'].includes(order.status) && (
                      <button
                        onClick={(e) => handleStatusChange(e, order._id, 'cancelled')}
                        className="text-red-600 hover:text-red-900 bg-red-50 hover:bg-red-100 px-2 py-1 rounded"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrderTable;
