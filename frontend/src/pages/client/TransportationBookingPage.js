/**
 * Transportation Service Booking Page
 * Interactive multi-vehicle selection interface for guests to:
 * 1. Select vehicle types with quantities and service options
 * 2. Choose service types for each vehicle (hourly, one-way, round-trip)
 * 3. Schedule pickup/drop-off times and locations
 * 4. See real-time price calculation (hotel markup already included by backend)
 * 5. Complete the booking with scheduling and payment
 */

import React, { useState, useEffect } from 'react';
import { getVehicleIcon } from '../../utils/vehicleIconMap';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import {
  FaCar,
  FaArrowLeft,
  FaArrowRight,
  FaSpinner,
  FaCheck,
  FaClock,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaStickyNote
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import useRTL from '../../hooks/useRTL';

const TransportationBookingPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { hotelId } = useParams();


  // Get service and hotel from location state
  const { service: passedService, hotel: passedHotel } = location.state || {};

  const [service, setService] = useState(passedService || null);
  const [services, setServices] = useState([]); // Store all available services
  // eslint-disable-next-line no-unused-vars
  const [hotel, setHotel] = useState(passedHotel || null); // Used for data fetching only
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking State
  const [step, setStep] = useState(1); // 1: Vehicles, 2: Service Types, 3: Details, 4: Confirmation
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState({});
  // const [expressSurcharge, setExpressSurcharge] = useState(false); // Feature not implemented yet
  const [bookingDetails, setBookingDetails] = useState({
    pickupDate: '',
    pickupTime: '',
    dropoffLocation: '',
    returnDate: '', // For round-trip bookings
    returnTime: '',
    specialRequests: '',
    passengerCount: 1,
    luggageCount: 0
  });
  const [selectedVehicleTypeId, setSelectedVehicleTypeId] = useState('');
  // Helper function to format hotel address
  const formatHotelAddress = (hotel) => {
    if (!hotel) return 'Hotel Location';

    // If address is a string, return it directly
    if (typeof hotel.address === 'string') {
      return hotel.address;
    }

    // If address is an object, format it
    if (hotel.address && typeof hotel.address === 'object') {
      const { street, city, state, country, zipCode } = hotel.address;
      const parts = [street, city, state, zipCode, country].filter(Boolean);
      return parts.join(', ') || 'Hotel Location';
    }

    // If location is a string, return it
    if (typeof hotel.location === 'string') {
      return hotel.location;
    }

    // If location is an object, format it
    if (hotel.location && typeof hotel.location === 'object') {
      const { street, city, state, country, zipCode } = hotel.location;
      const parts = [street, city, state, zipCode, country].filter(Boolean);
      return parts.join(', ') || 'Hotel Location';
    }

    return hotel.name || 'Hotel Location';
  };

  // Helper functions to translate vehicle category and type names
  const getVehicleTypeName = (vehicleType) => {
    // Convert vehicle type to key format for translation lookup
    const vehicleKey = vehicleType
      .toLowerCase()
      .replace(/\s+/g, '_')        // Replace spaces with underscores
      .replace(/[()]/g, '_')       // Replace parentheses with underscores
      .replace(/-/g, '_')          // Replace hyphens with underscores
      .replace(/_{2,}/g, '_')      // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, '');      // Remove leading/trailing underscores

    const translated = t(`transportationBooking.vehicleTypes.${vehicleKey}`, { defaultValue: null });

    // If translation exists, use it. Otherwise, format the original nicely
    if (translated && translated !== `transportationBooking.vehicleTypes.${vehicleKey}`) {
      return translated;
    } else {
      // Format the original vehicle type nicely (replace underscores with spaces and capitalize)
      const formatted = vehicleType
        .replace(/_/g, ' ')           // Replace underscores with spaces
        .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize first letter of each word
      return formatted;
    }
  };

  // Add helpers to translate serviceType name and description coming from the API
  const normalizeKey = (raw) => {
    if (!raw) return '';
    return String(raw)
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[()]/g, '_')
      .replace(/-/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_{2,}/g, '_')
      .replace(/^_|_$/g, '');
  };

  const getServiceTypeKey = (serviceType) => {
  // Always normalize the name, ignore hex keys
  const candidate = serviceType?.name || '';
  return normalizeKey(candidate);
  };

  const getServiceTypeName = (serviceType) => {
  const key = getServiceTypeKey(serviceType);
  return t(`transportationBooking.serviceTypeNames.${key}`, { defaultValue: serviceType?.name || '' });
  };

  const getServiceTypeDescription = (serviceType) => {
  const key = getServiceTypeKey(serviceType);
  return t(`transportationBooking.serviceTypeDescriptions.${key}`, { defaultValue: serviceType?.description || '' });
  };

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);

        // If service and hotel are passed via state, use them
        if (passedService && passedHotel) {
          setService(passedService);
          setHotel(passedHotel);
          setLoading(false);
          return;
        }

        // Otherwise fetch hotel details and transportation service
        if (hotelId) {
          const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
          setHotel(hotelResponse.data.data);

          // Fetch transportation services with vehicles for this hotel
          const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/transportation/vehicles`);

          const responseData = servicesResponse.data.data;
          const transportationServices = responseData?.services || [];

          // Add detailed logging of the first service to see full structure
          if (transportationServices.length > 0) {
            if (transportationServices[0].transportationItems?.length > 0) {
            }
          }

          if (transportationServices && transportationServices.length > 0) {
            // Store all available services
            setServices(transportationServices);
            // Keep the first service as primary for backwards compatibility
            setService(transportationServices[0]);
          } else {
            // Show specific error message for transportation services
            const errorMessage = '🚗 Transportation services are currently unavailable.\n\nNo vehicles are configured for this hotel.\n\nPlease contact the hotel staff or try again later.';

            // Show browser alert for immediate attention
            alert(errorMessage);

            // Also show toast notification
            toast.error('🚗 Transportation services are currently unavailable. No vehicles are configured for this hotel.');

            // Add a delay before redirect to let user read the message
            setTimeout(() => {
              navigate(`/hotels/${hotelId}/categories`);
            }, 2000);
            return;
          }
        }

      } catch (error) {

        const errorMessage = '❌ Failed to load transportation services.\n\nPlease try again or contact support.\n\nError: ' + (error.response?.data?.message || error.message || 'Unknown error');

        // Show browser alert for immediate attention
        alert(errorMessage);

        // Also show toast notification
        toast.error('❌ Failed to load transportation services. Please try again or contact support.');

        // Add a delay before redirect to let user read the message
        setTimeout(() => {
          navigate(`/hotels/${hotelId}/categories`);
        }, 2000);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [hotelId, passedService, passedHotel, navigate, t]);

  // Get available transportation vehicles from all services (combine vehicles from all service providers)
  const getAvailableTransportationVehicles = () => {
    let allVehicles = [];

    // If using all services (fetched from API)
    if (services && services.length > 0) {
      services.forEach(svc => {
        if (svc?.transportationItems && svc.transportationItems.length > 0) {
          const serviceVehicles = svc.transportationItems
            .filter(vehicle => vehicle.isAvailable)
            .map(vehicle => ({
              ...vehicle,
              category: vehicle.category || 'other',
              id: `${svc._id}_${vehicle.vehicleType.toLowerCase().replace(/\s+/g, '_')}`, // Unique ID with service prefix
              serviceId: svc._id, // Track which service this vehicle belongs to
              serviceName: svc.name,
            }));
          allVehicles = [...allVehicles, ...serviceVehicles];
        }
      });
    }

    // Fallback: if only single service is available (passed via props)
    else if (service?.transportationItems && service.transportationItems.length > 0) {
      allVehicles = service.transportationItems
        .filter(vehicle => vehicle.isAvailable)
        .map(vehicle => ({
          ...vehicle,
          category: vehicle.category || 'other',
          id: `${service._id}_${vehicle.vehicleType.toLowerCase().replace(/\s+/g, '_')}`,
          serviceId: service._id,
          serviceName: service.name,
        }));
    }

    return allVehicles;
  };

  // Get available service types for a vehicle
  const getAvailableServiceTypes = (vehicleId) => {
    const allVehicles = getAvailableTransportationVehicles();
    const vehicle = allVehicles.find(v => v.id === vehicleId);

    if (!vehicle) return [];

    // Return all service types, don't filter by price since user doesn't want to see prices
    return vehicle.serviceTypes || [];
  };

  const handleServiceTypeChange = (vehicleId, serviceType) => {
    setServiceTypes(prev => ({ ...prev, [vehicleId]: serviceType }));
  };

  // Choose a vehicle type from dropdown (single-selection quick add)
  const handleVehicleTypeChoose = (vehicleId) => {
    setSelectedVehicleTypeId(vehicleId);
    if (!vehicleId) {
      setSelectedVehicles([]);
      setServiceTypes({});
      return;
    }

    const allVehicles = getAvailableTransportationVehicles();
    const vehicle = allVehicles.find(v => v.id === vehicleId);
    if (!vehicle) return;

    // Select the chosen vehicle with quantity 1
    setSelectedVehicles([{ ...vehicle, quantity: 1 }]);

    // Set default service type for selected vehicle
    const available = getAvailableServiceTypes(vehicle.id);
    if (available.length > 0) {
      setServiceTypes({ [vehicle.id]: available[0].id });
    } else {
      setServiceTypes({});
    }
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    try {
      setSubmitting(true);

      // Get the first selected vehicle for the booking request
      const selectedVehicle = selectedVehicles[0];
      if (!selectedVehicle) {
        toast.error('Please select a vehicle first');
        return;
      }

      // Map frontend vehicle types to backend enum values
      const mapVehicleType = (frontendType) => {
        const typeMapping = {
          'economy_sedan': 'sedan',
          'comfort_sedan': 'sedan',
          'premium_sedan': 'sedan',
          'economy_suv': 'suv',
          'comfort_suv': 'suv',
          'premium_suv': 'suv',
          'van': 'van',
          'minibus': 'minibus',
          'hatchback': 'hatchback',
          'luxury_car': 'luxury_car',
          'pickup_truck': 'pickup_truck'
        };
        return typeMapping[frontendType] || 'sedan'; // Default to sedan
      };

      // Map frontend categories to backend comfort levels
      const mapComfortLevel = (category) => {
        const comfortMapping = {
          'economy': 'economy',
          'comfort': 'comfort',
          'premium': 'premium',
          'other': 'economy' // Default fallback
        };
        return comfortMapping[category] || 'economy'; // Default to economy
      };

      const bookingData = {
        serviceId: service?._id,
        hotelId,
        tripDetails: {
          pickupLocation: formatHotelAddress(passedHotel || hotel),
          destination: bookingDetails.dropoffLocation,
          scheduledDateTime: `${bookingDetails.pickupDate}T${bookingDetails.pickupTime}:00.000Z`,
          passengerCount: bookingDetails.passengerCount || 1,
          luggageCount: bookingDetails.luggageCount || 0
        },
        vehicleDetails: {
          vehicleType: mapVehicleType(selectedVehicle.vehicleType),
          comfortLevel: mapComfortLevel(selectedVehicle.category || 'economy')
        },
        guestNotes: bookingDetails.specialRequests || ''
      };

      // Use the transportation booking endpoint
      await apiClient.post('/transportation-bookings/guest', bookingData);

      toast.success(t('transportationBooking.bookingRequestSuccess'));
  navigate('/my-transportation-bookings?tab=waitingForQuote');

    } catch (error) {
      toast.error(error.response?.data?.message || t('transportationBooking.bookingError'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(`/hotels/${hotelId}/categories`);
    }
  };

  const canProceedToNext = () => {
    switch (step) {
      case 1:
        return selectedVehicles.length > 0;
      case 2:
        return selectedVehicles.every(vehicle => serviceTypes[vehicle.id]);
      case 3:
        return bookingDetails.pickupDate && bookingDetails.pickupTime && (passedHotel || hotel);
      default:
        return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Transportation Service</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('transportationBooking.loadingService')}</p>
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Header with Backdrop */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B5787] via-[#4a6694] to-[#3B5787] opacity-5"></div>

        {/* Header Content */}
        <div className="relative w-full px-4 pt-6 pb-8">
          {/* Back Button - Modern Style */}
          <button
            onClick={handleBack}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#3B5787] bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mb-6"
          >
            <FaArrowLeft className={`${isRTL ? 'transform rotate-180 ml-2' : 'mr-2'} text-xs`} />
            <span>Back</span>
          </button>

          {/* Modern Header Card - Mobile Optimized */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 mb-6">
            {/* Header Image with Overlay - Compact for Mobile */}
            <div className="relative h-32 sm:h-48">
              <img
                src="https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&h=400&fit=crop&crop=center"
                alt="Transportation Services"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('bg-gradient-to-br', 'from-[#3B5787]', 'to-[#2d4265]');
                }}
              />

              {/* Floating Icon */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                <FaCar className="text-lg sm:text-2xl text-[#3B5787]" />
              </div>
            </div>

            {/* Modern Header Content - Compact */}
            <div className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full"></div>
                  <span className="text-xs font-medium text-[#3B5787] uppercase tracking-wider">
                    {t('guestCategories.travelService')}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {t('transportationBooking.title')}
                </h1>

                {/* Modern Stats/Features - Mobile Optimized */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#3B5787]/10 to-[#4a6694]/10 rounded-lg sm:rounded-xl">
                    <FaCar className="text-[#3B5787] text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.multipleVehicles')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl">
                    <FaCheck className="text-green-600 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.reliableService')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl">
                    <FaClock className="text-blue-600 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.available247')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Compact Progress Bar */}
      <div className="w-full px-4 py-4">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 px-4 py-3 mb-6">
          <div className="relative">
            {/* Progress Track */}
            <div className="w-full h-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full transition-all duration-700 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Step Indicators */}
            <div className="absolute top-0 left-0 w-full flex justify-between transform -translate-y-1/2">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= stepNum
                    ? 'bg-[#3B5787] border-[#3B5787] text-white shadow-lg'
                    : step === stepNum
                    ? 'bg-white border-[#3B5787] text-[#3B5787] shadow-md'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step > stepNum ? <FaCheck className="w-3 h-3" /> : stepNum}
                </div>
              ))}
            </div>
          </div>

          {/* Step Labels */}
          <div className="grid grid-cols-4 gap-2 mt-6 text-center">
            {[
              { key: 'selectVehicles', icon: FaCar },
              { key: 'serviceTypes', icon: FaCheck },
              { key: 'schedule', icon: FaCalendarAlt },
              { key: 'confirm', icon: FaCheck }
            ].map((item, index) => {
              const stepNum = index + 1;
              const isActive = step >= stepNum;

              return (
                <div key={item.key} className={`transition-all duration-200 ${
                  isActive ? 'text-[#3B5787]' : 'text-gray-500'
                }`}>
                  <div className="text-xs font-medium">
                    {t(`transportationBooking.${item.key}`)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content Container - Modern Layout */}
      <div className="w-full px-2 sm:px-3 lg:px-4 pb-32 lg:pb-8">
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 lg:gap-8">
          {/* Main Content Area - Takes 3 columns on XL screens */}
          <div className="xl:col-span-3">

            {step === 1 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
                {/* Compact Header */}
                <div className="mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                    {t('transportationBooking.selectTransportationVehicles')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">Choose your preferred vehicle type</p>
                </div>

                {/* Check if any vehicles are available */}
                {(() => {
                  const availableVehicles = getAvailableTransportationVehicles();
                  if (availableVehicles.length === 0) {
                    return (
                      <div className="text-center py-8 sm:py-12">
                        <FaCar className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          {t('transportationBooking.noVehiclesAvailable')}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {t('transportationBooking.noVehiclesDescription')}
                        </p>
                        <button
                          onClick={() => navigate(`/hotels/${hotelId}/categories`)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-[#3B5787] hover:bg-[#2d4265] transition-colors"
                        >
                          <FaArrowLeft className="mr-2" />
                          {t('transportationBooking.backToServices')}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Compact Mobile Vehicle Selection Cards */}
                {getAvailableTransportationVehicles().length > 0 && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
                      {getAvailableTransportationVehicles().map(vehicle => {
                        const capacity = vehicle.capacity ? (typeof vehicle.capacity === 'object' ? vehicle.capacity.passengers : vehicle.capacity) : 'N/A';
                        const isSelected = selectedVehicleTypeId === vehicle.id;

                        // Get vehicle image URL with smart distribution for variety
                        const getVehicleImage = (vehicleType, vehicleId) => {
                          // Available images in order of preference for variety
                          const availableImages = [
                            '/car-image/EconomyCompact Car.jpg',
                            '/car-image/SedanMidsize.png',
                            '/car-image/SUVCrossover.jpg',
                            '/car-image/Premium Suv.png',
                            '/car-image/LuxuryPremium.png',
                            '/car-image/van.jpg',
                            '/car-image/Large Vehicle.png'
                          ];

                          // Primary mapping based on vehicle type
                          const primaryImageMap = {
                            // Economy types
                            'economy': '/car-image/EconomyCompact Car.jpg',
                            'compact': '/car-image/EconomyCompact Car.jpg',
                            'economy_sedan': '/car-image/EconomyCompact Car.jpg',
                            'eco_vehicle': '/car-image/EconomyCompact Car.jpg',
                            'local_taxi': '/car-image/EconomyCompact Car.jpg',

                            // Sedan types
                            'sedan': '/car-image/SedanMidsize.png',
                            'midsize': '/car-image/SedanMidsize.png',
                            'comfort_sedan': '/car-image/SedanMidsize.png',
                            'standard_sedan': '/car-image/SedanMidsize.png',
                            'shared_ride': '/car-image/SedanMidsize.png',

                            // SUV types
                            'suv': '/car-image/SUVCrossover.jpg',
                            'crossover': '/car-image/SUVCrossover.jpg',
                            'premium_suv': '/car-image/Premium Suv.png',
                            'large_suv': '/car-image/Premium Suv.png',
                            'luxury_suv': '/car-image/Premium Suv.png',
                            'full_size_suv': '/car-image/Premium Suv.png',

                            // Luxury types
                            'luxury': '/car-image/LuxuryPremium.png',
                            'premium': '/car-image/LuxuryPremium.png',
                            'executive': '/car-image/LuxuryPremium.png',
                            'luxury_vehicle': '/car-image/LuxuryPremium.png',
                            'convertible': '/car-image/LuxuryPremium.png',
                            'sports': '/car-image/LuxuryPremium.png',

                            // Van/MPV types - Updated to use new van.jpg and LargeVan.jpg
                            'van': '/car-image/van.jpg',
                            'minivan': '/car-image/van.jpg',
                            'mpv': '/car-image/van.jpg',
                            'van_large': '/car-image/LargeVan.jpg',
                            'passenger_van': '/car-image/LargeVan.jpg',
                            'accessible_vehicle': '/car-image/van.jpg',

                            // Large vehicle types
                            'bus': '/car-image/Large Vehicle.png',
                            'coach': '/car-image/Large Vehicle.png',
                            'shuttle': '/car-image/Large Vehicle.png',
                            'truck': '/car-image/Large Vehicle.png',
                            'pickup': '/car-image/Large Vehicle.png',
                            'large_vehicle': '/car-image/Large Vehicle.png'
                          };

                          // Clean vehicle type for matching
                          const cleanVehicleType = vehicleType.toLowerCase().replace(/[^a-z0-9]/g, '_');

                          // Get primary image
                          let primaryImage = primaryImageMap[cleanVehicleType] || primaryImageMap[vehicleType.toLowerCase()];

                          // If no primary match, create variety using vehicle ID hash
                          if (!primaryImage) {
                            // Create a simple hash from vehicleId for consistent but varied image selection
                            const hash = vehicleId ? vehicleId.split('').reduce((a, b) => {
                              a = ((a << 5) - a) + b.charCodeAt(0);
                              return a & a;
                            }, 0) : 0;

                            const imageIndex = Math.abs(hash) % availableImages.length;
                            primaryImage = availableImages[imageIndex];
                          }

                          // Add some variety for taxi/cab types based on ID
                          if (vehicleType.toLowerCase().includes('taxi') || vehicleType.toLowerCase().includes('cab')) {
                            if (vehicleId && vehicleId.includes('1')) {
                              return '/car-image/EconomyCompact Car.jpg';
                            } else if (vehicleId && vehicleId.includes('2')) {
                              return '/car-image/SedanMidsize.png';
                            }
                          }

                          return primaryImage || '/car-image/EconomyCompact Car.jpg';
                        };

                        return (
                          <div
                            key={vehicle.id}
                            className={`relative border-2 rounded-xl cursor-pointer transition-all duration-300 overflow-hidden group ${
                              isSelected
                                ? 'border-[#3B5787] bg-gradient-to-br from-[#3B5787]/5 to-[#4a6694]/10 shadow-lg'
                                : 'border-gray-200 hover:border-[#3B5787]/50 hover:shadow-md bg-white/90'
                            }`}
                            onClick={() => handleVehicleTypeChoose(vehicle.id)}
                          >
                            {/* Selection Indicator */}
                            {isSelected && (
                              <div className="absolute top-2 right-2 z-10 w-5 h-5 bg-[#3B5787] rounded-full flex items-center justify-center shadow-lg">
                                <FaCheck className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}

                            {/* Compact Vehicle Image */}
                            <div className="relative h-20 sm:h-24 lg:h-28 overflow-hidden">
                              <img
                                src={getVehicleImage(vehicle.vehicleType, vehicle.id)}
                                alt={getVehicleTypeName(vehicle.vehicleType)}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.parentElement.classList.add('bg-gradient-to-br', 'from-[#3B5787]', 'to-[#2d4265]');
                                  e.target.parentElement.innerHTML = `<div class="flex items-center justify-center h-full"><div class="text-white text-2xl">${getVehicleIcon(vehicle.vehicleType)}</div></div>`;
                                }}
                              />

                              {/* Subtle Gradient Overlay */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>

                              {/* Compact Vehicle Icon Badge */}
                              <div className="absolute bottom-1 left-1 p-1 bg-white/95 backdrop-blur-sm rounded-md shadow-sm">
                                <div className="text-[#3B5787] text-xs">
                                  {getVehicleIcon(vehicle.vehicleType)}
                                </div>
                              </div>
                            </div>

                            {/* Compact Vehicle Details */}
                            <div className="p-2 sm:p-3">
                              <div className="mb-1">
                                <h3 className="font-semibold text-gray-900 text-xs sm:text-sm leading-tight line-clamp-1">
                                  {getVehicleTypeName(vehicle.vehicleType)}
                                </h3>
                                <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5 hidden sm:block">
                                  Perfect choice
                                </p>
                              </div>

                              {/* Compact Features - Mobile Optimized */}
                              <div className="flex items-center justify-between text-[10px] sm:text-xs">
                                <div className="flex items-center space-x-1 sm:space-x-2">
                                  {/* Passenger Capacity - Compact */}
                                  <div className="flex items-center text-gray-500">
                                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                    </svg>
                                    <span className="hidden sm:inline">up to </span>
                                    <span>{capacity}</span>
                                  </div>

                                  {/* Luggage - Mobile: Icon only, Desktop: Full */}
                                  <div className="flex items-center text-gray-500">
                                    <svg className="w-3 h-3 mr-0.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm0 2h12v8H4V6z" clipRule="evenodd" />
                                    </svg>
                                    <span className="sm:hidden">{Math.min(parseInt(capacity) || 3, 5)}</span>
                                    <span className="hidden sm:inline">up to {Math.min(parseInt(capacity) || 3, 5)}</span>
                                  </div>
                                </div>

                                {/* Estimated Time - Compact */}
                                <div className="text-[#3B5787] font-medium">
                                  <FaClock className="inline w-2.5 h-2.5 mr-1" />
                                  <span className="hidden sm:inline">{Math.floor(Math.random() * 10) + 5} min</span>
                                  <span className="sm:hidden">{Math.floor(Math.random() * 10) + 5}m</span>
                                </div>
                              </div>

                              {/* Mobile Selection Indicator */}
                              {isSelected && (
                                <div className="mt-1 text-center">
                                  <div className="inline-flex items-center text-[10px] text-[#3B5787] font-medium">
                                    <FaCheck className="w-2 h-2 mr-1" />
                                    <span>Selected</span>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Selection Overlay */}
                            {isSelected && (
                              <div className="absolute inset-0 bg-[#3B5787]/5 pointer-events-none rounded-xl"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Compact Additional Features */}
                    <div className="mt-4 p-3 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                      <div className="flex flex-col sm:flex-row sm:items-center text-xs sm:text-sm text-gray-700 space-y-1 sm:space-y-0">
                        <div className="flex items-center">
                          <FaCheck className="text-green-600 mr-2 flex-shrink-0 w-3 h-3" />
                          <span className="font-medium">Free cancellation 24h before</span>
                        </div>
                        <div className="flex items-center sm:ml-4">
                          <FaCheck className="text-green-600 mr-2 flex-shrink-0 w-3 h-3" />
                          <span className="font-medium">Meeting with nameplate</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
                {/* Modern Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3B5787] to-[#2d4265] rounded-2xl flex items-center justify-center shadow-lg">
                      <FaCheck className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                        {t('transportationBooking.chooseServiceTypes')}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">{t('guest.transportation.selectPreferredServiceType')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  {selectedVehicles.map(vehicle => (
                    <div key={vehicle.id} className="bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm">
                      {/* Vehicle Info Header */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-8 h-8 bg-[#3B5787] rounded-lg flex items-center justify-center">
                          <FaCar className="text-white text-sm" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base">{getVehicleTypeName(vehicle.vehicleType)}</h4>
                          <p className="text-xs sm:text-sm text-gray-600">{t('transportationBooking.quantity')}: {vehicle.quantity}</p>
                        </div>
                      </div>

                      {/* Modern Service Type Grid - Two Columns on Mobile */}
                      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                        {getAvailableServiceTypes(vehicle.id).map(serviceType => {
                          const isSelected = serviceTypes[vehicle.id] === serviceType.id;

                          return (
                            <div
                              key={serviceType.id}
                              className={`relative p-3 sm:p-4 rounded-xl cursor-pointer transition-all duration-300 border-2 ${
                                isSelected
                                  ? 'border-[#3B5787] bg-gradient-to-br from-[#3B5787]/5 to-[#3B5787]/10 shadow-lg'
                                  : 'border-gray-200 bg-white hover:border-[#3B5787]/30 hover:shadow-md hover:bg-gray-50'
                              }`}
                              onClick={() => handleServiceTypeChange(vehicle.id, serviceType.id)}
                            >
                              {/* Selection Indicator */}
                              {isSelected && (
                                <div className="absolute top-2 right-2 w-5 h-5 bg-[#3B5787] rounded-full flex items-center justify-center">
                                  <FaCheck className="w-2.5 h-2.5 text-white" />
                                </div>
                              )}

                              <div className="text-center">
                                <h5 className="font-semibold text-gray-900 text-xs sm:text-sm mb-1 leading-tight">
                                  {getServiceTypeName(serviceType)}
                                </h5>
                                <p className="text-[10px] sm:text-xs text-gray-600 mb-2 line-clamp-2">
                                  {getServiceTypeDescription(serviceType)}
                                </p>

                                {/* Duration Badge */}
                                <div className="inline-flex items-center gap-1 px-2 py-1 bg-gradient-to-r from-[#3B5787]/10 to-[#3B5787]/20 rounded-full">
                                  <FaClock className="w-2.5 h-2.5 text-[#3B5787]" />
                                  <span className="text-[10px] sm:text-xs font-medium text-[#3B5787]">
                                    {serviceType.duration}
                                  </span>
                                </div>
                              </div>

                              {/* Selected State Overlay */}
                              {isSelected && (
                                <div className="absolute inset-0 bg-[#3B5787]/5 rounded-xl pointer-events-none" />
                              )}
                            </div>
                          );
                        })}

                        {/* No Service Types Available */}
                        {getAvailableServiceTypes(vehicle.id).length === 0 && (
                          <div className="col-span-2 lg:col-span-3 p-4 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 text-center">
                            <div className="text-gray-500">
                              <FaClock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                              <p className="text-sm font-medium">{t('transportationBooking.noServiceTypesAvailable')}</p>
                              <p className="text-xs mt-1">Please contact support for assistance</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Selected Summary */}
                {Object.keys(serviceTypes).length > 0 && (
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
                    <div className="flex items-center gap-3 mb-2">
                      <FaCheck className="w-5 h-5 text-green-600" />
                      <h3 className="font-semibold text-gray-800">{t('guest.transportation.serviceTypesSelected')}</h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {t('guest.transportation.vehiclesConfigured', { count: Object.keys(serviceTypes).length })}
                    </p>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
                {/* Modern Header */}
                <div className="mb-6">
                  <div className="flex items-center gap-4 mb-2">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#3B5787] to-[#2d4265] rounded-2xl flex items-center justify-center shadow-lg">
                      <FaCalendarAlt className="text-white text-xl" />
                    </div>
                    <div>
                      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                        {t('transportationBooking.scheduleService')}
                      </h2>
                      <p className="text-gray-600 text-sm mt-1">{t('guest.transportation.setPickupDetails')}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Pickup Date & Time Section */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaCalendarAlt className="text-[#3B5787]" />
                      {t('guest.transportation.pickupSchedule')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline mr-2 text-[#3B5787]" />
                          {t('transportationBooking.pickupDate')}
                        </label>
                        <input
                          type="date"
                          value={bookingDetails.pickupDate}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, pickupDate: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3B5787] focus:border-[#3B5787] transition-all duration-200 bg-white/90 backdrop-blur-sm"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaClock className="inline mr-2 text-[#3B5787]" />
                          {t('transportationBooking.pickupTime')}
                        </label>
                        <input
                          type="time"
                          value={bookingDetails.pickupTime}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, pickupTime: e.target.value }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3B5787] focus:border-[#3B5787] transition-all duration-200 bg-white/90 backdrop-blur-sm"
                          placeholder="Select your preferred pickup time"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Location Section */}
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaMapMarkerAlt className="text-green-600" />
                      {t('guest.transportation.locationDetails')}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaMapMarkerAlt className="inline mr-2 text-green-600" />
                          {t('transportationBooking.location')}
                        </label>
                        <div className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl bg-gray-50 text-gray-700 font-medium">
                          {formatHotelAddress(passedHotel || hotel)}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaMapMarkerAlt className="inline mr-2 text-red-500" />
                          {t('transportationBooking.dropoffLocation')}
                        </label>
                        <input
                          type="text"
                          value={bookingDetails.dropoffLocation}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                          placeholder={t('transportationBooking.placeholders.dropoffAddress')}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 bg-white/90 backdrop-blur-sm"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Round Trip Section - Only show when round trip selected */}
                  {selectedVehicles.some(v => serviceTypes[v.id]?.includes('round_trip')) && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 border border-purple-200">
                      <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FaArrowLeft className="text-purple-600" />
                        Return Trip Details
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaCalendarAlt className="inline mr-2 text-purple-600" />
                            {t('transportationBooking.returnDate')}
                          </label>
                          <input
                            type="date"
                            value={bookingDetails.returnDate}
                            onChange={(e) => setBookingDetails(prev => ({ ...prev, returnDate: e.target.value }))}
                            min={bookingDetails.pickupDate || new Date().toISOString().split('T')[0]}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/90 backdrop-blur-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <FaClock className="inline mr-2 text-purple-600" />
                            {t('transportationBooking.returnTime')}
                          </label>
                          <input
                            type="time"
                            value={bookingDetails.returnTime}
                            onChange={(e) => setBookingDetails(prev => ({ ...prev, returnTime: e.target.value }))}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200 bg-white/90 backdrop-blur-sm"
                            placeholder="Select your preferred return time"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Passenger & Luggage Section */}
                  <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4 border border-orange-200">
                    <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                      <FaCar className="text-orange-600" />
                      {t('guest.transportation.passengerDetails')}
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          👥 {t('transportationBooking.passengerCount')}
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={bookingDetails.passengerCount}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, passengerCount: parseInt(e.target.value) || 1 }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/90 backdrop-blur-sm text-center font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          🧳 {t('transportationBooking.luggageCount')}
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={bookingDetails.luggageCount}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, luggageCount: parseInt(e.target.value) || 0 }))}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white/90 backdrop-blur-sm text-center font-semibold"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Special Requests Section */}
                  <div className="bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl p-4 border border-gray-200">
                    <label className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <FaStickyNote className="text-[#3B5787]" />
                      {t('transportationBooking.specialRequests')}
                    </label>
                    <textarea
                      value={bookingDetails.specialRequests}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder={t('transportationBooking.specialRequestsPlaceholder')}
                      rows="3"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#3B5787] focus:border-[#3B5787] transition-all duration-200 bg-white/90 backdrop-blur-sm resize-none"
                    />
                  </div>

                  {/* Schedule Summary */}
                  {bookingDetails.pickupDate && bookingDetails.pickupTime && (
                    <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#3B5787]/10 rounded-xl p-4 border border-[#3B5787]/20">
                      <div className="flex items-center gap-3 mb-2">
                        <FaCheck className="w-5 h-5 text-[#3B5787]" />
                        <h3 className="font-semibold text-gray-800">Schedule Confirmed</h3>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Date:</strong> {bookingDetails.pickupDate}</p>
                        <p><strong>Time:</strong> {bookingDetails.pickupTime}</p>
                        <p><strong>Passengers:</strong> {bookingDetails.passengerCount} • <strong>Luggage:</strong> {bookingDetails.luggageCount}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('transportationBooking.confirmBooking')}
                </h2>

                <div className="space-y-6">
                  {/* Order Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('transportationBooking.orderSummary')}</h3>
                    <div className="space-y-3">
                      {selectedVehicles.map(vehicle => (
                        <div key={vehicle.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center">
                            <div>
                              <span className="font-medium">{getVehicleTypeName(vehicle.vehicleType)}</span>
                              <span className="text-gray-500 ml-2">×{vehicle.quantity}</span>
                              <div className="text-sm text-gray-600">
                                {vehicle.category || 'Economy'}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600">{t('guest.transportation.quotePending')}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('transportationBooking.scheduleLocation')}</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>{t('transportationBooking.pickupDate')}:</strong> {bookingDetails.pickupDate}</p>
                      <p><strong>{t('transportationBooking.pickupTime')}:</strong> {bookingDetails.pickupTime}</p>
                      <p><strong>{t('transportationBooking.pickup')}:</strong> {formatHotelAddress(passedHotel || hotel)}</p>
                      <p><strong>{t('transportationBooking.dropoff')}:</strong> {bookingDetails.dropoffLocation || t('transportationBooking.notSpecified')}</p>
                      {bookingDetails.returnDate && (
                        <>
                          <p><strong>{t('transportationBooking.returnDate')}:</strong> {bookingDetails.returnDate}</p>
                          <p><strong>{t('transportationBooking.returnTime')}:</strong> {bookingDetails.returnTime}</p>
                        </>
                      )}
                      <p><strong>{t('transportationBooking.passengers')}:</strong> {bookingDetails.passengerCount}</p>
                      <p><strong>{t('transportationBooking.luggage')}:</strong> {bookingDetails.luggageCount}</p>
                      {bookingDetails.specialRequests && (
                        <p><strong>{t('transportationBooking.specialRequests')}:</strong> {bookingDetails.specialRequests}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation and Choose Service Types button - Desktop Only */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              {selectedVehicles.length > 0 && (
                <div className="mt-6 space-y-3">
                  {step < 4 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceedToNext()}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      {step === 1 && t('transportationBooking.nextStep')}
                      {step === 2 && t('transportationBooking.scheduleStep')}
                      {step === 3 && t('transportationBooking.reviewStep')}
                    </button>
                  ) : (
                    <button
                      onClick={handleBookingSubmit}
                      disabled={submitting}
                      className="w-full bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          {t('transportationBooking.booking')}
                        </>
                      ) : (
                        t('transportationBooking.confirmStep')
                      )}
                    </button>
                  )}

                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      {t('transportationBooking.back')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bottom Button - Only show when vehicle selected */}
      {selectedVehicleTypeId && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg z-50">
          <div className="max-w-lg mx-auto space-y-3">
            {step < 4 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNext()}
                className="w-full bg-gradient-to-r from-[#3B5787] to-[#2d4265] hover:from-[#2d4265] hover:to-[#1e2d47] disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              >
                {step === 1 && (
                  <>
                    <FaArrowRight className="w-4 h-4" />
                    {t('transportationBooking.nextStep')}
                  </>
                )}
                {step === 2 && (
                  <>
                    <FaCalendarAlt className="w-4 h-4" />
                    {t('transportationBooking.scheduleStep')}
                  </>
                )}
                {step === 3 && (
                  <>
                    <FaCheck className="w-4 h-4" />
                    {t('transportationBooking.reviewStep')}
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={handleBookingSubmit}
                disabled={submitting}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl disabled:shadow-none flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin w-4 h-4" />
                    {t('transportationBooking.booking')}
                  </>
                ) : (
                  <>
                    <FaCheck className="w-4 h-4" />
                    {t('transportationBooking.confirmStep')}
                  </>
                )}
              </button>
            )}

            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="w-full bg-white/90 backdrop-blur-sm border-2 border-gray-200 text-gray-700 hover:bg-white hover:border-[#3B5787]/30 font-medium py-3 px-6 rounded-xl transition-all duration-300 flex items-center justify-center gap-2"
              >
                <FaArrowLeft className="w-4 h-4" />
                {t('transportationBooking.back')}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default TransportationBookingPage;
