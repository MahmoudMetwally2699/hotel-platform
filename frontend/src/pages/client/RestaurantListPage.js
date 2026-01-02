/**
 * Restaurant List Page
 * Displays a grid of restaurants for guests to select before viewing the menu
 * Modern design with search functionality
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaSearch,
  FaUtensils,
  FaArrowLeft,
  FaSpinner,
  FaStar,
  FaClock
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import useRTL from '../../hooks/useRTL';

const RestaurantListPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isRTL} = useRTL();

  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        setLoading(true);

        // Fetch hotel details
        const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
        setHotel(hotelResponse.data.data);

        // Fetch dining services
        const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/dining/items`);
        const responseData = servicesResponse.data.data;
        const restaurantServices = responseData?.services || [];

        // Group services by providerId to show one card per restaurant
        const providerMap = new Map();

          restaurantServices.forEach(service => {
          const providerData = typeof service.providerId === 'object' ? service.providerId : null;
          const providerId = providerData?._id || service.providerId || 'unknown';
          const restaurantInfo = providerData?.restaurant;

          console.log('📦 Processing service:', {
            serviceName: service.name,
            providerId: providerId,
            hasRestaurantInfo: !!restaurantInfo,
            restaurantName: restaurantInfo?.name
          });

          if (!providerMap.has(providerId)) {
            providerMap.set(providerId, {
              providerId: providerId,
              // Prioritize provider restaurant name, then service name, then business name
              providerName: restaurantInfo?.name || service.name || providerData?.businessName,
              providerDescription: restaurantInfo?.description || service.description || '',
              providerRating: providerData?.rating || 0,
              providerContactEmail: providerData?.contactEmail,
              providerContactPhone: providerData?.contactPhone,
              services: [],
              allMenuItems: [],
              // Use restaurant image if available
              images: restaurantInfo?.image ? [restaurantInfo.image] : [],
              // Prioritize restaurant schedule
              availabilitySchedule: restaurantInfo?.schedule || service.availability?.schedule || null
            });
          } else {
            // Update provider info from subsequent services ONLY if we don't have provider-level info
            const provider = providerMap.get(providerId);

            // Only fall back to service-level updates if we don't have explicit restaurant info
            if (!restaurantInfo?.name) {
              if (service.name && service.name !== provider.providerName) {
                provider.providerName = service.name;
                // Reset images when the restaurant name changes (if relying on service data)
                if (!restaurantInfo?.image) {
                  provider.images = [];
                }
                // Update availability schedule when name changes (if relying on service data)
                if (!restaurantInfo?.schedule && service.availability?.schedule) {
                  provider.availabilitySchedule = service.availability.schedule;
                }
              }
            }

            if (!restaurantInfo?.description && service.description && service.description !== provider.providerDescription) {
              provider.providerDescription = service.description;
            }
          }

          const provider = providerMap.get(providerId);
          provider.services.push(service);

          // Collect all menu items from this service
          if (service.menuItems?.length > 0) {
            provider.allMenuItems.push(...service.menuItems);
          }

          // Collect images from service only if we don't have a specific restaurant image
          // OR if we want to show a gallery (but currently card shows first image)
          if (!restaurantInfo?.image) {
            if (service.images?.length > 0) {
              provider.images.push(...service.images);
            } else if (service.media?.images?.length > 0) {
              provider.images.push(...service.media.images);
            }
          }
        });

        // Convert map to array
        const restaurantProviders = Array.from(providerMap.values());
        console.log('🔍 ALL Restaurant providers (including mahmoud):', restaurantProviders.map(p => ({
          name: p.providerName,
          providerId: p.providerId,
          images: p.images,
          servicesCount: p.services?.length,
          menuItemsWithImages: p.allMenuItems?.filter(i => i.imageUrl)?.length || 0
        })));
        console.log('Restaurant providers with images:', restaurantProviders.map(p => ({
          name: p.providerName,
          images: p.images,
          menuItemsWithImages: p.allMenuItems?.filter(i => i.imageUrl)?.length || 0
        })));
        setRestaurants(restaurantProviders);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
        toast.error(t('errors.loadServices'));
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [hotelId, t]);

  // Filter restaurants by search query
  const filteredRestaurants = restaurants.filter(restaurant => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return true;

    const name = (restaurant.providerName || '').toLowerCase();
    return name.includes(query);
  });

  // Get restaurant display image
  const getRestaurantImage = (restaurant) => {
    // Check collected images first
    if (restaurant.images?.length > 0) {
      return restaurant.images[0];
    }
    // Check for menu item images as fallback
    if (restaurant.allMenuItems?.length > 0) {
      const itemWithImage = restaurant.allMenuItems.find(item => item.imageUrl);
      if (itemWithImage) return itemWithImage.imageUrl;
    }
    // Default placeholder
    return null;
  };

  // Get cuisine/category tags from all menu items
  const getRestaurantCategories = (restaurant) => {
    const categories = new Set();

    if (restaurant.allMenuItems?.length > 0) {
      restaurant.allMenuItems.forEach(item => {
        if (item.category) categories.add(item.category);
      });
    }

    return Array.from(categories).slice(0, 3);
  };

  // Get hotel branding colors with fallback defaults
  const getHotelColors = () => {
    const primaryColor = hotel?.branding?.primaryColor || '#3B5787';
    const secondaryColor = hotel?.branding?.secondaryColor || '#67BAE0';
    return { primaryColor, secondaryColor };
  };

  const { primaryColor, secondaryColor } = getHotelColors();

  // Check if restaurant is currently open based on working hours
  const isRestaurantOpen = (restaurant) => {
    const schedule = restaurant.availabilitySchedule;
    if (!schedule) return true; // No schedule means always open

    const now = new Date();
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const currentDay = days[now.getDay()];
    const daySchedule = schedule[currentDay];

    if (!daySchedule || !daySchedule.isAvailable) {
      return false; // Day is off
    }

    console.log('🕐 Checking restaurant hours:', {
      restaurant: restaurant.providerName,
      currentDay,
      daySchedule,
      currentTime: `${now.getHours()}:${now.getMinutes()}`
    });

    // Check time slots
    const timeSlots = daySchedule.timeSlots || [];

    // If no timeSlots array, check if startTime/endTime are directly on daySchedule
    if (timeSlots.length === 0 && daySchedule.startTime && daySchedule.endTime) {
      const currentTime = now.getHours() * 60 + now.getMinutes();
      const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
      const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;

      console.log('⏰ Direct time check:', {
        currentTime,
        startMinutes,
        endMinutes,
        isOpen: currentTime >= startMinutes && currentTime <= endMinutes
      });

      return currentTime >= startMinutes && currentTime <= endMinutes;
    }

    // If no time slots but day is available, treat as open all day
    // This handles the case where working hours aren't properly saved
    if (timeSlots.length === 0 && daySchedule.isAvailable) {
      console.log('✅ No time slots but day is available - treating as open all day');
      return true;
    }

    if (timeSlots.length === 0) return false; // No time slots and not available = closed

    const currentTime = now.getHours() * 60 + now.getMinutes();

    return timeSlots.some(slot => {
      const [startHour, startMin] = (slot.startTime || '00:00').split(':').map(Number);
      const [endHour, endMin] = (slot.endTime || '23:59').split(':').map(Number);
      const startMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      return currentTime >= startMinutes && currentTime <= endMinutes;
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6 mt-4">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">{t('services.dining')}</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('guest.restaurant.loadingRestaurants') || 'Loading restaurants...'}</p>
          </div>
        </div>
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="relative">
        <div className="w-full px-3 sm:px-4 lg:px-6 pt-4 pb-6">
          {/* Back Button */}
          <button
            onClick={() => navigate(`/hotels/${hotelId}/categories`)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mb-4"
            style={{ '--hover-color': primaryColor }}
            onMouseEnter={(e) => e.target.style.color = primaryColor}
            onMouseLeave={(e) => e.target.style.color = '#4B5563'}
          >
            <FaArrowLeft className={`${isRTL ? 'ml-2 rotate-180' : 'mr-2'} text-xs`} />
            <span>{t('common.back')}</span>
          </button>

          {/* Hero Card */}
          <div
            className="rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(to right, ${primaryColor}, ${secondaryColor})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full"></div>

            <div className="relative flex items-center gap-4">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl">
                <FaUtensils className="text-3xl sm:text-4xl text-white" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1">
                  {t('guest.restaurant.allRestaurants') || 'All Restaurants'}
                </h1>
                <p className="text-white/80 text-sm sm:text-base">
                  {hotel?.name} • {filteredRestaurants.length} {t('guest.restaurant.restaurantsAvailable') || 'restaurants available'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="w-full px-3 sm:px-4 lg:px-6 mb-6">
        <div className="relative max-w-xl mx-auto">
          <FaSearch className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-1/2 -translate-y-1/2 text-gray-400`} />
          <input
            type="text"
            placeholder={t('guest.restaurant.searchRestaurants') || 'Search restaurants...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} py-4 rounded-2xl border border-gray-200 bg-white shadow-lg focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-base transition-all duration-200`}
          />
        </div>
      </div>

      {/* Restaurant Grid */}
      <div className="w-full px-3 sm:px-4 lg:px-6 pb-8">
        {filteredRestaurants.length === 0 ? (
          <div className="text-center py-16">
            <FaUtensils className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery
                ? (t('guest.restaurant.noRestaurantsFound') || 'No restaurants found')
                : (t('guest.restaurant.noRestaurantsAvailable') || 'No restaurants available')
              }
            </h3>
            <p className="text-gray-500">
              {searchQuery
                ? (t('guest.restaurant.tryDifferentSearch') || 'Try a different search term')
                : (t('guest.restaurant.checkBackLater') || 'Please check back later')
              }
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {filteredRestaurants.map((restaurant) => {
              const image = getRestaurantImage(restaurant);
              const categories = getRestaurantCategories(restaurant);
              const menuItemCount = restaurant.allMenuItems?.length || 0;
              const serviceCount = restaurant.services?.length || 0;
              const isOpen = isRestaurantOpen(restaurant);

              return (
                <div
                  key={restaurant.providerId}
                  onClick={() => {
                    if (!isOpen) {
                      toast.info(t('guest.restaurant.restaurantClosed') || 'This restaurant is currently closed');
                      return;
                    }
                    navigate(`/hotels/${hotelId}/services/dining/provider/${restaurant.providerId}/menu`);
                  }}
                  className={`group bg-white rounded-2xl shadow-md hover:shadow-xl border border-gray-100 overflow-hidden cursor-pointer transition-all duration-300 ${isOpen ? 'hover:-translate-y-1' : 'opacity-60 grayscale'}`}
                >
                  {/* Restaurant Image */}
                  <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
                    {image ? (
                      <img
                        src={image}
                        alt={restaurant.providerName}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                    ) : null}
                    <div
                      className={`absolute inset-0 ${image ? 'hidden' : 'flex'} items-center justify-center`}
                      style={{ background: `linear-gradient(to bottom right, ${primaryColor}33, ${secondaryColor}33)` }}
                    >
                      <FaUtensils className="text-4xl sm:text-5xl" style={{ color: `${primaryColor}66` }} />
                    </div>

                    {/* Menu item count badge */}
                    {menuItemCount > 0 && isOpen && (
                      <div className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg text-xs font-semibold" style={{ color: primaryColor }}>
                        {menuItemCount} {t('guest.restaurant.items') || 'items'}
                      </div>
                    )}

                    {/* Closed overlay */}
                    {!isOpen && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <div className="bg-red-500 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg flex items-center gap-2">
                          <FaClock className="text-xs" />
                          {t('guest.restaurant.closed') || 'Closed'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Restaurant Info */}
                  <div className="p-3 sm:p-4">
                    <h3
                      className="font-bold text-gray-900 text-sm sm:text-base mb-1 line-clamp-1 transition-colors"
                      style={{ '--hover-color': primaryColor }}
                    >
                      {restaurant.providerName}
                    </h3>

                    {/* Description */}
                    {restaurant.providerDescription && (
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                        {restaurant.providerDescription}
                      </p>
                    )}

                    {/* Categories */}
                    {categories.length > 0 && (
                      <p className="text-xs sm:text-sm text-gray-500 line-clamp-1 capitalize">
                        {categories.join(', ')}
                      </p>
                    )}

                    {/* Rating if available */}
                    {restaurant.providerRating > 0 && (
                      <div className="flex items-center gap-1 mt-2">
                        <FaStar className="text-yellow-400 text-xs" />
                        <span className="text-xs font-medium text-gray-600">
                          {restaurant.providerRating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default RestaurantListPage;
