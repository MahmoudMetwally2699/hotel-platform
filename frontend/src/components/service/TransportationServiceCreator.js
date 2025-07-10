import React, { useState, useEffect } from 'react';
import api from '../../services/api.service';

/**
 * Transportation Service Creator Component
 * Allows service providers to create transportation services dynamically
 */
const TransportationServiceCreator = () => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    vehicleType: '',
    capacity: '',
    serviceType: '',
    priceStructure: 'flat', // flat, hourly, distance
    hourlyRate: '',
    perKmRate: '',
    minimumCharge: '',
    features: [],
    availableHours: {
      start: '',
      end: ''
    },
    bookingAdvanceHours: 24
  });

  // Load transportation templates and existing services
  useEffect(() => {
    loadTemplates();
    loadServices();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/service/category-templates/transportation');
      setTemplates(response.data.template);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/service/services-by-category/transportation');
      setServices(response.data.services || []);
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else if (name === 'features') {
      setFormData(prev => ({
        ...prev,
        features: checked
          ? [...prev.features, value]
          : prev.features.filter(f => f !== value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      basePrice: '',
      vehicleType: '',
      capacity: '',
      serviceType: '',
      priceStructure: 'flat',
      hourlyRate: '',
      perKmRate: '',
      minimumCharge: '',
      features: [],
      availableHours: {
        start: '',
        end: ''
      },
      bookingAdvanceHours: 24
    });
    setActiveForm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare service combinations based on price structure
      const serviceCombinations = [];

      if (formData.priceStructure === 'flat') {
        serviceCombinations.push({
          name: formData.name,
          basePrice: parseFloat(formData.basePrice),
          attributes: {
            vehicleType: formData.vehicleType,
            capacity: parseInt(formData.capacity),
            serviceType: formData.serviceType,
            features: formData.features
          }
        });
      } else if (formData.priceStructure === 'hourly') {
        serviceCombinations.push({
          name: `${formData.name} (Hourly)`,
          basePrice: parseFloat(formData.hourlyRate),
          priceType: 'per_hour',
          minimumCharge: parseFloat(formData.minimumCharge) || 0,
          attributes: {
            vehicleType: formData.vehicleType,
            capacity: parseInt(formData.capacity),
            serviceType: formData.serviceType,
            features: formData.features
          }
        });
      } else if (formData.priceStructure === 'distance') {
        serviceCombinations.push({
          name: `${formData.name} (Per KM)`,
          basePrice: parseFloat(formData.perKmRate),
          priceType: 'per_km',
          minimumCharge: parseFloat(formData.minimumCharge) || 0,
          attributes: {
            vehicleType: formData.vehicleType,
            capacity: parseInt(formData.capacity),
            serviceType: formData.serviceType,
            features: formData.features
          }
        });
      }

      const serviceData = {
        category: 'transportation',
        name: formData.name,
        description: formData.description,
        serviceCombinations,
        availability: {
          hours: formData.availableHours,
          advanceBookingHours: parseInt(formData.bookingAdvanceHours)
        },
        settings: {
          vehicleType: formData.vehicleType,
          capacity: parseInt(formData.capacity),
          serviceType: formData.serviceType,
          priceStructure: formData.priceStructure
        }
      };

      await api.post('/service/create-service', serviceData);

      // Reload services and reset form
      await loadServices();
      resetForm();
      alert('Transportation service created successfully!');
    } catch (error) {
      console.error('Error creating service:', error);
      alert('Error creating service. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteService = async (serviceId) => {
    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      await api.delete(`/service/services/${serviceId}`);
      await loadServices();
    } catch (error) {
      console.error('Error deleting service:', error);
      alert('Error deleting service. Please try again.');
    }
  };

  if (!templates) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Transportation Services</h2>
        <button
          onClick={() => setActiveForm('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Service
        </button>
      </div>

      {/* Create/Edit Form */}
      {activeForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create Transportation Service</h3>
            <button
              onClick={resetForm}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Airport Transfer, City Tour"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Type *
                </label>
                <select
                  name="serviceType"
                  value={formData.serviceType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service type</option>
                  {templates.serviceTypes?.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vehicle Type *
                </label>
                <select
                  name="vehicleType"
                  value={formData.vehicleType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select vehicle type</option>
                  {templates.vehicleTypes?.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity (Number of passengers) *
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleInputChange}
                  required
                  min="1"
                  max="50"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your transportation service..."
              />
            </div>

            {/* Pricing Structure */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pricing Structure *
              </label>
              <div className="space-y-2">
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priceStructure"
                      value="flat"
                      checked={formData.priceStructure === 'flat'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Flat Rate (Fixed price)
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priceStructure"
                      value="hourly"
                      checked={formData.priceStructure === 'hourly'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Hourly Rate
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priceStructure"
                      value="distance"
                      checked={formData.priceStructure === 'distance'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Distance-based (Per KM)
                  </label>
                </div>
              </div>
            </div>

            {/* Price Fields based on structure */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {formData.priceStructure === 'flat' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Base Price *
                  </label>
                  <input
                    type="number"
                    name="basePrice"
                    value={formData.basePrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              {formData.priceStructure === 'hourly' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate *
                    </label>
                    <input
                      type="number"
                      name="hourlyRate"
                      value={formData.hourlyRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Charge
                    </label>
                    <input
                      type="number"
                      name="minimumCharge"
                      value={formData.minimumCharge}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}

              {formData.priceStructure === 'distance' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rate per KM *
                    </label>
                    <input
                      type="number"
                      name="perKmRate"
                      value={formData.perKmRate}
                      onChange={handleInputChange}
                      required
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Minimum Charge
                    </label>
                    <input
                      type="number"
                      name="minimumCharge"
                      value={formData.minimumCharge}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Features */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Features (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {templates.features?.map((feature, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      name="features"
                      value={feature}
                      checked={formData.features.includes(feature)}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    {feature}
                  </label>
                ))}
              </div>
            </div>

            {/* Available Hours */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available From
                </label>
                <input
                  type="time"
                  name="availableHours.start"
                  value={formData.availableHours.start}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Available Until
                </label>
                <input
                  type="time"
                  name="availableHours.end"
                  value={formData.availableHours.end}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Advance Booking (Hours)
                </label>
                <input
                  type="number"
                  name="bookingAdvanceHours"
                  value={formData.bookingAdvanceHours}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Creating...' : 'Create Service'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Transportation Services</h3>
        </div>
        <div className="p-6">
          {services.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No transportation services created yet. Click "Add New Service" to get started.
            </p>
          ) : (
            <div className="grid gap-4">
              {services.map((service) => (
                <div key={service._id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                      <p className="text-gray-600 mt-1">{service.description}</p>
                      <div className="mt-3 space-y-2">
                        {service.serviceCombinations?.map((combo, index) => (
                          <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded">
                            <div>
                              <span className="font-medium">{combo.name}</span>
                              {combo.attributes && (
                                <div className="text-sm text-gray-600 mt-1">
                                  {combo.attributes.vehicleType} • {combo.attributes.capacity} passengers
                                  {combo.attributes.features && combo.attributes.features.length > 0 && (
                                    <span> • {combo.attributes.features.join(', ')}</span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-green-600">
                                ${combo.basePrice}
                                {combo.priceType === 'per_hour' && '/hour'}
                                {combo.priceType === 'per_km' && '/km'}
                              </span>
                              {combo.minimumCharge > 0 && (
                                <div className="text-sm text-gray-500">
                                  Min: ${combo.minimumCharge}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="ml-4">
                      <button
                        onClick={() => deleteService(service._id)}
                        className="text-red-600 hover:text-red-800"
                        title="Delete service"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransportationServiceCreator;
