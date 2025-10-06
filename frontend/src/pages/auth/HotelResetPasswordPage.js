/**
 * Hotel Admin Reset Password Page
 * Allows hotel administrators to reset their password using the token from email
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';

// Validation schema
const validationSchema = Yup.object({
  password: Yup.string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  passwordConfirm: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Password confirmation is required'),
});

const HotelResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState(true);

  // Initial form values
  const initialValues = {
    password: '',
    passwordConfirm: '',
  };

  // Check if token is provided
  useEffect(() => {
    if (!token) {
      setTokenValid(false);
      toast.error('Invalid reset link. Please request a new password reset.');
    }
  }, [token]);

  // Handle form submission
  const handleSubmit = async (values) => {
    setIsLoading(true);
    try {
      const response = await apiClient.patch(`/auth/reset-password/${token}`, {
        password: values.password,
        passwordConfirm: values.passwordConfirm
      });

      if (response.data.success) {
        toast.success('Password reset successfully! You can now login with your new password.');
        navigate('/hotel/login');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      if (error.response?.status === 400) {
        setTokenValid(false);
        toast.error('Invalid or expired reset link. Please request a new password reset.');
      } else {
        toast.error(error.response?.data?.message || 'Failed to reset password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
        <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-600 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Invalid Reset Link</h2>
            <p className="text-gray-600 mb-6">
              This password reset link is invalid or has expired. Please request a new password reset.
            </p>
            <div className="space-y-4">
              <Link
                to="/hotel/forgot-password"
                className="w-full bg-blue-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 inline-block text-center"
              >
                Request New Reset
              </Link>
              <Link
                to="/hotel/login"
                className="w-full bg-gray-600 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 inline-block text-center"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-cyan-900">
      <div className="max-w-md w-full bg-white rounded-lg shadow-2xl p-8">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 bg-green-600 rounded-full flex items-center justify-center mb-4">
            <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-gray-800">Reset Password</h2>
          <p className="text-gray-600 mt-2">Hotel Administrator Account</p>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-600 text-center">
            Enter your new password below. Make sure it's secure and easy for you to remember.
          </p>
        </div>

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          onSubmit={handleSubmit}
        >
          {({ isSubmitting, values }) => (
            <Form>
              <div className="mb-4">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter your new password"
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div className="mb-6">
                <label htmlFor="passwordConfirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <Field
                  type="password"
                  name="passwordConfirm"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm your new password"
                />
                <ErrorMessage name="passwordConfirm" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              {/* Password strength indicator */}
              {values.password && (
                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Password strength:</div>
                  <div className="flex space-x-1">
                    <div className={`h-2 w-1/4 rounded ${values.password.length >= 6 ? 'bg-red-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 w-1/4 rounded ${values.password.length >= 8 ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 w-1/4 rounded ${values.password.length >= 10 && /[A-Z]/.test(values.password) ? 'bg-yellow-500' : 'bg-gray-200'}`}></div>
                    <div className={`h-2 w-1/4 rounded ${values.password.length >= 12 && /[A-Z]/.test(values.password) && /[0-9]/.test(values.password) ? 'bg-green-500' : 'bg-gray-200'}`}></div>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Use at least 8 characters with uppercase, lowercase, and numbers for better security.
                  </div>
                </div>
              )}

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
                    <span>Resetting Password...</span>
                  </div>
                ) : (
                  'Reset Password'
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <Link to="/hotel/login" className="text-sm text-blue-600 hover:text-blue-500">
            ← Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HotelResetPasswordPage;
