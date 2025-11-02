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
    'inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white ' +
    'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4A6B] hover:to-[#5BA8CC] ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-300 ' +
    'shadow-lg hover:shadow-xl transform hover:-translate-y-0.5',
  secondary:
    'inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-[#3B5787] ' +
    'bg-white border-2 border-[#3B5787] hover:bg-[#3B5787] hover:text-white focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-300 shadow-md hover:shadow-lg',
  neutral:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 ' +
    'bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-[#67BAE0] transition-all duration-200 shadow-sm',
  danger:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white ' +
    'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 shadow-md hover:shadow-lg',
  warn:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white ' +
    'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-all duration-300 shadow-md hover:shadow-lg',
  success:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-white ' +
    'bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg',
};

const inputBase =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] focus:bg-white ' +
  'hover:border-gray-300 placeholder-gray-400';

const sectionCard =
  'p-6 sm:p-8 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all duration-200 ' +
  'backdrop-blur-sm bg-white/90';

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
  const [currency, setCurrency] = useState('USD'); // Default currency
  const [currencySymbol, setCurrencySymbol] = useState('$'); // Default symbol

  useEffect(() => {
    fetchCategoryTemplate();
    fetchCurrencyFromServices(); // Detect currency on mount
    if (activeTab === 'manage') fetchExistingServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ===== API =====
  const fetchCurrencyFromServices = async () => {
    try {
      const res = await apiClient.get('/service/services?category=laundry');
      let services = [];
      if (res.data?.data?.services) services = res.data.data.services;
      else if (res.data?.services) services = res.data.services;
      else if (Array.isArray(res.data?.data)) services = res.data.data;
      else if (Array.isArray(res.data)) services = res.data;

      // Detect currency from first service
      if (services.length > 0 && services[0].pricing?.currency) {
        const detectedCurrency = services[0].pricing.currency;
        setCurrency(detectedCurrency);
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', SAR: 'SAR', EGP: 'E£' };
        setCurrencySymbol(symbols[detectedCurrency] || '$');
      }
    } catch (err) {
      // Silently fail - will use default USD
      console.log('No existing services found, using default currency');
    }
  };

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

      // Detect currency from first service
      if (services.length > 0 && services[0].pricing?.currency) {
        const detectedCurrency = services[0].pricing.currency;
        setCurrency(detectedCurrency);
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', SAR: 'SAR', EGP: 'E£' };
        setCurrencySymbol(symbols[detectedCurrency] || '$');
      }
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
        pricing: { basePrice: 0, pricingType: 'per-item', currency: currency },
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
            <div className="flex items-center mb-4">
              <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm mr-4">
                <Icon type="tshirt" className="text-3xl" />
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100">
                  {t('serviceProvider.laundryManagement.title')}
                </h1>
                <div className="h-1 w-20 bg-gradient-to-r from-white/60 to-transparent rounded-full mt-2"></div>
              </div>
            </div>
            <p className="text-lg sm:text-xl text-white/90 max-w-2xl leading-relaxed">
              {t('serviceProvider.laundryManagement.description')}
            </p>

            {/* Stats Quick View */}
            <div className="flex flex-wrap gap-6 mt-8">
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                <Icon type="package" className="text-xl mr-2" />
                <span className="text-sm font-medium">
                  {existingServices.length} Services
                </span>
              </div>
              <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-2xl px-4 py-2">
                <Icon type="list" className="text-xl mr-2" />
                <span className="text-sm font-medium">
                  {laundryItems.length} Items Added
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="relative mb-8">
          <div className="flex bg-gray-100 rounded-2xl p-1 max-w-md mx-auto">
            <button
              onClick={() => setActiveTab('manage')}
              className={
                'flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 ' +
                (activeTab === 'manage'
                  ? 'bg-white text-[#3B5787] shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-[#3B5787] hover:bg-white/50')
              }
            >
              <Icon type="list" className="mr-2" />
              {t('serviceProvider.laundryManagement.tabs.manageItems')}
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={
                'flex-1 py-3 px-6 text-sm font-semibold rounded-xl transition-all duration-300 ' +
                (activeTab === 'add'
                  ? 'bg-white text-[#3B5787] shadow-lg transform scale-105'
                  : 'text-gray-600 hover:text-[#3B5787] hover:bg-white/50')
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
    </div>
  );

  // -------- Render Manage Tab --------
  function renderManageItemsTab() {
    if (loading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
          <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
            <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
            <div className="relative flex flex-col items-center">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">{t('serviceProvider.laundryManagement.title')}</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('serviceProvider.laundryManagement.messages.loadingServices')}</p>
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
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {t('serviceProvider.laundryManagement.yourServices')}
            </h3>
            <p className="text-gray-600">
              {t('serviceProvider.laundryManagement.servicesCount', { count: existingServices.length })}
            </p>
          </div>
          <button onClick={() => setActiveTab('add')} className={btn.primary}>
            <Icon type="plus" className="mr-2" />
            {t('serviceProvider.laundryManagement.addNewService')}
          </button>
        </div>

        {/* Responsive Cards Layout */}
        <div className={editingService ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"}>
          {existingServices.map((service) => (
            <div key={service._id} className={
              editingService === service._id
                ? sectionCard + ' w-full max-w-none transition-all duration-300'
                : sectionCard + ' group hover:scale-105 transition-all duration-300 relative overflow-hidden'
            }>
              {/* Background Pattern - only show when not editing */}
              {editingService !== service._id && (
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#67BAE0]/10 to-transparent rounded-bl-full"></div>
              )}

              {editingService === service._id ? (
                // ----- Enhanced Edit Mode -----
                <div className="relative z-10 space-y-6">
                  <div className="text-center mb-4">
                    <h3 className="text-xl font-bold text-gray-900">{t('serviceProvider.laundryManagement.form.editService')}</h3>
                    <p className="text-gray-600">{t('serviceProvider.laundryManagement.form.editServiceDesc')}</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          {t('serviceProvider.laundryManagement.form.serviceName')}
                        </label>
                        <input
                          type="text"
                          value={editFormData.name}
                          onChange={(e) => setEditFormData((p) => ({ ...p, name: e.target.value }))}
                          className={inputBase}
                          placeholder={t('serviceProvider.laundryManagement.form.enterServiceName')}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-800 mb-2">
                          {t('serviceProvider.laundryManagement.form.description')}
                        </label>
                        <textarea
                          rows={4}
                          value={editFormData.description}
                          onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                          className={inputBase}
                          placeholder={t('serviceProvider.laundryManagement.form.descriptionPlaceholder')}
                        />
                      </div>
                    </div>

                    {/* Enhanced Items Pricing */}
                    {editFormData.laundryItems?.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <Icon type="package" className="mr-2" />
                          {t('serviceProvider.laundryManagement.form.itemsPricing')}
                        </h4>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {editFormData.laundryItems.map((item, itemIndex) => (
                            <div key={itemIndex} className="bg-gray-50 rounded-xl border border-gray-200 p-4">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 rounded-lg bg-white border border-gray-200">
                                  <span className="text-2xl">{item.icon}</span>
                                </div>
                                <div>
                                  <h5 className="font-bold text-gray-900">{getTranslatedItemName(item.name)}</h5>
                                  <p className="text-sm text-gray-600">{t('serviceProvider.laundryManagement.form.configurePricing')}</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.serviceTypes?.map((st, stIndex) => (
                                  <div key={stIndex} className="bg-white rounded-lg border border-gray-200 p-3">
                                    <div className="flex items-center justify-between mb-3">
                                      <span className="text-sm font-semibold text-gray-800">
                                        {getServiceTypeName(st.serviceTypeId)}
                                      </span>
                                      <label className="flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!st.isAvailable}
                                          onChange={(e) =>
                                            updateEditingItemAvailability(itemIndex, st.serviceTypeId, e.target.checked)
                                          }
                                          className="sr-only"
                                        />
                                        <div className={
                                          'w-10 h-5 rounded-full transition-colors duration-200 ' +
                                          (st.isAvailable ? 'bg-[#3B5787]' : 'bg-gray-300')
                                        }>
                                          <div className={
                                            'w-4 h-4 bg-white rounded-full transition-transform duration-200 mt-0.5 ' +
                                            (st.isAvailable ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')
                                          }></div>
                                        </div>
                                      </label>
                                    </div>
                                    {st.isAvailable && (
                                      <>
                                        <div className="relative">
                                          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                                          <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={st.price}
                                            onChange={(e) =>
                                              updateEditingItemPrice(itemIndex, st.serviceTypeId, e.target.value)
                                            }
                                            className={inputBase + ' pl-8'}
                                            placeholder="0.00"
                                          />
                                        </div>
                                        {st.price > 0 && (
                                          <p className="text-xs text-gray-500 mt-1">
                                            ({(st.price * 3.75).toFixed(2)} SAR)
                                          </p>
                                        )}
                                      </>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                      <button
                        onClick={() => updateExistingService(service._id)}
                        disabled={loading}
                        className={btn.primary + ' flex-1 sm:flex-none'}
                      >
                        <Icon type="save" className="mr-2" />
                        {t('serviceProvider.laundryManagement.form.saveChanges')}
                      </button>
                      <button
                        onClick={cancelEditing}
                        className={btn.neutral + ' flex-1 sm:flex-none'}
                      >
                        <Icon type="times" className="mr-2" />
                        {t('serviceProvider.laundryManagement.actions.cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                // ----- Modern View Mode -----
                <div className="relative z-10 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Icon type="tshirt" className="text-2xl" />
                        <h4 className="text-xl font-bold text-gray-900">{service.name}</h4>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{service.description}</p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span className={
                        service.isActive
                          ? 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'px-3 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700 border border-red-200'
                      }>
                        {service.isActive ? `● ${t('serviceProvider.laundryManagement.status.active')}` : `● ${t('serviceProvider.laundryManagement.status.inactive')}`}
                      </span>
                    </div>
                  </div>

                  {/* Enhanced Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 rounded-2xl p-4 text-center border border-[#67BAE0]/20">
                      <div className="text-2xl font-bold text-[#3B5787] mb-1">
                        {service.laundryItems?.length || 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {t('serviceProvider.laundryManagement.stats.items')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-4 text-center border border-blue-200">
                      <div className="text-2xl font-bold text-blue-600 mb-1">
                        {service.performance?.totalBookings || service.stats?.bookings || service.totalBookings || 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {t('serviceProvider.laundryManagement.stats.bookings')}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-4 text-center border border-emerald-200">
                      <div className="text-2xl font-bold text-emerald-600 mb-1">
                        ${service.performance?.totalRevenue || service.stats?.revenue || service.totalRevenue || 0}
                      </div>
                      <div className="text-xs text-gray-600 font-medium">
                        {t('serviceProvider.laundryManagement.stats.revenue')}
                      </div>
                    </div>
                  </div>

                  {/* Modern Actions */}
                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                    <button onClick={() => startEditingService(service)} className={btn.secondary + ' flex-1 sm:flex-none'}>
                      <Icon type="edit" className="mr-2" />
                      {t('serviceProvider.laundryManagement.actions.edit')}
                    </button>
                    <button
                      onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                      className={(service.isActive ? btn.warn : btn.success) + ' flex-1 sm:flex-none'}
                    >
                      <Icon type="toggle" className="mr-2" />
                      {service.isActive ? t('serviceProvider.laundryManagement.actions.deactivate') : t('serviceProvider.laundryManagement.actions.activate')}
                    </button>
                    <button
                      onClick={() => deleteExistingService(service._id)}
                      className={btn.danger + ' flex-1 sm:flex-none'}
                    >
                      <Icon type="trash" className="mr-2" />
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
      <div className="space-y-8">
        {/* Modern Service Info Card */}
        <div className={sectionCard + ' relative overflow-hidden'}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#67BAE0]/20 to-transparent rounded-bl-full"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-[#3B5787] to-[#67BAE0] text-white shadow-lg">
                <Icon type="package" className="text-xl" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {t('serviceProvider.laundryManagement.form.serviceInformation')}
                </h3>
                <p className="text-gray-600">
                  {t('serviceProvider.laundryManagement.form.serviceInformationDesc')}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
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
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-gray-800 mb-2">
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
            <div className="mt-6">
              <label className="block text-sm font-semibold text-gray-800 mb-2">
                {t('serviceProvider.laundryManagement.form.fullDescription')}
              </label>
              <textarea
                rows={4}
                value={serviceDetails.description}
                onChange={(e) => setServiceDetails((p) => ({ ...p, description: e.target.value }))}
                className={inputBase}
                placeholder={t('serviceProvider.laundryManagement.form.fullDescriptionPlaceholder')}
              />
            </div>
          </div>
        </div>

        {/* Modern Add Items Section */}
        <div className={sectionCard + ' relative overflow-hidden bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/5 border-2 border-[#67BAE0]/20'}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-gradient-to-bl from-[#67BAE0]/20 to-transparent rounded-full blur-xl"></div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 rounded-2xl bg-white shadow-lg border border-[#67BAE0]/30">
                <Icon type="plus" className="text-xl text-[#3B5787]" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">
                  {t('serviceProvider.laundryManagement.form.addLaundryItems')}
                </h3>
                <p className="text-gray-600">
                  {t('serviceProvider.laundryManagement.form.addLaundryItemsDesc')}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
              <div className="flex-1">
                <select
                  onChange={(e) => addItemFromDropdown(e.target.value)}
                  className={inputBase + ' text-base font-medium'}
                  value=""
                >
                  <option value="">{t('serviceProvider.laundryManagement.form.selectItemToAdd')}</option>
                  {availableItems.map((it, idx) => (
                    <option key={idx} value={it.name}>
                      {it.icon} {getTranslatedItemName(it.name)} ({getTranslatedCategoryName(it.category)})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-xl border border-[#67BAE0]/30 shadow-sm">
                <Icon type="list" className="text-[#3B5787]" />
                <span className="font-semibold text-[#3B5787]">
                  {t('serviceProvider.laundryManagement.form.itemsAdded', { count: laundryItems.length })}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Items List */}
        {laundryItems.length > 0 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                Configure Your Items
              </h3>
              <p className="text-gray-600">
                Set pricing and availability for each item
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {laundryItems.map((item, itemIndex) => (
                <div key={itemIndex} className={sectionCard + ' group hover:shadow-xl transition-all duration-300 relative overflow-hidden'}>
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 border border-[#67BAE0]/20">
                        <span className="text-3xl">{item.icon}</span>
                      </div>
                      <div>
                        <h4 className="text-xl font-bold text-gray-900">
                          {getTranslatedItemName(item.name)}
                        </h4>
                        <p className="text-sm text-gray-500">
                          Category: {getTranslatedCategoryName(item.category)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.isAvailable}
                          onChange={(e) => updateItemAvailability(item.name, e.target.checked)}
                          className="sr-only"
                        />
                        <div className={
                          'relative w-12 h-6 rounded-full transition-colors duration-200 ' +
                          (item.isAvailable ? 'bg-green-500' : 'bg-gray-300')
                        }>
                          <div className={
                            'absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform duration-200 ' +
                            (item.isAvailable ? 'translate-x-6' : 'translate-x-0')
                          }></div>
                        </div>
                        <span className={
                          'ml-3 text-sm font-medium ' +
                          (item.isAvailable ? 'text-green-700' : 'text-gray-500')
                        }>
                          {item.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </label>
                      <button
                        onClick={() => removeItem(item.name)}
                        className="p-2 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                      >
                        <Icon type="trash" />
                      </button>
                    </div>
                  </div>

                  {/* Service Types */}
                  {item.isAvailable && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {item.serviceTypes.map((st, idx) => {
                        const tmpl = categoryTemplate?.serviceTypes?.find((x) => x.id === st.serviceTypeId);
                        return (
                          <div key={idx} className="rounded-xl border border-gray-100 p-4 bg-gray-50/50 hover:bg-white transition-colors">
                            <div className="flex items-center justify-between mb-3">
                              <h5 className="font-semibold text-gray-800 flex items-center">
                                <span className="mr-2">{tmpl?.icon}</span>
                                {getServiceTypeName(st.serviceTypeId)}
                              </h5>
                              <label className="flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={!!st.isAvailable}
                                  onChange={(e) => updateServiceTypeAvailability(item.name, st.serviceTypeId, e.target.checked)}
                                  className="sr-only"
                                />
                                <div className={
                                  'w-10 h-5 rounded-full transition-colors duration-200 ' +
                                  (st.isAvailable ? 'bg-[#3B5787]' : 'bg-gray-300')
                                }>
                                  <div className={
                                    'w-4 h-4 bg-white rounded-full transition-transform duration-200 mt-0.5 ' +
                                    (st.isAvailable ? 'translate-x-5 ml-0.5' : 'translate-x-0.5')
                                  }></div>
                                </div>
                              </label>
                            </div>
                            {st.isAvailable && (
                              <>
                                <div>
                                  <label className="block text-xs font-medium text-gray-600 mb-2">
                                    Price ({currency})
                                  </label>
                                  <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">{currencySymbol}</span>
                                    <input
                                      type="number"
                                      min="0"
                                      step="0.01"
                                      value={st.price}
                                      onChange={(e) => updateServiceTypePrice(item.name, st.serviceTypeId, e.target.value)}
                                      className={inputBase + ' pl-8'}
                                      placeholder="0.00"
                                    />
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Notes */}
                  <div className="mt-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Special Notes
                    </label>
                    <input
                      type="text"
                      value={item.notes}
                      onChange={(e) => updateItemNotes(item.name, e.target.value)}
                      className={inputBase}
                      placeholder="Any special instructions or notes..."
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modern CTA Section */}
        <div className="text-center">
          <div className="inline-flex flex-col items-center">
            <button
              onClick={createService}
              disabled={loading || laundryItems.length === 0}
              className={
                loading || laundryItems.length === 0
                  ? 'inline-flex items-center justify-center px-8 py-4 rounded-2xl text-lg font-bold text-gray-400 bg-gray-100 cursor-not-allowed'
                  : btn.primary + ' px-8 py-4 text-lg font-bold rounded-2xl shadow-2xl hover:shadow-3xl transform hover:-translate-y-1'
              }
            >
              {loading ? (
                <>
                  <div className="animate-spin h-5 w-5 border-2 border-white/30 border-t-white rounded-full mr-3" />
                  Creating Service...
                </>
              ) : (
                <>
                  <Icon type="save" className="mr-3 text-xl" />
                  Create Laundry Service
                </>
              )}
            </button>
            {laundryItems.length === 0 && (
              <p className="text-sm text-gray-500 mt-3">
                Add at least one item to create your service
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }
};

export default LaundryServiceCreator;
