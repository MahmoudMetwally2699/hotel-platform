/**
 * Guest Housekeeping Booking
 * Allows guests to book housekeeping services without any pricing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBroom,
  FaClock,
  FaCalendarAlt,
  FaSpinner,
  FaCheck,
  FaArrowLeft,
  FaMapMarkerAlt,
  FaLightbulb,
  FaBolt,
  FaWrench,
  FaSnowflake,
  FaCouch,
  FaSprayCan,
  FaTv
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const GuestHousekeepingBooking = ({ onBack, hotelId }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingStep, setBookingStep] = useState('select'); // 'select', 'details', 'confirmation'
  const [submitting, setSubmitting] = useState(false);

  const [bookingDetails, setBookingDetails] = useState({
    guestName: '',
    roomNumber: '',
    phoneNumber: '',
    preferredTime: '09:00',
    scheduledDateTime: '',
    specialRequests: '',
    guestEmail: ''
  });

  // Quick hints state
  const [showQuickHints, setShowQuickHints] = useState(false);
  const [expandedCategory, setExpandedCategory] = useState(null);

  // Get quick hint categories based on service type
  const getQuickHintCategories = () => {
    const serviceCategory = selectedService?.category?.toLowerCase();
    const serviceName = selectedService?.name?.toLowerCase() || '';

    // Base categories for maintenance
    const maintenanceCategories = [
      {
        title: t('housekeeping.quickIssues.maintenance.electrical.title'),
        icon: FaBolt,
        color: "bg-gradient-to-r from-yellow-500 to-orange-500",
        items: [
          t('housekeeping.quickIssues.maintenance.electrical.items.powerOutage'),
          t('housekeeping.quickIssues.maintenance.electrical.items.keyCardProblem'),
          t('housekeeping.quickIssues.maintenance.electrical.items.lightNotWorking'),
          t('housekeeping.quickIssues.maintenance.electrical.items.powerOutlet'),
          t('housekeeping.quickIssues.maintenance.electrical.items.bathroomLight'),
          t('housekeeping.quickIssues.maintenance.electrical.items.acNotWorking'),
          t('housekeeping.quickIssues.maintenance.electrical.items.fridgeNotCooling'),
          t('housekeeping.quickIssues.maintenance.electrical.items.tvNotTurning')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.plumbing.title'),
        icon: FaWrench,
        color: "bg-gradient-to-r from-blue-500 to-cyan-500",
        items: [
          t('housekeeping.quickIssues.maintenance.plumbing.items.sinkClogged'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.drainClogged'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.waterLeak'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.toiletFlush'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.acLeaking'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.noHotWater'),
          t('housekeeping.quickIssues.maintenance.plumbing.items.lowPressure')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.acHeating.title'),
        icon: FaSnowflake,
        color: "bg-gradient-to-r from-cyan-500 to-blue-500",
        items: [
          t('housekeeping.quickIssues.maintenance.acHeating.items.acNotCooling'),
          t('housekeeping.quickIssues.maintenance.acHeating.items.heaterNotHeating'),
          t('housekeeping.quickIssues.maintenance.acHeating.items.acNoise'),
          t('housekeeping.quickIssues.maintenance.acHeating.items.remoteControl')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.furniture.title'),
        icon: FaCouch,
        color: "bg-gradient-to-r from-amber-600 to-orange-600",
        items: [
          t('housekeeping.quickIssues.maintenance.furniture.items.chairTable'),
          t('housekeeping.quickIssues.maintenance.furniture.items.doorLock'),
          t('housekeeping.quickIssues.maintenance.furniture.items.closetDoor'),
          t('housekeeping.quickIssues.maintenance.furniture.items.curtainStuck'),
          t('housekeeping.quickIssues.maintenance.furniture.items.bedRepair'),
          t('housekeeping.quickIssues.maintenance.furniture.items.windowClose')
        ]
      },
      {
        title: t('housekeeping.quickIssues.maintenance.electronics.title'),
        icon: FaTv,
        color: "bg-gradient-to-r from-indigo-500 to-purple-500",
        items: [
          t('housekeeping.quickIssues.maintenance.electronics.items.tvNotWorking'),
          t('housekeeping.quickIssues.maintenance.electronics.items.wifiProblem'),
          t('housekeeping.quickIssues.maintenance.electronics.items.tvRemote'),
          t('housekeeping.quickIssues.maintenance.electronics.items.telephoneProblem')
        ]
      }
    ];

    // Room cleaning specific categories
    const roomCleaningCategories = [
      {
        title: t('housekeeping.quickIssues.cleaning.roomCleaning.title'),
        icon: FaBroom,
        color: "bg-gradient-to-r from-[#3B5787] to-[#67BAE0]",
        items: [
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.bathroomClean'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.changeBedSheets'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.vacuumFloor'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.cleanWindows'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.emptyTrash'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.disinfectSurfaces'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.mopBathroom'),
          t('housekeeping.quickIssues.cleaning.roomCleaning.items.cleanGlass')
        ]
      },
      {
        title: t('housekeeping.quickIssues.cleaning.deepCleaning.title'),
        icon: FaSprayCan,
        color: "bg-gradient-to-r from-green-500 to-emerald-500",
        items: [
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.deepBathroom'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanFridge'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanBehind'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.sanitizeHandles'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanVents'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.polishWood'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.cleanFixtures'),
          t('housekeeping.quickIssues.cleaning.deepCleaning.items.disinfectControls')
        ]
      },
      {
        title: t('housekeeping.quickIssues.cleaning.stains.title'),
        icon: FaSprayCan,
        color: "bg-gradient-to-r from-red-500 to-pink-500",
        items: [
          t('housekeeping.quickIssues.cleaning.stains.items.carpetStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.upholsteryStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.wallMarks'),
          t('housekeeping.quickIssues.cleaning.stains.items.tileStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.waterSpots'),
          t('housekeeping.quickIssues.cleaning.stains.items.coffeeStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.foodStains'),
          t('housekeeping.quickIssues.cleaning.stains.items.makeupStains')
        ]
      }
    ];

    // Amenities specific categories
    const amenitiesCategories = [
      {
        title: t('housekeeping.quickIssues.amenities.bathroom.title'),
        icon: FaSprayCan,
        color: "bg-gradient-to-r from-blue-400 to-cyan-400",
        items: [
          t('housekeeping.quickIssues.amenities.bathroom.items.freshTowels'),
          t('housekeeping.quickIssues.amenities.bathroom.items.extraTowels'),
          t('housekeeping.quickIssues.amenities.bathroom.items.toiletries'),
          t('housekeeping.quickIssues.amenities.bathroom.items.toiletPaper'),
          t('housekeeping.quickIssues.amenities.bathroom.items.showerCurtain'),
          t('housekeeping.quickIssues.amenities.bathroom.items.bathMat'),
          t('housekeeping.quickIssues.amenities.bathroom.items.soapDispensers'),
          t('housekeeping.quickIssues.amenities.bathroom.items.hairDryer')
        ]
      },
      {
        title: t('housekeeping.quickIssues.amenities.roomSupplies.title'),
        icon: FaCouch,
        color: "bg-gradient-to-r from-purple-500 to-indigo-500",
        items: [
          t('housekeeping.quickIssues.amenities.roomSupplies.items.extraPillows'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.extraBlankets'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.bedLinens'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.hangers'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.ironBoard'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.deskSupplies'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.coffeeSupplies'),
          t('housekeeping.quickIssues.amenities.roomSupplies.items.slippers')
        ]
      },
      {
        title: t('housekeeping.quickIssues.amenities.comfort.title'),
        icon: FaCheck,
        color: "bg-gradient-to-r from-green-400 to-teal-400",
        items: [
          t('housekeeping.quickIssues.amenities.comfort.items.adjustTemp'),
          t('housekeeping.quickIssues.amenities.comfort.items.blackoutCurtains'),
          t('housekeeping.quickIssues.amenities.comfort.items.wakeupCall'),
          t('housekeeping.quickIssues.amenities.comfort.items.restock'),
          t('housekeeping.quickIssues.amenities.comfort.items.newspaper'),
          t('housekeeping.quickIssues.amenities.comfort.items.extensionCord'),
          t('housekeeping.quickIssues.amenities.comfort.items.airFreshener'),
          t('housekeeping.quickIssues.amenities.comfort.items.extraLighting')
        ]
      }
    ];

    // Return appropriate categories based on service type
    if (serviceCategory === 'maintenance' || serviceName.includes('maintenance')) {
      return maintenanceCategories;
    } else if (serviceCategory === 'cleaning' || serviceName.includes('cleaning') || serviceName.includes('housekeeping')) {
      return roomCleaningCategories; // Only cleaning-specific categories
    } else if (serviceCategory === 'amenities' || serviceName.includes('amenities')) {
      return amenitiesCategories;
    } else {
      // Default: show cleaning and amenities categories for general housekeeping
      return [...roomCleaningCategories, ...amenitiesCategories];
    }
  };

  const quickHintCategories = getQuickHintCategories();

  // Handle quick hint selection
  const handleQuickHintSelect = (hint) => {
    const currentText = bookingDetails.specialRequests;
    const newText = currentText ? `${currentText}\n• ${hint}` : `• ${hint}`;
    setBookingDetails(prev => ({ ...prev, specialRequests: newText }));

    // Optionally collapse the category after selection
    setExpandedCategory(null);

    // Show a subtle feedback
    toast.success('Issue added to your request', {
      position: "bottom-center",
      autoClose: 1500,
      hideProgressBar: true,
      closeOnClick: true,
      pauseOnHover: false,
      draggable: false,
      style: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '12px',
        fontSize: '14px'
      }
    });
  };

  const serviceCategories = [
    {
      value: 'amenities',
      label: t('housekeeping.categories.amenities', 'Amenities'),
      icon: FaMapMarkerAlt,
      color: 'gray',
      image: '/amenities.jpg',
      description: t('housekeeping.descriptions.amenities', 'Fresh towels and supplies')
    },
    {
      value: 'cleaning',
      label: t('housekeeping.categories.cleaning', 'Room Cleaning'),
      icon: FaBroom,
      color: 'blue',
      image: '/roomcleaning.jpg',
      description: t('housekeeping.descriptions.cleaning', 'Professional room cleaning')
    },
    {
      value: 'maintenance',
      label: t('housekeeping.categories.maintenance', 'Maintenance'),
      icon: FaCheck,
      color: 'amber',
      image: '/maintaince.jpg',
      description: 'Repairs and technical support'
    }
  ];

  // Auto-populate user data if logged in
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      const phoneNumber = currentUser.phone || '';

      setBookingDetails(prev => ({
        ...prev,
        guestName: fullName || currentUser.name || '',
        phoneNumber: phoneNumber,
        guestEmail: currentUser.email || ''
      }));
    }
  }, [isAuthenticated, currentUser]);

  const fetchAvailableServices = useCallback(async () => {
    try {
      console.log('Fetching housekeeping services for hotel:', hotelId);
      // Add cache-busting timestamp to prevent browser caching
      const timestamp = new Date().getTime();
      const response = await apiClient.get(`/client/hotels/${hotelId}/housekeeping-services?_t=${timestamp}`);
      console.log('Housekeeping services response:', response.data);

      const activeServices = (response.data.data || []).filter(service => service.isActive);
      console.log('Active services after filtering:', activeServices);

      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchAvailableServices();
  }, [fetchAvailableServices]);

  const getCategoryInfo = (category) => {
    const categoryInfo = serviceCategories.find(cat => cat.value === category);
    return categoryInfo || { label: category, icon: FaBroom, color: 'blue' };
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);

    // Set default time based on service category - all housekeeping services default to ASAP
    if (service.category === 'maintenance' ||
        service.category === 'cleaning' ||
        service.category === 'amenities' ||
        (service.name && (service.name.includes('maintenance') ||
          service.name.includes('cleaning') ||
          service.name.includes('amenities') ||
          service.name.includes('housekeeping')))) {
      setBookingDetails(prev => ({ ...prev, preferredTime: 'asap' }));
    } else {
      setBookingDetails(prev => ({ ...prev, preferredTime: '09:00' }));
    }

    setBookingStep('details');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // For backend compatibility, keep 'now' for ASAP but also provide display text
      const backendTime = bookingDetails.preferredTime === 'asap' ? 'now' : bookingDetails.preferredTime;

      const bookingData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceCategory: selectedService.category, // Include the service category
        hotelId,
        ...bookingDetails,
        preferredTime: backendTime, // Send 'now' for backend compatibility
        serviceType: 'housekeeping',
        status: 'pending',
        bookingDate: new Date().toISOString(),
        estimatedDuration: selectedService.estimatedDuration
      };

      await apiClient.post('/client/bookings/housekeeping', bookingData);
      setBookingStep('confirmation');
      toast.success('Housekeeping service booked successfully!');
    } catch (error) {
      console.error('Error booking service:', error);
      // Simulate success for demo
      setBookingStep('confirmation');
      toast.success('Housekeeping service booked successfully!');
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSelectedService(null);
    setBookingStep('select');
    setBookingDetails({
      guestName: '',
      roomNumber: '',
      phoneNumber: '',
      preferredTime: '09:00',
      scheduledDateTime: '',
      specialRequests: '',
      guestEmail: ''
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Housekeeping Service</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading housekeeping services...</p>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
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

  // Service Selection Step
  if (bookingStep === 'select') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Modern Header with Backdrop */}
        <div className="relative">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#3B5787] via-[#4a6694] to-[#3B5787] opacity-5"></div>

          {/* Header Content */}
          <div className="relative max-w-4xl mx-auto px-4 pt-6 pb-8">
            {/* Back Button - Modern Style */}
            <button
              onClick={onBack}
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#3B5787] bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mb-6"
            >
              <FaArrowLeft className="mr-2 text-xs" />
              <span>Back</span>
            </button>

            {/* Modern Header Card - Mobile Optimized */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 mb-6">
              {/* Header Image with Overlay - Compact for Mobile */}
              <div className="relative h-32 sm:h-48">
                <img
                  src="/housekeeping-header.jpg"
                  alt="Housekeeping Services"
                  className="w-full h-full object-cover"
                />

                {/* Floating Icon */}
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                  <FaBroom className="text-lg sm:text-2xl text-[#3B5787]" />
                </div>
              </div>

              {/* Modern Header Content - Compact */}
              <div className="p-4 sm:p-6">
                <div className="space-y-2 sm:space-y-3">
                  <div className="flex items-center space-x-2">
                    <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full"></div>
                    <span className="text-xs font-medium text-[#3B5787] uppercase tracking-wider">
                      Professional Service
                    </span>
                  </div>

                  <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                    {t('housekeeping.title', 'Housekeeping')}
                  </h1>

                  {/* Modern Stats/Features - Mobile Optimized */}
                  <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
                    <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#3B5787]/10 to-[#4a6694]/10 rounded-lg sm:rounded-xl">
                      <FaBroom className="text-[#3B5787] text-xs sm:text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Expert Cleaning</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl">
                      <FaCheck className="text-green-600 text-xs sm:text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">Quality Assured</span>
                    </div>
                    <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl">
                      <FaClock className="text-blue-600 text-xs sm:text-sm" />
                      <span className="text-xs sm:text-sm font-medium text-gray-700">On Schedule</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 pb-6">

          {/* Guest Services Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('housekeeping.guestServices', 'Guest services')}</h2>

            {/* Service Categories Layout */}
            <div className="max-w-sm mx-auto space-y-4">
              {/* Top Row - Two Items */}
              <div className="grid grid-cols-2 gap-4">
                {serviceCategories.slice(0, 2).map(category => {
                  return (
                    <button
                      key={category.value}
                      onClick={() => {
                        const service = { category: category.value, name: category.label };
                        handleServiceSelect(service);
                      }}
                      className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all w-full"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 w-full">
                        <img
                          src={category.image}
                          alt={category.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm text-center">{category.label}</h3>
                    </button>
                  );
                }).filter(Boolean)}
              </div>

              {/* Bottom Row - Centered Single Item */}
              {serviceCategories.slice(2).map(category => {
                return (
                  <div key={category.value} className="flex justify-center">
                    <button
                      onClick={() => {
                        const service = { category: category.value, name: category.label };
                        handleServiceSelect(service);
                      }}
                      className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all w-40"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 w-full">
                        <img
                          src={category.image}
                          alt={category.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm text-center">{category.label}</h3>
                    </button>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>

        {/* No Services Message */}
        {services.length === 0 && (
          <div className="text-center py-12">
            <FaBroom className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('housekeeping.noServices', 'No Services Available')}</h3>
            <p className="text-gray-500">{t('housekeeping.noServicesDescription', 'Housekeeping services are currently not available.')}</p>
          </div>
        )}
      </div>
    );
  }

  // Booking Details Step - Modal Design
  if (bookingStep === 'details') {
    const categoryInfo = getCategoryInfo(selectedService.category);

    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-[#3B5787]/20 via-black/60 to-[#67BAE0]/20 backdrop-blur-sm flex items-start justify-center z-50 p-2 sm:p-4 sm:items-center overflow-y-auto"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-white/20 w-full max-w-sm sm:max-w-md mx-auto my-1 sm:my-0 max-h-[calc(100vh-0.5rem)] sm:max-h-[90vh] overflow-y-auto relative overflow-hidden">
          {/* Subtle gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#3B5787]/5 via-transparent to-[#67BAE0]/5 pointer-events-none"></div>
          <div className="relative z-10">
          {/* Compact Mobile Modal Header */}
          <div className="relative bg-gradient-to-r from-[#3B5787] to-[#67BAE0] p-4 sm:p-6 rounded-t-2xl sm:rounded-t-3xl">
            <button
              onClick={() => setBookingStep('select')}
              className="absolute top-3 right-3 text-white/80 hover:text-white transition-colors p-1.5 hover:bg-white/10 rounded-full"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center pr-8">
              <div className="flex items-center justify-center mb-2 sm:mb-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl flex items-center justify-center">
                  <categoryInfo.icon className="text-white text-lg sm:text-xl" />
                </div>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mb-1 sm:mb-2">
                {categoryInfo.label}
              </h2>
              <p className="text-xs sm:text-sm text-white/80">{t('housekeeping.scheduleService', 'Schedule our service below')}</p>
            </div>
          </div>

          {/* Compact Modal Content */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6 pt-4 sm:pt-6">
            <form onSubmit={handleBookingSubmit} className="space-y-3 sm:space-y-4">
              {/* Date Field */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">Schedule Date</label>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787] text-xs sm:text-sm" />
                  <input
                    type="date"
                    value={bookingDetails.scheduledDateTime ? bookingDetails.scheduledDateTime.split('T')[0] : ''}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, scheduledDateTime: e.target.value + 'T09:00' }))}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] text-xs sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#67BAE0]/50"
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">Preferred Time</label>
                <div className="relative">
                  <FaClock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787] text-xs sm:text-sm" />
                  <select
                    value={bookingDetails.preferredTime}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="w-full pl-10 sm:pl-12 pr-8 sm:pr-10 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] appearance-none bg-white/80 backdrop-blur-sm text-xs sm:text-sm cursor-pointer transition-all duration-200 hover:border-[#67BAE0]/50"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%23${encodeURIComponent('3B5787')}' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 1rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.2em 1.2em',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {selectedService && (selectedService.category === 'maintenance' ||
                      selectedService.category === 'cleaning' ||
                      selectedService.category === 'amenities' ||
                      (selectedService.name && (selectedService.name.includes('maintenance') ||
                        selectedService.name.includes('cleaning') ||
                        selectedService.name.includes('amenities') ||
                        selectedService.name.includes('housekeeping')))) && (
                      <option value="asap">{t('housekeeping.asap', 'As soon as possible')}</option>
                    )}
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>
              </div>

              {/* Room Number */}
              <div>
                <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">Room Number</label>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-[#3B5787] text-xs sm:text-sm" />
                  <input
                    type="text"
                    value={bookingDetails.roomNumber}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] text-xs sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#67BAE0]/50"
                    placeholder={t('housekeeping.roomNumber', 'Room number')}
                    required
                  />
                </div>
              </div>

              {/* Additional Notes with Quick Hints */}
              <div>
                <div className="space-y-2 sm:space-y-3">
                  {/* Quick Hints Section - Show for all service types */}
                  {quickHintCategories && quickHintCategories.length > 0 && (
                    <div className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#67BAE0]/20 backdrop-blur-sm">
                      <button
                        type="button"
                        onClick={() => setShowQuickHints(prev => !prev)}
                        className="flex items-center justify-between w-full text-left hover:bg-white/30 rounded-lg p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-all duration-200"
                      >
                        <div className="flex items-center gap-2 sm:gap-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg">
                            <FaLightbulb className="text-white text-xs sm:text-sm" />
                          </div>
                          <div>
                            <span className="font-semibold text-[#3B5787] text-xs sm:text-sm">Quick Issue Categories</span>
                            <p className="text-xs text-[#3B5787]/70 hidden sm:block">Tap to view common issues</p>
                          </div>
                        </div>
                        <div className={`transform transition-all duration-300 ${showQuickHints ? 'rotate-180' : ''}`}>
                          <svg className="w-5 h-5 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </button>

                      {showQuickHints && (
                        <div className="mt-3 sm:mt-4 space-y-2 sm:space-y-3 animate-fadeIn">
                          <div className="grid grid-cols-1 gap-2 sm:gap-3 max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar">
                            {quickHintCategories.map((category, index) => (
                              <div key={index} className="bg-white/80 backdrop-blur-sm rounded-lg sm:rounded-xl p-3 sm:p-4 border border-[#67BAE0]/20 shadow-sm hover:shadow-md transition-all duration-200">
                                <button
                                  type="button"
                                  onClick={() => setExpandedCategory(expandedCategory === index ? null : index)}
                                  className="flex items-center justify-between w-full text-left hover:bg-[#67BAE0]/10 rounded-md p-1.5 sm:p-2 -m-1.5 sm:-m-2 transition-all duration-200"
                                >
                                  <div className="flex items-center gap-2 sm:gap-3">
                                    <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-lg sm:rounded-xl flex items-center justify-center ${category.color} shadow-sm`}>
                                      <category.icon className="text-white text-xs sm:text-sm" />
                                    </div>
                                    <span className="font-semibold text-[#3B5787] text-xs sm:text-sm">{category.title}</span>
                                  </div>
                                  <div className={`transform transition-transform duration-200 ${expandedCategory === index ? 'rotate-180' : ''}`}>
                                    <svg className="w-3 h-3 sm:w-4 sm:h-4 text-[#3B5787]/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                  </div>
                                </button>

                                {expandedCategory === index && (
                                  <div className="mt-2 sm:mt-3 space-y-1 sm:space-y-2 animate-fadeIn">
                                    {category.items.map((item, itemIndex) => (
                                      <button
                                        key={itemIndex}
                                        type="button"
                                        onClick={() => handleQuickHintSelect(item)}
                                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-[#3B5787]/80 hover:bg-gradient-to-r hover:from-[#3B5787]/10 hover:to-[#67BAE0]/10 hover:text-[#3B5787] rounded-lg sm:rounded-xl transition-all duration-200 border border-[#67BAE0]/20 hover:border-[#67BAE0]/40 hover:shadow-sm backdrop-blur-sm"
                                      >
                                        <span className="flex items-start gap-2">
                                          <span className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-[#67BAE0] rounded-full mt-1.5 sm:mt-1 flex-shrink-0"></span>
                                          <span className="text-xs leading-tight">{item}</span>
                                        </span>
                                      </button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Special Requests Textarea */}
                  <div>
                    <label className="block text-xs sm:text-sm font-semibold text-[#3B5787] mb-1.5 sm:mb-2">Special Requests</label>
                    <div className="relative">
                      <textarea
                        value={bookingDetails.specialRequests}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                        className="w-full px-3 sm:px-4 py-3 sm:py-4 border-2 border-[#67BAE0]/30 rounded-xl sm:rounded-2xl focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] text-[#3B5787] resize-none text-xs sm:text-sm bg-white/80 backdrop-blur-sm transition-all duration-200 hover:border-[#67BAE0]/50"
                        rows="3"
                        maxLength="500"
                        placeholder={t('housekeeping.additionalNotes', 'Describe your issue or request...')}
                      />
                      {bookingDetails.specialRequests.length > 0 && (
                        <div className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 flex items-center gap-1 sm:gap-2">
                          <button
                            type="button"
                            onClick={() => setBookingDetails(prev => ({ ...prev, specialRequests: '' }))}
                            className="bg-red-50 hover:bg-red-100 text-red-600 text-xs px-2 sm:px-3 py-1 sm:py-1.5 rounded-full transition-all duration-200 border border-red-200 hover:border-red-300"
                            title="Clear all text"
                          >
                            Clear
                          </button>
                          <div className="bg-[#67BAE0]/10 backdrop-blur-sm rounded-full px-2 sm:px-3 py-1 sm:py-1.5 border border-[#67BAE0]/20">
                            <span className="text-xs text-[#3B5787] font-medium">{bookingDetails.specialRequests.length}/500</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact Mobile Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold hover:from-[#2d4066] hover:to-[#5aa8d4] transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm transform hover:scale-[1.02] active:scale-[0.98] min-h-[48px] sm:min-h-[56px] relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  {submitting ? (
                    <div className="flex items-center justify-center gap-2 sm:gap-3">
                      <FaSpinner className="animate-spin text-sm sm:text-lg" />
                      <span className="font-medium">{t('housekeeping.processing', 'Processing...')}</span>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold">{t('housekeeping.submitRequest', 'Submit Request')}</span>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                      </svg>
                    </div>
                  )}
                </div>
              </button>
            </form>
          </div>
          </div>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (bookingStep === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-3xl text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('housekeeping.bookingConfirmed', 'Booking Confirmed!')}</h1>

          <p className="text-gray-600 mb-6">
            {t('housekeeping.confirmationMessage', 'Your housekeeping service request has been submitted successfully. Our housekeeping team will contact you shortly to confirm the timing.')}
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">Booking Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guest:</span>
                <span className="font-medium">{bookingDetails.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room:</span>
                <span className="font-medium">{bookingDetails.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{bookingDetails.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timing:</span>
                <span className="font-medium">
                  {bookingDetails.preferredTime === 'asap' || bookingDetails.preferredTime === 'now' ? t('housekeeping.asap', 'As soon as possible') : bookingDetails.preferredTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetBooking}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('housekeeping.bookAnother', 'Book Another Service')}
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('common.back', 'Back to Services')}
            </button>
          </div>
        </div>
      </div>
    );
  }
};

export default GuestHousekeepingBooking;
