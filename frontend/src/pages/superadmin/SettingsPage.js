/**
 * SuperAdmin Settings Page
 * Allows Super Admin to configure platform settings
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchSettings,
  updateSettings,
  selectSettings,
  selectSettingsLoading
} from '../../redux/slices/settingsSlice';
import { toast } from 'react-toastify';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';

const SuperAdminSettingsPage = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectSettings);
  const isLoading = useSelector(selectSettingsLoading);
  const [activeTab, setActiveTab] = useState('general');

  useEffect(() => {
    dispatch(fetchSettings());
  }, [dispatch]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const validationSchema = Yup.object({
    platformName: Yup.string().required('Platform name is required'),
    platformFeePercentage: Yup.number()
      .required('Platform fee is required')
      .min(0, 'Fee must be at least 0%')
      .max(100, 'Fee cannot exceed 100%'),
    supportEmail: Yup.string()
      .required('Support email is required')
      .email('Invalid email format'),
    supportPhone: Yup.string().required('Support phone is required'),
    allowGuestRegistration: Yup.boolean(),
    enabledPaymentMethods: Yup.array().min(1, 'At least one payment method is required'),
    defaultCurrency: Yup.string().required('Default currency is required'),
    smtpHost: Yup.string().required('SMTP host is required'),
    smtpPort: Yup.number().required('SMTP port is required'),
    smtpUsername: Yup.string().required('SMTP username is required'),
    smtpPassword: Yup.string().required('SMTP password is required'),
  });

  const handleSubmit = (values) => {
    dispatch(updateSettings(values))
      .unwrap()
      .then(() => toast.success('Settings updated successfully'))
      .catch((error) => toast.error(`Error updating settings: ${error}`));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="px-4 py-6 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Platform Settings</h1>
          <p className="mt-2 text-sm text-gray-700">
            Configure global settings for the entire platform
          </p>
        </div>
      </div>

      <div className="mt-6">
        <div className="hidden sm:block">
          <nav className="flex space-x-4" aria-label="Tabs">
            <button
              onClick={() => handleTabChange('general')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'general'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              General
            </button>
            <button
              onClick={() => handleTabChange('payment')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'payment'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Payment
            </button>
            <button
              onClick={() => handleTabChange('email')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'email'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Email
            </button>
            <button
              onClick={() => handleTabChange('security')}
              className={`px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === 'security'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Security
            </button>
          </nav>
        </div>
      </div>

      <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-md">
        <div className="px-4 py-5 sm:p-6">
          <Formik
            initialValues={{
              platformName: settings?.platformName || 'Hotel Service Platform',
              platformFeePercentage: settings?.platformFeePercentage || 5,
              supportEmail: settings?.supportEmail || 'support@hotelplatform.com',
              supportPhone: settings?.supportPhone || '+1-800-123-4567',
              allowGuestRegistration: settings?.allowGuestRegistration || true,
              enabledPaymentMethods: settings?.enabledPaymentMethods || ['credit_card', 'paypal'],
              defaultCurrency: settings?.defaultCurrency || 'USD',
              smtpHost: settings?.smtp?.host || '',
              smtpPort: settings?.smtp?.port || 587,
              smtpUsername: settings?.smtp?.username || '',
              smtpPassword: settings?.smtp?.password || '',
              minPasswordLength: settings?.security?.minPasswordLength || 8,
              enableTwoFactorAuth: settings?.security?.enableTwoFactorAuth || false,
              sessionTimeout: settings?.security?.sessionTimeout || 30,
            }}
            validationSchema={validationSchema}
            onSubmit={handleSubmit}
          >
            {({ isSubmitting }) => (
              <Form className="space-y-8">
                {activeTab === 'general' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">General Settings</h3>
                      <p className="mt-1 text-sm text-gray-500">Basic platform configuration</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">
                          Platform Name
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="platformName"
                            id="platformName"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="platformName" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
                          Support Email
                        </label>
                        <div className="mt-1">
                          <Field
                            type="email"
                            name="supportEmail"
                            id="supportEmail"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="supportEmail" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700">
                          Support Phone
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="supportPhone"
                            id="supportPhone"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="supportPhone" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name="allowGuestRegistration"
                            id="allowGuestRegistration"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="allowGuestRegistration" className="ml-3 block text-sm font-medium text-gray-700">
                            Allow Guest Registration
                          </label>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Allow users to register without an invitation
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'payment' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Payment Settings</h3>
                      <p className="mt-1 text-sm text-gray-500">Configure payment methods and fees</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label htmlFor="platformFeePercentage" className="block text-sm font-medium text-gray-700">
                          Platform Fee Percentage
                        </label>
                        <div className="mt-1">
                          <Field
                            type="number"
                            name="platformFeePercentage"
                            id="platformFeePercentage"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="platformFeePercentage" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Percentage fee that the platform charges on each transaction
                        </p>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700">
                          Default Currency
                        </label>
                        <div className="mt-1">
                          <Field
                            as="select"
                            name="defaultCurrency"
                            id="defaultCurrency"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          >
                            <option value="USD">USD - US Dollar</option>
                            <option value="EUR">EUR - Euro</option>
                            <option value="GBP">GBP - British Pound</option>
                            <option value="JPY">JPY - Japanese Yen</option>
                            <option value="CAD">CAD - Canadian Dollar</option>
                            <option value="AUD">AUD - Australian Dollar</option>
                          </Field>
                          <ErrorMessage name="defaultCurrency" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label className="block text-sm font-medium text-gray-700">Enabled Payment Methods</label>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center">
                            <Field
                              type="checkbox"
                              name="enabledPaymentMethods"
                              id="credit_card"
                              value="credit_card"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="credit_card" className="ml-3 block text-sm font-medium text-gray-700">
                              Credit Card
                            </label>
                          </div>
                          <div className="flex items-center">
                            <Field
                              type="checkbox"
                              name="enabledPaymentMethods"
                              id="paypal"
                              value="paypal"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="paypal" className="ml-3 block text-sm font-medium text-gray-700">
                              PayPal
                            </label>
                          </div>
                          <div className="flex items-center">
                            <Field
                              type="checkbox"
                              name="enabledPaymentMethods"
                              id="bank_transfer"
                              value="bank_transfer"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="bank_transfer" className="ml-3 block text-sm font-medium text-gray-700">
                              Bank Transfer
                            </label>
                          </div>
                          <ErrorMessage name="enabledPaymentMethods" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'email' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Email Settings</h3>
                      <p className="mt-1 text-sm text-gray-500">Configure SMTP settings for sending emails</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-4">
                        <label htmlFor="smtpHost" className="block text-sm font-medium text-gray-700">
                          SMTP Host
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="smtpHost"
                            id="smtpHost"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="smtpHost" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="smtpPort" className="block text-sm font-medium text-gray-700">
                          SMTP Port
                        </label>
                        <div className="mt-1">
                          <Field
                            type="number"
                            name="smtpPort"
                            id="smtpPort"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="smtpPort" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="smtpUsername" className="block text-sm font-medium text-gray-700">
                          SMTP Username
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="smtpUsername"
                            id="smtpUsername"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="smtpUsername" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="smtpPassword" className="block text-sm font-medium text-gray-700">
                          SMTP Password
                        </label>
                        <div className="mt-1">
                          <Field
                            type="password"
                            name="smtpPassword"
                            id="smtpPassword"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="smtpPassword" component="p" className="mt-1 text-sm text-red-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === 'security' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h3>
                      <p className="mt-1 text-sm text-gray-500">Configure platform security options</p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-2">
                        <label htmlFor="minPasswordLength" className="block text-sm font-medium text-gray-700">
                          Minimum Password Length
                        </label>
                        <div className="mt-1">
                          <Field
                            type="number"
                            name="minPasswordLength"
                            id="minPasswordLength"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <label htmlFor="sessionTimeout" className="block text-sm font-medium text-gray-700">
                          Session Timeout (minutes)
                        </label>
                        <div className="mt-1">
                          <Field
                            type="number"
                            name="sessionTimeout"
                            id="sessionTimeout"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <div className="flex items-center">
                          <Field
                            type="checkbox"
                            name="enableTwoFactorAuth"
                            id="enableTwoFactorAuth"
                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          />
                          <label htmlFor="enableTwoFactorAuth" className="ml-3 block text-sm font-medium text-gray-700">
                            Enable Two-Factor Authentication
                          </label>
                        </div>
                        <p className="mt-1 text-sm text-gray-500">
                          Require two-factor authentication for all admin users
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="pt-5">
                  <div className="flex justify-end">
                    <button
                      type="button"
                      className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {isSubmitting ? 'Saving...' : 'Save Settings'}
                    </button>
                  </div>
                </div>
              </Form>
            )}
          </Formik>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminSettingsPage;
