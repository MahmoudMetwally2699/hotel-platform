/**
 * Guest Restaurant Booking Interface
 *
 * Interactive interface for guests to:
 * 1. Browse restaurant services and menu items
 * 2. Select multiple menu items with quantities
 * 3. Schedule delivery/pickup
 * 4. Complete the booking with payment
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaUtensils,
  FaPlus,
  FaMinus,
  FaTrash,
  FaClock,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaSpinner,
  FaCheck,
  FaShoppingCart,
  FaLeaf,
  FaPepperHot
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const RestaurantBookingInterface = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // State management
  const [loading, setLoading] = useState(true);
  const [hotel, setHotel] = useState(null);
  const [restaurantServices, setRestaurantServices] = useState([]);
  const [selectedService, setSelectedService] = useState(null);
  const [cart, setCart] = useState([]); // Items selected by guest
  const [scheduling, setScheduling] = useState({
    preferredDate: '',
    preferredTime: '',
    deliveryLocation: '',
    specialRequests: ''
  });
  const [bookingStep, setBookingStep] = useState(1); // 1: Items, 2: Schedule, 3: Confirm
  const [submitting, setSubmitting] = useState(false);

  /**
   * Fetch available restaurant services for the hotel
   */
  const fetchRestaurantServices = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch hotel details
      const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
      setHotel(hotelResponse.data.data);

      // Fetch restaurant services
      const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/dining/items`);
      console.log('🍽️ Restaurant services response:', servicesResponse.data);

      setRestaurantServices(servicesResponse.data.data.services || []);

      // Auto-select the first service that has menu items
      const serviceWithItems = servicesResponse.data.data.services?.find(service =>
        service.menuItems && service.menuItems.length > 0
      );

      if (serviceWithItems) {
        setSelectedService(serviceWithItems);
        console.log('🎯 Selected service:', serviceWithItems.name, 'with', serviceWithItems.menuItems.length, 'items');
      } else if (servicesResponse.data.data.services?.length > 0) {
        setSelectedService(servicesResponse.data.data.services[0]);
        console.log('⚠️ No services with items found, selected first service:', servicesResponse.data.data.services[0].name);
      }

    } catch (error) {
      console.error('Error fetching restaurant services:', error);
      toast.error('Failed to load restaurant services');
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    if (hotelId) {
      fetchRestaurantServices();
    }
  }, [hotelId, fetchRestaurantServices]);

  /**
   * Add item to cart
   */
  const addItemToCart = (item) => {
    const cartItem = {
      id: `${item.name}_${Date.now()}`,
      itemName: item.name,
      itemCategory: item.category,
      description: item.description,
      price: item.price,
      quantity: 1,
      totalPrice: item.price,
      isVegetarian: item.isVegetarian,
      isVegan: item.isVegan,
      spicyLevel: item.spicyLevel,
      preparationTime: item.preparationTime
    };

    setCart(prev => [...prev, cartItem]);
    toast.success(`${item.name} added to cart`);
  };

  /**
   * Update item quantity in cart
   */
  const updateCartItemQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }

    setCart(prev => prev.map(item =>
      item.id === cartItemId
        ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
        : item
    ));
  };

  /**
   * Remove item from cart
   */
  const removeFromCart = (cartItemId) => {
    setCart(prev => prev.filter(item => item.id !== cartItemId));
    toast.success('Item removed from cart');
  };

  /**
   * Calculate total pricing
   */
  const calculateTotal = () => {
    const subtotal = cart.reduce((sum, item) => sum + item.totalPrice, 0);
    return {
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
        menuItems: cart,
        schedule: {
          preferredDate: scheduling.preferredDate,
          preferredTime: scheduling.preferredTime
        },
        guestDetails: {
          deliveryLocation: scheduling.deliveryLocation || '',
          specialRequests: scheduling.specialRequests
        },
        location: {
          deliveryLocation: scheduling.deliveryLocation,
          deliveryInstructions: scheduling.specialRequests
        },
        pricing: {
          subtotal: calculateTotal().subtotal,
          total: calculateTotal().total
        }
      };

      console.log('🔵 Creating direct payment session for restaurant booking');

      // Create payment session directly without creating booking first
      const paymentResponse = await apiClient.post('/payments/kashier/create-payment-session', {
        bookingData,
        bookingType: 'restaurant',
        amount: calculateTotal().total,
        currency: 'USD'
      });

      if (paymentResponse.data.success) {
        const { paymentUrl } = paymentResponse.data.data;
        toast.success('Redirecting to payment...');
        // Redirect to Kashier payment page
        window.location.href = paymentUrl;
      } else {
        throw new Error(paymentResponse.data.message || 'Failed to create payment session');
      }

    } catch (error) {
      console.error('❌ Booking submission error:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create booking');
    } finally {
      setSubmitting(false);
    }
  };

  /**
   * Get spicy level icon
   */
  const getSpicyLevelIcon = (level) => {
    const levels = {
      mild: '🌶️',
      medium: '🌶️🌶️',
      hot: '🌶️🌶️🌶️',
      very_hot: '🌶️🌶️🌶️🌶️'
    };
    return levels[level] || '';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
      </div>
    );
  }

  if (restaurantServices.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaUtensils className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">No Restaurant Services Available</h2>
          <p className="text-gray-600 mb-4">This hotel doesn't offer restaurant services at the moment.</p>
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

  // Check if any services have menu items
  const servicesWithItems = restaurantServices.filter(service =>
    service.menuItems && service.menuItems.length > 0
  );

  if (servicesWithItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <FaUtensils className="text-6xl text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Menu Items Not Available</h2>
          <p className="text-gray-600 mb-2">
            This hotel has {restaurantServices.length} restaurant service provider(s), but none have configured their menu items yet.
          </p>
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

  const pricing = calculateTotal();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <FaUtensils className="inline mr-3" />
                Restaurant Service
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

          {/* Left Column - Menu Selection or Schedule */}
          <div className="lg:col-span-2">
            {bookingStep === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Select Menu Items</h2>

                {/* Service Provider Selection */}
                {servicesWithItems.length > 1 && (
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Choose Restaurant
                    </label>
                    <select
                      value={selectedService?._id || ''}
                      onChange={(e) => {
                        const service = servicesWithItems.find(s => s._id === e.target.value);
                        setSelectedService(service);
                      }}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      {servicesWithItems.map(service => (
                        <option key={service._id} value={service._id}>
                          {service.name} ({service.menuItems?.length || 0} items)
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Menu Items Grid */}
                {selectedService && selectedService.menuItems && (
                  <div className="space-y-6">
                    {/* Group items by category */}
                    {Object.entries(
                      selectedService.menuItems.reduce((grouped, item) => {
                        const category = item.category || 'other';
                        if (!grouped[category]) grouped[category] = [];
                        grouped[category].push(item);
                        return grouped;
                      }, {})
                    ).map(([category, items]) => (
                      <div key={category} className="space-y-4">
                        <h3 className="text-lg font-semibold text-gray-900 capitalize border-b pb-2">
                          {category === 'mains' ? 'Main Courses' :
                           category === 'appetizers' ? 'Appetizers' :
                           category === 'desserts' ? 'Desserts' :
                           category === 'beverages' ? 'Beverages' :
                           category}
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {items.map((item, index) => {
                            const isAvailable = item.isAvailable !== false;
                            return (
                              <div
                                key={index}
                                className={`border rounded-lg transition-colors p-4 ${
                                  isAvailable
                                    ? 'border-gray-200 hover:border-blue-300'
                                    : 'border-gray-200 bg-gray-50 opacity-60'
                                } flex flex-col justify-between h-full`}
                              >
                                <div className="mb-4">
                                  <div className="flex items-start justify-between mb-2">
                                    <h4 className={`font-medium ${isAvailable ? 'text-gray-900' : 'text-gray-500'}`}>
                                      <span className="text-lg mr-2">{item.icon || '🍽️'}</span>
                                      {item.name}
                                      {!isAvailable && (
                                        <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                          Unavailable
                                        </span>
                                      )}
                                    </h4>
                                    <div className="text-lg font-bold text-green-600">
                                      ${item.price}
                                    </div>
                                  </div>

                                  {item.description && (
                                    <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                                  )}

                                  <div className="flex items-center gap-2 text-xs">
                                    {item.isVegetarian && (
                                      <span className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
                                        <FaLeaf className="mr-1" />
                                        Vegetarian
                                      </span>
                                    )}
                                    {item.isVegan && (
                                      <span className="flex items-center bg-green-100 text-green-800 px-2 py-1 rounded">
                                        <FaLeaf className="mr-1" />
                                        Vegan
                                      </span>
                                    )}
                                    {item.spicyLevel && item.spicyLevel !== 'mild' && (
                                      <span className="flex items-center bg-red-100 text-red-800 px-2 py-1 rounded">
                                        <FaPepperHot className="mr-1" />
                                        {getSpicyLevelIcon(item.spicyLevel)}
                                      </span>
                                    )}
                                    {item.preparationTime && (
                                      <span className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                        <FaClock className="mr-1" />
                                        {item.preparationTime}min
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <button
                                  onClick={() => addItemToCart(item)}
                                  disabled={!isAvailable}
                                  className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
                                    isAvailable
                                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                  }`}
                                >
                                  <FaPlus className="inline mr-2" />
                                  Add to Cart
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* No items message */}
                {selectedService && (!selectedService.menuItems || selectedService.menuItems.length === 0) && (
                  <div className="text-center py-8">
                    <FaUtensils className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">No menu items available for this restaurant.</p>
                    <p className="text-sm text-gray-500">
                      The restaurant "{selectedService.name}" hasn't configured any menu items yet.
                    </p>
                  </div>
                )}
              </div>
            )}

            {bookingStep === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Schedule & Delivery</h2>

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
                      <option value="">Select time</option>
                      <option value="breakfast">Breakfast (7:00 - 10:00)</option>
                      <option value="lunch">Lunch (12:00 - 15:00)</option>
                      <option value="dinner">Dinner (18:00 - 22:00)</option>
                      <option value="anytime">Anytime (11:00 - 23:00)</option>
                    </select>
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-2" />
                    Delivery Location
                  </label>
                  <input
                    type="text"
                    value={scheduling.deliveryLocation}
                    onChange={(e) => setScheduling(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                    placeholder="Room number or delivery address"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={scheduling.specialRequests}
                    onChange={(e) => setScheduling(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any special dietary requirements, cooking preferences, or delivery instructions..."
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {bookingStep === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Order Confirmation</h2>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                  {cart.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.itemName}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                      </div>
                      <span className="font-semibold">${item.totalPrice}</span>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">${pricing.total}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Schedule & Delivery</h3>
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
                      <p className="text-gray-600">Delivery Location</p>
                      <p className="font-medium">{scheduling.deliveryLocation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Restaurant</p>
                      <p className="font-medium">{selectedService?.name}</p>
                    </div>
                  </div>

                  {scheduling.specialRequests && (
                    <div className="mt-4">
                      <p className="text-gray-600">Special Requests</p>
                      <p className="font-medium">{scheduling.specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Cart and Actions */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">
                <FaShoppingCart className="inline mr-2" />
                Your Order ({cart.length} items)
              </h3>

              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items in cart yet</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.itemName}</p>
                        <p className="text-xs text-gray-600">${item.price} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartItemQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-6 h-6 flex items-center justify-center bg-red-100 rounded-full text-red-600 hover:bg-red-200 ml-2"
                        >
                          <FaTrash className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span className="text-lg text-blue-600">${pricing.total}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="space-y-3">
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
                      disabled={!scheduling.preferredDate || !scheduling.preferredTime || !scheduling.deliveryLocation}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Review Order
                    </button>
                    <button
                      onClick={() => setBookingStep(1)}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Back to Menu
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
                          Creating Order...
                        </>
                      ) : (
                        <>
                          <FaCheck className="inline mr-2" />
                          Confirm Order
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

export default RestaurantBookingInterface;
