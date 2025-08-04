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

    // User Credentials (Optional)
    userEmail: '',
    userPassword: '',
    firstName: '',
    lastName: '',

    // Options
    generateCredentials: true, // Whether to auto-generate credentials
    sendEmail: true // Whether to send credentials via email
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

    // If not generating credentials automatically, validate user fields
    if (!formData.generateCredentials) {
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

        // User credentials (only if not auto-generating)
        ...((!formData.generateCredentials) && {
          userCredentials: {
            email: formData.userEmail,
            password: formData.userPassword,
            firstName: formData.firstName,
            lastName: formData.lastName
          }
        }),

        // Options
        sendEmail: formData.sendEmail
      };const result = await dispatch(createServiceProvider(apiData)).unwrap();

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
        lastName: '',
        generateCredentials: true,
        sendEmail: true
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
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-gray-900">Add New Service Provider</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {/* Success Message */}
          {showSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <p className="text-green-600 font-medium">
                  Service provider created successfully!
                  {formData.sendEmail && ' Login credentials have been sent via email.'}
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Business Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Business Name *
                  </label>
                  <input
                    type="text"
                    name="businessName"
                    value={formData.businessName}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.businessName ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Enter business name"
                    disabled={isLoading}
                  />
                  {errors.businessName && (
                    <p className="text-red-500 text-sm mt-1">{errors.businessName}</p>                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Email *
                  </label>
                  <input
                    type="email"
                    name="contactEmail"
                    value={formData.contactEmail}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contactEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="business@example.com"
                    disabled={isLoading}
                  />
                  {errors.contactEmail && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactEmail}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone *
                  </label>
                  <input
                    type="tel"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.contactPhone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="+1234567890"
                    disabled={isLoading}
                  />
                  {errors.contactPhone && (
                    <p className="text-red-500 text-sm mt-1">{errors.contactPhone}</p>
                  )}
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Brief description of the business"
                  disabled={isLoading}
                />
              </div>            </div>

            {/* Address Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Address Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="street"
                    value={formData.street}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.street ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="123 Main Street"
                    disabled={isLoading}
                  />
                  {errors.street && (
                    <p className="text-red-500 text-sm mt-1">{errors.street}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="City name"
                    disabled={isLoading}
                  />
                  {errors.city && (
                    <p className="text-red-500 text-sm mt-1">{errors.city}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="State/Province"
                    disabled={isLoading}
                  />
                  {errors.state && (
                    <p className="text-red-500 text-sm mt-1">{errors.state}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Country"
                    disabled={isLoading}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-sm mt-1">{errors.country}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.zipCode ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="ZIP/Postal Code"
                    disabled={isLoading}
                  />
                  {errors.zipCode && (
                    <p className="text-red-500 text-sm mt-1">{errors.zipCode}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Business License Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Business License</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    License Number *
                  </label>
                  <input
                    type="text"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.licenseNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="License number"
                    disabled={isLoading}
                  />
                  {errors.licenseNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.licenseNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issued By *
                  </label>
                  <input
                    type="text"
                    name="licenseIssuedBy"
                    value={formData.licenseIssuedBy}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.licenseIssuedBy ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Issuing authority"
                    disabled={isLoading}
                  />
                  {errors.licenseIssuedBy && (
                    <p className="text-red-500 text-sm mt-1">{errors.licenseIssuedBy}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Issue Date *
                  </label>
                  <input
                    type="date"
                    name="licenseIssuedDate"
                    value={formData.licenseIssuedDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.licenseIssuedDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.licenseIssuedDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.licenseIssuedDate}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="licenseExpiryDate"
                    value={formData.licenseExpiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.licenseExpiryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.licenseExpiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.licenseExpiryDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Tax Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Information</h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tax ID *
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.taxId ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Tax identification number"
                  disabled={isLoading}
                />
                {errors.taxId && (
                  <p className="text-red-500 text-sm mt-1">{errors.taxId}</p>
                )}
              </div>
            </div>

            {/* Insurance Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Insurance Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Insurance Provider *
                  </label>
                  <input
                    type="text"
                    name="insuranceProvider"
                    value={formData.insuranceProvider}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.insuranceProvider ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Insurance company name"
                    disabled={isLoading}
                  />
                  {errors.insuranceProvider && (
                    <p className="text-red-500 text-sm mt-1">{errors.insuranceProvider}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Policy Number *
                  </label>
                  <input
                    type="text"
                    name="insurancePolicyNumber"
                    value={formData.insurancePolicyNumber}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.insurancePolicyNumber ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Policy number"
                    disabled={isLoading}
                  />
                  {errors.insurancePolicyNumber && (
                    <p className="text-red-500 text-sm mt-1">{errors.insurancePolicyNumber}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Coverage Amount * ($)
                  </label>
                  <input
                    type="number"
                    name="insuranceCoverage"
                    value={formData.insuranceCoverage}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.insuranceCoverage ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="50000"
                    min="1"
                    disabled={isLoading}
                  />
                  {errors.insuranceCoverage && (
                    <p className="text-red-500 text-sm mt-1">{errors.insuranceCoverage}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expiry Date *
                  </label>
                  <input
                    type="date"
                    name="insuranceExpiryDate"
                    value={formData.insuranceExpiryDate}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.insuranceExpiryDate ? 'border-red-500' : 'border-gray-300'
                    }`}
                    disabled={isLoading}
                  />
                  {errors.insuranceExpiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.insuranceExpiryDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Capacity and Staff Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Capacity & Staff</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Max Orders Per Day *
                  </label>
                  <input
                    type="number"
                    name="maxOrdersPerDay"
                    value={formData.maxOrdersPerDay}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.maxOrdersPerDay ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="10"
                    min="1"
                    disabled={isLoading}
                  />
                  {errors.maxOrdersPerDay && (
                    <p className="text-red-500 text-sm mt-1">{errors.maxOrdersPerDay}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total Employees *
                  </label>
                  <input
                    type="number"
                    name="totalEmployees"
                    value={formData.totalEmployees}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.totalEmployees ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="1"
                    min="1"
                    disabled={isLoading}
                  />
                  {errors.totalEmployees && (
                    <p className="text-red-500 text-sm mt-1">{errors.totalEmployees}</p>
                  )}
                </div>
              </div>
            </div>

            {/* User Credentials Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">User Account</h3>

              <div className="mb-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="generateCredentials"
                    checked={formData.generateCredentials}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Auto-generate login credentials
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  If checked, we'll create a random email and password for the service provider
                </p>
              </div>

              {!formData.generateCredentials && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      User Email *
                    </label>
                    <input
                      type="email"
                      name="userEmail"
                      value={formData.userEmail}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.userEmail ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="user@example.com"
                      disabled={isLoading}
                    />
                    {errors.userEmail && (
                      <p className="text-red-500 text-sm mt-1">{errors.userEmail}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="userPassword"
                      value={formData.userPassword}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.userPassword ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Minimum 6 characters"
                      disabled={isLoading}
                    />
                    {errors.userPassword && (
                      <p className="text-red-500 text-sm mt-1">{errors.userPassword}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="First name"
                      disabled={isLoading}
                    />
                    {errors.firstName && (
                      <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Last name"
                      disabled={isLoading}
                    />
                    {errors.lastName && (
                      <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>
                    )}
                  </div>
                </div>
              )}

              <div className="mt-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="sendEmail"
                    checked={formData.sendEmail}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    disabled={isLoading}
                  />
                  <span className="ml-2 text-sm text-gray-700">
                    Send login credentials via email
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  If checked, login credentials will be sent to the contact email
                </p>
              </div>
            </div>

            {/* Error Message */}
            {errors.submit && (
              <div className="bg-red-50 border border-red-200 rounded-md p-3">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6">
                <div className="flex items-center">
                  <svg className="h-5 w-5 text-green-400 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <p className="text-green-600 font-medium">
                    Service provider created successfully!
                    {formData.sendEmail && ' Login credentials have been sent via email.'}
                  </p>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Service Provider'
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
