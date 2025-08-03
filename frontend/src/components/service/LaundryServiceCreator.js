/**
 * Enhanced Laundry Service Management System
 *
 * Tabbed interface for complete laundry service management:
 * 1. Manage Items Tab - View, edit, and manage existing laundry services
 * 2. Add Items Tab - Create new laundry services with individual item pricing
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';

// Icon component using emoji fallbacks
const Icon = ({ type, className = "" }) => {
  const icons = {
    plus: "➕",
    edit: "✏️",
    trash: "🗑️",
    save: "💾",
    times: "✕",
    tshirt: "👕",
    bolt: "⚡",
    clock: "⏰",
    soap: "🧼",
    package: "📦",
    list: "📋",
    check: "✅",
    star: "⭐",
    dollar: "💰",
    toggle: "🔘",
    available: "✅",
    unavailable: "❌"
  };

  return <span className={className}>{icons[type] || "❓"}</span>;
};

const LaundryServiceCreator = () => {
  // Tab Management
  const [activeTab, setActiveTab] = useState('manage');

  // Common state management
  const [loading, setLoading] = useState(false);
  const [categoryTemplate, setCategoryTemplate] = useState(null);

  // Manage Items Tab State
  const [existingServices, setExistingServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Add Items Tab State
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    shortDescription: '',
    isActive: true
  });

  // Individual laundry items with pricing and availability per service type
  const [laundryItems, setLaundryItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    fetchCategoryTemplate();
    if (activeTab === 'manage') {
      fetchExistingServices();
    }
  }, [activeTab]);  /**
   * Fetch existing laundry services for management
   */
  const fetchExistingServices = async () => {
    try {
      setLoading(true);
      // Use the correct endpoint for fetching services
      const response = await apiClient.get('/service/services?category=laundry');

      console.log('🔄 Full API Response:', response.data);

      // Extract services from the response
      let services = [];

      if (response.data.data?.services) {
        services = response.data.data.services;
      } else if (response.data.services) {
        services = response.data.services;
      } else if (Array.isArray(response.data.data)) {
        services = response.data.data;
      } else if (Array.isArray(response.data)) {
        services = response.data;
      }

      console.log('🔄 Extracted services:', services);
      console.log('🔄 Services count:', services.length);

      setExistingServices(services);
    } catch (error) {
      console.error('Error fetching existing services:', error);
      toast.error('Failed to load existing services');
      setExistingServices([]);
    } finally {
      setLoading(false);
    }
  };
  /**
   * Start editing an existing service
   */
  const startEditingService = (service) => {
    setEditingService(service._id);
    setEditFormData({
      name: service.name,
      description: service.description,
      shortDescription: service.shortDescription,
      isActive: service.isActive,
      laundryItems: service.laundryItems || []
    });
  };

  /**
   * Cancel editing
   */
  const cancelEditing = () => {
    setEditingService(null);
    setEditFormData(null);
  };
  /**
   * Update existing service
   */
  const updateExistingService = async (serviceId) => {
    try {
      setLoading(true);
      // Use the correct service endpoint
      await apiClient.put(`/service/services/${serviceId}`, editFormData);
      toast.success('Service updated successfully!');
      fetchExistingServices();
      cancelEditing();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error(error.response?.data?.message || 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete existing service
   */
  const deleteExistingService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // Try to delete, if endpoint doesn't exist, just deactivate
      try {
        await apiClient.delete(`/service/services/${serviceId}`);
        toast.success('Service deleted successfully!');
      } catch (deleteError) {
        // If delete endpoint doesn't exist, deactivate instead
        if (deleteError.response?.status === 404 || deleteError.response?.status === 405) {
          await apiClient.put(`/service/services/${serviceId}`, { isActive: false });
          toast.success('Service deactivated successfully!');
        } else {
          throw deleteError;
        }
      }
      fetchExistingServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error(error.response?.data?.message || 'Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle service availability
   */
  const toggleServiceAvailability = async (serviceId, currentStatus) => {
    try {
      setLoading(true);
      // Use the correct service endpoint
      await apiClient.put(`/service/services/${serviceId}`, {
        isActive: !currentStatus
      });
      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
      fetchExistingServices();
    } catch (error) {
      console.error('Error toggling service availability:', error);
      toast.error('Failed to update service availability');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Update pricing for specific item and service type in editing mode
   */
  const updateEditingItemPrice = (itemIndex, serviceTypeId, price) => {
    setEditFormData(prev => ({
      ...prev,
      laundryItems: prev.laundryItems.map((item, index) =>
        index === itemIndex ? {
          ...item,
          serviceTypes: item.serviceTypes.map(st =>
            st.serviceTypeId === serviceTypeId ? { ...st, price: parseFloat(price) || 0 } : st
          )
        } : item
      )
    }));
  };

  /**
   * Update availability for specific item and service type in editing mode
   */
  const updateEditingItemAvailability = (itemIndex, serviceTypeId, isAvailable) => {
    setEditFormData(prev => ({
      ...prev,
      laundryItems: prev.laundryItems.map((item, index) =>
        index === itemIndex ? {
          ...item,
          serviceTypes: item.serviceTypes.map(st =>
            st.serviceTypeId === serviceTypeId ? { ...st, isAvailable } : st
          )
        } : item
      )
    }));
  };  /**
   * Fetch laundry category template from backend
   */
  const fetchCategoryTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/service/category-templates/laundry');
      const template = response.data.data.template;
      setCategoryTemplate(template);
      setAvailableItems(template.items || []);
    } catch (error) {
      console.error('Error fetching category template:', error);
      toast.error('Failed to load laundry template');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add item from dropdown selection
   */
  const addItemFromDropdown = (itemName) => {
    if (!itemName) return;

    const templateItem = availableItems.find(item => item.name === itemName);
    if (!templateItem) return;

    // Check if item already exists
    if (laundryItems.find(item => item.name === templateItem.name)) {
      toast.warn('Item already added');
      return;
    }

    // Create new item with service types and default pricing
    const newItem = {
      name: templateItem.name,
      category: templateItem.category,
      icon: templateItem.icon,
      isAvailable: true,
      serviceTypes: categoryTemplate.serviceTypes.map(serviceType => ({
        serviceTypeId: serviceType.id,
        price: 0,
        isAvailable: true
      })),
      notes: ''
    };

    setLaundryItems(prev => [...prev, newItem]);
    toast.success(`${templateItem.name} added`);
  };

  /**
   * Remove item from service
   */
  const removeItem = (itemName) => {
    setLaundryItems(prev => prev.filter(item => item.name !== itemName));
    toast.info('Item removed');
  };

  /**
   * Update item availability
   */
  const updateItemAvailability = (itemName, isAvailable) => {
    setLaundryItems(prev => prev.map(item =>
      item.name === itemName ? { ...item, isAvailable } : item
    ));
  };

  /**
   * Update service type pricing for an item
   */
  const updateServiceTypePrice = (itemName, serviceTypeId, price) => {
    setLaundryItems(prev => prev.map(item =>
      item.name === itemName ? {
        ...item,
        serviceTypes: item.serviceTypes.map(st =>
          st.serviceTypeId === serviceTypeId ? { ...st, price: parseFloat(price) || 0 } : st
        )
      } : item
    ));
  };

  /**
   * Update service type availability for an item
   */
  const updateServiceTypeAvailability = (itemName, serviceTypeId, isAvailable) => {
    setLaundryItems(prev => prev.map(item =>
      item.name === itemName ? {
        ...item,
        serviceTypes: item.serviceTypes.map(st =>
          st.serviceTypeId === serviceTypeId ? { ...st, isAvailable } : st
        )
      } : item
    ));
  };

  /**
   * Update item notes
   */
  const updateItemNotes = (itemName, notes) => {
    setLaundryItems(prev => prev.map(item =>
      item.name === itemName ? { ...item, notes } : item
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

    if (laundryItems.length === 0) {
      toast.error('Please add at least one laundry item');
      return false;
    }

    // Check if at least one item has valid pricing
    const hasValidPricing = laundryItems.some(item =>
      item.isAvailable && item.serviceTypes.some(st => st.isAvailable && st.price > 0)
    );

    if (!hasValidPricing) {
      toast.error('Please set at least one available service type with a price greater than 0');
      return false;
    }

    return true;
  };

  /**
   * Create the laundry service with individual items
   */
  const createService = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const serviceData = {
        ...serviceDetails,
        category: 'laundry',
        subcategory: 'item_based',
        serviceType: 'laundry_items',
        laundryItems: laundryItems,
        pricing: {
          basePrice: 0, // Will be calculated dynamically based on cheapest item
          pricingType: 'per-item',
          currency: 'USD'
        },
        isActive: true
      };

      await apiClient.post('/service/categories/laundry/items', serviceData);

      toast.success('Laundry service created successfully!');

      // Reset form
      setServiceDetails({
        name: '',
        description: '',
        shortDescription: '',
        isActive: true
      });
      setLaundryItems([]);

    } catch (error) {
      console.error('Error creating laundry service:', error);
      toast.error(error.response?.data?.message || 'Failed to create laundry service');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get service type display name
   */
  const getServiceTypeName = (serviceTypeId) => {
    const serviceType = categoryTemplate?.serviceTypes?.find(st => st.id === serviceTypeId);
    return serviceType?.name || serviceTypeId;
  };
  if (loading && !categoryTemplate) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon type="package" className="text-4xl mr-2" />
        <span>Loading laundry template...</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          <Icon type="tshirt" className="mr-2" />
          Laundry Service Management
        </h2>
        <p className="text-gray-600">
          Manage your laundry services and add new items with individual pricing
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab('manage')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'manage'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Icon type="list" className="mr-2" />
          Manage Items
        </button>
        <button
          onClick={() => setActiveTab('add')}
          className={`px-6 py-3 font-medium text-sm border-b-2 transition-colors duration-200 ${
            activeTab === 'add'
              ? 'border-blue-500 text-blue-600 bg-blue-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Icon type="plus" className="mr-2" />
          Add Items
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'manage' ? renderManageItemsTab() : renderAddItemsTab()}
    </div>
  );

  /**
   * Render Manage Items Tab
   */
  function renderManageItemsTab() {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Icon type="package" className="text-4xl mr-2" />
          <span>Loading services...</span>
        </div>
      );
    }

    if (existingServices.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon type="tshirt" className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Found</h3>
          <p className="text-gray-500 mb-6">You haven't created any laundry services yet.</p>
          <button
            onClick={() => setActiveTab('add')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Icon type="plus" className="mr-2" />
            Create Your First Service
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Your Laundry Services ({existingServices.length})</h3>
          <button
            onClick={() => setActiveTab('add')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
          >
            <Icon type="plus" className="mr-2" />
            Add New Service
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

                  {/* Items Pricing Edit */}
                  {editFormData.laundryItems && editFormData.laundryItems.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">Items & Pricing</h4>
                      <div className="space-y-4 max-h-60 overflow-y-auto">
                        {editFormData.laundryItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="border border-gray-100 rounded-lg p-4">
                            <div className="flex items-center mb-3">
                              <span className="text-xl mr-2">{item.icon}</span>
                              <span className="font-medium">{item.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              {item.serviceTypes && item.serviceTypes.map((serviceType, stIndex) => (
                                <div key={stIndex} className="border border-gray-100 rounded p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium">{getServiceTypeName(serviceType.serviceTypeId)}</span>
                                    <input
                                      type="checkbox"
                                      checked={serviceType.isAvailable}
                                      onChange={(e) => updateEditingItemAvailability(itemIndex, serviceType.serviceTypeId, e.target.checked)}
                                      className="text-blue-600"
                                    />
                                  </div>
                                  {serviceType.isAvailable && (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={serviceType.price}
                                      onChange={(e) => updateEditingItemPrice(itemIndex, serviceType.serviceTypeId, e.target.value)}
                                      className="w-full p-1 text-sm border border-gray-300 rounded"
                                      placeholder="Price"
                                    />
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={() => updateExistingService(service._id)}
                      disabled={loading}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400"
                    >
                      <Icon type="save" className="mr-1" />
                      Save
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                      <Icon type="times" className="mr-1" />
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
                        {service.laundryItems ? service.laundryItems.length : 0}
                      </div>
                      <div className="text-xs text-gray-600">Items</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-semibold text-green-600">
                        {service.performance?.totalBookings || 0}
                      </div>
                      <div className="text-xs text-gray-600">Bookings</div>
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
                      <Icon type="edit" className="mr-1" />
                      Edit
                    </button>
                    <button
                      onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                      className={`px-3 py-2 rounded text-sm ${
                        service.isActive
                          ? 'bg-orange-600 text-white hover:bg-orange-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      <Icon type="toggle" className="mr-1" />
                      {service.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => deleteExistingService(service._id)}
                      className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                    >
                      <Icon type="trash" className="mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }
  /**
   * Render Add Items Tab (Original LaundryServiceCreator functionality)
   */
  function renderAddItemsTab() {
    return (
      <div className="space-y-8">
        {/* Service Details Form */}
        <div className="p-6 bg-gray-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">Service Information</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={serviceDetails.name}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Premium Laundry Service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Short Description
              </label>
              <input
                type="text"
                value={serviceDetails.shortDescription}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, shortDescription: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="Brief service description"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Description
            </label>
            <textarea
              value={serviceDetails.description}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Detailed description of your laundry service"
            />
          </div>
        </div>

        {/* Add Items Section */}
        <div className="p-6 bg-blue-50 rounded-lg">
          <h3 className="text-xl font-semibold mb-4">
            <Icon type="plus" className="mr-2" />
            Add Laundry Items
          </h3>

          <div className="flex items-center gap-4">
            <select
              onChange={(e) => addItemFromDropdown(e.target.value)}
              className="flex-1 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              value=""
            >
              <option value="">Select an item to add...</option>
              {availableItems.map((item, index) => (
                <option key={index} value={item.name}>
                  {item.icon} {item.name} ({item.category})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Items List */}
        {laundryItems.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">
              <Icon type="list" className="mr-2" />
              Your Laundry Items ({laundryItems.length})
            </h3>

            <div className="space-y-6">
              {laundryItems.map((item, itemIndex) => (
                <div key={itemIndex} className="p-6 border border-gray-200 rounded-lg bg-white">
                  {/* Item Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{item.icon}</span>
                      <div>
                        <h4 className="text-lg font-semibold">{item.name}</h4>
                        <p className="text-sm text-gray-500">Category: {item.category}</p>
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
                          <Icon type={item.isAvailable ? "available" : "unavailable"} className="mr-1" />
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </label>

                      <button
                        onClick={() => removeItem(item.name)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Icon type="trash" />
                      </button>
                    </div>
                  </div>

                  {/* Service Types Pricing */}
                  {item.isAvailable && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                      {item.serviceTypes.map((serviceType, stIndex) => {
                        const templateServiceType = categoryTemplate?.serviceTypes?.find(st => st.id === serviceType.serviceTypeId);
                        return (
                          <div key={stIndex} className="p-4 border border-gray-100 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <h5 className="font-medium text-sm">
                                {templateServiceType?.icon} {getServiceTypeName(serviceType.serviceTypeId)}
                              </h5>
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={serviceType.isAvailable}
                                  onChange={(e) => updateServiceTypeAvailability(item.name, serviceType.serviceTypeId, e.target.checked)}
                                  className="text-blue-600"
                                />
                              </label>
                            </div>

                            {serviceType.isAvailable && (
                              <div>
                                <label className="block text-xs text-gray-500 mb-1">Price ($)</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={serviceType.price}
                                  onChange={(e) => updateServiceTypePrice(item.name, serviceType.serviceTypeId, e.target.value)}
                                  className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                                  placeholder="0.00"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Item Notes */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Notes (optional)</label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.name, e.target.value)}
                      className="w-full p-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      placeholder="Special instructions or notes for this item"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Create Service Button */}
        <div className="flex justify-center">
          <button
            onClick={createService}
            disabled={loading || laundryItems.length === 0}
            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center"
          >
            <Icon type="save" className="mr-2" />
            {loading ? 'Creating Service...' : 'Create Laundry Service'}
          </button>
        </div>
      </div>    );
  }
};

export default LaundryServiceCreator;
