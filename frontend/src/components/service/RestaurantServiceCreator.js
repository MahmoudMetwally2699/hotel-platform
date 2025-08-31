/**
 * Restaurant Service Creator Component
 *
 * Similar to LaundryServiceCreator but for restaurant services
 * Allows service providers to create and manage restaurant services with menu items
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FaUtensils,
  FaPlus,
  FaMinus,
  FaTrash,
  FaEdit,
  FaSave,
  FaTimes,
  FaEye,
  FaEyeSlash,
  FaSpinner,
  FaListUl,
  FaCog
} from 'react-icons/fa';
import apiClient from '../../services/api.service';

const RestaurantServiceCreator = () => {
  const { t } = useTranslation();

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

  // Management state
  const [existingServices, setExistingServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState({});

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
      const response = await apiClient.get('/service/services?category=dining');

      let services = [];
      if (response.data.data?.services) {
        services = response.data.data.services;
      } else if (Array.isArray(response.data.data)) {
        services = response.data.data;
      }

      setExistingServices(services);
      console.log('Restaurant services loaded:', services);
    } catch (error) {
      console.error('Error fetching restaurant services:', error);
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
   * Update item price
   */
  const updateItemPrice = (itemName, price) => {
    setMenuItems(prev => prev.map(item =>
      item.name === itemName ? { ...item, price: parseFloat(price) || 0 } : item
    ));
  };

  /**
   * Update item availability
   */
  const updateItemAvailability = (itemName, isAvailable) => {
    setMenuItems(prev => prev.map(item =>
      item.name === itemName ? { ...item, isAvailable } : item
    ));
  };

  /**
   * Update item details
   */
  const updateItemDetails = (itemName, field, value) => {
    setMenuItems(prev => prev.map(item =>
      item.name === itemName ? { ...item, [field]: value } : item
    ));
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

      if (response.data.success) {
        toast.success('Restaurant service created successfully!');
        // Reset form
        setServiceDetails({ name: '', description: '', cuisineType: '', mealTypes: [] });
        setMenuItems([]);
        // Switch to manage tab to see the created service
        setActiveTab('manage');
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

      if (response.data.success) {
        toast.success('Restaurant service updated successfully!');
        setEditingService(null);
        setEditFormData({});
        fetchExistingServices();
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
      const response = await apiClient.patch(`/service/services/${serviceId}/toggle-availability`);

      if (response.data.success) {
        toast.success(`Service ${currentStatus ? 'deactivated' : 'activated'} successfully`);
        fetchExistingServices();
      }
    } catch (error) {
      console.error('Error toggling service availability:', error);
      toast.error('Failed to update service availability');
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
      <div className="space-y-6">
        {/* Service Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-4">
            <FaUtensils className="inline mr-2" />
            Restaurant Service Details
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={serviceDetails.name}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Downtown Restaurant, Rooftop Dining"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cuisine Type
              </label>
              <select
                value={serviceDetails.cuisineType}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, cuisineType: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
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

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Service Description
            </label>
            <textarea
              value={serviceDetails.description}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe your restaurant service, specialties, dining experience..."
            />
          </div>
        </div>

        {/* Add Custom Menu Items Section */}
        <div className="p-6 bg-blue-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            <FaPlus className="inline mr-2" />
            Add Custom Menu Item
          </h3>

          <CustomMenuItemForm onAddItem={addCustomMenuItem} />
        </div>

        {/* Menu Items List */}
        {menuItems.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              <FaListUl className="inline mr-2" />
              Your Menu Items ({menuItems.length})
            </h3>

            <div className="space-y-6">
              {menuItems.map((item, itemIndex) => (
                <div key={itemIndex} className="p-6 border border-gray-200 rounded-lg bg-white">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <div>
                        <h4 className="text-lg font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-500">Category: {getCategoryName(item.category)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Item Availability Toggle */}
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={(e) => updateItemAvailability(item.name, e.target.checked)}
                          className="mr-2"
                        />
                        <span className={`text-sm ${item.isAvailable ? 'text-green-600' : 'text-red-600'}`}>
                          {item.isAvailable ? <FaEye className="inline mr-1" /> : <FaEyeSlash className="inline mr-1" />}
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </label>

                      <button
                        onClick={() => removeItem(item.name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>

                  {/* Item Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price (USD) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.price}
                        onChange={(e) => updateItemPrice(item.name, e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preparation Time (minutes)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={item.preparationTime}
                        onChange={(e) => updateItemDetails(item.name, 'preparationTime', parseInt(e.target.value) || 15)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        placeholder="15"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={item.description}
                        onChange={(e) => updateItemDetails(item.name, 'description', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows="2"
                        placeholder="Describe the dish, ingredients, cooking method..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Spicy Level
                      </label>
                      <select
                        value={item.spicyLevel}
                        onChange={(e) => updateItemDetails(item.name, 'spicyLevel', e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="mild">Mild</option>
                        <option value="medium">Medium</option>
                        <option value="hot">Hot</option>
                        <option value="very_hot">Very Hot</option>
                      </select>
                    </div>

                    <div className="flex items-center gap-4 pt-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isVegetarian}
                          onChange={(e) => updateItemDetails(item.name, 'isVegetarian', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Vegetarian</span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.isVegan}
                          onChange={(e) => updateItemDetails(item.name, 'isVegan', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm">Vegan</span>
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-center">
          <button
            onClick={submitService}
            disabled={loading || menuItems.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            {loading ? <FaSpinner className="animate-spin mr-2" /> : <FaSave className="mr-2" />}
            {loading ? 'Creating Service...' : 'Create Restaurant Service'}
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
        <div className="flex items-center justify-center p-8">
          <FaSpinner className="text-4xl mr-2 animate-spin" />
          <span>Loading services...</span>
        </div>
      );
    }

    if (existingServices.length === 0) {
      return (
        <div className="text-center py-12">
          <FaUtensils className="text-6xl text-gray-300 mb-4 mx-auto" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Restaurant Services Found</h3>
          <p className="text-gray-500 mb-6">You haven't created any restaurant services yet.</p>
          <button
            onClick={() => setActiveTab('add')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <FaPlus className="mr-2" />
            Create Your First Service
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-xl font-semibold mb-6">Manage Restaurant Services</h3>

          <div className="space-y-6">
            {existingServices.map((service) => (
              <div key={service._id} className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
                {editingService === service._id ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Service Name</label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        value={editFormData.description}
                        onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        rows="3"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEditedService(service._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <FaSave className="mr-1" />
                        Save
                      </button>
                      <button
                        onClick={cancelEditing}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                      >
                        <FaTimes className="mr-1" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="text-lg font-semibold text-gray-800">{service.name}</h4>
                        <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          service.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    {/* Service Statistics */}
                    <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="text-lg font-semibold text-blue-600">
                          {service.menuItems ? service.menuItems.length : 0}
                        </div>
                        <div className="text-xs text-gray-600">Menu Items</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-green-600">
                          {service.performance?.totalBookings || 0}
                        </div>
                        <div className="text-xs text-gray-600">Orders</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-semibold text-purple-600">
                          ${service.performance?.totalRevenue || 0}
                        </div>
                        <div className="text-xs text-gray-600">Revenue</div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditingService(service)}
                        className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        <FaEdit className="mr-1" />
                        Edit
                      </button>
                      <button
                        onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                        className={`px-3 py-2 rounded text-sm ${
                          service.isActive
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'bg-green-600 text-white hover:bg-green-700'
                        }`}
                      >
                        {service.isActive ? <FaEyeSlash className="mr-1" /> : <FaEye className="mr-1" />}
                        {service.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          <FaUtensils className="inline mr-3 text-orange-600" />
          Restaurant Service Management
        </h1>
        <p className="text-gray-600">
          Create and manage your restaurant services and menu items
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab('add')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaPlus className="inline mr-2" />
              Add Restaurant Service
            </button>
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-4 border-b-2 font-medium text-sm ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <FaCog className="inline mr-2" />
              Manage Services
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'add' && renderAddItemsTab()}
          {activeTab === 'manage' && renderManageItemsTab()}
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
    preparationTime: '15',
    isVegetarian: false,
    isVegan: false,
    spicyLevel: 'mild',
    allergens: [],
    notes: ''
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

  const handleSubmit = (e) => {
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

    const newItem = {
      ...formData,
      price: parseFloat(formData.price),
      preparationTime: parseInt(formData.preparationTime),
      isAvailable: true
    };

    const success = onAddItem(newItem);
    if (success) {
      // Reset form
      setFormData({
        name: '',
        category: 'mains',
        description: '',
        price: '',
        icon: '🍽️',
        preparationTime: '15',
        isVegetarian: false,
        isVegan: false,
        spicyLevel: 'mild',
        allergens: [],
        notes: ''
      });
      setAllergenInput('');
    }
  };

  return (
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
            Icon
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
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:ring-2 focus:ring-blue-500"
        >
          <FaPlus className="mr-2" />
          Add Menu Item
        </button>
      </div>
    </form>
  );
};

export default RestaurantServiceCreator;
