/**
 * Service Provider Login Page
 * Dedicated login page for service providers with split-screen design
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { login, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole } from '../../redux/slices/authSlice';
import { FaEnvelope, FaLock, FaConciergeBell } from 'react-icons/fa';

// Validation schema
const validationSchema = Yup.object({
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string().required('Password is required'),
});

const ServiceProviderLoginPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const role = useSelector(selectAuthRole);

  const [showError, setShowError] = useState(false);
  const loginJustCompleted = useRef(false);

  // Handle redirection only after a new login submission
  useEffect(() => {
    if (!loginJustCompleted.current) return;
    if (!isAuthenticated) return;

    loginJustCompleted.current = false;

    if (role === 'service') {
      navigate('/service/dashboard');
    } else if (role === 'superadmin') {
      navigate('/superadmin/dashboard');
    } else if (role === 'hotel') {
      navigate('/hotel/dashboard');
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

  // Initial form values
  const initialValues = {
    email: '',
    password: '',
    role: 'service', // Fixed role for this login page
  };

  // Handle form submission
  const handleSubmit = (values) => {
    loginJustCompleted.current = true;
    dispatch(login(values));
  };

  return (
    <div className="min-h-screen flex bg-white font-sans">
      {/* Left Side - Login Form */}
      <div className="w-full md:w-1/2 lg:w-5/12 flex flex-col justify-center px-8 sm:px-16 md:px-12 lg:px-24 bg-white relative">
        {/* Logo / Header */}
        <div className="mb-10 text-center sm:text-left">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-teal-50 text-teal-600 rounded-xl mb-6 shadow-sm">
            <FaConciergeBell className="text-2xl" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Service Partner</h2>
          <p className="text-gray-500 text-sm">Sign in to manage incoming orders and services.</p>
        </div>

        {/* Error Message */}
        {showError && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-6 animate-fade-in-up" role="alert">
            <div className="flex items-center justify-between">
              <span className="block sm:inline text-sm font-medium">{authError}</span>
              <button onClick={() => setShowError(false)} className="text-red-500 hover:text-red-700">
                <svg className="h-4 w-4 fill-current" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
                </svg>
              </button>
            </div>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting }) => (
            <Form className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Provider Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaEnvelope />
                  </div>
                  <Field
                    type="email"
                    name="email"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all shadow-sm bg-gray-50/50"
                    placeholder="provider@example.com"
                  />
                </div>
                <ErrorMessage name="email" component="div" className="mt-1.5 text-xs text-red-500 font-medium pl-1" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <FaLock />
                  </div>
                  <Field
                    type="password"
                    name="password"
                    className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm transition-all shadow-sm bg-gray-50/50"
                    placeholder="••••••••"
                  />
                </div>
                <ErrorMessage name="password" component="div" className="mt-1.5 text-xs text-red-500 font-medium pl-1" />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  'Access Provider Dashboard'
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="mt-12 text-center">
          <p className="text-xs text-gray-500">
            Need support?{' '}
            <Link to="/service/support" className="font-semibold text-teal-600 hover:text-teal-700">
              Contact Support
            </Link>
          </p>
        </div>
      </div>

      {/* Right Side - Image Background */}
      <div className="hidden md:block md:w-1/2 lg:w-7/12 relative bg-gray-900">
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-gray-900/40 to-gray-900/10 z-10" />
        <img
          src="/service-login-bg.png"
          alt="Premium Hotel Service"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-12 z-20 text-white">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 drop-shadow-md">
            Deliver Excellence
          </h1>
          <p className="text-lg text-gray-200 max-w-xl drop-shadow-sm">
            Manage your service orders in real-time, maintain high standards, and seamlessly integrate with our premier hotel partners.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ServiceProviderLoginPage;
