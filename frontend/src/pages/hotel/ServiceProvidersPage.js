import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceProviders, selectServiceProviders, selectServiceProviderLoading, setServiceProviderMarkup } from '../../redux/slices/serviceSlice';
import AddServiceProviderModal from '../../components/hotel/AddServiceProviderModal';

/**
 * Hotel Admin Service Providers Management Page
 * @returns {JSX.Element} Service providers management page
 */
const ServiceProvidersPage = () => {
  const dispatch = useDispatch();
  const serviceProviders = useSelector(selectServiceProviders) || [];
  const isLoading = useSelector(selectServiceProviderLoading);  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [markupValue, setMarkupValue] = useState('');
  const [markupNotes, setMarkupNotes] = useState('');
  const [isSavingMarkup, setIsSavingMarkup] = useState(false);

  useEffect(() => {
    dispatch(fetchServiceProviders({}));
  }, [dispatch]);  // Filter service providers by search term
  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = searchTerm === '' ||
      (provider.businessName && provider.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.email && provider.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });
  // Handle setting markup for a service provider
  const handleSetMarkup = (provider) => {
    setSelectedProvider(provider);
    setMarkupValue(provider.markup?.percentage || '');
    setMarkupNotes(provider.markup?.notes || '');
    setIsModalOpen(true);
  };

  // Handle opening add provider modal
  const handleAddProvider = () => {
    setIsAddModalOpen(true);
  };  // Handle successful provider creation
  const handleProviderCreated = (newProvider) => {
    // Refresh the service providers list
    dispatch(fetchServiceProviders({}));
  };

  // Handle saving markup
  const handleSaveMarkup = async () => {
    if (!selectedProvider) return;

    const percentage = parseFloat(markupValue);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert('Please enter a valid markup percentage between 0 and 100');
      return;
    }

    setIsSavingMarkup(true);
    try {
      await dispatch(setServiceProviderMarkup({
        providerId: selectedProvider._id,
        percentage,
        notes: markupNotes
      })).unwrap();

      setIsModalOpen(false);
      setMarkupValue('');
      setMarkupNotes('');
    } catch (error) {
      console.error('Error setting markup:', error);
      alert('Failed to set markup. Please try again.');
    } finally {
      setIsSavingMarkup(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-modern-gray to-white">
      {/* Modern Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-modern-blue">Service Providers Management</h1>
              <p className="text-modern-darkGray mt-1">Manage service providers and their markup settings</p>
            </div>
            <button
              onClick={handleAddProvider}
              className="bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Provider</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-8">        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50 mb-8">
          <div className="px-8 py-6 bg-gradient-to-r from-modern-blue to-modern-lightBlue">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search Providers
            </h2>
            <p className="text-blue-100 mt-1">Find and manage your service providers</p>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder="Search by business name or email..."
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-modern-blue focus:ring-2 focus:ring-modern-blue focus:ring-opacity-20 transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => dispatch(fetchServiceProviders({}))}
                className="bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Refresh</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modern Service Providers Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50">
          <div className="px-8 py-6 bg-gradient-to-r from-modern-blue to-modern-lightBlue">
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              Service Providers ({filteredProviders.length})
            </h2>
            <p className="text-blue-100 mt-1">Manage your network of service providers</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-lightBlue border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-modern-blue border-t-transparent animate-ping opacity-20"></div>
              </div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-modern-darkGray">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No providers found</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm ? 'No providers match your search criteria.' : 'No service providers have been added yet.'}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full divide-y divide-gray-200">                    <thead className="bg-modern-gray">
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[200px]">Business Name</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[180px]">Contact</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[100px]">Status</th>
                        <th className="px-4 py-4 text-left text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[120px]">Markup</th>
                        <th className="px-4 py-4 text-center text-xs font-bold text-modern-blue uppercase tracking-wider min-w-[120px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredProviders.map((provider) => (
                        <tr key={provider._id} className="hover:bg-modern-gray transition-colors duration-200">
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold">
                                {provider.businessName?.charAt(0) || 'P'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                                  {provider.businessName || 'N/A'}
                                </div>
                                <div className="text-xs text-modern-darkGray truncate max-w-[150px]">
                                  {provider.description?.substring(0, 40) || 'No description'}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                              {provider.email || 'N/A'}
                            </div>
                            <div className="text-xs text-modern-darkGray">
                              {provider.phone || 'No phone'}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : provider.verificationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : provider.verificationStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : !provider.isActive
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                                ? 'Active'
                                : provider.verificationStatus === 'pending'
                                ? 'Pending'
                                : provider.verificationStatus === 'rejected'
                                ? 'Rejected'
                                : !provider.isActive
                                ? 'Inactive'
                                : provider.verificationStatus?.toUpperCase() || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <span className="text-sm font-medium text-gray-900">
                              {provider.markup?.percentage ? `${provider.markup.percentage}%` : 'Not set'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="flex space-x-2 justify-center">
                              <button
                                onClick={() => handleSetMarkup(provider)}
                                className="text-modern-blue hover:text-modern-darkBlue font-medium transition-colors duration-200 px-3 py-1 rounded hover:bg-blue-50 text-sm"
                              >
                                Set Markup
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredProviders.map((provider) => (
                  <div key={provider._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold">
                          {provider.businessName?.charAt(0) || 'P'}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{provider.businessName || 'N/A'}</h3>
                          <p className="text-sm text-modern-darkGray truncate max-w-[200px]">
                            {provider.description?.substring(0, 40) || 'No description'}...
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : provider.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : provider.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : !provider.isActive
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                          ? 'Active'
                          : provider.verificationStatus === 'pending'
                          ? 'Pending'
                          : provider.verificationStatus === 'rejected'
                          ? 'Rejected'
                          : !provider.isActive
                          ? 'Inactive'
                          : provider.verificationStatus?.toUpperCase() || 'Unknown'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Contact:</span>
                        <span className="text-sm font-medium text-gray-900">{provider.email || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Phone:</span>
                        <span className="text-sm font-medium text-gray-900">{provider.phone || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Markup:</span>
                        <span className="text-sm font-medium text-gray-900">
                          {provider.markup?.percentage ? `${provider.markup.percentage}%` : 'Not set'}
                        </span>
                      </div>

                      <div className="flex space-x-2 mt-4">
                        <button
                          onClick={() => handleSetMarkup(provider)}
                          className="w-full text-modern-blue hover:text-modern-darkBlue font-medium transition-colors duration-200 py-2 rounded hover:bg-blue-50 text-sm text-center border border-modern-blue"
                        >
                          Set Markup
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Set Markup Modal */}
        {isModalOpen && selectedProvider && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                setMarkupValue('');
                setMarkupNotes('');
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">Set Markup</h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setMarkupValue('');
                      setMarkupNotes('');
                    }}
                    className="text-white hover:text-gray-200 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedProvider.businessName}</h4>
                  <p className="text-sm text-gray-600">
                    Current markup: <span className="font-medium text-modern-blue">{selectedProvider.markup?.percentage || 0}%</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Markup Percentage (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-modern-blue focus:ring-2 focus:ring-modern-blue focus:ring-opacity-20 transition-all duration-300"
                    placeholder="Enter markup percentage"
                    value={markupValue}
                    onChange={(e) => setMarkupValue(e.target.value)}
                    disabled={isSavingMarkup}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-modern-blue focus:ring-2 focus:ring-modern-blue focus:ring-opacity-20 transition-all duration-300"
                    placeholder="Add notes about this markup..."
                    value={markupNotes}
                    onChange={(e) => setMarkupNotes(e.target.value)}
                    rows={3}
                    disabled={isSavingMarkup}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setMarkupValue('');
                      setMarkupNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue transition-colors duration-200"
                    disabled={isSavingMarkup}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMarkup}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-modern-blue to-modern-lightBlue border border-transparent rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={isSavingMarkup}
                  >
                    {isSavingMarkup ? 'Saving...' : 'Save Markup'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Service Provider Modal */}
        <AddServiceProviderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleProviderCreated}
        />
      </div>
    </div>
  );
};

export default ServiceProvidersPage;
