/**
 * Order Detail Page
 * Shows detailed information about an order with management options
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchOrderById,
  updateOrderStatus,
  selectCurrentOrder,
  selectServiceLoading,
  selectServiceError
} from '../../redux/slices/serviceSlice';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const order = useSelector(selectCurrentOrder);
  const isLoading = useSelector(selectServiceLoading);
  const error = useSelector(selectServiceError);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  useEffect(() => {
    if (orderId) {
      dispatch(fetchOrderById(orderId));
    }
  }, [dispatch, orderId]);

  const handleStatusChange = (values, { setSubmitting, resetForm }) => {
    dispatch(updateOrderStatus({
      orderId: order._id,
      status: values.status,
      notes: values.notes
    })).then(() => {
      setSubmitting(false);
      setIsStatusModalOpen(false);
      resetForm();
    });
  };

  const getStatusBadgeClass = (status) => {
    switch(status?.toLowerCase()) {
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error loading order details
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">No order found with ID: {orderId}</p>
        <button
          onClick={() => navigate('/service/orders')}
          className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Order #{order.orderId}</h1>
          <p className="text-gray-600 mt-1">Created on {formatDate(order.createdAt)}</p>
        </div>
        <div className="flex items-center">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(order.status)}`}>
            {order.status?.charAt(0).toUpperCase() + order.status?.slice(1)}
          </span>
          <button
            onClick={() => navigate('/service/orders')}
            className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Back
          </button>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Information</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">Details and information about the order.</p>
        </div>

        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Service</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.service?.name || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Hotel</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.hotel?.name || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Guest</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.guest?.firstName} {order.guest?.lastName}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Contact</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.guest?.email || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Room Number</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.roomNumber || 'N/A'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Scheduled For</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(order.scheduledDate)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-sm font-medium text-gray-500">Special Requests</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {order.specialRequests || 'No special requests'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Information</h3>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
          <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Base Price</dt>
              <dd className="mt-1 text-sm text-gray-900">${order.basePrice?.toFixed(2) || '0.00'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Hotel Markup</dt>
              <dd className="mt-1 text-sm text-gray-900">
                ${(order.totalAmount - order.basePrice)?.toFixed(2) || '0.00'}
              </dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Total Amount</dt>
              <dd className="mt-1 text-sm font-medium text-gray-900">${order.totalAmount?.toFixed(2) || '0.00'}</dd>
            </div>
            <div className="sm:col-span-1">
              <dt className="text-sm font-medium text-gray-500">Payment Status</dt>
              <dd className="mt-1 text-sm text-gray-900">{order.paymentStatus || 'Not Paid'}</dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Order Timeline</h3>
        </div>
        <div className="border-t border-gray-200">
          <div className="flow-root px-4 py-5 sm:px-6">
            <ul className="-mb-8">
              {(order.timeline || []).map((event, eventIdx) => (
                <li key={eventIdx}>
                  <div className="relative pb-8">
                    {eventIdx !== (order.timeline?.length - 1) ? (
                      <span
                        className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200"
                        aria-hidden="true"
                      ></span>
                    ) : null}
                    <div className="relative flex space-x-3">
                      <div>
                        <span className={`h-8 w-8 rounded-full flex items-center justify-center ring-8 ring-white ${
                          event.status === 'completed' ? 'bg-green-500' :
                          event.status === 'cancelled' ? 'bg-red-500' :
                          'bg-blue-500'
                        }`}>
                          <svg className="h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                          </svg>
                        </span>
                      </div>
                      <div className="min-w-0 flex-1 pt-1.5 flex justify-between space-x-4">
                        <div>
                          <p className="text-sm text-gray-500">
                            Status changed to <span className="font-medium text-gray-900">{event.status}</span>
                          </p>
                          {event.notes && (
                            <p className="mt-1 text-sm text-gray-500">{event.notes}</p>
                          )}
                        </div>
                        <div className="text-right text-sm whitespace-nowrap text-gray-500">
                          {formatDate(event.timestamp)}
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-end space-x-3">
        {order.status === 'pending' && (
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Confirm Order
          </button>
        )}
        {order.status === 'confirmed' && (
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Start Service
          </button>
        )}
        {order.status === 'in-progress' && (
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            Complete Service
          </button>
        )}
        {['pending', 'confirmed'].includes(order.status) && (
          <button
            onClick={() => setIsStatusModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-gray-50"
          >
            Cancel Order
          </button>
        )}
      </div>

      {/* Status Update Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg overflow-hidden shadow-xl max-w-lg w-full">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Update Order Status</h3>
            </div>
            <Formik
              initialValues={{
                status: order.status === 'pending' ? 'confirmed' :
                         order.status === 'confirmed' ? 'in-progress' :
                         order.status === 'in-progress' ? 'completed' :
                         order.status,
                notes: ''
              }}
              validationSchema={Yup.object({
                status: Yup.string().required('Status is required'),
                notes: Yup.string()
              })}
              onSubmit={handleStatusChange}
            >
              {({ isSubmitting }) => (
                <Form className="px-4 py-5 sm:px-6">
                  <div className="mb-4">
                    <label htmlFor="status" className="block text-sm font-medium text-gray-700">Status</label>
                    <Field name="status" as="select" className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                      <option value="pending">Pending</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="in-progress">In Progress</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </Field>
                    <ErrorMessage name="status" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                  <div className="mb-4">
                    <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes</label>
                    <Field name="notes" as="textarea" rows={3} className="mt-1 block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm" placeholder="Add any notes about this status change..." />
                    <ErrorMessage name="notes" component="div" className="mt-1 text-sm text-red-600" />
                  </div>
                  <div className="flex justify-end space-x-3 mt-5">
                    <button
                      type="button"
                      onClick={() => setIsStatusModalOpen(false)}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
                    >
                      {isSubmitting ? 'Updating...' : 'Update Status'}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetailPage;
