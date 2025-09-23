/**
 * Client Register Page
 * Handles user registration for guests/clients only
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useRTL from '../../hooks/useRTL';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import QRScanner from '../../components/common/QRScanner';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import * as Yup from 'yup';
import { HiUser, HiMail, HiLockClosed, HiQrcode } from 'react-icons/hi';
import { register, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole } from '../../redux/slices/authSlice';
import hotelService from '../../services/hotel.service';
import authService from '../../services/auth.service';
import { toast } from 'react-hot-toast';

const RegisterPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const role = useSelector(selectAuthRole);

  const [showError, setShowError] = useState(false);

  // QR Code functionality
  const [searchParams] = useSearchParams();
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrHotelInfo, setQrHotelInfo] = useState(null);
  const [validatingQR, setValidatingQR] = useState(false);

  // Validation schema with translations
  const validationSchema = Yup.object({
    firstName: Yup.string().required(t('register.validation.firstNameRequired')),
    email: Yup.string()
      .email(t('register.validation.emailInvalid'))
      .required(t('register.validation.emailRequired')),
    phone: Yup.string()
      .required(t('register.validation.phoneRequired'))
      .matches(/^[+]?[\d\s\-().]{7,20}$/, t('register.validation.phoneInvalid')),
    selectedHotelId: Yup.string().required(t('register.validation.hotelRequired')),
    roomNumber: Yup.string()
      .required('Room number is required')
      .matches(/^[A-Za-z0-9]+$/, 'Room number should only contain letters and numbers'),
    checkInDate: Yup.date()
      .required('Check-in date is required')
      .min(new Date().toISOString().split('T')[0], 'Check-in date cannot be in the past'),
    checkOutDate: Yup.date()
      .required('Check-out date is required')
      .min(Yup.ref('checkInDate'), 'Check-out date must be after check-in date'),
    password: Yup.string()
    .min(4, 'Password must be at least 4 characters')
    .required(t('register.validation.passwordRequired')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], t('register.validation.passwordsMatch'))
      .required(t('register.validation.confirmPasswordRequired')),
    acceptTerms: Yup.boolean().oneOf([true], t('register.validation.acceptTermsRequired'))
  });

  // Handle redirection after successful registration
  useEffect(() => {
    if (isAuthenticated && role === 'guest') {
      navigate('/');
    } else if (isAuthenticated && role !== 'guest') {
      // If registered but not as guest, redirect to appropriate dashboard
      switch (role) {
        case 'superadmin':
          navigate('/superadmin/dashboard');
          break;
        case 'hotel':
          navigate('/hotel/dashboard');
          break;
        case 'service':
          navigate('/service/dashboard');
          break;
        default:
          navigate('/');
          break;
      }
    }
  }, [isAuthenticated, role, navigate]);

  // Display error for 5 seconds
  useEffect(() => {
    if (authError) {
      setShowError(true);
      const timer = setTimeout(() => {
        setShowError(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [authError]);

  // Handle QR code from URL parameter
  useEffect(() => {
    const qrToken = searchParams.get('qr');
    if (qrToken) {
      validateQRToken(qrToken);
    }
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Validate QR token and extract hotel information
   */
  const validateQRToken = async (qrToken) => {
    setValidatingQR(true);
    try {
      // Clear any existing authentication session to prevent cookie interference
      // This ensures QR scanning works even if user has previous login cookies
      console.log('Clearing existing session before QR validation...');
      authService.clearSession();

      const response = await hotelService.validateQRToken(qrToken);

      if (response.data && response.data.hotelId) {
        setQrHotelInfo(response.data);
        toast.success(`Hotel "${response.data.hotelName}" selected from QR code!`);

        // Update form field directly if ref is available
        if (formFieldUpdaterRef.current) {
          formFieldUpdaterRef.current('selectedHotelId', response.data.hotelId);
        }

        // Clear QR parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('qr');
        navigate({
          pathname: '/register',
          search: newSearchParams.toString()
        }, { replace: true });
      }
    } catch (error) {
      console.error('QR validation error:', error);
      toast.error(error.response?.data?.message || 'Invalid QR code. Please try again or select hotel manually.');
    } finally {
      setValidatingQR(false);
    }
  };

  /**
   * Handle successful QR scan
   */
  const handleQRScanSuccess = (qrToken) => {
    setShowQRScanner(false);
    validateQRToken(qrToken);
  };

  /**
   * Handle QR scan error
   */
  const handleQRScanError = (error) => {
    console.error('QR scan error:', error);
    toast.error('Failed to scan QR code. Please try again.');
  };

  /**
   * Clear QR hotel selection
   */
  const clearQRSelection = () => {
    setQrHotelInfo(null);
    toast.info('QR hotel selection cleared. You can now select manually.');
  };

  // Handle QR hotel selection to preserve form data
  const formFieldUpdaterRef = React.useRef(null);

  // Initial form values - static initial values
  const initialValues = {
    firstName: '',
    email: '',
    phone: '',
    selectedHotelId: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
    password: '',
    confirmPassword: '',
    role: 'guest', // Fixed role for client registration
    acceptTerms: false,
  };  // Handle form submission
  const handleSubmit = (values) => {
    const userData = {
      firstName: values.firstName,
      email: values.email,
      phone: values.phone,
      password: values.password,
      selectedHotelId: values.selectedHotelId,
      roomNumber: values.roomNumber,
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      qrBased: !!qrHotelInfo, // Flag to indicate QR-based registration
    };

    dispatch(register({ userData, role: values.role }));
  };
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/qickroom.png"
            alt="Qickroom Logo"
            className="mx-auto h-16 w-auto mb-4"
          />
        </div>

        {/* Language Switcher */}
        <div className={`flex ${isRTL ? 'justify-start' : 'justify-end'} mb-4`}>
          <LanguageSwitcher className="scale-90" />
        </div>

        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">{t('register.createYourAccount')}</h2>
          <p className="text-gray-600 mt-2">{t('register.registerForYourHotelStay')}</p>
        </div>

        {showError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{authError}</span>            <span className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer" onClick={() => setShowError(false)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>{t('register.close')}</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
          enableReinitialize={false}
        >
          {({ isSubmitting, setFieldValue }) => {
            // Store the setFieldValue function for QR updates
            formFieldUpdaterRef.current = setFieldValue;

            return (
            <Form className="space-y-4">              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.firstName')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="text"
                    name="firstName"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('register.firstNamePlaceholder')}
                  />
                </div>
                <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.emailAddress')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="email"
                    name="email"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('register.enterYourEmail')}
                  />
                </div>
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.phoneNumber')} <span className="text-red-500">*</span>
                </label>
                <Field name="phone">
                  {({ field, form }) => (
                    <div className="relative">
                      <style>{`
                        .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input {
                          position: relative !important;
                          width: 100% !important;
                        }
                        .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .flag-dropdown {
                          position: absolute !important;
                          top: 1px !important;
                          ${isRTL ? 'right: 1px !important; left: auto !important;' : 'left: 1px !important; right: auto !important;'}
                          height: 40px !important;
                          width: 54px !important;
                          border: none !important;
                          border-radius: ${isRTL ? '0 5px 5px 0' : '5px 0 0 5px'} !important;
                          background-color: #f9fafb !important;
                          z-index: 1 !important;
                          border-right: ${isRTL ? 'none' : '1px solid #d1d5db'} !important;
                          border-left: ${isRTL ? '1px solid #d1d5db' : 'none'} !important;
                          display: flex !important;
                          align-items: center !important;
                          justify-content: center !important;
                        }
                        .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .flag-dropdown .selected-flag {
                          position: relative !important;
                          width: 100% !important;
                          height: 100% !important;
                          display: flex !important;
                          align-items: center !important;
                          justify-content: center !important;
                          padding: 0 !important;
                        }
                        .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .flag-dropdown .arrow {
                          position: absolute !important;
                          right: 3px !important;
                          top: 50% !important;
                          transform: translateY(-50%) !important;
                          border-top: 4px solid #9ca3af !important;
                          border-left: 3px solid transparent !important;
                          border-right: 3px solid transparent !important;
                        }
                        .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .form-control {
                          width: 100% !important;
                          height: 42px !important;
                          border: 1px solid #d1d5db !important;
                          border-radius: 6px !important;
                          font-size: 14px !important;
                          padding-left: ${isRTL ? '12px' : '60px'} !important;
                          padding-right: ${isRTL ? '60px' : '12px'} !important;
                          text-align: ${isRTL ? 'right' : 'left'} !important;
                          direction: ltr !important;
                          box-sizing: border-box !important;
                          text-indent: ${isRTL ? '-45px' : '0'} !important;
                        }
                        .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .country-list {
                          ${isRTL ? 'right: 0 !important; left: auto !important;' : 'left: 0 !important; right: auto !important;'}
                          text-align: left !important;
                          direction: ltr !important;
                          z-index: 9999 !important;
                          position: absolute !important;
                          top: 100% !important;
                          margin-top: 1px !important;
                        }
                      `}</style>
                      <div className={`phone-container-${isRTL ? 'rtl' : 'ltr'}`}>
                        <PhoneInput
                          country={'eg'}
                          value={field.value}
                          onChange={(phone) => form.setFieldValue('phone', phone)}
                          inputProps={{
                            name: 'phone',
                            required: true,
                            dir: isRTL ? 'rtl' : 'ltr'
                          }}
                          containerStyle={{
                            width: '100%',
                            position: 'relative'
                          }}
                          inputStyle={{
                            width: '100%',
                            height: '42px',
                            border: '1px solid #d1d5db',
                            borderRadius: '6px',
                            fontSize: '14px',
                            paddingLeft: isRTL ? '12px' : '60px',
                            paddingRight: isRTL ? '60px' : '12px',
                            textAlign: isRTL ? 'right' : 'left',
                            direction: 'ltr',
                            boxSizing: 'border-box',
                            textIndent: isRTL ? '-45px' : '0'
                          }}
                          buttonStyle={{
                            position: 'absolute',
                            top: '1px',
                            [isRTL ? 'right' : 'left']: '1px',
                            height: '40px',
                            width: '54px',
                            border: 'none',
                            borderRadius: isRTL ? '0 5px 5px 0' : '5px 0 0 5px',
                            backgroundColor: '#f9fafb',
                            zIndex: 1,
                            [isRTL ? 'borderLeft' : 'borderRight']: '1px solid #d1d5db',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}
                          dropdownStyle={{
                            position: 'absolute',
                            top: '100%',
                            [isRTL ? 'right' : 'left']: '0',
                            marginTop: '1px',
                            zIndex: 9999,
                            textAlign: 'left',
                            direction: 'ltr'
                          }}
                        />
                      </div>
                    </div>
                  )}
                </Field>
                <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
              </div>              {/* Hotel Selection with QR Support */}
              <div>
                <label htmlFor="selectedHotelId" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.selectHotel')} <span className="text-red-500">*</span>
                </label>

                {/* QR Code Hotel Info Display */}
                {qrHotelInfo ? (
                  <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <HiQrcode className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-800">{qrHotelInfo.hotelName}</p>
                          <p className="text-xs text-green-600">Selected via QR code</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={clearQRSelection}
                        className="text-xs text-green-600 hover:text-green-800 underline"
                      >
                        Change
                      </button>
                    </div>
                  </div>
                ) : (
                  /* QR Scanner Only */
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={() => setShowQRScanner(true)}
                      className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      disabled={validatingQR}
                    >
                      <HiQrcode className="h-5 w-5" />
                      <span>{validatingQR ? 'Validating...' : 'Scan QR Code'}</span>
                    </button>

                    {/* Clear Session Button for users with login cookies */}
                    <button
                      type="button"
                      onClick={() => {
                        authService.clearSession();
                        toast.success('Session cleared! You can now scan QR codes without interference.');
                      }}
                      className="ml-2 inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Clear any existing login data that might interfere with QR scanning"
                    >
                      <span className="text-sm">Clear Session</span>
                    </button>

                    <p className="mt-1 text-xs text-gray-500">
                      Scan the QR code at hotel reception to proceed with registration
                    </p>
                    <p className="mt-1 text-xs text-orange-600">
                      If QR scanning doesn't work, try clicking "Clear Session" first
                    </p>
                  </div>
                )}

                {/* Hidden field for QR hotel selection */}
                {qrHotelInfo && (
                  <Field name="selectedHotelId">
                    {({ field, form }) => {
                      // Ensure the field value is set when QR info is available
                      if (qrHotelInfo && field.value !== qrHotelInfo.hotelId) {
                        form.setFieldValue('selectedHotelId', qrHotelInfo.hotelId);
                      }
                      return (
                        <input
                          type="hidden"
                          {...field}
                          value={qrHotelInfo.hotelId}
                        />
                      );
                    }}
                  </Field>
                )}

                <ErrorMessage name="selectedHotelId" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              {/* Room Number Field */}
              <div>
                <label htmlFor="roomNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Room Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15h8" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4" />
                    </svg>
                  </div>
                  <Field
                    type="text"
                    name="roomNumber"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 101, A205, Suite1"
                  />
                </div>
                <ErrorMessage name="roomNumber" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              {/* Check-in Date Field */}
              <div>
                <label htmlFor="checkInDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-in Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <Field
                    type="date"
                    name="checkInDate"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <ErrorMessage name="checkInDate" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              {/* Check-out Date Field */}
              <div>
                <label htmlFor="checkOutDate" className="block text-sm font-medium text-gray-700 mb-1">
                  Check-out Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                    </svg>
                  </div>
                  <Field
                    type="date"
                    name="checkOutDate"
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <ErrorMessage name="checkOutDate" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.password')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="password"
                    name="password"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('register.createPassword')}
                  />
                </div>
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="password"
                    name="confirmPassword"
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t('register.confirmPasswordPlaceholder')}
                  />
                </div>
                <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div className="flex items-center">
                <Field
                  type="checkbox"
                  name="acceptTerms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                  {t('register.acceptTerms')} <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">{t('register.termsAndConditions')}</a>
                </label>
              </div>
              <ErrorMessage name="acceptTerms" component="div" className="mt-1 text-sm text-red-600" />              <button
                type="submit"
                disabled={isSubmitting || isLoading}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#3B5787' }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{t('register.creatingAccount')}</span>
                  </div>
                ) : (
                  t('register.createAccount')
                )}
              </button>
            </Form>
            );
          }}
        </Formik>        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.signInHere')}
            </Link>
          </p>
        </div>
      </div>

      {/* QR Scanner Modal */}
      {showQRScanner && (
        <QRScanner
          onScanSuccess={handleQRScanSuccess}
          onScanError={handleQRScanError}
          onClose={() => setShowQRScanner(false)}
        />
      )}
    </div>
  );
};

export default RegisterPage;
