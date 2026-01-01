/**
 * Enhanced Laundry Service Management System (Modern + Responsive) - JS version
 * - Modern UI with #66CFFF primary color
 * - React Icons instead of Emojis
 * - Gradient Header & Clean Cards
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import {
  FiPlus, FiEdit2, FiTrash2, FiSave, FiX,
  FiPackage, FiList, FiCheck, FiToggleLeft, FiToggleRight,
  FiSearch, FiFilter
} from 'react-icons/fi';
import { FaTshirt } from 'react-icons/fa';
import apiClient from '../../services/api.service';

// Brand Constants
const BRAND_COLOR = '#66CFFF';
const BRAND_GRADIENT = 'from-[#66CFFF] to-[#3B82F6]'; // Gradient from brand to a deeper blue for depth

// Reusable UI helpers
const badgeClass = (isActive) =>
  `inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${
    isActive
      ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
      : 'bg-red-50 text-red-600 border-red-100'
  }`;

const btn = {
  primary:
    'inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-white ' +
    'bg-[#66CFFF] hover:bg-[#5bb8e4] text-white ' +
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66CFFF] transition-all duration-300 ' +
    'shadow-lg shadow-blue-200 hover:shadow-xl transform hover:-translate-y-0.5',
  secondary:
    'inline-flex items-center justify-center px-6 py-3 rounded-xl text-sm font-semibold text-gray-700 ' +
    'bg-white border border-gray-200 hover:bg-gray-50 focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-[#66CFFF] transition-all duration-300 shadow-sm hover:shadow-md',
  danger:
    'inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-sm font-medium text-red-600 ' +
    'bg-red-50 hover:bg-red-100 focus:outline-none ' +
    'focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300',
  icon:
    'p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors duration-200'
};

const inputBase =
  'w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm transition-all duration-200 ' +
  'focus:outline-none focus:ring-2 focus:ring-[#66CFFF] focus:border-[#66CFFF] focus:bg-white ' +
  'hover:border-gray-300 placeholder-gray-400';

const sectionCard =
  'p-6 sm:p-8 rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-200';

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
  const [currency, setCurrency] = useState('USD');
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    fetchCategoryTemplate();
    fetchCurrencyFromServices();
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

      if (services.length > 0 && services[0].pricing?.currency) {
        const detectedCurrency = services[0].pricing.currency;
        setCurrency(detectedCurrency);
        const symbols = { USD: '$', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$', SAR: 'SAR', EGP: 'E£' };
        setCurrencySymbol(symbols[detectedCurrency] || '$');
      }
    } catch (err) {
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
      setActiveTab('manage'); // Switch to manage tab after creation
      fetchExistingServices();
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
      icon: tmplItem.icon, // Keeping original icon if it's not an emoji string we can't use, otherwise relies on getIconForCategory
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

  // Helper to get React Icon based on category or name if needed, or fallback
  // Since original template might rely on emojis, we'll try to map them or just use generic
  const getItemIcon = (name) => {
      // You could add a mapping logic here if the API provides specific item types
      return <FiPackage className="text-[#66CFFF]" />;
  };

  // ===== UI =====
  if (loading && !categoryTemplate) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#66CFFF] mb-4"></div>
        <p className="text-gray-500 font-medium">{t('serviceProvider.laundryManagement.messages.loadingTemplate')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-6">

        {/* New Header Design */}
        <div className="relative overflow-hidden rounded-2xl bg-[#5BB8E4] p-8 sm:p-10 mb-8 shadow-xl">
           {/* Abstract shapes overlay */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"></div>
           <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#66CFFF]/20 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl"></div>

           <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex items-start gap-5">
               <div className="p-4 bg-white/10 rounded-2xl backdrop-blur-sm shadow-inner border border-white/10">
                 <FaTshirt className="text-4xl text-white" />
               </div>
               <div>
                 <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
                   {t('serviceProvider.laundryManagement.title')}
                 </h1>
                 <p className="text-blue-100/90 text-lg max-w-xl font-light">
                   {t('serviceProvider.laundryManagement.description')}
                 </p>
               </div>
             </div>

             {/* Stats Pills */}
             <div className="flex md:flex-col gap-3">
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <div className="bg-[#66CFFF]/20 p-1.5 rounded-lg">
                    <FiPackage className="text-white" />
                  </div>
                  <div>
                    <span className="block text-white font-bold text-lg leading-none">{existingServices.length}</span>
                    <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">Services</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/10">
                  <div className="bg-[#66CFFF]/20 p-1.5 rounded-lg">
                    <FiList className="text-white" />
                  </div>
                  <div>
                    <span className="block text-white font-bold text-lg leading-none">{laundryItems.length}</span>
                    <span className="text-blue-200 text-xs font-medium uppercase tracking-wider">Items in Draft</span>
                  </div>
                </div>
             </div>
           </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex mb-8 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('manage')}
            className={`
              pb-4 px-6 text-sm font-semibold transition-all duration-300 flex items-center gap-2 relative
              ${activeTab === 'manage' ? 'text-[#66CFFF]' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <FiList className="text-lg" />
            {t('serviceProvider.laundryManagement.tabs.manageItems')}
            {activeTab === 'manage' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#66CFFF] rounded-t-full"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`
              pb-4 px-6 text-sm font-semibold transition-all duration-300 flex items-center gap-2 relative
              ${activeTab === 'add' ? 'text-[#66CFFF]' : 'text-gray-500 hover:text-gray-700'}
            `}
          >
            <FiPlus className="text-lg" />
            {t('serviceProvider.laundryManagement.tabs.addItems')}
            {activeTab === 'add' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#66CFFF] rounded-t-full"></span>
            )}
          </button>
        </div>

        {/* Content Area */}
        {activeTab === 'manage' ? renderManageItemsTab() : renderAddItemsTab()}

      </div>
    </div>
  );

  // -------- Render Manage Tab --------
  function renderManageItemsTab() {
    if (loading) {
      return (
        <div className="flex justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-[#66CFFF]"></div>
        </div>
      );
    }

    if (existingServices.length === 0) {
      return (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="mx-auto w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4">
            <FaTshirt className="text-3xl text-[#66CFFF]" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {t('serviceProvider.laundryManagement.messages.noServicesFound')}
          </h3>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            You haven’t setup any laundry services yet. Get started by adding your first service package.
          </p>
          <button onClick={() => setActiveTab('add')} className={btn.primary}>
            <FiPlus className="mr-2 h-5 w-5" />
            Create Your First Service
          </button>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
           <h2 className="text-xl font-bold text-gray-800">Your Services</h2>
           <button onClick={() => setActiveTab('add')} className={btn.primary}>
              <FiPlus className="mr-2" />
              Add New
           </button>
        </div>

        <div className={editingService ? "space-y-6" : "grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6"}>
          {existingServices.map((service) => (
            <div key={service._id} className={
              editingService === service._id
                ? 'col-span-full ' + sectionCard
                : sectionCard + ' group hover:border-[#66CFFF]/50 hover:shadow-md'
            }>
              {editingService === service._id ? (
                // ----- Edit Mode -----
                <div className="space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <div className="p-2 bg-[#66CFFF]/10 rounded-lg">
                        <FiEdit2 className="text-[#66CFFF]" />
                      </div>
                      Edit Service
                    </h3>
                    <button onClick={cancelEditing} className="text-gray-400 hover:text-gray-600">
                      <FiX size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
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
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {t('serviceProvider.laundryManagement.form.description')}
                      </label>
                      <textarea
                        rows={3}
                        value={editFormData.description}
                        onChange={(e) => setEditFormData((p) => ({ ...p, description: e.target.value }))}
                        className={inputBase}
                      />
                    </div>

                    {/* Items List for Editing */}
                    <div className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                        <FiList className="text-[#66CFFF]" />
                        Service Items & Pricing
                      </h4>
                      <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {editFormData.laundryItems.map((item, itemIndex) => (
                           <div key={itemIndex} className="bg-white p-4 rounded-xl border border-gray-200">
                              <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-blue-50 rounded-lg text-2xl">
                                  {/* Just show icon here if available or generic */}
                                  {item.icon ? item.icon : <FiPackage className="text-[#66CFFF]" />}
                                </div>
                                <span className="font-bold text-gray-800">{getTranslatedItemName(item.name)}</span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {item.serviceTypes?.map((st, stIndex) => (
                                  <div key={stIndex} className={`
                                    p-3 rounded-xl border transition-all duration-200
                                    ${st.isAvailable ? 'border-[#66CFFF]/30 bg-[#66CFFF]/5' : 'border-gray-100 bg-gray-50'}
                                  `}>
                                    <div className="flex items-center justify-between mb-2">
                                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-600">
                                        {getServiceTypeName(st.serviceTypeId)}
                                      </span>
                                      <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                          type="checkbox"
                                          checked={!!st.isAvailable}
                                          onChange={(e) => updateEditingItemAvailability(itemIndex, st.serviceTypeId, e.target.checked)}
                                          className="sr-only peer"
                                        />
                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#66CFFF]"></div>
                                      </label>
                                    </div>

                                    {st.isAvailable && (
                                      <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">$</span>
                                        <input
                                          type="number"
                                          min="0"
                                          step="0.01"
                                          value={st.price}
                                          onChange={(e) => updateEditingItemPrice(itemIndex, st.serviceTypeId, e.target.value)}
                                          className="w-full pl-7 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-[#66CFFF]"
                                        />
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                           </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 pt-4 border-t border-gray-100">
                    <button onClick={() => updateExistingService(service._id)} className={btn.primary}>
                      <FiSave className="mr-2" />
                      Save Changes
                    </button>
                    <button onClick={cancelEditing} className={btn.secondary}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // ----- View Mode -----
                <div className="flex flex-col h-full">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[#66CFFF]/10 rounded-xl text-[#66CFFF]">
                        <FaTshirt size={20} />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900 text-lg leading-tight">{service.name}</h4>
                        <span className={badgeClass(service.isActive) + ' mt-1'}>
                           {service.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-1">
                      <button onClick={() => startEditingService(service)} className={btn.icon} title="Edit">
                        <FiEdit2 size={18} />
                      </button>
                      <button onClick={() => deleteExistingService(service._id)} className={btn.icon + ' text-red-400 hover:text-red-500 hover:bg-red-50'} title="Delete">
                        <FiTrash2 size={18} />
                      </button>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-6 flex-grow">
                    {service.description || 'No description provided.'}
                  </p>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <span className="block text-2xl font-bold text-[#66CFFF]">
                        {service.laundryItems?.length || 0}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">Items Configured</span>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <span className="block text-2xl font-bold text-gray-800">
                        {service.performance?.totalBookings || 0}
                      </span>
                      <span className="text-xs text-gray-500 font-medium">Total Bookings</span>
                    </div>
                  </div>

                  <button
                     onClick={() => toggleServiceAvailability(service._id, service.isActive)}
                     className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-colors
                       ${service.isActive
                         ? 'text-red-600 bg-red-50 hover:bg-red-100'
                         : 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100'
                       }
                     `}
                  >
                     {service.isActive ? 'Deactivate Service' : 'Activate Service'}
                  </button>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Col: Service Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className={sectionCard}>
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
              <div className="p-2 bg-[#66CFFF]/10 rounded-lg">
                <FiPackage className="text-[#66CFFF]" />
              </div>
              Basic Information
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Service Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={serviceDetails.name}
                  onChange={(e) => setServiceDetails(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Express Laundry"
                  className={inputBase}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={serviceDetails.description}
                  onChange={(e) => setServiceDetails(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe your service package..."
                  className={inputBase}
                />
              </div>
            </div>
          </div>

          <div className={sectionCard}>
             <div className="flex items-center justify-between mb-6">
               <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-[#66CFFF]/10 rounded-lg">
                    <FiList className="text-[#66CFFF]" />
                  </div>
                  Items in Package
               </h3>
             </div>

             {/* Add Item Dropdown Area */}
             <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Add Item to Package
                </label>
                <div className="flex gap-2">
                  <select
                    className={inputBase}
                    onChange={(e) => {
                      if(e.target.value) {
                        addItemFromDropdown(e.target.value);
                        e.target.value = ""; // Reset select
                      }
                    }}
                    defaultValue=""
                  >
                    <option value="" disabled>Select an item to add...</option>
                    {categoryTemplate?.categories && categoryTemplate.categories.length > 0 ? (
                      // Render by categories if available
                      categoryTemplate.categories.map(cat => {
                        const catItems = availableItems.filter(i => i.category === cat.id);
                        if (catItems.length === 0) return null;

                        return (
                          <optgroup key={cat.id} label={getTranslatedCategoryName(cat.name)}>
                            {catItems.map(item => (
                              <option
                                key={item.name}
                                value={item.name}
                                disabled={laundryItems.some(i => i.name === item.name)}
                              >
                                {getTranslatedItemName(item.name)} {laundryItems.some(i => i.name === item.name) ? '(Added)' : ''}
                              </option>
                            ))}
                          </optgroup>
                        );
                      })
                    ) : (
                      // Fallback: show all available items without categories
                      availableItems.map(item => (
                        <option
                          key={item.name}
                          value={item.name}
                          disabled={laundryItems.some(i => i.name === item.name)}
                        >
                          {getTranslatedItemName(item.name)} {laundryItems.some(i => i.name === item.name) ? '(Added)' : ''}
                        </option>
                      ))
                    )}
                  </select>
                </div>
             </div>

             {laundryItems.length === 0 && (
               <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
                 <p className="text-gray-500 text-sm">No items added yet. Select items above or from the panel.</p>
               </div>
             )}

             {laundryItems.length > 0 && (
               <div className="space-y-4">
                 {laundryItems.map((item, index) => (
                   <div key={index} className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                     <div className="flex justify-between items-start mb-4 pb-4 border-b border-gray-50">
                        <div className="flex items-center gap-3">
                           <div className="text-2xl p-2 bg-gray-50 rounded-lg">
                             {item.icon ? item.icon : <FiPackage className="text-gray-400" />}
                           </div>
                           <div>
                             <h4 className="font-bold text-gray-800">{getTranslatedItemName(item.name)}</h4>
                             <p className="text-xs text-gray-500">{item.category}</p>
                           </div>
                        </div>
                        <button onClick={() => removeItem(item.name)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg transition-colors">
                           <FiTrash2 />
                        </button>
                     </div>

                     {/* Services for this item */}
                     <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {item.serviceTypes.map((st) => (
                          <div key={st.serviceTypeId} className={`p-3 rounded-lg border transition-all ${
                            st.isAvailable
                              ? 'border-[#66CFFF]/30 bg-[#66CFFF]/5'
                              : 'border-gray-100 bg-gray-50 opacity-60'
                          }`}>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-[10px] font-bold uppercase text-gray-500">{getServiceTypeName(st.serviceTypeId)}</span>
                              <input
                                type="checkbox"
                                checked={st.isAvailable}
                                onChange={(e) => updateServiceTypeAvailability(item.name, st.serviceTypeId, e.target.checked)}
                                className="w-4 h-4 rounded text-[#66CFFF] focus:ring-[#66CFFF] border-gray-300"
                              />
                            </div>
                            {st.isAvailable && (
                              <div className="relative">
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-gray-400">$</span>
                                <input
                                  type="number"
                                   min="0"
                                   step="0.01"
                                   value={st.price}
                                   onChange={(e) => updateServiceTypePrice(item.name, st.serviceTypeId, e.target.value)}
                                   className="w-full pl-5 py-1 text-sm bg-white border border-gray-200 rounded focus:border-[#66CFFF] focus:outline-none"
                                />
                              </div>
                            )}
                          </div>
                        ))}
                     </div>
                   </div>
                 ))}
               </div>
             )}

             <div className="mt-8 pt-6 border-t border-gray-100 flex justify-end">
               <button onClick={createService} disabled={loading} className={btn.primary + ' w-full sm:w-auto'}>
                  {loading ? (
                    <span className="flex items-center">
                       <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                       Saving...
                    </span>
                  ) : (
                    <>
                      <FiSave className="mr-2" />
                      Save Complete Service
                    </>
                  )}
               </button>
             </div>
          </div>
        </div>

        {/* Right Col: Item Palette */}
        <div className="lg:col-span-1">
           <div className={sectionCard + ' sticky top-6'}>
             <h3 className="font-bold text-gray-900 mb-4">Add Items</h3>
             <div className="relative mb-4">
               <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
               <input
                 type="text"
                 placeholder="Search items..."
                 className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm focus:ring-2 focus:ring-[#66CFFF]"
               />
             </div>

             <div className="space-y-6 max-h-[calc(100vh-300px)] overflow-y-auto pr-2 custom-scrollbar">
               {categoryTemplate?.categories?.map(cat => {
                 // Filter items for this category
                 const catItems = availableItems.filter(i => i.category === cat.id);
                 if (catItems.length === 0) return null;

                 return (
                   <div key={cat.id}>
                     <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                       {getTranslatedCategoryName(cat.name)}
                     </h4>
                     <div className="grid grid-cols-2 gap-2">
                        {catItems.map(item => {
                          const isAdded = laundryItems.some(i => i.name === item.name);
                          return (
                             <button
                               key={item.name}
                               onClick={() => addItemFromDropdown(item.name)}
                               disabled={isAdded}
                               className={`
                                 flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200
                                 ${isAdded
                                   ? 'bg-[#66CFFF]/10 border-[#66CFFF]/20 opacity-50 cursor-default'
                                   : 'bg-white border-gray-100 hover:border-[#66CFFF] hover:shadow-md'
                                 }
                               `}
                             >
                               <div className="text-2xl mb-1">{item.icon}</div>
                               <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                                 {getTranslatedItemName(item.name)}
                               </span>
                               {isAdded && <FiCheck className="text-[#66CFFF] text-xs mt-1" />}
                             </button>
                          );
                        })}
                     </div>
                   </div>
                 );
               })}
             </div>
           </div>
        </div>

      </div>
    );
  }
};

export default LaundryServiceCreator;
