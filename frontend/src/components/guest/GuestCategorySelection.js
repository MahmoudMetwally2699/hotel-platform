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
  FaSpinner,
  FaArrowRight,
  FaStar,
  FaHeart
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
  fitness: FaDumbbell
};

const GuestCategorySelection = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const { hotelId } = useParams();

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
    }
  });  const [categories, setCategories] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [hoveredCategory, setHoveredCategory] = useState(null);
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

        // Get localized category descriptions
        const categoryDescriptions = getCategoryDescriptions();

        // Create category list with service counts
        const availableCategories = Object.keys(serviceCounts).map(categoryKey => ({
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
    }  }, [hotelId, t]); // Remove categoryDescriptions from dependencies

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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {hotel?.name} {t('navigation.services')}
              </h1>
              <p className="text-gray-600 mt-2">
                {t('guestCategories.chooseFromCategories')}
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className={`${isRTL ? 'text-left' : 'text-right'}`}>
                <p className="text-sm text-gray-500">{t('guestCategories.hotelRating')}</p>
                <div className="flex items-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <FaStar
                      key={star}
                      className={`text-sm ${star <= (hotel?.rating || 4) ? 'text-yellow-400' : 'text-gray-300'}`}
                    />
                  ))}
                  <span className={`${isRTL ? 'mr-2' : 'ml-2'} text-sm text-gray-600`}>
                    ({hotel?.rating || 4.0})
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <FaShoppingBag className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {t('guestCategories.noServicesAvailable')}
            </h3>
            <p className="text-gray-600">
              {t('guestCategories.noActiveServices')}
            </p>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {t('guestCategories.availableServiceCategories')}
              </h2>
              <p className="text-gray-600">
                {t('guestCategories.selectCategoryToBrowse')}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.key] || FaShoppingBag;

                return (
                  <div
                    key={category.key}
                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                      hoveredCategory === category.key ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onMouseEnter={() => setHoveredCategory(category.key)}
                    onMouseLeave={() => setHoveredCategory(null)}
                    onClick={() => handleCategorySelect(category.key)}
                  >
                    {/* Category Header */}
                    <div className={`${category.color} text-white p-6 rounded-t-lg`}>
                      <div className="flex items-center justify-between">
                        <IconComponent className="text-3xl" />                        <span className="bg-white bg-opacity-20 text-xs px-2 py-1 rounded-full">
                          {category.serviceCount} {category.serviceCount === 1 ? t('services.singleService') : t('services.multipleServices')}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mt-4 mb-2">
                        {category.title}
                      </h3>
                      <p className="text-sm opacity-90">
                        {category.description}
                      </p>
                    </div>

                    {/* Category Details */}
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <FaHeart className="text-red-400 mr-2" />
                          <span>{category.estimatedTime}</span>
                        </div>

                        <div className="space-y-2">
                          {category.features.slice(0, 3).map((feature, index) => (
                            <div key={index} className="flex items-center text-sm text-gray-600">
                              <div className="w-2 h-2 bg-green-400 rounded-full mr-3"></div>
                              <span>{feature}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Action Button */}                      <div className="mt-6 pt-4 border-t border-gray-100">
                        <button className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700 font-medium transition-colors">
                          <span>{t('guestCategories.browseServices')}</span>
                          <FaArrowRight className={`${isRTL ? 'mr-2' : 'ml-2'} ${isRTL ? 'transform rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Popular Categories Note */}
            <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                🌟 {t('guestCategories.mostPopularServices')}
              </h3>
              <p className="text-blue-700">
                {t('guestCategories.popularServicesNote')}
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default GuestCategorySelection;
