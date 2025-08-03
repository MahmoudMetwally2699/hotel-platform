/**
 * Hotel Category Services Page
 * Displays services for a specific hotel and category with enhanced filtering and booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  FaTshirt,
  FaCar,
  FaMapMarkedAlt,
  FaSpa,
  FaUtensils,
  FaMusic,
  FaShoppingBag,
  FaDumbbell,
  FaSpinner,
  FaArrowLeft,
  FaStar,
  FaFilter,
  FaSort,
  FaClock,
  FaMapMarkerAlt,
  FaTag
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import GuestCategorySelection from '../../components/guest/GuestCategorySelection';

const categoryIcons = {
  laundry: FaTshirt,
  transportation: FaCar,
  tours: FaMapMarkedAlt,
  spa: FaSpa,
  dining: FaUtensils,
  entertainment: FaMusic,
  shopping: FaShoppingBag,
  fitness: FaDumbbell
};

const HotelCategoryServicesPage = () => {
  const navigate = useNavigate();
  const { hotelId, category } = useParams();

  const [services, setServices] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price_low');
  const [priceFilter, setPriceFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');

  const IconComponent = categoryIcons[category] || FaShoppingBag;
  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1).replace(/([A-Z])/g, ' $1') : '';
  useEffect(() => {
    const fetchCategoryServices = async () => {
      try {
        setLoading(true);

        // Fetch hotel details
        const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
        setHotel(hotelResponse.data.data);

        // If no category specified, just load hotel details for category selection
        if (!category) {
          setLoading(false);
          return;
        }

        // Fetch category-specific services
        const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services`, {
          params: {
            category: category,
            limit: 50
          }
        });

        setServices(servicesResponse.data.data || []);

      } catch (error) {
        console.error('Error fetching category services:', error);
        toast.error('Failed to load services');
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchCategoryServices();
    }
  }, [hotelId, category]);

  // Filter and sort services
  const filteredAndSortedServices = services
    .filter(service => {
      if (priceFilter === 'budget' && service.pricing?.finalPrice > 50) return false;
      if (priceFilter === 'premium' && service.pricing?.finalPrice <= 50) return false;
      if (availabilityFilter === 'available' && !service.isActive) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return (a.pricing?.finalPrice || 0) - (b.pricing?.finalPrice || 0);
        case 'price_high':
          return (b.pricing?.finalPrice || 0) - (a.pricing?.finalPrice || 0);
        case 'rating':
          return (b.providerId?.rating || 0) - (a.providerId?.rating || 0);
        case 'popularity':
          return (b.performance?.totalBookings || 0) - (a.performance?.totalBookings || 0);
        default:
          return 0;
      }
    });
  const handleServiceSelect = (service) => {
    if (category === 'laundry') {
      // Navigate to enhanced laundry booking interface
      navigate(`/hotels/${hotelId}/services/laundry/booking`, {
        state: { service, hotel }
      });
    } else {
      // Navigate to regular service details page
      navigate(`/services/details/${service._id}`);
    }
  };

  const handleBackToCategories = () => {
    navigate(`/hotels/${hotelId}/categories`);
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading {categoryTitle.toLowerCase() || 'hotel'} services...</p>
        </div>
      </div>
    );
  }

  // If no category is specified, show the category selection component
  if (!category) {
    return <GuestCategorySelection />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={handleBackToCategories}
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                  <IconComponent className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {categoryTitle} Services
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Available at {hotel?.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-gray-500">Total Services</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedServices.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <span className="font-medium text-gray-700">Filters:</span>
              </div>

              {/* Price Filter */}
              <div>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Prices</option>
                  <option value="budget">Budget (Under $50)</option>
                  <option value="premium">Premium ($50+)</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Services</option>
                  <option value="available">Available Now</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaSort className="text-gray-500" />
                <span className="font-medium text-gray-700">Sort by:</span>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                  <option value="popularity">Most Popular</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}
        {filteredAndSortedServices.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No {categoryTitle.toLowerCase()} services available
            </h3>
            <p className="text-gray-600 mb-6">
              This hotel doesn't have any {categoryTitle.toLowerCase()} services at the moment.
            </p>
            <button
              onClick={handleBackToCategories}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Other Categories
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAndSortedServices.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => handleServiceSelect(service)}
              >
                {/* Service Image */}
                <div className="relative h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconComponent className="text-4xl text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="bg-white bg-opacity-90 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {service.category}
                    </span>
                  </div>
                  {service.performance?.totalBookings > 10 && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        Popular
                      </span>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>

                  {/* Provider Info */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-sm text-gray-500">By </span>
                      <span className="text-sm font-medium text-gray-700">
                        {service.providerId?.businessName}
                      </span>
                    </div>
                    {service.providerId?.rating && (
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 text-sm mr-1" />
                        <span className="text-sm text-gray-600">
                          {service.providerId.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Service Features */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaClock className="text-gray-400 mr-2" />
                      <span>Duration: {service.duration || 'Varies'}</span>
                    </div>
                    {service.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <FaMapMarkerAlt className="text-gray-400 mr-2" />
                        <span>{service.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <FaTag className="text-green-500 mr-2" />
                          <span className="text-2xl font-bold text-green-600">
                            ${service.pricing?.finalPrice?.toFixed(2) || 'N/A'}
                          </span>
                        </div>
                        {service.pricing?.basePrice && service.pricing?.finalPrice !== service.pricing?.basePrice && (
                          <div className="text-sm text-gray-500">
                            Base: ${service.pricing.basePrice.toFixed(2)}
                          </div>
                        )}
                      </div>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        {category === 'laundry' ? 'Select Items' : 'Book Now'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Category-specific info */}
        {category === 'laundry' && filteredAndSortedServices.length > 0 && (
          <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🧺 Enhanced Laundry Experience
            </h3>
            <p className="text-blue-700">
              Select multiple items, choose service types, and enjoy room pickup & delivery!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelCategoryServicesPage;
