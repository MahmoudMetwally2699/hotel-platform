/**
 * Client Login Page
 * Handles authentication for guests/clients only
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { HiMail, HiLockClosed, HiQrcode } from 'react-icons/hi';
import { login, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole, selectCurrentUser, clearError, clearLoading, setError } from '../../redux/slices/authSlice';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';
import QRScanner from '../../components/common/QRScanner';
import authService from '../../services/auth.service';
import { toast } from 'react-hot-toast';

const LoginPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const role = useSelector(selectAuthRole);
  const user = useSelector(selectCurrentUser);
  const [showError, setShowError] = useState(false);
  const [authCheckComplete, setAuthCheckComplete] = useState(false);

  // QR Code functionality
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [qrHotelInfo, setQrHotelInfo] = useState(null);
  const [validatingQR, setValidatingQR] = useState(false);

  // Forgot password functionality
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [sendingResetEmail, setSendingResetEmail] = useState(false);

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

        // Redirect based on role
        switch (role) {
          case 'guest':
            // Get user data to extract hotelId
            const userData = user;
            let hotelId = userData?.selectedHotelId;

            // If hotelId is an object, extract the ID
            if (hotelId && typeof hotelId === 'object') {
              hotelId = hotelId._id || hotelId.id || hotelId.toString();
            }

            if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
              navigate(`/hotels/${hotelId}/categories`, { replace: true });
            } else {
              // Fallback to homepage if no valid hotel ID
              navigate('/', { replace: true });
            }
            break;
          case 'superadmin':
            navigate('/superadmin/dashboard', { replace: true });
            break;
          case 'superHotel':
            navigate('/super-hotel-admin/dashboard', { replace: true });
            break;
          case 'hotel':
            navigate('/hotel/dashboard', { replace: true });
            break;
          case 'service':
            navigate('/service/dashboard', { replace: true });
            break;
          default:
            navigate('/', { replace: true });
            break;
        }
      }
    }, 100); // Small delay to allow auth state to settle

    return () => clearTimeout(timer);
  }, [isAuthenticated, role, user, navigate]);

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

  /**
   * Validate QR token and extract hotel information for login
   */
  const validateQRToken = useCallback(async (qrToken) => {
    setValidatingQR(true);
    try {
      // Clear any existing authentication session to prevent cookie interference
      // This ensures QR scanning works even if user has previous login cookies
      authService.clearSession();

      const response = await authService.validateQRToken(qrToken, 'login');

      if (response.data && response.data.hotelId) {
        setQrHotelInfo({
          ...response.data,
          qrToken: qrToken // Store the original QR token for password reset
        });
        toast.success(`Ready to login to "${response.data.hotelName}"!`);

        // Clear QR parameter from URL
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.delete('qr');
        navigate({
          pathname: '/login',
          search: newSearchParams.toString()
        }, { replace: true });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Invalid QR code. Please try again or login manually.');
    } finally {
      setValidatingQR(false);
    }
  }, [navigate, searchParams]);

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
    toast.info('QR hotel selection cleared. You can now login manually.');
  };

  /**
   * Handle forgot password with hotel-scoped QR token
   */
  const handleForgotPassword = async (email) => {
    if (!qrHotelInfo) {
      toast.error('Please scan QR code first to reset password for your hotel.');
      return;
    }

    setSendingResetEmail(true);
    try {
      await authService.forgotPassword({
        email,
        hotelId: qrHotelInfo.hotelId,
        qrToken: qrHotelInfo.qrToken // Include QR token for additional security
      });

      toast.success(`Password reset email sent for ${qrHotelInfo.hotelName}!`);
      setShowForgotPassword(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to send password reset email. Please try again.');
    } finally {
      setSendingResetEmail(false);
    }
  };

  // Check for QR token in URL parameters on component mount
  useEffect(() => {
    const qrToken = searchParams.get('qr');
    if (qrToken) {
      validateQRToken(qrToken);
    }
  }, [searchParams, validateQRToken]);

  // Initial form values
  const initialValues = {
    email: '',
    password: '',
    role: 'guest', // Fixed role for client login
  };  // Handle form submission
  const handleSubmit = (values) => {
    // Include hotelId from QR info if available
    const loginData = {
      ...values,
      hotelId: qrHotelInfo?.hotelId || null
    };

    // Clear any previous errors
    dispatch(clearError());

    // Dispatch the login action with hotelId
    const loginPromise = dispatch(login(loginData));

    // Set a timeout to clear loading state if login takes too long
    const timeoutId = setTimeout(() => {
      dispatch(clearLoading());
      dispatch(setError('Login request timed out. Please try again.'));
    }, 30000); // 30 second timeout

    // Clear timeout and ensure loading is cleared regardless of outcome
    loginPromise.finally(() => {
      clearTimeout(timeoutId);
      // Ensure any global loading flag is cleared so the button is re-enabled after failure
      dispatch(clearLoading());
    });

    // Return the promise so Formik will wait and clear isSubmitting appropriately
    return loginPromise;
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
        {/* Logo */}
        <div className="text-center mb-6">
          <img
            src="/qickroom.png"
            alt="Qickroom Logo"
            className="mx-auto h-16 w-auto mb-4"
          />
        </div>

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
              {/* QR Code Hotel Info Display */}
              {qrHotelInfo ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HiQrcode className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Login to {qrHotelInfo.hotelName}</p>
                        <p className="text-xs text-green-600">Hotel selected via QR code</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearQRSelection}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      Change Hotel
                    </button>
                  </div>
                </div>
              ) : (
                /* QR Scanner Required Notice */
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-center">
                  <HiQrcode className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-sm font-medium text-blue-800 mb-2">QR Code Required for Login</h3>
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="inline-flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    disabled={validatingQR}
                  >
                    <HiQrcode className="h-5 w-5" />
                    <span>{validatingQR ? 'Validating...' : 'Scan QR Code to Login'}</span>
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

                  <p className="mt-2 text-xs text-orange-600">
                    If QR scanning doesn't work, try clicking "Clear Session" first
                  </p>
                </div>
              )}

              <div className="mb-4">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="email"
                    name="email"
                    disabled={!qrHotelInfo}
                    className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!qrHotelInfo ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    placeholder={qrHotelInfo ? t('login.enterYourEmail') : 'Scan QR code first'}
                  />
                </div>
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="password"
                    name="password"
                    disabled={!qrHotelInfo}
                    className={`w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${!qrHotelInfo ? 'bg-gray-100 cursor-not-allowed opacity-60' : ''}`}
                    placeholder={qrHotelInfo ? t('login.enterYourPassword') : 'Scan QR code first'}
                  />
                </div>
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    disabled={!qrHotelInfo}
                    className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${!qrHotelInfo ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                  <label htmlFor="remember-me" className={`ml-2 block text-sm text-gray-700 ${!qrHotelInfo ? 'opacity-60' : ''}`}>
                    {t('login.rememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  {qrHotelInfo ? (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-medium text-blue-600 hover:text-blue-500"
                    >
                      Forgot your password?
                    </button>
                  ) : (
                    <span className="font-medium text-gray-400 cursor-not-allowed">
                      Forgot your password?
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                // Disable the button if no QR info, while submitting, or loading
                disabled={!qrHotelInfo || isSubmitting}
                className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#3B5787' }}
              >
                {/* Show different text based on state */}
                {!qrHotelInfo ? (
                  <div className="flex items-center justify-center">
                    <HiQrcode className="h-5 w-5 mr-2" />
                    <span>Scan QR Code to Enable Login</span>
                  </div>
                ) : (isSubmitting || isLoading) ? (
                  <div className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>{isSubmitting || isLoading ? (t('login.signingIn') + '...') : t('login.signIn')}</span>
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
          {!qrHotelInfo && (
            <p className="text-xs text-gray-500 mt-2">
              QR scan required for login only. Registration is always available.
            </p>
          )}
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && qrHotelInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Reset Password</h3>
              <p className="text-sm text-gray-600 mb-1">
                Reset password for <span className="font-medium">{qrHotelInfo.hotelName}</span>
              </p>
              <p className="text-xs text-gray-500">
                A reset link will be sent to your email for this hotel only.
              </p>
            </div>

            <Formik
              initialValues={{ email: '' }}
              validationSchema={Yup.object({
                email: Yup.string().email('Invalid email').required('Email is required'),
              })}
              onSubmit={(values) => handleForgotPassword(values.email)}
            >
              {({ isSubmitting }) => (
                <Form className="space-y-4">
                  <div>
                    <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Field
                      type="email"
                      name="email"
                      id="reset-email"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Enter your email address"
                    />
                    <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
                  </div>

                  <div className="flex space-x-3">
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(false)}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                      disabled={sendingResetEmail}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={sendingResetEmail || isSubmitting}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {sendingResetEmail ? (
                        <div className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Sending...
                        </div>
                      ) : (
                        'Send Reset Email'
                      )}
                    </button>
                  </div>
                </Form>
              )}
            </Formik>
          </div>
        </div>
      )}

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

export default LoginPage;
