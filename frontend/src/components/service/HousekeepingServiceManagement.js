/**
 * Housekeeping Service Management — Modern Restyle
 * Allows service providers to manage their housekeeping services
 * - Brand: #3B5787 / #67BAE0
 * - Mobile-first, glass gradient header, modern cards
 * - Enhanced animations and modern UI components
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaBroom,
  FaPlus,
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
    "transition-all duration-300"
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

const HousekeepingServiceManagement = ({ onBack }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    { value: 'cleaning', label: t('housekeeping.categories.cleaning'), icon: FaBroom },
    { value: 'maintenance', label: t('housekeeping.categories.maintenance'), icon: FaUsers },
    { value: 'amenities', label: t('housekeeping.categories.amenities'), icon: FaCheck },
    { value: 'laundry', label: t('housekeeping.categories.laundry'), icon: FaClock }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/service/housekeeping-services');
      console.log('Fetched services:', response.data);
      console.log('Services structure:', response.data.data);

      // Debug: Log each service's ID structure
      if (response.data.data && response.data.data.length > 0) {
        response.data.data.forEach((service, index) => {
          console.log(`Service ${index + 1}:`, {
            _id: service._id,
            id: service.id,
            name: service.name,
            hasUnderscore: !!service._id,
            hasRegularId: !!service.id
          });
        });
      }

      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await apiClient.post('/service/housekeeping-services', newService);
      console.log('Create service response:', response.data);

      // Use the actual service returned from the backend
      const createdService = response.data.data.service;
      setServices(prev => [...prev, createdService]);

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
      toast.error('Failed to create service');
    } finally {
      setSubmitting(false);
    }
  };

  const toggleServiceStatus = async (serviceId, currentStatus) => {
    try {
      const action = currentStatus ? 'deactivate' : 'activate';
      await apiClient.post(`/service/housekeeping-services/${serviceId}/${action}`);

      setServices(prev => prev.map(service =>
        (service._id || service.id) === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));

      toast.success(`Service ${action}d successfully`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      // Optimistic update
      setServices(prev => prev.map(service =>
        (service._id || service.id) === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));
      toast.success(`Service ${currentStatus ? 'deactivated' : 'activated'} successfully`);
    }
  };

  const deleteService = async (serviceId) => {
    if (!serviceId) {
      console.error('Service ID is undefined');
      toast.error('Cannot delete service: Invalid service ID');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this service?')) return;

    try {
      console.log('Deleting housekeeping service:', serviceId);
      const response = await apiClient.delete(`/service/housekeeping-services/${serviceId}`);
      console.log('Delete response:', response.data);

      // Only update UI if backend deletion was successful
      setServices(prev => prev.filter(service => (service._id || service.id) !== serviceId));
      toast.success('Service deleted successfully');
    } catch (error) {
      console.error('Error deleting service:', error);
      console.error('Error response:', error.response?.data);

      // Show the actual error message from the backend
      const errorMessage = error.response?.data?.message || 'Failed to delete service';
      toast.error(errorMessage);

      // Don't optimistically update the UI if there was an error
    }
  };

  const getCategoryInfo = (category) => {
    const categoryInfo = serviceCategories.find(cat => cat.value === category);
    return categoryInfo || { label: category, icon: FaBroom };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
          <div className="relative flex flex-col items-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Housekeeping Services</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">Loading available housekeeping services...</p>
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
                <button
                  onClick={onBack}
                  className="mr-6 p-3 rounded-2xl bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all duration-300"
                >
                  <FaArrowLeft className="text-xl" />
                </button>
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm mr-6">
                    <FaBroom className="text-4xl" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100 mb-2">
                      {t('housekeeping.title')}
                    </h1>
                    <div className="h-1 w-20 bg-gradient-to-r from-white/60 to-transparent rounded-full"></div>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setShowCreateForm(true)}
                className={BTN.secondary + " bg-white text-[#3B5787] hover:bg-blue-50"}
              >
                <FaPlus className="mr-2" />
                {t('housekeeping.management.addService')}
              </button>
            </div>
            <p className="text-lg text-blue-100 max-w-2xl">
              {t('housekeeping.subtitle')}
            </p>
          </div>
        </div>

        {/* Modern Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {serviceCategories.map(category => {
            const categoryServices = services.filter(s => s.subcategory === category.value && s.isActive);
            const IconComponent = category.icon;
            return (
              <div key={category.value} className={CARD + " group hover:scale-105 transition-all duration-300 relative overflow-hidden"}>
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-[#67BAE0]/10 to-transparent rounded-bl-full"></div>

                <div className="relative z-10 p-6">
                  <div className="flex items-center mb-4">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 mr-4">
                      <IconComponent className="text-2xl text-[#3B5787]" />
                    </div>
                    <h3 className="font-bold text-gray-800">{category.label}</h3>
                  </div>
                  <div className="text-center">
                    <p className="text-3xl font-bold text-[#3B5787] mb-1">{categoryServices.length}</p>
                    <p className="text-sm text-gray-600">{t('housekeeping.management.activeServices')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modern Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
          const categoryInfo = getCategoryInfo(service.subcategory);
          const IconComponent = categoryInfo.icon;

          return (
            <div
              key={service._id || service.id}
              className={CARD + " group hover:scale-105 transition-all duration-300 relative overflow-hidden " +
                (service.isActive ? 'ring-2 ring-green-400 shadow-lg' : 'opacity-75')}
            >
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#67BAE0]/10 to-transparent rounded-bl-full"></div>

              {/* Service Header */}
              <div className="relative z-10 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm mr-4">
                      <IconComponent className="text-2xl" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{service.name}</h3>
                      <p className="text-blue-100 text-sm">{categoryInfo.label}</p>
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    service.isActive
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {service.isActive ? t('housekeeping.management.active') : t('housekeeping.management.inactive')}
                  </div>
                </div>
              </div>

              {/* Service Content */}
              <div className="relative z-10 p-6">
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>

                {/* Service Details */}
                <div className="space-y-4 mb-6">
                  <div className="flex items-center text-sm text-gray-600">
                    <div className="p-2 rounded-lg bg-blue-50 mr-3">
                      <FaClock className="text-blue-500" />
                    </div>
                    <span>{t('housekeeping.management.duration')}: <span className="font-semibold">{service.estimatedDuration} minutes</span></span>
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <div className="p-2 rounded-lg bg-green-50 mr-3">
                      <FaCheck className="text-green-500" />
                    </div>
                    <span>{t('housekeeping.management.available')}: <span className="font-semibold">{service.availability === 'always' ? t('housekeeping.management.always') : t('housekeeping.management.businessHours')}</span></span>
                  </div>
                </div>

                {/* Requirements */}
                {service.requirements && service.requirements.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                      <div className="p-1 rounded-lg bg-blue-100 mr-2">
                        <FaCheck className="text-blue-600 text-xs" />
                      </div>
                      {t('housekeeping.management.requirements')}
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-2">
                      {service.requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <span className="text-[#3B5787] mr-2 font-bold">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Modern Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => toggleServiceStatus(service._id || service.id, service.isActive)}
                    className={`flex-1 ${
                      service.isActive ? BTN.danger : BTN.primary
                    }`}
                  >
                    {service.isActive ? (
                      <>
                        <FaTimes className="mr-2" />
                        {t('housekeeping.management.deactivate')}
                      </>
                    ) : (
                      <>
                        <FaCheck className="mr-2" />
                        {t('housekeeping.management.activate')}
                      </>
                    )}
                  </button>

                  {/* Always show delete button for services */}
                  <button
                    onClick={() => deleteService(service._id || service.id)}
                    className="px-4 py-3 bg-red-100 text-red-600 hover:bg-red-200 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modern Create Service Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={CARD + " w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl animate-slideUp"}>
            {/* Enhanced Modal Header with Decorative Elements */}
            <div className="relative bg-gradient-to-br from-[#3B5787] via-[#4A6B95] to-[#67BAE0] text-white p-8">
              {/* Background Decorations */}
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
              <div className="absolute -bottom-4 -left-4 h-16 w-16 rounded-full bg-white/15"></div>
              <div className="absolute top-4 right-1/3 h-3 w-3 rounded-full bg-white/25"></div>

              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm mr-6 shadow-lg">
                    <FaPlus className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">{t('housekeeping.management.createNew')}</h2>
                    <p className="text-blue-100 text-sm">{t('housekeeping.management.createDescription')}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:rotate-90"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            {/* Enhanced Modal Content with Better Layout */}
            <div className="p-8 max-h-[calc(95vh-120px)] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleCreateService} className="space-y-8">
                {/* Service Basic Information Section */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-blue-500 mr-3">
                      <FaBroom className="text-white text-sm" />
                    </div>
                    {t('housekeeping.management.basicInformation')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        {t('housekeeping.management.serviceName')} *
                      </label>
                      <input
                        type="text"
                        value={newService.name}
                        onChange={(e) => setNewService(prev => ({ ...prev, name: e.target.value }))}
                        className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
                        placeholder={t('housekeeping.management.placeholders.serviceName')}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        {t('housekeeping.management.category')} *
                      </label>
                      <select
                        value={newService.category}
                        onChange={(e) => setNewService(prev => ({ ...prev, category: e.target.value }))}
                        className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
                      >
                        {serviceCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <label className="block text-sm font-bold text-gray-700">
                      {t('housekeeping.management.description')} *
                    </label>
                    <textarea
                      value={newService.description}
                      onChange={(e) => setNewService(prev => ({ ...prev, description: e.target.value }))}
                      className={INPUT + " resize-none transition-all duration-300 focus:scale-[1.02]"}
                      rows="4"
                      placeholder={t('housekeeping.management.placeholders.description')}
                      required
                    />
                  </div>
                </div>

                {/* Service Configuration Section */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl p-6 border border-green-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-green-500 mr-3">
                      <FaClock className="text-white text-sm" />
                    </div>
                    {t('housekeeping.management.serviceConfiguration')}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        {t('housekeeping.management.estimatedDuration')} ({t('housekeeping.management.minutes')})
                      </label>
                      <div className="relative">
                        <input
                          type="number"
                          value={newService.estimatedDuration}
                          onChange={(e) => setNewService(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                          className={INPUT + " transition-all duration-300 focus:scale-[1.02] pr-16"}
                          min="5"
                          max="240"
                          placeholder="30"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm font-medium">
                          {t('housekeeping.management.min')}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">
                        {t('housekeeping.management.availability')}
                      </label>
                      <select
                        value={newService.availability}
                        onChange={(e) => setNewService(prev => ({ ...prev, availability: e.target.value }))}
                        className={INPUT + " transition-all duration-300 focus:scale-[1.02]"}
                      >
                        <option value="always">{t('housekeeping.management.always')}</option>
                        <option value="business-hours">{t('housekeeping.management.businessHours')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Special Instructions Section */}
                <div className="bg-gradient-to-r from-purple-50 to-violet-50 rounded-2xl p-6 border border-purple-100">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-purple-500 mr-3">
                      <FaCheck className="text-white text-sm" />
                    </div>
                    {t('housekeeping.management.additionalDetails')}
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">
                      {t('housekeeping.management.specialInstructions')}
                    </label>
                    <textarea
                      value={newService.instructions}
                      onChange={(e) => setNewService(prev => ({ ...prev, instructions: e.target.value }))}
                      className={INPUT + " resize-none transition-all duration-300 focus:scale-[1.02]"}
                      rows="4"
                      placeholder={t('housekeeping.management.placeholders.instructions')}
                    />
                    <p className="text-xs text-gray-500 mt-2">
                      {t('housekeeping.management.instructionsHelp')}
                    </p>
                  </div>
                </div>

                {/* Enhanced Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 -mx-8 -mb-8">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateForm(false)}
                      className={BTN.ghost + " flex-1 hover:bg-gray-200"}
                    >
                      <FaTimes className="mr-2" />
                      {t('housekeeping.management.cancel')}
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={BTN.primary + " flex-2 shadow-xl hover:shadow-2xl"}
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          {t('housekeeping.management.creating')}
                        </>
                      ) : (
                        <>
                          <FaPlus className="mr-2" />
                          {t('housekeeping.management.createService')}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default HousekeepingServiceManagement;
