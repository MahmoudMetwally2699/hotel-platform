/**
 * Guest Service Category Selection Dashboard (Redesigned UI Only)
 * - Logic, fetching, and navigation untouched
 * - Tailwind-only visual overhaul: mobile-first, premium, accessible
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
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
  FaArrowRight,
  FaStar,
  FaMapMarkerAlt,
  FaClock,
  FaUser,
  FaConciergeBell
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { selectCurrentUser } from '../../redux/slices/authSlice';

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

// Service category images (you can replace these with actual service images)
const categoryImages = {
  laundry: 'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=400&h=300&fit=crop&crop=center',
  transportation: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=400&h=300&fit=crop&crop=center',
  tours: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop&crop=center',
  spa: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=400&h=300&fit=crop&crop=center',
  dining: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center',
  entertainment: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400&h=300&fit=crop&crop=center',
  shopping: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop&crop=center',
  fitness: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop&crop=center',
  housekeeping: '/housekeeping-header.jpg'
};

const GuestCategorySelection = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { hotelId } = useParams();
  const currentUser = useSelector(selectCurrentUser);

  const [categories, setCategories] = useState([]);
  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAccess, setShowQuickAccess] = useState(false);

  useEffect(() => {
    // Get localized category descriptions (unchanged)
    const getCategoryDescriptions = () => ({
      laundry: {
        title: t('services.laundry'),
        description: t('homepage.laundryDescription'),
        features: [t('guestCategories.expressService'), t('guestCategories.premiumCare'), t('guestCategories.roomPickup')],
        estimatedTime: t('guestCategories.laundryTime')
      },
      transportation: {
        title: t('services.transportation'),
        description: t('homepage.transportationDescription'),
        features: [t('guestCategories.variousVehicles'), t('guestCategories.professionalDrivers'), t('guestCategories.cityTours')],
        estimatedTime: t('guestCategories.onDemand')
      },
      tours: {
        title: t('services.tourism'),
        description: t('homepage.tourismDescription'),
        features: [t('guestCategories.localExpertise'), t('guestCategories.groupPrivateTours'), t('guestCategories.culturalExperiences')],
        estimatedTime: t('guestCategories.toursTime')
      },
      spa: {
        title: t('services.spa'),
        description: t('guestCategories.spaDescription'),
        features: [t('guestCategories.professionalTherapists'), t('guestCategories.premiumProducts'), t('guestCategories.inRoomService')],
        estimatedTime: t('guestCategories.spaTime')
      },
      dining: {
        title: t('services.dining'),
        description: t('guestCategories.diningDescription'),
        features: [t('guestCategories.multipleCuisines'), t('guestCategories.freshIngredients'), t('guestCategories.quickDelivery')],
        estimatedTime: t('guestCategories.diningTime')
      },
      entertainment: {
        title: t('services.entertainment'),
        description: t('guestCategories.entertainmentDescription'),
        features: [t('guestCategories.professionalArtists'), t('guestCategories.customPlaylists'), t('guestCategories.eventPlanning')],
        estimatedTime: t('guestCategories.entertainmentTime')
      },
      shopping: {
        title: t('services.shopping'),
        description: t('guestCategories.shoppingDescription'),
        features: [t('guestCategories.localShopping'), t('guestCategories.giftSelection'), t('guestCategories.sameDayDelivery')],
        estimatedTime: t('guestCategories.shoppingTime')
      },
      fitness: {
        title: t('services.fitness'),
        description: t('guestCategories.fitnessDescription'),
        features: [t('guestCategories.certifiedTrainers'), t('guestCategories.equipmentProvided'), t('guestCategories.flexibleSchedules')],
        estimatedTime: t('guestCategories.fitnessTime')
      },
      housekeeping: {
        title: t('services.housekeeping'),
        description: t('guestCategories.housekeepingDescription'),
        features: [t('guestCategories.extraCleaning'), t('guestCategories.freshLinens'), t('guestCategories.amenityRestocking')],
        estimatedTime: t('guestCategories.available24_7')
      }
    });

    const fetchHotelAndCategories = async () => {
      try {
        setLoading(true);

        // Fetch hotel details
        const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
        setHotel(hotelResponse.data.data);

        // Fetch ALL services including housekeeping from Service collection
        const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services`, {
          params: { limit: 100 }
        });

        const serviceCounts = {};
        servicesResponse.data.data.forEach(service => {
          if (!serviceCounts[service.category]) {
            serviceCounts[service.category] = 0;
          }
          serviceCounts[service.category]++;
        });

        // No need for separate housekeeping API call since it's included above
        console.log('Service counts from Service collection:', serviceCounts);

        const categoryDescriptions = getCategoryDescriptions();

        const availableCategories = Object.keys(serviceCounts)
          .filter(categoryKey => categoryDescriptions[categoryKey])
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

  // Navigation logic (unchanged)
  const handleCategorySelect = (categoryKey) => {
    if (categoryKey === 'laundry') {
      navigate(`/hotels/${hotelId}/services/laundry/booking`);
    } else if (categoryKey === 'transportation') {
      navigate(`/hotels/${hotelId}/services/transportation/booking`);
    } else if (categoryKey === 'housekeeping') {
      navigate(`/hotels/${hotelId}/services/housekeeping/booking`);
    } else if (categoryKey === 'dining') {
      navigate(`/hotels/${hotelId}/services/dining/booking`);
    } else {
      navigate(`/hotels/${hotelId}/services/${categoryKey}`);
    }
  };

  // ===== UI STARTS HERE =====

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-6">
          {/* Skeleton header */}
          <div className="h-28 rounded-2xl bg-white shadow-sm border border-gray-100 overflow-hidden relative">
            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
          </div>
          {/* Skeleton cards */}
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 rounded-xl bg-white shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100" />
              </div>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500">{t('common.loading')} {t('navigation.services').toLowerCase()}…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Add custom CSS for animations */}
      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.2s ease-out;
        }
      `}</style>

      {/* Header with Centered Hotel Info */}
      <header className="bg-white border-b border-gray-100">
        <div className="w-full px-2 sm:px-3 lg:px-4 py-4">
          {/* Centered Hotel Information */}
          <div className="text-center">
            {/* Hotel Logo */}
            <div className="flex justify-center mb-3">
              {hotel?.images?.logo ? (
                <img
                  src={hotel.images.logo}
                  alt={`${hotel?.name || 'Hotel'} Logo`}
                  className="h-20 w-auto sm:h-16 object-contain rounded-md"
                />
              ) : (
                <div className="h-20 w-20 sm:h-16 sm:w-16 rounded-md bg-gradient-to-br from-[#3B5787] to-[#61B6DE] grid place-items-center">
                  <span className="text-white font-bold text-xl sm:text-lg">{hotel?.name?.charAt(0) || 'H'}</span>
                </div>
              )}
            </div>

            {/* Hotel Name */}
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
              {hotel?.name || t('guest.common.hotelServices')}
            </h1>

            {/* Rating - Only filled stars */}
            <div className="flex justify-center items-center gap-1 mb-2">
              {Array.from({ length: hotel?.starRating || 4 }, (_, index) => (
                <FaStar key={index} className="text-[#61B6DE] text-sm" />
              ))}
              <span className="ml-2 text-sm text-gray-600 font-medium">
                {hotel?.starRating || 4} {hotel?.starRating === 1 ? t('guest.common.star') : t('guest.common.stars')}
              </span>
            </div>

            {/* Location */}
            <div className="flex justify-center items-center gap-2 text-sm text-gray-600">
              <FaMapMarkerAlt className="text-[#61B6DE]" />
              <span>
                {hotel?.address?.city && hotel?.address?.country
                  ? `${hotel.address.city}, ${hotel.address.country}`
                  : t('guestCategories.premiumLocation')}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Modern User Greeting Section */}
      <section className="bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white">
        <div className="w-full px-2 sm:px-3 lg:px-4 py-4 sm:py-8">
          <div className="text-center">
            {/* User Greeting Card */}
            <div className="inline-block">
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                  <div className="h-8 w-8 sm:h-10 sm:w-10 bg-white/20 rounded-full flex items-center justify-center">
                    <FaUser className="text-white text-sm sm:text-lg" />
                  </div>
                  <div className="text-left">
                    <h2 className="text-lg sm:text-xl font-bold">
                      {t('guest.common.hello')}, {currentUser?.firstName || currentUser?.name || t('guest.common.guest')}!
                    </h2>
                    <p className="text-white/80 text-xs sm:text-sm">
                      {t('guest.common.welcomeToPremiumServices')}
                    </p>
                  </div>
                </div>
                <p className="text-white/90 text-xs sm:text-sm max-w-md">
                  {t('guest.common.discoverAndBook')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <main className="w-full px-2 sm:px-3 lg:px-4 py-10 sm:py-14">
        {categories.length === 0 ? (
          <div className="max-w-md mx-auto">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-8 text-center">
              <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-gray-50 grid place-items-center">
                <FaShoppingBag className="text-2xl text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">{t('guestCategories.noServicesAvailable')}</h3>
              <p className="mt-2 text-gray-600">{t('guestCategories.noActiveServices')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="text-center mb-8 sm:mb-12">
              <h3 className="text-2xl sm:text-3xl font-bold text-gray-900">
                {t('guestCategories.availableServiceCategories')}
              </h3>
              <p className="mt-2 text-gray-600">{t('guestCategories.selectCategoryToBrowse')}</p>
            </div>

            {/* Full-width service cards with images */}
            <div className="space-y-4">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.key] || FaShoppingBag;
                const categoryImage = categoryImages[category.key] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center';

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => handleCategorySelect(category.key)}
                    className="group relative w-full text-left rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg focus:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#61B6DE] focus-visible:ring-offset-2 overflow-hidden"
                    aria-label={`${category.title} (${category.serviceCount})`}
                  >
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-gradient-to-r from-[#3B5787]/0 to-[#61B6DE]/0 group-hover:from-[#3B5787]/[0.05] group-hover:to-[#61B6DE]/[0.05] transition-colors z-10" />

                    <div className="relative flex flex-col sm:flex-row">
                      {/* Service Image */}
                      <div className="relative w-full sm:w-48 h-32 sm:h-28 overflow-hidden">
                        <img
                          src={categoryImage}
                          alt={category.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {/* Icon overlay */}
                        <div className="absolute top-3 left-3 h-8 w-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-md">
                          <IconComponent className="text-[#3B5787] text-sm" />
                        </div>
                        {/* Service count badge */}
                        <div className="absolute top-3 right-3 bg-[#61B6DE] text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                          {category.serviceCount}
                        </div>
                      </div>

                      {/* Service Details */}
                      <div className="flex-1 p-4 sm:p-5">
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-[#3B5787] transition-colors">
                              {category.title}
                            </h3>
                            <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
                              <FaClock className="shrink-0" />
                              <span>{category.estimatedTime || 'Available now'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {category.description || t('guestCategories.professionalServiceDescription')}
                        </p>

                        {/* Features */}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4">
                          {(category.features || [t('guestCategories.professionalService'), t('guestCategories.qualityGuaranteed')])
                            .slice(0, 3)
                            .map((feature, idx) => (
                              <div key={idx} className="flex items-center gap-1 text-xs text-gray-600">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#61B6DE]"></span>
                                <span>{feature}</span>
                              </div>
                            ))}
                        </div>

                        {/* Browse button */}
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 px-4 py-2 text-sm font-medium text-gray-700 group-hover:bg-[#3B5787] group-hover:text-white transition-all">
                            <span>{t('guestCategories.browseServices')}</span>
                            <FaArrowRight className="text-xs transition-transform group-hover:translate-x-1" />
                          </div>
                          <div className="text-sm font-medium text-[#61B6DE]">
                            {category.serviceCount} {category.serviceCount === 1 ? t('services.singleService') : t('services.multipleServices')}
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </main>

      {/* Floating Services Quick Access */}
      <div className="fixed bottom-20 sm:bottom-6 right-6 z-50">
        {/* Quick Access Menu */}
        {showQuickAccess && (
          <div className="absolute bottom-16 right-0 mb-2">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 min-w-[280px] animate-fade-in">
              <h3 className="text-lg font-bold text-gray-900 mb-3 text-center">{t('guest.common.quickAccess')}</h3>
              <div className="grid grid-cols-3 gap-3">
                {categories.map((category) => {
                  const IconComponent = categoryIcons[category.key] || FaShoppingBag;
                  return (
                    <button
                      key={category.key}
                      onClick={() => {
                        handleCategorySelect(category.key);
                        setShowQuickAccess(false);
                      }}
                      className="flex flex-col items-center p-3 rounded-xl hover:bg-gray-50 transition-colors group"
                      title={category.title}
                    >
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-[#3B5787] to-[#61B6DE] flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <IconComponent className="text-white text-sm" />
                      </div>
                      <span className="text-xs font-medium text-gray-700 text-center truncate w-full">
                        {category.title}
                      </span>
                      <span className="text-xs text-gray-500">
                        {category.serviceCount}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100">
                <button
                  onClick={() => {
                    window.scrollTo({ top: document.querySelector('main').offsetTop, behavior: 'smooth' });
                    setShowQuickAccess(false);
                  }}
                  className="w-full text-center text-sm text-[#3B5787] font-medium hover:text-[#61B6DE] transition-colors"
                >
                  View All Services
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Button */}
        <button
          onClick={() => setShowQuickAccess(!showQuickAccess)}
          className={`group bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white p-4 rounded-full shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-300 ${showQuickAccess ? 'rotate-45' : ''}`}
          title="Quick access to services"
        >
          <FaConciergeBell className={`text-xl transition-transform duration-300 ${showQuickAccess ? 'rotate-180' : 'group-hover:animate-bounce'}`} />
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold animate-pulse">
            {categories.length}
          </div>
        </button>
      </div>

      {/* Click outside to close quick access */}
      {showQuickAccess && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowQuickAccess(false)}
        />
      )}
    </div>
  );
};

export default GuestCategorySelection;
