/**
 * Restaurant Service Creator Component — Modern Restyle
 * Allows service providers to create and manage restaurant services with menu items
 * - Brand: #3B5787 / #67BAE0
 * - Mobile-first, glass gradient header, modern cards
 * - Enhanced animations and modern UI components
 */

import React, { useState, useEffect } from 'react';
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
  FaArrowLeft
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

const RestaurantServiceCreator = ({ onBack }) => {
  // const { t } = useTranslation(); // Currently not used

  // Inject custom styles for modal animations
  useEffect(() => {
    const styleElement = document.createElement('style');
    styleElement.textContent = modalStyles;
    document.head.appendChild(styleElement);

    return () => {
      if (document.head.contains(styleElement)) {
        document.head.removeChild(styleElement);
      }
    };
  }, []);

  // Active tab management
  const [activeTab, setActiveTab] = useState('add');
  const [loading, setLoading] = useState(false);

  // Service creation state
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    cuisineType: '',
    mealTypes: []
  });

  // Menu items state
  const [menuItems, setMenuItems] = useState([]);

  // Menu item editing state
  const [editingItemIndex, setEditingItemIndex] = useState(null);

  // Management state
  const [existingServices, setExistingServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Service menu item editing state
  const [editingServiceMenuItem, setEditingServiceMenuItem] = useState(null);

  useEffect(() => {
    if (activeTab === 'manage') {
      fetchExistingServices();
    }
  }, [activeTab]);

  /**
   * Fetch existing restaurant services for management
   */
  const fetchExistingServices = async () => {
    try {
      setLoading(true);
      console.log('🔄 Fetching existing services...');

      const response = await apiClient.get('/service/services?category=dining');

      let services = [];
      if (response.data.data?.services) {
        services = response.data.data.services;
      } else if (Array.isArray(response.data.data)) {
        services = response.data.data;
      }

      setExistingServices(services);
      console.log('✅ Restaurant services loaded:', services.length, 'services');
    } catch (error) {
      console.error('❌ Error fetching restaurant services:', error);
      toast.error('Failed to load restaurant services');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add custom menu item created by service provider
   */
  const addCustomMenuItem = (customItem) => {
    // Check if item already exists
    if (menuItems.find(item => item.name === customItem.name)) {
      toast.warn('Menu item with this name already exists');
      return false;
    }

    setMenuItems(prev => [...prev, customItem]);
    toast.success(`${customItem.name} added to menu`);
    return true;
  };

  /**
   * Remove item from menu
   */
  const removeItem = (itemName) => {
    setMenuItems(prev => prev.filter(item => item.name !== itemName));
    toast.success('Menu item removed');
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
    console.log('🔄 Starting updateServiceMenuItem:', { serviceId, itemIndex, updatedItem });

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

      console.log('✅ Service found:', service.name);

      const updatedMenuItems = [...service.menuItems];
      updatedMenuItems[itemIndex] = updatedItem;

      console.log('🔄 Sending update request with:', {
        serviceId,
        menuItemsCount: updatedMenuItems.length,
        updatedItem
      });

      const response = await apiClient.put(`/service/services/${serviceId}`, {
        ...service,
        menuItems: updatedMenuItems
      });

      console.log('📥 Response received:', response.data);
      console.log('📥 Response status:', response.status);
      console.log('📥 Response data status:', response.data.status);

      if (response.data.status === 'success') {
        toast.success('✅ Menu item updated successfully!');
        console.log('✅ Update successful, refreshing services...');
        await fetchExistingServices(); // Refresh the services list
        console.log('✅ About to close edit form...');
        setEditingServiceMenuItem(null);
        console.log('✅ Edit form should be closed now');
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
      toast.error('Service name is required');
      return false;
    }

    if (menuItems.length === 0) {
      toast.error('Please add at least one menu item');
      return false;
    }

    const invalidItems = menuItems.filter(item => item.price <= 0);
    if (invalidItems.length > 0) {
      toast.error('All menu items must have a valid price');
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
          currency: 'USD'
        },
        specifications: {
          duration: {
            estimated: 30,
            unit: 'minutes'
          }
        },
        menuItems: menuItems.map(item => ({
          name: item.name,
          category: item.category,
          description: item.description,
          price: item.price,
          imageUrl: item.imageUrl, // Add the missing imageUrl field!
          isAvailable: item.isAvailable,
          allergens: item.allergens || [],
          spicyLevel: item.spicyLevel || 'mild',
          isVegetarian: item.isVegetarian || false,
          isVegan: item.isVegan || false,
          preparationTime: item.preparationTime || 15,
          notes: item.notes || ''
        })),
        isActive: true
      };

      const response = await apiClient.post('/service/services', serviceData);

      console.log('📥 Create restaurant service response:', response.data);

      if (response.data.status === 'success') {
        toast.success('✅ Restaurant service created successfully!');
        console.log('✅ Service created successfully, resetting form...');
        // Reset form
        setServiceDetails({ name: '', description: '', cuisineType: '', mealTypes: [] });
        setMenuItems([]);
        console.log('✅ Form reset, refreshing services list...');
        // Refresh the services list to show the new service
        await fetchExistingServices();
        console.log('✅ Services list refreshed, switching to manage tab...');
        // Switch to manage tab to see the created service
        setActiveTab('manage');
        console.log('✅ Switched to manage tab');
      } else {
        throw new Error(response.data.message || 'Failed to create service');
      }
    } catch (error) {
      console.error('Error creating restaurant service:', error);
      toast.error(error.response?.data?.message || error.message || 'Failed to create restaurant service');
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
    console.log('🔄 Starting to edit service:', service);
    console.log('🔄 Edit form data set to:', {
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

      console.log('🔄 Saving edited service:', { serviceId, editFormData });

      const response = await apiClient.put(`/service/services/${serviceId}`, editFormData);

      console.log('📥 Save response:', response.data);

      if (response.data.status === 'success') {
        toast.success('Restaurant service updated successfully!');
        setEditingService(null);
        setEditFormData({});
        await fetchExistingServices();
        console.log('✅ Service updated and form closed');
      } else {
        throw new Error(response.data.message || 'Failed to update service');
      }
    } catch (error) {
      console.error('Error updating restaurant service:', error);
      toast.error(error.response?.data?.message || 'Failed to update restaurant service');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle service availability
   */
  const toggleServiceAvailability = async (serviceId, currentStatus) => {
    try {
      console.log('🔄 Toggling service availability:', { serviceId, currentStatus });

      const response = await apiClient.patch(`/service/services/${serviceId}/toggle-availability`);

      console.log('📥 Toggle response:', response.data);

      if (response.data.status === 'success') {
        toast.success(`Service ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        await fetchExistingServices();
        console.log('✅ Service availability toggled successfully');
      } else {
        throw new Error(response.data.message || 'Failed to toggle service availability');
      }
    } catch (error) {
      console.error('Error toggling service availability:', error);
      toast.error('Failed to update service availability');
    }
  };

  /**
   * Delete a service
   */
  const handleDeleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      console.log('🔄 Deleting service:', serviceId);

      const response = await apiClient.delete(`/service/services/${serviceId}`);

      console.log('📥 Delete response:', response.data);

      if (response.data.status === 'success') {
        toast.success('Service deleted successfully');
        console.log('✅ Service deleted, refreshing services...');
        await fetchExistingServices();
        console.log('✅ Services list refreshed');
      } else {
        throw new Error(response.data.message || 'Failed to delete service');
      }
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  /**
   * Get translated category name
   */
  const getCategoryName = (category) => {
    const categoryNames = {
      breakfast: 'Breakfast',
      mains: 'Main Courses',
      appetizers: 'Appetizers',
      desserts: 'Desserts',
      beverages: 'Beverages'
    };
    return categoryNames[category] || category;
  };

  /**
   * Render Add Items Tab
   */
  const renderAddItemsTab = () => {
    return (
      <div className="space-y-8">
        {/* Service Details Section */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div className="p-2 rounded-lg bg-blue-500 mr-3">
              <FaUtensils className="text-white text-sm" />
            </div>
            Restaurant Service Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Service Name *
              </label>
              <input
                type="text"
                value={serviceDetails.name}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, name: e.target.value }))}
                className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
                placeholder="e.g., Downtown Restaurant, Rooftop Dining"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-bold text-gray-700">
                Cuisine Type
              </label>
              <select
                value={serviceDetails.cuisineType}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, cuisineType: e.target.value }))}
                className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
              >
                <option value="">Select Cuisine Type</option>
                <option value="local">Local Cuisine</option>
                <option value="italian">Italian</option>
                <option value="chinese">Chinese</option>
                <option value="indian">Indian</option>
                <option value="mexican">Mexican</option>
                <option value="japanese">Japanese</option>
                <option value="american">American</option>
                <option value="mediterranean">Mediterranean</option>
                <option value="international">International</option>
              </select>
            </div>
          </div>

          <div className="space-y-2 mt-6">
            <label className="block text-sm font-bold text-gray-700">
              Service Description
            </label>
            <textarea
              value={serviceDetails.description}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
              className={INPUT + " resize-none transition-all duration-300 focus:scale-[1.02]"}
              rows="4"
              placeholder="Describe your restaurant service, specialties, dining experience..."
            />
          </div>
        </div>

        {/* Add Custom Menu Items Section */}
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div className="p-2 rounded-lg bg-green-500 mr-3">
              <FaPlus className="text-white text-sm" />
            </div>
            Add Custom Menu Item
          </h3>

          <CustomMenuItemForm onAddItem={addCustomMenuItem} />
        </div>

        {/* Menu Items List */}
        {menuItems.length > 0 && (
          <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <div className="p-2 rounded-lg bg-purple-500 mr-3">
                <FaListUl className="text-white text-sm" />
              </div>
              Your Menu Items ({menuItems.length})
            </h3>

            <div className="space-y-6">
              {menuItems.map((item, itemIndex) => (
                <div key={itemIndex} className={CARD + " group hover:scale-[1.02] transition-all duration-300 relative"}>
                  {/* Background Pattern */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-[#67BAE0]/10 to-transparent rounded-bl-full"></div>

                  {editingItemIndex === itemIndex ? (
                    // Edit Mode
                    <EditMenuItemForm
                      item={item}
                      onSave={(updatedItem) => updateMenuItem(itemIndex, updatedItem)}
                      onCancel={cancelEditingItem}
                    />
                  ) : (
                    // View Mode
                    <>
                      {/* Item Header */}
                      <div className="relative z-10 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white p-6">
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
                                {item.icon}
                              </div>
                            )}
                            <div>
                              <h4 className="text-xl font-bold">{item.name}</h4>
                              <p className="text-blue-100 text-sm">
                                {getCategoryName(item.category)} • ${item.price} • {item.preparationTime || 15} min
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
                                    Available
                                  </>
                                ) : (
                                  <>
                                    <FaEyeSlash className="inline mr-1" />
                                    Unavailable
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
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Description</h5>
                            <p className="text-gray-600 leading-relaxed">{item.description}</p>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                          <div className="bg-blue-50 rounded-lg p-3">
                            <div className="text-sm font-bold text-gray-700 mb-1">Price</div>
                            <div className="text-lg font-bold text-blue-600">${item.price}</div>
                          </div>
                          <div className="bg-green-50 rounded-lg p-3">
                            <div className="text-sm font-bold text-gray-700 mb-1">Prep Time</div>
                            <div className="text-lg font-bold text-green-600">{item.preparationTime || 15} min</div>
                          </div>
                          <div className="bg-orange-50 rounded-lg p-3">
                            <div className="text-sm font-bold text-gray-700 mb-1">Spicy Level</div>
                            <div className="text-lg font-bold text-orange-600 capitalize">{item.spicyLevel || 'mild'}</div>
                          </div>
                          <div className="bg-purple-50 rounded-lg p-3">
                            <div className="text-sm font-bold text-gray-700 mb-1">Category</div>
                            <div className="text-lg font-bold text-purple-600">{getCategoryName(item.category)}</div>
                          </div>
                        </div>

                        {/* Dietary Info */}
                        <div className="flex flex-wrap gap-3 mb-4">
                          {item.isVegetarian && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              🌱 Vegetarian
                            </span>
                          )}
                          {item.isVegan && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                              🥬 Vegan
                            </span>
                          )}
                          {item.spicyLevel && item.spicyLevel !== 'mild' && (
                            <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm font-semibold">
                              🌶️ {item.spicyLevel.charAt(0).toUpperCase() + item.spicyLevel.slice(1)}
                            </span>
                          )}
                        </div>

                        {/* Allergens */}
                        {item.allergens && item.allergens.length > 0 && (
                          <div className="mb-4">
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Allergens</h5>
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
                            <h5 className="text-sm font-bold text-gray-700 mb-2">Additional Notes</h5>
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
          >
            {loading ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Creating Service...
              </>
            ) : (
              <>
                <FaSave className="mr-2" />
                Create Restaurant Service
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
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Restaurant Services</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading available restaurant services...</p>
            </div>
          </div>
          <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
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
            <h3 className="text-2xl font-bold text-gray-800 mb-3">No Restaurant Services Found</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">You haven't created any restaurant services yet. Start by adding your first service to showcase your culinary offerings.</p>
            <button
              onClick={() => setActiveTab('add')}
              className={BTN.primary + " px-8 py-4 text-lg"}
            >
              <FaPlus className="mr-2" />
              Create Your First Service
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl p-6 border border-orange-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
            <div className="p-2 rounded-lg bg-orange-500 mr-3">
              <FaCog className="text-white text-sm" />
            </div>
            Manage Restaurant Services
          </h3>

          <div className="space-y-6">
            {existingServices.map((service) => (
              <div key={service._id} className={CARD + " group hover:scale-[1.01] transition-all duration-300"}>
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                          <div className="space-y-2">
                            <label className="block text-sm font-bold text-gray-700">Cuisine Type</label>
                            <select
                              value={editFormData.cuisineType || ''}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, cuisineType: e.target.value }))}
                              className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
                            >
                              <option value="">Select Cuisine Type</option>
                              <option value="local">Local Cuisine</option>
                              <option value="italian">Italian</option>
                              <option value="chinese">Chinese</option>
                              <option value="indian">Indian</option>
                              <option value="mexican">Mexican</option>
                              <option value="japanese">Japanese</option>
                              <option value="american">American</option>
                              <option value="mediterranean">Mediterranean</option>
                              <option value="international">International</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-2 mt-6">
                          <label className="block text-sm font-bold text-gray-700">Service Description</label>
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
                                  />
                                ) : (
                                  // View Mode
                                  <>
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center">
                                        <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center mr-3 overflow-hidden">
                                          {item.imageUrl ? (
                                            <img
                                              src={item.imageUrl}
                                              alt={item.name}
                                              className="w-full h-full object-cover rounded-lg"
                                              onError={(e) => {
                                                e.target.style.display = 'none';
                                                e.target.nextSibling.style.display = 'block';
                                              }}
                                            />
                                          ) : null}
                                          <span
                                            className={item.imageUrl ? 'hidden' : 'text-lg'}
                                            style={{ display: item.imageUrl ? 'none' : 'block' }}
                                          >
                                            {item.icon || '🍽️'}
                                          </span>
                                        </div>
                                        <div>
                                          <h5 className="font-semibold text-gray-800">{item.name}</h5>
                                          <p className="text-sm text-gray-600">
                                            ${item.price} • {item.preparationTime || 15} min
                                            {item.category && ` • ${item.category}`}
                                          </p>
                                        </div>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <button
                                          onClick={() => startEditingServiceMenuItem(service._id, index)}
                                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                          title="Edit menu item"
                                        >
                                          <FaEdit />
                                        </button>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                          item.isAvailable !== false ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                          {item.isAvailable !== false ? 'Available' : 'Unavailable'}
                                        </span>
                                        {item.isVegetarian && (
                                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                                            🌱 Veg
                                          </span>
                                        )}
                                        {item.spicyLevel && item.spicyLevel !== 'mild' && (
                                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">
                                            🌶️ {item.spicyLevel}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                    {item.description && (
                                      <p className="text-sm text-gray-600 mt-2 ml-15">{item.description}</p>
                                    )}
                                    {item.allergens && item.allergens.length > 0 && (
                                      <div className="mt-2 ml-15">
                                        <span className="text-xs text-gray-500">Allergens: </span>
                                        {item.allergens.map((allergen, idx) => (
                                          <span key={idx} className="inline-block px-1 py-0.5 bg-red-50 text-red-700 rounded text-xs mr-1">
                                            {allergen}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                    {item.notes && (
                                      <div className="mt-2 ml-15">
                                        <span className="text-xs text-gray-500">Notes: </span>
                                        <span className="text-xs text-gray-600 italic">{item.notes}</span>
                                      </div>
                                    )}
                                  </>
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
                  // Enhanced View Mode
                  <div className="relative">
                    {/* Service Header */}
                    <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mr-4">
                            <FaUtensils className="text-2xl" />
                          </div>
                          <div>
                            <h4 className="text-2xl font-bold">{service.name}</h4>
                            <p className="text-blue-100 text-sm mt-1">
                              {service.cuisineType ? `${service.cuisineType.charAt(0).toUpperCase() + service.cuisineType.slice(1)} Cuisine` : 'Restaurant Service'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className={`px-4 py-2 rounded-full text-sm font-semibold ${
                            service.isActive
                              ? 'bg-green-500 text-white'
                              : 'bg-red-500 text-white'
                          }`}>
                            {service.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Service Content */}
                    <div className="p-6">
                      {/* Description */}
                      <div className="mb-6">
                        <h5 className="text-sm font-bold text-gray-700 mb-2">Description</h5>
                        <p className="text-gray-600 leading-relaxed">{service.description || 'No description provided'}</p>
                      </div>

                      {/* Service Details Grid */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-blue-50 rounded-xl p-4">
                          <div className="flex items-center mb-2">
                            <div className="p-2 rounded-lg bg-blue-500 mr-3">
                              <FaListUl className="text-white text-sm" />
                            </div>
                            <h6 className="font-bold text-gray-800">Menu Items</h6>
                          </div>
                          <p className="text-2xl font-bold text-blue-600">
                            {service.menuItems ? service.menuItems.length : 0}
                          </p>
                          <p className="text-sm text-gray-600">Available items</p>
                        </div>

                        <div className="bg-green-50 rounded-xl p-4">
                          <div className="flex items-center mb-2">
                            <div className="p-2 rounded-lg bg-green-500 mr-3">
                              <FaUtensils className="text-white text-sm" />
                            </div>
                            <h6 className="font-bold text-gray-800">Orders</h6>
                          </div>
                          <p className="text-2xl font-bold text-green-600">0</p>
                          <p className="text-sm text-gray-600">Total orders</p>
                        </div>

                        <div className="bg-purple-50 rounded-xl p-4">
                          <div className="flex items-center mb-2">
                            <div className="p-2 rounded-lg bg-purple-500 mr-3">
                              <span className="text-white text-sm">$</span>
                            </div>
                            <h6 className="font-bold text-gray-800">Revenue</h6>
                          </div>
                          <p className="text-2xl font-bold text-purple-600">$0</p>
                          <p className="text-sm text-gray-600">Total earned</p>
                        </div>
                      </div>

                      {/* Service Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <h6 className="text-sm font-bold text-gray-700 mb-2">Category</h6>
                          <span className="inline-block px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
                            {service.category || 'Dining'}
                          </span>
                        </div>
                        <div>
                          <h6 className="text-sm font-bold text-gray-700 mb-2">Created</h6>
                          <p className="text-sm text-gray-600">
                            {service.createdAt ? new Date(service.createdAt).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <button
                          onClick={() => startEditingService(service)}
                          className={BTN.secondary + " flex-1"}
                        >
                          <FaEdit className="mr-2" />
                          Edit Service
                        </button>
                        <button
                          onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                          className={`flex-1 ${service.isActive ? BTN.danger : BTN.primary}`}
                        >
                          {service.isActive ? (
                            <>
                              <FaEyeSlash className="mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <FaEye className="mr-2" />
                              Activate
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteService(service._id)}
                          className="px-4 py-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
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
                      Restaurant Services
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-white/60 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-lg text-blue-100 max-w-2xl">
              Create and manage your restaurant services and menu items for hotel guests
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
                Add Restaurant Service
              </button>
              <button
                onClick={() => setActiveTab('manage')}
                className={`${BTN.tab} ${
                  activeTab === 'manage' ? BTN.tabActive : BTN.tabInactive
                }`}
              >
                <FaCog className="mr-2" />
                Manage Services
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'add' && renderAddItemsTab()}
            {activeTab === 'manage' && renderManageItemsTab()}
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
const CustomMenuItemForm = ({ onAddItem }) => {
  const [formData, setFormData] = useState({
    name: '',
    category: 'mains',
    description: '',
    price: '',
    icon: '🍽️',
    imageUrl: '',
    preparationTime: '15',
    isVegetarian: false,
    isVegan: false,
    spicyLevel: 'mild',
    allergens: [],
    notes: ''
  });

  const [allergenInput, setAllergenInput] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const iconOptions = [
    '🍽️', '🍕', '🍔', '🍗', '🥩', '🐟', '🍝', '🥗', '🍜', '🍲', '🥙', '🌮', '🍣', '🍤', '🍰', '🧁', '🍪', '☕', '🥤', '🍷', '🥘', '🍛', '🍱'
  ];

  const spicyLevelOptions = [
    { value: 'mild', label: 'Mild' },
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
  };

  const uploadImageToCloudinary = async () => {
    if (!imageFile) return null;

    console.log('🔴 Starting uploadImageToCloudinary');
    console.log('🔴 imageFile:', imageFile);

    try {
      setUploadingImage(true);

      // Check if Cloudinary is properly configured
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;
      const apiKey = process.env.REACT_APP_CLOUDINARY_API_KEY;

      console.log('🔴 Environment variables:', {
        cloudName,
        uploadPreset,
        hasApiKey: !!apiKey
      });

      if (!cloudName || cloudName === 'hotel-platform-demo' || cloudName === 'your_cloud_name_here') {
        console.warn('🔴 Cloudinary not configured properly. Using local preview for testing.');
        toast.warning('Cloudinary not configured, using local preview');

        // Create a local blob URL for testing
        const localUrl = URL.createObjectURL(imageFile);
        console.log('🔴 Created local URL:', localUrl);
        return localUrl;
      }

      // Try upload with preset first
      const formData = new FormData();
      formData.append('file', imageFile);

      if (uploadPreset) {
        formData.append('upload_preset', uploadPreset);
      }

      formData.append('folder', 'hotel-platform/menu-items');

      console.log('🔴 Uploading to Cloudinary:', { cloudName, uploadPreset: uploadPreset || 'none' });

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
        {
          method: 'POST',
          body: formData
        }
      );

      console.log('🔴 Upload response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('🔴 Cloudinary response error:', errorData);

        // If upload preset failed, provide helpful error and use local preview
        if (errorData.error?.message?.includes('Upload preset')) {
          console.warn('🔴 Upload preset not found. Need to create it in Cloudinary dashboard.');
          toast.error(`Upload preset "${uploadPreset}" not found. Please create it in your Cloudinary dashboard or contact admin.`);

          // Create a local blob URL for testing
          const localUrl = URL.createObjectURL(imageFile);
          console.log('🔴 Created local URL for fallback:', localUrl);
          toast.info('Using local preview for now. Image will be saved when upload preset is configured.');
          return localUrl;
        }

        throw new Error(`Upload failed: ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('🔴 Cloudinary upload success:', data.secure_url);
      toast.success('Image uploaded successfully to Cloudinary!');
      return data.secure_url;
    } catch (error) {
      console.error('🔴 Error uploading image:', error);

      // As fallback, always provide local preview
      if (imageFile) {
        console.log('🔴 Creating local preview as fallback');
        toast.warning('Upload failed, using local preview');
        const localUrl = URL.createObjectURL(imageFile);
        return localUrl;
      }

      toast.error(`Failed to upload image: ${error.message}`);
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

    console.log('🟡 handleSubmit called');
    console.log('🟡 imageFile:', imageFile);
    console.log('🟡 formData.imageUrl:', formData.imageUrl);

    // Validation
    if (!formData.name.trim()) {
      toast.error('Item name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    let imageUrl = formData.imageUrl;

    // Upload image if selected
    if (imageFile) {
      console.log('🟡 Starting image upload...');
      toast.info('Uploading image...');
      imageUrl = await uploadImageToCloudinary();
      console.log('🟡 Upload result:', imageUrl);
      if (!imageUrl) {
        toast.error('Failed to upload image. Please try again.');
        return;
      }
    } else {
      console.log('🟡 No image file selected');
    }

    const newItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime),
      isAvailable: true,
      imageUrl: imageUrl || formData.imageUrl
    };

    console.log('🟡 Final menu item to add:', newItem);

    const success = onAddItem(newItem);
    if (success) {
      // Reset form
      setFormData({
        name: '',
        category: 'mains',
        description: '',
        price: '',
        icon: '🍽️',
        imageUrl: '',
        preparationTime: '15',
        isVegetarian: false,
        isVegan: false,
        spicyLevel: 'mild',
        allergens: [],
        notes: ''
      });
      setAllergenInput('');
      setImageFile(null);
      setImagePreview('');
    }
  };  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Item Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            placeholder="e.g., Grilled Chicken Breast"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category *
          </label>
          <select
            value={formData.category}
            onChange={(e) => handleInputChange('category', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Price (USD) *
          </label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => handleInputChange('price', e.target.value)}
            placeholder="0.00"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Icon */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Icon (if no image)
          </label>
          <select
            value={formData.icon}
            onChange={(e) => handleInputChange('icon', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            disabled={imagePreview || formData.imageUrl}
          >
            {iconOptions.map(icon => (
              <option key={icon} value={icon}>
                {icon} {icon}
              </option>
            ))}
          </select>
        </div>

        {/* Preparation Time */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Preparation Time (minutes)
          </label>
          <input
            type="number"
            min="1"
            value={formData.preparationTime}
            onChange={(e) => handleInputChange('preparationTime', e.target.value)}
            placeholder="15"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Spicy Level */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Spicy Level
          </label>
          <select
            value={formData.spicyLevel}
            onChange={(e) => handleInputChange('spicyLevel', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            {spicyLevelOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Image Upload Section */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Menu Item Image
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
                <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm text-gray-600 mb-1">
                <span className="font-medium text-blue-600 hover:text-blue-500">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500">PNG, JPG, JPEG up to 5MB</p>
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
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              {imageFile ? 'New image selected' : 'Current image'}
            </p>
          </div>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Description
        </label>
        <textarea
          value={formData.description}
          onChange={(e) => handleInputChange('description', e.target.value)}
          placeholder="Describe the dish, ingredients, cooking method..."
          rows="3"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
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
          <span className="text-sm text-gray-700">Vegetarian</span>
        </label>
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isVegan}
            onChange={(e) => handleInputChange('isVegan', e.target.checked)}
            className="mr-2"
          />
          <span className="text-sm text-gray-700">Vegan</span>
        </label>
      </div>

      {/* Allergens */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Allergens
        </label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={allergenInput}
            onChange={(e) => setAllergenInput(e.target.value)}
            placeholder="e.g., nuts, dairy, gluten"
            className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={addAllergen}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
          >
            Add
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
          Additional Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(e) => handleInputChange('notes', e.target.value)}
          placeholder="Special preparation instructions, serving suggestions..."
          rows="2"
          className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={uploadingImage}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploadingImage ? (
            <>
              <FaSpinner className="animate-spin mr-2" />
              Uploading Image...
            </>
          ) : (
            <>
              <FaPlus className="mr-2" />
              Add Menu Item
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
const EditMenuItemForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    category: item.category || 'mains',
    description: item.description || '',
    price: item.price || '',
    icon: item.icon || '🍽️',
    imageUrl: item.imageUrl || '',
    preparationTime: item.preparationTime || 15,
    isVegetarian: item.isVegetarian || false,
    isVegan: item.isVegan || false,
    spicyLevel: item.spicyLevel || 'mild',
    allergens: item.allergens || [],
    notes: item.notes || '',
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
  });

  const [allergenInput, setAllergenInput] = useState('');

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

  const iconOptions = [
    '🍽️', '🍕', '🍔', '🍗', '🥩', '🐟', '🍝', '🥗', '🍜', '🍲', '🥙', '🌮', '🍣', '🍤', '🍰', '🧁', '🍪', '☕', '🥤', '🍷', '🥘', '🍛', '🍱'
  ];

  const spicyLevelOptions = [
    { value: 'mild', label: 'Mild' },
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
      toast.error('Item name is required');
      return;
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('Valid price is required');
      return;
    }

    const updatedItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime),
    };

    onSave(updatedItem);
    toast.success('Menu item updated successfully');
  };

  return (
    <div className="relative z-10">
      {/* Edit Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-500 text-white p-6">
        <h4 className="text-xl font-bold flex items-center">
          <FaEdit className="mr-3" />
          Edit Menu Item
        </h4>
      </div>

      {/* Edit Form */}
      <div className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="bg-blue-50 rounded-xl p-6">
            <h5 className="font-bold text-gray-800 mb-4">Basic Information</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Item Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Item Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="e.g., Grilled Chicken Breast"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleInputChange('price', e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Icon (if no image)
                </label>
                <select
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {iconOptions.map(icon => (
                    <option key={icon} value={icon}>
                      {icon} {icon}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preparation Time */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preparation Time (minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.preparationTime}
                  onChange={(e) => handleInputChange('preparationTime', e.target.value)}
                  placeholder="15"
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Spicy Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Spicy Level
                </label>
                <select
                  value={formData.spicyLevel}
                  onChange={(e) => handleInputChange('spicyLevel', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  {spicyLevelOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe the dish, ingredients, cooking method..."
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Dietary Options */}
          <div className="bg-green-50 rounded-xl p-6">
            <h5 className="font-bold text-gray-800 mb-4">Dietary Options</h5>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVegetarian}
                  onChange={(e) => handleInputChange('isVegetarian', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Vegetarian</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={formData.isVegan}
                  onChange={(e) => handleInputChange('isVegan', e.target.checked)}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Vegan</span>
              </label>
            </div>
          </div>

          {/* Allergens */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Allergens
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={allergenInput}
                onChange={(e) => setAllergenInput(e.target.value)}
                placeholder="e.g., nuts, dairy, gluten"
                className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={addAllergen}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Add
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
              Additional Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Special preparation instructions, serving suggestions..."
              rows="2"
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
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
const ServiceMenuItemEditForm = ({ item, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: item.name || '',
    category: item.category || 'mains',
    description: item.description || '',
    price: item.price || '',
    icon: item.icon || '🍽️',
    imageUrl: item.imageUrl || '',
    preparationTime: item.preparationTime || 15,
    isVegetarian: item.isVegetarian || false,
    isVegan: item.isVegan || false,
    spicyLevel: item.spicyLevel || 'mild',
    allergens: item.allergens || [],
    notes: item.notes || '',
    isAvailable: item.isAvailable !== undefined ? item.isAvailable : true
  });

  const [allergenInput, setAllergenInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

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

  const iconOptions = [
    '🍽️', '🍕', '🍔', '🍗', '🥩', '🐟', '🍝', '🥗', '🍜', '🍲', '🥙', '🌮', '🍣', '🍤', '🍰', '🧁', '🍪', '☕', '🥤', '🍷'
  ];

  const spicyLevelOptions = [
    { value: 'mild', label: 'Mild' },
    { value: 'medium', label: 'Medium' },
    { value: 'hot', label: 'Hot' },
    { value: 'very_hot', label: 'Very Hot' }
  ];

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Image handling functions
  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
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
    if (!imageFile) return null;

    try {
      setUploadingImage(true);
      const formData = new FormData();
      formData.append('file', imageFile);
      formData.append('upload_preset', 'hotel-services');

      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dwa8at7tv/image/upload',
        {
          method: 'POST',
          body: formData,
        }
      );

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
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

    console.log('🔄 Form submitted with data:', formData);
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

    // Upload image if selected
    if (imageFile) {
      console.log('🟡 Starting image upload...');
      toast.info('Uploading image...');
      imageUrl = await uploadImageToCloudinary();
      console.log('🟡 Upload result:', imageUrl);
      if (!imageUrl) {
        toast.error('Failed to upload image. Please try again.');
        setIsSaving(false);
        return;
      }
    }

    const updatedItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime) || 15,
      imageUrl: imageUrl || formData.imageUrl
    };

    console.log('✅ Validation passed, calling onSave with:', updatedItem);

    try {
      console.log('🔄 About to call onSave...');
      await onSave(updatedItem);
      console.log('✅ onSave completed successfully');
      toast.success('Menu item saved!');
    } catch (error) {
      console.error('❌ Error in onSave:', error);
      toast.error('Error saving changes');
    } finally {
      console.log('🔄 Setting isSaving to false');
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-blue-50 rounded-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h6 className="font-bold text-blue-800 flex items-center">
          <FaEdit className="mr-2" />
          Edit Menu Item
        </h6>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Basic Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Item Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Item Name *
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
              Category *
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
              Price (USD) *
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
              Prep Time (min)
            </label>
            <input
              type="number"
              min="1"
              value={formData.preparationTime}
              onChange={(e) => handleInputChange('preparationTime', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Icon */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Icon
            </label>
            <select
              value={formData.icon}
              onChange={(e) => handleInputChange('icon', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            >
              {iconOptions.map(icon => (
                <option key={icon} value={icon}>
                  {icon} {icon}
                </option>
              ))}
            </select>
          </div>

          {/* Spicy Level */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spicy Level
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
            Description
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
            Menu Item Image
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
                type="file"
                accept="image/*"
                onChange={handleImageSelect}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <div className="flex items-center gap-2 text-blue-600">
                <FaCamera className="text-lg" />
                <span className="text-sm font-medium">
                  {(imagePreview || formData.imageUrl) ? 'Change Image' : 'Add Image'}
                </span>
              </div>
            </label>

            {uploadingImage && (
              <div className="flex items-center gap-2 text-blue-600">
                <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                <span className="text-sm">Uploading...</span>
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500 mt-1">
            Recommended: 400x400px, max 5MB (JPG, PNG, WebP)
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
            <span className="text-sm text-gray-700">Vegetarian</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isVegan}
              onChange={(e) => handleInputChange('isVegan', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Vegan</span>
          </label>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.isAvailable}
              onChange={(e) => handleInputChange('isAvailable', e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-700">Available</span>
          </label>
        </div>

        {/* Allergens */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Allergens
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={allergenInput}
              onChange={(e) => setAllergenInput(e.target.value)}
              placeholder="Add allergen"
              className="flex-1 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="button"
              onClick={addAllergen}
              className="px-3 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              Add
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
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            rows="2"
            placeholder="Special instructions..."
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
                Saving...
              </>
            ) : (
              <>
                <FaSave className="inline mr-1" />
                Save Changes
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
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default RestaurantServiceCreator;
