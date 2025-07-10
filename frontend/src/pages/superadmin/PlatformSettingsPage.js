import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import {
  selectPlatformSettings,
  fetchPlatformSettings,
  updatePlatformSettings,
  selectPlatformSettingsLoading,
  selectPlatformSettingsError
} from '../../redux/slices/settingsSlice';
import { toast } from 'react-toastify';

// Create validation schema
const SettingsSchema = Yup.object().shape({
  platformName: Yup.string()
    .min(2, 'Platform name is too short')
    .max(50, 'Platform name is too long')
    .required('Platform name is required'),

  platformFee: Yup.number()
    .min(0, 'Fee cannot be negative')
    .max(30, 'Fee cannot exceed 30%')
    .required('Platform fee percentage is required'),

  defaultCurrency: Yup.string()
    .required('Default currency is required'),

  supportEmail: Yup.string()
    .email('Invalid email address')
    .required('Support email is required'),

  supportPhone: Yup.string()
    .matches(/^[\+]?[1-9][\d]{0,15}$/, 'Invalid phone number')
    .required('Support phone is required'),

  mailSettings: Yup.object().shape({
    fromEmail: Yup.string()
      .email('Invalid email address')
      .required('From email is required'),

    smtpHost: Yup.string()
      .required('SMTP host is required'),

    smtpPort: Yup.number()
      .required('SMTP port is required')
      .integer('Port must be an integer'),

    smtpSecure: Yup.boolean(),

    smtpUsername: Yup.string()
      .required('SMTP username is required'),

    smtpPassword: Yup.string()
      .required('SMTP password is required')
  }),

  stripeSettings: Yup.object().shape({
    publicKey: Yup.string()
      .required('Stripe public key is required'),

    secretKey: Yup.string()
      .required('Stripe secret key is required'),

    webhookSecret: Yup.string()
      .required('Webhook secret is required')
  })
});

