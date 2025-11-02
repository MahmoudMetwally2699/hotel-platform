/**
 * Restaurant Booking Page (UI Redesign Only)
 * - Logic, fetching, routing, pricing, submission: UNCHANGED
 * - Tailwind visual overhaul: mobile-first, accessible, fast
 */

import React, { useState, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { selectCurrentUser } from '../../redux/slices/authSlice';
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
  FaArrowLeft,
  FaCheck,
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import MenuItemCard from '../../components/guest/MenuItemCard';
import useRTL from '../../hooks/useRTL';
import { formatPriceByLanguage, formatTotalWithSar } from '../../utils/currency';

const RestaurantBookingPage = () => {
  const { hotelId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { isRTL, textAlign } = useRTL();
  const currentUser = useSelector(selectCurrentUser);

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
    specialRequests: ''
  });

  // UI State (UNCHANGED)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartExpanded, setIsCartExpanded] = useState(false);

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
    toast.success(t('guest.restaurant.itemRemovedFromCart'));
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
          deliveryLocation: currentUser?.roomNumber || 'Room',
          specialRequests: bookingDetails.specialRequests
        },
        location: {
          deliveryLocation: currentUser?.roomNumber || 'Room',
          deliveryInstructions: bookingDetails.specialRequests
        },
        pricing: {
          subtotal: calculatePricing().subtotal,
          total: calculatePricing().total
        },
        serviceName: service?.name || 'Restaurant Service'
      };

      // Store booking data in localStorage and navigate to payment method selection
      localStorage.setItem('pendingBookingData', JSON.stringify(bookingData));

      // Navigate to payment method selection page with hotel currency
      const hotelCurrency = hotel?.paymentSettings?.currency || service?.currency || 'USD';
      navigate(`/payment-method?serviceType=restaurant&amount=${calculatePricing().total}&currency=${hotelCurrency}&hotelId=${hotelId}`);

    } catch (error) {
      toast.error(error.response?.data?.message || t('guest.restaurant.failedToCreateBooking'));
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">{t('services.dining')}</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading restaurant menu and services...</p>
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Modern Hero Header */}
      <div className="relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#3B5787] via-[#4a6694] to-[#3B5787] opacity-5"></div>

        {/* Header Content */}
        <div className="relative w-full px-2 sm:px-3 lg:px-4 pt-6 pb-8">
          {/* Back Button - Modern Style */}
          <button
            onClick={() => navigate(`/hotels/${hotelId}/categories`)}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-600 hover:text-[#3B5787] bg-white/80 backdrop-blur-sm hover:bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 mb-6"
          >
            <FaArrowLeft className="mr-2 text-xs" />
            <span>{t('common.back')}</span>
          </button>

          {/* Modern Header Card - Mobile Optimized */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20 mb-6">
            {/* Header Image with Overlay - Compact for Mobile */}
            <div className="relative h-32 sm:h-48">
              <img
                src="https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=400&fit=crop&crop=center"
                alt={t('services.dining')}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('bg-gradient-to-br', 'from-[#3B5787]', 'to-[#2d4265]');
                }}
              />

              {/* Floating Icon */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                <FaUtensils className="text-lg sm:text-2xl text-[#3B5787]" />
              </div>
            </div>

            {/* Modern Header Content - Compact */}
            <div className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full"></div>
                  <span className="text-xs font-medium text-[#3B5787] uppercase tracking-wider">
                    {t('guest.restaurant.diningExperience')}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {t('guest.restaurant.restaurantAndDining')}
                </h1>

                {/* Modern Stats/Features - Mobile Optimized */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#3B5787]/10 to-[#4a6694]/10 rounded-lg sm:rounded-xl">
                    <FaUtensils className="text-[#3B5787] text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.freshMenu')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl">
                    <FaCheck className="text-green-600 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.qualityFood')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl">
                    <FaMapMarkerAlt className="text-blue-600 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.roomService')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky top bar with stepper */}
      <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="w-full px-2 sm:px-3 lg:px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[#3B5787] to-[#61B6DE] grid place-items-center text-white">
              <FaUtensils />
            </div>
            <div className="min-w-0 flex-1">
              <div className={`flex items-center justify-between gap-3 ${isRTL ? 'flex-row-reverse' : ''}`}>
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
      <main className="w-full px-2 sm:px-3 lg:px-4 py-6 sm:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left / Main */}
          <section className="lg:col-span-2 space-y-6">
            {/* Step title */}
            <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                    {step === 1 && t('guest.restaurant.selectMenuItems')}
                    {step === 2 && t('guest.restaurant.scheduleDeliveryDetails')}
                    {step === 3 && t('guest.restaurant.orderConfirmation')}
                  </h2>
                </div>
                <div className="hidden sm:block text-right">
                  <div className="text-xs text-gray-500">{t('common.step')} {step} {t('common.of')} 3</div>
                  <div className="font-semibold text-sm">
                    {step === 1 && t('guest.restaurant.items')}
                    {step === 2 && t('guest.restaurant.schedule')}
                    {step === 3 && t('guest.restaurant.confirm')}
                  </div>
                </div>
              </div>
            </div>

            {/* Step 1: Items */}
            {step === 1 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
                {/* Filters */}
                <div className="p-4 sm:p-5 border-b border-gray-100">
                  {/* Search Bar */}
                  <div className="mb-4">
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

                  {/* Category Filter - Horizontal Scrollable Chips */}
                  <div className="overflow-x-auto -mx-4 sm:mx-0 modern-scrollbar">
                    <div className="flex gap-2 pb-2 px-4 sm:px-0" style={{ width: 'max-content', minWidth: '100%' }}>
                      {[
                        { value: 'all', label: t('common.allCategories'), icon: '🍽️' },
                        { value: 'appetizers', label: t('guest.restaurant.appetizers'), icon: '🥗' },
                        { value: 'mains', label: t('guest.restaurant.mainCourses'), icon: '🍖' },
                        { value: 'desserts', label: t('guest.restaurant.desserts'), icon: '🍰' },
                        { value: 'beverages', label: t('guest.restaurant.beverages'), icon: '🥤' },
                        { value: 'breakfast', label: t('common.breakfast'), icon: '🍳' },
                        { value: 'lunch', label: t('guest.restaurant.lunch'), icon: '🍱' },
                        { value: 'dinner', label: t('guest.restaurant.dinner'), icon: '🍴' },
                        { value: 'snacks', label: t('guest.restaurant.snacks'), icon: '🍿' }
                      ].map((category) => (
                        <button
                          key={category.value}
                          onClick={() => setCategoryFilter(category.value)}
                          className={`flex items-center gap-2 px-4 py-2.5 rounded-full whitespace-nowrap text-sm font-medium transition-all duration-200 flex-shrink-0 ${
                            categoryFilter === category.value
                              ? 'bg-gradient-to-r from-[#61B6DE] to-[#4A9CC5] text-white shadow-lg transform scale-105'
                              : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-[#61B6DE] hover:text-[#61B6DE] hover:shadow-md active:scale-95'
                          }`}
                        >
                          <span className="text-lg">{category.icon}</span>
                          <span>{category.label}</span>
                          {categoryFilter === category.value && (
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      ))}
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
                          const currency = service?.currency || hotel?.paymentSettings?.currency || 'USD';

                          return (
                            <MenuItemCard
                              key={index}
                              item={item}
                              quantity={quantity}
                              isMobile={isMobile}
                              currency={currency}
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
                      {t('guest.restaurant.preferredDate')}
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
                      {t('guest.restaurant.preferredTime')}
                    </label>
                    <input
                      type="time"
                      value={bookingDetails.preferredTime}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                      className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE]"
                      placeholder="Select your preferred time"
                    />
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaMapMarkerAlt className="inline mr-2" />
                    {t('guest.restaurant.deliveryLocation')}
                  </label>
                  <div className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 font-medium">
                    Room {currentUser?.roomNumber || 'N/A'}
                  </div>
                </div>

                <div className="mt-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('guest.restaurant.specialRequests')}
                  </label>
                  <textarea
                    value={bookingDetails.specialRequests}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                    placeholder={t('guest.restaurant.specialRequestsPlaceholder')}
                    rows={3}
                    className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#61B6DE] focus:border-[#61B6DE]"
                  />
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {step === 3 && (
              <div className="rounded-2xl border border-gray-100 bg-white shadow-sm p-5 sm:p-6">
                <h3 className="text-lg font-semibold mb-4">{t('guest.restaurant.orderItems')}</h3>
                <div className="space-y-3">
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity} × {formatPriceByLanguage(item.price, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}</p>
                      </div>
                      <span className="font-semibold">{formatPriceByLanguage(item.price * item.quantity, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center font-bold text-lg">
                    <span>{t('guest.restaurant.total')}</span>
                    <span className="text-[#3B5787]">{formatTotalWithSar(pricing.total, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}</span>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">{t('guest.restaurant.preferredDate')}</p>
                    <p className="font-medium">{bookingDetails.preferredDate || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('guest.restaurant.preferredTime')}</p>
                    <p className="font-medium capitalize">{bookingDetails.preferredTime || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('guest.restaurant.deliveryLocation')}</p>
                    <p className="font-medium">Room {currentUser?.roomNumber || '—'}</p>
                  </div>
                  <div>
                    <p className="text-gray-600">{t('guest.restaurant.restaurant')}</p>
                    <p className="font-medium">{service.name}</p>
                  </div>
                </div>

                {bookingDetails.specialRequests && (
                  <div className="mt-4">
                    <p className="text-gray-600">{t('guest.restaurant.specialRequests')}</p>
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
                {t('guest.restaurant.yourOrder')} ({selectedItems.length} {t('guest.restaurant.items')})
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
                          <p className="text-xs text-gray-600">{formatPriceByLanguage(item.price, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')} each</p>
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
                      <span>{t('guest.restaurant.total')}</span>
                      <span className="text-lg text-[#3B5787]">{formatTotalWithSar(pricing.total, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}</span>
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
                    {t('guest.restaurant.continueToSchedule')}
                  </button>
                )}

                {step === 2 && (
                  <>
                    <button
                      onClick={() => setStep(3)}
                      disabled={!bookingDetails.preferredDate || !bookingDetails.preferredTime || !currentUser?.roomNumber}
                      className="w-full rounded-xl bg-gradient-to-r from-[#3B5787] to-[#61B6DE] text-white py-3 font-semibold hover:opacity-95 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {t('guest.restaurant.reviewOrder')}
                    </button>
                    <button
                      onClick={() => setStep(1)}
                      className="w-full rounded-xl bg-gray-100 text-gray-800 py-3 font-semibold hover:bg-gray-200 transition"
                    >
                      {t('guest.restaurant.backToMenu')}
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
                          {t('guest.restaurant.creatingOrder')}
                        </>
                      ) : (
                        t('guest.restaurant.confirmAndPay')
                      )}
                    </button>
                    <button
                      onClick={() => setStep(2)}
                      disabled={submitting}
                      className="w-full rounded-xl bg-gray-100 text-gray-800 py-3 font-semibold hover:bg-gray-200 transition"
                    >
                      {t('guest.restaurant.backToSchedule')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>
      </main>

      {/* Sticky Mobile Cart - Laundry Style */}
      {selectedItems.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
          {/* Expandable Cart Summary */}
          {isCartExpanded && (
            <div className="border-b border-gray-200 max-h-64 overflow-y-auto">
              <div className="px-4 py-3">
                <h4 className="font-medium text-gray-900 mb-3 text-sm">Order Summary</h4>
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center text-sm">
                      <div className="flex-1">
                        <span className="text-gray-900">{item.name}</span>
                        <span className="text-gray-500 ml-1">×{item.quantity}</span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {formatPriceByLanguage(item.price * item.quantity, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-green-600 mt-1">
                      <span>Total</span>
                      <span>{formatTotalWithSar(pricing.total, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Main Cart Bar */}
          <div className="px-4 py-3">
            <div
              className="flex items-center justify-between mb-2 cursor-pointer"
              onClick={() => setIsCartExpanded(!isCartExpanded)}
            >
              <div className="flex items-center">
                <div className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-2">
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
                <span className="text-sm text-gray-600">
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} {t('guest.restaurant.items')}
                </span>
                <div className="ml-2">
                  <svg
                    className={`w-4 h-4 text-gray-400 transition-transform ${isCartExpanded ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-green-600">
                  {formatTotalWithSar(pricing.total, i18n.language, service?.currency || hotel?.paymentSettings?.currency || 'USD')}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              {step === 1 && (
                <button
                  onClick={() => setStep(2)}
                  className="flex-1 bg-[#3B5787] hover:bg-[#2d4265] text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
                >
                  Continue
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={() => setStep(3)}
                  disabled={!bookingDetails.preferredDate || !bookingDetails.preferredTime || !currentUser?.roomNumber}
                  className="flex-1 bg-[#3B5787] hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
                >
                  Review Order
                </button>
              )}
              {step === 3 && (
                <button
                  onClick={handleBookingSubmit}
                  disabled={submitting}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      {t('guest.restaurant.creatingOrder')}
                    </>
                  ) : (
                    t('guest.restaurant.confirmAndPay')
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RestaurantBookingPage;
