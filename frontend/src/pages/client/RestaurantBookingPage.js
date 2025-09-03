/**
 * Restaurant Booking Page (UI Redesign Only)
 * - Logic, fetching, routing, pricing, submission: UNCHANGED
 * - Tailwind visual overhaul: mobile-first, accessible, fast
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
  FaSearch,
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import MenuItemCard from '../../components/guest/MenuItemCard';
import useRTL from '../../hooks/useRTL';

const RestaurantBookingPage = () => {
  const { hotelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isRTL, textAlign } = useRTL();

  // Props from navigation state (UNCHANGED)
  const { service: passedService, hotel: passedHotel } = location.state || {};
  const [service, setService] = useState(passedService || null);
  const [services, setServices] = useState([]);
  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking State (UNCHANGED)
  const [step, setStep] = useState(1);
  const [selectedItems, setSelectedItems] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    preferredDate: '',
    preferredTime: '',
    deliveryLocation: '',
    specialRequests: ''
  });

  // UI State (UNCHANGED)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);

        if (passedService && passedHotel) {
          setService(passedService);
          setHotel(passedHotel);
          setServices([passedService]);
          setLoading(false);
          return;
        }

        if (hotelId) {
          const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
          setHotel(hotelResponse.data.data);

          const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/dining/items`);
          const responseData = servicesResponse.data.data;
          const restaurantServices = responseData?.services || [];

          if (restaurantServices && restaurantServices.length > 0) {
            setServices(restaurantServices);
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

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ===== Helpers (UNCHANGED) =====
  const getAvailableMenuItems = () => {
    let allItems = [];
    if (services && services.length > 0) {
      services.forEach(svc => {
        if (svc?.menuItems?.length) {
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
    } else if (service?.menuItems?.length) {
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

  const addToCart = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev => prev.map(selected =>
        selected.id === item.id
          ? { ...selected, quantity: selected.quantity + 1 }
          : selected
      ));
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1, totalPrice: item.price }]);
    }
    toast.success(`${item.name} added to cart`);
  };

  const updateQuantity = (itemId, newQuantity) => {
    if (newQuantity <= 0) return removeFromCart(itemId);
    setSelectedItems(prev => prev.map(item =>
      item.id === itemId
        ? { ...item, quantity: newQuantity, totalPrice: item.price * newQuantity }
        : item
    ));
  };

  const removeFromCart = (itemId) => {
    setSelectedItems(prev => prev.filter(item => item.id !== itemId));
    toast.success('Item removed from cart');
  };

  const calculatePricing = () => {
    const subtotal = selectedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return { subtotal, total: subtotal };
  };

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

  // ===== Derived UI values =====
  const availableItems = getAvailableMenuItems();
  const pricing = calculatePricing();

  // ===== Loading State (skeletons) =====
  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="w-full max-w-3xl space-y-6">
          <div className="h-14 rounded-xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-36 rounded-2xl bg-gradient-to-r from-gray-100 via-gray-50 to-gray-100 animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ===== Not Found =====
  if (!service) {
    return (
      <div className="min-h-screen bg-gray-50 grid place-items-center p-6">
        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl p-8 text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Service Not Found</h2>
          <p className="text-gray-600 mb-6">Try another category or go back to services.</p>
          <button
            onClick={() => navigate(`/hotels/${hotelId}/categories`)}
            className="rounded-xl bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white px-5 py-3 font-semibold hover:opacity-95 transition"
          >
            Back to Services
          </button>
        </div>
      </div>
    );
  }

  // ===== UI =====
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky top bar with stepper */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#3B5787] to-[#61B6DE] grid place-items-center text-white">
              <FaUtensils />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <div className="truncate">
                  <h1 className={`text-base sm:text-lg font-semibold text-gray-900 truncate ${textAlign}`}>
                    {service.name}
                  </h1>
                  <p className={`text-[11px] sm:text-xs text-gray-500 truncate ${textAlign}`}>{hotel?.name}</p>
                </div>
                {/* step indicator */}
                <div className="hidden sm:flex items-center gap-2 text-xs">
                  {[1,2,3].map(s => (
                    <div
                      key={s}
                      className={`h-2.5 w-10 rounded-full ${s <= step ? 'bg-[#61B6DE]' : 'bg-gray-200'}`}
                      aria-label={`Step ${s}`}
                    />
                  ))}
                </div>
              </div>
              {/* progress bar on mobile */}
              <div className="mt-2 sm:hidden h-1.5 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className="h-full bg-[#61B6DE] transition-all"
                  style={{ width: step === 1 ? '33%' : step === 2 ? '66%' : '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left / Main */}
          <section className="lg:col-span-2 space-y-6">
            {/* Step title */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {step === 1 && 'Select Menu Items'}
                    {step === 2 && 'Schedule & Delivery Details'}
                    {step === 3 && 'Order Confirmation'}
                  </h2>
                  <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                    {service.description}
                  </p>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-gray-500">Step {step} of 3</div>
                  <div className="font-semibold text-sm">
                    {step === 1 && 'Items'}
                    {step === 2 && 'Schedule'}
                    {step === 3 && 'Confirm'}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Items */}
            {step === 1 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/* Filters */}
                <div className="p-4 sm:p-5 border-b border-gray-100">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search menu items…"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE] text-sm"
                          aria-label="Search menu items"
                        />
                      </div>
                    </div>
                    <div className="sm:w-56">
                      <select
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full py-3 px-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE] text-sm"
                        aria-label="Filter by category"
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
                </div>

                {/* Items */}
                <div className="p-4 sm:p-6">
                  {(() => {
                    const filteredItems = availableItems.filter(item => {
                      const matchesCategory = categoryFilter === 'all' || item.category === categoryFilter;
                      const q = searchQuery.trim().toLowerCase();
                      const matchesSearch =
                        q === '' ||
                        item.name.toLowerCase().includes(q) ||
                        (item.description && item.description.toLowerCase().includes(q));
                      return matchesCategory && matchesSearch;
                    });

                    if (filteredItems.length === 0) {
                      return (
                        <div className="py-16 text-center">
                          <p className="text-gray-600">No items found matching your criteria.</p>
                        </div>
                      );
                    }

                    return (
                      <div className={isMobile ? "space-y-4" : "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6"}>
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
              </div>
            )}

            {/* Step 2: Schedule */}
            {step === 2 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE]"
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
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE]"
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
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE]"
                  />
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Special Requests
                  </label>
                  <textarea
                    value={bookingDetails.specialRequests}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder="Any dietary requirements, cooking preferences, or delivery instructions…"
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">Order Items</h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity} × ${item.price}</p>
                      </div>
                      <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>Total</span>
                    <span className="text-[#3B5787]">${pricing.total.toFixed(2)}</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">Preferred Date</p>
                    <p className="font-medium">{bookingDetails.preferredDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Preferred Time</p>
                    <p className="font-medium capitalize">{bookingDetails.preferredTime || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">Delivery Location</p>
                    <p className="font-medium">{bookingDetails.deliveryLocation || '—'}</p>
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
            )}
          </section>

          {/* Right / Cart */}
          <aside className="lg:col-span-1">
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sticky top-24">
              <h3 className={`text-base sm:text-lg font-semibold mb-4 flex items-center gap-2 ${textAlign}`}>
                <FaShoppingCart />
                Your Order ({selectedItems.length} items)
              </h3>

              {selectedItems.length === 0 ? (
                <p className="text-gray-500 text-center py-10">No items selected yet</p>
              ) : (
                <>
                  <div className="space-y-3 mb-5">
                    {selectedItems.map((item) => (
                      <div key={item.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-gray-600">${item.price} each</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-gray-300"
                            aria-label={`Decrease ${item.name}`}
                          >
                            <FaMinus className="text-[10px]" />
                          </button>
                          <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded-full bg-white border border-gray-200 hover:border-gray-300"
                            aria-label={`Increase ${item.name}`}
                          >
                            <FaPlus className="text-[10px]" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="border-t pt-3 mb-4">
                    <div className="flex justify-between items-center font-bold">
                      <span>Total</span>
                      <span className="text-lg text-[#3B5787]">${pricing.total.toFixed(2)}</span>
                    </div>
                  </div>
                </>
              )}

              {/* Step controls */}
              <div className="space-y-3">
                {step === 1 && (
                  <button
                    onClick={() => setStep(2)}
                    disabled={selectedItems.length === 0}
                    className="w-full rounded-xl bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white py-3 font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    Continue to Schedule
                  </button>
                )}

                {step === 2 && (
                  <>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!bookingDetails.preferredDate || !bookingDetails.preferredTime || !bookingDetails.deliveryLocation}
                      className="w-full rounded-xl bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white py-3 font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      Review Order
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="w-full rounded-xl bg-gray-100 text-gray-800 py-3 font-semibold hover:bg-gray-200 transition"
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
                      className="w-full rounded-xl bg-green-600 text-white py-3 font-semibold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
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
                      className="w-full rounded-xl bg-gray-100 text-gray-800 py-3 font-semibold hover:bg-gray-200 transition"
                    >
                      Back to Schedule
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Mobile sticky cart bar */}
      {selectedItems.length > 0 && (
        <div className="lg:hidden sticky bottom-0 z-30 border-t border-gray-200 bg-white/90 backdrop-blur-md">
          <div className={`max-w-6xl mx-auto px-4 py-3 flex items-center justify-between ${isRTL ? 'flex-row-reverse' : ''}`}>
            <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="h-9 w-9 rounded-full bg-[#3B5787] grid place-items-center text-white">
                <FaShoppingCart />
              </div>
              <div className={textAlign}>
                <div className="text-sm font-semibold">{selectedItems.length} item{selectedItems.length>1?'s':''}</div>
                <div className="text-xs text-gray-600">Total ${pricing.total.toFixed(2)}</div>
              </div>
            </div>
            {step === 1 && (
              <button
                onClick={() => setStep(2)}
                className="rounded-xl bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white px-4 py-2.5 text-sm font-semibold"
              >
                Continue
              </button>
            )}
            {step === 2 && (
              <button
                onClick={() => setStep(3)}
                disabled={!bookingDetails.preferredDate || !bookingDetails.preferredTime || !bookingDetails.deliveryLocation}
                className="rounded-xl bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                Review
              </button>
            )}
            {step === 3 && (
              <button
                onClick={handleBookingSubmit}
                disabled={submitting}
                className="rounded-xl bg-green-600 text-white px-4 py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? <FaSpinner className="animate-spin" /> : 'Pay'}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantBookingPage;
