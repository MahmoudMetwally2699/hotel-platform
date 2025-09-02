/**
 * Guest Service Category Selection Dashboard
 *
 * A visual category selection interface for guests to choose service categories
 * before browsing specific services. Similar to the service provider's
 * CategorySelectionDashboard but optimized for guest experience.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
  FaBroom,
  FaSpinner,
  FaArrowRight,
  FaStar,
  FaHeart,
  FaMapMarkerAlt,
  FaClock
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import useRTL from '../../hooks/useRTL';

const categoryIcons = {
  laundry: FaTshirt,
  transportation: FaCar,
  tours: FaMapMarkedAlt,
  spa: FaSpa,
  dining: FaUtensils,
  entertainment: FaMusic,
  shopping: FaShoppingBag,
  fitness: FaDumbbell,
  housekeeping: FaBroom
};

const GuestCategorySelection = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const { hotelId } = useParams();

  const [categories, setCategories] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get localized category descriptions
    const getCategoryDescriptions = () => ({
      laundry: {
        title: t('services.laundry'),
        description: t('homepage.laundryDescription'),
        features: [t('guestCategories.expressService'), t('guestCategories.premiumCare'), t('guestCategories.roomPickup')],
        estimatedTime: t('guestCategories.laundryTime'),
        color: 'bg-blue-500'
      },
      transportation: {
        title: t('services.transportation'),
        description: t('homepage.transportationDescription'),
        features: [t('guestCategories.variousVehicles'), t('guestCategories.professionalDrivers'), t('guestCategories.cityTours')],
        estimatedTime: t('guestCategories.onDemand'),
        color: 'bg-green-500'
      },
      tours: {
        title: t('services.tourism'),
        description: t('homepage.tourismDescription'),
        features: [t('guestCategories.localExpertise'), t('guestCategories.groupPrivateTours'), t('guestCategories.culturalExperiences')],
        estimatedTime: t('guestCategories.toursTime'),
        color: 'bg-purple-500'
      },
      spa: {
        title: t('services.spa'),
        description: t('guestCategories.spaDescription'),
        features: [t('guestCategories.professionalTherapists'), t('guestCategories.premiumProducts'), t('guestCategories.inRoomService')],
        estimatedTime: t('guestCategories.spaTime'),
        color: 'bg-pink-500'
      },
      dining: {
        title: t('services.dining'),
        description: t('guestCategories.diningDescription'),
        features: [t('guestCategories.multipleCuisines'), t('guestCategories.freshIngredients'), t('guestCategories.quickDelivery')],
        estimatedTime: t('guestCategories.diningTime'),
        color: 'bg-orange-500'
      },
      entertainment: {
        title: t('services.entertainment'),
        description: t('guestCategories.entertainmentDescription'),
        features: [t('guestCategories.professionalArtists'), t('guestCategories.customPlaylists'), t('guestCategories.eventPlanning')],
        estimatedTime: t('guestCategories.entertainmentTime'),
        color: 'bg-red-500'
      },
      shopping: {
        title: t('services.shopping'),
        description: t('guestCategories.shoppingDescription'),
        features: [t('guestCategories.localShopping'), t('guestCategories.giftSelection'), t('guestCategories.sameDayDelivery')],
        estimatedTime: t('guestCategories.shoppingTime'),
        color: 'bg-yellow-500'
      },
      fitness: {
        title: t('services.fitness'),
        description: t('guestCategories.fitnessDescription'),
        features: [t('guestCategories.certifiedTrainers'), t('guestCategories.equipmentProvided'), t('guestCategories.flexibleSchedules')],
        estimatedTime: t('guestCategories.fitnessTime'),
        color: 'bg-indigo-500'
      },
      housekeeping: {
        title: t('services.housekeeping'),
        description: t('guestCategories.housekeepingDescription'),
        features: [t('guestCategories.extraCleaning'), t('guestCategories.freshLinens'), t('guestCategories.amenityRestocking')],
        estimatedTime: t('guestCategories.available24_7'),
        color: 'bg-teal-500'
      }
    });

    const fetchHotelAndCategories = async () => {
      try {
        setLoading(true);

        // Fetch hotel details
        const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
        setHotel(hotelResponse.data.data);

        // Fetch available services to determine which categories are available
        const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services`, {
          params: { limit: 100 } // Get all services to determine categories
        });

        // Group services by category and count them
        const serviceCounts = {};
        servicesResponse.data.data.forEach(service => {
          if (!serviceCounts[service.category]) {
            serviceCounts[service.category] = 0;
          }
          serviceCounts[service.category]++;
        });

        // Always include housekeeping services (they're stored separately)
        serviceCounts['housekeeping'] = 1; // Always show housekeeping

        // Get localized category descriptions
        const categoryDescriptions = getCategoryDescriptions();

        // Create category list with service counts
        const availableCategories = Object.keys(serviceCounts)
          .filter(categoryKey => categoryDescriptions[categoryKey]) // Only include categories with descriptions
          .map(categoryKey => ({
            key: categoryKey,
            serviceCount: serviceCounts[categoryKey],
            ...categoryDescriptions[categoryKey]
          }));

        setCategories(availableCategories);

      } catch (error) {
        console.error('Error fetching hotel and categories:', error);
        toast.error(t('errors.loadServices'));
      } finally {
        setLoading(false);
      }
    };

    if (hotelId) {
      fetchHotelAndCategories();
    }
  }, [hotelId, t]);

  /**
   * Handle category selection - updated routing for better UX
   */
  const handleCategorySelect = (categoryKey) => {
    if (categoryKey === 'laundry') {
      // Navigate directly to laundry booking for better UX
      navigate(`/hotels/${hotelId}/services/laundry/booking`);
    } else if (categoryKey === 'transportation') {
      // Navigate directly to transportation booking for better UX
      navigate(`/hotels/${hotelId}/services/transportation/booking`);
    } else if (categoryKey === 'housekeeping') {
      // Navigate directly to housekeeping booking for better UX
      navigate(`/hotels/${hotelId}/services/housekeeping/booking`);
    } else if (categoryKey === 'dining') {
      // Navigate directly to restaurant booking for better UX
      navigate(`/hotels/${hotelId}/services/dining/booking`);
    } else {
      // Navigate to category-specific service list page for other categories
      navigate(`/hotels/${hotelId}/services/${categoryKey}`);
    }
  };
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')} {t('navigation.services').toLowerCase()}...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Modern Header with Hotel Branding */}
      <div className="bg-white shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Hotel Logo and Branding Section */}
          <div className="text-center mb-8">
            {/* Hotel Logo */}
            {hotel?.images?.logo ? (
              <div className="flex justify-center mb-6">
                <div className="bg-white rounded-3xl shadow-xl p-4 border border-gray-200 hover:shadow-2xl transition-shadow duration-300 inline-flex">
                  <img
                    src={hotel.images.logo}
                    alt={`${hotel.name} Logo`}
                    className="h-24 w-auto sm:h-32 sm:w-auto lg:h-40 lg:w-auto max-w-xs object-contain"
                  />
                </div>
              </div>
            ) : (
              <div className="flex justify-center mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-3xl shadow-xl p-6 border border-gray-200 hover:shadow-2xl transition-shadow duration-300">
                  <div className="h-24 w-24 sm:h-32 sm:w-32 lg:h-40 lg:w-40 flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white">
                      {hotel?.name?.charAt(0) || 'H'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Hotel Name */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-4 tracking-tight">
              {hotel?.name || 'Hotel Services'}
            </h1>

            {/* Star Rating */}
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={`text-xl sm:text-2xl mx-1 ${star <= (hotel?.starRating || 4) ? 'text-yellow-400' : 'text-gray-300'}`}
                />
              ))}
              <span className="ml-3 text-lg font-medium text-blue-600">
                {hotel?.category === 'luxury' ? 'Luxury Hotel' :
                 hotel?.category === 'resort' ? 'Resort Hotel' :
                 hotel?.category === 'boutique' ? 'Boutique Hotel' :
                 hotel?.category === 'mid-range' ? 'Mid-Range Hotel' :
                 'Budget Hotel'}
              </span>
            </div>

            {/* Welcome Message */}
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl sm:text-3xl font-semibold text-blue-600 mb-4">
                {t('guestCategories.welcomeToServices')}
              </h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-6">
                {t('guestCategories.welcomeDescription')}
              </p>

              {/* Location and Services Info */}
              <div className="flex flex-col sm:flex-row items-center justify-center space-y-3 sm:space-y-0 sm:space-x-8 text-gray-600">
                <div className="flex items-center">
                  <FaMapMarkerAlt className="text-red-500 mr-2" />
                  <span className="font-medium">
                    {hotel?.address?.city && hotel?.address?.country
                      ? `${hotel.address.city}, ${hotel.address.country}`
                      : t('guestCategories.premiumLocation')
                    }
                  </span>
                </div>
                <div className="flex items-center">
                  <FaHeart className="text-red-500 mr-2" />
                  <span className="font-medium">{t('guestCategories.premiumServicesAvailable')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Categories Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {categories.length === 0 ? (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                {t('guestCategories.noServicesAvailable')}
              </h3>
              <p className="text-gray-600">
                {t('guestCategories.noActiveServices')}
              </p>
            </div>
          </div>
        ) : (
          <>
            {/* Section Header */}
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {t('guestCategories.availableServiceCategories')}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {t('guestCategories.selectCategoryToBrowse')}
              </p>
            </div>

            {/* Modern Categories Grid - Redesigned Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.key] || FaShoppingBag;

                return (
                  <div
                    key={category.key}
                    className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 border border-gray-100 overflow-hidden"
                    onClick={() => handleCategorySelect(category.key)}
                  >
                    {/* Icon and Service Count Header */}
                    <div className="p-6 text-center border-b border-gray-50">
                      <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${category.color} group-hover:scale-110 transition-transform duration-300`}>
                        <IconComponent className="text-2xl text-white" />
                      </div>
                      <div className="text-xs text-gray-500 bg-gray-50 px-3 py-1 rounded-full inline-block">
                        {category.serviceCount} {category.serviceCount === 1 ? t('services.singleService') : t('services.multipleServices')}
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6">
                      {/* Title */}
                      <h3 className="text-xl font-bold text-gray-900 mb-3 text-center group-hover:text-blue-600 transition-colors duration-200">
                        {category.title || 'Service Category'}
                      </h3>

                      {/* Description */}
                      <p className="text-gray-600 text-sm text-center mb-4 line-clamp-2">
                        {category.description || 'Professional service available for your comfort'}
                      </p>

                      {/* Estimated Time */}
                      <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
                        <FaClock className="mr-2 text-blue-500" />
                        <span>{category.estimatedTime || 'Available'}</span>
                      </div>

                      {/* Features - Show only 2 for cleaner look */}
                      <div className="space-y-2 mb-6">
                        {(category.features || ['Professional Service', 'Quality Guaranteed']).slice(0, 2).map((feature, index) => (
                          <div key={index} className="flex items-center text-xs text-gray-600">
                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-2 flex-shrink-0"></div>
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>

                      {/* Action Button */}
                      <button className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white font-semibold py-3 px-4 rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all duration-200 flex items-center justify-center group-hover:shadow-lg">
                        <span>{t('guestCategories.browseServices') || 'Browse Services'}</span>
                        <FaArrowRight className={`${isRTL ? 'mr-2 rotate-180' : 'ml-2'} text-sm group-hover:translate-x-1 transition-transform duration-200`} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Call-to-Action */}
            <div className="mt-16 text-center">
              <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 text-white">
                <h3 className="text-2xl font-bold mb-4">
                  🌟 {t('guestCategories.mostPopularServices')}
                </h3>
                <p className="text-lg opacity-90 max-w-2xl mx-auto">
                  {t('guestCategories.popularServicesNote')}
                </p>
                <div className="mt-6">
                  <button className="bg-white text-blue-600 font-semibold py-3 px-8 rounded-full hover:bg-gray-100 transition-colors duration-200 shadow-lg">
                    Explore All Services
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestCategorySelection;
