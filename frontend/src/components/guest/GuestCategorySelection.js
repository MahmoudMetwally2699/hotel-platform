/**
 * Guest Service Category Selection Dashboard (Redesigned UI Only)
 * - Logic, fetching, and navigation untouched
 * - Tailwind-only visual overhaul: mobile-first, premium, accessible
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
  FaArrowRight,
  FaStar,
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

        // Fetch hotel details (unchanged)
        const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
        setHotel(hotelResponse.data.data);

        // Fetch services (unchanged)
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

        // Always show housekeeping
        serviceCounts['housekeeping'] = 1;

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
      {/* Sticky Glass Header */}
      <header className="sticky top-0 z-30 backdrop-blur-xl bg-white/70 border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4 py-3">
            {/* Logo */}
            <div className="shrink-0">
              {hotel?.images?.logo ? (
                <img
                  src={hotel.images.logo}
                  alt={`${hotel?.name || 'Hotel'} Logo`}
                  className="h-9 w-auto object-contain rounded-md"
                />
              ) : (
                <div className="h-9 w-9 rounded-md bg-gradient-to-br from-[#3B5787] to-[#61B6DE] grid place-items-center">
                  <span className="text-white font-bold">{hotel?.name?.charAt(0) || 'H'}</span>
                </div>
              )}
            </div>

            {/* Hotel identity */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-semibold truncate text-gray-900">
                  {hotel?.name || 'Hotel Services'}
                </h1>
                <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-2 py-0.5 text-[11px] text-gray-600">
                  {[1,2,3,4,5].map(star => (
                    <FaStar key={star} className={`${star <= (hotel?.starRating || 4) ? 'text-[#61B6DE]' : 'text-gray-300'}`} />
                  ))}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                <FaMapMarkerAlt className="shrink-0" />
                <span className="truncate">
                  {hotel?.address?.city && hotel?.address?.country
                    ? `${hotel.address.city}, ${hotel.address.country}`
                    : t('guestCategories.premiumLocation')}
                </span>
              </div>
            </div>

            {/* Right chip */}
            <div className="hidden sm:inline-flex items-center text-xs font-medium text-gray-600 border border-gray-200 rounded-full px-3 py-1">
              {hotel?.category === 'luxury' ? 'Luxury' :
               hotel?.category === 'resort' ? 'Resort' :
               hotel?.category === 'boutique' ? 'Boutique' :
               hotel?.category === 'mid-range' ? 'Mid-Range' : 'Premium'}
            </div>
          </div>
        </div>
      </header>

      {/* Hero band */}
      <section className="bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="grid lg:grid-cols-12 items-center gap-6">
            <div className="lg:col-span-7">
              <h2 className="text-2xl sm:text-3xl font-bold leading-tight">
                {t('guestCategories.welcomeToServices')}
              </h2>
              <p className="mt-3 text-sm sm:text-base text-white/90">
                {t('guestCategories.welcomeDescription')}
              </p>
            </div>
            <div className="lg:col-span-5">
              <div className="rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <div className="font-semibold">{t('guestCategories.mostPopularServices')}</div>
                    <div className="text-white/80">{t('guestCategories.popularServicesNote')}</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-xl bg-white text-[#3B5787] font-semibold px-4 py-2 hover:bg-gray-50 transition"
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  >
                    {t('guestCategories.browseServices') || 'Browse Services'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
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

            {/* Responsive, dense grid with consistent card height */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
              {categories.map((category) => {
                const IconComponent = categoryIcons[category.key] || FaShoppingBag;
                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => handleCategorySelect(category.key)}
                    className="group relative w-full text-left rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-lg focus:shadow-lg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#61B6DE] focus-visible:ring-offset-2"
                    aria-label={`${category.title} (${category.serviceCount})`}
                  >
                    {/* subtle gradient background on hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[#3B5787]/0 to-[#61B6DE]/0 group-hover:from-[#3B5787]/[0.03] group-hover:to-[#61B6DE]/[0.05] transition-colors" />

                    <div className="relative p-4 sm:p-5 h-full flex flex-col">
                      {/* Icon + count */}
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-3">
                          <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-gradient-to-br from-[#3B5787] to-[#61B6DE] grid place-items-center shadow-md group-hover:scale-105 transition">
                            <IconComponent className="text-white text-base sm:text-lg" />
                          </div>
                          <div className="hidden sm:block">
                            <div className="text-sm font-semibold text-gray-900">{category.title}</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1">
                              <FaClock className="shrink-0" />
                              <span className="truncate">{category.estimatedTime || '—'}</span>
                            </div>
                          </div>
                        </div>

                        <span className="shrink-0 inline-flex items-center justify-center rounded-full bg-[#61B6DE] text-white text-xs font-bold h-6 w-6">
                          {category.serviceCount}
                        </span>
                      </div>

                      {/* Description (2 lines) */}
                      <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-gray-600 line-clamp-2">
                        {category.description || 'Professional service available for your comfort'}
                      </p>

                      {/* Features (2 bullets) */}
                      <ul className="mt-3 sm:mt-4 space-y-1">
                        {(category.features || ['Professional Service', 'Quality Guaranteed'])
                          .slice(0, 2)
                          .map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-xs sm:text-sm text-gray-600">
                              <span className="mt-2 h-1.5 w-1.5 rounded-full bg-[#61B6DE]"></span>
                              <span className="truncate">{feature}</span>
                            </li>
                          ))}
                      </ul>

                      {/* CTA */}
                      <div className="mt-4 sm:mt-auto">
                        <div className={`inline-flex items-center rounded-xl bg-gray-50 px-3 py-2 text-sm font-semibold text-gray-700 group-hover:bg-[#3B5787] group-hover:text-white transition`}>
                          <span>{t('guestCategories.browseServices') || 'Browse Services'}</span>
                          <FaArrowRight
                            className={`${isRTL ? 'mr-1 rotate-180' : 'ml-2'} text-xs transition-transform group-hover:translate-x-1`}
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 sm:mt-16">
              <div className="rounded-3xl bg-gradient-to-br from-[#3B5787] to-[#61B6DE] text-white p-6 sm:p-10 relative overflow-hidden">
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{
                    backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
                    backgroundSize: '28px 28px'
                  }}
                />
                <div className="relative flex flex-col items-center text-center">
                  <h4 className="text-xl sm:text-2xl font-bold">{t('guestCategories.mostPopularServices')}</h4>
                  <p className="mt-2 text-sm sm:text-base text-white/90 max-w-2xl">
                    {t('guestCategories.popularServicesNote')}
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-2xl bg-white text-[#3B5787] font-bold py-3 px-6 hover:bg-gray-50 transition shadow-md"
                    onClick={() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })}
                  >
                    {t('guestCategories.browseServices') || 'Explore All Services'}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
};

export default GuestCategorySelection;
