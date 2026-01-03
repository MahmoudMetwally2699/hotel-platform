/**
 * Housekeeping Service Management — Modern Restyle
 * Allows service providers to manage their housekeeping services
 * - Brand: #5BB8E4
 * - Mobile-first, modern header, clean cards
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
  FaArrowLeft,
  FaFilter,
  FaEdit
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

// ---------------- UI Design Tokens ----------------
const BTN = {
  primary:
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white " +
    "bg-[#5BB8E4] hover:bg-[#4A9FCC] " +
    "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5BB8E4] transition-all duration-300 " +
    "shadow-lg shadow-blue-200 hover:shadow-xl transform hover:-translate-y-0.5",
  secondary:
    "inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 " +
    "bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-[#5BB8E4] transition-all duration-300 shadow-sm hover:shadow-md",
  danger:
    "inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 " +
    "bg-red-50 hover:bg-red-100 focus:outline-none " +
    "focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300",
  ghost:
    "inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 " +
    "bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 " +
    "transition-all duration-300"
};

const CARD = "bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300";
const INPUT = "w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-[#5BB8E4] focus:border-[#5BB8E4] transition-colors";

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
    background: #5BB8E4;
    border-radius: 10px;
  }

  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #4A9FCC;
  }
`;

const HousekeepingServiceManagement = ({ onBack }) => {
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingService, setEditingService] = useState(null);
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
    requirements: [],
    instructions: ''
  });

  // Operating Hours
  const defaultSchedule = {
    monday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    tuesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    wednesday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    thursday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    friday: { isAvailable: true, startTime: '09:00', endTime: '17:00' },
    saturday: { isAvailable: false, startTime: '09:00', endTime: '17:00' },
    sunday: { isAvailable: false, startTime: '09:00', endTime: '17:00' }
  };
  const [operatingHours, setOperatingHours] = useState(defaultSchedule);
  const [editOperatingHours, setEditOperatingHours] = useState(defaultSchedule);

  const serviceCategories = [
    { value: 'cleaning', label: t('housekeeping.categories.cleaning'), icon: FaBroom },
    { value: 'maintenance', label: t('housekeeping.categories.maintenance'), icon: FaUsers },
    { value: 'amenities', label: t('housekeeping.categories.amenities'), icon: FaCheck }
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const response = await apiClient.get('/service/housekeeping-services');

      setServices(response.data.data || []);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  // Operating Hours Helpers
  const updateDaySchedule = (day, field, value) => {
    setOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const applyToAllDays = () => {
    const mondaySchedule = operatingHours.monday;
    const newSchedule = {};
    Object.keys(operatingHours).forEach(day => {
      newSchedule[day] = { ...mondaySchedule };
    });
    setOperatingHours(newSchedule);
  };

  const formatOperatingHours = (schedule) => {
    if (!schedule) return 'Not set';

    const days = Object.keys(schedule);
    const activeDays = days.filter(day => schedule[day]?.isAvailable);

    if (activeDays.length === 0) return 'Closed';

    // Only show "Daily" if ALL 7 days are available with same hours
    if (activeDays.length === 7) {
      const firstDay = schedule[activeDays[0]];
      const allSameHours = activeDays.every(day =>
        schedule[day].startTime === firstDay.startTime &&
        schedule[day].endTime === firstDay.endTime
      );
      if (allSameHours) {
        return `Daily: ${firstDay.startTime || '09:00'} - ${firstDay.endTime || '17:00'}`;
      }
    }

    // Group consecutive days with same hours
    const groups = [];
    let currentGroup = [activeDays[0]];

    for (let i = 1; i < activeDays.length; i++) {
      const prevDay = activeDays[i - 1];
      const currDay = activeDays[i];
      const prevHours = schedule[prevDay];
      const currHours = schedule[currDay];

      if (prevHours.startTime === currHours.startTime && prevHours.endTime === currHours.endTime) {
        currentGroup.push(currDay);
      } else {
        groups.push({ days: currentGroup, hours: prevHours });
        currentGroup = [currDay];
      }
    }
    groups.push({ days: currentGroup, hours: schedule[currentGroup[0]] });

    return groups.map(g => {
      const dayRange = g.days.length > 1
        ? `${g.days[0].slice(0, 3)}-${g.days[g.days.length - 1].slice(0, 3)}`
        : g.days[0].slice(0, 3);
      return `${dayRange}: ${g.hours.startTime || '09:00'} - ${g.hours.endTime || '17:00'}`;
    }).join(', ');
  };

  const handleCreateService = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        ...newService,
        availability: {
          isAvailable: true,
          schedule: operatingHours
        }
      };
      const response = await apiClient.post('/service/housekeeping-services', payload);

      // Use the actual service returned from the backend
      const createdService = response.data.data.service;
      setServices(prev => [...prev, createdService]);

      setNewService({
        name: '',
        description: '',
        category: 'cleaning',
        estimatedDuration: 30,
        requirements: [],
        instructions: ''
      });
      setOperatingHours(defaultSchedule);
      setShowCreateForm(false);
      toast.success(t('housekeeping.messages.serviceCreated'));
    } catch (error) {
      console.error('Error creating service:', error);
      toast.error(t('housekeeping.messages.createFailed'));
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

      toast.success(`${t('housekeeping.messages.service' + (action === 'activate' ? 'Activated' : 'Deactivated'))}`);
    } catch (error) {
      console.error('Error toggling service status:', error);
      // Optimistic update
      setServices(prev => prev.map(service =>
        (service._id || service.id) === serviceId
          ? { ...service, isActive: !currentStatus }
          : service
      ));
      toast.success(`${t('housekeeping.messages.service' + (currentStatus ? 'Deactivated' : 'Activated'))}`);
    }
  };

  const deleteService = async (serviceId) => {
    if (!serviceId) {
      console.error('Service ID is undefined');
      toast.error('Cannot delete service: Invalid service ID');
      return;
    }

    if (!window.confirm(t('housekeeping.messages.confirmDelete'))) return;

    try {
      await apiClient.delete(`/service/housekeeping-services/${serviceId}`);

      // Only update UI if backend deletion was successful
      setServices(prev => prev.filter(service => (service._id || service.id) !== serviceId));
      toast.success(t('housekeeping.messages.serviceDeleted'));
    } catch (error) {
      console.error('Error deleting service:', error);
      console.error('Error response:', error.response?.data);

      // Show the actual error message from the backend
      const errorMessage = error.response?.data?.message || t('housekeeping.messages.deleteFailed');
      toast.error(errorMessage);

      // Don't optimistically update the UI if there was an error
    }
  };

  const getCategoryInfo = (category) => {
    const categoryInfo = serviceCategories.find(cat => cat.value === category);
    return categoryInfo || { label: category, icon: FaBroom };
  };

  // Edit handlers
  const startEdit = (service) => {
    setEditingService({
      ...service,
      category: service.subcategory || 'cleaning'
    });
    setEditOperatingHours(service.availability?.schedule || defaultSchedule);
    setShowEditForm(true);
  };

  const cancelEdit = () => {
    setEditingService(null);
    setEditOperatingHours(defaultSchedule);
    setShowEditForm(false);
  };

  const updateEditOperatingHours = (day, field, value) => {
    setEditOperatingHours(prev => ({
      ...prev,
      [day]: { ...prev[day], [field]: value }
    }));
  };

  const applyToAllDaysEdit = () => {
    const mondaySchedule = editOperatingHours.monday;
    const newSchedule = {};
    Object.keys(editOperatingHours).forEach(day => {
      newSchedule[day] = { ...mondaySchedule };
    });
    setEditOperatingHours(newSchedule);
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const payload = {
        name: editingService.name,
        description: editingService.description,
        category: editingService.category,
        estimatedDuration: editingService.estimatedDuration || editingService.specifications?.duration?.estimated,
        availability: {
          isAvailable: true,
          schedule: editOperatingHours
        },
        requirements: editingService.specifications?.requirements || [],
        instructions: editingService.specifications?.instructions || ''
      };

      const response = await apiClient.put(`/service/housekeeping-services/${editingService._id}`, payload);

      setServices(prev => prev.map(service =>
        service._id === editingService._id ? response.data.data.service : service
      ));

      cancelEdit();
      toast.success('Service updated successfully');
    } catch (error) {
      console.error('Error updating service:', error);
      toast.error('Failed to update service');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#5BB8E4] mb-4"></div>
        <p className="text-gray-500 font-medium">{t('housekeeping.messages.loadingServices')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50 w-full overflow-x-hidden">
      <div className="w-full max-w-full p-3 sm:p-4 lg:p-6 xl:p-8 min-w-0">
        {/* Modern Header */}
        <div className="relative overflow-hidden rounded-2xl bg-[#5BB8E4] p-8 sm:p-10 mb-8 shadow-xl">
          {/* Abstract shapes overlay */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#66CFFF]/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-5">
              {onBack && (
                <button
                  onClick={onBack}
                  className="p-3 rounded-xl bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300"
                >
                  <FaArrowLeft className="text-xl text-white" />
                </button>
              )}
              <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                <FaBroom className="text-4xl text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                  {t('housekeeping.title')}
                </h1>
                <p className="text-blue-100/90 text-lg max-w-xl font-light">
                  {t('housekeeping.subtitle')}
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className={BTN.primary}
            >
              <FaPlus className="mr-2" />
              {t('housekeeping.management.addService')}
            </button>
          </div>
        </div>

        {/* Modern Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
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
                    <p className="text-3xl font-bold text-[#5BB8E4] mb-1">{categoryServices.length}</p>
                    <p className="text-sm text-gray-600">{t('housekeeping.management.activeServices')}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modern Services Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
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
              <div className="relative z-10 bg-[#5BB8E4] text-white p-6">
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

                {/* Operating Hours Display */}
                {service.availability?.schedule && (
                  <div className="bg-gradient-to-r from-[#5BB8E4]/5 to-blue-50 rounded-xl p-4 mb-6 border border-[#5BB8E4]/20">
                    <div className="flex items-center gap-2 mb-2">
                      <FaFilter className="text-[#5BB8E4]" size={14} />
                      <span className="text-xs font-semibold text-[#5BB8E4] uppercase tracking-wide">Operating Hours</span>
                    </div>
                    <p className="text-sm text-gray-700 font-medium">
                      {formatOperatingHours(service.availability.schedule)}
                    </p>
                  </div>
                )}

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
                          <span className="text-[#5BB8E4] mr-2 font-bold">•</span>
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

                  {/* Edit button */}
                  <button
                    onClick={() => startEdit(service)}
                    className="px-4 py-3 bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-md"
                  >
                    <FaEdit />
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
            <div className="relative bg-[#5BB8E4] text-white p-8">
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
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
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
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
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
                  </div>
                </div>

                {/* Operating Hours Section */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
                        <FaFilter className="text-white text-sm" />
                      </div>
                      Operating Hours
                    </h3>
                    <button
                      type="button"
                      onClick={applyToAllDays}
                      className="text-xs px-3 py-1.5 bg-[#5BB8E4]/10 text-[#5BB8E4] rounded-lg hover:bg-[#5BB8E4]/20 transition-colors font-medium"
                    >
                      Apply Monday to All Days
                    </button>
                  </div>

                  <div className="space-y-3">
                    {Object.keys(operatingHours).map((day) => (
                      <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-2 min-w-[120px]">
                          <input
                            type="checkbox"
                            checked={operatingHours[day].isAvailable}
                            onChange={(e) => updateDaySchedule(day, 'isAvailable', e.target.checked)}
                            className="w-4 h-4 text-[#5BB8E4] border-gray-300 rounded focus:ring-[#5BB8E4]"
                          />
                          <span className="text-sm font-semibold text-gray-700 capitalize">{day}</span>
                        </label>

                        {operatingHours[day].isAvailable && (
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 font-medium">From:</label>
                              <input
                                type="time"
                                value={operatingHours[day].startTime}
                                onChange={(e) => updateDaySchedule(day, 'startTime', e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BB8E4] focus:border-[#5BB8E4]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 font-medium">To:</label>
                              <input
                                type="time"
                                value={operatingHours[day].endTime}
                                onChange={(e) => updateDaySchedule(day, 'endTime', e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BB8E4] focus:border-[#5BB8E4]"
                              />
                            </div>
                          </div>
                        )}

                        {!operatingHours[day].isAvailable && (
                          <span className="text-sm text-gray-400 italic">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Special Instructions Section */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
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

      {/* Edit Service Modal */}
      {showEditForm && editingService && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className={CARD + " w-full max-w-3xl max-h-[95vh] overflow-hidden shadow-2xl animate-slideUp"}>
            <div className="relative bg-[#5BB8E4] text-white p-8">
              <div className="absolute -top-8 -right-8 h-24 w-24 rounded-full bg-white/10 blur-xl"></div>
              <div className="relative z-10 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="p-4 rounded-2xl bg-white/20 backdrop-blur-sm mr-6 shadow-lg">
                    <FaEdit className="text-2xl" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Edit Service</h2>
                    <p className="text-blue-100 text-sm">Update service details and operating hours</p>
                  </div>
                </div>
                <button
                  onClick={cancelEdit}
                  className="p-3 hover:bg-white/20 rounded-xl transition-all duration-300 hover:rotate-90"
                >
                  <FaTimes className="text-xl" />
                </button>
              </div>
            </div>

            <div className="p-8 max-h-[calc(95vh-120px)] overflow-y-auto custom-scrollbar">
              <form onSubmit={handleUpdateService} className="space-y-8">
                {/* Basic Information */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
                      <FaBroom className="text-white text-sm" />
                    </div>
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Service Name *</label>
                      <input
                        type="text"
                        value={editingService.name}
                        onChange={(e) => setEditingService(prev => ({ ...prev, name: e.target.value }))}
                        className={INPUT}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="block text-sm font-bold text-gray-700">Category *</label>
                      <select
                        value={editingService.category}
                        onChange={(e) => setEditingService(prev => ({ ...prev, category: e.target.value }))}
                        className={INPUT}
                      >
                        {serviceCategories.map(cat => (
                          <option key={cat.value} value={cat.value}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="space-y-2 mt-6">
                    <label className="block text-sm font-bold text-gray-700">Description *</label>
                    <textarea
                      rows={3}
                      value={editingService.description}
                      onChange={(e) => setEditingService(prev => ({ ...prev, description: e.target.value }))}
                      className={INPUT + " resize-none"}
                      required
                    />
                  </div>
                </div>

                {/* Service Configuration */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
                    <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
                      <FaClock className="text-white text-sm" />
                    </div>
                    Service Configuration
                  </h3>

                  <div className="space-y-2">
                    <label className="block text-sm font-bold text-gray-700">Estimated Duration (minutes)</label>
                    <input
                      type="number"
                      value={editingService.estimatedDuration || editingService.specifications?.duration?.estimated || 30}
                      onChange={(e) => setEditingService(prev => ({ ...prev, estimatedDuration: parseInt(e.target.value) }))}
                      className={INPUT}
                      min="5"
                      max="240"
                    />
                  </div>
                </div>

                {/* Operating Hours */}
                <div className="bg-white rounded-2xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-gray-800 flex items-center">
                      <div className="p-2 rounded-lg bg-[#5BB8E4] mr-3">
                        <FaFilter className="text-white text-sm" />
                      </div>
                      Operating Hours
                    </h3>
                    <button
                      type="button"
                      onClick={applyToAllDaysEdit}
                      className="text-xs px-3 py-1.5 bg-[#5BB8E4]/10 text-[#5BB8E4] rounded-lg hover:bg-[#5BB8E4]/20 transition-colors font-medium"
                    >
                      Apply Monday to All Days
                    </button>
                  </div>

                  <div className="space-y-3">
                    {Object.keys(editOperatingHours).map((day) => (
                      <div key={day} className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <label className="flex items-center gap-2 min-w-[120px]">
                          <input
                            type="checkbox"
                            checked={editOperatingHours[day].isAvailable}
                            onChange={(e) => updateEditOperatingHours(day, 'isAvailable', e.target.checked)}
                            className="w-4 h-4 text-[#5BB8E4] border-gray-300 rounded focus:ring-[#5BB8E4]"
                          />
                          <span className="text-sm font-semibold text-gray-700 capitalize">{day}</span>
                        </label>

                        {editOperatingHours[day].isAvailable && (
                          <div className="flex items-center gap-3 flex-1">
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 font-medium">From:</label>
                              <input
                                type="time"
                                value={editOperatingHours[day].startTime}
                                onChange={(e) => updateEditOperatingHours(day, 'startTime', e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BB8E4] focus:border-[#5BB8E4]"
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <label className="text-xs text-gray-500 font-medium">To:</label>
                              <input
                                type="time"
                                value={editOperatingHours[day].endTime}
                                onChange={(e) => updateEditOperatingHours(day, 'endTime', e.target.value)}
                                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5BB8E4] focus:border-[#5BB8E4]"
                              />
                            </div>
                          </div>
                        )}

                        {!editOperatingHours[day].isAvailable && (
                          <span className="text-sm text-gray-400 italic">Closed</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="sticky bottom-0 bg-white border-t border-gray-100 p-6 -mx-8 -mb-8">
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className={BTN.ghost + " flex-1 hover:bg-gray-200"}
                    >
                      <FaTimes className="mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className={BTN.primary + " flex-2 shadow-xl hover:shadow-2xl"}
                    >
                      {submitting ? (
                        <>
                          <FaSpinner className="animate-spin mr-2" />
                          Updating...
                        </>
                      ) : (
                        <>
                          <FaCheck className="mr-2" />
                          Update Service
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
