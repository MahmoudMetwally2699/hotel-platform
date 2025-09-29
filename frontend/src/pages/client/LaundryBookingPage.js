/**
 * Enhanced Laundry Service Booking Page
 * Interactive selection with real-time pricing and service type selection
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  FaTshirt,
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
  FaStickyNote,
  FaSearch,
  FaFilter,
  FaTimes
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import useRTL from '../../hooks/useRTL';
import { formatPriceByLanguage, formatTotalWithSar } from '../../utils/currency';
import { selectCurrentUser } from '../../redux/slices/authSlice';

const LaundryBookingPage = () => {  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { hotelId } = useParams();
  const currentUser = useSelector(selectCurrentUser);
  // Get service and hotel from location state
  const { service: passedService, hotel: passedHotel } = location.state || {};
  const [service, setService] = useState(passedService || null);
  const [services, setServices] = useState([]); // Store all available services
  // eslint-disable-next-line no-unused-vars
  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Booking State
  const [step, setStep] = useState(1); // 1: Items, 2: Service Types, 3: Details, 4: Confirmation
  const [selectedItems, setSelectedItems] = useState([]);
  const [serviceTypes, setServiceTypes] = useState({});
  const [expressService, setExpressService] = useState(false);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    preferredDate: '',
    preferredTime: '',
    specialRequests: ''
  });

  // Filter and Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  // Get available laundry items from all services (combine items from all service providers)
  const getAvailableLaundryItems = () => {
    let allItems = [];

    // If using all services (fetched from API)
    if (services && services.length > 0) {
      services.forEach(svc => {
        if (svc?.laundryItems && svc.laundryItems.length > 0) {
          const serviceItems = svc.laundryItems
            .filter(item => item.isAvailable)
            .map(item => ({
              ...item,
              id: `${svc._id}_${item.name.toLowerCase().replace(/\s+/g, '_')}`, // Unique ID with service prefix
              serviceId: svc._id, // Track which service this item belongs to
              serviceName: svc.name,
            }));
          allItems = [...allItems, ...serviceItems];
        }
      });
    }

    // Fallback: if only single service is available (passed via props)
    else if (service?.laundryItems && service.laundryItems.length > 0) {
      allItems = service.laundryItems
        .filter(item => item.isAvailable)
        .map(item => ({
          ...item,
          id: item.name.toLowerCase().replace(/\s+/g, '_'),
          serviceId: service._id,
          serviceName: service.name,
        }));    }

    return allItems;
  };  // Get available service types for an item (search across all services)  // Get available service types for an item (search across all services)
  const getAvailableServiceTypes = (itemId) => {
    // Try a simpler approach - search by the original item name
    const availableItems = getAvailableLaundryItems();
    const currentItem = availableItems.find(item => item.id === itemId);

    if (currentItem && currentItem.serviceTypes) {      return currentItem.serviceTypes
        .filter(st => st.isAvailable && st.price > 0)
        .map(st => ({
          id: st.serviceTypeId,
          name: getServiceTypeName(st.serviceTypeId),
          price: st.price,
          description: getServiceTypeDescription(st.serviceTypeId),
          duration: getServiceTypeDuration(st.serviceTypeId)
        }));
    }

    return [];
  };
  // Helper functions to get service type details
  const getServiceTypeName = (serviceTypeId) => {
    return t(`laundryBooking.serviceTypeNames.${serviceTypeId}`, { defaultValue: serviceTypeId });
  };

  const getServiceTypeDescription = (serviceTypeId) => {
    return t(`laundryBooking.serviceTypeDescriptions.${serviceTypeId}`, {
      defaultValue: t('laundryBooking.serviceTypeDescriptions.default')
    });
  };

  const getServiceTypeDuration = (serviceTypeId) => {
    return t(`laundryBooking.serviceTypeDurations.${serviceTypeId}`, {
      defaultValue: t('laundryBooking.serviceTypeDurations.default')
    });  };

  // Helper functions to translate category and item names
  const getCategoryName = (category) => {
    return t(`laundryBooking.itemCategories.${category}`, { defaultValue: category });
  };  const getItemName = (itemName) => {
    // Convert item name to key format (lowercase, handle special characters)
    const itemKey = itemName
      .toLowerCase()
      .replace(/\s+/g, '_')        // Replace spaces with underscores
      .replace(/[()]/g, '_')       // Replace parentheses with underscores
      .replace(/-/g, '_')          // Replace hyphens with underscores
      .replace(/_{2,}/g, '_')      // Replace multiple underscores with single underscore
      .replace(/^_|_$/g, '');      // Remove leading/trailing underscores

    console.log(`🔤 Translating item: "${itemName}" -> key: "${itemKey}"`);
    const translated = t(`laundryBooking.itemNames.${itemKey}`, { defaultValue: itemName });
    console.log(`🔤 Translation result: "${translated}"`);

    return translated;
  };

  // Filter and search function
  const getFilteredItems = () => {
    let items = getAvailableLaundryItems();

    // Filter by category
    if (selectedCategory !== 'all') {
      items = items.filter(item => item.category === selectedCategory);
    }

    // Filter by search term
    if (searchTerm.trim()) {
      items = items.filter(item =>
        getItemName(item.name).toLowerCase().includes(searchTerm.toLowerCase()) ||
        getCategoryName(item.category).toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return items;
  };

  // Get unique categories for filter buttons
  const getAvailableCategories = () => {
    return getAvailableLaundryItems()
      .map(item => item.category)
      .filter((value, index, self) => self.indexOf(value) === index);
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
        }        // Otherwise fetch hotel details and laundry service
        if (hotelId) {
          const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
          setHotel(hotelResponse.data.data);          // Fetch laundry services with items for this hotel
          const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/laundry/items`);

          const responseData = servicesResponse.data.data;
          const laundryServices = responseData?.services || [];          console.log('🔍 Laundry services response:', {
            success: servicesResponse.data.success,
            totalServices: laundryServices.length,
            services: laundryServices.map(s => ({ id: s._id, name: s.name, category: s.category }))
          });

          // Add detailed logging of the first service to see full structure
          if (laundryServices.length > 0) {
            console.log('🧺 Full first service structure:', laundryServices[0]);
            console.log('🧺 Service has laundryItems:', !!laundryServices[0].laundryItems);
            console.log('🧺 LaundryItems count:', laundryServices[0].laundryItems?.length || 0);
            if (laundryServices[0].laundryItems?.length > 0) {
              console.log('🧺 First laundry item:', laundryServices[0].laundryItems[0]);
            }
          }if (laundryServices && laundryServices.length > 0) {
            // Store all available services
            setServices(laundryServices);
            // Keep the first service as primary for backwards compatibility
            setService(laundryServices[0]);
          } else {            toast.error(t('errors.loadServices'));
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
  // Item selection handlers
  const handleItemAdd = (item) => {
    const existingItem = selectedItems.find(selected => selected.id === item.id);
    if (existingItem) {
      setSelectedItems(prev =>
        prev.map(selected =>
          selected.id === item.id
            ? { ...selected, quantity: selected.quantity + 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => [...prev, { ...item, quantity: 1 }]);
    }    // Set default service type
    if (!serviceTypes[item.id]) {
      const availableServiceTypes = getAvailableServiceTypes(item.id);
      if (availableServiceTypes.length > 0) {
        setServiceTypes(prev => ({ ...prev, [item.id]: availableServiceTypes[0].id }));
      }
    }
  };

  const handleItemRemove = (itemId) => {
    const existingItem = selectedItems.find(selected => selected.id === itemId);
    if (existingItem && existingItem.quantity > 1) {
      setSelectedItems(prev =>
        prev.map(selected =>
          selected.id === itemId
            ? { ...selected, quantity: selected.quantity - 1 }
            : selected
        )
      );
    } else {
      setSelectedItems(prev => prev.filter(selected => selected.id !== itemId));
      setServiceTypes(prev => {
        const newTypes = { ...prev };
        delete newTypes[itemId];
        return newTypes;
      });
    }
  };

  const handleServiceTypeChange = (itemId, serviceType) => {
    setServiceTypes(prev => ({ ...prev, [itemId]: serviceType }));
  };
  // Calculate pricing with real service prices
  const calculatePricing = () => {
    let subtotal = 0;    const itemCalculations = selectedItems.map(item => {
      const availableServiceTypes = getAvailableServiceTypes(item.id); // Use item.id instead of item.name
      const selectedServiceType = availableServiceTypes.find(st => st.id === serviceTypes[item.id]);
      const itemPrice = (selectedServiceType?.price || 0) * item.quantity;
      subtotal += itemPrice;return {
        ...item,
        serviceType: selectedServiceType,
        basePrice: selectedServiceType?.price || 0, // Original service provider price
        itemPrice: itemPrice
      };
    });    const expressCharge = expressService ? subtotal * 0.5 : 0; // 50% surcharge for express
    const total = subtotal + expressCharge; // Backend prices already include hotel markup

    return {
      itemCalculations,
      subtotal,
      expressCharge,
      total
    };
  };

  const pricing = calculatePricing();

  // Handle booking submission
  const handleBookingSubmit = async () => {
    // Validate room number
    if (!currentUser?.roomNumber) {
      toast.error('Room number is required. Please update your profile.');
      return;
    }

    try {
      setSubmitting(true);

      const bookingData = {
        serviceId: pricing.itemCalculations[0]?.serviceId || service?._id, // Use the service ID of the first item
        hotelId,
        laundryItems: pricing.itemCalculations.map(item => ({
          itemId: item.id,
          itemName: item.name,
          itemCategory: item.category,
          quantity: item.quantity,
          serviceTypeId: item.serviceType.id,
          serviceTypeName: item.serviceType.name,
          serviceTypeDescription: item.serviceType.description,
          serviceTypeDuration: item.serviceType.duration,
          basePrice: item.basePrice,
          totalPrice: item.itemPrice
        })),
        expressSurcharge: {
          enabled: expressService,
          rate: pricing.expressCharge
        },
        schedule: {
          preferredDate: bookingDetails.preferredDate,
          preferredTime: bookingDetails.preferredTime
        },
        location: {
          pickupLocation: currentUser.roomNumber,
          deliveryLocation: currentUser.roomNumber,
          pickupInstructions: bookingDetails.specialRequests
        },
        guestDetails: {
          roomNumber: currentUser.roomNumber,
          specialRequests: bookingDetails.specialRequests
        },
        pricing: {
          subtotal: pricing.subtotal,
          expressCharge: pricing.expressCharge,
          total: pricing.total
        },
        serviceName: service?.name || 'Laundry Service'
      };

      console.log('🔵 Proceeding to payment method selection for laundry booking');

      // Store booking data in localStorage and navigate to payment method selection
      localStorage.setItem('pendingBookingData', JSON.stringify(bookingData));

      // Navigate to payment method selection page
      navigate(`/payment-method?serviceType=laundry&amount=${pricing.total}&currency=USD`);

    } catch (error) {
      console.error('❌ Booking submission error:', error);
      toast.error(error.response?.data?.message || error.message || t('laundryBooking.bookingError'));
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
        return selectedItems.length > 0;
      case 2:
        return selectedItems.every(item => serviceTypes[item.id]);
      case 3:
        return bookingDetails.preferredDate && bookingDetails.preferredTime;
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Laundry Service</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('laundryBooking.loadingService')}</p>
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
            <span>{t('common.back', 'Back')}</span>
          </button>

          {/* Modern Header Card - Mobile Optimized */}
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl sm:rounded-3xl shadow-lg sm:shadow-xl hover:shadow-xl sm:hover:shadow-2xl transition-all duration-300 overflow-hidden border border-white/20">
            {/* Header Image with Overlay - Compact for Mobile */}
            <div className="relative h-32 sm:h-48">
              <img
                src="https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&h=400&fit=crop&crop=center"
                alt="Laundry Services"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.classList.add('bg-gradient-to-br', 'from-[#3B5787]', 'to-[#2d4265]');
                }}
              />

              {/* Floating Icon */}
              <div className="absolute top-3 right-3 sm:top-4 sm:right-4 p-2 sm:p-3 bg-white/90 backdrop-blur-sm rounded-xl sm:rounded-2xl shadow-lg">
                <FaTshirt className="text-lg sm:text-2xl text-[#3B5787]" />
              </div>
            </div>

            {/* Modern Header Content - Compact */}
            <div className="p-4 sm:p-6">
              <div className="space-y-2 sm:space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="h-1 w-8 sm:w-12 bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full"></div>
                  <span className="text-xs font-medium text-[#3B5787] uppercase tracking-wider">
                    {t('guestCategories.professionalService')}
                  </span>
                </div>

                <h1 className="text-xl sm:text-3xl font-bold text-gray-900 leading-tight">
                  {t('laundryBooking.title')}
                </h1>

                {/* Remove the "Available at" text completely */}

                {/* Modern Stats/Features - Mobile Optimized */}
                <div className="flex flex-wrap gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-[#3B5787]/10 to-[#4a6694]/10 rounded-lg sm:rounded-xl">
                    <FaClock className="text-[#3B5787] text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.quickService')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-lg sm:rounded-xl">
                    <FaCheck className="text-green-600 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.qualityAssured')}</span>
                  </div>
                  <div className="flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1 sm:py-1.5 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-lg sm:rounded-xl">
                    <FaMapMarkerAlt className="text-blue-600 text-xs sm:text-sm" />
                    <span className="text-xs sm:text-sm font-medium text-gray-700">{t('guestCategories.pickupAndDelivery')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-4 pb-20 lg:pb-6">

      {/* Compact Progress Indicator */}
      <div className="w-full px-4 py-3">
        {/* Minimal Progress Container */}
        <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-sm border border-white/20 px-3 py-2 sm:px-4 sm:py-3">
          {/* Compact Progress Track */}
          <div className="relative mb-3">
            {/* Background Track - Thinner */}
            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
              {/* Progress Fill - Simplified */}
              <div
                className="h-full bg-gradient-to-r from-[#3B5787] to-[#4a6694] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${((step - 1) / 3) * 100}%` }}
              ></div>
            </div>

            {/* Compact Step Indicators */}
            <div className="absolute top-0 left-0 w-full flex justify-between transform -translate-y-1/2">
              {[1, 2, 3, 4].map((stepNum) => (
                <div key={stepNum} className={`w-6 h-6 sm:w-7 sm:h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                  step >= stepNum
                    ? 'bg-[#3B5787] border-[#3B5787] text-white shadow-sm'
                    : step === stepNum
                    ? 'bg-white border-[#3B5787] text-[#3B5787] shadow-sm'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step > stepNum ? <FaCheck className="w-2.5 h-2.5" /> : stepNum}
                </div>
              ))}
            </div>
          </div>

          {/* Compact Step Labels */}
          <div className="grid grid-cols-4 gap-1 text-center">
            {[
              { key: 'selectItems', short: 'Items' },
              { key: 'serviceTypes', short: 'Service' },
              { key: 'schedule', short: 'Schedule' },
              { key: 'confirm', short: 'Confirm' }
            ].map((item, index) => {
              const stepNum = index + 1;
              const isActive = step >= stepNum;

              return (
                <div key={item.key} className={`transition-all duration-200 ${
                  isActive ? 'text-[#3B5787]' : 'text-gray-500'
                }`}>
                  <div className="text-xs font-medium">
                    <span className="hidden sm:inline">{t(`laundryBooking.${item.key}`)}</span>
                    <span className="sm:hidden">{item.short}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="w-full px-3 sm:px-4 py-4 sm:py-6 pb-20 lg:pb-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">            {step === 1 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
                {/* Compact Header */}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                    {t('laundryBooking.selectLaundryItems')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">Choose items and quantities</p>
                </div>

                {/* Check if any items are available */}
                {(() => {
                  const availableItems = getAvailableLaundryItems();
                  if (availableItems.length === 0) {
                    return (
                      <div className="text-center py-8 sm:py-12">
                        <FaTshirt className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4" />
                        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">
                          {t('laundryBooking.noItemsAvailable')}
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          {t('laundryBooking.noItemsDescription')}
                        </p>
                        <button
                          onClick={() => navigate(`/hotels/${hotelId}/categories`)}
                          className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-xl text-white bg-[#3B5787] hover:bg-[#2d4265] transition-colors"
                        >
                          <FaArrowLeft className="mr-2" />
                          {t('laundryBooking.backToServices')}
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Search and Filter Section */}
                {getAvailableLaundryItems().length > 0 && (
                  <div className="mb-4 sm:mb-6">
                    {/* Search Bar */}
                    <div className="relative mb-3">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaSearch className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        placeholder="Search laundry items..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full pl-10 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#3B5787]/20 focus:border-[#3B5787] transition-colors"
                      />
                      {searchTerm && (
                        <button
                          onClick={() => setSearchTerm('')}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          <FaTimes className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                        </button>
                      )}
                    </div>

                    {/* Category Filter Dropdown */}
                    <div className="relative">
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-full pl-10 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#3B5787]/20 focus:border-[#3B5787] transition-colors appearance-none cursor-pointer"
                      >
                        <option value="all">All Categories</option>
                        {getAvailableCategories().map((category) => (
                          <option key={category} value={category}>
                            {getCategoryName(category)}
                          </option>
                        ))}
                      </select>

                      {/* Custom dropdown icon */}
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <FaFilter className="h-4 w-4 text-gray-400" />
                      </div>

                      {/* Dropdown arrow */}
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Results Count */}
                    <div className="mt-3 text-xs text-gray-500">
                      {getFilteredItems().length} items found
                      {searchTerm && ` for "${searchTerm}"`}
                      {selectedCategory !== 'all' && ` in ${getCategoryName(selectedCategory)}`}
                    </div>
                  </div>
                )}

                {/* Filtered Categories Layout */}
                {getAvailableLaundryItems().length > 0 && (
                  <>
                    {/* Show filtered results */}
                    {(() => {
                      const filteredItems = getFilteredItems();
                      const categories = filteredItems
                        .map(item => item.category)
                        .filter((value, index, self) => self.indexOf(value) === index);

                      if (filteredItems.length === 0) {
                        return (
                          <div className="text-center py-8">
                            <FaSearch className="mx-auto h-8 w-8 text-gray-400 mb-3" />
                            <h3 className="text-sm font-medium text-gray-900 mb-1">No items found</h3>
                            <p className="text-xs text-gray-500">
                              Try adjusting your search or filter options
                            </p>
                            {(searchTerm || selectedCategory !== 'all') && (
                              <button
                                onClick={() => {
                                  setSearchTerm('');
                                  setSelectedCategory('all');
                                }}
                                className="mt-3 text-xs text-[#3B5787] hover:text-[#2d4265] font-medium"
                              >
                                Clear all filters
                              </button>
                            )}
                          </div>
                        );
                      }

                      return categories.map(category => {
                        const categoryItems = filteredItems.filter(item => item.category === category);
                        if (categoryItems.length === 0) return null;
                        return (
                          <div key={category} className="mb-4 sm:mb-6">
                            {/* Compact Category Header */}
                            <div className="flex items-center mb-3 sm:mb-4">
                              <div className="flex-1 h-px bg-gradient-to-r from-[#3B5787]/20 to-transparent"></div>
                              <h3 className="px-3 text-sm sm:text-base font-semibold text-[#3B5787] bg-white/50 rounded-full">
                                {getCategoryName(category)}
                              </h3>
                              <div className="flex-1 h-px bg-gradient-to-l from-[#3B5787]/20 to-transparent"></div>
                            </div>

                            {/* Mobile-Optimized Grid - 2 columns on mobile, 3 on tablet, 4 on desktop */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                              {categoryItems.map(item => {
                                const selectedItem = selectedItems.find(selected => selected.id === item.id);
                                const quantity = selectedItem ? selectedItem.quantity : 0;
                                const isAvailable = item.isAvailable !== false;
                                const availableServiceTypes = getAvailableServiceTypes(item.id);
                                const hasAvailableServices = availableServiceTypes.length > 0;
                                return (
                                  <div
                                    key={item.id}
                                    className={`relative border-2 rounded-xl transition-all duration-300 p-2 sm:p-3 ${
                                      quantity > 0
                                        ? 'border-[#3B5787] bg-gradient-to-br from-[#3B5787]/5 to-[#4a6694]/10 shadow-md'
                                        : isAvailable && hasAvailableServices
                                        ? 'border-gray-200 hover:border-[#3B5787]/50 hover:shadow-sm'
                                        : 'border-gray-200 bg-gray-50/50 opacity-60'
                                    } min-h-[100px] sm:min-h-[120px]`}
                                  >
                                    {/* Quantity Badge */}
                                    {quantity > 0 && (
                                      <div className="absolute -top-1 -right-1 w-5 h-5 sm:w-6 sm:h-6 bg-[#3B5787] text-white text-xs font-bold rounded-full flex items-center justify-center shadow-lg">
                                        {quantity}
                                      </div>
                                    )}

                                    {/* Item Content - Compact */}
                                    <div className="flex flex-col h-full">
                                      {/* Item Header */}
                                      <div className="flex-1 mb-2">
                                        <h4 className={`font-medium text-xs sm:text-sm leading-tight mb-1 ${
                                          isAvailable && hasAvailableServices ? 'text-gray-900' : 'text-gray-500'
                                        }`}>
                                          {getItemName(item.name)}
                                        </h4>

                                        {/* Status Badges - Compact */}
                                        <div className="flex flex-wrap gap-1 mb-1">
                                          {!isAvailable && (
                                            <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-md">
                                              N/A
                                            </span>
                                          )}
                                          {isAvailable && !hasAvailableServices && (
                                            <span className="text-xs bg-yellow-100 text-yellow-600 px-1.5 py-0.5 rounded-md">
                                              No Service
                                            </span>
                                          )}
                                        </div>

                                        {/* Price - Compact */}
                                        <p className={`text-xs font-medium ${
                                          isAvailable && hasAvailableServices ? 'text-[#3B5787]' : 'text-gray-400'
                                        }`}>
                                          {availableServiceTypes.length > 0
                                            ? `${formatPriceByLanguage(Math.min(...availableServiceTypes.map(st => st.price)), i18n.language)}`
                                            : item.basePrice ? formatPriceByLanguage(item.basePrice, i18n.language) : 'Price N/A'
                                          }
                                        </p>
                                      </div>

                                      {/* Compact Controls */}
                                      <div className="flex items-center justify-center gap-1 sm:gap-2 mt-auto">
                                        <button
                                          onClick={() => handleItemRemove(item.id)}
                                          disabled={quantity === 0 || !isAvailable || !hasAvailableServices}
                                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#3B5787] text-white flex items-center justify-center hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                                        >
                                          <FaMinus className="text-xs" />
                                        </button>
                                        <span className="w-6 sm:w-8 text-center font-bold text-sm sm:text-base text-[#3B5787]">
                                          {quantity}
                                        </span>
                                        <button
                                          onClick={() => handleItemAdd(item)}
                                          disabled={!isAvailable || !hasAvailableServices}
                                          className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-[#3B5787] text-white flex items-center justify-center hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
                                        >
                                          <FaPlus className="text-xs" />
                                        </button>
                                      </div>
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
            )}            {step === 2 && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-3 sm:p-6">
                {/* Compact Header */}
                <div className="mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-2xl font-bold text-gray-900 mb-1">
                    {t('laundryBooking.chooseServiceTypes')}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-600">{t('laundryBooking.selectServiceTypeInstruction')}</p>
                </div>

                {/* Quick Service Type Actions */}
                <div className="mb-4 sm:mb-6">
                  <div className="flex flex-wrap gap-2">
                    {(() => {
                      // Collect all available service type names for selected items
                      const typeNames = Array.from(new Set(
                        selectedItems.flatMap(item =>
                          getAvailableServiceTypes(item.id).map(st => st.name)
                        )
                      ));
                      // Determine which type is currently selected for all items
                      const getIsActive = (typeName) => {
                        // Active if all selected items have this type selected
                        return selectedItems.length > 0 && selectedItems.every(item => {
                          const serviceTypesForItem = getAvailableServiceTypes(item.id);
                          const foundType = serviceTypesForItem.find(st => st.name === typeName);
                          return foundType && serviceTypes[item.id] === foundType.id;
                        });
                      };
                      return typeNames.map(typeName => {
                        const isActive = getIsActive(typeName);
                        return (
                          <button
                            key={typeName}
                            className={`px-3 py-1.5 text-xs font-medium rounded-xl transition-all duration-200 ${
                              isActive
                                ? 'bg-[#3B5787] text-white shadow-sm'
                                : 'bg-gray-100 text-gray-600 hover:bg-[#3B5787]/10 hover:text-[#3B5787]'
                            }`}
                            onClick={() => {
                              // For each selected item, if it has this service type, select it
                              selectedItems.forEach(item => {
                                const serviceTypesForItem = getAvailableServiceTypes(item.id);
                                const foundType = serviceTypesForItem.find(st => st.name === typeName);
                                if (foundType) {
                                  handleServiceTypeChange(item.id, foundType.id);
                                }
                              });
                            }}
                          >
                            {t('laundryBooking.applyToAll', { typeName })}
                          </button>
                        );
                      });
                    })()}
                  </div>
                </div>

                {/* Compact Items Grid - 2 columns on mobile */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
                  {selectedItems.map(item => (
                    <div key={item.id} className="border-2 border-gray-200 rounded-xl p-3 sm:p-4 bg-gradient-to-br from-gray-50/50 to-white">
                      {/* Compact Item Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm sm:text-base leading-tight">
                            {getItemName(item.name)}
                          </h4>
                          <div className="flex items-center mt-1">
                            <span className="text-xs text-gray-500">Qty:</span>
                            <span className="ml-1 px-2 py-0.5 bg-[#3B5787]/10 text-[#3B5787] text-xs font-medium rounded-full">
                              {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Service Options - 2 columns on mobile */}
                      <div className="grid grid-cols-2 sm:grid-cols-1 lg:grid-cols-2 gap-2 sm:gap-3">
                        {getAvailableServiceTypes(item.id).map(serviceType => (
                          <div
                            key={serviceType.id}
                            className={`relative p-2 sm:p-3 border-2 rounded-xl cursor-pointer transition-all duration-300 min-h-[80px] sm:min-h-[100px] ${
                              serviceTypes[item.id] === serviceType.id
                                ? 'border-[#3B5787] bg-gradient-to-br from-[#3B5787]/5 to-[#4a6694]/10 shadow-md'
                                : 'border-gray-200 hover:border-[#3B5787]/50 hover:shadow-sm'
                            }`}
                            onClick={() => handleServiceTypeChange(item.id, serviceType.id)}
                          >
                            {/* Selection Indicator */}
                            {serviceTypes[item.id] === serviceType.id && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-[#3B5787] rounded-full flex items-center justify-center shadow-lg">
                                <FaCheck className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}

                            <div className="flex flex-col h-full">
                              {/* Service Info */}
                              <div className="flex-1">
                                <h5 className="font-medium text-gray-900 text-xs sm:text-sm leading-tight mb-1">
                                  {serviceType.name}
                                </h5>
                                <p className="text-xs text-gray-600 leading-tight mb-1 line-clamp-2">
                                  {serviceType.description}
                                </p>
                                <div className="flex items-center text-xs text-gray-500">
                                  <FaClock className="mr-1 flex-shrink-0" />
                                  <span className="truncate">{serviceType.duration}</span>
                                </div>
                              </div>

                              {/* Price */}
                              <div className="mt-2 pt-2 border-t border-gray-200">
                                <p className="font-bold text-[#3B5787] text-xs sm:text-sm text-center">
                                  {formatPriceByLanguage(serviceType.price * item.quantity, i18n.language)}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>                {/* Express Service Option */}
                <div className="mt-6 p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <FaBolt className="text-yellow-500 mr-3" />
                      <div>
                        <h4 className="font-medium text-gray-900">{t('laundryBooking.expressService')}</h4>
                        <p className="text-sm text-gray-600">{t('laundryBooking.expressDescription')}</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={expressService}
                        onChange={(e) => setExpressService(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-sm">{t('laundryBooking.enable')}</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('laundryBooking.scheduleService')}
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline mr-2" />
                        {t('laundryBooking.preferredDate')}
                      </label>
                      <input
                        type="date"
                        value={bookingDetails.preferredDate}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline mr-2" />
                        {t('laundryBooking.preferredTime')}
                      </label>
                      <select
                        value={bookingDetails.preferredTime}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">{t('laundryBooking.timeSlots.selectTime')}</option>
                        <option value="08:00">08:00 - {t('laundryBooking.timeSlots.morning')}</option>
                        <option value="09:00">09:00 - {t('laundryBooking.timeSlots.morning')}</option>
                        <option value="10:00">10:00 - {t('laundryBooking.timeSlots.morning')}</option>
                        <option value="11:00">11:00 - {t('laundryBooking.timeSlots.morning')}</option>
                        <option value="12:00">12:00 - {t('laundryBooking.timeSlots.noon')}</option>
                        <option value="13:00">13:00 - {t('laundryBooking.timeSlots.afternoon')}</option>
                        <option value="14:00">14:00 - {t('laundryBooking.timeSlots.afternoon')}</option>
                        <option value="15:00">15:00 - {t('laundryBooking.timeSlots.afternoon')}</option>
                        <option value="16:00">16:00 - {t('laundryBooking.timeSlots.afternoon')}</option>
                        <option value="17:00">17:00 - {t('laundryBooking.timeSlots.evening')}</option>
                        <option value="18:00">18:00 - {t('laundryBooking.timeSlots.evening')}</option>
                        <option value="19:00">19:00 - {t('laundryBooking.timeSlots.evening')}</option>
                        <option value="20:00">20:00 - {t('laundryBooking.timeSlots.evening')}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaMapMarkerAlt className="inline mr-2" />
                      Room Number
                    </label>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50">
                      <span className="text-gray-700 font-medium">
                        Room {currentUser?.roomNumber || 'number not set'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Pickup and delivery will be from/to your registered room
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaStickyNote className="inline mr-2" />
                      {t('laundryBooking.specialRequests')}
                    </label>
                    <textarea
                      value={bookingDetails.specialRequests}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder={t('laundryBooking.specialRequestsPlaceholder')}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="bg-white rounded-lg shadow-md p-6">                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  {t('laundryBooking.confirmBooking')}
                </h2>

                <div className="space-y-6">
                  {/* Order Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('laundryBooking.orderSummary')}</h3>
                    <div className="space-y-3">
                      {pricing.itemCalculations.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">                          <div className="flex items-center">
                            <div>
                              <span className="font-medium">{getItemName(item.name)}</span>
                              <span className="text-gray-500 ml-2">×{item.quantity}</span>
                              <div className="text-sm text-gray-600">
                                {item.serviceType?.name}
                              </div>
                            </div>
                          </div>
                          <span className="font-medium">{formatPriceByLanguage(item.itemPrice, i18n.language)}</span>
                        </div>
                      ))}
                    </div>
                  </div>                  {/* Schedule Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">{t('laundryBooking.scheduleLocation')}</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>{t('laundryBooking.date')}:</strong> {bookingDetails.preferredDate}</p>
                      <p><strong>{t('laundryBooking.time')}:</strong> {bookingDetails.preferredTime}</p>
                      <p><strong>Room Number:</strong> Room {currentUser?.roomNumber || 'Not set'}</p>
                      {bookingDetails.specialRequests && (
                        <p><strong>{t('laundryBooking.specialRequests')}:</strong> {bookingDetails.specialRequests}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pricing Summary Sidebar - Hidden on Mobile */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-6">              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                <FaCalculator className="inline mr-2" />
                {t('laundryBooking.pricingSummary')}
              </h3>

              <div className="space-y-3">                <div className="flex justify-between">
                  <span>{t('laundryBooking.items')} ({selectedItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>{formatPriceByLanguage(pricing.subtotal, i18n.language)}</span>
                </div>

                {expressService && (
                  <div className="flex justify-between text-yellow-600">
                    <span className="flex items-center">
                      <FaBolt className="mr-1" />
                      {t('laundryBooking.expressService')}
                    </span>
                    <span>+{formatPriceByLanguage(pricing.expressCharge, i18n.language)}</span>
                  </div>                )}

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>{t('laundryBooking.total')}</span>
                  <span className="text-green-600">{formatTotalWithSar(pricing.total, i18n.language)}</span>
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-6 space-y-3">
                  {step < 4 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceedToNext()}
                      className="w-full bg-[#3B5787] hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >                      {step === 1 && t('laundryBooking.nextStep')}
                      {step === 2 && t('laundryBooking.scheduleStep')}
                      {step === 3 && t('laundryBooking.reviewStep')}
                    </button>
                  ) : (
                    <button
                      onClick={handleBookingSubmit}
                      disabled={submitting}
                      className="w-full bg-[#3B5787] hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          {t('laundryBooking.booking')}
                        </>
                      ) : (
                        t('laundryBooking.confirmStep')
                      )}
                    </button>
                  )}

                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full bg-[#3B5787] hover:bg-[#2d4265] text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      {t('laundryBooking.back')}
                    </button>
                  )}
                </div>
              )}

              {selectedItems.length === 0 && step === 1 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600 text-sm">
                    {t('laundryBooking.selectItemsFirst')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Mobile Cart */}
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
                        <span className="text-gray-900">{getItemName(item.name)}</span>
                        <span className="text-gray-500 ml-1">×{item.quantity}</span>
                      </div>
                      <span className="text-gray-900 font-medium">
                        {formatPriceByLanguage(
                          pricing.itemCalculations.find(calc => calc.id === item.id)?.itemPrice || 0,
                          i18n.language
                        )}
                      </span>
                    </div>
                  ))}

                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPriceByLanguage(pricing.subtotal, i18n.language)}</span>
                    </div>
                    {expressService && (
                      <div className="flex justify-between text-sm text-yellow-600">
                        <span>Express Service</span>
                        <span>+{formatPriceByLanguage(pricing.expressCharge, i18n.language)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-green-600 mt-1">
                      <span>Total</span>
                      <span>{formatTotalWithSar(pricing.total, i18n.language)}</span>
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
                  {selectedItems.reduce((sum, item) => sum + item.quantity, 0)} {t('laundryBooking.items')}
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
                  {formatTotalWithSar(pricing.total, i18n.language)}
                </div>
                {expressService && (
                  <div className="text-xs text-yellow-600">
                    +{formatPriceByLanguage(pricing.expressCharge, i18n.language)} express
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              {step < 4 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  disabled={!canProceedToNext()}
                  className="flex-1 bg-[#3B5787] hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors text-sm"
                >
                  {step === 1 && t('laundryBooking.nextStep')}
                  {step === 2 && t('laundryBooking.scheduleStep')}
                  {step === 3 && t('laundryBooking.reviewStep')}
                </button>
              ) : (
                <button
                  onClick={handleBookingSubmit}
                  disabled={submitting}
                  className="flex-1 bg-[#3B5787] hover:bg-[#2d4265] disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center text-sm"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      {t('laundryBooking.booking')}
                    </>
                  ) : (
                    t('laundryBooking.confirmStep')
                  )}
                </button>
              )}

              {step > 1 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="px-4 py-3 bg-[#3B5787] hover:bg-[#2d4265] text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {t('laundryBooking.back')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default LaundryBookingPage;
