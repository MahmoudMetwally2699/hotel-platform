/**
 * Service Provider Settings Page
 * Manages provider profile, business settings, and payment information
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  fetchProviderProfile,
  updateProviderProfile,
  updateBusinessInfo,
  updatePaymentInfo,
  selectProviderProfile,
  selectServiceLoading,
  selectServiceError
} from '../../redux/slices/serviceSlice';

// Profile validation schema
const ProfileSchema = Yup.object().shape({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().nullable(),
});

// Business info validation schema
const BusinessSchema = Yup.object().shape({
  businessName: Yup.string().required('Business name is required'),
  businessType: Yup.string().required('Business type is required'),
  address: Yup.object().shape({
    street: Yup.string().required('Street address is required'),
    city: Yup.string().required('City is required'),
    state: Yup.string().required('State/Province is required'),
    postalCode: Yup.string().required('Postal code is required'),
    country: Yup.string().required('Country is required'),
  }),
  taxId: Yup.string().nullable(),
});

// Payment info validation schema
const PaymentSchema = Yup.object().shape({
  paymentMethod: Yup.string().required('Payment method is required'),
  accountName: Yup.string().required('Account name is required'),
  accountNumber: Yup.string().when('paymentMethod', {
    is: (val) => val === 'bank_transfer',
    then: () => Yup.string().required('Account number is required'),
    otherwise: () => Yup.string().nullable(),
  }),
  routingNumber: Yup.string().when('paymentMethod', {
    is: (val) => val === 'bank_transfer',
    then: () => Yup.string().required('Routing number is required'),
    otherwise: () => Yup.string().nullable(),
  }),
  bankName: Yup.string().when('paymentMethod', {
    is: (val) => val === 'bank_transfer',
    then: () => Yup.string().required('Bank name is required'),
    otherwise: () => Yup.string().nullable(),
  }),
  paypalEmail: Yup.string().when('paymentMethod', {
    is: (val) => val === 'paypal',
    then: () => Yup.string().email('Invalid PayPal email').required('PayPal email is required'),
    otherwise: () => Yup.string().nullable(),
  }),
});

const SettingsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const profile = useSelector(selectProviderProfile);
  const isLoading = useSelector(selectServiceLoading);
  const error = useSelector(selectServiceError);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileSuccessMsg, setProfileSuccessMsg] = useState(null);
  const [businessSuccessMsg, setBusinessSuccessMsg] = useState(null);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState(null);

  useEffect(() => {
    dispatch(fetchProviderProfile());
  }, [dispatch]);

  const handleProfileSubmit = (values) => {
    dispatch(updateProviderProfile(values))
      .then(() => {
        setProfileSuccessMsg('Profile updated successfully');
        setTimeout(() => setProfileSuccessMsg(null), 3000);
      });
  };

  const handleBusinessSubmit = (values) => {
    dispatch(updateBusinessInfo(values))
      .then(() => {
        setBusinessSuccessMsg('Business information updated successfully');
        setTimeout(() => setBusinessSuccessMsg(null), 3000);
      });
  };

  const handlePaymentSubmit = (values) => {
    dispatch(updatePaymentInfo(values))
      .then(() => {
        setPaymentSuccessMsg('Payment information updated successfully');
        setTimeout(() => setPaymentSuccessMsg(null), 3000);
      });
  };

  const handlePasswordSubmit = (values, { resetForm }) => {
    // Password change logic would be implemented in the service and slice
    // This is a placeholder for now
    setPasswordSuccessMsg('Password updated successfully');
    setTimeout(() => setPasswordSuccessMsg(null), 3000);
    resetForm();
  };

  const renderTabButton = (tabName, label, currentTab) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-4 py-2 text-sm font-medium ${
        currentTab === tabName
          ? 'bg-blue-100 text-blue-700 border-b-2 border-blue-500'
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );

  if (isLoading && !profile) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-3 text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-semibold text-gray-800 mb-6">Account Settings</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
          <span className="block sm:inline">{error}</span>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {/* Tab navigation */}
        <div className="border-b border-gray-200">
          <nav className="flex">
            {renderTabButton('profile', 'Personal Profile', activeTab)}
            {renderTabButton('business', 'Business Information', activeTab)}
            {renderTabButton('payment', 'Payment Settings', activeTab)}
            {renderTabButton('password', 'Change Password', activeTab)}
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h2>

              {profileSuccessMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{profileSuccessMsg}</span>
                </div>
              )}

              <Formik
                initialValues={{
                  firstName: profile?.firstName || '',
                  lastName: profile?.lastName || '',
                  email: profile?.email || '',
                  phone: profile?.phone || '',
                }}
                validationSchema={ProfileSchema}
                onSubmit={handleProfileSubmit}
                enableReinitialize
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First Name
                        </label>
                        <Field
                          type="text"
                          name="firstName"
                          id="firstName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last Name
                        </label>
                        <Field
                          type="text"
                          name="lastName"
                          id="lastName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="lastName" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email Address
                        </label>
                        <Field
                          type="email"
                          name="email"
                          id="email"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone Number
                        </label>
                        <Field
                          type="text"
                          name="phone"
                          id="phone"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Business Info Tab */}
          {activeTab === 'business' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Business Information</h2>

              {businessSuccessMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{businessSuccessMsg}</span>
                </div>
              )}

              <Formik
                initialValues={{
                  businessName: profile?.businessInfo?.businessName || '',
                  businessType: profile?.businessInfo?.businessType || '',
                  address: {
                    street: profile?.businessInfo?.address?.street || '',
                    city: profile?.businessInfo?.address?.city || '',
                    state: profile?.businessInfo?.address?.state || '',
                    postalCode: profile?.businessInfo?.address?.postalCode || '',
                    country: profile?.businessInfo?.address?.country || '',
                  },
                  taxId: profile?.businessInfo?.taxId || '',
                }}
                validationSchema={BusinessSchema}
                onSubmit={handleBusinessSubmit}
                enableReinitialize
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">
                          Business Name
                        </label>
                        <Field
                          type="text"
                          name="businessName"
                          id="businessName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="businessName" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="businessType" className="block text-sm font-medium text-gray-700">
                          Business Type
                        </label>
                        <Field
                          as="select"
                          name="businessType"
                          id="businessType"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        >
                          <option value="">Select Business Type</option>
                          <option value="sole_proprietorship">Sole Proprietorship</option>
                          <option value="partnership">Partnership</option>
                          <option value="llc">LLC</option>
                          <option value="corporation">Corporation</option>
                          <option value="other">Other</option>
                        </Field>
                        <ErrorMessage name="businessType" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="address.street" className="block text-sm font-medium text-gray-700">
                          Street Address
                        </label>
                        <Field
                          type="text"
                          name="address.street"
                          id="address.street"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="address.street" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="address.city" className="block text-sm font-medium text-gray-700">
                          City
                        </label>
                        <Field
                          type="text"
                          name="address.city"
                          id="address.city"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="address.city" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="address.state" className="block text-sm font-medium text-gray-700">
                          State / Province
                        </label>
                        <Field
                          type="text"
                          name="address.state"
                          id="address.state"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="address.state" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="address.postalCode" className="block text-sm font-medium text-gray-700">
                          Postal Code
                        </label>
                        <Field
                          type="text"
                          name="address.postalCode"
                          id="address.postalCode"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="address.postalCode" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="address.country" className="block text-sm font-medium text-gray-700">
                          Country
                        </label>
                        <Field
                          type="text"
                          name="address.country"
                          id="address.country"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="address.country" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                          Tax ID / Business Number (Optional)
                        </label>
                        <Field
                          type="text"
                          name="taxId"
                          id="taxId"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="taxId" component="div" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Payment Settings Tab */}
          {activeTab === 'payment' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Payment Settings</h2>

              {paymentSuccessMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{paymentSuccessMsg}</span>
                </div>
              )}

              <Formik
                initialValues={{
                  paymentMethod: profile?.paymentInfo?.paymentMethod || 'bank_transfer',
                  accountName: profile?.paymentInfo?.accountName || '',
                  accountNumber: profile?.paymentInfo?.accountNumber || '',
                  routingNumber: profile?.paymentInfo?.routingNumber || '',
                  bankName: profile?.paymentInfo?.bankName || '',
                  paypalEmail: profile?.paymentInfo?.paypalEmail || '',
                }}
                validationSchema={PaymentSchema}
                onSubmit={handlePaymentSubmit}
                enableReinitialize
              >
                {({ isSubmitting, values }) => (
                  <Form>
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Payment Method
                      </label>
                      <div className="flex space-x-4">
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name="paymentMethod"
                            value="bank_transfer"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Bank Transfer</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name="paymentMethod"
                            value="paypal"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">PayPal</span>
                        </label>
                        <label className="inline-flex items-center">
                          <Field
                            type="radio"
                            name="paymentMethod"
                            value="check"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                          />
                          <span className="ml-2 text-sm text-gray-700">Check</span>
                        </label>
                      </div>
                      <ErrorMessage name="paymentMethod" component="div" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div>
                        <label htmlFor="accountName" className="block text-sm font-medium text-gray-700">
                          Account Name / Recipient
                        </label>
                        <Field
                          type="text"
                          name="accountName"
                          id="accountName"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="accountName" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      {values.paymentMethod === 'bank_transfer' && (
                        <>
                          <div>
                            <label htmlFor="bankName" className="block text-sm font-medium text-gray-700">
                              Bank Name
                            </label>
                            <Field
                              type="text"
                              name="bankName"
                              id="bankName"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <ErrorMessage name="bankName" component="div" className="mt-1 text-sm text-red-600" />
                          </div>

                          <div>
                            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                              Account Number
                            </label>
                            <Field
                              type="text"
                              name="accountNumber"
                              id="accountNumber"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <ErrorMessage name="accountNumber" component="div" className="mt-1 text-sm text-red-600" />
                          </div>

                          <div>
                            <label htmlFor="routingNumber" className="block text-sm font-medium text-gray-700">
                              Routing Number
                            </label>
                            <Field
                              type="text"
                              name="routingNumber"
                              id="routingNumber"
                              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                            />
                            <ErrorMessage name="routingNumber" component="div" className="mt-1 text-sm text-red-600" />
                          </div>
                        </>
                      )}

                      {values.paymentMethod === 'paypal' && (
                        <div>
                          <label htmlFor="paypalEmail" className="block text-sm font-medium text-gray-700">
                            PayPal Email
                          </label>
                          <Field
                            type="email"
                            name="paypalEmail"
                            id="paypalEmail"
                            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          />
                          <ErrorMessage name="paypalEmail" component="div" className="mt-1 text-sm text-red-600" />
                        </div>
                      )}
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Saving...' : 'Save Changes'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Change Password</h2>

              {passwordSuccessMsg && (
                <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative mb-4" role="alert">
                  <span className="block sm:inline">{passwordSuccessMsg}</span>
                </div>
              )}

              <Formik
                initialValues={{
                  currentPassword: '',
                  newPassword: '',
                  confirmPassword: '',
                }}
                validationSchema={Yup.object({
                  currentPassword: Yup.string().required('Current password is required'),
                  newPassword: Yup.string()
                    .min(8, 'Password must be at least 8 characters')
                    .matches(
                      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
                      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                    )
                    .required('New password is required'),
                  confirmPassword: Yup.string()
                    .oneOf([Yup.ref('newPassword'), null], 'Passwords must match')
                    .required('Confirm password is required'),
                })}
                onSubmit={handlePasswordSubmit}
              >
                {({ isSubmitting }) => (
                  <Form>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                          Current Password
                        </label>
                        <Field
                          type="password"
                          name="currentPassword"
                          id="currentPassword"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="currentPassword" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                          New Password
                        </label>
                        <Field
                          type="password"
                          name="newPassword"
                          id="newPassword"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="newPassword" component="div" className="mt-1 text-sm text-red-600" />
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                          Confirm New Password
                        </label>
                        <Field
                          type="password"
                          name="confirmPassword"
                          id="confirmPassword"
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                        <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
                      </div>
                    </div>

                    <div className="mt-6">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? 'Updating...' : 'Update Password'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
