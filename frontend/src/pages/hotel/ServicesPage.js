import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchServices, selectServices, selectIsLoading } from '../../redux/slices/serviceSlice';
import { selectHotelCurrency } from '../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../utils/currency';

/**
 * Hotel Admin Services Management Page
 * @returns {JSX.Element} Services management page
 */
const ServicesPage = () => {
  const dispatch = useDispatch();
  const { i18n } = useTranslation();
  const services = useSelector(selectServices);
  const isLoading = useSelector(selectIsLoading);
  const currency = useSelector(selectHotelCurrency);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchServices({}));
  }, [dispatch]);

  // Filter services by search term and category
  const filteredServices = services.filter(service => {
    const matchesSearch = searchTerm === '' ||
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.description.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = categoryFilter === '' || service.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  // Handle setting markup for a service
  const handleSetMarkup = (service) => {
    setSelectedService(service);
    setIsModalOpen(true);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Services Management</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search services..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/3">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">All Categories</option>
            <option value="LAUNDRY">Laundry</option>
            <option value="TRANSPORTATION">Transportation</option>
            <option value="TOURISM">Tourism</option>
            <option value="FOOD">Food & Beverage</option>
            <option value="WELLNESS">Wellness & Spa</option>
          </select>
        </div>
      </div>

      {/* Services List */}
      {isLoading ? (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
            <div className="relative flex flex-col items-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Hotel Service Categories</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading available hotel service categories...</p>
            </div>
          </div>
          <div className="w-full px-2 sm:px-3 lg:px-4">
            <div className="flex justify-center items-center h-96">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-[#3B5787] border-t-transparent animate-ping opacity-20"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredServices.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500">
              No services found
            </div>
          ) : (
            filteredServices.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg overflow-hidden shadow border border-gray-200 hover:shadow-lg transition"
              >
                <div className="relative h-48 bg-gray-200">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      No Image
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="px-2 py-1 bg-blue-500 text-white text-xs rounded-full">
                      {service.category}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold mb-2">{service.name}</h3>
                  <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex justify-between items-center mb-3">
                    <div>
                      <span className="text-gray-500 text-sm">Base Price:</span>
                      <span className="font-semibold ml-1">{formatPriceByLanguage(service.basePrice || 0, i18n.language, currency)}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 text-sm">Final Price:</span>
                      <span className="font-semibold ml-1">{formatPriceByLanguage(service.finalPrice || 0, i18n.language, currency)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-gray-500 text-sm">Current Markup:</span>
                      <span className="font-semibold ml-1">
                        {service.markupPercentage ? `${service.markupPercentage}%` : 'Not set'}
                      </span>
                    </div>
                    <button
                      onClick={() => handleSetMarkup(service)}
                      className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                    >
                      Set Markup
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Set Markup Modal */}
      {isModalOpen && selectedService && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Set Markup for {selectedService.name}</h2>
            <p className="mb-2 text-gray-600">
              Base price: {formatPriceByLanguage(selectedService.basePrice || 0, i18n.language, currency)}
            </p>
            <p className="mb-4 text-gray-600">
              Current markup: {selectedService.markupPercentage || 0}%
            </p>

            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Markup Percentage</label>
              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter markup percentage"
                defaultValue={selectedService.markupPercentage || 0}
              />

              {/* Preview of final price */}
              <div className="mt-3 p-3 bg-gray-50 rounded-md">
                <p className="text-sm text-gray-600">Preview:</p>
                <p className="font-medium">Final price: {formatPriceByLanguage(selectedService.finalPrice || 0, i18n.language, currency)}</p>
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  // Logic to save markup percentage would go here
                  setIsModalOpen(false);
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesPage;
