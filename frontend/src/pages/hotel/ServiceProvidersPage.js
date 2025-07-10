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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Service Providers Management</h1>
        <button
          onClick={handleAddProvider}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
        >
          Add New Provider
        </button>
      </div>      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/2">
          <input
            type="text"
            placeholder="Search providers..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Service Providers List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Business Name</th>
                <th className="py-3 px-4 text-left">Categories</th>
                <th className="py-3 px-4 text-left">Contact</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-left">Current Markup</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProviders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No service providers found
                  </td>
                </tr>
              ) : (                filteredProviders.map((provider) => (
                  <tr key={provider._id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{provider.businessName || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{provider.description?.substring(0, 50) || 'No description'}...</div>
                    </td>                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {provider.categories && provider.categories.length > 0 ? (
                          provider.categories.map((category, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                              {category}
                            </span>
                          ))
                        ) : (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            No categories selected
                          </span>
                        )}
                      </div>
                    </td><td className="py-3 px-4">
                      <div>{provider.email || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{provider.phone || 'N/A'}</div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
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
                          ? 'ACTIVE'
                          : provider.verificationStatus === 'pending'
                          ? 'PENDING'
                          : provider.verificationStatus === 'rejected'
                          ? 'REJECTED'
                          : !provider.isActive
                          ? 'INACTIVE'
                          : provider.verificationStatus?.toUpperCase() || 'UNKNOWN'}
                      </span>
                    </td>                    <td className="py-3 px-4">
                      {provider.markup?.percentage ? `${provider.markup.percentage}%` : 'Not set'}
                    </td>                    <td className="py-3 px-4 text-center">
                      <div className="flex space-x-2 justify-center">
                        <button
                          onClick={() => handleSetMarkup(provider)}
                          className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition text-sm"
                        >
                          Set Markup
                        </button>
                        <button
                          onClick={() => window.open(`/hotel/provider-clients?providerId=${provider._id}`, '_blank')}
                          className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition text-sm"
                        >
                          View Clients
                        </button>
                        <button
                          onClick={() => window.open(`/hotel/analytics?providerId=${provider._id}`, '_blank')}
                          className="px-3 py-1 bg-purple-500 text-white rounded hover:bg-purple-600 transition text-sm"
                        >
                          Analytics
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}      {/* Set Markup Modal */}
      {isModalOpen && selectedProvider && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Set Markup for {selectedProvider.businessName}</h2>
            <p className="mb-4 text-gray-600">
              Current markup: {selectedProvider.markup?.percentage || 0}%
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Markup Percentage (%)</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter markup percentage"
                value={markupValue}
                onChange={(e) => setMarkupValue(e.target.value)}
                disabled={isSavingMarkup}
              />
            </div>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Notes (Optional)</label>
              <textarea
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Add notes about this markup..."
                value={markupNotes}
                onChange={(e) => setMarkupNotes(e.target.value)}
                rows={3}
                disabled={isSavingMarkup}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setMarkupValue('');
                  setMarkupNotes('');
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
                disabled={isSavingMarkup}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveMarkup}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSavingMarkup}
              >
                {isSavingMarkup ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}{/* Add Service Provider Modal */}
      <AddServiceProviderModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={handleProviderCreated}
      />
    </div>
  );
};

export default ServiceProvidersPage;
