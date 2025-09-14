/**
 * Enhanced Laundry Service Management System (Modern + Responsive) - JS version
 * - Mobile-first, clean cards, accessible controls
 * - Brand colors: #3B5787 (primary), #67BAE0 (accent)
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';

// Simple emoji Icon set (kept to avoid new deps)
const Icon = ({ type, className = "" }) => {
  const icons = {
    plus: "➕",
    edit: "✏️",
    trash: "🗑️",
    save: "💾",
    times: "✕",
    tshirt: "👕",
    package: "📦",
    list: "📋",
    toggle: "🔘",
    available: "✅",
    unavailable: "❌"
  };
  return <span className={className}>{icons[type] || "❓"}</span>;
};

// Reusable UI helpers (Tailwind)
const badgeClass = (tone = 'gray') =>
  ({
    gray:   'bg-gray-100 text-gray-800',
    green:  'bg-green-100 text-green-800',
    red:    'bg-red-100 text-red-800',
    blue:   'bg-blue-100 text-blue-800',
    amber:  'bg-amber-100 text-amber-800',
  }[tone] || 'bg-gray-100 text-gray-800') +
  ' inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium';

const btn = {
  primary:
    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white ' +
    'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4A6B] hover:to-[#5BA8CC] ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all shadow-sm',
  neutral:
    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-[#3B5787] ' +
    'bg-white border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all',
  danger:
    'inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-white ' +
    'bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all',
  warn:
    'inline-flex items-center justify-center px-3 py-2 rounded-lg text-sm font-medium text-white ' +
    'bg-orange-600 hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 transition-all',
  success:
    'inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white ' +
    'bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all',
};

const inputBase =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0]';

const sectionCard =
  'p-5 sm:p-6 rounded-xl border border-gray-100 bg-white shadow-sm';

const LaundryServiceCreator = () => {
  const { t } = useTranslation();

  // Tabs
  const [activeTab, setActiveTab] = useState('manage');

  // Common
  const [loading, setLoading] = useState(false);
  const [categoryTemplate, setCategoryTemplate] = useState(null);

  // Manage
  const [existingServices, setExistingServices] = useState([]);
  const [editingService, setEditingService] = useState(null);
  const [editFormData, setEditFormData] = useState(null);

  // Add
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    shortDescription: '',
    isActive: true
  });
  const [laundryItems, setLaundryItems] = useState([]);
  const [availableItems, setAvailableItems] = useState([]);

  useEffect(() => {
    fetchCategoryTemplate();
    if (activeTab === 'manage') fetchExistingServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ===== API =====
  const fetchExistingServices = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/service/services?category=laundry');
      let services = [];
      if (res.data?.data?.services) services = res.data.data.services;
      else if (res.data?.services) services = res.data.services;
      else if (Array.isArray(res.data?.data)) services = res.data.data;
      else if (Array.isArray(res.data)) services = res.data;
      setExistingServices(services);
    } catch (err) {
      console.error(err);
      toast.error(t('serviceProvider.laundryManagement.messages.failedToLoadServices'));
      setExistingServices([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategoryTemplate = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/service/category-templates/laundry');
      const template = res.data?.data?.template;
      setCategoryTemplate(template);
      setAvailableItems(template?.items || []);
    } catch (err) {
      console.error(err);
      toast.error(t('serviceProvider.laundryManagement.messages.failedToLoadTemplate'));
    } finally {
      setLoading(false);
    }
  };

  const updateExistingService = async (serviceId) => {
    try {
      setLoading(true);
      await apiClient.put(`/service/services/${serviceId}`, editFormData);
      toast.success(t('serviceProvider.laundryManagement.messages.serviceUpdatedSuccess'));
      fetchExistingServices();
      cancelEditing();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || t('serviceProvider.laundryManagement.messages.failedToUpdateService'));
    } finally {
      setLoading(false);
    }
  };

  const deleteExistingService = async (serviceId) => {
    if (!window.confirm(t('serviceProvider.laundryManagement.messages.deleteConfirmation'))) return;
    try {
      setLoading(true);
      try {
        await apiClient.delete(`/service/services/${serviceId}`);
        toast.success(t('serviceProvider.laundryManagement.messages.serviceDeletedSuccess'));
      } catch (delErr) {
        if (delErr?.response?.status === 404 || delErr?.response?.status === 405) {
          await apiClient.put(`/service/services/${serviceId}`, { isActive: false });
          toast.success(t('serviceProvider.laundryManagement.messages.serviceDeactivatedSuccess'));
        } else {
          throw delErr;
        }
      }
      fetchExistingServices();
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || t('serviceProvider.laundryManagement.messages.failedToDeleteService'));
    } finally {
      setLoading(false);
    }
  };

  const toggleServiceAvailability = async (serviceId, current) => {
    try {
      setLoading(true);
      await apiClient.put(`/service/services/${serviceId}`, { isActive: !current });
      toast.success(
        t(`serviceProvider.laundryManagement.messages.service${!current ? 'Activated' : 'Deactivated'}Success`)
      );
      fetchExistingServices();
    } catch (err) {
      console.error(err);
      toast.error(t('serviceProvider.laundryManagement.messages.failedToUpdateAvailability'));
    } finally {
      setLoading(false);
    }
  };

  const createService = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      const payload = {
        ...serviceDetails,
        category: 'laundry',
        subcategory: 'item_based',
        serviceType: 'laundry_items',
        laundryItems,
        pricing: { basePrice: 0, pricingType: 'per-item', currency: 'USD' },
        isActive: true
      };
      await apiClient.post('/service/categories/laundry/items', payload);
      toast.success(t('serviceProvider.laundryManagement.messages.serviceCreatedSuccess'));
      setServiceDetails({ name: '', description: '', shortDescription: '', isActive: true });
      setLaundryItems([]);
    } catch (err) {
      console.error(err);
      toast.error(err?.response?.data?.message || t('serviceProvider.laundryManagement.messages.failedToCreateService'));
    } finally {
      setLoading(false);
    }
  };

  // ===== Manage: edit helpers =====
  const startEditingService = (svc) => {
    setEditingService(svc._id);
    setEditFormData({
      name: svc.name,
      description: svc.description,
      shortDescription: svc.shortDescription,
      isActive: svc.isActive,
      laundryItems: svc.laundryItems || []
    });
  };
  const cancelEditing = () => {
    setEditingService(null);
    setEditFormData(null);
  };

  const updateEditingItemPrice = (itemIndex, serviceTypeId, price) => {
    setEditFormData((prev) => ({
      ...prev,
      laundryItems: prev.laundryItems.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              serviceTypes: item.serviceTypes.map((st) =>
                st.serviceTypeId === serviceTypeId ? { ...st, price: parseFloat(price) || 0 } : st
              )
            }
          : item
      )
    }));
  };
  const updateEditingItemAvailability = (itemIndex, serviceTypeId, isAvailable) => {
    setEditFormData((prev) => ({
      ...prev,
      laundryItems: prev.laundryItems.map((item, idx) =>
        idx === itemIndex
          ? {
              ...item,
              serviceTypes: item.serviceTypes.map((st) =>
                st.serviceTypeId === serviceTypeId ? { ...st, isAvailable } : st
              )
            }
          : item
      )
    }));
  };

  // ===== Add: item helpers =====
  const addItemFromDropdown = (itemName) => {
    if (!itemName) return;
    const tmplItem = availableItems.find((i) => i.name === itemName);
    if (!tmplItem) return;
    if (laundryItems.find((i) => i.name === tmplItem.name)) {
      toast.warn(t('serviceProvider.laundryManagement.messages.itemAlreadyAdded'));
      return;
    }
    const newItem = {
      name: tmplItem.name,
      category: tmplItem.category,
      icon: tmplItem.icon,
      isAvailable: true,
      serviceTypes: (categoryTemplate?.serviceTypes || []).map((st) => ({
        serviceTypeId: st.id,
        price: 0,
        isAvailable: true
      })),
      notes: ''
    };
    setLaundryItems((p) => [...p, newItem]);
    toast.success(
      t('serviceProvider.laundryManagement.messages.itemAddedSuccess', { itemName: getTranslatedItemName(tmplItem.name) })
    );
  };
  const removeItem = (itemName) => setLaundryItems((p) => p.filter((i) => i.name !== itemName));
  const updateItemAvailability = (itemName, isAvailable) =>
    setLaundryItems((p) => p.map((i) => (i.name === itemName ? { ...i, isAvailable } : i)));
  const updateServiceTypePrice = (itemName, stId, price) =>
    setLaundryItems((p) =>
      p.map((i) =>
        i.name === itemName
          ? {
              ...i,
              serviceTypes: i.serviceTypes.map((st) =>
                st.serviceTypeId === stId ? { ...st, price: parseFloat(price) || 0 } : st
              )
            }
          : i
      )
    );
  const updateServiceTypeAvailability = (itemName, stId, isAvailable) =>
    setLaundryItems((p) =>
      p.map((i) =>
        i.name === itemName
          ? {
              ...i,
              serviceTypes: i.serviceTypes.map((st) =>
                st.serviceTypeId === stId ? { ...st, isAvailable } : st
              )
            }
          : i
      )
    );
  const updateItemNotes = (itemName, notes) =>
    setLaundryItems((p) => p.map((i) => (i.name === itemName ? { ...i, notes } : i)));

  // ===== Validation & i18n helpers =====
  const validateForm = () => {
    if (!serviceDetails.name.trim()) {
      toast.error(t('serviceProvider.laundryManagement.form.serviceNameRequired'));
      return false;
    }
    if (laundryItems.length === 0) {
      toast.error(t('serviceProvider.laundryManagement.messages.addAtLeastOneItem'));
      return false;
    }
    const hasValid = laundryItems.some(
      (item) => item.isAvailable && item.serviceTypes.some((st) => st.isAvailable && st.price > 0)
    );
    if (!hasValid) {
      toast.error(t('serviceProvider.laundryManagement.messages.setPriceForAvailableService'));
      return false;
    }
    return true;
  };

  const getServiceTypeName = (id) =>
    categoryTemplate?.serviceTypes?.find((st) => st.id === id)?.name || id;

  const getTranslatedItemName = (name) => {
    const key = `categorySelection.laundryItems.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };
  const getTranslatedCategoryName = (name) => {
    const key = `categorySelection.laundryCategories.${name}`;
    const translated = t(key);
    return translated !== key ? translated : name;
  };

  // ===== UI =====
  if (loading && !categoryTemplate) {
    return (
      <div className="flex items-center justify-center p-10 text-[#3B5787]">
        <div className="animate-spin h-5 w-5 border-2 border-[#67BAE0] border-t-transparent rounded-full mr-3" />
        <span>{t('serviceProvider.laundryManagement.messages.loadingTemplate')}</span>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#3B5787] to-[#67BAE0] p-6 sm:p-8 text-white shadow-xl mb-6">
        <div className="absolute -top-10 -right-10 h-32 w-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-8 -left-8 h-24 w-24 rounded-full bg-white/10" />
        <div className="relative">
          <h2 className="flex items-center text-2xl sm:text-3xl font-bold">
            <Icon type="tshirt" className="mr-2" />
            {t('serviceProvider.laundryManagement.title')}
          </h2>
          <p className="mt-2 text-white/90">{t('serviceProvider.laundryManagement.description')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-10 mb-4 bg-white/60 backdrop-blur supports-[backdrop-filter]:bg-white/40 rounded-xl border border-gray-100">
        <div className="grid grid-cols-2">
          <button
            onClick={() => setActiveTab('manage')}
            className={
              'py-3 text-sm sm:text-base font-semibold rounded-l-xl transition ' +
              (activeTab === 'manage'
                ? 'bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] border-r border-gray-100'
                : 'text-gray-600 hover:text-[#3B5787]')
            }
          >
            <Icon type="list" className="mr-2" />
            {t('serviceProvider.laundryManagement.tabs.manageItems')}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={
              'py-3 text-sm sm:text-base font-semibold rounded-r-xl transition ' +
              (activeTab === 'add'
                ? 'bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] border-l border-gray-100'
                : 'text-gray-600 hover:text-[#3B5787]')
            }
          >
            <Icon type="plus" className="mr-2" />
            {t('serviceProvider.laundryManagement.tabs.addItems')}
          </button>
        </div>
      </div>

      {/* Content */}
      {activeTab === 'manage' ? renderManageItemsTab() : renderAddItemsTab()}

    </div>
  );

  // -------- Render Manage Tab --------
  function renderManageItemsTab() {
    if (loading) {
      return (
        <div className={sectionCard + ' flex items-center justify-center text-[#3B5787]'}>
          <div className="animate-spin h-5 w-5 border-2 border-[#67BAE0] border-t-transparent rounded-full mr-3" />
          <span>Loading services...</span>
        </div>
      );
    }

    if (existingServices.length === 0) {
      return (
        <div className={sectionCard + ' text-center'}>
          <Icon type="tshirt" className="text-5xl sm:text-6xl text-gray-300 mb-4" />
          <h3 className="text-lg sm:text-xl font-semibold text-gray-700 mb-2">
            {t('serviceProvider.laundryManagement.messages.noServicesFound')}
          </h3>
          <p className="text-gray-500 mb-6">You haven’t created any laundry services yet.</p>
          <button onClick={() => setActiveTab('add')} className={btn.primary}>
            <Icon type="plus" className="mr-2" />
            Create Your First Service
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-800">
            {t('serviceProvider.laundryManagement.servicesCount', { count: existingServices.length })}
          </h3>
          <button onClick={() => setActiveTab('add')} className={btn.success}>
            <Icon type="plus" className="mr-2" />
            {t('serviceProvider.laundryManagement.addNewService')}
          </button>
        </div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {existingServices.map((service) => (
            <div key={service._id} className={sectionCard + ' relative'}>
              {editingService === service._id ? (
                // ----- Edit Mode -----
                <div className="space-y-4">
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('serviceProvider.laundryManagement.form.serviceName')}
                      </label>
                      <input
                        type="text"
                        value={editFormData.name}
                        onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
                        className={inputBase}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {t('serviceProvider.laundryManagement.form.description')}
                      </label>
                      <textarea
                        rows={3}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                        className={inputBase}
                      />
                    </div>
                  </div>

                  {/* Items Pricing */}
                  {editFormData.laundryItems?.length > 0 && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-2">
                        {t('serviceProvider.laundryManagement.form.itemsPricing')}
                      </h4>
                      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                        {editFormData.laundryItems.map((item, itemIndex) => (
                          <div key={itemIndex} className="rounded-lg border border-gray-100 p-3">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xl">{item.icon}</span>
                              <span className="font-medium">{getTranslatedItemName(item.name)}</span>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                              {item.serviceTypes?.map((st, stIndex) => (
                                <div key={stIndex} className="rounded border border-gray-100 p-2">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-medium">{getServiceTypeName(st.serviceTypeId)}</span>
                                    <input
                                      type="checkbox"
                                      checked={!!st.isAvailable}
                                      onChange={(e) =>
                                        updateEditingItemAvailability(itemIndex, st.serviceTypeId, e.target.checked)
                                      }
                                      className="h-4 w-4"
                                    />
                                  </div>
                                  {st.isAvailable && (
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={st.price}
                                      onChange={(e) =>
                                        updateEditingItemPrice(itemIndex, st.serviceTypeId, e.target.value)
                                      }
                                      className={inputBase + ' text-sm py-1'}
                                      placeholder={t('serviceProvider.laundryManagement.form.pricePlaceholder')}
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

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => updateExistingService(service._id)} disabled={loading} className={btn.success}>
                      <Icon type="save" className="mr-1" />
                      {t('serviceProvider.laundryManagement.actions.save')}
                    </button>
                    <button onClick={cancelEditing} className={btn.neutral}>
                      <Icon type="times" className="mr-1" />
                      {t('serviceProvider.laundryManagement.actions.cancel')}
                    </button>
                  </div>
                </div>
              ) : (
                // ----- View Mode -----
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900">{service.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{service.description}</p>
                    </div>
                    <span className={badgeClass(service.isActive ? 'green' : 'red')}>
                      {service.isActive
                        ? t('serviceProvider.laundryManagement.status.active')
                        : t('serviceProvider.laundryManagement.status.inactive')}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 rounded-lg bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 p-3 border border-[#67BAE0]/20">
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold text-[#3B5787]">
                        {service.laundryItems?.length || 0}
                      </div>
                      <div className="text-[11px] sm:text-xs text-gray-600">
                        {t('serviceProvider.laundryManagement.stats.items')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold text-[#3B5787]">
                        {service.performance?.totalBookings || 0}
                      </div>
                      <div className="text-[11px] sm:text-xs text-gray-600">
                        {t('serviceProvider.laundryManagement.stats.bookings')}
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-base sm:text-lg font-semibold text-[#3B5787]">
                        ${service.performance?.totalRevenue || 0}
                      </div>
                      <div className="text-[11px] sm:text-xs text-gray-600">
                        {t('serviceProvider.laundryManagement.stats.revenue')}
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => startEditingService(service)} className={btn.primary}>
                      <Icon type="edit" className="mr-1" />
                      {t('serviceProvider.laundryManagement.actions.edit')}
                    </button>
                    <button
                      onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                      className={service.isActive ? btn.warn : btn.success}
                    >
                      <Icon type="toggle" className="mr-1" />
                      {service.isActive
                        ? t('serviceProvider.laundryManagement.actions.deactivate')
                        : t('serviceProvider.laundryManagement.actions.activate')}
                    </button>
                    <button onClick={() => deleteExistingService(service._id)} className={btn.danger}>
                      <Icon type="trash" className="mr-1" />
                      {t('serviceProvider.laundryManagement.actions.delete')}
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

  // -------- Render Add Tab --------
  function renderAddItemsTab() {
    return (
      <div className="space-y-6">
        {/* Service Info */}
        <div className={sectionCard}>
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            {t('serviceProvider.laundryManagement.form.serviceInformation')}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('serviceProvider.laundryManagement.form.serviceName')} *
              </label>
              <input
                type="text"
                value={serviceDetails.name}
                onChange={(e) => setServiceDetails((p) => ({ ...p, name: e.target.value }))}
                className={inputBase}
                placeholder={t('serviceProvider.laundryManagement.form.serviceNamePlaceholder')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('serviceProvider.laundryManagement.form.shortDescription')}
              </label>
              <input
                type="text"
                value={serviceDetails.shortDescription}
                onChange={(e) => setServiceDetails((p) => ({ ...p, shortDescription: e.target.value }))}
                className={inputBase}
                placeholder={t('serviceProvider.laundryManagement.form.shortDescriptionPlaceholder')}
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('serviceProvider.laundryManagement.form.fullDescription')}
            </label>
            <textarea
              rows={3}
              value={serviceDetails.description}
              onChange={(e) => setServiceDetails((p) => ({ ...p, description: e.target.value }))}
              className={inputBase}
              placeholder={t('serviceProvider.laundryManagement.form.fullDescriptionPlaceholder')}
            />
          </div>
        </div>

        {/* Add Items */}
        <div className={sectionCard + ' bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 border-[#67BAE0]/20'}>
          <h3 className="text-lg sm:text-xl font-semibold mb-4 text-gray-800">
            <Icon type="plus" className="mr-2" />
            {t('serviceProvider.laundryManagement.form.addLaundryItems')}
          </h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <select
              onChange={(e) => addItemFromDropdown(e.target.value)}
              className={inputBase + ' sm:flex-1'}
              value=""
            >
              <option value="">{t('serviceProvider.laundryManagement.form.selectItemToAdd')}</option>
              {availableItems.map((it, idx) => (
                <option key={idx} value={it.name}>
                  {it.icon} {getTranslatedItemName(it.name)} ({getTranslatedCategoryName(it.category)})
                </option>
              ))}
            </select>
            <span className={badgeClass('blue')}>
              {t('serviceProvider.laundryManagement.form.yourLaundryItems', { count: laundryItems.length })}
            </span>
          </div>
        </div>

        {/* Items List */}
        {laundryItems.length > 0 && (
          <div className="space-y-4">
            {laundryItems.map((item, itemIndex) => (
              <div key={itemIndex} className={sectionCard}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center">
                    <span className="text-2xl mr-3">{item.icon}</span>
                    <div>
                      <h4 className="text-base sm:text-lg font-semibold text-gray-900">
                        {getTranslatedItemName(item.name)}
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-500">
                        {t('serviceProvider.laundryManagement.form.category')}: {getTranslatedCategoryName(item.category)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={item.isAvailable}
                        onChange={(e) => updateItemAvailability(item.name, e.target.checked)}
                        className="h-4 w-4"
                      />
                      <span className={'ml-2 text-sm ' + (item.isAvailable ? 'text-green-700' : 'text-red-700')}>
                        <Icon type={item.isAvailable ? 'available' : 'unavailable'} className="mr-1" />
                        {t(`serviceProvider.laundryManagement.status.${item.isAvailable ? 'available' : 'unavailable'}`)}
                      </span>
                    </label>
                    <button onClick={() => removeItem(item.name)} className="text-red-600 hover:text-red-700">
                      <Icon type="trash" />
                    </button>
                  </div>
                </div>

                {/* Service Types */}
                {item.isAvailable && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {item.serviceTypes.map((st, idx) => {
                      const tmpl = categoryTemplate?.serviceTypes?.find((x) => x.id === st.serviceTypeId);
                      return (
                        <div key={idx} className="rounded-lg border border-gray-100 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-sm">
                              {tmpl?.icon} {getServiceTypeName(st.serviceTypeId)}
                            </h5>
                            <input
                              type="checkbox"
                              checked={!!st.isAvailable}
                              onChange={(e) => updateServiceTypeAvailability(item.name, st.serviceTypeId, e.target.checked)}
                              className="h-4 w-4"
                            />
                          </div>
                          {st.isAvailable && (
                            <div>
                              <label className="block text-[11px] text-gray-500 mb-1">
                                {t('serviceProvider.laundryManagement.form.price')}
                              </label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={st.price}
                                onChange={(e) => updateServiceTypePrice(item.name, st.serviceTypeId, e.target.value)}
                                className={inputBase + ' text-sm'}
                                placeholder={t('serviceProvider.laundryManagement.form.pricePlaceholder')}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Notes */}
                <div className="mt-3">
                  <label className="block text-sm text-gray-700 mb-1">
                    {t('serviceProvider.laundryManagement.form.notes')}
                  </label>
                  <input
                    type="text"
                    value={item.notes}
                    onChange={(e) => updateItemNotes(item.name, e.target.value)}
                    className={inputBase + ' text-sm'}
                    placeholder={t('serviceProvider.laundryManagement.form.notesPlaceholder')}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="flex justify-center">
          <button
            onClick={createService}
            disabled={loading || laundryItems.length === 0}
            className={
              btn.primary +
              ' px-6 py-3 ' +
              (loading || laundryItems.length === 0 ? ' opacity-70 cursor-not-allowed' : '')
            }
          >
            <Icon type="save" className="mr-2" />
            {loading
              ? t('serviceProvider.laundryManagement.messages.creatingService')
              : t('serviceProvider.laundryManagement.messages.createLaundryService')}
          </button>
        </div>
      </div>
    );
  }
};

export default LaundryServiceCreator;
