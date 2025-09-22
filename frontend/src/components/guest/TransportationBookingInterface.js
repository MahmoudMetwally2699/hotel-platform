/**
 * Guest Transportation Service Booking Interface
 *
 * Interactive multi-vehicle selection interface for guests to:
 * 1. Select multiple vehicles with quantities
 * 2. Choose service types for each vehicle
 * 3. Add express service if needed
 * 4. See real-time price calculation (hotel markup already included by backend)
 * 5. Complete the booking with scheduling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaCar,
  FaPlus,
  FaMinus,
  FaTrash,
  FaBolt,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSpinner,
  FaCheck,
  FaShoppingCart
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { selectCurrentUser } from '../../redux/slices/authSlice';
import { formatTotalWithSar } from '../../utils/currency';

const TransportationBookingInterface = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const currentUser = useSelector(selectCurrentUser);

  // State management
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState(null);
  const [transportationServices, setTransportationServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [cart, setCart] = useState([]); // Vehicles selected by guest
  const [expressSurcharge, setExpressSurcharge] = useState({ enabled: false, rate: 0 });
  const [scheduling, setScheduling] = useState({
    pickupDate: '',
    pickupTime: '',
    destination: '', // Only need destination, pickup is user's room
    returnDate: '', // For round-trip bookings
    returnTime: '',
    specialRequests: '',
    passengerCount: 1,
    luggageCount: 0
  });

  const [bookingStep, setBookingStep] = useState(1); // 1: Vehicles, 2: Schedule, 3: Confirm
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch available transportation services for the hotel
   */
  const fetchTransportationServices = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch hotel details
      const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
      setHotel(hotelResponse.data.data);

      // Fetch transportation services
      const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/transportation/vehicles`);
      console.log('🚗 Transportation services response:', servicesResponse.data);
      console.log('🚗 Services count:', servicesResponse.data.data.services?.length);
      console.log('🚗 Full response structure:', JSON.stringify(servicesResponse.data, null, 2));
      console.log('🚗 Services details:', servicesResponse.data.data.services?.map(s => ({
        id: s._id,
        name: s.name,
        transportationItemsCount: s.transportationItems?.length || 0,
        hasTransportationItems: !!s.transportationItems && s.transportationItems.length > 0,
        firstVehicle: s.transportationItems?.[0] ? {
          vehicleType: s.transportationItems[0].vehicleType,
          category: s.transportationItems[0].category
        } : null
      })));

      setTransportationServices(servicesResponse.data.data.services || []);

      // Auto-select the first service that has transportation vehicles
      const serviceWithVehicles = servicesResponse.data.data.services?.find(service =>
        service.transportationItems && service.transportationItems.length > 0
      );

      if (serviceWithVehicles) {
        setSelectedService(serviceWithVehicles);
        console.log('🎯 Selected service:', serviceWithVehicles.name, 'with', serviceWithVehicles.transportationItems.length, 'vehicles');
      } else if (servicesResponse.data.data.services?.length > 0) {
        setSelectedService(servicesResponse.data.data.services[0]);
        console.log('⚠️ No services with vehicles found, selected first service:', servicesResponse.data.data.services[0].name);
      }

    } catch (error) {
      console.error('Error fetching transportation services:', error);
      toast.error(t('guest.transportation.failedToLoad'));
    } finally {
      setLoading(false);
    }
  }, [hotelId, t]);

  useEffect(() => {
    if (hotelId) {
      fetchTransportationServices();
    }
  }, [hotelId, fetchTransportationServices]);

  /**
   * Add vehicle to cart with service type selection
   */
  const addVehicleToCart = (vehicle, serviceType, price) => {
    const cartVehicle = {
      id: `${vehicle.vehicleType}_${serviceType.id}_${Date.now()}`,
      vehicleType: vehicle.vehicleType,
      vehicleId: vehicle.id || vehicle.vehicleType.toLowerCase().replace(/\s+/g, '_'),
      vehicleCategory: vehicle.category,
      serviceTypeId: serviceType.id,
      serviceTypeName: serviceType.name,
      serviceTypeDescription: serviceType.description,
      serviceTypeDuration: serviceType.duration,
      basePrice: price,
      quantity: 1,
      totalPrice: price
    };

    setCart(prev => [...prev, cartVehicle]);
    toast.success(`${vehicle.vehicleType} (${serviceType.name}) added to cart`);
  };

  /**
   * Update vehicle quantity in cart
   */
  const updateVehicleQuantity = (cartVehicleId, newQuantity) => {
    if (newQuantity <= 0) {
      removeVehicleFromCart(cartVehicleId);
      return;
    }

    setCart(prev => prev.map(vehicle =>
      vehicle.id === cartVehicleId
        ? { ...vehicle, quantity: newQuantity, totalPrice: vehicle.basePrice * newQuantity }
        : vehicle
    ));
  };

  /**
   * Remove vehicle from cart
   */
  const removeVehicleFromCart = (cartVehicleId) => {
    setCart(prev => prev.filter(vehicle => vehicle.id !== cartVehicleId));
  };

  /**
   * Calculate total pricing
   */
  const calculateTotal = () => {
    const vehiclesTotal = cart.reduce((total, vehicle) => total + vehicle.totalPrice, 0);
    const expressTotal = expressSurcharge.enabled ? expressSurcharge.rate : 0;
    const subtotal = vehiclesTotal + expressTotal;

    // Hotel markup is already included in the prices from backend
    return {
      vehiclesTotal: Math.round(vehiclesTotal * 100) / 100,
      expressTotal: Math.round(expressTotal * 100) / 100,
      subtotal: Math.round(subtotal * 100) / 100,
      total: Math.round(subtotal * 100) / 100
    };
  };

  /**
   * Submit the booking
   */
  const submitBooking = async () => {
    if (cart.length === 0) {
      toast.error(t('guest.transportation.addToCart'));
      return;
    }

    if (!scheduling.pickupDate || !scheduling.pickupTime) {
      toast.error(t('guest.transportation.selectDateAndTime'));
      return;
    }

    if (!currentUser?.roomNumber) {
      toast.error('Room number is required. Please update your profile.');
      return;
    }

    if (!scheduling.destination) {
      toast.error('Please provide destination address');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        serviceId: selectedService._id,
        hotelId: hotelId,
        transportationItems: cart,
        expressSurcharge: expressSurcharge,
        schedule: {
          pickupDate: scheduling.pickupDate,
          pickupTime: scheduling.pickupTime,
          returnDate: scheduling.returnDate,
          returnTime: scheduling.returnTime
        },
        guestDetails: {
          roomNumber: currentUser.roomNumber,
          passengerCount: scheduling.passengerCount,
          luggageCount: scheduling.luggageCount,
          specialRequests: scheduling.specialRequests
        },
        location: {
          pickupLocation: currentUser.roomNumber,
          dropoffLocation: scheduling.destination,
          pickupInstructions: scheduling.specialRequests
        }
      };

      const response = await apiClient.post('/client/bookings/transportation', bookingData);

      toast.success('Transportation booking created successfully!');

      // Redirect to booking confirmation or dashboard
      navigate(`/bookings/${response.data.data.booking.id}`);

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || t('guest.transportation.failedToCreate'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
      </div>
    );
  }

  if (transportationServices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaCar className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('guest.transportation.noTransportationServices')}</h2>
          <p className="text-gray-600 mb-4">{t('guest.transportation.noTransportationDescription')}</p>
          <button
            onClick={() => navigate(`/hotels/${hotelId}/services`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            {t('guest.transportation.browseOtherServices')}
          </button>
        </div>
      </div>
    );
  }

  // Check if any services have transportation vehicles
  const servicesWithVehicles = transportationServices.filter(service =>
    service.transportationItems && service.transportationItems.length > 0
  );

  if (servicesWithVehicles.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaCar className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">{t('guest.transportation.vehiclesNotAvailable')}</h2>
          <p className="text-gray-600 mb-2">
            {t('guest.transportation.serviceProviderNoVehicles', { count: transportationServices.length })}
          </p>
          <div className="text-sm text-gray-500 mb-4">
            {t('guest.transportation.availableServices', { services: transportationServices.map(s => s.name).join(', ') })}
          </div>
          <button
            onClick={() => navigate(`/hotels/${hotelId}/services`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            {t('guest.transportation.browseOtherServices')}
          </button>
        </div>
      </div>
    );
  }

  const pricing = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <FaCar className="inline mr-3" />
                {t('services.transportation')}
              </h1>
              <p className="text-gray-600 mt-2">{hotel?.name}</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">
                {t('booking.step')} {bookingStep} {t('common.of')} 3
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Vehicle Selection or Schedule */}
          <div className="lg:col-span-2">
            {bookingStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">{t('guest.transportation.selectVehicles')}</h2>

                {/* Service Provider Selection */}
                {servicesWithVehicles.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Service Provider
                    </label>
                    <select
                      value={selectedService?._id || ''}
                      onChange={(e) => {
                        const service = servicesWithVehicles.find(s => s._id === e.target.value);
                        setSelectedService(service);
                        console.log('🔄 Selected service changed:', service?.name, 'Vehicles:', service?.transportationItems?.length || 0);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {servicesWithVehicles.map(service => (
                        <option key={service._id} value={service._id}>
                          {service.name} - {service.providerId?.businessName}
                          {service.providerId?.rating && (
                            ` ⭐ ${service.providerId.rating}`
                          )}
                          {` (${service.transportationItems?.length || 0} vehicles)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && selectedService && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                    <p><strong>Debug Info:</strong></p>
                    <p>Selected Service: {selectedService.name}</p>
                    <p>Transportation Vehicles Count: {selectedService.transportationItems?.length || 0}</p>
                    <p>Total Services Available: {transportationServices.length}</p>
                    <p>Services with Vehicles: {servicesWithVehicles.length}</p>
                    <p>Services without Vehicles: {transportationServices.length - servicesWithVehicles.length}</p>

                    {selectedService.transportationItems && selectedService.transportationItems.length > 0 && (
                      <div className="mt-2">
                        <p><strong>Vehicles by Category:</strong></p>
                        {Object.entries(
                          selectedService.transportationItems.reduce((grouped, vehicle) => {
                            const category = vehicle.category || 'other';
                            if (!grouped[category]) grouped[category] = [];
                            grouped[category].push(vehicle.vehicleType);
                            return grouped;
                          }, {})
                        ).map(([category, vehicles]) => (
                          <p key={category} className="ml-2 text-xs">
                            • <strong>{category}:</strong> {vehicles.join(', ')}
                          </p>
                        ))}
                      </div>
                    )}
                    {transportationServices.length - servicesWithVehicles.length > 0 && (
                      <p className="text-red-600">
                        Services without vehicles: {transportationServices.filter(s => !s.transportationItems || s.transportationItems.length === 0).map(s => s.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}

                {/* Vehicles Grid */}
                {selectedService && selectedService.transportationItems && (
                  <div className="space-y-6">
                    {/* Group vehicles by category */}
                    {Object.entries(
                      selectedService.transportationItems.reduce((grouped, vehicle) => {
                        const category = vehicle.category || 'other';
                        if (!grouped[category]) grouped[category] = [];
                        grouped[category].push(vehicle);
                        return grouped;
                      }, {})
                    ).map(([category, categoryVehicles]) => {
                      console.log('🚗 Rendering category:', category, 'Vehicles:', categoryVehicles.length, 'Vehicles:', categoryVehicles.map(v => v.vehicleType));

                      return (
                        <div key={category} className="space-y-4">
                          <h3 className="text-xl font-semibold capitalize text-gray-800 border-b border-gray-200 pb-2">
                            {t(`transportationBooking.vehicleCategories.${category}`, category.replace('_', ' '))}
                          </h3>

                          {categoryVehicles.map((vehicle, vehicleIndex) => {
                            console.log(`🚗 Processing vehicle: ${vehicle.vehicleType} (${vehicle.category})`);
                            console.log(`🚗 Vehicle serviceTypes:`, vehicle.serviceTypes);

                            // Check if vehicle has any valid service types
                            const validServiceTypes = vehicle.serviceTypes?.filter(st => st.isAvailable && st.price > 0) || [];
                            console.log(`🚗 Valid serviceTypes for ${vehicle.vehicleType}:`, validServiceTypes.length);

                            if (validServiceTypes.length === 0) {
                              console.log(`❌ No valid service types for vehicle: ${vehicle.vehicleType}`);
                              return (
                                <div key={`${category}-${vehicleIndex}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                  <p className="text-red-600">
                                    <strong>{vehicle.vehicleType}</strong> - No valid service types configured
                                  </p>
                                  <p className="text-sm text-red-500">Service types: {JSON.stringify(vehicle.serviceTypes)}</p>
                                </div>
                              );
                            }

                            return (
                              <div key={`${category}-${vehicleIndex}`} className="border border-gray-200 rounded-lg p-4 relative">
                                <div className="flex items-center justify-between mb-4">
                                  <h4 className="text-lg font-semibold">
                                    {vehicle.vehicleType}
                                  </h4>
                                  <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                    {vehicle.category}
                                  </span>
                                </div>

                                {/* Service Type Options */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {vehicle.serviceTypes?.map((serviceType, serviceIndex) => {
                                    console.log(`🚗 ServiceType for ${vehicle.vehicleType}:`, serviceType, 'Available:', serviceType.isAvailable, 'Price:', serviceType.price);

                                    if (!serviceType.isAvailable || serviceType.price <= 0) {
                                      console.log(`❌ Filtering out service type for ${vehicle.vehicleType}:`, serviceType.serviceTypeId, 'Available:', serviceType.isAvailable, 'Price:', serviceType.price);
                                      return null;
                                    }

                                    const finalPrice = serviceType.price; // Price already includes hotel markup from backend

                                    return (
                                      <div key={serviceIndex} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                        <div className="flex flex-col h-full">
                                          <div className="flex-1">
                                            <h5 className="font-medium text-gray-900 mb-1">
                                              {serviceType.name}
                                            </h5>
                                            <p className="text-xs text-gray-600 mb-2">
                                              {serviceType.description}
                                            </p>
                                            <p className="text-sm font-bold text-blue-600 mb-2">
                                              ${finalPrice}
                                            </p>
                                          </div>
                                          <button
                                            onClick={() => addVehicleToCart(vehicle, serviceType, finalPrice)}
                                            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                          >
                                            <FaPlus className="inline mr-2" />
                                            Add to Cart
                                          </button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}

                    {/* Express Service Option */}
                    {selectedService.expressSurcharge?.enabled && (
                      <div className="border border-orange-200 rounded-lg p-4 bg-orange-50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id="express-service"
                              checked={expressSurcharge.enabled}
                              onChange={(e) => setExpressSurcharge({
                                enabled: e.target.checked,
                                rate: e.target.checked ? selectedService.expressSurcharge.finalRate : 0
                              })}
                              className="mr-3"
                            />
                            <label htmlFor="express-service" className="font-medium">
                              <FaBolt className="inline text-yellow-500 mr-2" />
                              Express Service
                            </label>
                          </div>
                          <span className="text-lg font-bold text-orange-600">
                            +SAR {selectedService.expressSurcharge.finalRate}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2 ml-6">
                          {selectedService.expressSurcharge.description}
                          ({selectedService.expressSurcharge.duration?.value} {selectedService.expressSurcharge.duration?.unit})
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* No vehicles message */}
                {selectedService && (!selectedService.transportationItems || selectedService.transportationItems.length === 0) && (
                  <div className="text-center py-8">
                    <FaCar className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No transportation vehicles available for this service.</p>
                    <p className="text-sm text-gray-500">
                      The service provider "{selectedService.name}" hasn't configured any vehicles yet.
                    </p>
                    {transportationServices.filter(s => s.transportationItems?.length > 0).length > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        Try selecting a different service provider above.
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}

            {bookingStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">{t('guest.transportation.scheduleAndLocation')}</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaCalendarAlt className="inline mr-2" />
                      {t('guest.transportation.pickupDate')}
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={scheduling.pickupDate}
                      onChange={(e) => setScheduling(prev => ({ ...prev, pickupDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaClock className="inline mr-2" />
                      {t('guest.transportation.pickupTime')}
                    </label>
                    <select
                      value={scheduling.pickupTime}
                      onChange={(e) => setScheduling(prev => ({ ...prev, pickupTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">{t('guest.transportation.selectTime')}</option>
                      <option value="06:00">06:00 AM</option>
                      <option value="08:00">08:00 AM</option>
                      <option value="10:00">10:00 AM</option>
                      <option value="12:00">12:00 PM</option>
                      <option value="14:00">02:00 PM</option>
                      <option value="16:00">04:00 PM</option>
                      <option value="18:00">06:00 PM</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline mr-2" />
                      Pickup Location (Your Room)
                    </label>
                    <div className="w-full p-3 border border-gray-300 rounded-md bg-gray-50">
                      <span className="text-gray-700 font-medium">
                        Room {currentUser?.roomNumber || 'Not set'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup will be from your registered room
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline mr-2" />
                      {t('guest.transportation.dropOff')} {t('common.address')}
                    </label>
                    <input
                      type="text"
                      value={scheduling.destination}
                      onChange={(e) => setScheduling(prev => ({ ...prev, destination: e.target.value }))}
                      placeholder={t('guest.transportation.enterDestinationAddress')}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Passengers
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="20"
                      value={scheduling.passengerCount}
                      onChange={(e) => setScheduling(prev => ({ ...prev, passengerCount: parseInt(e.target.value) || 1 }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Number of Luggage
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={scheduling.luggageCount}
                      onChange={(e) => setScheduling(prev => ({ ...prev, luggageCount: parseInt(e.target.value) || 0 }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={scheduling.specialRequests}
                    onChange={(e) => setScheduling(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder={t('guest.transportation.specialInstructions')}
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">{t('booking.confirmBooking')}</h2>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">{t('guest.transportation.orderSummary')}</h3>

                  {cart.map(vehicle => (
                    <div key={vehicle.id} className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-medium">
                          {vehicle.vehicleType} ({vehicle.serviceTypeName})
                        </span>
                        <span className="text-gray-600 ml-2">× {vehicle.quantity}</span>
                      </div>
                      <span className="font-medium">${vehicle.totalPrice}</span>
                    </div>
                  ))}

                  {expressSurcharge.enabled && (
                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="font-medium">
                        <FaBolt className="text-yellow-500 mr-2" />
                        {t('laundryBooking.expressService')}
                      </span>
                      <span className="font-medium">${pricing.expressTotal}</span>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>{t('guest.transportation.totalAmount')}</span>
                      <span className="text-blue-600">${pricing.total}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Schedule & Location</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">{t('guest.transportation.pickupDate')}</p>
                      <p className="font-medium">{scheduling.pickupDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('guest.transportation.pickupTime')}</p>
                      <p className="font-medium">{scheduling.pickupTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('guest.transportation.pickupLocation')}</p>
                      <p className="font-medium">{scheduling.pickupLocation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('guest.transportation.dropOff')} {t('common.address')}</p>
                      <p className="font-medium">{scheduling.dropoffLocation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('guest.transportation.passengers')}</p>
                      <p className="font-medium">{scheduling.passengerCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('guest.transportation.luggage')}</p>
                      <p className="font-medium">{scheduling.luggageCount}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">{t('services.serviceProvider')}</p>
                      <p className="font-medium">{selectedService?.providerId?.businessName}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Cart & Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-xl font-bold mb-4">
                <FaShoppingCart className="inline mr-2" />
                {t('common.cart')} ({cart.length} {cart.length === 1 ? t('guest.transportation.vehicle') : t('guest.transportation.vehicles')})
              </h3>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No vehicles in cart yet
                </p>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map(vehicle => (
                    <div key={vehicle.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {vehicle.vehicleType}
                        </p>
                        <p className="text-xs text-gray-600">{vehicle.serviceTypeName}</p>
                        <p className="text-sm font-medium text-blue-600">${vehicle.totalPrice}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateVehicleQuantity(vehicle.id, vehicle.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm">{vehicle.quantity}</span>
                        <button
                          onClick={() => updateVehicleQuantity(vehicle.id, vehicle.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <FaPlus size={12} />
                        </button>
                        <button
                          onClick={() => removeVehicleFromCart(vehicle.id)}
                          className="p-1 text-red-500 hover:text-red-700 ml-2"
                        >
                          <FaTrash size={12} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Pricing Summary */}
              <div className="border-t pt-4 space-y-2">
                <div className="flex justify-between">
                  <span>{t('guest.transportation.vehiclesTotal')}</span>
                  <span>${pricing.vehiclesTotal}</span>
                </div>
                {expressSurcharge.enabled && (
                  <div className="flex justify-between">
                    <span>{t('guest.transportation.expressService')}</span>
                    <span>${pricing.expressTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>{t('guest.transportation.total')}</span>
                  <span className="text-blue-600">{formatTotalWithSar(pricing.total, i18n.language)}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {bookingStep === 1 && (
                  <button
                    onClick={() => setBookingStep(2)}
                    disabled={cart.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Schedule
                  </button>
                )}

                {bookingStep === 2 && (
                  <>
                    <button
                      onClick={() => setBookingStep(3)}
                      disabled={!scheduling.pickupDate || !scheduling.pickupTime || !scheduling.pickupLocation}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Review Booking
                    </button>
                    <button
                      onClick={() => setBookingStep(1)}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Back to Vehicles
                    </button>
                  </>
                )}

                {bookingStep === 3 && (
                  <>
                    <button
                      onClick={submitBooking}
                      disabled={submitting}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="inline animate-spin mr-2" />
                          Creating Booking...
                        </>
                      ) : (
                        <>
                          <FaCheck className="inline mr-2" />
                          Confirm Booking
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setBookingStep(2)}
                      disabled={submitting}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
                    >
                      Back to Schedule
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportationBookingInterface;
