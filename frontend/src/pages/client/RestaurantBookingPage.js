/**
 * Restaurant Booking Page for Client/Guest Interface
 * Similar to LaundryBookingPage but for restaurant services
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaUtensils,
  FaPlus,
  FaMinus,
  FaShoppingCart,
  FaCalendarAlt,
  FaClock,
  FaMapMarkerAlt,
  FaSpinner,
  FaFilter,
  FaSearch,
  FaLeaf,
  FaPepperHot
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import MenuItemCard from '../../components/guest/MenuItemCard';

const RestaurantBookingPage = () => {
  const { hotelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Props from navigation state
  const { service: passedService, hotel: passedHotel } = location.state || {};
  const [service, setService] = useState(passedService || null);
  const [services, setServices] = useState([]); // Store all available services
  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking State
  const [step, setStep] = useState(1); // 1: Items, 2: Schedule, 3: Confirmation
  const [selectedItems, setSelectedItems] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    preferredDate: '',
    preferredTime: '',
    deliveryLocation: '',
    specialRequests: ''
  });

  // UI State
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);

        // If we have the service and hotel from navigation, use them
        if (passedService && passedHotel) {
          setService(passedService);
          setHotel(passedHotel);
          setServices([passedService]);
          setLoading(false);
          return;
        }

        // Otherwise fetch hotel details and restaurant service
        if (hotelId) {
          const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
          setHotel(hotelResponse.data.data);

          // Fetch restaurant services with items for this hotel
          const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/dining/items`);

          const responseData = servicesResponse.data.data;
          const restaurantServices = responseData?.services || [];

          console.log('🔍 Restaurant services response:', {
            success: servicesResponse.data.success,
            totalServices: restaurantServices.length,
            services: restaurantServices.map(s => ({ id: s._id, name: s.name, category: s.category }))
          });

          if (restaurantServices && restaurantServices.length > 0) {
            // Store all available services
            setServices(restaurantServices);
            // Keep the first service as primary for backwards compatibility
            setService(restaurantServices[0]);
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

  // Handle window resize for responsive design
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);  // Get available menu items from all services
  const getAvailableMenuItems = () => {
    let allItems = [];

    // If using all services (fetched from API)
    if (services && services.length > 0) {
      services.forEach(svc => {
        if (svc?.menuItems && svc.menuItems.length > 0) {
          const serviceItems = svc.menuItems
            .filter(item => item.isAvailable !== false)
            .map(item => ({
              ...item,
              id: `${svc._id}_${item.name.toLowerCase().replace(/\s+/g, '_')}`,
              serviceId: svc._id,
              serviceName: svc.name,
            }));
          allItems = [...allItems, ...serviceItems];
        }
      });
    }

    // Fallback: if only single service is available (passed via props)
    else if (service?.menuItems && service.menuItems.length > 0) {
      allItems = service.menuItems
        .filter(item => item.isAvailable !== false)
        .map(item => ({
          ...item,
          id: item.name.toLowerCase().replace(/\s+/g, '_'),
          serviceId: service._id,
          serviceName: service.name,
        }));
    }

    return allItems;
  };

  // Add item to cart
  const addToCart = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);

    if (existingItem) {
      setSelectedItems(prev => prev.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems(prev => [...prev, {
        ...item,
        quantity: 1,
        totalPrice: item.price
      }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  // Update item quantity
  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    setSelectedItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
        : item
    ));
  };

  // Remove item from cart
  const removeFromCart = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  // Calculate pricing
  const calculatePricing = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return {
      subtotal,
      total: subtotal // No express charges for restaurant
    };
  };

  // Get spicy level icon
  const getSpicyLevelIcon = (level) => {
    const levels = {
      mild: '🌶️',
      medium: '🌶️🌶️',
      hot: '🌶️🌶️🌶️',
      very_hot: '🌶️🌶️🌶️🌶️'
    };
    return levels[level] || '';
  };

  // Handle booking submission
  const handleBookingSubmit = async () => {
    try {
      setSubmitting(true);

      const bookingData = {
        serviceId: selectedItems[0]?.serviceId || service?._id,
        hotelId,
        menuItems: selectedItems.map(item => ({
          itemName: item.name,
          itemCategory: item.category,
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          totalPrice: item.price * item.quantity,
          isVegetarian: item.isVegetarian,
          isVegan: item.isVegan,
          spicyLevel: item.spicyLevel,
          preparationTime: item.preparationTime
        })),
        schedule: {
          preferredDate: bookingDetails.preferredDate,
          preferredTime: bookingDetails.preferredTime
        },
        guestDetails: {
          deliveryLocation: bookingDetails.deliveryLocation,
          specialRequests: bookingDetails.specialRequests
        },
        location: {
          deliveryLocation: bookingDetails.deliveryLocation,
          deliveryInstructions: bookingDetails.specialRequests
        },
        pricing: {
          subtotal: calculatePricing().subtotal,
          total: calculatePricing().total
        }
      };

      console.log('🔵 Creating direct payment session for restaurant booking');

      // Create payment session directly
      const paymentResponse = await apiClient.post('/payments/kashier/create-payment-session', {
        bookingData,
        bookingType: 'restaurant',
        amount: calculatePricing().total,
        currency: 'USD'
      });

      if (paymentResponse.data.success) {
        const { paymentUrl } = paymentResponse.data.data;
        toast.success('Redirecting to payment...');
        window.location.href = paymentUrl;
      } else {
        throw new Error(paymentResponse.data.message || 'Failed to create payment session');
      }

    } catch (error) {
      console.error('❌ Booking submission error:', error);
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

  if (!service) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Service Not Found</h2>
          <button
            onClick={() => navigate(`/hotels/${hotelId}/categories`)}
            className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  const availableItems = getAvailableMenuItems();
  const pricing = calculatePricing();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                <FaUtensils className="inline mr-3" />
                {service.name}
              </h1>
              <p className="text-gray-600 mt-2">{hotel?.name}</p>
              <p className="text-sm text-gray-500">{service.description}</p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Step {step} of 3</div>
              <div className="font-semibold text-lg">
                {step === 1 && 'Select Items'}
                {step === 2 && 'Schedule & Details'}
                {step === 3 && 'Confirm Order'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            {step === 1 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Select Menu Items</h2>

                {availableItems.length === 0 ? (
                  <div className="text-center py-8">
                    <FaUtensils className="text-4xl text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-600">No menu items available for this restaurant.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Filter and Search Bar */}
                    <div className="flex flex-col sm:flex-row gap-4 mb-6">
                      <div className="flex-1">
                        <div className="relative">
                          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                          <input
                            type="text"
                            placeholder="Search menu items..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                          />
                        </div>
                      </div>
                      <div className="sm:w-48">
                        <select
                          value={categoryFilter}
                          onChange={(e) => setCategoryFilter(e.target.value)}
                          className="w-full py-3 px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                        >
                          <option value="all">All Categories</option>
                          <option value="appetizers">Appetizers</option>
                          <option value="mains">Main Courses</option>
                          <option value="desserts">Desserts</option>
                          <option value="beverages">Beverages</option>
                          <option value="breakfast">Breakfast</option>
                        </select>
                      </div>
                    </div>

                    {/* Filtered Items */}
                    {(() => {
                      const filteredItems = availableItems.filter(item => {
                        const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
                        const matchesSearch = searchQuery === '' ||
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.description && item.description.toLowerCase().includes(searchQuery.toLowerCase()));
                        return matchesCategory && matchesSearch;
                      });

                      if (filteredItems.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <p className="text-gray-600">No items found matching your criteria.</p>
                          </div>
                        );
                      }

                      return (
                        <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"}>
                          {filteredItems.map((item, index) => {
                            const existingItem = selectedItems.find(selected => selected.id === item.id);
                            const quantity = existingItem ? existingItem.quantity : 0;

                            return (
                              <MenuItemCard
                                key={index}
                                item={item}
                                quantity={quantity}
                                isMobile={isMobile}
                                onAdd={() => addToCart(item)}
                                onIncrease={() => updateQuantity(item.id, quantity + 1)}
                                onDecrease={() => updateQuantity(item.id, quantity - 1)}
                              />
                            );
                          })}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Schedule & Delivery Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaCalendarAlt className="inline mr-2" />
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      min={new Date().toISOString().split('T')[0]}
                      value={bookingDetails.preferredDate}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredDate: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaClock className="inline mr-2" />
                      Preferred Time
                    </label>
                    <select
                      value={bookingDetails.preferredTime}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
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
                    value={bookingDetails.deliveryLocation}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                    placeholder="Room number or delivery address"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={bookingDetails.specialRequests}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any special dietary requirements, cooking preferences, or delivery instructions..."
                    rows="3"
                    className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-2xl font-bold mb-6">Order Confirmation</h2>

                {/* Order Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Order Items</h3>
                  {selectedItems.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-sm text-gray-600">Quantity: {item.quantity} × ${item.price}</p>
                      </div>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}

                  <div className="border-t pt-4">
                    <div className="flex justify-between items-center font-bold text-lg">
                      <span>Total</span>
                      <span className="text-blue-600">${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Schedule Summary */}
                <div className="mt-6 pt-6 border-t">
                  <h3 className="text-lg font-semibold mb-4">Schedule & Delivery</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Preferred Date</p>
                      <p className="font-medium">{bookingDetails.preferredDate}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Preferred Time</p>
                      <p className="font-medium">{bookingDetails.preferredTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Delivery Location</p>
                      <p className="font-medium">{bookingDetails.deliveryLocation}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Restaurant</p>
                      <p className="font-medium">{service.name}</p>
                    </div>
                  </div>

                  {bookingDetails.specialRequests && (
                    <div className="mt-4">
                      <p className="text-gray-600">Special Requests</p>
                      <p className="font-medium">{bookingDetails.specialRequests}</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right Column - Cart */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-6">
              <h3 className="text-lg font-semibold mb-4">
                <FaShoppingCart className="inline mr-2" />
                Your Order ({selectedItems.length} items)
              </h3>

              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No items selected yet</p>
              ) : (
                <div className="space-y-3 mb-6">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{item.name}</p>
                        <p className="text-xs text-gray-600">${item.price} each</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"
                        >
                          <FaMinus className="text-xs" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center bg-gray-200 rounded-full text-gray-600 hover:bg-gray-300"
                        >
                          <FaPlus className="text-xs" />
                        </button>
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-3">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span className="text-lg text-blue-600">${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              <div className="space-y-3">
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedItems.length === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Continue to Schedule
                  </button>
                )}

                {step === 2 && (
                  <>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!bookingDetails.preferredDate || !bookingDetails.preferredTime || !bookingDetails.deliveryLocation}
                      className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Review Order
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="w-full bg-gray-200 text-gray-700 py-3 px-4 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Back to Menu
                    </button>
                  </>
                )}

                {step === 3 && (
                  <>
                    <button
                      onClick={handleBookingSubmit}
                      disabled={submitting}
                      className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="inline animate-spin mr-2" />
                          Creating Order...
                        </>
                      ) : (
                        'Confirm & Pay'
                      )}
                    </button>
                    <button
                      onClick={() => setStep(2)}
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

export default RestaurantBookingPage;
