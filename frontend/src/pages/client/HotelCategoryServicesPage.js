/**
 * Hotel Category Services Page
 * Displays services for a specific hotel and category with enhanced filtering and booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
import useRTL from '../../hooks/useRTL';
import { formatPriceByLanguage } from '../../utils/currency';

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

const HotelCategoryServicesPage = () => {  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const { hotelId, category } = useParams();

  const [services, setServices] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState('price_low');
  const [priceFilter, setPriceFilter] = useState('all');
  const [availabilityFilter, setAvailabilityFilter] = useState('all');
  const IconComponent = categoryIcons[category] || FaShoppingBag;

  // Get localized category title
  const getCategoryTitle = (categoryKey) => {
    const categoryMap = {
      laundry: t('services.laundry'),
      transportation: t('services.transportation'),
      tours: t('services.tourism'),
      spa: t('services.spa'),
      dining: t('services.dining'),
      entertainment: t('services.entertainment'),
      shopping: t('services.shopping'),
      fitness: t('services.fitness')
    };
    return categoryMap[categoryKey] || t('services.other');
  };

  const categoryTitle = category ? getCategoryTitle(category) : '';
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
        });        setServices(servicesResponse.data.data || []);
      } catch (error) {
        toast.error(t('errors.loadServices'));
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchCategoryServices();
    }
  }, [hotelId, category, t]);

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
    });  const handleServiceSelect = (service) => {
    if (category === 'laundry') {
      // Navigate to enhanced laundry booking interface
      navigate(`/hotels/${hotelId}/services/laundry/booking`, {
        state: { service, hotel }
      });
    } else if (category === 'transportation') {
      // Navigate to enhanced transportation booking interface
      navigate(`/hotels/${hotelId}/services/transportation/booking`, {
        state: { service, hotel }
      });
    } else if (category === 'dining' || category === 'restaurant') {
      // Navigate to enhanced restaurant booking interface
      navigate(`/hotels/${hotelId}/services/dining/booking`, {
        state: { service, hotel }
      });
    } else {
      // Navigate to regular service details page
      navigate(`/services/details/${service._id}`);
    }
  };

  const handleBackToCategories = () => {
    navigate(`/hotels/${hotelId}/categories`);
  };  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Hotel Services</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
              {t('common.loading')} {categoryTitle.toLowerCase() || t('hotel.hotelServices')}...
            </p>
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
    );
  }

  // If no category is specified, show the category selection component
  if (!category) {
    return <GuestCategorySelection />;
  }  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="w-full px-2 sm:px-3 lg:px-4 py-4 sm:py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center">
              <button
                onClick={handleBackToCategories}
                className={`${isRTL ? 'ml-2 sm:ml-4' : 'mr-2 sm:mr-4'} p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0`}
              >
                <FaArrowLeft className={`text-lg sm:text-xl ${isRTL ? 'transform rotate-180' : ''}`} />
              </button>
              <div className="flex items-center">
                <div className={`p-2 sm:p-3 bg-blue-100 text-blue-600 rounded-lg ${isRTL ? 'ml-2 sm:ml-4' : 'mr-2 sm:mr-4'} flex-shrink-0`}>
                  <IconComponent className="text-xl sm:text-2xl" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 truncate">
                    {categoryTitle} {t('navigation.services')}
                  </h1>
                  <p className="text-sm sm:text-base text-gray-600 mt-1 truncate">
                    {t('categories.availableAt')} {hotel?.name}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex sm:hidden items-center justify-between">
              <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                <p className="text-xs text-gray-500">{t('categories.totalServices')}</p>
                <p className="text-xl font-bold text-gray-900">
                  {filteredAndSortedServices.length}
                </p>
              </div>            </div>
            <div className="hidden sm:flex items-center space-x-4">
              <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                <p className="text-sm text-gray-500">{t('categories.totalServices')}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {filteredAndSortedServices.length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sorting */}
      <div className="w-full px-2 sm:px-3 lg:px-4 py-4 sm:py-6">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-wrap items-center justify-between gap-4">            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-500" />
                <span className="font-medium text-gray-700">{t('common.filter')}:</span>
              </div>

              {/* Price Filter */}
              <div>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('categories.allPrices')}</option>
                  <option value="budget">{t('categories.budget')}</option>
                  <option value="premium">{t('categories.premium')}</option>
                </select>
              </div>

              {/* Availability Filter */}
              <div>
                <select
                  value={availabilityFilter}
                  onChange={(e) => setAvailabilityFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">{t('categories.allServices')}</option>
                  <option value="available">{t('categories.availableNow')}</option>
                </select>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <FaSort className="text-gray-500" />
                <span className="font-medium text-gray-700">{t('categories.sortBy')}:</span>
              </div>

              <div>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="price_low">{t('categories.priceLowToHigh')}</option>
                  <option value="price_high">{t('categories.priceHighToLow')}</option>
                  <option value="rating">{t('categories.highestRated')}</option>
                  <option value="popularity">{t('categories.mostPopular')}</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Services Grid */}        {filteredAndSortedServices.length === 0 ? (
          <div className="text-center py-12">
            <IconComponent className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {t('categories.noServicesAvailable', { category: categoryTitle.toLowerCase() })}
            </h3>
            <p className="text-gray-600 mb-6">
              {t('categories.noServicesDescription', { category: categoryTitle.toLowerCase() })}
            </p>
            <button
              onClick={handleBackToCategories}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              {t('categories.browseOtherCategories')}
            </button>
          </div>
        ) : (          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredAndSortedServices.map((service) => (
              <div
                key={service._id}
                className="bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105"
                onClick={() => handleServiceSelect(service)}
              >
                {/* Service Image */}
                <div className="relative h-40 sm:h-48 bg-gray-200 rounded-t-lg overflow-hidden">
                  {service.images && service.images.length > 0 ? (
                    <img
                      src={service.images[0]}
                      alt={service.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <IconComponent className="text-3xl sm:text-4xl text-gray-400" />
                    </div>
                  )}
                  <div className="absolute top-2 right-2">
                    <span className="bg-white bg-opacity-90 text-gray-800 text-xs px-2 py-1 rounded-full">
                      {service.category}
                    </span>
                  </div>                  {service.performance?.totalBookings > 10 && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                        {t('categories.popular')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Service Details */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 line-clamp-1">
                    {service.name}
                  </h3>
                  <p className="text-gray-600 text-xs sm:text-sm mb-4 line-clamp-2">
                    {service.description}
                  </p>                  {/* Provider Info */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
                    <div className="flex items-center">
                      <span className="text-xs sm:text-sm text-gray-500">{t('categories.by')} </span>
                      <span className="text-xs sm:text-sm font-medium text-gray-700 truncate">
                        {service.providerId?.businessName}
                      </span>
                    </div>
                    {service.providerId?.rating && (
                      <div className="flex items-center">
                        <FaStar className="text-yellow-400 text-xs sm:text-sm mr-1" />
                        <span className="text-xs sm:text-sm text-gray-600">
                          {service.providerId.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>                  {/* Service Features */}
                  <div className="space-y-1 sm:space-y-2 mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-gray-600">
                      <FaClock className={`text-gray-400 ${isRTL ? 'ml-2' : 'mr-2'} text-xs`} />
                      <span>{t('categories.duration')}: {service.duration || t('categories.varies')}</span>
                    </div>
                    {service.location && (
                      <div className="flex items-center text-xs sm:text-sm text-gray-600">
                        <FaMapMarkerAlt className={`text-gray-400 ${isRTL ? 'ml-2' : 'mr-2'} text-xs`} />
                        <span className="truncate">{service.location}</span>
                      </div>
                    )}
                  </div>

                  {/* Pricing */}
                  <div className="border-t border-gray-100 pt-4">
                    <div className="flex items-center justify-between">                      <div>                        <div className="flex items-center">
                          <FaTag className={`text-green-500 ${isRTL ? 'ml-2' : 'mr-2'} text-sm`} />
                          <span className="text-lg sm:text-2xl font-bold text-green-600">
                            {formatPriceByLanguage(service.pricing?.finalPrice, i18n.language) || t('categories.notAvailable')}
                          </span>
                        </div>
                        {service.pricing?.basePrice && service.pricing?.finalPrice !== service.pricing?.basePrice && (
                          <div className="text-xs sm:text-sm text-gray-500">
                            {t('categories.base')}: {formatPriceByLanguage(service.pricing.basePrice, i18n.language)}
                          </div>
                        )}
                      </div>
                      <button className="bg-blue-500 hover:bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium transition-colors text-xs sm:text-sm">
                        {category === 'laundry' ? t('categories.selectItems') : t('categories.bookNow')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}        {/* Category-specific info */}
        {category === 'laundry' && filteredAndSortedServices.length > 0 && (
          <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🧺 {t('categories.enhancedLaundryExperience')}
            </h3>
            <p className="text-blue-700">
              {t('categories.laundryExperienceDescription')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelCategoryServicesPage;