const PlatformSettingsPage = () => {
  const dispatch = useDispatch();
  const settings = useSelector(selectPlatformSettings);
  const isLoading = useSelector(selectPlatformSettingsLoading);
  const error = useSelector(selectPlatformSettingsError);
  const [activeTab, setActiveTab] = useState('general');
  const [showPassword, setShowPassword] = useState(false);
  const [showStripeKeys, setShowStripeKeys] = useState(false);

  useEffect(() => {
    dispatch(fetchPlatformSettings());
  }, [dispatch]);

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      await dispatch(updatePlatformSettings(values)).unwrap();
      toast.success('Settings updated successfully');
    } catch (error) {
      toast.error(error.message || 'Failed to update settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Error!</strong>
          <span className="block sm:inline"> {error}</span>
        </div>
      </div>
    );
  }

  const initialValues = settings || {
    platformName: '',
    platformFee: 5,
    defaultCurrency: 'USD',
    supportEmail: '',
    supportPhone: '',
    mailSettings: {
      fromEmail: '',
      smtpHost: '',
      smtpPort: 587,
      smtpSecure: false,
      smtpUsername: '',
      smtpPassword: ''
    },
    stripeSettings: {
      publicKey: '',
      secretKey: '',
      webhookSecret: ''
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Platform Settings</h1>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('mail')}
            className={`${
              activeTab === 'mail'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Email Configuration
          </button>
          <button
            onClick={() => setActiveTab('payment')}
            className={`${
              activeTab === 'payment'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
          >
            Payment Settings
          </button>
        </nav>
      </div>

      {/* Settings Form */}
      <div className="bg-white shadow rounded-lg">
        <Formik
          initialValues={initialValues}
          validationSchema={SettingsSchema}
          onSubmit={handleSubmit}
          enableReinitialize
        >
          {({ isSubmitting, values, errors, touched }) => (
            <Form className="space-y-6 p-6">
              {/* General Settings */}
              {activeTab === 'general' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-gray-900">General Settings</h2>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="platformName" className="block text-sm font-medium text-gray-700">
                        Platform Name
                      </label>
                      <Field
                        type="text"
                        name="platformName"
                        id="platformName"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.platformName && touched.platformName ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="platformName" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="platformFee" className="block text-sm font-medium text-gray-700">
                        Platform Fee (%)
                      </label>
                      <Field
                        type="number"
                        name="platformFee"
                        id="platformFee"
                        min="0"
                        max="30"
                        step="0.01"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.platformFee && touched.platformFee ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="platformFee" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="defaultCurrency" className="block text-sm font-medium text-gray-700">
                        Default Currency
                      </label>
                      <Field
                        as="select"
                        name="defaultCurrency"
                        id="defaultCurrency"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.defaultCurrency && touched.defaultCurrency ? 'border-red-300' : ''
                        }`}
                      >
                        <option value="USD">USD - US Dollar</option>
                        <option value="EUR">EUR - Euro</option>
                        <option value="GBP">GBP - British Pound</option>
                        <option value="CAD">CAD - Canadian Dollar</option>
                        <option value="AUD">AUD - Australian Dollar</option>
                      </Field>
                      <ErrorMessage name="defaultCurrency" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700">
                        Support Email
                      </label>
                      <Field
                        type="email"
                        name="supportEmail"
                        id="supportEmail"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.supportEmail && touched.supportEmail ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="supportEmail" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="supportPhone" className="block text-sm font-medium text-gray-700">
                        Support Phone
                      </label>
                      <Field
                        type="tel"
                        name="supportPhone"
                        id="supportPhone"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.supportPhone && touched.supportPhone ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="supportPhone" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>
                </div>
              )}

              {/* Email Configuration */}
              {activeTab === 'mail' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-gray-900">Email Configuration</h2>

                  <div>
                    <label htmlFor="mailSettings.fromEmail" className="block text-sm font-medium text-gray-700">
                      From Email
                    </label>
                    <Field
                      type="email"
                      name="mailSettings.fromEmail"
                      id="mailSettings.fromEmail"
                      className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                        errors.mailSettings?.fromEmail && touched.mailSettings?.fromEmail ? 'border-red-300' : ''
                      }`}
                    />
                    <ErrorMessage name="mailSettings.fromEmail" component="p" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="mailSettings.smtpHost" className="block text-sm font-medium text-gray-700">
                        SMTP Host
                      </label>
                      <Field
                        type="text"
                        name="mailSettings.smtpHost"
                        id="mailSettings.smtpHost"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.mailSettings?.smtpHost && touched.mailSettings?.smtpHost ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="mailSettings.smtpHost" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="mailSettings.smtpPort" className="block text-sm font-medium text-gray-700">
                        SMTP Port
                      </label>
                      <Field
                        type="number"
                        name="mailSettings.smtpPort"
                        id="mailSettings.smtpPort"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.mailSettings?.smtpPort && touched.mailSettings?.smtpPort ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="mailSettings.smtpPort" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <Field
                      type="checkbox"
                      name="mailSettings.smtpSecure"
                      id="mailSettings.smtpSecure"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="mailSettings.smtpSecure" className="ml-2 block text-sm font-medium text-gray-700">
                      Use Secure Connection (SSL/TLS)
                    </label>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="mailSettings.smtpUsername" className="block text-sm font-medium text-gray-700">
                        SMTP Username
                      </label>
                      <Field
                        type="text"
                        name="mailSettings.smtpUsername"
                        id="mailSettings.smtpUsername"
                        className={`mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md ${
                          errors.mailSettings?.smtpUsername && touched.mailSettings?.smtpUsername ? 'border-red-300' : ''
                        }`}
                      />
                      <ErrorMessage name="mailSettings.smtpUsername" component="p" className="mt-1 text-sm text-red-600" />
                    </div>

                    <div>
                      <label htmlFor="mailSettings.smtpPassword" className="block text-sm font-medium text-gray-700">
                        SMTP Password
                      </label>
                      <div className="mt-1 relative rounded-md shadow-sm">
                        <Field
                          type={showPassword ? 'text' : 'password'}
                          name="mailSettings.smtpPassword"
                          id="mailSettings.smtpPassword"
                          className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md ${
                            errors.mailSettings?.smtpPassword && touched.mailSettings?.smtpPassword ? 'border-red-300' : ''
                          }`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      <ErrorMessage name="mailSettings.smtpPassword" component="p" className="mt-1 text-sm text-red-600" />
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      type="button"
                      className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Test Connection
                    </button>
                  </div>
                </div>
              )}

              {/* Payment Settings */}
              {activeTab === 'payment' && (
                <div className="space-y-6">
                  <h2 className="text-xl font-medium text-gray-900">Payment Settings</h2>

                  <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                          API keys are sensitive data. They will be securely stored and only partially displayed.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="stripeSettings.publicKey" className="block text-sm font-medium text-gray-700">
                      Stripe Public Key
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Field
                        type={showStripeKeys ? 'text' : 'password'}
                        name="stripeSettings.publicKey"
                        id="stripeSettings.publicKey"
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md ${
                          errors.stripeSettings?.publicKey && touched.stripeSettings?.publicKey ? 'border-red-300' : ''
                        }`}
                      />
                      <button
                        type="button"
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        onClick={() => setShowStripeKeys(!showStripeKeys)}
                      >
                        {showStripeKeys ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                          </svg>
                        ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <ErrorMessage name="stripeSettings.publicKey" component="p" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label htmlFor="stripeSettings.secretKey" className="block text-sm font-medium text-gray-700">
                      Stripe Secret Key
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Field
                        type={showStripeKeys ? 'text' : 'password'}
                        name="stripeSettings.secretKey"
                        id="stripeSettings.secretKey"
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md ${
                          errors.stripeSettings?.secretKey && touched.stripeSettings?.secretKey ? 'border-red-300' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="stripeSettings.secretKey" component="p" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div>
                    <label htmlFor="stripeSettings.webhookSecret" className="block text-sm font-medium text-gray-700">
                      Stripe Webhook Secret
                    </label>
                    <div className="mt-1 relative rounded-md shadow-sm">
                      <Field
                        type={showStripeKeys ? 'text' : 'password'}
                        name="stripeSettings.webhookSecret"
                        id="stripeSettings.webhookSecret"
                        className={`focus:ring-blue-500 focus:border-blue-500 block w-full pr-10 sm:text-sm border-gray-300 rounded-md ${
                          errors.stripeSettings?.webhookSecret && touched.stripeSettings?.webhookSecret ? 'border-red-300' : ''
                        }`}
                      />
                    </div>
                    <ErrorMessage name="stripeSettings.webhookSecret" component="p" className="mt-1 text-sm text-red-600" />
                  </div>
                </div>
              )}

              <div className="pt-5 border-t border-gray-200">
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 mr-3"
                    onClick={() => dispatch(fetchPlatformSettings())}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      isSubmitting ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      'Save Settings'
                    )}
                  </button>
                </div>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PlatformSettingsPage;
