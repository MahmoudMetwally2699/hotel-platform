/**
 * Restaurant Service Creator Component — Modern Restyle
 * Allows service providers to create and manage restaurant services with menu items
 * - Brand: #3B5787 / #67BAE0
 * - Mobile-first, glass gradient header, modern cards
 * - Enhanced animations and modern UI components
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaUtensils,
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaCamera,
  FaListUl,
  FaCog,
  FaArrowLeft,
  FaClock
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

// ---------------- UI Design Tokens ----------------
const BTN = {
  primary:
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white " +
    "bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4A6B] hover:to-[#5BA8CC] " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-300 " +
    "shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
  secondary:
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-[#3B5787] " +
    "bg-white border-2 border-[#3B5787] hover:bg-[#3B5787] hover:text-white focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-300 shadow-md hover:shadow-lg",
  danger:
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white " +
    "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 " +
    "shadow-lg hover:shadow-xl transform hover:-translate-y-0.5",
  ghost:
    "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 " +
    "bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 " +
    "transition-all duration-300",
  tab:
    "inline-flex items-center justify-center px-6 py-3 rounded-t-xl text-sm font-semibold transition-all duration-300",
  tabActive:
    "text-white bg-gradient-to-r from-[#3B5787] to-[#67BAE0] shadow-lg",
  tabInactive:
    "text-gray-600 bg-gray-100 hover:bg-gray-200 hover:text-gray-800"
};

const CARD = "bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300";
const INPUT = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#3B5787]/20 focus:border-[#3B5787] transition-colors";

// Add custom styles for animations and scrollbar
const modalStyles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideUp {
    animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }

  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(180deg, #3B5787 0%, #67BAE0 100%);
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(180deg, #2A4A6B 0%, #5BA8CC 100%);
  }
`;

// Helper to convert hex to rgba
const hexToRgba = (hex, alpha = 1) => {
  let r = 0, g = 0, b = 0;
  if (hex) {
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else if (hex.length === 7) {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const RestaurantServiceCreator = ({ onBack }) => {
  const { t } = useTranslation();

  // Inject custom styles for modal animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = modalStyles;
    document.head.appendChild(styleElement);

    // Fetch provider info on mount
    fetchProviderInfo();

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Active tab management
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(false);

  // Search state for filtering menu items
  const [searchQuery, setSearchQuery] = useState('');

  // Service creation state
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    cuisineType: '',
    mealTypes: []
  });

  // Restaurant image state
  const [restaurantImage, setRestaurantImage] = useState(null);
  const [restaurantImagePreview, setRestaurantImagePreview] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Menu items state
  const [menuItems, setMenuItems] = useState([]);

  // Menu item editing state
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Management state
  const [existingServices, setExistingServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [currencySymbol, setCurrencySymbol] = useState('$'); // Default symbol

  // Hotel branding colors state
  const [hotelBranding, setHotelBranding] = useState({
    primaryColor: '#3B5787',
    secondaryColor: '#67BAE0'
  });

  // Service menu item editing state
  const [editingServiceMenuItem, setEditingServiceMenuItem] = useState(null);

  // Restaurant settings state (for Settings tab)
  const [restaurantName, setRestaurantName] = useState('');
  const [restaurantDescription, setRestaurantDescription] = useState('');
  const [infoChanged, setInfoChanged] = useState(false);
  const WORD_LIMIT = 100;

  // Working hours state
  const [workingHours, setWorkingHours] = useState({
    saturday: { isAvailable: true, startTime: '09:00', endTime: '23:00' },
    sunday: { isAvailable: true, startTime: '09:00', endTime: '23:00' },
    monday: { isAvailable: true, startTime: '09:00', endTime: '23:00' },
    tuesday: { isAvailable: true, startTime: '09:00', endTime: '23:00' },
    wednesday: { isAvailable: true, startTime: '09:00', endTime: '23:00' },
    thursday: { isAvailable: true, startTime: '09:00', endTime: '23:00' },
    friday: { isAvailable: false, startTime: '09:00', endTime: '23:00' }
  });
  const [workingHoursChanged, setWorkingHoursChanged] = useState(false);

  // Delivery toggle state
  const [offersDelivery, setOffersDelivery] = useState(true);
  const [deliveryChanged, setDeliveryChanged] = useState(false);

  // Provider info state
  const [providerInfo, setProviderInfo] = useState(null);

  /**
   * Handle restaurant image upload to Cloudinary
   */
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('serviceProvider.restaurant.messages.invalidImageType') || 'Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('serviceProvider.restaurant.messages.imageTooLarge') || 'Image must be less than 5MB');
      return;
    }

    try {
      setUploadingImage(true);

      // Create local preview immediately
      const reader = new FileReader();
      reader.onloadend = () => {
        setRestaurantImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      // Check if Cloudinary is properly configured
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      console.log('Cloudinary Config:', { cloudName, uploadPreset });

      if (!cloudName || !uploadPreset) {
        console.warn('Cloudinary not configured. cloudName:', cloudName, 'preset:', uploadPreset);
        toast.error('Cloudinary not configured. Please check your .env file and restart the server.');
        // Use blob URL as fallback
        const localUrl = URL.createObjectURL(file);
        setRestaurantImage(localUrl);
        setUploadingImage(false);
        return;
      }

      // Prepare form data for Cloudinary upload
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'hotel-platform/restaurants');

      console.log('Uploading to Cloudinary...');

      // Upload to Cloudinary
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Cloudinary upload error:', errorData);
        toast.error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);

        // Fallback to local blob URL
        const localUrl = URL.createObjectURL(file);
        setRestaurantImage(localUrl);
        setUploadingImage(false);
        return;
      }

      const data = await response.json();
      console.log('Cloudinary upload success:', data.secure_url);
      setRestaurantImage(data.secure_url);
      toast.success(t('serviceProvider.restaurant.messages.imageUploaded') || 'Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error(`Upload error: ${error.message}`);
      // Fallback to local blob URL
      const localUrl = URL.createObjectURL(file);
      setRestaurantImage(localUrl);
    } finally {
      setUploadingImage(false);
    }
  };

  /**
   * Remove restaurant image
   */
  const removeRestaurantImage = () => {
    setRestaurantImage(null);
    setRestaurantImagePreview(null);
  };

  useEffect(() => {
    if (activeTab === 'manage' || activeTab === 'settings') {
      fetchExistingServices();
      fetchProviderInfo();
    }
  }, [activeTab]);

  const fetchProviderInfo = async () => {
    try {
      const response = await apiClient.get('/service/dashboard');
      if (response.data.status === 'success') {
        setProviderInfo(response.data.data.provider);
      }
    } catch (error) {
      console.error('Error fetching provider info:', error);
    }
  };

  // Initialize restaurant settings from provider info or existing services
  useEffect(() => {
    if (providerInfo?.restaurant) {
      const rest = providerInfo.restaurant;
      setRestaurantName(rest.name || providerInfo.businessName || '');
      setRestaurantDescription(rest.description || '');
      if (rest.image) setRestaurantImage(rest.image);
      setInfoChanged(false);

      if (rest.schedule) {
        const loadedHours = {};
        const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        days.forEach(day => {
          if (rest.schedule[day]) {
            loadedHours[day] = {
              isAvailable: rest.schedule[day].isAvailable ?? true,
              startTime: rest.schedule[day].timeSlots?.[0]?.startTime || '09:00',
              endTime: rest.schedule[day].timeSlots?.[0]?.endTime || '23:00'
            };
          } else {
            loadedHours[day] = { isAvailable: true, startTime: '09:00', endTime: '23:00' };
          }
        });
        setWorkingHours(loadedHours);
        setWorkingHoursChanged(false);
      }

      setOffersDelivery(rest.offersDelivery ?? true);
      setDeliveryChanged(false);
    } else if (existingServices.length > 0) {
      // Fallback to existing services if provider info not set
      const firstService = existingServices[0];
      setRestaurantName(firstService.providerId?.businessName || firstService.name || '');
      setRestaurantDescription(firstService.description || '');
      setInfoChanged(false);

      // Load working hours from service availability schedule
      const schedule = firstService.availability?.schedule;
      if (schedule) {
        const loadedHours = {};
        const days = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
        days.forEach(day => {
          if (schedule[day]) {
            loadedHours[day] = {
              isAvailable: schedule[day].isAvailable ?? true,
              startTime: schedule[day].timeSlots?.[0]?.startTime || '09:00',
              endTime: schedule[day].timeSlots?.[0]?.endTime || '23:00'
            };
          } else {
            loadedHours[day] = { isAvailable: true, startTime: '09:00', endTime: '23:00' };
          }
        });
        setWorkingHours(loadedHours);
        setWorkingHoursChanged(false);
      }

      // Load delivery setting
      const isDeliveryAvailable = firstService.delivery?.isDeliveryAvailable ?? true;
      setOffersDelivery(isDeliveryAvailable);
      setDeliveryChanged(false);
    }
  }, [existingServices, providerInfo]);

  // Fetch services on mount to detect currency
  useEffect(() => {
    fetchCurrencyFromServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Fetch currency from existing services
   */
  const fetchCurrencyFromServices = async () => {
    try {
      const response = await apiClient.get('/service/services?category=dining');
      let services = [];
      if (response.data.data?.services) {
        services = response.data.data.services;
      } else if (Array.isArray(response.data.data)) {
        services = response.data.data;
      }

      // Detect currency from first service
      if (services.length > 0 && services[0].pricing?.currency) {
        const detectedCurrency = services[0].pricing.currency;
        setCurrency(detectedCurrency);
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', SAR: 'SAR', EGP: 'E£' };
        setCurrencySymbol(symbols[detectedCurrency] || '$');
      }
    } catch (error) {
      // Silently fail - will use default USD
      console.log('No existing services found, using default currency');
    }
  };

  /**
   * Fetch existing restaurant services for management
   */
  const fetchExistingServices = async () => {
    try {
      setLoading(true);

      const response = await apiClient.get('/service/services?category=dining');

      let services = [];
      if (response.data.data?.services) {
        services = response.data.data.services;
      } else if (Array.isArray(response.data.data)) {
        services = response.data.data;
      }

      setExistingServices(services);

      // Detect currency from first service
      if (services.length > 0 && services[0].pricing?.currency) {
        const detectedCurrency = services[0].pricing.currency;
        setCurrency(detectedCurrency);
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', SAR: 'SAR', EGP: 'E£' };
        setCurrencySymbol(symbols[detectedCurrency] || '$');
      }
    } catch (error) {
      console.error('❌ Error fetching restaurant services:', error);
      toast.error(t('serviceProvider.restaurant.messages.failedToLoad'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Fetch hotel branding for dynamic colors
   */
  const fetchHotelBranding = async () => {
    try {
      // Get service provider dashboard data which includes hotel branding
      const dashboardRes = await apiClient.get('/service/dashboard');
      const hotelData = dashboardRes.data.data.hotel;

      if (hotelData && hotelData.branding) {
        setHotelBranding({
          primaryColor: hotelData.branding.primaryColor || '#3B5787',
          secondaryColor: hotelData.branding.secondaryColor || '#67BAE0'
        });
      }
    } catch (error) {
      console.error('Error fetching hotel branding:', error);
      // Fallback already handled by initial state
    }
  };

  useEffect(() => {
    fetchHotelBranding();
  }, []);

  /**
   * Add custom menu item created by service provider
   */
  const addCustomMenuItem = (customItem) => {
    // Check if item already exists
    if (menuItems.find(item => item.name === customItem.name)) {
      toast.warn(t('serviceProvider.restaurant.messages.itemAlreadyExists'));
      return false;
    }

    setMenuItems(prev => [...prev, customItem]);
    toast.success(t('serviceProvider.restaurant.messages.itemAdded', { itemName: customItem.name }));
    return true;
  };

  /**
   * Remove item from menu
   */
  const removeItem = (itemName) => {
    setMenuItems(prev => prev.filter(item => item.name !== itemName));
    toast.success(t('serviceProvider.restaurant.messages.itemRemoved'));
  };

  /**
   * Update item price (legacy function - now handled by edit form)
   */
  // const updateItemPrice = (itemName, price) => {
  //   setMenuItems(prev => prev.map(item =>
  //     item.name === itemName ? { ...item, price: parseFloat(price) || 0 } : item
  //   ));
  // };

  /**
   * Update item availability
   */
  const updateItemAvailability = (itemName, isAvailable) => {
    setMenuItems(prev => prev.map(item =>
      item.name === itemName ? { ...item, isAvailable } : item
    ));
  };

  /**
   * Update item details (legacy function - now handled by edit form)
   */
  // const updateItemDetails = (itemName, field, value) => {
  //   setMenuItems(prev => prev.map(item =>
  //     item.name === itemName ? { ...item, [field]: value } : item
  //   ));
  // };

  /**
   * Start editing a menu item
   */
  const startEditingItem = (index) => {
    setEditingItemIndex(index);
  };

  /**
   * Cancel editing a menu item
   */
  const cancelEditingItem = () => {
    setEditingItemIndex(null);
  };

  /**
   * Update menu item with new data
   */
  const updateMenuItem = (index, updatedItem) => {
    setMenuItems(prev => prev.map((item, i) =>
      i === index ? updatedItem : item
    ));
    setEditingItemIndex(null);
  };

  /**
   * Start editing a service menu item
   */
  const startEditingServiceMenuItem = (serviceId, itemIndex) => {
    setEditingServiceMenuItem({ serviceId, itemIndex });
  };

  /**
   * Cancel editing service menu item
   */
  const cancelEditingServiceMenuItem = () => {
    setEditingServiceMenuItem(null);
  };

  /**
   * Update service menu item
   */
  const updateServiceMenuItem = async (serviceId, itemIndex, updatedItem) => {
    try {
      // Show loading toast
      toast.info('Updating menu item...');

      // Find the service and update its menu item
      const service = existingServices.find(s => s._id === serviceId);
      if (!service) {
        console.error('❌ Service not found:', serviceId);
        toast.error('Service not found');
        return;
      }

      const updatedMenuItems = [...service.menuItems];
      updatedMenuItems[itemIndex] = updatedItem;

      // Only send the menuItems array, not the entire service object
      // This prevents the service.category from overriding menu item categories
      const response = await apiClient.put(`/service/services/${serviceId}`, {
        menuItems: updatedMenuItems
      });

      if (response.data.status === 'success') {
        toast.success('✅ Menu item updated successfully!');

        // Refresh the services list first
        await fetchExistingServices();

        // Then update the editFormData if we're in edit mode for this service
        // We need to fetch the services again to get the updated data
        if (editingService === serviceId) {
          try {
            const updatedServiceResponse = await apiClient.get(`/service/services/${serviceId}`);
            if (updatedServiceResponse.data.status === 'success') {
              setEditFormData(updatedServiceResponse.data.data);
            }
          } catch (err) {
            console.error('Error refreshing edit form data:', err);
          }
        }

        setEditingServiceMenuItem(null);

        return true; // Indicate success
      } else {
        console.error('❌ Update failed - response not successful:', response.data);
        toast.error('Failed to update menu item - server response not successful');
        return false;
      }
    } catch (error) {
      console.error('❌ Error updating service menu item:', error);
      console.error('❌ Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(`Failed to update menu item: ${error.response?.data?.message || error.message}`);
      return false;
    }
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    if (!serviceDetails.name.trim()) {
      toast.error(t('serviceProvider.restaurant.messages.serviceNameRequired'));
      return false;
    }

    if (menuItems.length === 0) {
      toast.error(t('serviceProvider.restaurant.messages.addOneItem'));
      return false;
    }

    const invalidItems = menuItems.filter(item => item.price <= 0);
    if (invalidItems.length > 0) {
      toast.error(t('serviceProvider.restaurant.messages.validPrice'));
      return false;
    }

    return true;
  };

  /**
   * Submit restaurant service
   */
  const submitService = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const serviceData = {
        name: serviceDetails.name,
        description: serviceDetails.description,
        category: 'dining',
        subcategory: serviceDetails.cuisineType || 'general',
        serviceType: 'restaurant',
        pricing: {
          basePrice: menuItems.length > 0 ? Math.min(...menuItems.map(item => item.price)) : 10,
          pricingType: 'per-item',
          currency: currency
        },
        specifications: {
          duration: {
            estimated: 30,
            unit: 'minutes'
          }
        },
        // Include restaurant image in media
        media: {
          images: restaurantImage ? [restaurantImage] : []
        },
        menuItems: menuItems.map(item => ({
          name: item.name,
          category: item.category,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl,
          isAvailable: item.isAvailable,
          allergens: item.allergens || [],
          spicyLevel: item.spicyLevel || 'normal',
          isVegetarian: item.isVegetarian || false,
          isVegan: item.isVegan || false,
          preparationTime: item.preparationTime || 15,
          notes: item.notes || ''
        })),
        isActive: true
      };

      const response = await apiClient.post('/service/services', serviceData);

      if (response.data.status === 'success') {
        toast.success(t('serviceProvider.restaurant.messages.serviceCreated'));
        // Reset form
        setServiceDetails({ name: '', description: '', cuisineType: '', mealTypes: [] });
        setMenuItems([]);
        setRestaurantImage(null);
        setRestaurantImagePreview(null);
        // Refresh the services list to show the new service
        await fetchExistingServices();
        // Switch to manage tab to see the created service
        setActiveTab('manage');
      } else {
        throw new Error(response.data.message || 'Failed to create service');
      }
    } catch (error) {
      console.error('Error creating restaurant service:', error);
      toast.error(error.response?.data?.message || error.message || t('serviceProvider.restaurant.messages.serviceCreateFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Start editing a service
   */
  const startEditingService = (service) => {
    setEditingService(service._id);
    setEditFormData({
      name: service.name,
      description: service.description,
      cuisineType: service.cuisineType,
      menuItems: service.menuItems || []
    });
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingService(null);
    setEditFormData({});
  };

  /**
   * Save edited service
   */
  const saveEditedService = async (serviceId) => {
    try {
      setLoading(true);

      const response = await apiClient.put(`/service/services/${serviceId}`, editFormData);

      if (response.data.status === 'success') {
        toast.success(t('serviceProvider.restaurant.messages.serviceUpdated'));
        setEditingService(null);
        setEditFormData({});
        await fetchExistingServices();
      } else {
        throw new Error(response.data.message || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating restaurant service:', error);
      toast.error(error.response?.data?.message || t('serviceProvider.restaurant.messages.serviceUpdateFailed'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle service availability
   */
  const toggleServiceAvailability = async (serviceId, currentStatus) => {
    try {
      const response = await apiClient.patch(`/service/services/${serviceId}/toggle-availability`);

      if (response.data.status === 'success') {
        toast.success(t(`serviceProvider.restaurant.messages.service${currentStatus ? 'Deactivated' : 'Activated'}`));
        await fetchExistingServices();
      } else {
        throw new Error(response.data.message || 'Failed to toggle service availability');
      }
    } catch (error) {
      console.error('Error toggling service availability:', error);
      toast.error(t('serviceProvider.restaurant.messages.toggleFailed'));
    }
  };

  /**
   * Delete a service
   */
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm(t('serviceProvider.restaurant.messages.confirmDelete'))) {
      return;
    }

    try {
      const response = await apiClient.delete(`/service/services/${serviceId}`);

      if (response.data.status === 'success') {
        toast.success(t('serviceProvider.restaurant.messages.serviceDeleted'));
        await fetchExistingServices();
      } else {
        throw new Error(response.data.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      const errorMessage = error.response?.data?.message || t('serviceProvider.restaurant.messages.serviceDeleteFailed') || 'Failed to delete service';
      toast.error(errorMessage);
    }
  };

  /**
   * Get translated category name
   */
  const getCategoryName = (category) => {
    const categoryKey = category?.toLowerCase();
    return t(`serviceProvider.restaurant.categories.${categoryKey}`, category);
  };

  /**
   * Render Add Items Tab
   */
  const renderAddItemsTab = () => {
    return (
      <div className="space-y-8">
        {/* Service Details Section */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: `linear-gradient(to right, ${hexToRgba(hotelBranding.primaryColor, 0.05)}, ${hexToRgba(hotelBranding.secondaryColor, 0.05)})`,
            borderColor: hexToRgba(hotelBranding.primaryColor, 0.1)
          }}
        >
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div
              className="p-2 rounded-lg mr-3"
              style={{ backgroundColor: hotelBranding.primaryColor }}
            >
              <FaUtensils className="text-white text-sm" />
            </div>
            {t('serviceProvider.restaurant.form.serviceDetails')}
          </h3>

          <div className="space-y-2">
            <label className="block text-sm font-bold text-gray-700">
              {t('serviceProvider.restaurant.form.serviceName')} *
            </label>
            <input
              type="text"
              value={serviceDetails.name}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, name: e.target.value }))}
              className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
              placeholder={t('serviceProvider.restaurant.form.serviceNamePlaceholder')}
            />
          </div>

          <div className="space-y-2 mt-6">
            <label className="block text-sm font-bold text-gray-700">
              {t('serviceProvider.restaurant.form.serviceDescription')}
              <span className="text-sm font-normal text-gray-500 ml-2">{t('serviceProvider.restaurant.form.serviceDescriptionNote')}</span>
            </label>
            <textarea
              value={serviceDetails.description}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
              className={INPUT + " resize-none transition-all duration-300 focus:scale-[1.02]"}
              rows="4"
              placeholder={t('serviceProvider.restaurant.form.serviceDescriptionPlaceholder')}
            />
          </div>
        </div>

        {/* Add Custom Menu Items Section */}
        <div
          className="rounded-2xl p-6 border"
          style={{
            background: `linear-gradient(to right, ${hexToRgba(hotelBranding.secondaryColor, 0.05)}, ${hexToRgba(hotelBranding.primaryColor, 0.05)})`,
            borderColor: hexToRgba(hotelBranding.secondaryColor, 0.1)
          }}
        >
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div
              className="p-2 rounded-lg mr-3"
              style={{ backgroundColor: hotelBranding.secondaryColor }}
            >
              <FaPlus className="text-white text-sm" />
            </div>
            {t('serviceProvider.restaurant.form.addCustomItem')}
          </h3>

          <CustomMenuItemForm
            onAddItem={addCustomMenuItem}
            t={t}
            currency={currency}
            currencySymbol={currencySymbol}
            hotelBranding={hotelBranding}
          />
        </div>

        {/* Menu Items List */}
        {menuItems.length > 0 && (
          <div
            className="rounded-2xl p-6 border"
            style={{
              background: `linear-gradient(to right, ${hexToRgba(hotelBranding.primaryColor, 0.02)}, ${hexToRgba(hotelBranding.secondaryColor, 0.02)})`,
              borderColor: hexToRgba(hotelBranding.primaryColor, 0.1)
            }}
          >
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <div
                className="p-2 rounded-lg mr-3"
                style={{ backgroundColor: hotelBranding.primaryColor }}
              >
                <FaListUl className="text-white text-sm" />
              </div>
              {t('serviceProvider.restaurant.form.yourMenuItems')} ({menuItems.length})
            </h3>

            <div className="space-y-6">
              {menuItems.map((item, itemIndex) => (
                <div key={itemIndex} className={CARD + " group hover:scale-[1.02] transition-all duration-300 relative"}>
                  {/* Background Pattern */}
                  <div
                    className="absolute top-0 right-0 w-24 h-24 rounded-bl-full"
                    style={{ background: `linear-gradient(to bottom right, ${hexToRgba(hotelBranding.secondaryColor, 0.1)}, transparent)` }}
                  ></div>

                  {editingItemIndex === itemIndex ? (
                    // Edit Mode
                    <EditMenuItemForm
                      item={item}
                      onSave={(updatedItem) => updateMenuItem(itemIndex, updatedItem)}
                      onCancel={cancelEditingItem}
                      t={t}
                      currency={currency}
                      currencySymbol={currencySymbol}
                      hotelBranding={hotelBranding}
                    />
                  ) : (
                    // View Mode
                    <>
                      {/* Item Header */}
                      <div
                        className="relative z-10 text-white p-6"
                        style={{ background: `linear-gradient(to right, ${hotelBranding.primaryColor}, ${hotelBranding.secondaryColor})` }}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-16 h-16 object-cover rounded-xl mr-4 border-2 border-white/20"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-xl mr-4 flex items-center justify-center text-2xl">
                                🍽️
                              </div>
                            )}
                            <div>
                              <h4 className="text-xl font-bold">{item.name}</h4>
                              <p className="text-blue-100 text-sm">
                                {getCategoryName(item.category)} • {currencySymbol}{item.price} • {item.preparationTime || 15} {t('common.min')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            {/* Item Availability Toggle */}
                            <label className="flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.isAvailable}
                                onChange={(e) => updateItemAvailability(item.name, e.target.checked)}
                                className="sr-only"
                              />
                              <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                item.isAvailable ? 'bg-green-500' : 'bg-red-500'
                              }`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                  item.isAvailable ? 'translate-x-6' : 'translate-x-1'
                                }`} />
                              </div>
                              <span className="ml-3 text-sm font-medium">
                                {item.isAvailable ? (
                                  <>
                                    <FaEye className="inline mr-1" />
                                    {t('serviceProvider.restaurant.details.available')}
                                  </>
                                ) : (
                                  <>
                                    <FaEyeSlash className="inline mr-1" />
                                    {t('serviceProvider.restaurant.details.unavailable')}
                                  </>
                                )}
                              </span>
                            </label>

                            <button
                              onClick={() => startEditingItem(itemIndex)}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-blue-200 hover:text-white"
                            >
                              <FaEdit />
                            </button>

                            <button
                              onClick={() => removeItem(item.name)}
                              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-red-200 hover:text-white"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Item Details */}
                      <div className="relative z-10 p-6">
                        {/* Description */}
                        {item.description && (
                          <div className="mb-4">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">{t('serviceProvider.restaurant.form.description')}</h5>
                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div
                            className="rounded-lg p-3"
                            style={{ backgroundColor: hexToRgba(hotelBranding.primaryColor, 0.1) }}
                          >
                            <div className="text-sm font-bold text-gray-700 mb-1">{t('serviceProvider.restaurant.form.price')}</div>
                            <div className="text-lg font-bold" style={{ color: hotelBranding.primaryColor }}>{currencySymbol}{item.price}</div>
                          </div>
                          <div
                            className="bg-green-50 rounded-lg p-3"
                            style={{ backgroundColor: hexToRgba('#10B981', 0.1) }}
                          >
                            <div className="text-sm font-bold text-gray-700 mb-1">{t('serviceProvider.restaurant.details.prepTime')}</div>
                            <div className="text-lg font-bold text-green-600">{item.preparationTime || 15} {t('common.min')}</div>
                          </div>
                          <div
                            className="bg-orange-50 rounded-lg p-3"
                            style={{ backgroundColor: hexToRgba('#F97316', 0.1) }}
                          >
                            <div className="text-sm font-bold text-gray-700 mb-1">{t('serviceProvider.restaurant.details.spicyLevel')}</div>
                            <div className="text-lg font-bold text-orange-600 capitalize">
                              {t(`serviceProvider.restaurant.spicyLevels.${item.spicyLevel || 'normal'}`)}
                            </div>
                          </div>
                          <div
                            className="rounded-lg p-3"
                            style={{ backgroundColor: hexToRgba(hotelBranding.secondaryColor, 0.1) }}
                          >
                            <div className="text-sm font-bold text-gray-700 mb-1">{t('serviceProvider.restaurant.details.category')}</div>
                            <div className="text-lg font-bold" style={{ color: hotelBranding.secondaryColor }}>{getCategoryName(item.category)}</div>
                          </div>
                        </div>

                        {/* Dietary Info */}
                        <div className="flex flex-wrap gap-3 mb-4">
                          {item.isVegetarian && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              🌱 {t('serviceProvider.restaurant.details.vegetarian')}
                            </span>
                          )}
                          {item.isVegan && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              🥬 {t('serviceProvider.restaurant.details.vegan')}
                            </span>
                          )}
                          {item.spicyLevel && item.spicyLevel !== 'normal' && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              🌶️ {t(`serviceProvider.restaurant.spicyLevels.${item.spicyLevel}`)}
                            </span>
                          )}
                        </div>

                        {/* Allergens */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">{t('serviceProvider.restaurant.details.allergens')}</h5>
                            <div className="flex flex-wrap gap-2">
                              {item.allergens.map((allergen, idx) => (
                                <span key={idx} className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm">
                                  ⚠️ {allergen}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Additional Notes */}
                        {item.notes && (
                          <div>
                            <h5 className="text-sm font-bold text-gray-700 mb-2">{t('serviceProvider.restaurant.details.notes')}</h5>
                            <p className="text-gray-600 text-sm italic">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center mt-8">
          <button
            onClick={submitService}
            disabled={loading || menuItems.length === 0}
            className={BTN.primary + " px-8 py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed"}
            style={{
               background: `linear-gradient(to right, ${hotelBranding.primaryColor}, ${hotelBranding.secondaryColor})`
            }}
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                {t('serviceProvider.restaurant.actions.creating')}
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                {t('serviceProvider.restaurant.actions.createService')}
              </>
            )}
          </button>
        </div>
      </div>
    );
  };



  /**
   * Render Manage Items Tab
   */
  const renderManageItemsTab = () => {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
            <div className="relative flex flex-col items-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">{t('serviceProvider.restaurant.title')}</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('serviceProvider.restaurant.messages.loadingServices')}</p>
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

    if (existingServices.length === 0) {
      return (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-blue-50 mb-6">
              <FaUtensils className="text-8xl text-gray-300 mb-4 mx-auto" />
            </div>
            <h3 className="text-2xl font-bold text-gray-800 mb-3">{t('serviceProvider.restaurant.messages.noServicesFound')}</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">{t('serviceProvider.restaurant.messages.noServicesDescription')}</p>
            <button
              onClick={() => setActiveTab('add')}
              className={BTN.primary + " px-8 py-4 text-lg"}
            >
              <FaPlus className="mr-2" />
              {t('serviceProvider.restaurant.messages.createFirstService')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        {/* Search Bar */}
        <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('serviceProvider.restaurant.search.placeholder') || 'ابحث في القائمة'}
              className="w-full px-4 py-3 pr-12 rounded-xl border-2 border-[#67BAE0]/30 focus:border-[#67BAE0] focus:ring-2 focus:ring-[#67BAE0]/20 transition-all outline-none text-right"
              dir="rtl"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#67BAE0]">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>


        {/* Menu Items - Direct Display */}
        <div className="space-y-8">
          {existingServices.map((service) => (
            <div key={service._id} className="w-full">
              {editingService === service._id ? (
                  // Enhanced Edit Mode - All Fields
                  <div className="relative">
                    {/* Edit Mode Header */}
                    <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white p-6 rounded-t-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-2 rounded-xl bg-white/20 backdrop-blur-sm mr-4">
                            <FaEdit className="text-xl" />
                          </div>
                          <h3 className="text-xl font-bold">Edit Restaurant Service</h3>
                        </div>
                        <button
                          onClick={cancelEditing}
                          className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        >
                          <FaTimes className="text-lg" />
                        </button>
                      </div>
                    </div>

                    {/* Edit Form Content */}
                    <div className="p-8 space-y-8">
                      {/* Basic Information Section */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                        <h4 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                          <div className="p-2 rounded-lg bg-blue-500 mr-3">
                            <FaUtensils className="text-white text-sm" />
                          </div>
                          Basic Information
                        </h4>

                        <div className="space-y-2">
                          <label className="block text-sm font-bold text-gray-700">Service Name *</label>
                          <input
                            type="text"
                            value={editFormData.name || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                            className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
                            placeholder="Enter service name"
                          />
                        </div>

                        <div className="space-y-2 mt-6">
                          <label className="block text-sm font-bold text-gray-700">
                            Service Description
                            <span className="text-sm font-normal text-gray-500 ml-2">(This description will appear for you as a service provider, not for users)</span>
                          </label>
                          <textarea
                            value={editFormData.description || ''}
                            onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                            className={INPUT + " resize-none transition-all duration-300 focus:scale-[1.02]"}
                            rows="4"
                            placeholder="Describe your restaurant service, specialties, dining experience..."
                          />
                        </div>
                      </div>

                      {/* Menu Items Management Section */}
                      <div className="bg-purple-50 rounded-xl p-6 mt-6">
                        <h4 className="font-bold text-gray-800 mb-4 flex items-center">
                          <FaListUl className="mr-2 text-purple-600" />
                          Menu Items Management
                        </h4>

                        {service.menuItems && service.menuItems.length > 0 ? (
                          <div className="space-y-4">
                            {service.menuItems.map((item, index) => (
                              <div key={index} className="bg-white rounded-lg p-4 border border-purple-200">
                                {editingServiceMenuItem &&
                                 editingServiceMenuItem.serviceId === service._id &&
                                 editingServiceMenuItem.itemIndex === index ? (
                                  // Edit Mode for Service Menu Item
                                  <ServiceMenuItemEditForm
                                    item={item}
                                    onSave={async (updatedItem) => await updateServiceMenuItem(service._id, index, updatedItem)}
                                    onCancel={cancelEditingServiceMenuItem}
                                      t={t}
                                    />
                                ) : (
                                  // View Mode - Redesigned Clean Horizontal Card
                                  <div className="flex items-center justify-between gap-4 py-3 px-4 bg-white rounded-xl border border-gray-100 hover:border-[#67BAE0]/30 hover:shadow-sm transition-all">
                                    {/* Left Side - Action Buttons */}
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <button
                                        onClick={() => startEditingServiceMenuItem(service._id, index)}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-[#3B5787] hover:bg-[#3B5787]/10 rounded-lg transition-colors"
                                      >
                                        <FaEdit className="text-sm" />
                                        {t('common.edit') || 'Edit'}
                                      </button>
                                      <button
                                        onClick={() => {
                                          if (window.confirm(t('serviceProvider.restaurant.messages.confirmDeleteItem') || 'Are you sure you want to delete this item?')) {
                                            // Handle delete
                                            const updatedMenuItems = service.menuItems.filter((_, i) => i !== index);
                                            apiClient.put(`/service/services/${service._id}`, { menuItems: updatedMenuItems })
                                              .then(() => {
                                                toast.success(t('serviceProvider.restaurant.messages.itemDeleted') || 'Item deleted successfully');
                                                fetchExistingServices();
                                              })
                                              .catch(() => toast.error(t('common.error') || 'Error deleting item'));
                                          }
                                        }}
                                        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                      >
                                        <FaTimes className="text-sm" />
                                        {t('common.delete') || 'Delete'}
                                      </button>
                                    </div>

                                    {/* Middle - Price Info */}
                                    <div className="flex flex-col items-center flex-shrink-0 min-w-[80px]">
                                      <span className="text-xs text-gray-500">{t('serviceProvider.restaurant.form.price') || 'Price'}</span>
                                      <span className="text-lg font-bold text-[#3B5787]">{currencySymbol}{item.price}</span>
                                      {item.preparationTime && (
                                        <span className="text-xs text-gray-400">{item.preparationTime} {t('common.min') || 'min'}</span>
                                      )}
                                    </div>

                                    {/* Right Side - Name, Description, Image */}
                                    <div className="flex items-center gap-4 flex-1 justify-end">
                                      <div className="text-right flex-1">
                                        <h5 className="font-bold text-gray-800 text-base">{item.name}</h5>
                                        {item.description && (
                                          <p className="text-sm text-gray-500 line-clamp-2 mt-1">{item.description}</p>
                                        )}
                                      </div>
                                      <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-[#67BAE0]/20 to-[#3B5787]/20 flex items-center justify-center overflow-hidden flex-shrink-0">
                                        {item.imageUrl ? (
                                          <img
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                              e.target.style.display = 'none';
                                              e.target.nextSibling.style.display = 'flex';
                                            }}
                                          />
                                        ) : null}
                                        <div className={`w-full h-full items-center justify-center ${item.imageUrl ? 'hidden' : 'flex'}`}>
                                          <FaUtensils className="text-2xl text-[#3B5787]/40" />
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            <FaUtensils className="mx-auto text-4xl mb-2 text-gray-300" />
                            <p>No menu items found for this service</p>
                            <p className="text-sm">Menu items are managed in the "Add Items" tab when creating services</p>
                          </div>
                        )}
                      </div>

                      {/* Enhanced Action Buttons */}
                      <div className="flex gap-4 pt-4">
                        <button
                          onClick={() => saveEditedService(service._id)}
                          className={BTN.primary + " flex-1"}
                        >
                          <FaSave className="mr-2" />
                          Save Changes
                        </button>
                        <button
                          onClick={cancelEditing}
                          className={BTN.secondary + " flex-1"}
                        >
                          <FaTimes className="mr-2" />
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode - Restaurant Menu Style - 2 Columns
                  // View Mode - Restaurant Menu Style - Categorized Grid
                  <div className="w-full">
                    {/* Category Title */}
                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-2">
                       <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                         <div className="w-2 h-8 bg-[#67BAE0] rounded-full"></div>
                         {service.name}
                       </h3>
                       <div className="flex gap-2">
                         <button
                           onClick={() => setEditingService(service._id)}
                           className="text-sm text-[#3B5787] hover:underline px-2"
                         >
                           {t('common.edit') || 'Edit Category'}
                         </button>
                         <button
                           onClick={() => handleDeleteService(service._id)}
                           className="text-sm text-red-500 hover:underline px-2"
                         >
                           {t('common.delete') || 'Remove Category'}
                         </button>
                       </div>
                    </div>

                    {/* Items Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
                    {service.menuItems && service.menuItems.length > 0 ? (
                      service.menuItems.map((item, index) => (
                        <div key={index} className="w-full">
                            {editingServiceMenuItem &&
                             editingServiceMenuItem.serviceId === service._id &&
                             editingServiceMenuItem.itemIndex === index ? (
                              <ServiceMenuItemEditForm
                                item={item}
                                onSave={async (updatedItem) => await updateServiceMenuItem(service._id, index, updatedItem)}
                                onCancel={cancelEditingServiceMenuItem}
                                t={t}
                              />
                          ) : (
                            // Restaurant Menu Card
                            <div className={`flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-[#67BAE0] hover:shadow-md transition-all ${item.isAvailable === false ? 'opacity-50 grayscale' : ''}`}>

                                {/* Left - Toggle & Actions */}
                                <div className="flex flex-col items-center gap-2 pr-3 border-r border-gray-200">
                                  <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                      type="checkbox"
                                      checked={item.isAvailable !== false}
                                      onChange={(e) => {
                                        const updatedMenuItems = [...service.menuItems];
                                        updatedMenuItems[index] = { ...item, isAvailable: e.target.checked };
                                        apiClient.put(`/service/services/${service._id}`, { menuItems: updatedMenuItems })
                                          .then(() => {
                                            toast.success(e.target.checked ? 'تم تفعيل الصنف' : 'تم إلغاء تفعيل الصنف');
                                            fetchExistingServices();
                                          })
                                          .catch(() => toast.error('حدث خطأ'));
                                      }}
                                      className="sr-only peer"
                                    />
                                    <div className="w-8 h-4 bg-gray-300 rounded-full peer peer-checked:bg-[#67BAE0] peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full after:content-[''] after:absolute after:top-[1px] after:start-[2px] after:bg-white after:rounded-full after:h-3.5 after:w-3.5 after:transition-all"></div>
                                  </label>
                                  <div className="flex gap-1">
                                    <button
                                      onClick={() => startEditingServiceMenuItem(service._id, index)}
                                      className="p-1 text-[#67BAE0] hover:bg-[#67BAE0]/10 rounded"
                                    >
                                      <FaEdit className="text-xs" />
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                                          const updatedMenuItems = service.menuItems.filter((_, i) => i !== index);
                                          apiClient.put(`/service/services/${service._id}`, { menuItems: updatedMenuItems })
                                            .then(() => {
                                              toast.success('تم حذف العنصر بنجاح');
                                              fetchExistingServices();
                                            })
                                            .catch(() => toast.error('حدث خطأ'));
                                        }
                                      }}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <FaTrash className="text-xs" />
                                    </button>
                                  </div>
                                </div>

                                {/* Price Section */}
                                <div className="flex flex-col items-center px-3 border-l border-gray-200">
                                  <span className="text-[10px] text-gray-400">السعر</span>
                                  <span className="text-lg font-bold text-[#3B5787]">{item.price}</span>
                                  <span className="text-[10px] text-gray-400">ريال</span>
                                  {item.preparationTime && (
                                    <div className="flex items-center gap-0.5 text-[#67BAE0] mt-1">
                                      <FaClock className="text-[8px]" />
                                      <span className="text-[10px]">{item.preparationTime}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Name & Description */}
                                <div className="flex-1 text-right min-w-0">
                                  <h4 className="font-bold text-gray-800">{item.name}</h4>
                                  {item.description && (
                                    <p className="text-xs text-gray-500 line-clamp-1">{item.description}</p>
                                  )}
                                </div>

                                {/* Image */}
                                <div className="w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#67BAE0]/10 to-[#3B5787]/10">
                                  {item.imageUrl ? (
                                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <FaUtensils className="text-lg text-[#3B5787]/30" />
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-12 bg-gray-50 rounded-xl col-span-2">
                          <FaUtensils className="mx-auto text-4xl mb-2 text-gray-300" />
                          <p className="text-gray-500">لا توجد عناصر</p>
                        </div>
                      )}
                    </div>
                  </div>
                  )}
                </div>
              ))}
          </div>
        </div>
      );
  };

  const saveRestaurantImage = async () => {
    if (!restaurantImage) {
      toast.error(t('serviceProvider.restaurant.messages.noImageToSave') || 'Please upload an image first');
      return;
    }

    try {
      setLoading(true);

      // Verify the image URL is valid (ensure it's not a blob URL if possible, though component handles upload)
      // Usually restaurantImage is set to Cloudinary URL or Blob URL.
      // If it's a blob URL we rely on previous upload step to have succeeded or fallbacks.
      // Ideally we should use the state variable that holds the URL.

      await apiClient.put('/service/restaurant-info', {
        image: restaurantImage
      });

      toast.success(t('serviceProvider.restaurant.messages.imageSaved') || 'Restaurant image saved successfully!');
      await fetchExistingServices();
      await fetchProviderInfo();
    } catch (error) {
      console.error('Error saving restaurant image:', error);
      toast.error(t('serviceProvider.restaurant.messages.imageSaveFailed') || 'Failed to save image');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Render Settings Tab - Restaurant Settings (Name, Description, Image)
   */
  const renderSettingsTab = () => {
    // Get current data from first existing service
    const savedImage = existingServices[0]?.images?.[0] || existingServices[0]?.media?.images?.[0];
    const displayImage = restaurantImagePreview || restaurantImage || savedImage;

    // Calculate word count
    const wordCount = restaurantDescription.trim() ? restaurantDescription.trim().split(/\s+/).length : 0;

    // Handle description change with word limit
    const handleDescriptionChange = (e) => {
      const text = e.target.value;
      const words = text.trim() ? text.trim().split(/\s+/) : [];
      if (words.length <= WORD_LIMIT || text.length < restaurantDescription.length) {
        setRestaurantDescription(text);
        setInfoChanged(true);
      }
    };

    // Save restaurant info (name and description)
    const saveRestaurantInfo = async () => {
      try {
        setLoading(true);

        await apiClient.put('/service/restaurant-info', {
          name: restaurantName,
          description: restaurantDescription
        });

        toast.success('Restaurant info saved successfully!');
        setInfoChanged(false);
        await fetchExistingServices();
        await fetchProviderInfo();
      } catch (error) {
        console.error('Error saving restaurant info:', error);
        toast.error('Failed to save restaurant info');
      } finally {
        setLoading(false);
      }
    };

    // Show loading state while fetching services
    if (loading && existingServices.length === 0) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {/* Restaurant Info Section - Premium Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl p-8 border border-white/50 shadow-[0_8px_30px_rgba(59,87,135,0.12)] hover:shadow-[0_8px_40px_rgba(59,87,135,0.18)] transition-all duration-500 group">
          {/* Decorative Background Elements */}
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-br from-[#67BAE0]/20 to-[#3B5787]/10 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-16 -left-16 w-32 h-32 bg-gradient-to-tr from-[#3B5787]/15 to-[#67BAE0]/10 rounded-full blur-2xl"></div>

          <div className="relative">
            <h3 className="text-xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent mb-8 flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#3B5787] to-[#67BAE0] mr-4 shadow-lg shadow-[#3B5787]/25 group-hover:scale-110 transition-transform duration-300">
                <FaUtensils className="text-white text-lg" />
              </div>
              {t('serviceProvider.restaurant.form.restaurantInfo') || 'Restaurant Information'}
            </h3>

            <div className="space-y-6">
              {/* Restaurant Name */}
              <div className="group/input">
                <label className="block text-sm font-semibold text-[#3B5787] mb-3 flex items-center">
                  <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-full mr-2"></span>
                  {t('serviceProvider.restaurant.form.restaurantNameLabel') || 'Restaurant Name'}
                </label>
                <input
                  type="text"
                  value={restaurantName}
                  onChange={(e) => { setRestaurantName(e.target.value); setInfoChanged(true); }}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-[#67BAE0]/20 bg-white/70 backdrop-blur-sm focus:border-[#3B5787] focus:ring-4 focus:ring-[#3B5787]/10 outline-none transition-all duration-300 text-gray-700 placeholder-gray-400 text-base font-medium hover:border-[#67BAE0]/40"
                  placeholder={t('serviceProvider.restaurant.form.restaurantNamePlaceholder') || 'Enter your restaurant name'}
                />
              </div>

              {/* Restaurant Description */}
              <div>
                <label className="block text-sm font-semibold text-[#3B5787] mb-3 flex items-center justify-between">
                  <span className="flex items-center">
                    <span className="w-1.5 h-1.5 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-full mr-2"></span>
                    {t('serviceProvider.restaurant.form.restaurantDescriptionLabel') || 'Restaurant Description'}
                  </span>
                  <span className="text-xs font-normal text-[#67BAE0] bg-[#67BAE0]/10 px-3 py-1 rounded-full">
                    {wordCount}/{WORD_LIMIT} {t('common.words') || 'words'}
                  </span>
                </label>
                <textarea
                  value={restaurantDescription}
                  onChange={handleDescriptionChange}
                  className="w-full px-5 py-4 rounded-2xl border-2 border-[#67BAE0]/20 bg-white/70 backdrop-blur-sm focus:border-[#3B5787] focus:ring-4 focus:ring-[#3B5787]/10 outline-none transition-all duration-300 text-gray-700 placeholder-gray-400 resize-none hover:border-[#67BAE0]/40"
                  rows="4"
                  placeholder={t('serviceProvider.restaurant.form.restaurantDescriptionPlaceholder') || 'Describe your restaurant, cuisine style, specialties...'}
                />
                {wordCount >= WORD_LIMIT && (
                  <p className="text-xs text-amber-600 mt-2 flex items-center">
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2 animate-pulse"></span>
                    {t('serviceProvider.restaurant.form.wordLimitReached') || 'Word limit reached'}
                  </p>
                )}
              </div>

              {/* Save Info Button */}
              <div className="pt-2">
                <button
                  onClick={saveRestaurantInfo}
                  disabled={loading || !infoChanged}
                  className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white font-semibold shadow-lg shadow-[#3B5787]/25 hover:shadow-xl hover:shadow-[#3B5787]/30 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg flex items-center"
                >
                  {loading ? (
                    <>
                      <FaSpinner className="animate-spin mr-3 text-lg" />
                      {t('common.saving') || 'Saving...'}
                    </>
                  ) : (
                    <>
                      <FaSave className="mr-3 text-lg" />
                      {t('serviceProvider.restaurant.actions.saveInfo') || 'Save Info'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Working Hours Section - Premium Card */}
        <div className="relative overflow-hidden rounded-3xl bg-white/80 backdrop-blur-xl p-8 border border-white/50 shadow-[0_8px_30px_rgba(103,186,224,0.12)] hover:shadow-[0_8px_40px_rgba(103,186,224,0.18)] transition-all duration-500 group">
          {/* Decorative Background Elements */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br from-[#3B5787]/15 to-[#67BAE0]/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-gradient-to-tl from-[#67BAE0]/20 to-[#3B5787]/10 rounded-full blur-2xl"></div>

          <div className="relative">
            <h3 className="text-xl font-bold bg-gradient-to-r from-[#67BAE0] to-[#3B5787] bg-clip-text text-transparent mb-4 flex items-center">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#67BAE0] to-[#3B5787] mr-4 shadow-lg shadow-[#67BAE0]/25 group-hover:scale-110 transition-transform duration-300">
                <FaClock className="text-white text-lg" />
              </div>
              {t('serviceProvider.restaurant.form.workingHours') || 'Working Hours'}
            </h3>

            <p className="text-gray-500 mb-8 text-sm leading-relaxed">
              {t('serviceProvider.restaurant.form.workingHoursDescription') || 'Set your restaurant working hours. Your menu will only be visible to guests during these hours.'}
            </p>

          <div className="space-y-3">
            {[
              { key: 'saturday', label: t('serviceProvider.restaurant.days.saturday') || 'Saturday' },
              { key: 'sunday', label: t('serviceProvider.restaurant.days.sunday') || 'Sunday' },
              { key: 'monday', label: t('serviceProvider.restaurant.days.monday') || 'Monday' },
              { key: 'tuesday', label: t('serviceProvider.restaurant.days.tuesday') || 'Tuesday' },
              { key: 'wednesday', label: t('serviceProvider.restaurant.days.wednesday') || 'Wednesday' },
              { key: 'thursday', label: t('serviceProvider.restaurant.days.thursday') || 'Thursday' },
              { key: 'friday', label: t('serviceProvider.restaurant.days.friday') || 'Friday' }
            ].map(({ key, label }) => (
              <div key={key} className="flex items-center gap-4 p-4 bg-white rounded-xl border border-[#67BAE0]/20 hover:border-[#3B5787]/30 hover:shadow-sm transition-all">
                {/* Day Toggle */}
                <label className="flex items-center cursor-pointer min-w-[120px]">
                  <input
                    type="checkbox"
                    checked={workingHours[key]?.isAvailable ?? true}
                    onChange={(e) => {
                      setWorkingHours(prev => ({
                        ...prev,
                        [key]: { ...prev[key], isAvailable: e.target.checked }
                      }));
                      setWorkingHoursChanged(true);
                    }}
                    className="sr-only"
                  />
                  <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    workingHours[key]?.isAvailable ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0]' : 'bg-gray-300'
                  }`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      workingHours[key]?.isAvailable ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </div>
                  <span className={`ml-3 font-medium ${workingHours[key]?.isAvailable ? 'text-gray-800' : 'text-gray-400'}`}>
                    {label}
                  </span>
                </label>

                {/* Time Inputs */}
                <div className={`flex items-center gap-2 flex-1 ${!workingHours[key]?.isAvailable ? 'opacity-40 pointer-events-none' : ''}`}>
                  <span className="text-sm text-gray-500">{t('serviceProvider.restaurant.form.from') || 'From'}</span>
                  <input
                    type="time"
                    value={workingHours[key]?.startTime || '09:00'}
                    onChange={(e) => {
                      setWorkingHours(prev => ({
                        ...prev,
                        [key]: { ...prev[key], startTime: e.target.value }
                      }));
                      setWorkingHoursChanged(true);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#67BAE0]/30 focus:ring-2 focus:ring-[#3B5787]/20 focus:border-[#3B5787] text-sm bg-white"
                  />
                  <span className="text-sm text-gray-500">{t('serviceProvider.restaurant.form.to') || 'To'}</span>
                  <input
                    type="time"
                    value={workingHours[key]?.endTime || '23:00'}
                    onChange={(e) => {
                      setWorkingHours(prev => ({
                        ...prev,
                        [key]: { ...prev[key], endTime: e.target.value }
                      }));
                      setWorkingHoursChanged(true);
                    }}
                    className="px-3 py-2 rounded-xl border border-[#67BAE0]/30 focus:ring-2 focus:ring-[#3B5787]/20 focus:border-[#3B5787] text-sm bg-white"
                  />
                </div>

                {/* Status Badge */}
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  workingHours[key]?.isAvailable
                    ? 'bg-[#67BAE0]/20 text-[#3B5787]'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {workingHours[key]?.isAvailable
                    ? (t('serviceProvider.restaurant.form.open') || 'Open')
                    : (t('serviceProvider.restaurant.form.closed') || 'Closed')}
                </span>
              </div>
            ))}
          </div>

          {/* Save Working Hours Button */}
          <div className="mt-6 flex justify-start">
            <button
                onClick={async () => {
                try {
                  setLoading(true);
                  const schedule = {};
                  Object.keys(workingHours).forEach(day => {
                    schedule[day] = {
                      isAvailable: workingHours[day].isAvailable,
                      timeSlots: [{
                        startTime: workingHours[day].startTime,
                        endTime: workingHours[day].endTime,
                        maxBookings: 50
                      }]
                    };
                  });

                  await apiClient.put('/service/restaurant-info', {
                    schedule
                  });

                  toast.success(t('serviceProvider.restaurant.messages.workingHoursSaved') || 'Working hours saved successfully!');
                  setWorkingHoursChanged(false);
                  await fetchExistingServices();
                  await fetchProviderInfo();
                } catch (error) {
                  console.error('Error saving working hours:', error);
                  toast.error(t('serviceProvider.restaurant.messages.workingHoursSaveFailed') || 'Failed to save working hours');
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading || !workingHoursChanged}
              className={BTN.primary + " px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {t('serviceProvider.restaurant.actions.saveWorkingHours') || 'Save Working Hours'}
                </>
              )}
            </button>
          </div>
          </div>
        </div>

        {/* Delivery Service Toggle */}
        <div className="bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/5 rounded-2xl p-6 border border-[#3B5787]/10 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-[#3B5787] mb-4 flex items-center">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#3B5787] to-[#67BAE0] mr-3 shadow-lg">
              <span className="text-white text-sm">🚗</span>
            </div>
            {t('serviceProvider.restaurant.form.deliveryService') || 'Delivery Service'}
          </h3>

          <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-[#67BAE0]/20">
            <div>
              <p className="font-medium text-gray-800">
                {t('serviceProvider.restaurant.form.offerDelivery') || 'Do you offer delivery service?'}
              </p>
              <p className="text-sm text-gray-500">
                {t('serviceProvider.restaurant.form.deliveryDescription') || 'Enable this if you can deliver orders to guest rooms'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => { setOffersDelivery(true); setDeliveryChanged(true); }}
                className={`px-5 py-2.5 rounded-xl font-medium transition-all ${
                  offersDelivery
                    ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('common.yes') || 'Yes'}
              </button>
              <button
                onClick={() => { setOffersDelivery(false); setDeliveryChanged(true); }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  !offersDelivery
                    ? 'bg-red-500 text-white shadow-md'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {t('common.no') || 'No'}
              </button>
            </div>
          </div>

          {/* Save Delivery Button */}
          {deliveryChanged && (
            <div className="mt-4 flex justify-start">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await apiClient.put('/service/restaurant-info', {
                      offersDelivery
                    });
                    toast.success(t('serviceProvider.restaurant.messages.deliverySaved') || 'Delivery settings saved!');
                    setDeliveryChanged(false);
                    await fetchExistingServices();
                    await fetchProviderInfo();
                  } catch (error) {
                    console.error('Error saving delivery settings:', error);
                    toast.error('Failed to save delivery settings');
                  } finally {
                    setLoading(false);
                  }
                }}
                disabled={loading}
                className={BTN.primary + " px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed"}
              >
                {loading ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    {t('common.saving') || 'Saving...'}
                  </>
                ) : (
                  <>
                    <FaSave className="mr-2" />
                    {t('common.save') || 'Save'}
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Restaurant Image Section */}
        <div className="bg-gradient-to-br from-[#67BAE0]/5 via-white to-[#3B5787]/5 rounded-2xl p-6 border border-[#67BAE0]/10 shadow-sm hover:shadow-md transition-shadow">
          <h3 className="text-lg font-bold text-[#3B5787] mb-6 flex items-center">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-[#67BAE0] to-[#3B5787] mr-3 shadow-lg">
              <FaCamera className="text-white text-sm" />
            </div>
            {t('serviceProvider.restaurant.form.restaurantImage') || 'Restaurant Image'}
          </h3>

          <p className="text-gray-600 mb-6">
            {t('serviceProvider.restaurant.form.imageDescription') || 'Upload a logo or cover photo for your restaurant. This image will be shown to guests when they browse restaurants.'}
          </p>

          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Image Preview/Upload */}
            <div className="flex-shrink-0">
              {/* Hidden file input for changing image */}
              <input
                type="file"
                id="restaurant-image-input"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
                disabled={uploadingImage}
              />

              {displayImage ? (
                <div className="relative inline-block">
                  <img
                    src={displayImage}
                    alt="Restaurant"
                    className="w-48 h-48 object-cover rounded-2xl border-2 border-gray-200 shadow-lg"
                  />
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={removeRestaurantImage}
                    className="absolute -top-2 -right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 shadow-lg transition-all duration-200"
                  >
                    <FaTimes className="text-xs" />
                  </button>
                  {uploadingImage && (
                    <div className="absolute inset-0 bg-black/50 rounded-2xl flex items-center justify-center">
                      <FaSpinner className="animate-spin text-white text-2xl" />
                    </div>
                  )}
                  {/* Change image button */}
                  <label
                    htmlFor="restaurant-image-input"
                    className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-lg cursor-pointer hover:bg-white shadow-md transition-all duration-200"
                  >
                    {uploadingImage ? t('common.uploading') || 'Uploading...' : t('common.change') || 'Change'}
                  </label>
                </div>
              ) : (
                <label
                  htmlFor="restaurant-image-input"
                  className="flex flex-col items-center justify-center w-48 h-48 border-2 border-dashed border-gray-300 rounded-2xl cursor-pointer hover:border-[#3B5787] hover:bg-blue-50/50 transition-all duration-300"
                >
                  {uploadingImage ? (
                    <FaSpinner className="animate-spin text-[#3B5787] text-2xl mb-2" />
                  ) : (
                    <FaCamera className="text-gray-400 text-4xl mb-3" />
                  )}
                  <span className="text-sm text-gray-500 text-center px-2">
                    {uploadingImage
                      ? (t('common.uploading') || 'Uploading...')
                      : (t('serviceProvider.restaurant.form.uploadImage') || 'Click to upload')
                    }
                  </span>
                </label>
              )}
            </div>

            {/* Instructions */}
            <div className="flex-1">
              <h4 className="font-semibold text-gray-800 mb-3">
                {t('serviceProvider.restaurant.form.imageGuidelines') || 'Image Guidelines'}
              </h4>
              <ul className="space-y-2 text-sm text-gray-600">
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  {t('serviceProvider.restaurant.form.imageTip1') || 'Use a high-quality image (recommended 800x800px)'}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  {t('serviceProvider.restaurant.form.imageTip2') || 'Logo or restaurant photo works best'}
                </li>
                <li className="flex items-center">
                  <span className="w-2 h-2 bg-purple-500 rounded-full mr-2"></span>
                  {t('serviceProvider.restaurant.form.imageTip3') || 'Maximum file size: 5MB'}
                </li>
              </ul>
            </div>
          </div>

          {/* Save Button - only show if there's a new image to save */}
          <div className="mt-8 flex justify-start">
            <button
              onClick={saveRestaurantImage}
              disabled={loading || !restaurantImage}
              className={BTN.primary + " px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"}
            >
              {loading ? (
                <>
                  <FaSpinner className="animate-spin mr-2" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  {t('serviceProvider.restaurant.actions.saveImage') || 'Save Image'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Info about existing services */}
        {existingServices.length > 0 && (
          <div className="bg-blue-50 rounded-xl p-4 border border-blue-100">
            <p className="text-sm text-blue-800">
              <strong>{t('common.note') || 'Note'}:</strong> {t('serviceProvider.restaurant.form.imageWillApplyTo') || 'This image will be applied to all your'} {existingServices.length} {t('serviceProvider.restaurant.form.diningServices') || 'dining services'}.
            </p>
          </div>
        )}

        {/* No services message */}
        {existingServices.length === 0 && !loading && (
          <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong>{t('common.note') || 'Note'}:</strong> {t('serviceProvider.restaurant.messages.createServiceFirst') || 'Create a restaurant service first before uploading an image.'}
            </p>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="w-full p-4 sm:p-6 lg:p-8">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#3B5787] via-[#4A6B95] to-[#67BAE0] p-8 sm:p-12 text-white shadow-2xl mb-8">
          {/* Decorative Elements */}
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-white/10 blur-xl"></div>
          <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-white/15"></div>
          <div className="absolute top-8 right-1/4 h-6 w-6 rounded-full bg-white/20"></div>
          <div className="absolute bottom-12 right-12 h-4 w-4 rounded-full bg-white/25"></div>

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                {onBack && (
                  <button
                    onClick={onBack}
                    className="mr-6 p-3 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                  >
                    <FaArrowLeft className="text-xl" />
                  </button>
                )}
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm mr-6">
                    <FaUtensils className="text-4xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 mb-2">
                      {t('serviceProvider.restaurant.title')}
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-white/60 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-lg text-blue-100 max-w-2xl">
              {t('serviceProvider.restaurant.subtitle')}
            </p>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className={CARD + " mb-8"}>
          <div className="p-2">
            <nav className="flex gap-2">
              <button
                onClick={() => setActiveTab('add')}
                className={`${BTN.tab} ${
                  activeTab === 'add' ? BTN.tabActive : BTN.tabInactive
                }`}
              >
                <FaPlus className="mr-2" />
                {t('serviceProvider.restaurant.tabs.addService')}
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`${BTN.tab} ${
                  activeTab === 'manage' ? BTN.tabActive : BTN.tabInactive
                }`}
              >
                <FaCog className="mr-2" />
                {t('serviceProvider.restaurant.tabs.manageServices')}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`${BTN.tab} ${
                  activeTab === 'settings' ? BTN.tabActive : BTN.tabInactive
                }`}
              >
                <FaCamera className="mr-2" />
                {t('serviceProvider.restaurant.tabs.settings') || 'Restaurant Image'}
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'add' && renderAddItemsTab()}
            {activeTab === 'manage' && renderManageItemsTab()}
            {activeTab === 'settings' && renderSettingsTab()}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Custom Menu Item Form Component
 * Allows service providers to create completely custom menu items
 */
const CustomMenuItemForm = ({ onAddItem, t, currency = 'USD', currencySymbol = '$', hotelBranding }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'mains',
    description: '',
    price: '',
    imageUrl: '',
    preparationTime: '15',
    isVegetarian: false,
    isVegan: false,
    spicyLevel: 'normal',
    allergens: [],
    notes: ''
  });

  const [allergenInput, setAllergenInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Fallback if hotelBranding not provided
  const branding = hotelBranding || { primaryColor: '#3B5787', secondaryColor: '#67BAE0' };

  const categoryOptions = [
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'mains', label: 'Main Courses' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snacks', label: 'Snacks' }
  ];

  const spicyLevelOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'hot', label: 'Hot' },
    { value: 'very_hot', label: 'Very Hot' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image upload functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImageToCloudinary = async () => {
    // ... (upload logic stays same)
    if (!imageFile) return null;
    try {
      setUploadingImage(true);
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      if (!cloudName || cloudName === 'hotel-platform-demo' || cloudName === 'your_cloud_name_here') {
        const localUrl = URL.createObjectURL(imageFile);
        return localUrl;
      }
      const formData = new FormData();
      formData.append('file', imageFile);
      if (uploadPreset) formData.append('upload_preset', uploadPreset);
      formData.append('folder', 'hotel-platform/menu-items');
      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: 'POST',
        body: formData
      });
      if (!response.ok) {
        const localUrl = URL.createObjectURL(imageFile);
        return localUrl;
      }
      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      if (imageFile) {
        const localUrl = URL.createObjectURL(imageFile);
        return localUrl;
      }
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const addAllergen = () => {
    if (allergenInput.trim() && !formData.allergens.includes(allergenInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergenInput.trim()]
      }));
      setAllergenInput('');
    }
  };

  const removeAllergen = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t('serviceProvider.restaurant.messages.itemRequired'));
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error(t('serviceProvider.restaurant.messages.priceRequired'));
      return;
    }

    let imageUrl = formData.imageUrl;
    if (imageFile) {
      toast.info(t('serviceProvider.restaurant.messages.uploadingImage'));
      imageUrl = await uploadImageToCloudinary();
      if (!imageUrl) {
        toast.error(t('serviceProvider.restaurant.messages.imageUploadFailed'));
        return;
      }
    }

    const newItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime),
      isAvailable: true,
      imageUrl: imageUrl || formData.imageUrl
    };

    const success = onAddItem(newItem);
    if (success) {
      setFormData({
        name: '', category: 'mains', description: '', price: '', imageUrl: '',
        preparationTime: '15', isVegetarian: false, isVegan: false, spicyLevel: 'normal',
        allergens: [], notes: ''
      });
      setAllergenInput('');
      setImageFile(null);
      setImagePreview('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('serviceProvider.restaurant.form.itemNameRequired')}
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder={t('serviceProvider.restaurant.form.itemNamePlaceholder')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
            onFocus={(e) => e.target.style.borderColor = branding.secondaryColor}
            onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('serviceProvider.restaurant.form.categoryRequired')}
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
             className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
            required
          >
            {categoryOptions.map(option => (
              <option key={option.value} value={option.value}>
                {t(`serviceProvider.restaurant.categories.${option.value}`, option.label)}
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
             {t('serviceProvider.restaurant.form.price')} ({currency}) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
            required
          />
        </div>

        {/* Preparation Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('serviceProvider.restaurant.details.prepTime')} ({t('common.min')})
          </label>
          <input
            type="number"
            min="1"
            value={formData.preparationTime}
            onChange={(e) => handleInputChange('preparationTime', e.target.value)}
            placeholder={t('serviceProvider.restaurant.form.prepTimeDefault')}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
          />
        </div>

        {/* Spicy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('serviceProvider.restaurant.details.spicyLevel')}
          </label>
          <select
            value={formData.spicyLevel}
            onChange={(e) => handleInputChange('spicyLevel', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
          >
            {spicyLevelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {t(`serviceProvider.restaurant.spicyLevels.${option.value}`, option.label)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('serviceProvider.restaurant.form.imageUpload')}
        </label>

        {!imagePreview && !formData.imageUrl ? (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageSelect}
              className="hidden"
              id="image-upload"
            />
            <label htmlFor="image-upload" className="cursor-pointer">
              <div className="text-gray-400 mb-2">
                <FaCamera className="mx-auto text-4xl" />
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium hover:underline" style={{ color: branding.primaryColor }}>
                   {t('serviceProvider.restaurant.form.clickToUpload')}
                </span> {t('serviceProvider.restaurant.form.dragDrop')}
              </p>
              <p className="text-xs text-gray-500">{t('serviceProvider.restaurant.form.imageFormat')}</p>
            </label>
          </div>
        ) : (
          <div className="relative">
            <div className="border border-gray-300 rounded-lg p-4">
              <img
                src={imagePreview || formData.imageUrl}
                alt="Menu item preview"
                className="w-full h-48 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600 transition-colors"
              >
                <FaTimes />
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {imageFile ? t('serviceProvider.restaurant.form.newImageSelected') : t('serviceProvider.restaurant.form.currentImage')}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('serviceProvider.restaurant.form.description')}
          <span className="text-sm font-normal text-gray-500 ml-2">{t('serviceProvider.restaurant.form.descriptionNote')}</span>
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => {
            const words = e.target.value.split(/\s+/).filter(word => word.length > 0);
            if (words.length <= 200) {
              handleInputChange('description', e.target.value);
            }
          }}
          placeholder={t('serviceProvider.restaurant.form.descriptionPlaceholder')}
          rows="3"
          className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
          style={{ '--tw-ring-color': branding.secondaryColor }}
        />
        <div className="text-sm text-gray-500 mt-1">
          {t('serviceProvider.restaurant.form.wordsCountSuffix', { count: formData.description.split(/\s+/).filter(word => word.length > 0).length })}
        </div>
      </div>

      {/* Dietary Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('serviceProvider.restaurant.form.dietaryOptions')}
        </label>
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVegetarian}
              onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.details.vegetarian')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVegan}
              onChange={(e) => handleInputChange('isVegan', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.details.vegan')}</span>
          </label>
        </div>
      </div>

      {/* Allergens */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('serviceProvider.restaurant.details.allergens')}
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={allergenInput}
            onChange={(e) => setAllergenInput(e.target.value)}
            placeholder={t('serviceProvider.restaurant.form.allergensPlaceholder')}
            className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
          />
          <button
            type="button"
            onClick={addAllergen}
            className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity"
            style={{ backgroundColor: 'gray' }}
          >
            {t('serviceProvider.restaurant.form.addButton')}
          </button>
        </div>
        {formData.allergens.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {formData.allergens.map((allergen, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center"
              >
                {allergen}
                <button
                  type="button"
                  onClick={() => removeAllergen(allergen)}
                  className="ml-2 text-red-600 hover:text-red-800"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('serviceProvider.restaurant.details.notes')}
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder={t('serviceProvider.restaurant.form.notesPlaceholder')}
          rows="2"
           className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
            style={{ '--tw-ring-color': branding.secondaryColor }}
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={uploadingImage}
          className="px-6 py-3 text-white rounded-md shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: branding.primaryColor }}
        >
          {uploadingImage ? (
            <>
              <FaSpinner className="animate-spin mr-2 inline" />
              {t('serviceProvider.restaurant.messages.uploadingImage')}
            </>
          ) : (
            <>
              <FaPlus className="mr-2 inline" />
              {t('serviceProvider.restaurant.form.addMenuItem')}
            </>
          )}
        </button>
      </div>
    </form>
  );
};

/**
 * Edit Menu Item Form Component
 * Allows editing all menu item fields in a comprehensive form
 */
const EditMenuItemForm = ({ item, onSave, onCancel, t, currency, currencySymbol, hotelBranding }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    category: item.category || 'mains',
    description: item.description || '',
    price: item.price || '',
    imageUrl: item.imageUrl || '',
    preparationTime: item.preparationTime || 15,
    isVegetarian: item.isVegetarian || false,
    isVegan: item.isVegan || false,
    spicyLevel: item.spicyLevel || 'normal',
    allergens: item.allergens || [],
    notes: item.notes || '',
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
  });

  const [allergenInput, setAllergenInput] = useState('');

  // Fallback if hotelBranding not provided
  const branding = hotelBranding || { primaryColor: '#3B5787', secondaryColor: '#67BAE0' };

  const categoryOptions = [
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'mains', label: 'Main Courses' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snacks', label: 'Snacks' }
  ];

  const spicyLevelOptions = [
    { value: 'normal', label: 'Normal' },
    { value: 'medium', label: 'Medium' },
    { value: 'hot', label: 'Hot' },
    { value: 'very_hot', label: 'Very Hot' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addAllergen = () => {
    if (allergenInput.trim() && !formData.allergens.includes(allergenInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergenInput.trim()]
      }));
      setAllergenInput('');
    }
  };

  const removeAllergen = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      toast.error(t('serviceProvider.restaurant.messages.itemRequired'));
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error(t('serviceProvider.restaurant.messages.priceRequired'));
      return;
    }

    const updatedItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime),
    };

    onSave(updatedItem);
    toast.success(t('serviceProvider.restaurant.messages.itemUpdated'));
  };

  return (
    <div className="relative z-10">
      {/* Edit Header */}
      <div
        className="text-white p-6"
        style={{ background: `linear-gradient(to right, ${branding.primaryColor}, ${branding.secondaryColor})` }}
      >
        <h4 className="text-xl font-bold flex items-center">
          <FaEdit className="mr-3" />
          {t('serviceProvider.restaurant.form.editMenuItem')}
        </h4>
      </div>

      {/* Edit Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: hexToRgba(branding.primaryColor, 0.05) }}
          >
            <h5 className="font-bold text-gray-800 mb-4">{t('serviceProvider.restaurant.form.basicInfo')}</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceProvider.restaurant.form.itemNameRequired')}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder={t('serviceProvider.restaurant.form.itemNamePlaceholder')}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': branding.secondaryColor }}
                  onFocus={(e) => e.target.style.borderColor = branding.secondaryColor}
                  onBlur={(e) => e.target.style.borderColor = '#d1d5db'}
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceProvider.restaurant.form.categoryRequired')}
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': branding.secondaryColor }}
                  required
                >
                  {categoryOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(`serviceProvider.restaurant.categories.${option.value}`, option.label)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceProvider.restaurant.form.price')} ({currency}) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': branding.secondaryColor }}
                  required
                />
              </div>

              {/* Preparation Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceProvider.restaurant.details.prepTime')} ({t('common.min')})
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.preparationTime}
                  onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                  placeholder="15"
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': branding.secondaryColor }}
                />
              </div>

              {/* Spicy Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('serviceProvider.restaurant.details.spicyLevel')}
                </label>
                <select
                  value={formData.spicyLevel}
                  onChange={(e) => handleInputChange('spicyLevel', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': branding.secondaryColor }}
                >
                  {spicyLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {t(`serviceProvider.restaurant.spicyLevels.${option.value}`, option.label)}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('serviceProvider.restaurant.form.description')}
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder={t('serviceProvider.restaurant.form.descriptionPlaceholder')}
              rows="3"
               className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
               style={{ '--tw-ring-color': branding.secondaryColor }}
            />
          </div>

          {/* Dietary Options */}
          <div
            className="rounded-xl p-6"
            style={{ backgroundColor: hexToRgba('#10B981', 0.1) }} // Light green
          >
            <h5 className="font-bold text-gray-800 mb-4">{t('serviceProvider.restaurant.form.dietaryOptions')}</h5>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.details.vegetarian')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVegan}
                  onChange={(e) => handleInputChange('isVegan', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.details.vegan')}</span>
              </label>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('serviceProvider.restaurant.details.allergens')}
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergenInput}
                onChange={(e) => setAllergenInput(e.target.value)}
                placeholder={t('serviceProvider.restaurant.form.allergensPlaceholder')}
                className="flex-1 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
                style={{ '--tw-ring-color': branding.secondaryColor }}
              />
              <button
                type="button"
                onClick={addAllergen}
                className="px-4 py-2 text-white rounded-md hover:opacity-90 transition-opacity"
                style={{ backgroundColor: branding.primaryColor }}
              >
                {t('serviceProvider.restaurant.form.addButton')}
              </button>
            </div>
            {formData.allergens.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.allergens.map((allergen, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-sm flex items-center"
                  >
                    {allergen}
                    <button
                      type="button"
                      onClick={() => removeAllergen(allergen)}
                      className="ml-2 text-red-600 hover:text-red-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('serviceProvider.restaurant.details.notes')}
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('serviceProvider.restaurant.form.notesPlaceholder')}
              rows="2"
              className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2"
              style={{ '--tw-ring-color': branding.secondaryColor }}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <button
              type="submit"
              className="flex-1 px-6 py-3 text-white rounded-md shadow-md hover:shadow-lg transition-all font-medium"
              style={{ backgroundColor: branding.primaryColor }}
            >
              <FaSave className="inline mr-2" />
              {t('serviceProvider.restaurant.form.saveChanges')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3 bg-gray-500 text-white rounded-md hover:bg-gray-600 font-medium transition-colors"
            >
              <FaTimes className="inline mr-2" />
              {t('serviceProvider.restaurant.form.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/**
 * Service Menu Item Edit Form Component
 * Specialized form for editing menu items within the service management context
 */
const ServiceMenuItemEditForm = ({ item, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    category: item.category || 'mains',
    description: item.description || '',
    price: item.price || '',
    imageUrl: item.imageUrl || '',
    preparationTime: item.preparationTime || 15,
    isVegetarian: item.isVegetarian || false,
    isVegan: item.isVegan || false,
    spicyLevel: item.spicyLevel || 'normal',
    allergens: item.allergens || [],
    notes: item.notes || '',
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
  });

  const [allergenInput, setAllergenInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  // Reset image states when item changes (when editing different items)
  React.useEffect(() => {
    setImageFile(null);
    setImagePreview('');
    setFormData({
      name: item.name || '',
      category: item.category || 'mains',
      description: item.description || '',
      price: item.price || '',
      imageUrl: item.imageUrl || '',
      preparationTime: item.preparationTime || 15,
      isVegetarian: item.isVegetarian || false,
      isVegan: item.isVegan || false,
      spicyLevel: item.spicyLevel || 'normal',
      allergens: item.allergens || [],
      notes: item.notes || '',
      isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
    });
  }, [item]);

  const categoryOptions = [
    { value: 'appetizers', label: 'Appetizers' },
    { value: 'mains', label: 'Main Courses' },
    { value: 'desserts', label: 'Desserts' },
    { value: 'beverages', label: 'Beverages' },
    { value: 'breakfast', label: 'Breakfast' },
    { value: 'lunch', label: 'Lunch' },
    { value: 'dinner', label: 'Dinner' },
    { value: 'snacks', label: 'Snacks' }
  ];

  const spicyLevelOptions = [
    { value: 'normal', label: t('serviceProvider.restaurant.form.spicyLevelNormal') },
    { value: 'medium', label: t('serviceProvider.restaurant.form.spicyLevelMedium') },
    { value: 'hot', label: t('serviceProvider.restaurant.form.spicyLevelHot') },
    { value: 'very_hot', label: t('serviceProvider.restaurant.form.spicyLevelVeryHot') }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image handling functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setImageFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };  const uploadImageToCloudinary = async () => {
    if (!imageFile) {
      return null;
    }

    try {
      setUploadingImage(true);

      // Check if Cloudinary is properly configured
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      const apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;

      if (!cloudName || cloudName === 'hotel-platform-demo' || cloudName === 'your_cloud_name_here') {
        console.warn('⚠️ Cloudinary not configured properly. Using local preview for testing.');
        toast.warning('Cloudinary not configured, using local preview');

        // Create a local blob URL for testing
        const localUrl = URL.createObjectURL(imageFile);
        return localUrl;
      }

      // Prepare form data for upload
      const formData = new FormData();
      formData.append('file', imageFile);

      if (uploadPreset) {
        formData.append('upload_preset', uploadPreset);
      }

      formData.append('folder', 'hotel-platform/menu-items');

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData,
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Cloudinary response error:', errorData);

        // If upload preset failed, provide helpful error and use local preview
        if (errorData.error?.message?.includes('Upload preset') || errorData.error?.message?.includes('API key')) {
          console.warn('⚠️ Upload preset or API key issue. Need to configure Cloudinary properly.');
          toast.error(`Cloudinary configuration issue: ${errorData.error?.message}. Using local preview.`);

          // Create a local blob URL for testing
          const localUrl = URL.createObjectURL(imageFile);
          toast.info('Using local preview. Please contact admin to configure Cloudinary upload preset.');
          return localUrl;
        }

        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      toast.success('Image uploaded successfully!');

      return data.secure_url;
    } catch (error) {
      console.error('❌ Error uploading image to Cloudinary:', error);

      // As fallback, always provide local preview
      if (imageFile) {
        toast.warning('Upload failed, using local preview');
        const localUrl = URL.createObjectURL(imageFile);
        return localUrl;
      }

      toast.error('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, imageUrl: '' }));
  };

  const addAllergen = () => {
    if (allergenInput.trim() && !formData.allergens.includes(allergenInput.trim())) {
      setFormData(prev => ({
        ...prev,
        allergens: [...prev.allergens, allergenInput.trim()]
      }));
      setAllergenInput('');
    }
  };

  const removeAllergen = (allergen) => {
    setFormData(prev => ({
      ...prev,
      allergens: prev.allergens.filter(a => a !== allergen)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setIsSaving(true);

    // Validation
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      setIsSaving(false);
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      setIsSaving(false);
      return;
    }

    let imageUrl = formData.imageUrl;

    // Upload image if a new file is selected
    if (imageFile) {
      toast.info('Uploading image...');

      const uploadedUrl = await uploadImageToCloudinary();

      if (!uploadedUrl) {
        toast.error('Failed to upload image. Please try again.');
        setIsSaving(false);
        return;
      }

      imageUrl = uploadedUrl;
    }

    const updatedItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime) || 15,
      imageUrl: imageUrl
    };

    try {
      const result = await onSave(updatedItem);

      // Only show success toast and reset if save was successful
      if (result !== false) {
        toast.success('Menu item updated successfully!');
        // Reset image states after successful save
        setImageFile(null);
        setImagePreview('');
      }
    } catch (error) {
      toast.error('Error saving changes');
    } finally {
      setIsSaving(false);
    }
  };  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h6 className="font-bold text-blue-800 flex items-center">
          <FaEdit className="mr-2" />
          {t('serviceProvider.restaurant.form.editMenuItem')}
        </h6>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceProvider.restaurant.form.itemNameRequired')}
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceProvider.restaurant.form.categoryRequired')}
            </label>
            <select
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              required
            >
              {categoryOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceProvider.restaurant.form.priceRequired')}
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
              required
            />
          </div>

          {/* Preparation Time */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceProvider.restaurant.form.prepTime')}
            </label>
            <input
              type="number"
              min="1"
              value={formData.preparationTime}
              onChange={(e) => handleInputChange('preparationTime', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Spicy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceProvider.restaurant.form.spicyLevel')}
            </label>
            <select
              value={formData.spicyLevel}
              onChange={(e) => handleInputChange('spicyLevel', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {spicyLevelOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('serviceProvider.restaurant.form.description')}
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            rows="2"
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Image Upload Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('serviceProvider.restaurant.form.menuItemImage')}
          </label>

          {/* Current Image or Preview */}
          {(imagePreview || formData.imageUrl) && (
            <div className="mb-3">
              <div className="relative inline-block">
                <img
                  src={imagePreview || formData.imageUrl}
                  alt="Menu item preview"
                  className="w-32 h-32 object-cover rounded-lg border-2 border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600 transition-colors"
                  title="Remove image"
                >
                  ×
                </button>
              </div>
            </div>
          )}

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <label className="relative cursor-pointer bg-blue-50 hover:bg-blue-100 border-2 border-dashed border-blue-300 rounded-lg px-4 py-3 text-center transition-colors">
              <input
                key={imageFile ? imageFile.name : 'file-input-' + Date.now()}
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-2 text-blue-600">
                <FaCamera className="text-lg" />
                <span className="text-sm font-medium">
                  {(imagePreview || formData.imageUrl) ? t('serviceProvider.restaurant.form.changeImage') : t('serviceProvider.restaurant.form.addImage')}
                </span>
              </div>
            </label>

            {uploadingImage && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">{t('serviceProvider.restaurant.form.uploading')}</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-1">
            {t('serviceProvider.restaurant.form.imageRecommendation')}
          </p>
        </div>

        {/* Dietary Options */}
        <div className="flex gap-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVegetarian}
              onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.form.vegetarian')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVegan}
              onChange={(e) => handleInputChange('isVegan', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.form.vegan')}</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">{t('serviceProvider.restaurant.form.available')}</span>
          </label>
        </div>

        {/* Allergens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('serviceProvider.restaurant.form.allergens')}
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={allergenInput}
              onChange={(e) => setAllergenInput(e.target.value)}
              placeholder={t('serviceProvider.restaurant.form.allergensPlaceholder')}
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={addAllergen}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              {t('serviceProvider.restaurant.form.addButton')}
            </button>
          </div>
          {formData.allergens.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {formData.allergens.map((allergen, index) => (
                <span
                  key={index}
                  className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center"
                >
                  {allergen}
                  <button
                    type="button"
                    onClick={() => removeAllergen(allergen)}
                    className="ml-1 text-red-600 hover:text-red-800"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('serviceProvider.restaurant.form.additionalNotes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows="2"
            placeholder={t('serviceProvider.restaurant.form.notesPlaceholder')}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={isSaving}
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              isSaving
                ? 'bg-blue-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {isSaving ? (
              <>
                <FaSpinner className="inline mr-1 animate-spin" />
                {t('serviceProvider.restaurant.form.saving')}
              </>
            ) : (
              <>
                <FaSave className="inline mr-1" />
                {t('serviceProvider.restaurant.form.saveChanges')}
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm font-medium disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            <FaTimes className="inline mr-1" />
            {t('serviceProvider.restaurant.form.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantServiceCreator;
