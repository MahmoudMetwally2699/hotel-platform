import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { fetchHotelProfile, updateHotelProfile, selectCurrentHotel, selectHotelLoading } from '../../redux/slices/hotelSlice';
import useAuth from '../../hooks/useAuth';

/**
 * Hotel Admin Settings Page
 * @returns {JSX.Element} Settings page
 */
const SettingsPage = () => {
  // IMMEDIATE ALERT TO CATCH REDIRECT ISSUES
  const { t } = useTranslation();
  const { theme } = useTheme();
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
    checkInTime: '14:00',
    checkOutTime: '12:00',
    acceptsBookingsCutoff: 2, // hours before service
    cancellationPolicy: ''
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  useEffect(() => {
    // Fetch hotel profile data when user is available
    if (user?.role === 'hotel') {
      dispatch(fetchHotelProfile());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (hotel?.data) {
      const hotelData = hotel.data;
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
        checkInTime: hotelData.operatingHours?.checkIn || '14:00',
        checkOutTime: hotelData.operatingHours?.checkOut || '12:00',
        acceptsBookingsCutoff: hotelData.acceptsBookingsCutoff || 2,
        cancellationPolicy: hotelData.cancellationPolicy || ''
      };
      setFormData(newFormData);

      // Set the existing logo preview if available
      setLogoPreview(hotelData.images?.logo || null);
      setLogoFile(null); // Clear any previously selected file
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

  // Handle logo file selection
  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Upload logo to Cloudinary
  const uploadLogo = async (file) => {
    try {
      // Check if Cloudinary is properly configured
      const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD_NAME;
      const uploadPreset = process.env.REACT_APP_CLOUDINARY_UPLOAD_PRESET;

      if (!cloudName || cloudName === 'hotel-platform-demo' || cloudName === 'your_cloud_name_here') {
        alert('Cloudinary not configured, using local preview');

        // Create a local blob URL for testing
        const localUrl = URL.createObjectURL(file);
        return localUrl;
      }

      // Create FormData for Cloudinary upload
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('upload_preset', uploadPreset);
      uploadFormData.append('folder', 'hotel-platform/hotel-logos');
      uploadFormData.append('resource_type', 'image');

      const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

      const response = await fetch(cloudinaryUrl, {
        method: 'POST',
        body: uploadFormData
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      const result = await response.json();

      alert('Hotel logo uploaded successfully to Cloudinary!');
      return result.secure_url;
    } catch (error) {
      // Try to extract meaningful error message
      let errorMessage = 'Unknown upload error';
      if (error.message) {
        errorMessage = error.message;
      }

      alert(`Failed to upload hotel logo: ${errorMessage}`);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSuccessMessage('');
      setErrorMessage('');

      // For hotel admin, update their own profile (no hotelId needed)
      if (user?.role === 'hotel') {
        // Upload logo if a new one was selected
        let logoUrl = hotel?.images?.logo; // Keep existing logo by default
        if (logoFile) {
          logoUrl = await uploadLogo(logoFile);
        }

        // Structure the data to match the Hotel model
        const updateData = {
          name: formData.name,
          description: formData.description,
          address: formData.address,
          email: formData.contactEmail,
          phone: formData.contactPhone,
          website: formData.website,
          images: {
            ...hotel?.images,
            logo: logoUrl
          },
          markupSettings: {
            global: {
              defaultPercentage: formData.defaultMarkupPercentage
            }
          },
          operatingHours: {
            checkIn: formData.checkInTime,
            checkOut: formData.checkOutTime
          },
          acceptsBookingsCutoff: formData.acceptsBookingsCutoff,
          cancellationPolicy: formData.cancellationPolicy
        };

        await dispatch(updateHotelProfile({
          hotelData: updateData
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
    <div className="min-h-screen" style={{ backgroundColor: theme.backgroundColor }}>
      <div className="w-full p-6">
        {/* Header Section */}
        <div className="rounded-2xl shadow-xl p-8 mb-8" style={{ backgroundColor: theme.primaryColor }}>
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
                className="flex-1 py-4 px-6 text-center font-medium text-sm transition-all duration-200"
                style={activeTab === 'profile' ? { backgroundColor: theme.primaryColor, color: 'white' } : { color: '#6b7280' }}
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
          <div className="mb-6 p-4 rounded-xl shadow-lg" style={{ backgroundColor: `${theme.primaryColor}20`, borderColor: theme.primaryColor, borderWidth: '1px' }}>
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primaryColor }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="font-medium" style={{ color: theme.primaryColor }}>{successMessage}</p>
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
              <div className="animate-spin rounded-full h-16 w-16 border-4 mx-auto mb-4" style={{ borderColor: `${theme.primaryColor}30`, borderTopColor: theme.primaryColor }}></div>
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
                  <div className="px-6 py-4 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${theme.primaryColor}20, ${theme.primaryColor}20)` }}>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primaryColor }}>
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          style={{ ':focus': { borderColor: theme.primaryColor, boxShadow: `0 0 0 4px ${theme.primaryColor}30` } }}
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white resize-none"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          placeholder={t('hotelAdmin.settings.placeholders.description')}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hotel Logo Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${theme.primaryColor}20, ${theme.primaryColor}20)` }}>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primaryColor }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>Hotel Logo</span>
                    </h2>
                  </div>
                  <div className="p-8">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Upload Logo</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold transition-all duration-200 file:cursor-pointer cursor-pointer"
                          style={{ '--file-bg': `${theme.primaryColor}20`, '--file-color': theme.primaryColor, '--file-hover-bg': `${theme.primaryColor}30` }}
                          onMouseEnter={(e) => {
                            const fileInput = e.currentTarget.querySelector('input[type="file"]::file-selector-button');
                            if (fileInput) fileInput.style.backgroundColor = `${theme.primaryColor}30`;
                          }}
                        />
                        <p className="text-xs text-gray-500 mt-2">Upload a new logo for your hotel (PNG, JPG, or GIF). Leave empty to keep current logo.</p>
                      </div>
                      {logoPreview && (
                        <div className="mt-4">
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {logoFile ? 'New Logo Preview' : 'Current Hotel Logo'}
                          </label>
                          <div className="relative inline-block">
                            <img
                              src={logoPreview}
                              alt="Logo preview"
                              className="h-24 w-auto object-contain border-2 border-gray-200 rounded-xl p-3 bg-gray-50 shadow-sm"
                            />
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {logoFile ? 'This is how your new logo will look' : 'This is your current hotel logo'}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${theme.primaryColor}20, ${theme.primaryColor}20)` }}>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primaryColor }}>
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address Information Section */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-100">
                  <div className="px-6 py-4 border-b border-gray-200" style={{ background: `linear-gradient(to right, ${theme.primaryColor}20, ${theme.primaryColor}20)` }}>
                    <h2 className="text-xl font-semibold text-gray-800 flex items-center space-x-2">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: theme.primaryColor }}>
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none transition-all duration-200 bg-gray-50 focus:bg-white"
                          onFocus={(e) => { e.target.style.borderColor = theme.primaryColor; e.target.style.boxShadow = `0 0 0 4px ${theme.primaryColor}30`; }}
                          onBlur={(e) => { e.target.style.borderColor = ''; e.target.style.boxShadow = ''; }}
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
                    className="px-8 py-3 text-white rounded-xl transition-all duration-200 font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:transform-none"
                    style={{ backgroundColor: theme.primaryColor }}
                    onMouseEnter={(e) => e.target.style.opacity = '0.9'}
                    onMouseLeave={(e) => e.target.style.opacity = '1'}
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
