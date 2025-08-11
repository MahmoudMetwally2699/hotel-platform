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
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaCar,
  FaArrowLeft,
  FaPlus,
  FaMinus,
  FaSpinner,
  FaCheck,
  FaClock,
  FaBolt,
  FaCalculator,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaStickyNote
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import useRTL from '../../hooks/useRTL';
import { formatPriceByLanguage } from '../../utils/currency';

const TransportationBookingPage = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { hotelId } = useParams();

  // Get service and hotel from location state
  const { service: passedService, hotel: passedHotel } = location.state || {};

  const [service, setService] = useState(passedService || null);
  const [services, setServices] = useState([]); // Store all available services
  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking State
  const [step, setStep] = useState(1); // 1: Vehicles, 2: Service Types, 3: Details, 4: Confirmation
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [serviceTypes, setServiceTypes] = useState({});
  const [expressSurcharge, setExpressSurcharge] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    dropoffLocation: '',
    returnDate: '', // For round-trip bookings
    returnTime: '',
    specialRequests: '',
    passengerCount: 1,
    luggageCount: 0
  });
  // Helper functions to translate vehicle category and type names
  const getVehicleCategoryName = (category) => {
    return t(`transportationBooking.vehicleCategories.${category}`, { defaultValue: category });
  };

  const getVehicleTypeName = (vehicleType) => {
    // Convert vehicle type to key format (lowercase, handle special characters)
    const vehicleKey = vehicleType
      .toLowerCase()
      .replace(/\s+/g, '_')        // Replace spaces with underscores
      .replace(/[()]/g, '_')       // Replace parentheses with underscores
      .replace(/-/g, '_')          // Replace hyphens with underscores
      .replace(/_{2,}/g, '_')      // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, '');      // Remove leading/trailing underscores

    console.log(`🚗 Translating vehicle: "${vehicleType}" -> key: "${vehicleKey}"`);
    const translated = t(`transportationBooking.vehicleTypes.${vehicleKey}`, { defaultValue: vehicleType });
    console.log(`🚗 Translation result: "${translated}"`);

    return translated;
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

          console.log('🚗 Transportation services response:', {
            success: servicesResponse.data.success,
            totalServices: transportationServices.length,
            services: transportationServices.map(s => ({ id: s._id, name: s.name, category: s.category }))
          });

          // Add detailed logging of the first service to see full structure
          if (transportationServices.length > 0) {
            console.log('🚗 Full first service structure:', transportationServices[0]);
            console.log('🚗 Service has transportationItems:', !!transportationServices[0].transportationItems);
            console.log('🚗 TransportationItems count:', transportationServices[0].transportationItems?.length || 0);
            if (transportationServices[0].transportationItems?.length > 0) {
              console.log('🚗 First transportation vehicle:', transportationServices[0].transportationItems[0]);
            }
          }

          if (transportationServices && transportationServices.length > 0) {
            // Store all available services
            setServices(transportationServices);
            // Keep the first service as primary for backwards compatibility
            setService(transportationServices[0]);
          } else {
            toast.error(t('errors.loadServices'));
            navigate(`/hotels/${hotelId}/categories`);
            return;
          }
        }

      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error(t('errors.loadServices'));
        navigate(`/hotels/${hotelId}/categories`);
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
          id: `${service._id}_${vehicle.vehicleType.toLowerCase().replace(/\s+/g, '_')}`,
          serviceId: service._id,
          serviceName: service.name,
        }));
    }

    console.log('🚗 Available transportation vehicles:', allVehicles.length, allVehicles.map(v => ({ id: v.id, type: v.vehicleType, category: v.category })));
    return allVehicles;
  };

  // Get available service types for a vehicle
  const getAvailableServiceTypes = (vehicleId) => {
    const allVehicles = getAvailableTransportationVehicles();
    const vehicle = allVehicles.find(v => v.id === vehicleId);

    if (!vehicle) return [];

    return vehicle.serviceTypes?.filter(st => st.isAvailable && st.price > 0) || [];
  };

  // Vehicle selection handlers
  const handleVehicleAdd = (vehicle) => {
    const existingVehicle = selectedVehicles.find(selected => selected.id === vehicle.id);
    if (existingVehicle) {
      setSelectedVehicles(prev =>
        prev.map(selected =>
          selected.id === vehicle.id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedVehicles(prev => [...prev, { ...vehicle, quantity: 1 }]);
    }

    // Set default service type
    if (!serviceTypes[vehicle.id]) {
      const availableServiceTypes = getAvailableServiceTypes(vehicle.id);
      if (availableServiceTypes.length > 0) {
        setServiceTypes(prev => ({ ...prev, [vehicle.id]: availableServiceTypes[0].id }));
      }
    }
  };

  const handleVehicleRemove = (vehicleId) => {
    const existingVehicle = selectedVehicles.find(selected => selected.id === vehicleId);
    if (existingVehicle && existingVehicle.quantity > 1) {
      setSelectedVehicles(prev =>
        prev.map(selected =>
          selected.id === vehicleId
            ? { ...selected, quantity: selected.quantity - 1 }
            : selected
        )
      );
    } else {
      setSelectedVehicles(prev => prev.filter(selected => selected.id !== vehicleId));
      setServiceTypes(prev => {
        const newTypes = { ...prev };
        delete newTypes[vehicleId];
        return newTypes;
      });
    }
  };

  const handleServiceTypeChange = (vehicleId, serviceType) => {
    setServiceTypes(prev => ({ ...prev, [vehicleId]: serviceType }));
  };

  // Calculate pricing with real service prices
  const calculatePricing = () => {
    let subtotal = 0;

    const vehicleCalculations = selectedVehicles.map(vehicle => {
      const availableServiceTypes = getAvailableServiceTypes(vehicle.id);
      const selectedServiceType = availableServiceTypes.find(st => st.id === serviceTypes[vehicle.id]);

      if (!selectedServiceType) {
        console.warn('No service type selected for vehicle:', vehicle.vehicleType);
        return {
          ...vehicle,
          serviceType: null,
          basePrice: 0,
          vehiclePrice: 0
        };
      }

      const vehiclePrice = (selectedServiceType?.price || 0) * vehicle.quantity;
      subtotal += vehiclePrice;

      return {
        ...vehicle,
        serviceType: selectedServiceType,
        basePrice: selectedServiceType?.price || 0, // Original service provider price
        vehiclePrice: vehiclePrice
      };
    });

    const expressCharge = expressSurcharge ? subtotal * 0.2 : 0; // 20% surcharge for express
    const total = subtotal + expressCharge; // Backend prices already include hotel markup

    return {
      vehicleCalculations,
      subtotal,
      expressCharge,
      total
    };
  };

  const pricing = calculatePricing();

  // Handle booking submission
  const handleBookingSubmit = async () => {
    try {
      setSubmitting(true);

      const bookingData = {
        serviceId: pricing.vehicleCalculations[0]?.serviceId || service?._id, // Use the service ID of the first vehicle
        hotelId,
        transportationItems: pricing.vehicleCalculations.map(vehicle => ({
          vehicleId: vehicle.id,
          vehicleType: vehicle.vehicleType,
          vehicleCategory: vehicle.category,
          quantity: vehicle.quantity,
          serviceTypeId: vehicle.serviceType.id,
          serviceTypeName: vehicle.serviceType.name,
          serviceTypeDescription: vehicle.serviceType.description,
          serviceTypeDuration: vehicle.serviceType.duration,
          basePrice: vehicle.basePrice,
          totalPrice: vehicle.vehiclePrice
        })),
        expressSurcharge: {
          enabled: expressSurcharge,
          rate: pricing.expressCharge
        },
        schedule: {
          pickupDate: bookingDetails.pickupDate,
          pickupTime: bookingDetails.pickupTime,
          returnDate: bookingDetails.returnDate,
          returnTime: bookingDetails.returnTime
        },
        location: {
          pickupLocation: bookingDetails.pickupLocation,
          dropoffLocation: bookingDetails.dropoffLocation,
          pickupInstructions: bookingDetails.specialRequests
        },
        guestDetails: {
          passengerCount: bookingDetails.passengerCount,
          luggageCount: bookingDetails.luggageCount,
          specialRequests: bookingDetails.specialRequests
        },
        paymentMethod: 'credit-card' // Default payment method
      };

      await apiClient.post('/client/bookings/transportation', bookingData);

      toast.success(t('transportationBooking.bookingSuccess'));
      navigate(`/my-orders`);

    } catch (error) {
      console.error('Error creating booking:', error);
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
        return bookingDetails.pickupDate && bookingDetails.pickupTime && bookingDetails.pickupLocation;
      default:
        return true;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('transportationBooking.loadingService')}</p>
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
            <div className="flex items-center">
              <button
                onClick={handleBack}
                className={`${isRTL ? 'ml-4' : 'mr-4'} p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors`}
              >
                <FaArrowLeft className={`text-xl ${isRTL ? 'transform rotate-180' : ''}`} />
              </button>
              <div className="flex items-center">
                <div className={`p-3 bg-blue-100 text-blue-600 rounded-lg ${isRTL ? 'ml-4' : 'mr-4'}`}>
                  <FaCar className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    {t('transportationBooking.title')}
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {service?.name} {t('categories.availableAt')} {hotel?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between max-w-lg mx-auto">
          {[1, 2, 3, 4].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className={`flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full text-sm sm:text-base ${
                step >= stepNum ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > stepNum ? <FaCheck className="w-4 h-4" /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`flex-1 h-0.5 mx-2 sm:mx-4 ${
                  step > stepNum ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="flex justify-center mt-2">
          <div className={`grid grid-cols-4 gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 w-full max-w-lg ${isRTL ? 'text-right' : 'text-left'}`}>
            <span className={`text-center leading-tight ${step >= 1 ? 'text-blue-600 font-medium' : ''}`}>{t('transportationBooking.selectVehicles')}</span>
            <span className={`text-center leading-tight ${step >= 2 ? 'text-blue-600 font-medium' : ''}`}>{t('transportationBooking.serviceTypes')}</span>
            <span className={`text-center leading-tight ${step >= 3 ? 'text-blue-600 font-medium' : ''}`}>{t('transportationBooking.schedule')}</span>
            <span className={`text-center leading-tight ${step >= 4 ? 'text-blue-600 font-medium' : ''}`}>{t('transportationBooking.confirm')}</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">

            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('transportationBooking.selectTransportationVehicles')}
                </h2>

                {/* Check if any vehicles are available */}
                {(() => {
                  const availableVehicles = getAvailableTransportationVehicles();
                  if (availableVehicles.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <FaCar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          {t('transportationBooking.noVehiclesAvailable')}
                        </h3>
                        <p className="text-gray-600 mb-4">
                          {t('transportationBooking.noVehiclesDescription')}
                        </p>
                        <button
                          onClick={() => navigate(`/hotels/${hotelId}/categories`)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <FaArrowLeft className="mr-2" />
                          {t('transportationBooking.backToServices')}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Only show categories if vehicles are available */}
                {getAvailableTransportationVehicles().length > 0 && (
                  <>
                    {/* Categories - Dynamically generated from available vehicles */}
                    {(() => {
                      const availableVehicles = getAvailableTransportationVehicles();

                      // Get unique categories from all available vehicles
                      const availableCategories = [...new Set(availableVehicles.map(vehicle => vehicle.category))];
                      console.log('🚗 Dynamic categories found:', availableCategories);

                      return availableCategories.map(category => {
                        const categoryVehicles = availableVehicles.filter(vehicle => vehicle.category === category);
                        console.log(`🚗 Category: ${category}, Vehicles found: ${categoryVehicles.length}`, categoryVehicles.map(v => v.vehicleType));
                        if (categoryVehicles.length === 0) return null;

                        return (
                          <div key={category} className="mb-8">
                            <h3 className="text-lg font-semibold text-gray-800 mb-4">
                              {getVehicleCategoryName(category)}
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {categoryVehicles.map(vehicle => {
                                const selectedVehicle = selectedVehicles.find(selected => selected.id === vehicle.id);
                                const quantity = selectedVehicle ? selectedVehicle.quantity : 0;
                                const isAvailable = vehicle.isAvailable !== false;
                                const availableServiceTypes = getAvailableServiceTypes(vehicle.id);
                                const hasAvailableServices = availableServiceTypes.length > 0;

                                return (
                                  <div
                                    key={vehicle.id}
                                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                      isAvailable && hasAvailableServices
                                        ? 'border-gray-200 hover:border-blue-300'
                                        : 'border-gray-200 bg-gray-50 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center">
                                      <div>
                                        <h4 className={`font-medium ${isAvailable && hasAvailableServices ? 'text-gray-900' : 'text-gray-500'}`}>
                                          {getVehicleTypeName(vehicle.vehicleType)}
                                          {!isAvailable && (
                                            <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                              {t('transportationBooking.unavailable')}
                                            </span>
                                          )}
                                          {isAvailable && !hasAvailableServices && (
                                            <span className="ml-2 text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                                              {t('transportationBooking.noServiceTypes')}
                                            </span>
                                          )}
                                        </h4>
                                        <p className={`text-sm ${isAvailable && hasAvailableServices ? 'text-gray-600' : 'text-gray-400'}`}>
                                          {availableServiceTypes.length > 0
                                            ? `From ${formatPriceByLanguage(Math.min(...availableServiceTypes.map(st => st.price)), i18n.language)}`
                                            : vehicle.basePrice ? formatPriceByLanguage(vehicle.basePrice, i18n.language) : t('transportationBooking.priceNotSet')
                                          }
                                        </p>
                                      </div>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => handleVehicleRemove(vehicle.id)}
                                        disabled={quantity === 0 || !isAvailable || !hasAvailableServices}
                                        className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        <FaMinus className="text-xs" />
                                      </button>
                                      <span className="w-8 text-center font-medium">{quantity}</span>
                                      <button
                                        onClick={() => handleVehicleAdd(vehicle)}
                                        disabled={!isAvailable || !hasAvailableServices}
                                        className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                      >
                                        <FaPlus className="text-xs" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                          </div>
                        );
                      });
                    })()}
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('transportationBooking.chooseServiceTypes')}
                </h2>

                <div className="space-y-6">
                  {selectedVehicles.map(vehicle => (
                    <div key={vehicle.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{getVehicleTypeName(vehicle.vehicleType)}</h4>
                          <p className="text-sm text-gray-600">{t('transportationBooking.quantity')}: {vehicle.quantity}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getAvailableServiceTypes(vehicle.id).map(serviceType => (
                          <div
                            key={serviceType.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              serviceTypes[vehicle.id] === serviceType.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleServiceTypeChange(vehicle.id, serviceType.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">
                                <div>
                                  <h5 className="font-medium text-gray-900">
                                    {serviceType.name}
                                  </h5>
                                  <p className="text-xs text-gray-600">{serviceType.description}</p>
                                  <p className="text-xs text-gray-500">
                                    <FaClock className="inline mr-1" />
                                    {serviceType.duration}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-medium text-gray-900">
                                  {formatPriceByLanguage(serviceType.price * vehicle.quantity, i18n.language)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Express Service Option */}
                <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaBolt className="text-yellow-500 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{t('transportationBooking.expressService')}</h4>
                        <p className="text-sm text-gray-600">{t('transportationBooking.expressDescription')}</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={expressSurcharge}
                        onChange={(e) => setExpressSurcharge(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-sm">{t('transportationBooking.enable')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('transportationBooking.scheduleService')}
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline mr-2" />
                        {t('transportationBooking.pickupDate')}
                      </label>
                      <input
                        type="date"
                        value={bookingDetails.pickupDate}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, pickupDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline mr-2" />
                        {t('transportationBooking.pickupTime')}
                      </label>
                      <select
                        value={bookingDetails.pickupTime}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, pickupTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('transportationBooking.timeSlots.selectTime')}</option>
                        <option value="06:00">06:00 - {t('transportationBooking.timeSlots.earlyMorning')}</option>
                        <option value="07:00">07:00 - {t('transportationBooking.timeSlots.earlyMorning')}</option>
                        <option value="08:00">08:00 - {t('transportationBooking.timeSlots.morning')}</option>
                        <option value="09:00">09:00 - {t('transportationBooking.timeSlots.morning')}</option>
                        <option value="10:00">10:00 - {t('transportationBooking.timeSlots.morning')}</option>
                        <option value="11:00">11:00 - {t('transportationBooking.timeSlots.morning')}</option>
                        <option value="12:00">12:00 - {t('transportationBooking.timeSlots.noon')}</option>
                        <option value="13:00">13:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                        <option value="14:00">14:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                        <option value="15:00">15:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                        <option value="16:00">16:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                        <option value="17:00">17:00 - {t('transportationBooking.timeSlots.evening')}</option>
                        <option value="18:00">18:00 - {t('transportationBooking.timeSlots.evening')}</option>
                        <option value="19:00">19:00 - {t('transportationBooking.timeSlots.evening')}</option>
                        <option value="20:00">20:00 - {t('transportationBooking.timeSlots.evening')}</option>
                        <option value="21:00">21:00 - {t('transportationBooking.timeSlots.night')}</option>
                        <option value="22:00">22:00 - {t('transportationBooking.timeSlots.night')}</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />
                        {t('transportationBooking.pickupLocation')}
                      </label>
                      <input
                        type="text"
                        value={bookingDetails.pickupLocation}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, pickupLocation: e.target.value }))}
                        placeholder={t('transportationBooking.placeholders.pickupAddress')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />
                        {t('transportationBooking.dropoffLocation')}
                      </label>
                      <input
                        type="text"
                        value={bookingDetails.dropoffLocation}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, dropoffLocation: e.target.value }))}
                        placeholder={t('transportationBooking.placeholders.dropoffAddress')}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Round trip fields for round-trip bookings */}
                  {selectedVehicles.some(v => serviceTypes[v.id]?.includes('round_trip')) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-blue-50 rounded-lg">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaCalendarAlt className="inline mr-2" />
                          {t('transportationBooking.returnDate')}
                        </label>
                        <input
                          type="date"
                          value={bookingDetails.returnDate}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, returnDate: e.target.value }))}
                          min={bookingDetails.pickupDate || new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <FaClock className="inline mr-2" />
                          {t('transportationBooking.returnTime')}
                        </label>
                        <select
                          value={bookingDetails.returnTime}
                          onChange={(e) => setBookingDetails(prev => ({ ...prev, returnTime: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="">{t('transportationBooking.timeSlots.selectTime')}</option>
                          <option value="06:00">06:00 - {t('transportationBooking.timeSlots.earlyMorning')}</option>
                          <option value="07:00">07:00 - {t('transportationBooking.timeSlots.earlyMorning')}</option>
                          <option value="08:00">08:00 - {t('transportationBooking.timeSlots.morning')}</option>
                          <option value="09:00">09:00 - {t('transportationBooking.timeSlots.morning')}</option>
                          <option value="10:00">10:00 - {t('transportationBooking.timeSlots.morning')}</option>
                          <option value="11:00">11:00 - {t('transportationBooking.timeSlots.morning')}</option>
                          <option value="12:00">12:00 - {t('transportationBooking.timeSlots.noon')}</option>
                          <option value="13:00">13:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                          <option value="14:00">14:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                          <option value="15:00">15:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                          <option value="16:00">16:00 - {t('transportationBooking.timeSlots.afternoon')}</option>
                          <option value="17:00">17:00 - {t('transportationBooking.timeSlots.evening')}</option>
                          <option value="18:00">18:00 - {t('transportationBooking.timeSlots.evening')}</option>
                          <option value="19:00">19:00 - {t('transportationBooking.timeSlots.evening')}</option>
                          <option value="20:00">20:00 - {t('transportationBooking.timeSlots.evening')}</option>
                          <option value="21:00">21:00 - {t('transportationBooking.timeSlots.night')}</option>
                          <option value="22:00">22:00 - {t('transportationBooking.timeSlots.night')}</option>
                        </select>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('transportationBooking.passengerCount')}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={bookingDetails.passengerCount}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, passengerCount: parseInt(e.target.value) || 1 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('transportationBooking.luggageCount')}
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="10"
                        value={bookingDetails.luggageCount}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, luggageCount: parseInt(e.target.value) || 0 }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaStickyNote className="inline mr-2" />
                      {t('transportationBooking.specialRequests')}
                    </label>
                    <textarea
                      value={bookingDetails.specialRequests}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder={t('transportationBooking.specialRequestsPlaceholder')}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
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
                      {pricing.vehicleCalculations.map(vehicle => (
                        <div key={vehicle.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center">
                            <div>
                              <span className="font-medium">{getVehicleTypeName(vehicle.vehicleType)}</span>
                              <span className="text-gray-500 ml-2">×{vehicle.quantity}</span>
                              <div className="text-sm text-gray-600">
                                {vehicle.serviceType?.name}
                              </div>
                            </div>
                          </div>
                          <span className="font-medium">{formatPriceByLanguage(vehicle.vehiclePrice, i18n.language)}</span>
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
                      <p><strong>{t('transportationBooking.pickup')}:</strong> {bookingDetails.pickupLocation || t('transportationBooking.notSpecified')}</p>
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

          {/* Pricing Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <FaCalculator className="inline mr-2" />
                {t('transportationBooking.pricingSummary')}
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>{t('transportationBooking.vehicles')} ({selectedVehicles.reduce((sum, vehicle) => sum + vehicle.quantity, 0)})</span>
                  <span>{formatPriceByLanguage(pricing.subtotal, i18n.language)}</span>
                </div>

                {expressSurcharge && (
                  <div className="flex justify-between text-yellow-600">
                    <span className="flex items-center">
                      <FaBolt className="mr-1" />
                      {t('transportationBooking.expressService')}
                    </span>
                    <span>+{formatPriceByLanguage(pricing.expressCharge, i18n.language)}</span>
                  </div>
                )}

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>{t('transportationBooking.total')}</span>
                  <span className="text-green-600">{formatPriceByLanguage(pricing.total, i18n.language)}</span>
                </div>
              </div>

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

              {selectedVehicles.length === 0 && step === 1 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600 text-sm">
                    {t('transportationBooking.selectVehiclesFirst')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportationBookingPage;
