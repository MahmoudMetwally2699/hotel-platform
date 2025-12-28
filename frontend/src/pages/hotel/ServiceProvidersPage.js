import React, { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceProviders, selectServiceProviders, selectServiceProviderLoading, setServiceProviderMarkup } from '../../redux/slices/serviceSlice';
import AddServiceProviderModal from '../../components/hotel/AddServiceProviderModal';
import apiClient from '../../services/api.service';
import hotelService from '../../services/hotel.service';
import { HOTEL_ADMIN_API } from '../../config/api.config';
import { toast } from 'react-toastify';
import { useTheme } from '../../context/ThemeContext';

/**
 * Hotel Admin Service Providers Management Page
 * @returns {JSX.Element} Service providers management page
 */
const ServiceProvidersPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const serviceProviders = useSelector(selectServiceProviders) || [];
  const isLoading = useSelector(selectServiceProviderLoading);  const { theme } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoriesModalOpen, setIsCategoriesModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [markupValue, setMarkupValue] = useState('');
  const [markupNotes, setMarkupNotes] = useState('');
  const [isSavingMarkup, setIsSavingMarkup] = useState(false);
  const [isSavingCategories, setIsSavingCategories] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [isSavingLicense, setIsSavingLicense] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0, isAbove: false });
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Available service categories (only the specified ones)
  const serviceCategories = [
    { id: 'laundry', name: t('hotelAdmin.serviceProviders.categories.laundry'), icon: '👕', description: t('hotelAdmin.serviceProviders.categories.laundryDesc') },
    { id: 'transportation', name: t('hotelAdmin.serviceProviders.categories.transportation'), icon: '🚗', description: t('hotelAdmin.serviceProviders.categories.transportationDesc') },
    { id: 'dining', name: t('hotelAdmin.serviceProviders.categories.dining'), icon: '🍽️', description: t('hotelAdmin.serviceProviders.categories.diningDesc') },
    { id: 'housekeeping', name: t('hotelAdmin.serviceProviders.categories.housekeeping'), icon: '🧹', description: t('hotelAdmin.serviceProviders.categories.housekeepingDesc') }
  ];

  useEffect(() => {
    dispatch(fetchServiceProviders({}));
  }, [dispatch]);  // Filter service providers by search term
  const filteredProviders = serviceProviders.filter(provider => {
    const matchesSearch = searchTerm === '' ||
      (provider.businessName && provider.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (provider.email && provider.email.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesSearch;
  });
  // Handle setting markup for a service provider
  const handleSetMarkup = (provider) => {
    // Prevent setting markup for internal providers
    if (provider.providerType === 'internal') {
      toast.error('Cannot set markup for internal providers. Internal providers always have 0% markup as all revenue goes directly to the hotel.');
      return;
    }

    setSelectedProvider(provider);
    setMarkupValue(provider.markup?.percentage || '');
    setMarkupNotes(provider.markup?.notes || '');
    setIsModalOpen(true);
  };

  // Handle managing service categories for a service provider
  const handleManageCategories = (provider) => {
    setSelectedProvider(provider);
    setSelectedCategories(provider.categories || []);
    setIsCategoriesModalOpen(true);
  };

  // Handle opening update license modal
  const handleUpdateLicense = (provider) => {
    setSelectedProvider(provider);
    const d = provider?.businessLicense?.expiryDate ? new Date(provider.businessLicense.expiryDate) : null;
    const yyyyMmDd = d ? new Date(d.getTime() - d.getTimezoneOffset()*60000).toISOString().slice(0,10) : '';
    setLicenseExpiry(yyyyMmDd);
    setIsLicenseModalOpen(true);
  };

  // Handle opening reset password modal
  const handleResetPassword = (provider) => {
    setSelectedProvider(provider);
    setNewPassword('');
    setConfirmPassword('');
    setIsResetPasswordModalOpen(true);
  };

  // Handle password reset confirmation
  const handleConfirmPasswordReset = async () => {
    if (!selectedProvider) return;

    // Validate password inputs
    if (!newPassword.trim()) {
      toast.error(t('hotelAdmin.serviceProviders.passwordReset.errors.passwordRequired'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('hotelAdmin.serviceProviders.passwordReset.errors.passwordTooShort'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('hotelAdmin.serviceProviders.passwordReset.errors.passwordMismatch'));
      return;
    }

    setIsResettingPassword(true);
    try {
      await hotelService.resetServiceProviderPassword(selectedProvider._id, newPassword);

      setIsResetPasswordModalOpen(false);
      setSelectedProvider(null);
      setNewPassword('');
      setConfirmPassword('');

      toast.success(t('hotelAdmin.serviceProviders.passwordReset.success', {
        businessName: selectedProvider.businessName
      }));
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('hotelAdmin.serviceProviders.passwordReset.error');
      toast.error(errorMessage);
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Handle category selection change
  const handleCategoryChange = (categoryId, isChecked) => {
    setSelectedCategories(prev =>
      isChecked
        ? [...(prev || []), categoryId]
        : (prev || []).filter(id => id !== categoryId)
    );
  };

  // Handle opening add provider modal
  const handleAddProvider = () => {
    setIsAddModalOpen(true);
  };  // Handle successful provider creation
  const handleProviderCreated = (newProvider) => {
    // Refresh the service providers list
    dispatch(fetchServiceProviders({}));
  };

  // Handle saving markup
  const handleSaveMarkup = async () => {
    if (!selectedProvider) return;

    const percentage = parseFloat(markupValue);
    if (isNaN(percentage) || percentage < 0 || percentage > 100) {
      alert('Please enter a valid markup percentage between 0 and 100');
      return;
    }

    setIsSavingMarkup(true);
    try {
      await dispatch(setServiceProviderMarkup({
        providerId: selectedProvider._id,
        percentage,
        notes: markupNotes
      })).unwrap();

      setIsModalOpen(false);
      setMarkupValue('');
      setMarkupNotes('');
    } catch (error) {
      const backendMsg = error?.response?.data?.message
        || error?.response?.data?.error
        || error?.message
        || (typeof error === 'string' ? error : '');
      const licenseRelated = /license|licen[cs]e|expiry|expiration|expired/i.test(backendMsg || '');
      // Optional: log for debugging in dev
      // eslint-disable-next-line no-console
      console.error('Set markup failed:', backendMsg, error);
      if (licenseRelated) {
        // Close markup modal and open the license update flow
        setIsModalOpen(false);
        alert(t('hotelAdmin.serviceProviders.errors.updateLicenseFirst'));
        handleUpdateLicense(selectedProvider);
      } else {
        alert(t('hotelAdmin.serviceProviders.errors.markupSetFailed'));
      }
    } finally {
      setIsSavingMarkup(false);
    }
  };

  // Handle saving service categories
  const handleSaveCategories = async () => {
    if (!selectedProvider) return;

    setIsSavingCategories(true);
    try {
      await apiClient.put(`${HOTEL_ADMIN_API.SERVICE_PROVIDERS}/${selectedProvider._id}/categories`, {
        selectedCategories: selectedCategories
      });

      // Close modal and refresh data
      setIsCategoriesModalOpen(false);
      dispatch(fetchServiceProviders({}));
    } catch (error) {
      alert(t('hotelAdmin.serviceProviders.errors.categoriesUpdateFailed'));
    } finally {
      setIsSavingCategories(false);
    }
  };

  // Handle saving license expiry
  const handleSaveLicense = async () => {
    if (!selectedProvider) return;
    if (!licenseExpiry) {
      toast.error(t('hotelAdmin.serviceProviders.licenseModal.errors.dateRequired'));
      return;
    }
    const chosen = new Date(licenseExpiry);
    const today = new Date();
    today.setHours(0,0,0,0);
    if (chosen <= today) {
      toast.error(t('hotelAdmin.serviceProviders.licenseModal.errors.futureDate'));
      return;
    }
    setIsSavingLicense(true);
    try {
      await hotelService.updateServiceProviderLicense(selectedProvider._id, { expiryDate: licenseExpiry });
      setIsLicenseModalOpen(false);
      setSelectedProvider(null);
      setLicenseExpiry('');
      dispatch(fetchServiceProviders({}));
      toast.success(t('hotelAdmin.serviceProviders.licenseModal.success'));
    } catch (error) {
      const msg = error.response?.data?.message || t('hotelAdmin.serviceProviders.licenseModal.error');
      toast.error(msg);
    } finally {
      setIsSavingLicense(false);
    }
  };

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: theme.backgroundColor }}>
      {/* Modern Header Section */}
      <div className="bg-white shadow-lg border-b border-gray-100">
        <div className="w-full px-6 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold" style={{ color: theme.primaryColor }}>{t('hotelAdmin.serviceProviders.title')}</h1>
              <p className="text-modern-darkGray mt-1">{t('hotelAdmin.serviceProviders.subtitle')}</p>
            </div>
            <button
              onClick={handleAddProvider}
              className="text-white px-6 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium flex items-center space-x-2"
              style={{ backgroundColor: theme.primaryColor }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>{t('hotelAdmin.serviceProviders.addProvider')}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-4 py-8">        {/* Search Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50 mb-8">
          <div className="px-8 py-6" style={{ backgroundColor: theme.primaryColor }}>
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {t('hotelAdmin.serviceProviders.searchTitle')}
            </h2>
            <p className="text-blue-100 mt-1">{t('hotelAdmin.serviceProviders.searchSubtitle')}</p>
          </div>
          <div className="p-6">
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    type="text"
                    placeholder={t('hotelAdmin.serviceProviders.searchPlaceholder')}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-modern-blue focus:ring-2 focus:ring-modern-blue focus:ring-opacity-20 transition-all duration-300"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={() => dispatch(fetchServiceProviders({}))}
                className="text-white px-8 py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-300 font-medium flex items-center space-x-2"
                style={{ backgroundColor: theme.primaryColor }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>{t('hotelAdmin.serviceProviders.refresh')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modern Service Providers Table */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-50">
          <div className="px-8 py-6" style={{ backgroundColor: theme.primaryColor }}>
            <h2 className="text-xl font-bold text-white flex items-center">
              <svg className="w-6 h-6 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              {t('hotelAdmin.serviceProviders.tableTitle', { count: filteredProviders.length })}
            </h2>
            <p className="text-blue-100 mt-1">{t('hotelAdmin.serviceProviders.tableSubtitle')}</p>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="relative">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-modern-lightBlue border-t-transparent"></div>
                <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-modern-blue border-t-transparent animate-ping opacity-20"></div>
              </div>
            </div>
          ) : filteredProviders.length === 0 ? (
            <div className="py-20 text-center">
              <div className="text-modern-darkGray">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">{t('hotelAdmin.serviceProviders.noProviders')}</h3>
                <p className="text-sm text-gray-500">
                  {searchTerm ? t('hotelAdmin.serviceProviders.noProvidersSearch') : t('hotelAdmin.serviceProviders.noProvidersYet')}
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                <style>{`.sp-hide-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                <div className="min-w-full inline-block align-middle sp-hide-scrollbar">
                  <table className="min-w-full divide-y divide-gray-200">                    <thead style={{ backgroundColor: theme.backgroundColor }}>
                      <tr>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider min-w-[200px]" style={{ color: theme.primaryColor }}>{t('hotelAdmin.serviceProviders.table.businessName')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider min-w-[100px]" style={{ color: theme.primaryColor }}>Provider Type</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider min-w-[180px]" style={{ color: theme.primaryColor }}>{t('hotelAdmin.serviceProviders.table.contact')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider min-w-[100px]" style={{ color: theme.primaryColor }}>{t('hotelAdmin.serviceProviders.table.status')}</th>
                        <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider min-w-[120px]" style={{ color: theme.primaryColor }}>{t('hotelAdmin.serviceProviders.table.markup')}</th>
                        <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider min-w-[120px] sticky right-0 z-10 shadow-sm" style={{ color: theme.primaryColor, backgroundColor: theme.backgroundColor }}>{t('hotelAdmin.serviceProviders.table.actions')}</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredProviders.map((provider) => (
                        <tr
                          key={provider._id}
                          className="transition-colors duration-200"
                          onMouseEnter={(e) => e.currentTarget.style.backgroundColor = theme.backgroundColor}
                          onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                        >
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              <div className="h-10 w-10 rounded-full flex items-center justify-center text-white font-bold" style={{ backgroundColor: theme.primaryColor }}>
                                {provider.businessName?.charAt(0) || 'P'}
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-semibold text-gray-900 truncate max-w-[150px]">
                                  {provider.businessName || t('hotelAdmin.serviceProviders.notAvailable')}
                                </div>
                                <div className="text-xs text-modern-darkGray truncate max-w-[150px]">
                                  {provider.description?.substring(0, 40) || t('hotelAdmin.serviceProviders.noDescription')}...
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              provider.providerType === 'internal'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {provider.providerType === 'internal' ? 'Internal' : 'External'}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            <div className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                              {provider.email || t('hotelAdmin.serviceProviders.notAvailable')}
                            </div>
                            <div className="text-xs text-modern-darkGray">
                              {provider.phone || t('hotelAdmin.serviceProviders.noPhone')}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                              provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                                ? 'bg-green-100 text-green-800'
                                : provider.verificationStatus === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : provider.verificationStatus === 'rejected'
                                ? 'bg-red-100 text-red-800'
                                : !provider.isActive
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                                ? t('hotelAdmin.serviceProviders.status.active')
                                : provider.verificationStatus === 'pending'
                                ? t('hotelAdmin.serviceProviders.status.pending')
                                : provider.verificationStatus === 'rejected'
                                ? t('hotelAdmin.serviceProviders.status.rejected')
                                : !provider.isActive
                                ? t('hotelAdmin.serviceProviders.status.inactive')
                                : provider.verificationStatus?.toUpperCase() || t('hotelAdmin.serviceProviders.status.unknown')}
                            </span>
                          </td>
                          <td className="px-4 py-4">
                            {provider.providerType === 'internal' ? (
                              <span className="text-sm font-medium text-gray-500">
                                No Markup (0%)
                              </span>
                            ) : (
                              <span className="text-sm font-medium text-gray-900">
                                {provider.markup?.percentage ? `${provider.markup.percentage}%` : t('hotelAdmin.serviceProviders.markupNotSet')}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <button
                              onClick={(e) => {
                                if (openDropdownId === provider._id) {
                                  setOpenDropdownId(null);
                                } else {
                                  const rect = e.currentTarget.getBoundingClientRect();
                                  const spaceBelow = window.innerHeight - rect.bottom;
                                  const dropdownHeight = 280; // Approximate dropdown height

                                  // Calculate position
                                  // If space below is not enough, show above
                                  const showAbove = spaceBelow < dropdownHeight;

                                  setDropdownPosition({
                                    top: showAbove ? rect.top - 8 : rect.bottom + 8,
                                    right: window.innerWidth - rect.right,
                                    isAbove: showAbove
                                  });
                                  setOpenDropdownId(provider._id);
                                }
                              }}
                              className="inline-flex items-center justify-center w-10 h-10 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue"
                              aria-label="Actions"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                <circle cx="12" cy="5" r="2"/>
                                <circle cx="12" cy="12" r="2"/>
                                <circle cx="12" cy="19" r="2"/>
                              </svg>
                            </button>

                            {openDropdownId === provider._id && (
                              <div
                                ref={dropdownRef}
                                className="fixed w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] py-1 max-h-[400px] overflow-y-auto"
                                style={{
                                  top: dropdownPosition.isAbove ? 'auto' : dropdownPosition.top,
                                  bottom: dropdownPosition.isAbove ? (window.innerHeight - dropdownPosition.top) : 'auto',
                                  right: dropdownPosition.right
                                }}
                              >
                                  <div className="py-1">
                                    {provider.providerType !== 'internal' && (
                                      <button
                                        onClick={() => {
                                          handleSetMarkup(provider);
                                          setOpenDropdownId(null);
                                        }}
                                        className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 flex items-center gap-3 transition-colors duration-150"
                                        onMouseEnter={(e) => e.currentTarget.style.color = theme.primaryColor}
                                        onMouseLeave={(e) => e.currentTarget.style.color = '#374151'}
                                      >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primaryColor }}>
                                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.setMarkup')}</span>
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        handleManageCategories(provider);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#67BAE0]/10 hover:text-[#3B5787] flex items-center gap-3 transition-colors duration-150"
                                    >
                                      <svg className="w-5 h-5 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                      </svg>
                                      <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.manageServices')}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleResetPassword(provider);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors duration-150"
                                    >
                                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                      </svg>
                                      <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.resetPassword')}</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        handleUpdateLicense(provider);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors duration-150"
                                    >
                                      <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                      </svg>
                                      <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.updateLicense')}</span>
                                    </button>
                                  </div>
                                </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="lg:hidden space-y-4 p-4">
                {filteredProviders.map((provider) => (
                  <div key={provider._id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold">
                          {provider.businessName?.charAt(0) || 'P'}
                        </div>
                        <div className="ml-3">
                          <h3 className="font-semibold text-gray-900">{provider.businessName || t('hotelAdmin.serviceProviders.notAvailable')}</h3>
                          <p className="text-sm text-modern-darkGray truncate max-w-[200px]">
                            {provider.description?.substring(0, 40) || t('hotelAdmin.serviceProviders.noDescription')}...
                          </p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-bold rounded-full ${
                        provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : provider.verificationStatus === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : provider.verificationStatus === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : !provider.isActive
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        {provider.isActive && provider.isVerified && provider.verificationStatus === 'approved'
                          ? t('hotelAdmin.serviceProviders.status.active')
                          : provider.verificationStatus === 'pending'
                          ? t('hotelAdmin.serviceProviders.status.pending')
                          : provider.verificationStatus === 'rejected'
                          ? t('hotelAdmin.serviceProviders.status.rejected')
                          : !provider.isActive
                          ? t('hotelAdmin.serviceProviders.status.inactive')
                          : provider.verificationStatus?.toUpperCase() || t('hotelAdmin.serviceProviders.status.unknown')}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Provider Type</span>
                        <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                          provider.providerType === 'internal'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {provider.providerType === 'internal' ? 'Internal' : 'External'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('hotelAdmin.serviceProviders.mobile.contact')}</span>
                        <span className="text-sm font-medium text-gray-900">{provider.email || t('hotelAdmin.serviceProviders.notAvailable')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('hotelAdmin.serviceProviders.mobile.phone')}</span>
                        <span className="text-sm font-medium text-gray-900">{provider.phone || t('hotelAdmin.serviceProviders.notAvailable')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">{t('hotelAdmin.serviceProviders.mobile.markup')}</span>
                        <span className="text-sm font-medium text-gray-900">
                          {provider.providerType === 'internal'
                            ? 'No Markup (0%)'
                            : provider.markup?.percentage ? `${provider.markup.percentage}%` : t('hotelAdmin.serviceProviders.markupNotSet')
                          }
                        </span>
                      </div>

                      {/* Mobile Actions Dropdown */}
                      <div className="relative mt-4">
                        <button
                          onClick={(e) => {
                            if (openDropdownId === provider._id) {
                              setOpenDropdownId(null);
                            } else {
                              const rect = e.currentTarget.getBoundingClientRect();
                              const spaceBelow = window.innerHeight - rect.bottom;
                              const dropdownHeight = 280; // Approximate dropdown height

                              // Calculate position
                              // If space below is not enough, show above
                              const showAbove = spaceBelow < dropdownHeight;

                              setDropdownPosition({
                                top: showAbove ? rect.top - 8 : rect.bottom + 8,
                                right: window.innerWidth - rect.right,
                                isAbove: showAbove
                              });
                              setOpenDropdownId(provider._id);
                            }
                          }}
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all duration-200 font-medium"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="5" r="2"/>
                            <circle cx="12" cy="12" r="2"/>
                            <circle cx="12" cy="19" r="2"/>
                          </svg>
                          <span>{t('hotelAdmin.serviceProviders.table.actions')}</span>
                        </button>

                        {openDropdownId === provider._id && (
                          <div
                            ref={dropdownRef}
                            className="fixed w-[calc(100%-4rem)] max-w-sm bg-white rounded-lg shadow-xl border border-gray-200 z-[9999] py-1 max-h-[400px] overflow-y-auto"
                            style={{
                              top: dropdownPosition.isAbove ? 'auto' : dropdownPosition.top,
                              bottom: dropdownPosition.isAbove ? (window.innerHeight - dropdownPosition.top) : 'auto',
                              right: dropdownPosition.right
                            }}
                          >
                                <div className="py-1">
                                  {provider.providerType !== 'internal' && (
                                    <button
                                      onClick={() => {
                                        handleSetMarkup(provider);
                                        setOpenDropdownId(null);
                                      }}
                                      className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-blue-50 hover:text-modern-blue flex items-center gap-3 transition-colors duration-150"
                                    >
                                      <svg className="w-5 h-5 text-modern-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                      </svg>
                                      <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.setMarkup')}</span>
                                    </button>
                                  )}
                                  <button
                                    onClick={() => {
                                      handleManageCategories(provider);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-[#67BAE0]/10 hover:text-[#3B5787] flex items-center gap-3 transition-colors duration-150"
                                  >
                                    <svg className="w-5 h-5 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.manageServices')}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleResetPassword(provider);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors duration-150"
                                  >
                                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                                    </svg>
                                    <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.resetPassword')}</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      handleUpdateLicense(provider);
                                      setOpenDropdownId(null);
                                    }}
                                    className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 flex items-center gap-3 transition-colors duration-150"
                                  >
                                    <svg className="w-5 h-5 text-emerald-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                    <span className="font-medium">{t('hotelAdmin.serviceProviders.actions.updateLicense')}</span>
                                  </button>
                                </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Set Markup Modal */}
        {isModalOpen && selectedProvider && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setIsModalOpen(false);
                setMarkupValue('');
                setMarkupNotes('');
              }
            }}
          >
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{t('hotelAdmin.serviceProviders.markupModal.title')}</h3>
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setMarkupValue('');
                      setMarkupNotes('');
                    }}
                    className="text-white hover:text-gray-200 transition-colors duration-200"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedProvider.businessName}</h4>
                  <p className="text-sm text-gray-600">
                    {t('hotelAdmin.serviceProviders.markupModal.currentMarkup')} <span className="font-medium text-modern-blue">{selectedProvider.markup?.percentage || 0}%</span>
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('hotelAdmin.serviceProviders.markupModal.markupPercentageLabel')}</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-modern-blue focus:ring-2 focus:ring-modern-blue focus:ring-opacity-20 transition-all duration-300"
                    placeholder={t('hotelAdmin.serviceProviders.markupModal.markupPercentagePlaceholder')}
                    value={markupValue}
                    onChange={(e) => setMarkupValue(e.target.value)}
                    disabled={isSavingMarkup}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('hotelAdmin.serviceProviders.markupModal.notesLabel')}</label>
                  <textarea
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-modern-blue focus:ring-2 focus:ring-modern-blue focus:ring-opacity-20 transition-all duration-300"
                    placeholder={t('hotelAdmin.serviceProviders.markupModal.notesPlaceholder')}
                    value={markupNotes}
                    onChange={(e) => setMarkupNotes(e.target.value)}
                    rows={3}
                    disabled={isSavingMarkup}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsModalOpen(false);
                      setMarkupValue('');
                      setMarkupNotes('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue transition-colors duration-200"
                    disabled={isSavingMarkup}
                  >
                    {t('hotelAdmin.serviceProviders.markupModal.cancel')}
                  </button>
                  <button
                    onClick={handleSaveMarkup}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-modern-blue to-modern-lightBlue border border-transparent rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-modern-blue disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={isSavingMarkup}
                  >
                    {isSavingMarkup ? t('hotelAdmin.serviceProviders.markupModal.saving') : t('hotelAdmin.serviceProviders.markupModal.saveMarkup')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Update License Modal */}
        {isLicenseModalOpen && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{t('hotelAdmin.serviceProviders.licenseModal.title')}</h3>
                  <button
                    onClick={() => { setIsLicenseModalOpen(false); setSelectedProvider(null); }}
                    className="text-white hover:text-gray-200"
                    disabled={isSavingLicense}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-1">{selectedProvider.businessName}</h4>
                  <p className="text-sm text-gray-600">
                    {t('hotelAdmin.serviceProviders.licenseModal.currentExpiry')}: {selectedProvider?.businessLicense?.expiryDate ? new Date(selectedProvider.businessLicense.expiryDate).toLocaleDateString() : t('hotelAdmin.serviceProviders.notAvailable')}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">{t('hotelAdmin.serviceProviders.licenseModal.expiryDateLabel')}</label>
                  <input
                    type="date"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-600 focus:ring-opacity-20 transition-all duration-300"
                    value={licenseExpiry}
                    onChange={(e) => setLicenseExpiry(e.target.value)}
                    disabled={isSavingLicense}
                  />
                  <p className="text-xs text-gray-500 mt-1">{t('hotelAdmin.serviceProviders.licenseModal.hint')}</p>
                </div>
              </div>
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => { setIsLicenseModalOpen(false); setSelectedProvider(null); }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                    disabled={isSavingLicense}
                  >
                    {t('hotelAdmin.serviceProviders.licenseModal.cancel')}
                  </button>
                  <button
                    onClick={handleSaveLicense}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-emerald-600 to-emerald-500 border border-transparent rounded-md hover:shadow-lg disabled:opacity-50"
                    disabled={isSavingLicense}
                  >
                    {isSavingLicense ? t('hotelAdmin.serviceProviders.licenseModal.saving') : t('hotelAdmin.serviceProviders.licenseModal.save')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Manage Service Categories Modal */}
        {isCategoriesModalOpen && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-white">{t('hotelAdmin.serviceProviders.categoriesModal.title')}</h3>
                    <p className="text-white/90 text-sm mt-1">
                      {t('hotelAdmin.serviceProviders.categoriesModal.subtitle', { businessName: selectedProvider.businessName })}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsCategoriesModalOpen(false)}
                    className="text-white hover:text-gray-200 transition-colors duration-200"
                    disabled={isSavingCategories}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Body */}
              <div className="p-6">
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 mb-2">{t('hotelAdmin.serviceProviders.categoriesModal.selectCategoriesTitle')}</h4>
                  <p className="text-gray-600 text-sm">
                    {t('hotelAdmin.serviceProviders.categoriesModal.selectCategoriesDesc')}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {serviceCategories.map((category) => (
                    <div
                      key={category.id}
                      className={`border-2 rounded-xl p-4 cursor-pointer transition-all duration-200 ${
                        (selectedCategories || []).includes(category.id)
                          ? 'border-[#3B5787] bg-[#67BAE0]/10'
                          : 'border-gray-200 bg-white hover:border-[#67BAE0]'
                      }`}
                      onClick={() => handleCategoryChange(category.id, !(selectedCategories || []).includes(category.id))}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="flex-shrink-0">
                          <div className="text-2xl">{category.icon}</div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              id={`edit-category-${category.id}`}
                              checked={(selectedCategories || []).includes(category.id)}
                              onChange={(e) => handleCategoryChange(category.id, e.target.checked)}
                              className="h-4 w-4 text-[#3B5787] focus:ring-[#67BAE0] border-gray-300 rounded"
                              disabled={isSavingCategories}
                            />
                            <label
                              htmlFor={`edit-category-${category.id}`}
                              className="ml-2 text-sm font-semibold text-gray-800 cursor-pointer"
                            >
                              {category.name}
                            </label>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{category.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current Categories Display */}
                {selectedProvider.categories && selectedProvider.categories.length > 0 && (
                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h5 className="text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.serviceProviders.categoriesModal.currentCategoriesTitle')}</h5>
                    <div className="flex flex-wrap gap-2">
                      {selectedProvider.categories.map((categoryId) => {
                        const category = serviceCategories.find(cat => cat.id === categoryId);
                        return category ? (
                          <span
                            key={categoryId}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-[#67BAE0]/10 text-[#3B5787]"
                          >
                            {category.icon} {category.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex space-x-3 justify-end">
                  <button
                    onClick={() => setIsCategoriesModalOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#67BAE0] transition-colors duration-200"
                    disabled={isSavingCategories}
                  >
                    {t('hotelAdmin.serviceProviders.categoriesModal.cancel')}
                  </button>
                  <button
                    onClick={handleSaveCategories}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-[#3B5787] to-[#67BAE0] border border-transparent rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#67BAE0] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={isSavingCategories}
                  >
                    {isSavingCategories ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('hotelAdmin.serviceProviders.categoriesModal.saving')}
                      </span>
                    ) : (
                      t('hotelAdmin.serviceProviders.categoriesModal.saveChanges')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reset Password Confirmation Modal */}
        {isResetPasswordModalOpen && selectedProvider && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              {/* Modal Header */}
              <div className="px-6 py-4 bg-gradient-to-r from-red-500 to-red-600 rounded-t-2xl">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-white">{t('hotelAdmin.serviceProviders.passwordReset.modalTitle')}</h3>
                  <button
                    onClick={() => {
                      setIsResetPasswordModalOpen(false);
                      setSelectedProvider(null);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="text-white hover:text-gray-200 transition-colors duration-200"
                    disabled={isResettingPassword}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div>
                      <h4 className="font-semibold text-blue-800">{t('hotelAdmin.serviceProviders.passwordReset.info')}</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        {t('hotelAdmin.serviceProviders.passwordReset.infoMessage')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{selectedProvider.businessName}</h4>
                  <p className="text-sm text-gray-600">
                    <strong>{t('hotelAdmin.serviceProviders.passwordReset.email')}:</strong> {selectedProvider.email || t('hotelAdmin.serviceProviders.notAvailable')}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('hotelAdmin.serviceProviders.passwordReset.newPassword')}
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 transition-all duration-300"
                      placeholder={t('hotelAdmin.serviceProviders.passwordReset.newPasswordPlaceholder')}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      disabled={isResettingPassword}
                      minLength={6}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t('hotelAdmin.serviceProviders.passwordReset.confirmPassword')}
                    </label>
                    <input
                      type="password"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500 focus:ring-opacity-20 transition-all duration-300"
                      placeholder={t('hotelAdmin.serviceProviders.passwordReset.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      disabled={isResettingPassword}
                      minLength={6}
                    />
                  </div>

                  {newPassword && confirmPassword && newPassword !== confirmPassword && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {t('hotelAdmin.serviceProviders.passwordReset.errors.passwordMismatch')}
                    </div>
                  )}

                  {newPassword && newPassword.length < 6 && (
                    <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
                      {t('hotelAdmin.serviceProviders.passwordReset.errors.passwordTooShort')}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-2xl">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setIsResetPasswordModalOpen(false);
                      setSelectedProvider(null);
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
                    disabled={isResettingPassword}
                  >
                    {t('hotelAdmin.serviceProviders.passwordReset.cancel')}
                  </button>
                  <button
                    onClick={handleConfirmPasswordReset}
                    className="px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-red-500 to-red-600 border border-transparent rounded-md hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                    disabled={isResettingPassword || !newPassword || !confirmPassword || newPassword !== confirmPassword || newPassword.length < 6}
                  >
                    {isResettingPassword ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        {t('hotelAdmin.serviceProviders.passwordReset.resetting')}
                      </span>
                    ) : (
                      t('hotelAdmin.serviceProviders.passwordReset.confirmReset')
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Service Provider Modal */}
        <AddServiceProviderModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onSuccess={handleProviderCreated}
        />
      </div>
    </div>
  );
};

export default ServiceProvidersPage;
