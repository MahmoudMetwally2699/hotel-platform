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
    <div className="min-h-screen bg-[#F8FAFC] pb-24 font-sans selection:bg-primary-light selection:text-white">
      {/* CSS Animations */}
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in { animation: fade-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-5px); }
          100% { transform: translateY(0px); }
        }
        .animate-float { animation: float 3s ease-in-out infinite; }
      `}</style>

      {/* Vibrant Brand Hero Section */}
      <div className="relative overflow-hidden bg-white shadow-sm border-b border-gray-100">
        {/* Soft Background Accent */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[40rem] h-[40rem] bg-gradient-to-bl from-primary-light/10 to-transparent rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
          <div className="absolute bottom-0 left-0 w-[30rem] h-[30rem] bg-gradient-to-tr from-primary-main/5 to-transparent rounded-full blur-3xl translate-y-1/3 -translate-x-1/4"></div>
        </div>

        <div className="relative z-0 w-full px-4 pt-24 pb-10 sm:px-6 lg:px-8 max-w-7xl mx-auto flex flex-col items-center animate-fade-in">
          
          {/* Hotel Identity */}
          <div className="flex flex-col items-center text-center">
            {hotel?.images?.logo ? (
              <div className="p-1 bg-white rounded-2xl shadow-sm border border-gray-100 mb-4 animate-float">
                <img
                  src={hotel.images.logo}
                  alt={`${hotel?.name || 'Hotel'} Logo`}
                  className="h-16 w-auto sm:h-20 object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-primary-main to-primary-light shadow-md flex items-center justify-center mb-4 animate-float">
                <span className="text-white font-bold text-3xl">{hotel?.name?.charAt(0) || 'H'}</span>
              </div>
            )}
            
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">
              {hotel?.name || t('guest.common.hotelServices')}
            </h1>

            <div className="flex justify-center items-center gap-1 mb-3">
              {Array.from({ length: hotel?.starRating || 5 }, (_, index) => (
                <FaStar key={index} className="text-yellow-400 text-sm sm:text-base drop-shadow-sm" />
              ))}
            </div>

            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-gray-50 rounded-full text-gray-600 text-sm border border-gray-100 shadow-sm">
              <FaMapMarkerAlt className="text-primary-light" />
              <span className="font-medium">
                {hotel?.address?.city && hotel?.address?.country
                  ? `${hotel.address.city}, ${hotel.address.country}`
                  : t('guestCategories.premiumLocation')}
              </span>
            </div>
          </div>

          {/* Clean Light Greeting Card */}
          <div className="w-full max-w-2xl mx-auto mt-8">
            <div className="bg-gradient-to-r from-primary-main to-primary-light rounded-3xl p-[1px] shadow-lg hover:shadow-xl transition-all duration-500 overflow-hidden group">
              <div className="bg-white/95 backdrop-blur-3xl rounded-[23px] p-6 sm:p-8 relative overflow-hidden h-full flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5">
                <div className="h-16 w-16 bg-primary-light/10 rounded-2xl flex items-center justify-center border border-primary-light/20 shrink-0 group-hover:scale-105 transition-transform duration-500">
                  <FaUser className="text-primary-main text-2xl" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl text-gray-800 font-normal">
                    {t('guest.common.hello')},{" "}
                    <span className="font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-primary-main to-primary-light">
                      {currentUser?.firstName || currentUser?.name || t('guest.common.guest')}!
                    </span>
                  </h2>
                  <p className="text-gray-500 mt-2 text-sm sm:text-base leading-relaxed">
                    {t('guest.common.welcomeToPremiumServices')} {t('guest.common.discoverAndBook')}
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Main Content Area */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-10 max-w-7xl mx-auto relative z-20">
        
        {categories.length === 0 ? (
          <div className="max-w-md mx-auto mt-8 animate-fade-in">
            <div className="rounded-3xl border border-gray-100 bg-white shadow-lg p-10 text-center hover:shadow-xl transition-shadow">
              <div className="mx-auto mb-6 h-20 w-20 rounded-full bg-primary-light/10 flex place-items-center justify-center">
                <FaShoppingBag className="text-3xl text-primary-light" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{t('guestCategories.noServicesAvailable')}</h3>
              <p className="mt-3 text-gray-500">{t('guestCategories.noActiveServices')}</p>
            </div>
          </div>
        ) : (
          <>
            <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between mb-8 sm:mb-10 text-center sm:text-left gap-4 animate-fade-in" style={{ animationDelay: '100ms' }}>
              <div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                  {t('guestCategories.availableServiceCategories')}
                </h3>
                <p className="mt-2 text-gray-500 font-medium">
                  {t('guestCategories.selectCategoryToBrowse')}
                </p>
              </div>
              <span className="bg-primary-light/10 text-primary-main font-semibold px-4 py-1.5 rounded-full text-sm border border-primary-light/20 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-primary-light animate-pulse"></span>
                {categories.length} {t('navigation.services')}
              </span>
            </div>

            {/* Light, Airy Image Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {categories.map((category, index) => {
                const IconComponent = categoryIcons[category.key] || FaShoppingBag;
                const categoryImage = categoryImages[category.key] || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center';

                return (
                  <button
                    key={category.key}
                    type="button"
                    onClick={() => handleCategorySelect(category.key)}
                    className="group relative w-full bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-[0_20px_40px_-15px_rgba(103,186,224,0.3)] transition-all duration-500 focus:outline-none focus:ring-4 focus:ring-primary-light/30 border border-gray-100 flex flex-col text-left h-full animate-fade-in"
                    style={{ animationDelay: `${(index + 2) * 100}ms`, animationFillMode: 'both' }}
                    aria-label={`${category.title} (${category.serviceCount})`}
                  >
                    {/* Top Image Section */}
                    <div className="relative w-full h-48 overflow-hidden bg-gray-100">
                      <img
                        src={categoryImage}
                        alt={category.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      
                      {/* Subtly darkened bottom edge for image text legibility if needed, but we keep it clean */}
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 to-transparent opacity-60"></div>

                      {/* Floating Badges */}
                      <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                        <div className="bg-white/90 backdrop-blur-md rounded-xl p-2.5 shadow-sm text-primary-main group-hover:text-white group-hover:bg-primary-light transition-colors duration-300">
                          <IconComponent className="text-xl" />
                        </div>

                        <div className="bg-white/95 backdrop-blur-md text-primary-main px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                          {category.serviceCount} {category.serviceCount === 1 ? t('services.singleService') : t('services.multipleServices')}
                        </div>
                      </div>
                    </div>

                    {/* Content Section */}
                    <div className="p-6 flex-1 flex flex-col items-start w-full relative bg-white">
                      <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-primary-main transition-colors">
                        {category.title}
                      </h3>
                      
                      <div className="flex items-center gap-2 mb-3 text-gray-500">
                        <FaClock className="text-primary-light text-sm" />
                        <span className="text-sm font-medium">{category.estimatedTime || 'Available now'}</span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 leading-relaxed mb-4 flex-1">
                        {category.description || t('guestCategories.professionalServiceDescription')}
                      </p>
                      
                      {/* Action Link */}
                      <div className="mt-auto flex items-center text-primary-main text-sm font-bold uppercase tracking-wide group-hover:text-primary-light transition-colors w-full justify-between border-t border-gray-50 pt-4">
                        <span>{t('guestCategories.browseServices')}</span>
                        <div className="h-8 w-8 rounded-full bg-primary-light/10 flex items-center justify-center group-hover:bg-primary-light group-hover:text-white transition-colors">
                          <FaArrowRight className="transition-transform group-hover:translate-x-1" />
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

      {/* Floating Services Quick Access Widget */}
      <div className="fixed bottom-24 right-6 sm:bottom-8 sm:right-8 z-50">
        {showQuickAccess && (
          <div className="absolute bottom-20 right-0 mb-4 z-50">
            <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 p-5 min-w-[340px] animate-fade-in origin-bottom-right">
              <h3 className="text-lg font-extrabold text-gray-900 mb-4 text-center">{t('guest.common.quickAccess')}</h3>
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
                      className="flex flex-col items-center p-3 rounded-2xl hover:bg-primary-light/10 hover:text-primary-main transition-all group border border-transparent hover:border-primary-light/20 focus:outline-none"
                      title={category.title}
                    >
                      <div className="h-12 w-12 rounded-full bg-gray-50 flex items-center justify-center mb-2 group-hover:bg-white group-hover:shadow-sm transition-all relative group-hover:-translate-y-1">
                        <IconComponent className="text-gray-400 group-hover:text-primary-light text-lg transition-colors" />
                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center font-bold border-2 border-white shadow-sm">
                          {category.serviceCount}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-gray-500 group-hover:text-gray-900 text-center leading-tight truncate w-full">
                        {category.title}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-5 pt-4 border-t border-gray-100">
                <button
                  onClick={() => setShowQuickAccess(false)}
                  className="w-full text-center py-2 text-sm text-gray-500 font-bold hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                >
                  Close Menu
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Floating Bell Button */}
        <button
          onClick={() => setShowQuickAccess(!showQuickAccess)}
          className={`group bg-primary-main hover:bg-primary-light p-4 shadow-xl hover:shadow-[0_10px_25px_rgba(103,186,224,0.5)] transform hover:-translate-y-1 transition-all duration-300 ring-4 ring-white/50 z-50 focus:outline-none ${
            showQuickAccess ? 'rotate-90 rounded-2xl bg-gray-800 hover:bg-gray-900' : 'rounded-[2rem]'
          }`}
          title="Quick access to services"
        >
          <FaConciergeBell className={`text-white text-2xl relative z-10 transition-transform duration-300 ${!showQuickAccess && 'group-hover:animate-bounce'}`} />
          {!showQuickAccess && (
            <div className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold ring-2 ring-white shadow-sm">
              {categories.length}
            </div>
          )}
        </button>
      </div>

      {showQuickAccess && (
        <div
          className="fixed inset-0 z-40 bg-gray-900/20 backdrop-blur-sm transition-all duration-300"
          onClick={() => setShowQuickAccess(false)}
        />
      )}
    </div>
  );
};

export default GuestCategorySelection;
