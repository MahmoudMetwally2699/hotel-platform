import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { createServiceProvider } from '../../redux/slices/serviceSlice';

/**
 * Modal component for adding new service providers with custom credentials
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Function to close modal
 * @param {Function} props.onSuccess - Function called after successful creation
 */
const AddServiceProviderModal = ({ isOpen, onClose, onSuccess }) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);  const [formData, setFormData] = useState({
    // Business Information
    businessName: '',
    description: '',

    // Contact Information
    contactEmail: '',
    contactPhone: '',

    // Address Information
    street: '',
    city: '',
    state: '',
    country: '',
    zipCode: '',

    // Business License
    licenseNumber: '',
    licenseIssuedBy: '',
    licenseIssuedDate: '',
    licenseExpiryDate: '',

    // Tax Information
    taxId: '',

    // Insurance Information
    insuranceProvider: '',
    insurancePolicyNumber: '',
    insuranceCoverage: '',
    insuranceExpiryDate: '',

    // Capacity Information
    maxOrdersPerDay: '',
    totalEmployees: '',

    // User Credentials (Required)
    userEmail: '',
    userPassword: '',
    firstName: '',
    lastName: ''
  });

  const [errors, setErrors] = useState({});

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Required business fields
    if (!formData.businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    }
    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    }
    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    }

    // Address fields
    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }
    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    }

    // Business License
    if (!formData.licenseNumber.trim()) {
      newErrors.licenseNumber = 'License number is required';
    }
    if (!formData.licenseIssuedBy.trim()) {
      newErrors.licenseIssuedBy = 'License issuing authority is required';
    }
    if (!formData.licenseIssuedDate) {
      newErrors.licenseIssuedDate = 'License issue date is required';
    }
    if (!formData.licenseExpiryDate) {
      newErrors.licenseExpiryDate = 'License expiry date is required';
    }

    // Tax ID
    if (!formData.taxId.trim()) {
      newErrors.taxId = 'Tax ID is required';
    }

    // Insurance
    if (!formData.insuranceProvider.trim()) {
      newErrors.insuranceProvider = 'Insurance provider is required';
    }
    if (!formData.insurancePolicyNumber.trim()) {
      newErrors.insurancePolicyNumber = 'Insurance policy number is required';
    }
    if (!formData.insuranceCoverage || formData.insuranceCoverage <= 0) {
      newErrors.insuranceCoverage = 'Insurance coverage amount is required';
    }
    if (!formData.insuranceExpiryDate) {
      newErrors.insuranceExpiryDate = 'Insurance expiry date is required';
    }

    // Capacity
    if (!formData.maxOrdersPerDay || formData.maxOrdersPerDay <= 0) {
      newErrors.maxOrdersPerDay = 'Maximum orders per day is required';
    }
    if (!formData.totalEmployees || formData.totalEmployees <= 0) {
      newErrors.totalEmployees = 'Total employees count is required';
    }

    // User credentials are required
    if (!formData.userEmail.trim()) {
      newErrors.userEmail = 'User email is required';
    }
    if (!formData.userPassword.trim()) {
      newErrors.userPassword = 'User password is required';
    } else if (formData.userPassword.length < 6) {
      newErrors.userPassword = 'Password must be at least 6 characters';
    }
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {      // Prepare data for API
      const apiData = {
        // Business data
        businessName: formData.businessName,
        description: formData.description,
        contactEmail: formData.contactEmail,
        contactPhone: formData.contactPhone,

        // Address data
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          country: formData.country,
          zipCode: formData.zipCode
        },

        // Business License
        businessLicense: {
          number: formData.licenseNumber,
          issuedBy: formData.licenseIssuedBy,
          issuedDate: formData.licenseIssuedDate,
          expiryDate: formData.licenseExpiryDate
        },

        // Tax ID
        taxId: formData.taxId,

        // Insurance
        insurance: {
          provider: formData.insuranceProvider,
          policyNumber: formData.insurancePolicyNumber,
          coverage: parseFloat(formData.insuranceCoverage),
          expiryDate: formData.insuranceExpiryDate
        },

        // Capacity
        capacity: {
          maxOrdersPerDay: parseInt(formData.maxOrdersPerDay)
        },

        // Staff
        staff: {
          totalEmployees: parseInt(formData.totalEmployees)
        },

        // User credentials
        userCredentials: {
          email: formData.userEmail,
          password: formData.userPassword,
          firstName: formData.firstName,
          lastName: formData.lastName
        },

        // Set as active by default
        isActive: true,
        isVerified: true,
        verificationStatus: 'approved'
      };

      const result = await dispatch(createServiceProvider(apiData)).unwrap();

      // Show success message
      setShowSuccess(true);

      // Success callback
      if (onSuccess) {
        onSuccess(result);
      }      // Reset form
      setFormData({
        businessName: '',
        description: '',
        contactEmail: '',
        contactPhone: '',
        street: '',
        city: '',
        state: '',
        country: '',
        zipCode: '',
        licenseNumber: '',
        licenseIssuedBy: '',
        licenseIssuedDate: '',
        licenseExpiryDate: '',
        taxId: '',
        insuranceProvider: '',
        insurancePolicyNumber: '',
        insuranceCoverage: '',
        insuranceExpiryDate: '',
        maxOrdersPerDay: '',
        totalEmployees: '',
        userEmail: '',
        userPassword: '',
        firstName: '',
        lastName: ''
      });

      // Close modal after showing success message briefly
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 2000);    } catch (error) {
      console.error('Error creating service provider:', error);

      // Display the specific error message from the backend
      const errorMessage = typeof error === 'string' ? error : error.message || 'Failed to create service provider';

      setErrors({
        submit: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white">Add New Service Provider</h3>
              <p className="text-blue-100 text-sm mt-1">Register a new service provider for your hotel</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors duration-200"
              disabled={isLoading}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6">

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 mb-6 shadow-sm">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-green-800 font-medium">
                    Service provider created successfully!
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Business Information Section */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">Business Information</h3>
                  <p className="text-sm text-modern-gray">Basic business details and contact information</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.businessName
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="Enter business name"
                    disabled={isLoading}
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.businessName}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.contactEmail
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="business@example.com"
                    disabled={isLoading}
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.contactEmail}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.contactPhone
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="+1234567890"
                    disabled={isLoading}
                  />
                  {errors.contactPhone && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.contactPhone}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-modern-darkGray">
                  Business Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue hover:border-modern-lightBlue transition-all duration-200 bg-white"
                  placeholder="Brief description of the business and services offered..."
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Address Information Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">Address Information</h3>
                  <p className="text-sm text-modern-gray">Physical location and contact details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2 space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.street
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="123 Main Street"
                    disabled={isLoading}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.street}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.city
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="City name"
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.city}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.state
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="State/Province"
                    disabled={isLoading}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.state}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.country
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="Country"
                    disabled={isLoading}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.country}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.zipCode
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="ZIP/Postal Code"
                    disabled={isLoading}
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.zipCode}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Business License Information Section */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">Business License</h3>
                  <p className="text-sm text-modern-gray">Legal licensing and authorization details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.licenseNumber
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="License number"
                    disabled={isLoading}
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.licenseNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Issued By *
                  </label>
                  <input
                    type="text"
                    name="licenseIssuedBy"
                    value={formData.licenseIssuedBy}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.licenseIssuedBy
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="Issuing authority"
                    disabled={isLoading}
                  />
                  {errors.licenseIssuedBy && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.licenseIssuedBy}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    name="licenseIssuedDate"
                    value={formData.licenseIssuedDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.licenseIssuedDate
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.licenseIssuedDate && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.licenseIssuedDate}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.licenseExpiryDate
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.licenseExpiryDate && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.licenseExpiryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Tax Information Section */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">Tax Information</h3>
                  <p className="text-sm text-modern-gray">Tax identification and compliance details</p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-semibold text-modern-darkGray">
                  Tax ID *
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                    errors.taxId
                      ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                      : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                  }`}
                  placeholder="Tax identification number"
                  disabled={isLoading}
                />
                {errors.taxId && (
                  <p className="text-red-500 text-sm font-medium flex items-center">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {errors.taxId}
                  </p>
                )}
              </div>
            </div>

            {/* Insurance Information Section */}
            <div className="bg-gradient-to-r from-green-50 to-teal-50 rounded-xl p-6 border border-green-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">Insurance Information</h3>
                  <p className="text-sm text-modern-gray">Insurance coverage and policy details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Insurance Provider *
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.insuranceProvider
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="Insurance company name"
                    disabled={isLoading}
                  />
                  {errors.insuranceProvider && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.insuranceProvider}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.insurancePolicyNumber
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="Policy number"
                    disabled={isLoading}
                  />
                  {errors.insurancePolicyNumber && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.insurancePolicyNumber}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Coverage Amount * ($)
                  </label>
                  <input
                    type="number"
                    name="insuranceCoverage"
                    value={formData.insuranceCoverage}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.insuranceCoverage
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="50000"
                    min="1"
                    disabled={isLoading}
                  />
                  {errors.insuranceCoverage && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.insuranceCoverage}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.insuranceExpiryDate
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.insuranceExpiryDate && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.insuranceExpiryDate}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Capacity and Staff Information Section */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">Capacity & Staff</h3>
                  <p className="text-sm text-modern-gray">Service capacity and operational details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Max Orders Per Day *
                  </label>
                  <input
                    type="number"
                    name="maxOrdersPerDay"
                    value={formData.maxOrdersPerDay}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.maxOrdersPerDay
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="10"
                    min="1"
                    disabled={isLoading}
                  />
                  {errors.maxOrdersPerDay && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.maxOrdersPerDay}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-modern-darkGray">
                    Total Employees *
                  </label>
                  <input
                    type="number"
                    name="totalEmployees"
                    value={formData.totalEmployees}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                      errors.totalEmployees
                        ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                        : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                    }`}
                    placeholder="1"
                    min="1"
                    disabled={isLoading}
                  />
                  {errors.totalEmployees && (
                    <p className="text-red-500 text-sm font-medium flex items-center">
                      <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.totalEmployees}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* User Credentials Section */}
            <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl p-6 border border-cyan-200">
              <div className="flex items-center mb-6">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-modern-darkGray">User Account</h3>
                  <p className="text-sm text-modern-gray">Login credentials and account setup</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-modern-darkGray">
                      User Email *
                    </label>
                    <input
                      type="email"
                      name="userEmail"
                      value={formData.userEmail}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                        errors.userEmail
                          ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                          : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                      }`}
                      placeholder="user@example.com"
                      disabled={isLoading}
                    />
                    {errors.userEmail && (
                      <p className="text-red-500 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.userEmail}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-modern-darkGray">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="userPassword"
                      value={formData.userPassword}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                        errors.userPassword
                          ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                          : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                      }`}
                      placeholder="Minimum 6 characters"
                      disabled={isLoading}
                    />
                    {errors.userPassword && (
                      <p className="text-red-500 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.userPassword}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-modern-darkGray">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                        errors.firstName
                          ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                          : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                      }`}
                      placeholder="First name"
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.firstName}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-semibold text-modern-darkGray">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-4 py-3 border-2 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue ${
                        errors.lastName
                          ? 'border-red-300 bg-red-50 focus:ring-red-200 focus:border-red-400'
                          : 'border-gray-200 bg-white hover:border-modern-lightBlue'
                      }`}
                      placeholder="Last name"
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm font-medium flex items-center">
                        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.lastName}
                      </p>
                    )}
                  </div>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-red-800 font-medium">{errors.submit}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 border-2 border-gray-300 rounded-xl text-modern-darkGray font-semibold hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:border-modern-blue transition-all duration-200"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-3 bg-gradient-to-r from-modern-blue to-modern-lightBlue text-white font-semibold rounded-xl hover:from-blue-700 hover:to-blue-600 focus:outline-none focus:ring-2 focus:ring-modern-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Creating Service Provider...
                  </span>
                ) : (
                  <span className="flex items-center">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Service Provider
                  </span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddServiceProviderModal;
