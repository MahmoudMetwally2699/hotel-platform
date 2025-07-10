import React, { useState, useEffect } from 'react';
import api from '../../services/api.service';

/**
 * Tours Service Creator Component
 * Allows service providers to create tour services dynamically
 */
const ToursServiceCreator = () => {
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [templates, setTemplates] = useState(null);
  const [activeForm, setActiveForm] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    tourType: '',
    duration: '',
    durationUnit: 'hours',
    groupSize: {
      min: 1,
      max: 10
    },
    priceStructure: 'per_person', // per_person, per_group
    groupPrice: '',
    includes: [],
    languages: [],
    difficulty: '',
    ageRestriction: {
      min: 0,
      max: 100
    },
    schedule: {
      startTime: '',
      frequency: 'daily', // daily, weekly, custom
      daysOfWeek: []
    },
    meetingPoint: '',
    cancellationPolicy: '24_hours'
  });

  // Load tours templates and existing services
  useEffect(() => {
    loadTemplates();
    loadServices();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await api.get('/service/category-templates/tours');
      setTemplates(response.data.template);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/service/services-by-category/tours');
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
          [child]: type === 'number' ? parseInt(value) || 0 : value
        }
      }));
    } else if (name === 'includes' || name === 'languages') {
      setFormData(prev => ({
        ...prev,
        [name]: checked
          ? [...prev[name], value]
          : prev[name].filter(item => item !== value)
      }));
    } else if (name === 'daysOfWeek') {
      setFormData(prev => ({
        ...prev,
        schedule: {
          ...prev.schedule,
          daysOfWeek: checked
            ? [...prev.schedule.daysOfWeek, value]
            : prev.schedule.daysOfWeek.filter(day => day !== value)
        }
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
      tourType: '',
      duration: '',
      durationUnit: 'hours',
      groupSize: {
        min: 1,
        max: 10
      },
      priceStructure: 'per_person',
      groupPrice: '',
      includes: [],
      languages: [],
      difficulty: '',
      ageRestriction: {
        min: 0,
        max: 100
      },
      schedule: {
        startTime: '',
        frequency: 'daily',
        daysOfWeek: []
      },
      meetingPoint: '',
      cancellationPolicy: '24_hours'
    });
    setActiveForm(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Prepare service combinations
      const serviceCombinations = [];

      if (formData.priceStructure === 'per_person') {
        serviceCombinations.push({
          name: `${formData.name} (Per Person)`,
          basePrice: parseFloat(formData.basePrice),
          priceType: 'per_person',
          attributes: {
            tourType: formData.tourType,
            duration: `${formData.duration} ${formData.durationUnit}`,
            difficulty: formData.difficulty,
            minGroupSize: formData.groupSize.min,
            maxGroupSize: formData.groupSize.max,
            languages: formData.languages,
            includes: formData.includes
          }
        });
      } else if (formData.priceStructure === 'per_group') {
        serviceCombinations.push({
          name: `${formData.name} (Group Rate)`,
          basePrice: parseFloat(formData.groupPrice),
          priceType: 'per_group',
          attributes: {
            tourType: formData.tourType,
            duration: `${formData.duration} ${formData.durationUnit}`,
            difficulty: formData.difficulty,
            minGroupSize: formData.groupSize.min,
            maxGroupSize: formData.groupSize.max,
            languages: formData.languages,
            includes: formData.includes
          }
        });
      }

      const serviceData = {
        category: 'tours',
        name: formData.name,
        description: formData.description,
        serviceCombinations,
        availability: {
          schedule: formData.schedule,
          ageRestriction: formData.ageRestriction
        },
        settings: {
          tourType: formData.tourType,
          duration: formData.duration,
          durationUnit: formData.durationUnit,
          groupSize: formData.groupSize,
          meetingPoint: formData.meetingPoint,
          cancellationPolicy: formData.cancellationPolicy,
          difficulty: formData.difficulty
        }
      };

      await api.post('/service/create-service', serviceData);

      // Reload services and reset form
      await loadServices();
      resetForm();
      alert('Tour service created successfully!');
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

  const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Tour Services</h2>
        <button
          onClick={() => setActiveForm('create')}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Add New Tour
        </button>
      </div>

      {/* Create/Edit Form */}
      {activeForm && (
        <div className="bg-white p-6 rounded-lg shadow-md border">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Create Tour Service</h3>
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
                  Tour Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., City Walking Tour, Historical Sites"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tour Type *
                </label>
                <select
                  name="tourType"
                  value={formData.tourType}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select tour type</option>
                  {templates.tourTypes?.map((type, index) => (
                    <option key={index} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Duration *
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    name="duration"
                    value={formData.duration}
                    onChange={handleInputChange}
                    required
                    min="0.5"
                    step="0.5"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    name="durationUnit"
                    value={formData.durationUnit}
                    onChange={handleInputChange}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="hours">Hours</option>
                    <option value="days">Days</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty Level
                </label>
                <select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select difficulty</option>
                  {templates.difficulties?.map((level, index) => (
                    <option key={index} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
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
                placeholder="Describe your tour experience..."
              />
            </div>

            {/* Group Size */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Group Size
                </label>
                <input
                  type="number"
                  name="groupSize.min"
                  value={formData.groupSize.min}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Group Size
                </label>
                <input
                  type="number"
                  name="groupSize.max"
                  value={formData.groupSize.max}
                  onChange={handleInputChange}
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Age Restrictions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Age
                </label>
                <input
                  type="number"
                  name="ageRestriction.min"
                  value={formData.ageRestriction.min}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Age (0 = no limit)
                </label>
                <input
                  type="number"
                  name="ageRestriction.max"
                  value={formData.ageRestriction.max}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
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
                      value="per_person"
                      checked={formData.priceStructure === 'per_person'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Per Person
                  </label>
                </div>
                <div>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="priceStructure"
                      value="per_group"
                      checked={formData.priceStructure === 'per_group'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Per Group (Flat rate)
                  </label>
                </div>
              </div>
            </div>

            {/* Price Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {formData.priceStructure === 'per_person' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Price per Person *
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

              {formData.priceStructure === 'per_group' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Group Price *
                  </label>
                  <input
                    type="number"
                    name="groupPrice"
                    value={formData.groupPrice}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
            </div>

            {/* What's Included */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What's Included (Select all that apply)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {templates.includes?.map((item, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      name="includes"
                      value={item}
                      checked={formData.includes.includes(item)}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            {/* Languages */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tour Languages (Select all available)
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {templates.languages?.map((language, index) => (
                  <label key={index} className="flex items-center">
                    <input
                      type="checkbox"
                      name="languages"
                      value={language}
                      checked={formData.languages.includes(language)}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    {language}
                  </label>
                ))}
              </div>
            </div>

            {/* Schedule */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Schedule
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Start Time</label>
                  <input
                    type="time"
                    name="schedule.startTime"
                    value={formData.schedule.startTime}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Frequency</label>
                  <select
                    name="schedule.frequency"
                    value={formData.schedule.frequency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="daily">Daily</option>
                    <option value="weekly">Weekly</option>
                    <option value="custom">Custom Days</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cancellation Policy</label>
                  <select
                    name="cancellationPolicy"
                    value={formData.cancellationPolicy}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="24_hours">24 hours</option>
                    <option value="48_hours">48 hours</option>
                    <option value="72_hours">72 hours</option>
                    <option value="1_week">1 week</option>
                  </select>
                </div>
              </div>

              {formData.schedule.frequency === 'custom' && (
                <div className="mt-4">
                  <label className="block text-sm text-gray-600 mb-2">Available Days</label>
                  <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                    {daysOfWeek.map((day) => (
                      <label key={day} className="flex items-center">
                        <input
                          type="checkbox"
                          name="daysOfWeek"
                          value={day}
                          checked={formData.schedule.daysOfWeek.includes(day)}
                          onChange={handleInputChange}
                          className="mr-1"
                        />
                        <span className="text-sm">{day.substring(0, 3)}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Meeting Point */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Point
              </label>
              <input
                type="text"
                name="meetingPoint"
                value={formData.meetingPoint}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., Hotel lobby, City center, Landmark location"
              />
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
                {isLoading ? 'Creating...' : 'Create Tour'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Services List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Your Tour Services</h3>
        </div>
        <div className="p-6">
          {services.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              No tour services created yet. Click "Add New Tour" to get started.
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
                                  <span className="inline-block mr-4">
                                    🏷️ {combo.attributes.tourType}
                                  </span>
                                  <span className="inline-block mr-4">
                                    ⏱️ {combo.attributes.duration}
                                  </span>
                                  <span className="inline-block mr-4">
                                    👥 {combo.attributes.minGroupSize}-{combo.attributes.maxGroupSize} people
                                  </span>
                                  {combo.attributes.difficulty && (
                                    <span className="inline-block mr-4">
                                      💪 {combo.attributes.difficulty}
                                    </span>
                                  )}
                                </div>
                              )}
                              {combo.attributes?.includes && combo.attributes.includes.length > 0 && (
                                <div className="text-sm text-green-600 mt-1">
                                  ✅ {combo.attributes.includes.join(', ')}
                                </div>
                              )}
                              {combo.attributes?.languages && combo.attributes.languages.length > 0 && (
                                <div className="text-sm text-blue-600 mt-1">
                                  🗣️ {combo.attributes.languages.join(', ')}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-semibold text-green-600">
                                ${combo.basePrice}
                                {combo.priceType === 'per_person' && '/person'}
                                {combo.priceType === 'per_group' && '/group'}
                              </span>
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

export default ToursServiceCreator;
