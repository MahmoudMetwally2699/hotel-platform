/**
 * Guest Laundry Service Booking Interface
 *
 * Interactive multi-item selection interface for guests to:
 * 1. Select multiple laundry items with quantities
 * 2. Choose service types for each item
 * 3. Add express service if needed
 * 4. See real-time price calculation with hotel markup
 * 5. Complete the booking with scheduling
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaTshirt,
  FaPlus,
  FaMinus,
  FaTrash,
  FaBolt,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSpinner,  FaCheck,
  FaShoppingCart
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const LaundryBookingInterface = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State management
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState(null);
  const [laundryServices, setLaundryServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [cart, setCart] = useState([]); // Items selected by guest
  const [expressService, setExpressService] = useState({ enabled: false, rate: 0 });
  const [scheduling, setScheduling] = useState({
    preferredDate: '',
    preferredTime: '',
    pickupLocation: '',
    deliveryLocation: '',
    specialRequests: ''
  });  const [bookingStep, setBookingStep] = useState(1); // 1: Items, 2: Schedule, 3: Confirm
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch available laundry services for the hotel
   */
  const fetchLaundryServices = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch hotel details
      const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
      setHotel(hotelResponse.data.data);      // Fetch laundry services
      const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/laundry/items`);
      console.log('🧺 Laundry services response:', servicesResponse.data);
      console.log('🧺 Services count:', servicesResponse.data.data.services?.length);
      console.log('🧺 Full response structure:', JSON.stringify(servicesResponse.data, null, 2));
      console.log('🧺 Services details:', servicesResponse.data.data.services?.map(s => ({
        id: s._id,
        name: s.name,
        laundryItemsCount: s.laundryItems?.length || 0,
        hasLaundryItems: !!s.laundryItems && s.laundryItems.length > 0,
        firstItem: s.laundryItems?.[0] ? {
          name: s.laundryItems[0].name,
          category: s.laundryItems[0].category
        } : null
      })));

      setLaundryServices(servicesResponse.data.data.services || []);

      // Auto-select the first service that has laundry items
      const serviceWithItems = servicesResponse.data.data.services?.find(service =>
        service.laundryItems && service.laundryItems.length > 0
      );

      if (serviceWithItems) {
        setSelectedService(serviceWithItems);
        console.log('🎯 Selected service:', serviceWithItems.name, 'with', serviceWithItems.laundryItems.length, 'items');
      } else if (servicesResponse.data.data.services?.length > 0) {
        setSelectedService(servicesResponse.data.data.services[0]);
        console.log('⚠️ No services with items found, selected first service:', servicesResponse.data.data.services[0].name);
      }

    } catch (error) {
      console.error('Error fetching laundry services:', error);
      toast.error('Failed to load laundry services');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (hotelId) {
      fetchLaundryServices();
    }
  }, [hotelId, fetchLaundryServices]);

  /**
   * Add item to cart with service type selection
   */
  const addItemToCart = (item, serviceType, price) => {
    const cartItem = {
      id: `${item.name}_${serviceType.id}_${Date.now()}`,
      itemName: item.name,
      itemId: item.id || item.name.toLowerCase().replace(/\s+/g, '_'),
      itemCategory: item.category,
      itemIcon: item.icon,
      serviceTypeId: serviceType.id,
      serviceTypeName: serviceType.name,
      serviceTypeDescription: serviceType.description,
      serviceTypeDuration: serviceType.duration,
      serviceTypeIcon: serviceType.icon,
      basePrice: price,
      quantity: 1,
      totalPrice: price
    };

    setCart(prev => [...prev, cartItem]);
    toast.success(`${item.name} (${serviceType.name}) added to cart`);
  };

  /**
   * Update item quantity in cart
   */
  const updateItemQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItemFromCart(cartItemId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? { ...item, quantity: newQuantity, totalPrice: item.basePrice * newQuantity }
        : item
    ));
  };

  /**
   * Remove item from cart
   */
  const removeItemFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
  };

  /**
   * Calculate total pricing
   */
  const calculateTotal = () => {
    const itemsTotal = cart.reduce((total, item) => total + item.totalPrice, 0);
    const expressTotal = expressService.enabled ? expressService.rate : 0;
    const subtotal = itemsTotal + expressTotal;

    // Hotel markup is already included in the prices from backend
    return {
      itemsTotal: Math.round(itemsTotal * 100) / 100,
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
      toast.error('Please add at least one item to your cart');
      return;
    }

    if (!scheduling.preferredDate || !scheduling.preferredTime) {
      toast.error('Please select preferred date and time');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        serviceId: selectedService._id,
        hotelId: hotelId,
        laundryItems: cart,
        expressSurcharge: expressService,
        schedule: {
          preferredDate: scheduling.preferredDate,
          preferredTime: scheduling.preferredTime
        },
        guestDetails: {
          roomNumber: scheduling.pickupLocation || '',
          specialRequests: scheduling.specialRequests
        },
        location: {
          pickupLocation: scheduling.pickupLocation,
          deliveryLocation: scheduling.deliveryLocation || scheduling.pickupLocation,
          pickupInstructions: scheduling.specialRequests
        }
      };

      const response = await apiClient.post('/client/bookings/laundry', bookingData);

      toast.success('Laundry booking created successfully!');

      // Redirect to booking confirmation or dashboard
      navigate(`/bookings/${response.data.data.booking.id}`);

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
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
  if (laundryServices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTshirt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Laundry Services Available</h2>
          <p className="text-gray-600 mb-4">This hotel doesn't offer laundry services at the moment.</p>
          <button
            onClick={() => navigate(`/hotels/${hotelId}/services`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Browse Other Services
          </button>
        </div>
      </div>
    );
  }

  // Check if any services have laundry items
  const servicesWithItems = laundryServices.filter(service =>
    service.laundryItems && service.laundryItems.length > 0
  );

  if (servicesWithItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaTshirt className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Laundry Items Not Available</h2>
          <p className="text-gray-600 mb-2">
            This hotel has {laundryServices.length} laundry service provider(s), but none have configured their laundry items yet.
          </p>
          <div className="text-sm text-gray-500 mb-4">
            Available services: {laundryServices.map(s => s.name).join(', ')}
          </div>
          <button
            onClick={() => navigate(`/hotels/${hotelId}/services`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Browse Other Services
          </button>
        </div>
      </div>
    );  }

  const pricing = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <FaTshirt className="inline mr-3" />
                Laundry Service
              </h1>
              <p className="text-gray-600 mt-2">{hotel?.name}</p>
            </div>
            <div className="bg-blue-50 px-4 py-2 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">
                Step {bookingStep} of 3
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left Column - Item Selection or Schedule */}
          <div className="lg:col-span-2">
            {bookingStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Select Laundry Items</h2>                {/* Service Provider Selection */}
                {servicesWithItems.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Service Provider
                    </label>
                    <select
                      value={selectedService?._id || ''}
                      onChange={(e) => {
                        const service = servicesWithItems.find(s => s._id === e.target.value);
                        setSelectedService(service);
                        console.log('🔄 Selected service changed:', service?.name, 'Items:', service?.laundryItems?.length || 0);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {servicesWithItems.map(service => (
                        <option key={service._id} value={service._id}>
                          {service.name} - {service.providerId?.businessName}
                          {service.providerId?.rating && (
                            ` ⭐ ${service.providerId.rating}`
                          )}
                          {` (${service.laundryItems?.length || 0} items)`}
                        </option>
                      ))}
                    </select>
                  </div>
                )}                {/* Debug Info */}
                {process.env.NODE_ENV === 'development' && selectedService && (
                  <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
                    <p><strong>Debug Info:</strong></p>
                    <p>Selected Service: {selectedService.name}</p>
                    <p>Laundry Items Count: {selectedService.laundryItems?.length || 0}</p>
                    <p>Total Services Available: {laundryServices.length}</p>
                    <p>Services with Items: {servicesWithItems.length}</p>
                    <p>Services without Items: {laundryServices.length - servicesWithItems.length}</p>
                    {selectedService.laundryItems && selectedService.laundryItems.length > 0 && (
                      <div className="mt-2">
                        <p><strong>Items by Category:</strong></p>
                        {Object.entries(
                          selectedService.laundryItems.reduce((grouped, item) => {
                            const category = item.category || 'other';
                            if (!grouped[category]) grouped[category] = [];
                            grouped[category].push(item.name);
                            return grouped;
                          }, {})
                        ).map(([category, items]) => (
                          <p key={category} className="ml-2 text-xs">
                            • <strong>{category}:</strong> {items.join(', ')}
                          </p>
                        ))}
                      </div>
                    )}
                    {laundryServices.length - servicesWithItems.length > 0 && (
                      <p className="text-red-600">
                        Services without items: {laundryServices.filter(s => !s.laundryItems || s.laundryItems.length === 0).map(s => s.name).join(', ')}
                      </p>
                    )}
                  </div>
                )}                {/* Items Grid */}
                {selectedService && selectedService.laundryItems && (
                  <div className="space-y-6">
                    {/* Template items info banner */}{/* Group items by category */}
                    {Object.entries(
                      selectedService.laundryItems.reduce((grouped, item) => {
                        const category = item.category || 'other';
                        if (!grouped[category]) grouped[category] = [];
                        grouped[category].push(item);
                        return grouped;
                      }, {})
                    ).map(([category, categoryItems]) => {
                      console.log('🔍 Rendering category:', category, 'Items:', categoryItems.length, 'Items:', categoryItems.map(i => i.name));

                      return (
                      <div key={category} className="space-y-4">
                        <h3 className="text-xl font-semibold capitalize text-gray-800 border-b border-gray-200 pb-2">
                          {t(`laundryBooking.itemCategories.${category}`, category.replace('_', ' '))}
                        </h3>                          {categoryItems.map((item, itemIndex) => {
                            console.log(`🔍 Processing item: ${item.name} (${item.category})`);
                            console.log(`🔍 Item serviceTypes:`, item.serviceTypes);

                            // Check if item has any valid service types
                            const validServiceTypes = item.serviceTypes?.filter(st => st.isAvailable && st.price > 0) || [];
                            console.log(`🔍 Valid serviceTypes for ${item.name}:`, validServiceTypes.length);

                            if (validServiceTypes.length === 0) {
                              console.log(`❌ No valid service types for item: ${item.name}`);
                              return (
                                <div key={`${category}-${itemIndex}`} className="border border-red-200 rounded-lg p-4 bg-red-50">
                                  <p className="text-red-600">
                                    <strong>{item.icon} {item.name}</strong> - No valid service types configured
                                  </p>
                                  <p className="text-sm text-red-500">Service types: {JSON.stringify(item.serviceTypes)}</p>
                                </div>
                              );
                            }

                            return (                          <div key={`${category}-${itemIndex}`} className="border border-gray-200 rounded-lg p-4 relative">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-lg font-semibold">
                                {item.icon} {item.name}
                              </h4>
                              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                {item.category}
                              </span>
                            </div>                            {/* Service Type Options */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {item.serviceTypes?.map((serviceType, serviceIndex) => {
                                console.log(`🔍 ServiceType for ${item.name}:`, serviceType, 'Available:', serviceType.isAvailable, 'Price:', serviceType.price);

                                if (!serviceType.isAvailable || serviceType.price <= 0) {
                                  console.log(`❌ Filtering out service type for ${item.name}:`, serviceType.serviceTypeId, 'Available:', serviceType.isAvailable, 'Price:', serviceType.price);
                                  return null;
                                }

                                // Calculate final price with hotel markup
                                const markup = hotel?.markup || 15;
                                const finalPrice = Math.round((serviceType.price * (1 + markup / 100)) * 100) / 100;

                                // Find service type details from the service combinations
                                const serviceTypeDetails = selectedService.serviceCombinations?.find(
                                  combo => combo.id === serviceType.serviceTypeId
                                ) || {
                                  id: serviceType.serviceTypeId,
                                  name: serviceType.serviceTypeId.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
                                  icon: '🧼',
                                  description: 'Professional laundry service'
                                };

                                return (
                                  <div
                                    key={`${serviceType.serviceTypeId}-${serviceIndex}`}
                                    className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors"
                                  >
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="font-medium">
                                        {serviceTypeDetails.icon} {serviceTypeDetails.name}
                                      </span>                                      <span className="text-lg font-bold text-blue-600">
                                        SAR {finalPrice}
                                      </span>
                                    </div>                                    <p className="text-sm text-gray-600 mb-3">
                                      {serviceTypeDetails.description}
                                    </p>
                                    <button
                                      onClick={() => addItemToCart(item, serviceTypeDetails, finalPrice)}
                                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                      <FaPlus className="inline mr-2" />
                                      Add to Cart
                                    </button>
                                  </div>
                                );
                              })}                            </div>
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
                              checked={expressService.enabled}
                              onChange={(e) => setExpressService({
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
                )}                {/* No items message */}
                {selectedService && (!selectedService.laundryItems || selectedService.laundryItems.length === 0) && (
                  <div className="text-center py-8">
                    <FaTshirt className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No laundry items available for this service.</p>
                    <p className="text-sm text-gray-500">
                      The service provider "{selectedService.name}" hasn't configured any laundry items yet.
                    </p>
                    {laundryServices.filter(s => s.laundryItems?.length > 0).length > 0 && (
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
                <h2 className="text-2xl font-bold mb-6">Schedule & Location</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaCalendarAlt className="inline mr-2" />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={scheduling.preferredDate}
                      onChange={(e) => setScheduling(prev => ({ ...prev, preferredDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaClock className="inline mr-2" />
                      Preferred Time
                    </label>
                    <select
                      value={scheduling.preferredTime}
                      onChange={(e) => setScheduling(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select time...</option>
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
                      Pickup Location (Room Number)
                    </label>
                    <input
                      type="text"
                      value={scheduling.pickupLocation}
                      onChange={(e) => setScheduling(prev => ({ ...prev, pickupLocation: e.target.value }))}
                      placeholder="e.g., Room 205"
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline mr-2" />
                      Delivery Location
                    </label>
                    <input
                      type="text"
                      value={scheduling.deliveryLocation}
                      onChange={(e) => setScheduling(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                      placeholder="Same as pickup (leave empty)"
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
                    placeholder="Any special instructions for the laundry service..."
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Booking Confirmation</h2>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Order Summary</h3>

                  {cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center py-2">
                      <div>
                        <span className="font-medium">
                          {item.itemIcon} {item.itemName} ({item.serviceTypeName})
                        </span>
                        <span className="text-gray-600 ml-2">× {item.quantity}</span>
                      </div>
                      <span className="font-medium">${item.totalPrice}</span>
                    </div>
                  ))}

                  {expressService.enabled && (
                    <div className="flex justify-between items-center py-2 border-t">
                      <span className="font-medium">
                        <FaBolt className="text-yellow-500 mr-2" />
                        Express Service
                      </span>
                      <span className="font-medium">${pricing.expressTotal}</span>
                    </div>
                  )}

                  <div className="border-t pt-2">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span>Total Amount</span>
                      <span className="text-blue-600">${pricing.total}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Schedule & Location</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Preferred Date</p>
                      <p className="font-medium">{scheduling.preferredDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Preferred Time</p>
                      <p className="font-medium">{scheduling.preferredTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Pickup Location</p>
                      <p className="font-medium">{scheduling.pickupLocation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Service Provider</p>
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
                Cart ({cart.length} items)
              </h3>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No items in cart yet
                </p>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {item.itemIcon} {item.itemName}
                        </p>
                        <p className="text-xs text-gray-600">{item.serviceTypeName}</p>
                        <p className="text-sm font-medium text-blue-600">${item.totalPrice}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <FaMinus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm">{item.quantity}</span>
                        <button
                          onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                          className="p-1 text-gray-500 hover:text-gray-700"
                        >
                          <FaPlus size={12} />
                        </button>
                        <button
                          onClick={() => removeItemFromCart(item.id)}
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
                  <span>Items Total</span>
                  <span>${pricing.itemsTotal}</span>
                </div>
                {expressService.enabled && (
                  <div className="flex justify-between">
                    <span>Express Service</span>
                    <span>${pricing.expressTotal}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-bold pt-2 border-t">
                  <span>Total</span>
                  <span className="text-blue-600">${pricing.total}</span>
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
                      disabled={!scheduling.preferredDate || !scheduling.preferredTime || !scheduling.pickupLocation}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Review Booking
                    </button>
                    <button
                      onClick={() => setBookingStep(1)}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Back to Items
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

export default LaundryBookingInterface;
