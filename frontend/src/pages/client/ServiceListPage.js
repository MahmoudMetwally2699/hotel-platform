/**
 * Service List Page
 * Displays all services available in a specific category
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchServicesByCategory, selectServicesLoading, selectServicesByCategory } from '../../redux/slices/serviceSlice';
import useRTL from '../../hooks/useRTL';
import { formatPriceByLanguage } from '../../utils/currency';

const ServiceListPage = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const { category } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const services = useSelector((state) => selectServicesByCategory(state, category));
  const isLoading = useSelector(selectServicesLoading);
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('price_low');
  // Normalized category for display
  const getCategoryName = (cat) => {
    if (!cat) return t('services.allServices');

    const categoryMap = {
      'laundry': t('services.laundry'),
      'transportation': t('services.transportation'),
      'tourism': t('services.tourism'),
      'car-rental': t('services.carRental'),
      'taxi': t('services.taxi')
    };

    return categoryMap[cat] || cat.charAt(0).toUpperCase() + cat.slice(1).replace(/-/g, ' ');
  };

  const categoryName = getCategoryName(category);

  useEffect(() => {
    dispatch(fetchServicesByCategory(category));
  }, [dispatch, category]);

  // Handle service click
  const handleServiceClick = (serviceId) => {
    navigate(`/services/details/${serviceId}`);
  };

  // Filter services
  const filteredServices = services.filter(service => {
    if (filter === 'all') return true;
    return service.type === filter;
  });
  // Sort services
  const sortedServices = [...filteredServices].sort((a, b) => {
    switch (sortBy) {
      case 'price_low':
        const priceA = a.pricing?.finalPrice || a.pricing?.basePrice || a.basePrice || 0;
        const priceB = b.pricing?.finalPrice || b.pricing?.basePrice || b.basePrice || 0;
        return priceA - priceB;
      case 'price_high':
        const priceHighA = a.pricing?.finalPrice || a.pricing?.basePrice || a.basePrice || 0;
        const priceHighB = b.pricing?.finalPrice || b.pricing?.basePrice || b.basePrice || 0;
        return priceHighB - priceHighA;
      case 'rating':
        return b.rating - a.rating;
      case 'popularity':
        return b.bookingCount - a.bookingCount;
      default:
        return 0;
    }
  });

  // Get unique service types
  const serviceTypes = [...new Set(services.map(service => service.type))];
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">      <div className={`flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 sm:mb-8 ${isRTL ? 'text-right' : 'text-left'} gap-4`}>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{categoryName}</h1>
          <p className="mt-1 text-sm sm:text-base text-gray-500">
            {t('services.servicesAvailable', { count: services.length })}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="form-input py-2 px-3 rounded-md border border-gray-300 text-sm sm:text-base"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="rating">Rating</option>
            <option value="popularity">Popularity</option>
          </select>
        </div>
      </div>      {/* Filter tabs */}
      <div className="mb-6 sm:mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-4 sm:space-x-6 overflow-x-auto">
            <button
              onClick={() => setFilter('all')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                filter === 'all'
                  ? 'border-primary-main text-primary-main'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              All Services
            </button>

            {serviceTypes.map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm whitespace-nowrap ${
                  filter === type
                    ? 'border-primary-main text-primary-main'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Service cards */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
        </div>
      ) : sortedServices.length > 0 ? (        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {sortedServices.map((service) => (
            <div
              key={service._id}
              className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02]"
              onClick={() => handleServiceClick(service._id)}
            >
              {/* Service Image */}
              <div className="h-40 sm:h-48 overflow-hidden relative">
                {service.image ? (
                  <img
                    src={service.image}
                    alt={service.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-400 text-sm">No image</span>
                  </div>
                )}                {/* Price Tag */}
                <div className="absolute bottom-0 right-0 bg-primary-main text-white px-2 sm:px-3 py-1 rounded-tl-lg font-semibold text-xs sm:text-sm">
                  {formatPriceByLanguage((service.pricing?.finalPrice || service.pricing?.basePrice || service.basePrice || 0), i18n.language)}
                </div>
              </div>

              {/* Service Details */}
              <div className="p-3 sm:p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900 line-clamp-1">{service.name}</h3>

                  {/* Rating */}
                  <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded flex-shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-xs sm:text-sm font-medium text-gray-600">{service.rating.toFixed(1)}</span>
                  </div>
                </div>

                <p className="mt-1 sm:mt-2 text-xs sm:text-sm text-gray-500 truncate">{service.provider?.name || 'Unknown Provider'}</p>
                <p className="mt-1 text-xs sm:text-sm text-gray-600 line-clamp-2">{service.description}</p>

                {/* Features */}
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                  {service.features?.slice(0, 2).map((feature, index) => (
                    <span key={index} className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {feature}
                    </span>
                  ))}
                  {(service.features?.length || 0) > 2 && (
                    <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{service.features.length - 2} more
                    </span>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-3 sm:px-4 py-2 sm:py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center">
                <div className="text-xs text-gray-500">
                  {service.bookingCount || 0} bookings
                </div>
                <button className="px-2 sm:px-3 py-1 bg-primary-main text-white text-xs sm:text-sm rounded hover:bg-primary-dark transition-colors">
                  Book Now
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No services found</h3>
          <p className="mt-1 text-sm text-gray-500">
            We couldn't find any services in this category.
          </p>
        </div>
      )}
    </div>
  );
};

export default ServiceListPage;
