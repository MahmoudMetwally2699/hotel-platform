import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  selectAllServiceProviders,
  fetchAllServiceProviders,
  selectServiceProviderLoading,
  approveServiceProvider,
  suspendServiceProvider,
  deleteServiceProvider
} from '../../redux/slices/serviceSlice';
import { Link } from 'react-router-dom';

const ServiceProviderManagementPage = () => {
  const dispatch = useDispatch();
  const serviceProviders = useSelector(selectAllServiceProviders);
  const loading = useSelector(selectServiceProviderLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('businessName');
  const [sortDirection, setSortDirection] = useState('asc');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    dispatch(fetchAllServiceProviders());
  }, [dispatch]);

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleCategoryFilter = (e) => {
    setFilterCategory(e.target.value);
  };

  const handleStatusFilter = (e) => {
    setFilterStatus(e.target.value);
  };

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDirection('asc');
    }
  };

  const openModal = (provider, action) => {
    setSelectedProvider(provider);
    setActionType(action);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedProvider(null);
    setActionType('');
  };

  const handleAction = () => {
    if (!selectedProvider) return;

    switch (actionType) {
      case 'approve':
        dispatch(approveServiceProvider(selectedProvider._id));
        break;
      case 'suspend':
        dispatch(suspendServiceProvider(selectedProvider._id));
        break;
      case 'delete':
        dispatch(deleteServiceProvider(selectedProvider._id));
        break;
      default:
        break;
    }

    closeModal();
  };

  // Filter and sort service providers
  const filteredProviders = serviceProviders?.filter(provider => {
    const matchesSearch =
      provider.businessName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      provider.address?.city.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = filterCategory === 'all' || provider.category === filterCategory;
    const matchesStatus = filterStatus === 'all' || provider.status === filterStatus;

    return matchesSearch && matchesCategory && matchesStatus;
  }) || [];

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'businessName':
        comparison = a.businessName.localeCompare(b.businessName);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
      case 'city':
        comparison = (a.address?.city || '').localeCompare(b.address?.city || '');
        break;
      case 'status':
        comparison = (a.status || '').localeCompare(b.status || '');
        break;
      case 'registrationDate':
        comparison = new Date(a.createdAt) - new Date(b.createdAt);
        break;
      default:
        comparison = 0;
    }

    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Active
          </span>
        );
      case 'pending':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
            Pending
          </span>
        );
      case 'suspended':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
            Suspended
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const getCategoryBadge = (category) => {
    switch (category) {
      case 'laundry':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            Laundry
          </span>
        );
      case 'transportation':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-purple-100 text-purple-800">
            Transportation
          </span>
        );
      case 'tours':
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
            Tours
          </span>
        );
      default:
        return (
          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
            {category}
          </span>
        );
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4 md:mb-0">Service Provider Management</h1>
        <Link
          to="/superadmin/service-providers/add"
          className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <svg className="mr-2 -ml-1 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Provider
        </Link>
      </div>

      {/* Filters and Search */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Search providers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        <div>
          <select
            value={filterCategory}
            onChange={handleCategoryFilter}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            <option value="laundry">Laundry</option>
            <option value="transportation">Transportation</option>
            <option value="tours">Tours</option>
          </select>
        </div>

        <div>
          <select
            value={filterStatus}
            onChange={handleStatusFilter}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Service Provider List */}
      <div className="bg-white shadow overflow-hidden rounded-lg">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('businessName')}
                  >
                    <div className="flex items-center">
                      Business Name
                      {sortBy === 'businessName' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('category')}
                  >
                    <div className="flex items-center">
                      Category
                      {sortBy === 'category' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('city')}
                  >
                    <div className="flex items-center">
                      Location
                      {sortBy === 'city' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center">
                      Status
                      {sortBy === 'status' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('registrationDate')}
                  >
                    <div className="flex items-center">
                      Registered On
                      {sortBy === 'registrationDate' && (
                        <span className="ml-1">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedProviders.length > 0 ? (
                  sortedProviders.map(provider => (
                    <tr key={provider._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 mr-3">
                            <img
                              className="h-10 w-10 rounded-full object-cover"
                              src={provider.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(provider.businessName)}&background=random`}
                              alt={provider.businessName}
                            />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{provider.businessName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getCategoryBadge(provider.category)}
                        <div className="text-xs text-gray-500 mt-1">{provider.subcategory}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{provider.address?.city}</div>
                        <div className="text-xs text-gray-500">{provider.address?.country}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{provider.email}</div>
                        <div className="text-sm text-gray-500">{provider.phone}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(provider.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(provider.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link
                          to={`/superadmin/service-providers/${provider._id}`}
                          className="text-blue-600 hover:text-blue-900 mr-4"
                        >
                          View
                        </Link>
                        <Link
                          to={`/superadmin/service-providers/${provider._id}/edit`}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </Link>

                        {provider.status === 'pending' && (
                          <button
                            type="button"
                            onClick={() => openModal(provider, 'approve')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            Approve
                          </button>
                        )}

                        {provider.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() => openModal(provider, 'suspend')}
                            className="text-yellow-600 hover:text-yellow-900 mr-4"
                          >
                            Suspend
                          </button>
                        ) : (
                          provider.status === 'suspended' && (
                            <button
                              type="button"
                              onClick={() => openModal(provider, 'approve')}
                              className="text-green-600 hover:text-green-900 mr-4"
                            >
                              Reactivate
                            </button>
                          )
                        )}

                        <button
                          type="button"
                          onClick={() => openModal(provider, 'delete')}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500">
                      {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                        ? 'No service providers match your search criteria'
                        : 'No service providers found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      {isModalOpen && selectedProvider && (
        <div className="fixed inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" onClick={closeModal}></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${
                    actionType === 'approve' ? 'bg-green-100' : actionType === 'suspend' ? 'bg-yellow-100' : 'bg-red-100'
                  }`}>
                    {actionType === 'approve' ? (
                      <svg className="h-6 w-6 text-green-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : actionType === 'suspend' ? (
                      <svg className="h-6 w-6 text-yellow-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    ) : (
                      <svg className="h-6 w-6 text-red-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                      {actionType === 'approve' ? 'Approve Service Provider' : actionType === 'suspend' ? 'Suspend Service Provider' : 'Delete Service Provider'}
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        {actionType === 'approve'
                          ? `Are you sure you want to approve ${selectedProvider.businessName}? This will allow them to offer services on the platform.`
                          : actionType === 'suspend'
                            ? `Are you sure you want to suspend ${selectedProvider.businessName}? This will temporarily prevent them from offering services.`
                            : `Are you sure you want to delete ${selectedProvider.businessName}? All of their data will be permanently removed from our servers. This action cannot be undone.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white sm:ml-3 sm:w-auto sm:text-sm ${
                    actionType === 'approve'
                      ? 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
                      : actionType === 'suspend'
                        ? 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500'
                        : 'bg-red-600 hover:bg-red-700 focus:ring-red-500'
                  }`}
                  onClick={handleAction}
                >
                  {actionType === 'approve' ? 'Approve' : actionType === 'suspend' ? 'Suspend' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeModal}
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

export default ServiceProviderManagementPage;
