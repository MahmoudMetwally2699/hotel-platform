/**
 * Client Register Page
 * Handles user registration for guests/clients only
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useRTL from '../../hooks/useRTL';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole } from '../../redux/slices/authSlice';
import hotelService from '../../services/hotel.service';

const RegisterPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const role = useSelector(selectAuthRole);

  const [showError, setShowError] = useState(false);  const [hotels, setHotels] = useState([]);
  const [loadingHotels, setLoadingHotels] = useState(true);

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
    password: Yup.string()
    .min(4, 'Password must be at least 4 characters')
    .required(t('register.validation.passwordRequired')),
    confirmPassword: Yup.string()
      .oneOf([Yup.ref('password'), null], t('register.validation.passwordsMatch'))
      .required(t('register.validation.confirmPasswordRequired')),
    acceptTerms: Yup.boolean().oneOf([true], t('register.validation.acceptTermsRequired'))
  });// Fetch available hotels
  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const response = await hotelService.getAllHotels();
        setHotels(response.data || []);
      } catch (error) {
        console.error('Error fetching hotels:', error);
        setHotels([]);
      } finally {
        setLoadingHotels(false);
      }
    };

    fetchHotels();
  }, []);

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
  }, [authError]);  // Initial form values
  const initialValues = {
    firstName: '',
    email: '',
    phone: '',
    selectedHotelId: '',
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
    };

    dispatch(register({ userData, role: values.role }));
  };
  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
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
        >
          {({ isSubmitting }) => (
            <Form className="space-y-4">              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.firstName')} <span className="text-red-500">*</span>
                </label>
                <Field
                  type="text"
                  name="firstName"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('register.firstNamePlaceholder')}
                />
                <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.emailAddress')} <span className="text-red-500">*</span>
                </label>
                <Field
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('register.enterYourEmail')}
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.phoneNumber')} <span className="text-red-500">*</span>
                </label>
                <Field
                  type="tel"
                  name="phone"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('register.enterYourPhoneNumber')}
                />
                <ErrorMessage name="phone" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div>
                <label htmlFor="selectedHotelId" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.selectHotel')} <span className="text-red-500">*</span>
                </label>
                <Field
                  as="select"
                  name="selectedHotelId"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loadingHotels}
                >
                  <option value="">
                    {loadingHotels ? t('register.loadingHotels') : t('register.chooseAHotel')}
                  </option>
                  {hotels.map((hotel) => (
                    <option key={hotel._id || hotel.id} value={hotel._id || hotel.id}>
                      {hotel.name}
                    </option>
                  ))}
                </Field>
                <ErrorMessage name="selectedHotelId" component="div" className="mt-1 text-sm text-red-600" />
                {hotels.length === 0 && !loadingHotels && (
                  <p className="mt-1 text-sm text-yellow-600">{t('register.noHotelsAvailable')}</p>
                )}
              </div>              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.password')} <span className="text-red-500">*</span>
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('register.createPassword')}
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('register.confirmPassword')} <span className="text-red-500">*</span>
                </label>
                <Field
                  type="password"
                  name="confirmPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('register.confirmPasswordPlaceholder')}
                />
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
                className="w-full bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}
        </Formik>        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('register.alreadyHaveAccount')}{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              {t('register.signInHere')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
