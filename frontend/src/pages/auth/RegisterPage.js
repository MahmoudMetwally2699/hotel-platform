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
import { register, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole, selectCurrentUser } from '../../redux/slices/authSlice';
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
  const user = useSelector(selectCurrentUser);

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
      // Get user data to extract hotelId
      const userData = user;
      let hotelId = userData?.selectedHotelId;

      // If hotelId is an object, extract the ID
      if (hotelId && typeof hotelId === 'object') {
        hotelId = hotelId._id || hotelId.id || hotelId.toString();
      }

      if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
        // Redirect to onboarding if not completed
        if (!user.onboardingCompleted) {
          navigate(`/guest/onboarding`, { replace: true });
        } else {
          navigate(`/hotels/${hotelId}/categories`, { replace: true });
        }
      } else {
        // Fallback to homepage if no valid hotel ID
        navigate('/', { replace: true });
      }
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
  }, [isAuthenticated, role, navigate, user]);

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
    toast.error('Failed to scan QR code. Please try again.');
  };

  /**
   * Clear QR hotel selection
   */
  const clearQRSelection = () => {
    setQrHotelInfo(null);
    toast.success('QR hotel selection cleared. You can now select manually.');
  };

  // Handle QR hotel selection to preserve form data
  const formFieldUpdaterRef = React.useRef(null);

  // Initial form values - static initial values
  const initialValues = {
    firstName: '',
    email: '',
    phone: '',
    nationality: '',
    selectedHotelId: '',
    roomNumber: '',
    checkInDate: '',
    checkOutDate: '',
    password: '',
    confirmPassword: '',
    role: 'guest', // Fixed role for client registration
    acceptTerms: false,
  };  // Handle form submission
  const handleSubmit = async (values) => {
    const userData = {
      firstName: values.firstName,
      email: values.email,
      phone: values.phone,
      nationality: values.nationality,
      password: values.password,
      selectedHotelId: values.selectedHotelId,
      roomNumber: values.roomNumber,
      checkInDate: values.checkInDate,
      checkOutDate: values.checkOutDate,
      qrBased: !!qrHotelInfo, // Flag to indicate QR-based registration
    };

    try {
      const resultAction = await dispatch(register({ userData, role: values.role }));
      if (register.fulfilled.match(resultAction)) {
        const response = resultAction.payload;
        const token = response?.token || response?.data?.token;
        if (!token) {
          toast.success(response?.message || 'Registration successful. Your account is pending hotel admin approval.', {
            duration: 6000,
          });
          navigate('/login');
        }
      }
    } catch (err) {
      // Redux slice handles rejected state and error display
    }
  };
  return (
    <div className={`min-h-screen flex flex-col lg:flex-row bg-white ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Left Pane - Image & Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-5/12 xl:w-1/3 relative flex-col justify-between p-12 bg-[#3B5787] sticky top-0 h-screen overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0 z-0">
          <img src="/auth-bg.png" alt="Luxury Hotel" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#3B5787] bg-opacity-40 mix-blend-multiply"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#2A4065] via-transparent to-transparent opacity-80"></div>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl inline-block shadow-lg">
            <img
              src="/qickroom.png"
              alt="Qickroom Logo"
              className="h-10 w-auto"
            />
          </div>
        </div>

        {/* Tagline */}
        <div className="relative z-10 text-white max-w-md">
          <h1 className="text-4xl lg:text-5xl font-bold mb-6 leading-tight tracking-tight">
            {t('register.createYourAccount')}
          </h1>
          <p className="text-lg text-white/80 font-medium">
            {t('register.registerForYourHotelStay')}
          </p>
        </div>
      </div>

      {/* Right Pane - Form Container */}
      <div className="w-full lg:w-7/12 xl:w-2/3 flex items-start justify-center p-6 sm:p-12 lg:p-16 relative bg-gray-50/50 min-h-screen">
        <div className="w-full max-w-2xl mx-auto pb-12">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/qickroom.png"
              alt="Qickroom Logo"
              className="mx-auto h-12 w-auto mb-4"
            />
          </div>

          {/* Language Switcher */}
          <div className={`absolute top-6 sm:top-8 ${isRTL ? 'left-6 sm:left-8' : 'right-6 sm:right-8'} z-10`}>
            <LanguageSwitcher className="scale-90" />
          </div>

          <div className="mb-10 lg:mt-0 mt-8 lg:hidden">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('register.createYourAccount')}</h2>
            <p className="text-gray-500 mt-2 text-lg">{t('register.registerForYourHotelStay')}</p>
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
            <Form className="space-y-8">
              {/* Personal Information Section */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">{t('register.personalInformation', 'Personal Information')}</h3>
                <div className="space-y-5">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('register.firstName')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiUser className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="text"
                        name="firstName"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        placeholder={t('register.firstNamePlaceholder')}
                      />
                    </div>
                    <ErrorMessage name="firstName" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('register.emailAddress')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiMail className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="email"
                        name="email"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        placeholder={t('register.enterYourEmail')}
                      />
                    </div>
                    <ErrorMessage name="email" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>                  <div>
                    <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">
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
                              height: 46px !important;
                              width: 54px !important;
                              border: none !important;
                              border-radius: ${isRTL ? '0 11px 11px 0' : '11px 0 0 11px'} !important;
                              background-color: transparent !important;
                              z-index: 1 !important;
                              border-right: ${isRTL ? 'none' : '1px solid #e5e7eb'} !important;
                              border-left: ${isRTL ? '1px solid #e5e7eb' : 'none'} !important;
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
                              height: 48px !important;
                              border: 1px solid #e5e7eb !important;
                              border-radius: 12px !important;
                              font-size: 14px !important;
                              padding-left: ${isRTL ? '16px' : '64px'} !important;
                              padding-right: ${isRTL ? '64px' : '16px'} !important;
                              text-align: ${isRTL ? 'right' : 'left'} !important;
                              direction: ltr !important;
                              box-sizing: border-box !important;
                              text-indent: ${isRTL ? '-45px' : '0'} !important;
                              background-color: rgba(249, 250, 251, 0.5) !important;
                              transition: all 0.2s ease-in-out !important;
                            }
                            .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .form-control:focus {
                              background-color: white !important;
                              border-color: #67BAE0 !important;
                              box-shadow: 0 0 0 2px rgba(103, 186, 224, 0.2) !important;
                            }
                            .phone-container-${isRTL ? 'rtl' : 'ltr'} .react-tel-input .country-list {
                              ${isRTL ? 'right: 0 !important; left: auto !important;' : 'left: 0 !important; right: auto !important;'}
                              text-align: left !important;
                              direction: ltr !important;
                              z-index: 9999 !important;
                              position: absolute !important;
                              top: 100% !important;
                              margin-top: 4px !important;
                              border-radius: 8px !important;
                              border: 1px solid #e5e7eb !important;
                              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
                            }
                          `}</style>
                          <div className={`phone-container-${isRTL ? 'rtl' : 'ltr'}`}>
                            <PhoneInput
                              country={'eg'}
                              value={field.value}
                              onChange={(phone, country) => {
                                form.setFieldValue('phone', phone);
                                if (country && country.name) {
                                  form.setFieldValue('nationality', country.name);
                                }
                              }}
                              inputProps={{
                                name: 'phone',
                                required: true,
                                dir: isRTL ? 'rtl' : 'ltr'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </Field>
                    <ErrorMessage name="phone" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>
                </div>
              </div>              {/* Stay Details Section */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">{t('register.stayDetails', 'Stay Details')}</h3>
                <div className="space-y-5">
                  {/* Hotel Selection with QR Support */}
                  <div>
                    <label htmlFor="selectedHotelId" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('register.selectHotel')} <span className="text-red-500">*</span>
                    </label>

                    {/* QR Code Hotel Info Display */}
                    {qrHotelInfo ? (
                      <div className="mb-3 p-4 bg-green-50 border border-green-200 rounded-xl shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="bg-white p-2 rounded-lg shadow-sm">
                              <HiQrcode className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-green-900">{qrHotelInfo.hotelName}</p>
                              <p className="text-xs font-medium text-green-700 mt-0.5">{t('qrAuth.selectedViaQR')}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={clearQRSelection}
                            className="text-xs font-semibold text-green-700 hover:text-green-900 hover:underline px-3 py-1.5 rounded-lg hover:bg-green-100 transition-colors"
                          >
                            {t('qrAuth.change')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* QR Scanner Only */
                      <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
                        <button
                          type="button"
                          onClick={() => setShowQRScanner(true)}
                          className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3B5787] text-white rounded-xl hover:bg-[#2A4065] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                          disabled={validatingQR}
                        >
                          <HiQrcode className="h-5 w-5" />
                          <span>{validatingQR ? t('qrAuth.validating') : t('qrAuth.scanQR')}</span>
                        </button>

                        {/* Clear Session Button for users with login cookies */}
                        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              authService.clearSession();
                              toast.success('Scanner reset successfully.');
                            }}
                            className="inline-flex items-center space-x-2 px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200 shadow-sm font-medium text-sm"
                            title="Clear any existing login data that might interfere with QR scanning"
                          >
                            <span>{t('qrAuth.resetScanner')}</span>
                          </button>
                        </div>

                        <p className="mt-4 text-xs font-medium text-gray-500">
                          {t('qrAuth.scanAtReception')}
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

                    <ErrorMessage name="selectedHotelId" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>

                  {/* Room Number Field */}
                  <div>
                    <label htmlFor="roomNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('register.roomNumber')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 15h8" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11v4" />
                        </svg>
                      </div>
                      <Field
                        type="text"
                        name="roomNumber"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        placeholder={t('register.roomNumberPlaceholder')}
                      />
                    </div>
                    <ErrorMessage name="roomNumber" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {/* Check-in Date Field */}
                    <div>
                      <label htmlFor="checkInDate" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {t('register.checkInDate')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <Field
                          type="date"
                          name="checkInDate"
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        />
                      </div>
                      <ErrorMessage name="checkInDate" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                    </div>

                    {/* Check-out Date Field */}
                    <div>
                      <label htmlFor="checkOutDate" className="block text-sm font-semibold text-gray-700 mb-1.5">
                        {t('register.checkOutDate')} <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                          </svg>
                        </div>
                        <Field
                          type="date"
                          name="checkOutDate"
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        />
                      </div>
                      <ErrorMessage name="checkOutDate" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-900 mb-6 border-b border-gray-100 pb-3">{t('register.security', 'Security')}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('register.password')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiLockClosed className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="password"
                        name="password"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        placeholder={t('register.createPassword')}
                      />
                    </div>
                    <ErrorMessage name="password" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>

                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">
                      {t('register.confirmPassword')} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <HiLockClosed className="h-5 w-5 text-gray-400" />
                      </div>
                      <Field
                        type="password"
                        name="confirmPassword"
                        className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-gray-50/50 focus:bg-white"
                        placeholder={t('register.confirmPasswordPlaceholder')}
                      />
                    </div>
                    <ErrorMessage name="confirmPassword" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
                  </div>
                </div>
              </div>              <div className="bg-white p-6 sm:p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
                <div className="flex items-center mb-6 w-full">
                  <Field
                    type="checkbox"
                    name="acceptTerms"
                    id="acceptTerms"
                    className="h-5 w-5 text-[#67BAE0] focus:ring-[#67BAE0] border-gray-300 rounded transition-colors cursor-pointer"
                  />
                  <label htmlFor="acceptTerms" className="ml-3 block text-sm font-medium text-gray-700 cursor-pointer">
                    {t('register.acceptTerms')} <a href="/terms" className="font-bold text-[#3B5787] hover:text-[#67BAE0] transition-colors">{t('register.termsAndConditions')}</a>
                  </label>
                </div>
                <div className="w-full">
                  <ErrorMessage name="acceptTerms" component="div" className="mb-4 text-sm text-red-500 font-medium" />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || isLoading}
                  className="w-full py-4 px-6 rounded-xl shadow-lg shadow-[#3B5787]/20 text-base font-bold text-white hover:bg-[#2A4065] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
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

                <div className="mt-6 text-center w-full">
                  <p className="text-sm font-medium text-gray-600">
                    {t('register.alreadyHaveAccount')}{' '}
                    <Link to="/login" className="font-bold text-[#67BAE0] hover:text-[#3B5787] transition-colors">
                      {t('register.signInHere')}
                    </Link>
                  </p>
                </div>
              </div>
            </Form>
            );
          }}
        </Formik>
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
