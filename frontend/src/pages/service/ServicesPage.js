/**
 * Service Provider Services Page
 * Manages the services offered by a service provider
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  fetchProviderServices,
  createService,
  updateService,
  deleteService,
  selectProviderServices,
  selectServiceLoading,
  selectServiceError
} from '../../redux/slices/serviceSlice';

const ServiceSchema = Yup.object().shape({
  name: Yup.string().required('Service name is required'),
  description: Yup.string().required('Description is required'),
  category: Yup.string().required('Category is required'),
  basePrice: Yup.number().positive('Price must be positive').required('Base price is required'),
  duration: Yup.number().positive('Duration must be positive').required('Duration is required'),
  availability: Yup.boolean(),
});

const ServicesPage = () => {
  const dispatch = useDispatch();
  const services = useSelector(selectProviderServices);
  const isLoading = useSelector(selectServiceLoading);
  const error = useSelector(selectServiceError);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentService, setCurrentService] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);

  useEffect(() => {
    dispatch(fetchProviderServices());
  }, [dispatch]);

  const handleOpenModal = (service = null) => {
    if (service) {
      setCurrentService(service);
      setIsEditMode(true);
    } else {
      setCurrentService(null);
      setIsEditMode(false);
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentService(null);
    setIsEditMode(false);
  };

  const handleSubmit = (values, { resetForm }) => {
    if (isEditMode) {
      dispatch(updateService({ id: currentService._id, serviceData: values }))
        .then(() => {
          handleCloseModal();
          resetForm();
        });
    } else {
      dispatch(createService(values))
        .then(() => {
          handleCloseModal();
          resetForm();
        });
    }
  };

  const handleDeleteClick = (service) => {
    setServiceToDelete(service);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (serviceToDelete) {
      dispatch(deleteService(serviceToDelete._id))
        .then(() => {
          setShowDeleteConfirm(false);
          setServiceToDelete(null);
        });
    }
  };

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-800">Manage Services</h1>
        <button
          onClick={() => handleOpenModal()}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Add New Service
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="text-center py-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading services...</p>
        </div>
      ) : (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          {services && services.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {services.map((service) => (
                <li key={service._id}>
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          service.availability ? 'bg-green-100' : 'bg-gray-100'
                        }`}>
                          {service.category === 'laundry' && (
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h18m-18 0v14a2 2 0 002 2h12a2 2 0 002-2V5m-14 0l2-2h8l2 2M7 9a2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2m10 6a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
                            </svg>
                          )}
                          {service.category === 'transportation' && (
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                          )}
                          {service.category === 'tourism' && (
                            <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{service.name}</div>
                          <div className="text-sm text-gray-500">
                            <span className="capitalize">{service.category}</span> • ${service.basePrice.toFixed(2)} • {service.duration} minutes
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          service.availability ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.availability ? 'Active' : 'Inactive'}
                        </span>
                        <button
                          onClick={() => handleOpenModal(service)}
                          className="text-sm font-medium text-blue-600 hover:text-blue-500"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(service)}
                          className="text-sm font-medium text-red-600 hover:text-red-500"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <p className="mt-2 text-sm text-gray-500 sm:mt-0">
                          {service.description.length > 100
                            ? `${service.description.substring(0, 100)}...`
                            : service.description}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <svg className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>Last updated on {new Date(service.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-10">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by adding your first service.</p>
              <div className="mt-6">
                <button
                  onClick={() => handleOpenModal()}
                  type="button"
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <svg className="-ml-1 mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  New Service
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Service Modal */}
      {isModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <Formik
                initialValues={
                  isEditMode
                    ? {
                        name: currentService.name,
                        description: currentService.description,
                        category: currentService.category,
                        basePrice: currentService.basePrice,
                        duration: currentService.duration,
                        availability: currentService.availability,
                      }
                    : {
                        name: '',
                        description: '',
                        category: 'laundry',
                        basePrice: '',
                        duration: '',
                        availability: true,
                      }
                }
                validationSchema={ServiceSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                      <div className="sm:flex sm:items-start">
                        <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                          <h3 className="text-lg leading-6 font-medium text-gray-900">{isEditMode ? 'Edit Service' : 'Add New Service'}</h3>
                          <div className="mt-4 space-y-4">
                            <div>
                              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                                Service Name
                              </label>
                              <Field
                                type="text"
                                name="name"
                                id="name"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter service name"
                              />
                              <ErrorMessage name="name" component="div" className="mt-1 text-sm text-red-600" />
                            </div>

                            <div>
                              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                                Description
                              </label>
                              <Field
                                as="textarea"
                                name="description"
                                id="description"
                                rows={3}
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                placeholder="Enter service description"
                              />
                              <ErrorMessage name="description" component="div" className="mt-1 text-sm text-red-600" />
                            </div>

                            <div>
                              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                                Category
                              </label>
                              <Field
                                as="select"
                                name="category"
                                id="category"
                                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                              >
                                <option value="laundry">Laundry</option>
                                <option value="transportation">Transportation</option>
                                <option value="tourism">Travel & Tourism</option>
                              </Field>
                              <ErrorMessage name="category" component="div" className="mt-1 text-sm text-red-600" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <label htmlFor="basePrice" className="block text-sm font-medium text-gray-700">
                                  Base Price ($)
                                </label>
                                <Field
                                  type="number"
                                  step="0.01"
                                  name="basePrice"
                                  id="basePrice"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="0.00"
                                />
                                <ErrorMessage name="basePrice" component="div" className="mt-1 text-sm text-red-600" />
                              </div>

                              <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-gray-700">
                                  Duration (minutes)
                                </label>
                                <Field
                                  type="number"
                                  name="duration"
                                  id="duration"
                                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                  placeholder="30"
                                />
                                <ErrorMessage name="duration" component="div" className="mt-1 text-sm text-red-600" />
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Field
                                type="checkbox"
                                name="availability"
                                id="availability"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <label htmlFor="availability" className="ml-2 block text-sm text-gray-700">
                                Service is available
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        {isSubmitting ? 'Saving...' : isEditMode ? 'Update' : 'Create'}
                      </button>
                      <button
                        type="button"
                        onClick={handleCloseModal}
                        className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Service</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete this service? This action cannot be undone and may affect existing bookings.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Delete
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setServiceToDelete(null);
                  }}
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
