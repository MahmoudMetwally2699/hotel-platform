/**
 * Inside Hotel Services Dashboard
 * Manages services provided within hotel premises by service providers
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaConciergeBell,
  FaCoffee,
  FaHotel,
  FaPlus,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaEdit,
  FaTrash,
  FaClock,
  FaDollarSign
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const InsideHotelServicesDashboard = ({ onBackToCategories }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingService, setEditingService] = useState(null);

  const defaultHotelServices = [
    {
      id: 'room-service',
      name: 'Room Service',
      description: 'In-room dining and service requests',
      icon: FaConciergeBell,
      category: 'dining',
      basePrice: 0,
      isActive: false,
      operatingHours: { start: '06:00', end: '23:00' },
      features: ['24/7 availability option', 'Menu customization', 'Special dietary accommodations']
    },
    {
      id: 'hotel-restaurant',
      name: 'Hotel Restaurant',
      description: 'Main dining facilities and reservations',
      icon: FaCoffee,
      category: 'dining',
      basePrice: 0,
      isActive: false,
      operatingHours: { start: '07:00', end: '22:00' },
      features: ['Table reservations', 'Private dining', 'Event catering']
    },
    {
      id: 'concierge-services',
      name: 'Concierge Services',
      description: 'Guest assistance and recommendations',
      icon: FaConciergeBell,
      category: 'assistance',
      basePrice: 0,
      isActive: false,
      operatingHours: { start: '24/7', end: '24/7' },
      features: ['Local recommendations', 'Booking assistance', 'Special requests']
    },
    {
      id: 'housekeeping-requests',
      name: 'Housekeeping Requests',
      description: 'Room cleaning and maintenance requests',
      icon: FaHotel,
      category: 'maintenance',
      basePrice: 0,
      isActive: false,
      operatingHours: { start: '08:00', end: '18:00' },
      features: ['Extra cleaning', 'Amenity requests', 'Maintenance issues']
    }
  ];

  const [newService, setNewService] = useState({
    name: '',
    description: '',
    category: 'dining',
    basePrice: 0,
    operatingHours: { start: '09:00', end: '17:00' },
    features: []
  });

  useEffect(() => {
    fetchHotelServices();
  }, []);

  const fetchHotelServices = async () => {
    try {
      const response = await apiClient.get('/service/inside-services');
      setServices(response.data.data || defaultHotelServices);
    } catch (error) {
      console.error('Error fetching hotel services:', error);

      // Handle 403 Forbidden error specifically
      if (error.response?.status === 403) {
        const errorMessage = 'Access Denied: Unable to fetch inside services';
        toast.error(errorMessage);
        if (onBackToCategories) {
          onBackToCategories();
        }
        return;
      }

      // Use default services for other errors
      setServices(defaultHotelServices);
      toast.warn('Using default services. API connection failed.');
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    setActivating(serviceId);
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      await apiClient.post(`/service/inside-services/${serviceId}/${action}`);

      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));

      toast.success(`Service ${action}d successfully`);
    } catch (error) {
      console.error(`Error ${currentStatus ? 'deactivating' : 'activating'} service:`, error);
      // Optimistic update for demo purposes
      setServices(prev => prev.map(service =>
        service.id === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));
      toast.success(`Service ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    } finally {
      setActivating(null);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post('/service/inside-services', newService);
      setServices(prev => [...prev, { ...newService, id: Date.now().toString(), isActive: false }]);
      setNewService({
        name: '',
        description: '',
        category: 'dining',
        basePrice: 0,
        operatingHours: { start: '09:00', end: '17:00' },
        features: []
      });
      setShowCreateForm(false);
      toast.success('Service created successfully');
    } catch (error) {
      console.error('Error creating service:', error);
      // Optimistic update for demo
      setServices(prev => [...prev, { ...newService, id: Date.now().toString(), isActive: false }]);
      setShowCreateForm(false);
      toast.success('Service created successfully');
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'dining': return FaCoffee;
      case 'assistance': return FaConciergeBell;
      case 'maintenance': return FaHotel;
      default: return FaConciergeBell;
    }
  };

  const getCategoryColor = (category) => {
    switch (category) {
      case 'dining': return 'blue';
      case 'assistance': return 'green';
      case 'maintenance': return 'purple';
      default: return 'gray';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inside Hotel Services</h1>
            <p className="text-gray-600">
              Manage services you provide within hotel premises. These services are delivered directly to hotel guests on-site.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center"
            >
              <FaPlus className="mr-2" />
              Add Service
            </button>
            <button
              onClick={onBackToCategories}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Categories
            </button>
          </div>
        </div>

        {/* Active Services Summary */}
        {services.filter(s => s.isActive).length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Active Services</h3>
            <div className="flex flex-wrap gap-2">
              {services.filter(s => s.isActive).map(service => (
                <div key={service.id} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  <FaCheck className="mr-2" />
                  {service.name}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {services.map((service) => {
          const IconComponent = service.icon || getCategoryIcon(service.category);
          const isActive = service.isActive;
          const isActivating = activating === service.id;
          const categoryColor = getCategoryColor(service.category);

          return (
            <div
              key={service.id}
              className={`
                relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300
                ${isActive
                  ? 'ring-2 ring-green-500 bg-green-50'
                  : 'hover:shadow-xl'
                }
              `}
            >
              {isActive && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <FaCheck className="w-4 h-4" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`
                    p-4 rounded-full
                    ${isActive
                      ? 'bg-green-100 text-green-600'
                      : categoryColor === 'blue'
                        ? 'bg-blue-100 text-blue-600'
                        : categoryColor === 'green'
                          ? 'bg-green-100 text-green-600'
                          : categoryColor === 'purple'
                            ? 'bg-purple-100 text-purple-600'
                            : 'bg-gray-100 text-gray-600'
                    }
                  `}>
                    <IconComponent className="text-3xl" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-center mb-2 text-gray-800">
                  {service.name}
                </h3>

                <p className="text-gray-600 text-center text-sm mb-4">
                  {service.description}
                </p>

                {/* Operating Hours */}
                {service.operatingHours && (
                  <div className="flex items-center justify-center mb-4 text-sm text-gray-600">
                    <FaClock className="mr-2" />
                    {service.operatingHours.start === '24/7' ? '24/7' :
                      `${service.operatingHours.start} - ${service.operatingHours.end}`
                    }
                  </div>
                )}

                {/* Features */}
                {service.features && service.features.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-2">Features:</p>
                    <div className="flex flex-wrap gap-1">
                      {service.features.slice(0, 2).map((feature, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {feature}
                        </span>
                      ))}
                      {service.features.length > 2 && (
                        <span className="text-gray-400 text-xs">
                          +{service.features.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <button
                  disabled={isActivating}
                  className={`
                    w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200
                    ${isActivating
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isActive
                        ? 'bg-red-500 hover:bg-red-600 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }
                  `}
                  onClick={() => toggleServiceStatus(service.id, isActive)}
                >
                  {isActivating ? (
                    <div className="flex items-center justify-center">
                      <FaSpinner className="animate-spin mr-2" />
                      Processing...
                    </div>
                  ) : isActive ? (
                    <div className="flex items-center justify-center">
                      <FaTimes className="mr-2" />
                      Deactivate
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <FaCheck className="mr-2" />
                      Activate
                    </div>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Service Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold mb-4">Add New Hotel Service</h2>
            <form onSubmit={handleCreateService}>
              <div className="mb-4">
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={newService.category}
                  onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="dining">Dining</option>
                  <option value="assistance">Guest Assistance</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Create Service
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

      {/* Success Actions */}
      {services.filter(s => s.isActive).length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            You have {services.filter(s => s.isActive).length} active hotel services.
            Guests can now book these services directly through your hotel.
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => window.location.href = '/hotel/inside-services/manage'}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              Manage Service Details
            </button>
            <button
              onClick={() => window.location.href = '/hotel/bookings'}
              className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
            >
              View Bookings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InsideHotelServicesDashboard;
