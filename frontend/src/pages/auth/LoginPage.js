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

  // Only redirect after a NEW login — not when already authenticated on mount
  const loginJustCompleted = React.useRef(false);

  // Mark auth check complete once Redux state is settled
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthCheckComplete(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Redirect only after a successful login (not on initial mount)
  useEffect(() => {
    if (!loginJustCompleted.current) return;
    if (!isAuthenticated || !role) return;

    loginJustCompleted.current = false;

    switch (role) {
      case 'guest': {
        let hotelId = user?.selectedHotelId;
        if (hotelId && typeof hotelId === 'object') {
          hotelId = hotelId._id || hotelId.id || hotelId.toString();
        }
        if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
          navigate(`/hotels/${hotelId}/categories`, { replace: true });
        } else {
          navigate('/', { replace: true });
        }
        break;
      }
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
        break;
    }
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
    toast.success('QR hotel selection cleared. You can now login manually.');
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
    email: localStorage.getItem('rememberedEmail') || '',
    password: '',
    role: 'guest', // Fixed role for client login
    rememberMe: localStorage.getItem('rememberMe') === 'true',
  };  // Handle form submission
  const handleSubmit = (values) => {
    // Handle "Remember me" functionality
    if (values.rememberMe) {
      localStorage.setItem('rememberedEmail', values.email);
      localStorage.setItem('rememberMe', 'true');
    } else {
      localStorage.removeItem('rememberedEmail');
      localStorage.removeItem('rememberMe');
    }

    // Include hotelId from QR info if available
    const loginData = {
      ...values,
      hotelId: qrHotelInfo?.hotelId || null
    };

    // Clear any previous errors
    dispatch(clearError());

    // Mark that a login submission was made so redirect effect fires after success
    loginJustCompleted.current = true;

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
  if (!authCheckComplete) {
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">
      {/* Left Pane - Image & Branding (Desktop Only) */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 bg-[#3B5787]">
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
            {t('login.welcomeMessage', 'Elevate your stay.')}
          </h1>
          <p className="text-lg text-white/80 font-medium">
            {t('login.welcomeSubMessage', 'Seamless access to premium hotel services and personalized amenities.')}
          </p>
        </div>
      </div>

      {/* Right Pane - Form Container */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 xl:p-24 min-h-screen lg:min-h-0 relative overflow-y-auto bg-gray-50/50">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-8">
            <img
              src="/qickroom.png"
              alt="Qickroom Logo"
              className="mx-auto h-12 w-auto mb-4"
            />
          </div>

          {/* Language Switcher */}
          <div className="absolute top-6 right-6 sm:top-8 sm:right-8 z-10">
            <LanguageSwitcher />
          </div>

          <div className="mb-10 lg:mt-0 mt-8">
            <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">{t('login.welcomeBack')}</h2>
            <p className="text-gray-500 mt-2 text-lg">{t('login.signInToYourAccount')}</p>
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
          {({ isSubmitting, values, setFieldValue }) => (
            <Form>
              {/* QR Code Hotel Info Display */}
              {qrHotelInfo ? (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <HiQrcode className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Login to {qrHotelInfo.hotelName}</p>
                        <p className="text-xs text-green-600">{t('qrAuth.selectedViaQR')}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={clearQRSelection}
                      className="text-xs text-green-600 hover:text-green-800 underline"
                    >
                      {t('qrAuth.changeHotel')}
                    </button>
                  </div>
                </div>
              ) : (
                /* QR Scanner Required Notice */
                <div className="mb-8 p-6 bg-[#67BAE0]/10 border border-[#67BAE0]/30 rounded-2xl text-center shadow-sm">
                  <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-gray-100">
                    <HiQrcode className="h-8 w-8 text-[#67BAE0]" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">{t('qrAuth.qrRequiredLogin')}</h3>
                  <button
                    type="button"
                    onClick={() => setShowQRScanner(true)}
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-[#3B5787] text-white rounded-xl hover:bg-[#2A4065] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    disabled={validatingQR}
                  >
                    <HiQrcode className="h-5 w-5" />
                    <span>{validatingQR ? t('qrAuth.validating') : t('qrAuth.scanToLogin')}</span>
                  </button>

                  <div className="mt-4 pt-4 border-t border-[#67BAE0]/20 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        authService.clearSession();
                        toast.success('Scanner reset successfully.');
                      }}
                      className="inline-flex items-center space-x-2 px-4 py-2 text-[#3B5787] bg-white rounded-lg hover:bg-gray-50 transition-colors shadow-sm border border-gray-200 font-medium"
                    >
                      <span className="text-sm">{t('qrAuth.resetScanner')}</span>
                    </button>
                    <p className="mt-2 text-xs text-gray-500">
                      {t('qrAuth.resetScannerHelp')}
                    </p>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('login.emailAddress')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="email"
                    name="email"
                    disabled={!qrHotelInfo}
                    className={`w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-white shadow-sm ${!qrHotelInfo ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
                    placeholder={qrHotelInfo ? t('login.enterYourEmail') : 'Scan QR code first'}
                  />
                </div>
                <ErrorMessage name="email" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
              </div>              <div className="mb-6">
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">
                  {t('login.password')}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <HiLockClosed className="h-5 w-5 text-gray-400" />
                  </div>
                  <Field
                    type="password"
                    name="password"
                    disabled={!qrHotelInfo}
                    className={`w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67BAE0] focus:border-[#67BAE0] transition-all bg-white shadow-sm ${!qrHotelInfo ? 'bg-gray-50 cursor-not-allowed opacity-70' : ''}`}
                    placeholder={qrHotelInfo ? t('login.enterYourPassword') : 'Scan QR code first'}
                  />
                </div>
                <ErrorMessage name="password" component="div" className="mt-1.5 text-sm text-red-500 font-medium" />
              </div>

              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center">
                  <Field
                    id="remember-me"
                    name="rememberMe"
                    type="checkbox"
                    disabled={!qrHotelInfo}
                    className={`h-4.5 w-4.5 text-[#67BAE0] focus:ring-[#67BAE0] border-gray-300 rounded transition-colors ${!qrHotelInfo ? 'cursor-not-allowed opacity-60' : ''}`}
                  />
                  <label htmlFor="remember-me" className={`ml-2.5 block text-sm font-medium text-gray-700 ${!qrHotelInfo ? 'opacity-60' : ''}`}>
                    {t('login.rememberMe')}
                  </label>
                </div>

                <div className="text-sm">
                  {qrHotelInfo ? (
                    <button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      className="font-semibold text-[#3B5787] hover:text-[#67BAE0] transition-colors"
                    >
                      {t('login.forgotPassword', 'Forgot your password?')}
                    </button>
                  ) : (
                    <span className="font-semibold text-gray-400 cursor-not-allowed">
                      {t('login.forgotPassword', 'Forgot your password?')}
                    </span>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={!qrHotelInfo || isSubmitting}
                className="w-full py-3.5 px-4 rounded-xl shadow-lg shadow-[#3B5787]/20 text-sm font-bold text-white hover:bg-[#2A4065] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#3B5787] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:-translate-y-0.5"
                style={{ backgroundColor: '#3B5787' }}
              >
                {/* Show different text based on state */}
                {!qrHotelInfo ? (
                  <div className="flex items-center justify-center">
                    <HiQrcode className="h-5 w-5 mr-2" />
                    <span>{t('qrAuth.scanToEnableLogin')}</span>
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

        <div className="mt-8 text-center">
          <p className="text-sm font-medium text-gray-600">
            {t('login.dontHaveAnAccount')}{' '}
            <Link to="/register" className="font-bold text-[#67BAE0] hover:text-[#3B5787] transition-colors">
              {t('login.signUp')}
            </Link>
          </p>
          {!qrHotelInfo && (
            <p className="text-xs text-gray-400 mt-3 font-medium">
              {t('qrAuth.qrLoginOnlyNotice')}
            </p>
          )}
        </div>
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
