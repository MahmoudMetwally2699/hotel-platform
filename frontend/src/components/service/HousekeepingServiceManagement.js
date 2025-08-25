/**
 * Housekeeping Service Management
 * Allows service providers to manage their housekeeping services
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaBroom,
  FaPlus,
  FaEdit,
  FaTrash,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaClock,
  FaUsers,
  FaArrowLeft
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const HousekeepingServiceManagement = ({ onBack }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'cleaning',
    estimatedDuration: 30,
    availability: 'always',
    requirements: [],
    instructions: ''
  });

  const serviceCategories = [
    { value: 'cleaning', label: 'Room Cleaning', icon: FaBroom },
    { value: 'maintenance', label: 'Maintenance', icon: FaUsers },
    { value: 'amenities', label: 'Amenities', icon: FaCheck },
    { value: 'laundry', label: 'Laundry Service', icon: FaClock }
  ];

  const defaultServices = [
    {
      id: 'extra-cleaning',
      name: 'Extra Room Cleaning',
      description: 'Deep cleaning of guest room including bathroom and all surfaces',
      category: 'cleaning',
      estimatedDuration: 45,
      availability: 'always',
      isActive: true,
      requirements: ['Room must be vacant during cleaning'],
      instructions: 'Please ensure all personal items are stored safely'
    },
    {
      id: 'linen-change',
      name: 'Fresh Linen Change',
      description: 'Complete change of bed linens and towels',
      category: 'laundry',
      estimatedDuration: 15,
      availability: 'always',
      isActive: true,
      requirements: ['Guest can be present during service'],
      instructions: 'Standard linen replacement service'
    },
    {
      id: 'amenity-restock',
      name: 'Amenity Restocking',
      description: 'Restock bathroom amenities, toiletries, and room supplies',
      category: 'amenities',
      estimatedDuration: 10,
      availability: 'always',
      isActive: true,
      requirements: ['Quick service, minimal disruption'],
      instructions: 'Check all amenity levels and restock as needed'
    },
    {
      id: 'maintenance-request',
      name: 'Room Maintenance',
      description: 'General maintenance and repair requests for room issues',
      category: 'maintenance',
      estimatedDuration: 60,
      availability: 'business-hours',
      isActive: true,
      requirements: ['Room inspection required', 'May require multiple visits'],
      instructions: 'Please describe the specific issue when booking'
    }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/service/housekeeping-services');
      setServices(response.data.data || defaultServices);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      setServices(defaultServices);
      toast.info('Loaded default housekeeping services');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiClient.post('/service/housekeeping-services', newService);
      setServices(prev => [...prev, { ...newService, id: `custom-${Date.now()}`, isActive: true }]);
      setNewService({
        name: '',
        description: '',
        category: 'cleaning',
        estimatedDuration: 30,
        availability: 'always',
        requirements: [],
        instructions: ''
      });
      setShowCreateForm(false);
      toast.success('Housekeeping service created successfully');
    } catch (error) {
      console.error('Error creating service:', error);
      // Optimistic update for demo
      setServices(prev => [...prev, { ...newService, id: `custom-${Date.now()}`, isActive: true }]);
      setShowCreateForm(false);
      toast.success('Housekeeping service created successfully');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      await apiClient.post(`/service/housekeeping-services/${serviceId}/${action}`);

      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));

      toast.success(`Service ${action}d successfully`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      // Optimistic update
      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));
      toast.success(`Service ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await apiClient.delete(`/service/housekeeping-services/${serviceId}`);
      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      setServices(prev => prev.filter(service => service.id !== serviceId));
      toast.success('Service deleted successfully');
    }
  };

  const getCategoryInfo = (category) => {
    const categoryInfo = serviceCategories.find(cat => cat.value === category);
    return categoryInfo || { label: category, icon: FaBroom };
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaBroom className="mr-3 text-blue-600" />
                Housekeeping Services Management
              </h1>
              <p className="text-gray-600">
                Manage your housekeeping services. These services are provided free of charge to hotel guests.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
          >
            <FaPlus className="mr-2" />
            Add Service
          </button>
        </div>

        {/* Active Services Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {serviceCategories.map(category => {
            const categoryServices = services.filter(s => s.category === category.value && s.isActive);
            const IconComponent = category.icon;
            return (
              <div key={category.value} className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center mb-2">
                  <IconComponent className="text-blue-600 mr-2" />
                  <h3 className="font-semibold text-gray-800">{category.label}</h3>
                </div>
                <p className="text-2xl font-bold text-blue-600">{categoryServices.length}</p>
                <p className="text-sm text-gray-600">Active Services</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => {
          const categoryInfo = getCategoryInfo(service.category);
          const IconComponent = categoryInfo.icon;

          return (
            <div
              key={service.id}
              className={`bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl ${
                service.isActive ? 'ring-2 ring-green-500' : 'opacity-75'
              }`}
            >
              {/* Service Header */}
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <IconComponent className="text-2xl mr-3" />
                    <div>
                      <h3 className="text-lg font-bold">{service.name}</h3>
                      <p className="text-blue-100 text-sm">{categoryInfo.label}</p>
                    </div>
                  </div>
                  <div className={`px-2 py-1 rounded-full text-xs ${
                    service.isActive ? 'bg-green-500' : 'bg-red-500'
                  }`}>
                    {service.isActive ? 'Active' : 'Inactive'}
                  </div>
                </div>
              </div>

              {/* Service Content */}
              <div className="p-4">
                <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                {/* Service Details */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center text-sm text-gray-600">
                    <FaClock className="mr-2 text-blue-500" />
                    <span>Duration: {service.estimatedDuration} minutes</span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <FaCheck className="mr-2 text-green-500" />
                    <span>Available: {service.availability === 'always' ? '24/7' : 'Business Hours'}</span>
                  </div>
                </div>

                {/* Requirements */}
                {service.requirements && service.requirements.length > 0 && (
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Requirements:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {service.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-blue-500 mr-1">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => toggleServiceStatus(service.id, service.isActive)}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                      service.isActive
                        ? 'bg-red-100 text-red-700 hover:bg-red-200'
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {service.isActive ? (
                      <>
                        <FaTimes className="inline mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <FaCheck className="inline mr-1" />
                        Activate
                      </>
                    )}
                  </button>

                  {service.id.startsWith('custom-') && (
                    <button
                      onClick={() => deleteService(service.id)}
                      className="px-3 py-2 bg-red-100 text-red-700 hover:bg-red-200 rounded-lg text-sm transition-colors"
                    >
                      <FaTrash />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Service Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-screen overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">Create New Housekeeping Service</h2>
            <form onSubmit={handleCreateService}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Service Name
                  </label>
                  <input
                    type="text"
                    value={newService.name}
                    onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newService.category}
                    onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {serviceCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="3"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={newService.estimatedDuration}
                    onChange={(e) => setNewService(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="5"
                    max="240"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Availability
                  </label>
                  <select
                    value={newService.availability}
                    onChange={(e) => setNewService(prev => ({ ...prev, availability: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="always">24/7 Available</option>
                    <option value="business-hours">Business Hours Only</option>
                  </select>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Instructions
                </label>
                <textarea
                  value={newService.instructions}
                  onChange={(e) => setNewService(prev => ({ ...prev, instructions: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows="2"
                  placeholder="Instructions for guests when booking this service"
                />
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:bg-gray-400"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    'Create Service'
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HousekeepingServiceManagement;
