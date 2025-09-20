import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchHotelProfile, updateHotelProfile, selectCurrentHotel, selectHotelLoading } from '../../redux/slices/hotelSlice';
import useAuth from '../../hooks/useAuth';

/**
 * Hotel Admin Settings Page
 * @returns {JSX.Element} Settings page
 */
const SettingsPage = () => {
  // IMMEDIATE ALERT TO CATCH REDIRECT ISSUES
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const hotel = useSelector(selectCurrentHotel);
  const isLoading = useSelector(selectHotelLoading);
  const { currentUser: user } = useAuth();


  const [activeTab, setActiveTab] = useState('profile');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    contactEmail: '',
    contactPhone: '',
    website: '',
    defaultMarkupPercentage: 0,
    defaultCurrency: 'USD',
    checkInTime: '14:00',
    checkOutTime: '12:00',
    acceptsBookingsCutoff: 2, // hours before service
    cancellationPolicy: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    // Fetch hotel profile data when user is available
    console.log('🔍 Initial effect - User:', { user: !!user, role: user?.role });
    if (user?.role === 'hotel') {
      console.log('🔍 Fetching hotel profile...');
      dispatch(fetchHotelProfile());
    }
  }, [dispatch, user]);

  useEffect(() => {
    console.log('🔍 Hotel data effect triggered:', { hotel, hasHotel: !!hotel });
    if (hotel?.data) {
      const hotelData = hotel.data;
      console.log('🔍 Setting form data with hotel data:', hotelData);
      const newFormData = {
        name: hotelData.name || '',
        description: hotelData.description || '',
        address: {
          street: hotelData.address?.street || '',
          city: hotelData.address?.city || '',
          state: hotelData.address?.state || '',
          zipCode: hotelData.address?.zipCode || '',
          country: hotelData.address?.country || ''
        },
        contactEmail: hotelData.email || '',
        contactPhone: hotelData.phone || '',
        website: hotelData.website || '',
        defaultMarkupPercentage: hotelData.markupSettings?.global?.defaultPercentage || 0,
        defaultCurrency: hotelData.paymentSettings?.currency || 'USD',
        checkInTime: hotelData.operatingHours?.checkIn || '14:00',
        checkOutTime: hotelData.operatingHours?.checkOut || '12:00',
        acceptsBookingsCutoff: hotelData.acceptsBookingsCutoff || 2,
        cancellationPolicy: hotelData.cancellationPolicy || ''
      };
      console.log('🔍 New form data:', newFormData);
      setFormData(newFormData);
    } else {
      console.log('⚠️ No hotel data available');
    }
  }, [hotel]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSuccessMessage('');
      setErrorMessage('');

      // For hotel admin, update their own profile (no hotelId needed)
      if (user?.role === 'hotel') {
        await dispatch(updateHotelProfile({
          hotelData: formData
        })).unwrap();

        setSuccessMessage(t('hotelAdmin.settings.updateSuccess'));

        // Clear success message after 3 seconds
        setTimeout(() => {
          setSuccessMessage('');
        }, 3000);
      }
    } catch (error) {
      setErrorMessage(error.message || t('hotelAdmin.settings.updateError'));

      // Clear error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#67BAE0]/10 via-white to-[#3B5787]/10">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header Section */}
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-2xl shadow-xl p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">{t('hotelAdmin.settings.title')}</h1>
              <p className="text-white/80 text-lg">{t('hotelAdmin.settings.subtitle')}</p>
            </div>
            <div className="hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-8 overflow-hidden">
          <div className="border-b border-gray-200">
            <nav className="flex">
              <button
                onClick={() => setActiveTab('profile')}
                className={`flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200 ${
                  activeTab === 'profile'
                    ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-lg'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center space-x-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{t('hotelAdmin.settings.tabs.profile')}</span>
                </div>
              </button>
            </nav>
          </div>
        </div>

        {/* Success and Error Messages */}
        {successMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-[#67BAE0]/20 to-[#3B5787]/20 border border-[#67BAE0] rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-[#3B5787] font-medium">{successMessage}</p>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-red-800 font-medium">{errorMessage}</p>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-64 bg-white rounded-xl shadow-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0]/30 border-t-[#3B5787] mx-auto mb-4"></div>
              <p className="text-gray-600 font-medium">{t('hotelAdmin.settings.loading')}</p>
            </div>
          </div>
        ) : (
          <div>
            {/* Hotel Profile Form */}
            {activeTab === 'profile' && (
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Basic Information Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-[#67BAE0]/20 to-[#3B5787]/20 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{t('hotelAdmin.settings.sections.basicInfo')}</span>
                    </h2>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.hotelName')}</label>
                        <input
                          type="text"
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="website" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.website')}</label>
                        <input
                          type="url"
                          id="website"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                        />
                      </div>

                      <div className="md:col-span-2">
                        <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.description')}</label>
                        <textarea
                          id="description"
                          name="description"
                          value={formData.description}
                          onChange={handleInputChange}
                          rows="4"
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                          placeholder={t('hotelAdmin.settings.placeholders.description')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-[#3B5787]/20 to-[#67BAE0]/20 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span>{t('hotelAdmin.settings.sections.contactInfo')}</span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label htmlFor="contactEmail" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.contactEmail')}</label>
                        <input
                          type="email"
                          id="contactEmail"
                          name="contactEmail"
                          value={formData.contactEmail}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="contactPhone" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.contactPhone')}</label>
                        <input
                          type="tel"
                          id="contactPhone"
                          name="contactPhone"
                          value={formData.contactPhone}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="bg-gradient-to-r from-[#67BAE0]/20 to-[#3B5787]/20 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6 text-[#3B5787]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{t('hotelAdmin.settings.sections.addressInfo')}</span>
                    </h2>
                  </div>
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label htmlFor="address.street" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.streetAddress')}</label>
                        <input
                          type="text"
                          id="address.street"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="address.city" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.city')}</label>
                        <input
                          type="text"
                          id="address.city"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="address.state" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.state')}</label>
                        <input
                          type="text"
                          id="address.state"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="address.zipCode" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.zipCode')}</label>
                        <input
                          type="text"
                          id="address.zipCode"
                          name="address.zipCode"
                          value={formData.address.zipCode}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="address.country" className="block text-sm font-semibold text-gray-700 mb-2">{t('hotelAdmin.settings.fields.country')}</label>
                        <input
                          type="text"
                          id="address.country"
                          name="address.country"
                          value={formData.address.country}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-[#3B5787] focus:ring-4 focus:ring-[#67BAE0]/30 transition-all duration-200 bg-gray-50 focus:bg-white"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Save Button */}
                <div className="flex justify-end pt-6">
                  <button
                    type="submit"
                    className="px-8 py-3 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white rounded-xl hover:from-[#2A4065] hover:to-[#3B5787] transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('hotelAdmin.settings.saving')}
                      </div>
                    ) : (
                      t('hotelAdmin.settings.saveChanges')
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SettingsPage;
