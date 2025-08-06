/**
 * Client Login Page
 * Handles authentication for guests/clients only
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { login, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole, clearError, clearLoading, setError } from '../../redux/slices/authSlice';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import useRTL from '../../hooks/useRTL';

const LoginPage = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const role = useSelector(selectAuthRole);
  const [showError, setShowError] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // Validation schema with translations
  const validationSchema = Yup.object({
    email: Yup.string().email(t('errors.invalidEmail')).required(t('errors.requiredField')),
    password: Yup.string().required(t('errors.requiredField')),
  });

  // Handle redirection after successful login or if already authenticated
  useEffect(() => {
    // Give some time for the authentication state to be properly initialized
    const timer = setTimeout(() => {
      setAuthCheckComplete(true);

      // Check if user is already authenticated when component mounts
      if (isAuthenticated) {
        console.log('User already authenticated with role:', role);

        // Redirect based on role
        switch (role) {
          case 'guest':
            console.log('Redirecting guest to homepage');
            navigate('/', { replace: true });
            break;
          case 'superadmin':
            console.log('Redirecting superadmin to dashboard');
            navigate('/superadmin/dashboard', { replace: true });
            break;
          case 'hotel':
            console.log('Redirecting hotel admin to dashboard');
            navigate('/hotel/dashboard', { replace: true });
            break;
          case 'service':
            console.log('Redirecting service provider to dashboard');
            navigate('/service/dashboard', { replace: true });
            break;
          default:
            console.log('Unknown role, redirecting to homepage');
            navigate('/', { replace: true });
            break;
        }
      }
    }, 100); // Small delay to allow auth state to settle

    return () => clearTimeout(timer);
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

  // Clear any errors and loading state when component mounts
  useEffect(() => {
    dispatch(clearError());
    dispatch(clearLoading());
  }, [dispatch]);

  // Initial form values
  const initialValues = {
    email: '',
    password: '',
    role: 'guest', // Fixed role for client login
  };  // Handle form submission
  const handleSubmit = (values) => {
    console.log('Submitting login form with values:', values);

    // Clear any previous errors
    dispatch(clearError());

    // Dispatch the login action
    const loginPromise = dispatch(login(values));

    // Set a timeout to clear loading state if login takes too long
    const timeoutId = setTimeout(() => {
      console.warn('Login taking too long, clearing loading state');
      dispatch(clearLoading());
      dispatch(setError('Login request timed out. Please try again.'));
    }, 30000); // 30 second timeout

    // Clear timeout if login completes
    loginPromise.finally(() => {
      clearTimeout(timeoutId);    });
  };
  // Show loading screen while checking authentication state
  if (!authCheckComplete || (isAuthenticated && role)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <p className="text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {/* Language Switcher */}
        <div className="flex justify-end mb-4">
          <LanguageSwitcher />
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">{t('login.welcomeBack')}</h2>
          <p className="text-gray-600 mt-2">{t('login.signInToYourAccount')}</p>
        </div>

        {showError && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
            <span className="block sm:inline">{authError}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setShowError(false)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
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
            <Form>
              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.emailAddress')}
                </label>
                <Field
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('login.enterYourEmail')}
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.password')}
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t('login.enterYourPassword')}
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                    {t('login.rememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
                    {t('login.forgotYourPassword')}
                  </Link>
                </div>
              </div>

              <button
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
                    <span>{t('login.signingIn')}...</span>
                  </div>
                ) : (
                  t('login.signIn')
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {t('login.dontHaveAnAccount')}{' '}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              {t('login.signUp')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
