/**
 * Enhanced Transportation Service Management System
 *
 * Tabbed interface for complete transportation service management:
 * 1. Manage Items Tab - View, edit, and manage existing transportation services
 * 2. Add Items Tab - Create new transportation services with individual vehicle pricing
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
    car: "🚗",
    clock: "⏰",
    dollar: "💰",
    package: "📦",
    list: "📋",
    check: "✅",
    star: "⭐",
    toggle: "🔘",
    available: "✅",
    unavailable: "❌",
    taxi: "🚕",
    suv: "🚙",
    van: "🚐",
    luxury: "🏎️",
    eco: "🌱",
    wheelchair: "♿",
    info: "ℹ️"
  };

  return <span className={className}>{icons[type] || "❓"}</span>;
};

const TransportationServiceCreator = () => {
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

  // Individual transportation items with pricing and availability per service type
  const [transportationItems, setTransportationItems] = useState([]);
  const [availableVehicles, setAvailableVehicles] = useState([]);

  useEffect(() => {
    fetchCategoryTemplate();
    if (activeTab === 'manage') {
      fetchExistingServices();
    }
  }, [activeTab]);

  /**
   * Fetch existing transportation services for management
   */
  const fetchExistingServices = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/service/services?category=transportation');

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

      console.log('🚗 Transportation services:', services);
      setExistingServices(services);
    } catch (error) {
      console.error('Error fetching existing transportation services:', error);
      toast.error('Failed to load transportation services');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Toggle service availability
   */
  const toggleServiceAvailability = async (serviceId, currentStatus) => {
    try {
      await apiClient.patch(`/service/services/${serviceId}`, {
        isActive: !currentStatus
      });

      setExistingServices(prev =>
        prev.map(service =>
          service._id === serviceId
            ? { ...service, isActive: !currentStatus }
            : service
        )
      );

      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error toggling service availability:', error);
      toast.error('Failed to update service status');
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
      transportationItems: service.transportationItems || []
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
   * Save edited service
   */
  const saveEditedService = async (serviceId) => {
    try {
      setLoading(true);

      await apiClient.put(`/service/services/${serviceId}`, {
        name: editFormData.name,
        description: editFormData.description,
        transportationItems: editFormData.transportationItems,
        category: 'transportation'
      });

      toast.success('Service updated successfully');
      setEditingService(null);
      setEditFormData(null);
      fetchExistingServices();
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error(error.response?.data?.message || 'Failed to update service');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a service
   */
  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this transportation service?')) return;

    try {
      await apiClient.delete(`/service/services/${serviceId}`);
      setExistingServices(prev => prev.filter(service => service._id !== serviceId));
      toast.success('Transportation service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      toast.error('Failed to delete service');
    }
  };

  /**
   * Fetch transportation category template from backend
   */
  const fetchCategoryTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/service/category-templates/transportation');
      const template = response.data.data.template;
      setCategoryTemplate(template);
      setAvailableVehicles(template.vehicleTypes || []);
    } catch (error) {
      console.error('Error fetching category template:', error);
      toast.error('Failed to load transportation template');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add vehicle from dropdown selection
   */
  const addVehicleFromDropdown = (vehicleTypeId) => {
    if (!vehicleTypeId) return;

    const vehicleTemplate = availableVehicles.find(v => v.id === vehicleTypeId);
    if (!vehicleTemplate) return;

    // Check if vehicle already exists
    const exists = transportationItems.some(item => item.vehicleType === vehicleTypeId);
    if (exists) {
      toast.error('This vehicle type is already added');
      return;
    }

    // Create service types based on category template (quote-based, no pricing)
    const serviceTypes = categoryTemplate.serviceTypes.map(st => ({
      serviceTypeId: st.id,
      name: st.name,
      description: st.description,
      pricingModel: st.pricingModel,
      availability: {
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
        hours: { start: '06:00', end: '23:00' }
      },
      advanceBooking: {
        required: st.advanceRequired || false,
        minimumHours: st.minimumHours || 0,
        maximumDays: 30
      },
      isPopular: st.isPopular || false,
      isAvailable: true
    }));

    const newVehicleItem = {
      vehicleType: vehicleTypeId,
      name: vehicleTemplate.name,
      description: vehicleTemplate.description,
      capacity: vehicleTemplate.capacity,
      features: vehicleTemplate.features,
      isAvailable: true,
      serviceTypes: serviceTypes,
      notes: '',
      dateAdded: new Date()
    };

    setTransportationItems(prev => [...prev, newVehicleItem]);
    toast.success(`${vehicleTemplate.name} added successfully`);
  };

  /**
   * Remove transportation item
   */
  const removeTransportationItem = (index) => {
    setTransportationItems(prev => prev.filter((_, i) => i !== index));
  };

  /**
   * Toggle transportation item service type availability
   */
  const toggleItemServiceTypeAvailability = (itemIndex, serviceTypeId, isAvailable) => {
    setTransportationItems(prev => prev.map((item, index) =>
      index === itemIndex ? {
        ...item,
        serviceTypes: item.serviceTypes.map(st =>
          st.serviceTypeId === serviceTypeId ? { ...st, isAvailable } : st
        )
      } : item
    ));
  };

  /**
   * Form validation for quote-based transportation service
   */
  const validateForm = () => {
    if (!serviceDetails.name.trim()) {
      toast.error('Service name is required');
      return false;
    }

    if (!serviceDetails.description.trim()) {
      toast.error('Service description is required');
      return false;
    }

    if (transportationItems.length === 0) {
      toast.error('Please add at least one vehicle type');
      return false;
    }

    // Check if at least one vehicle has available service types
    const hasAvailableServices = transportationItems.some(item =>
      item.isAvailable && item.serviceTypes.some(st => st.isAvailable)
    );

    if (!hasAvailableServices) {
      toast.error('Please enable at least one service type for your vehicles');
      return false;
    }

    return true;
  };

  /**
   * Create the quote-based transportation service
   */
  const createService = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      const serviceData = {
        ...serviceDetails,
        category: 'transportation',
        subcategory: 'vehicle_based',
        serviceType: 'transportation_vehicles',
        transportationItems: transportationItems,
        pricing: {
          basePrice: 0, // Quote-based pricing
          pricingType: 'quote-based',
          currency: 'USD'
        },
        isActive: true
      };

      await apiClient.post('/service/categories/transportation/vehicles', serviceData);

      toast.success('Quote-based transportation service created successfully');

      // Reset form
      setServiceDetails({
        name: '',
        description: '',
        shortDescription: '',
        isActive: true
      });
      setTransportationItems([]);

      // Switch to manage tab to see the created service
      setActiveTab('manage');
      fetchExistingServices();

    } catch (error) {
      console.error('Error creating transportation service:', error);
      toast.error(error.response?.data?.message || 'Failed to create transportation service');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Get vehicle icon by type
   */
  const getVehicleIcon = (vehicleType) => {
    const iconMap = {
      'economy_sedan': 'car',
      'comfort_sedan': 'car',
      'premium_suv': 'suv',
      'luxury_vehicle': 'luxury',
      'eco_vehicle': 'eco',
      'accessible_vehicle': 'wheelchair',
      'van_large': 'van',
      'local_taxi': 'taxi',
      'shared_ride': 'car'
    };
    return iconMap[vehicleType] || 'car';
  };

  /**
   * Render Manage Items Tab
   */
  function renderManageItemsTab() {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Icon type="package" className="text-4xl mr-2" />
          <span>Loading transportation services...</span>
        </div>
      );
    }

    if (existingServices.length === 0) {
      return (
        <div className="text-center py-12">
          <Icon type="car" className="text-6xl text-gray-300 mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No Transportation Services Found</h3>
          <p className="text-gray-500 mb-6">You haven't created any transportation services yet.</p>
          <button
            onClick={() => setActiveTab('add')}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
          >
            <Icon type="plus" className="mr-2" />
            Create Transportation Service
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-2xl font-bold text-gray-900">Manage Transportation Services</h3>
          <button
            onClick={() => setActiveTab('add')}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Icon type="plus" className="mr-2" />
            Add New Service
          </button>
        </div>

        {existingServices.map(service => (
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

                <div className="flex gap-3">
                  <button
                    onClick={() => saveEditedService(service._id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    disabled={loading}
                  >
                    <Icon type="save" className="mr-1" />
                    {loading ? 'Saving...' : 'Save Changes'}
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
                      {service.transportationItems ? service.transportationItems.length : 0}
                    </div>
                    <div className="text-xs text-gray-600">Vehicle Types</div>
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
                    className={`px-3 py-2 text-white rounded text-sm ${
                      service.isActive
                        ? 'bg-orange-600 hover:bg-orange-700'
                        : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    <Icon type="toggle" className="mr-1" />
                    {service.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => deleteService(service._id)}
                    className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    <Icon type="trash" className="mr-1" />
                    Delete
                  </button>
                </div>

                {/* Vehicle Types Overview */}
                {service.transportationItems && service.transportationItems.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-800 mb-2">Available Vehicle Types:</h5>
                    <div className="flex flex-wrap gap-2">
                      {service.transportationItems.map((vehicle, idx) => (
                        <span key={idx} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          <Icon type={getVehicleIcon(vehicle.vehicleType)} className="mr-1" />
                          {vehicle.name}
                          <span className="ml-1 text-blue-600">
                            ({vehicle.capacity.passengers}p)
                          </span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  }

  /**
   * Render Add Items Tab
   */
  function renderAddItemsTab() {
    if (loading) {
      return (
        <div className="flex items-center justify-center p-8">
          <Icon type="package" className="text-4xl mr-2" />
          <span>Loading template...</span>
        </div>
      );
    }

    return (
      <div className="space-y-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-2xl font-bold text-gray-900 mb-6">Create Transportation Service</h3>

          {/* Service Details */}
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Name *
              </label>
              <input
                type="text"
                value={serviceDetails.name}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, name: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Premium Transportation Service"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={serviceDetails.description}
                onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                rows="3"
                placeholder="Describe your transportation services..."
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
                placeholder="Brief description for listings"
              />
            </div>
          </div>

          {/* Add Vehicle Types */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-lg font-semibold text-gray-800">Available Vehicle Types</h4>
              <div className="flex items-center space-x-4">
                <select
                  onChange={(e) => addVehicleFromDropdown(e.target.value)}
                  className="p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  value=""
                >
                  <option value="">Add Vehicle Type...</option>
                  {availableVehicles.map(vehicle => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.name} ({vehicle.capacity.passengers} passengers)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center mb-2">
                <Icon type="info" className="text-blue-500 mr-2" />
                <h5 className="font-medium text-blue-800">Quote-Based Transportation Service</h5>
              </div>
              <p className="text-sm text-blue-700">
                This transportation service operates on a quote-based system. Add the vehicle types you offer,
                and when guests request bookings, you'll create custom quotes based on their specific needs
                (distance, time, special requirements, etc.).
              </p>
            </div>

            {/* Added Transportation Items */}
            {transportationItems.length > 0 && (
              <div className="space-y-4">
                {transportationItems.map((vehicle, vehicleIndex) => (
                  <div key={vehicleIndex} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        <Icon type={getVehicleIcon(vehicle.vehicleType)} className="text-2xl mr-3" />
                        <div>
                          <h5 className="font-semibold text-gray-800">{vehicle.name}</h5>
                          <p className="text-sm text-gray-600">{vehicle.description}</p>
                          <p className="text-xs text-blue-600 mt-1">
                            Capacity: {vehicle.capacity.passengers} passengers, {vehicle.capacity.luggage} luggage
                          </p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {vehicle.features.map((feature, idx) => (
                              <span key={idx} className="inline-block bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                                {feature}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => removeTransportationItem(vehicleIndex)}
                        className="text-red-600 hover:text-red-800"
                        title="Remove Vehicle"
                      >
                        <Icon type="trash" className="text-xl" />
                      </button>
                    </div>

                    {/* Available Service Types */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {vehicle.serviceTypes.map((serviceType, stIndex) => (
                        <div key={stIndex} className="border border-gray-200 rounded p-3 bg-white">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{serviceType.name}</span>
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={serviceType.isAvailable}
                                onChange={(e) => toggleItemServiceTypeAvailability(vehicleIndex, serviceType.serviceTypeId, e.target.checked)}
                                className="form-checkbox h-4 w-4 text-blue-600"
                              />
                              <span className="ml-1 text-xs">Available</span>
                            </label>
                          </div>

                          <p className="text-xs text-gray-600 mb-2">{serviceType.description}</p>
                          <p className="text-xs text-blue-600">Model: {serviceType.pricingModel.replace('_', ' ')}</p>

                          {serviceType.isPopular && (
                            <div className="text-xs text-yellow-600 font-medium flex items-center mt-2">
                              <Icon type="star" className="mr-1" />
                              Popular Choice
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {transportationItems.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <Icon type="car" className="text-4xl text-gray-400 mb-2" />
                <p className="text-gray-600">No vehicle types added yet.</p>
                <p className="text-sm text-gray-500">Use the dropdown above to add vehicle types.</p>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              onClick={createService}
              disabled={loading || transportationItems.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              <Icon type="save" className="mr-2" />
              {loading ? 'Creating Quote-Based Service...' : 'Create Transportation Service'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Tab Navigation */}
      <div className="mb-8">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('manage')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'manage'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon type="list" className="mr-2" />
              Manage Transportation Services
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === 'add'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon type="plus" className="mr-2" />
              Add New Service
            </button>
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'manage' && renderManageItemsTab()}
      {activeTab === 'add' && renderAddItemsTab()}
    </div>
  );
};

export default TransportationServiceCreator;
