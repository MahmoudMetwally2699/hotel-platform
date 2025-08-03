/**
 * Enhanced Laundry Service Booking Page
 * Interactive m      // No items available - service provider hasn't added any items yet
      return [];election with real-time pricing and service type selection
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
  FaStickyNote
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const LaundryBookingPage = () => {
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
  const [step, setStep] = useState(1); // 1: Items, 2: Service Types, 3: Details, 4: Confirmation
  const [selectedItems, setSelectedItems] = useState([]);
  const [serviceTypes, setServiceTypes] = useState({});
  const [expressService, setExpressService] = useState(false);
  const [bookingDetails, setBookingDetails] = useState({
    preferredDate: '',
    preferredTime: '',
    pickupLocation: '',
    deliveryLocation: '',
    specialRequests: ''
  });
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

    if (currentItem && currentItem.serviceTypes) {
      return currentItem.serviceTypes
        .filter(st => st.isAvailable && st.price > 0)
        .map(st => ({
          id: st.serviceTypeId,
          name: getServiceTypeName(st.serviceTypeId),
          price: st.price,
          description: getServiceTypeDescription(st.serviceTypeId),
          duration: getServiceTypeDuration(st.serviceTypeId),
          icon: getServiceTypeIcon(st.serviceTypeId)
        }));
    }

    return [];
  };

  // Helper functions to get service type details
  const getServiceTypeName = (serviceTypeId) => {
    const serviceTypes = {
      'wash_only': 'Wash Only',
      'iron_only': 'Iron Only',
      'wash_iron': 'Wash + Iron',
      'dry_cleaning': 'Dry Cleaning'
    };
    return serviceTypes[serviceTypeId] || serviceTypeId;
  };

  const getServiceTypeDescription = (serviceTypeId) => {
    const descriptions = {
      'wash_only': 'Machine wash with appropriate detergent',
      'iron_only': 'Professional ironing and pressing',
      'wash_iron': 'Complete wash and iron service',
      'dry_cleaning': 'Professional dry cleaning service'
    };
    return descriptions[serviceTypeId] || 'Professional laundry service';
  };

  const getServiceTypeDuration = (serviceTypeId) => {
    const durations = {
      'wash_only': '24 hours',
      'iron_only': '12 hours',
      'wash_iron': '24 hours',
      'dry_cleaning': '48 hours'
    };
    return durations[serviceTypeId] || '24 hours';
  };

  const getServiceTypeIcon = (serviceTypeId) => {
    const icons = {
      'wash_only': '🧼',
      'iron_only': '👕',
      'wash_iron': '⭐',
      'dry_cleaning': '✨'
    };
    return icons[serviceTypeId] || '🧼';
  };useEffect(() => {
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
          const laundryServices = responseData?.services || [];

          console.log('🔍 Laundry services response:', {
            success: servicesResponse.data.success,
            totalServices: laundryServices.length,
            services: laundryServices.map(s => ({ id: s._id, name: s.name, category: s.category }))
          });          if (laundryServices && laundryServices.length > 0) {
            // Store all available services
            setServices(laundryServices);
            // Keep the first service as primary for backwards compatibility
            setService(laundryServices[0]);
          } else {
            toast.error('No laundry service available for this hotel');
            navigate(`/hotels/${hotelId}/categories`);
            return;
          }
        }

      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error('Failed to load laundry service');
        navigate(`/hotels/${hotelId}/categories`);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [hotelId, passedService, passedHotel, navigate]);
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
    });

    const expressCharge = expressService ? subtotal * 0.5 : 0; // 50% surcharge for express
    const subtotalWithExpress = subtotal + expressCharge;

    // Apply hotel markup (assume 15% for demo)
    const markup = 0.15;
    const markupAmount = subtotalWithExpress * markup;
    const total = subtotalWithExpress + markupAmount;

    return {
      itemCalculations,
      subtotal,
      expressCharge,
      markupAmount,
      total
    };
  };

  const pricing = calculatePricing();

  // Handle booking submission
  const handleBookingSubmit = async () => {
    try {
      setSubmitting(true);      const bookingData = {
        serviceId: pricing.itemCalculations[0]?.serviceId || service?._id, // Use the service ID of the first item
        hotelId,
        laundryItems: pricing.itemCalculations.map(item => ({
          itemId: item.id,
          itemName: item.name,
          itemCategory: item.category,
          itemIcon: item.icon,
          quantity: item.quantity,
          serviceTypeId: item.serviceType.id,
          serviceTypeName: item.serviceType.name,
          serviceTypeDescription: item.serviceType.description,
          serviceTypeDuration: item.serviceType.duration,
          serviceTypeIcon: item.serviceType.icon,
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
          pickupLocation: bookingDetails.pickupLocation,
          deliveryLocation: bookingDetails.deliveryLocation,
          pickupInstructions: bookingDetails.specialRequests        },
        guestDetails: {
          specialRequests: bookingDetails.specialRequests
        },
        paymentMethod: 'credit-card' // Default payment method
      };

      await apiClient.post('/client/bookings/laundry', bookingData);

      toast.success('Laundry booking created successfully!');
      navigate(`/my-orders`);

    } catch (error) {
      console.error('Error creating booking:', error);
      toast.error(error.response?.data?.message || 'Failed to create booking');
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
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading laundry service...</p>
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
                className="mr-4 p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft className="text-xl" />
              </button>
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 text-blue-600 rounded-lg mr-4">
                  <FaTshirt className="text-2xl" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">
                    Laundry Service Booking
                  </h1>
                  <p className="text-gray-600 mt-1">
                    {service?.name} at {hotel?.name}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-center">
          {[1, 2, 3, 4].map((stepNum) => (
            <React.Fragment key={stepNum}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= stepNum ? 'bg-blue-500 text-white' : 'bg-gray-300 text-gray-600'
              }`}>
                {step > stepNum ? <FaCheck /> : stepNum}
              </div>
              {stepNum < 4 && (
                <div className={`w-16 h-0.5 ${
                  step > stepNum ? 'bg-blue-500' : 'bg-gray-300'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
        <div className="flex justify-center mt-2">
          <div className="flex space-x-16 text-sm text-gray-600">
            <span className={step >= 1 ? 'text-blue-600 font-medium' : ''}>Select Items</span>
            <span className={step >= 2 ? 'text-blue-600 font-medium' : ''}>Service Types</span>
            <span className={step >= 3 ? 'text-blue-600 font-medium' : ''}>Schedule</span>
            <span className={step >= 4 ? 'text-blue-600 font-medium' : ''}>Confirm</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">            {step === 1 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Select Laundry Items
                </h2>

                {/* Check if any items are available */}
                {(() => {
                  const availableItems = getAvailableLaundryItems();
                  if (availableItems.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <FaTshirt className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          No Laundry Items Available
                        </h3>
                        <p className="text-gray-600 mb-4">
                          The service provider hasn't added any laundry items yet.
                        </p>
                        <button
                          onClick={() => navigate(`/hotels/${hotelId}/categories`)}
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                        >
                          <FaArrowLeft className="mr-2" />
                          Back to Services
                        </button>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* Only show categories if items are available */}
                {getAvailableLaundryItems().length > 0 && (
                  <>
                    {/* Categories */}
                    {['clothing', 'outerwear', 'undergarments', 'linens', 'home'].map(category => {
                      const availableItems = getAvailableLaundryItems();
                      const categoryItems = availableItems.filter(item => item.category === category);
                      if (categoryItems.length === 0) return null;

                  return (
                    <div key={category} className="mb-8">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4 capitalize">
                        {category}
                      </h3>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryItems.map(item => {
                          const selectedItem = selectedItems.find(selected => selected.id === item.id);                          const quantity = selectedItem ? selectedItem.quantity : 0;
                          const isAvailable = item.isAvailable !== false; // Default to available if not specified
                          const availableServiceTypes = getAvailableServiceTypes(item.id);
                          const hasAvailableServices = availableServiceTypes.length > 0;

                          return (
                            <div
                              key={item.id}
                              className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                                isAvailable && hasAvailableServices
                                  ? 'border-gray-200 hover:border-blue-300'
                                  : 'border-gray-200 bg-gray-50 opacity-60'
                              }`}
                            >
                              <div className="flex items-center">
                                <span className="text-2xl mr-3">{item.icon}</span>
                                <div>
                                  <h4 className={`font-medium ${isAvailable && hasAvailableServices ? 'text-gray-900' : 'text-gray-500'}`}>
                                    {item.name}
                                    {!isAvailable && (
                                      <span className="ml-2 text-xs bg-red-100 text-red-600 px-2 py-1 rounded">
                                        Unavailable
                                      </span>
                                    )}
                                    {isAvailable && !hasAvailableServices && (
                                      <span className="ml-2 text-xs bg-yellow-100 text-yellow-600 px-2 py-1 rounded">
                                        No Service Types
                                      </span>
                                    )}
                                  </h4>
                                  <p className={`text-sm ${isAvailable && hasAvailableServices ? 'text-gray-600' : 'text-gray-400'}`}>
                                    {availableServiceTypes.length > 0
                                      ? `From $${Math.min(...availableServiceTypes.map(st => st.price)).toFixed(2)}`
                                      : item.basePrice ? `$${item.basePrice.toFixed(2)}` : 'Price not set'
                                    }
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <button
                                  onClick={() => handleItemRemove(item.id)}
                                  disabled={quantity === 0 || !isAvailable || !hasAvailableServices}
                                  className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <FaMinus className="text-xs" />
                                </button>
                                <span className="w-8 text-center font-medium">{quantity}</span>
                                <button
                                  onClick={() => handleItemAdd(item)}
                                  disabled={!isAvailable || !hasAvailableServices}
                                  className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                                >
                                  <FaPlus className="text-xs" />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>                    </div>
                  );
                })}
                  </>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Choose Service Types
                </h2>

                <div className="space-y-6">
                  {selectedItems.map(item => (
                    <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <span className="text-xl mr-3">{item.icon}</span>
                        <div>
                          <h4 className="font-medium text-gray-900">{item.name}</h4>
                          <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                        </div>
                      </div>                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {getAvailableServiceTypes(item.id).map(serviceType => (
                          <div
                            key={serviceType.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              serviceTypes[item.id] === serviceType.id
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => handleServiceTypeChange(item.id, serviceType.id)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center">                                <span className="text-lg mr-2">{serviceType.icon}</span>
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
                                  ${(serviceType.price * item.quantity).toFixed(2)}
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
                        <h4 className="font-medium text-gray-900">Express Service</h4>
                        <p className="text-sm text-gray-600">Rush 4-hour delivery (+50% surcharge)</p>
                      </div>
                    </div>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={expressService}
                        onChange={(e) => setExpressService(e.target.checked)}
                        className="form-checkbox h-5 w-5 text-blue-600"
                      />
                      <span className="ml-2 text-sm">Enable</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                  Schedule & Details
                </h2>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaCalendarAlt className="inline mr-2" />
                        Preferred Date
                      </label>
                      <input
                        type="date"
                        value={bookingDetails.preferredDate}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredDate: e.target.value }))}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaClock className="inline mr-2" />
                        Preferred Time
                      </label>                      <select
                        value={bookingDetails.preferredTime}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select time</option>
                        <option value="08:00">08:00 - Morning</option>
                        <option value="09:00">09:00 - Morning</option>
                        <option value="10:00">10:00 - Morning</option>
                        <option value="11:00">11:00 - Morning</option>
                        <option value="12:00">12:00 - Noon</option>
                        <option value="13:00">13:00 - Afternoon</option>
                        <option value="14:00">14:00 - Afternoon</option>
                        <option value="15:00">15:00 - Afternoon</option>
                        <option value="16:00">16:00 - Afternoon</option>
                        <option value="17:00">17:00 - Evening</option>
                        <option value="18:00">18:00 - Evening</option>
                        <option value="19:00">19:00 - Evening</option>
                        <option value="20:00">20:00 - Evening</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />
                        Pickup Location
                      </label>
                      <input
                        type="text"
                        value={bookingDetails.pickupLocation}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, pickupLocation: e.target.value }))}
                        placeholder="Room number or location"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <FaMapMarkerAlt className="inline mr-2" />
                        Delivery Location
                      </label>
                      <input
                        type="text"
                        value={bookingDetails.deliveryLocation}
                        onChange={(e) => setBookingDetails(prev => ({ ...prev, deliveryLocation: e.target.value }))}
                        placeholder="Same as pickup or different"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <FaStickyNote className="inline mr-2" />
                      Special Requests
                    </label>
                    <textarea
                      value={bookingDetails.specialRequests}
                      onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any special instructions or requirements..."
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
                  Confirm Your Booking
                </h2>

                <div className="space-y-6">
                  {/* Order Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                    <div className="space-y-3">
                      {pricing.itemCalculations.map(item => (
                        <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100">
                          <div className="flex items-center">
                            <span className="text-lg mr-3">{item.icon}</span>
                            <div>
                              <span className="font-medium">{item.name}</span>
                              <span className="text-gray-500 ml-2">×{item.quantity}</span>
                              <div className="text-sm text-gray-600">
                                {item.serviceType?.name}
                              </div>
                            </div>
                          </div>
                          <span className="font-medium">${item.itemPrice.toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Schedule Summary */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">Schedule & Location</h3>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p><strong>Date:</strong> {bookingDetails.preferredDate}</p>
                      <p><strong>Time:</strong> {bookingDetails.preferredTime}</p>
                      <p><strong>Pickup:</strong> {bookingDetails.pickupLocation || 'Not specified'}</p>
                      <p><strong>Delivery:</strong> {bookingDetails.deliveryLocation || 'Same as pickup'}</p>
                      {bookingDetails.specialRequests && (
                        <p><strong>Special Requests:</strong> {bookingDetails.specialRequests}</p>
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
                Pricing Summary
              </h3>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Items ({selectedItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>${pricing.subtotal.toFixed(2)}</span>
                </div>

                {expressService && (
                  <div className="flex justify-between text-yellow-600">
                    <span className="flex items-center">
                      <FaBolt className="mr-1" />
                      Express Service
                    </span>
                    <span>+${pricing.expressCharge.toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-gray-600">
                  <span>Hotel Service Fee</span>
                  <span>+${pricing.markupAmount.toFixed(2)}</span>
                </div>

                <hr />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="text-green-600">${pricing.total.toFixed(2)}</span>
                </div>
              </div>

              {selectedItems.length > 0 && (
                <div className="mt-6 space-y-3">
                  {step < 4 ? (
                    <button
                      onClick={() => setStep(step + 1)}
                      disabled={!canProceedToNext()}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      {step === 1 && 'Choose Service Types'}
                      {step === 2 && 'Schedule Service'}
                      {step === 3 && 'Review & Confirm'}
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
                          Booking...
                        </>
                      ) : (
                        'Confirm Booking'
                      )}
                    </button>
                  )}

                  {step > 1 && (
                    <button
                      onClick={() => setStep(step - 1)}
                      className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium py-3 px-4 rounded-lg transition-colors"
                    >
                      Back
                    </button>
                  )}
                </div>
              )}

              {selectedItems.length === 0 && step === 1 && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg text-center">
                  <p className="text-gray-600 text-sm">
                    Select items to see pricing details
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

export default LaundryBookingPage;
