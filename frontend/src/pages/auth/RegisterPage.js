/**
 * Register Page
 * Handles user registration for all user roles
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { register, selectAuthError, selectIsAuthenticated, selectAuthLoading, selectAuthRole } from '../../redux/slices/authSlice';

// Validation schema
const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  password: Yup.string()
    .min(8, 'Password must be at least 8 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    )
    .required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password'), null], 'Passwords must match')
    .required('Confirm password is required'),
  role: Yup.string().required('Role is required'),
  acceptTerms: Yup.boolean().oneOf([true], 'You must accept the terms and conditions')
});

const RegisterPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const authError = useSelector(selectAuthError);
  const isLoading = useSelector(selectAuthLoading);
  const role = useSelector(selectAuthRole);

  const [showError, setShowError] = useState(false);

  // Handle redirection after successful registration
  useEffect(() => {
    if (isAuthenticated) {
      switch (role) {
        case 'super_admin':
          navigate('/superadmin/dashboard');
          break;
        case 'hotel_admin':
          navigate('/hotel/dashboard');
          break;
        case 'service_provider':
          navigate('/service/dashboard');
          break;
        case 'guest':
          navigate('/');
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

  // Initial form values
  const initialValues = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'guest', // Default role
    acceptTerms: false,
  };

  // Handle form submission
  const handleSubmit = (values) => {
    const userData = {
      firstName: values.firstName,
      lastName: values.lastName,
      email: values.email,
      password: values.password,
    };

    dispatch(register({ userData, role: values.role }));
  };

  // Dynamic fields based on role
  const renderRoleSpecificFields = (values, setFieldValue) => {
    switch(values.role) {
      case 'hotel_admin':
        return (
          <div className="mb-4">
            <label htmlFor="hotelName" className="block text-sm font-medium text-gray-700 mb-1">
              Hotel Name
            </label>
            <Field
              type="text"
              name="hotelName"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter hotel name"
            />
            <ErrorMessage name="hotelName" component="div" className="mt-1 text-sm text-red-600" />
          </div>
        );
      case 'service_provider':
        return (
          <>
            <div className="mb-4">
              <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-1">
                Business Name
              </label>
              <Field
                type="text"
                name="businessName"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter business name"
              />
              <ErrorMessage name="businessName" component="div" className="mt-1 text-sm text-red-600" />
            </div>
            <div className="mb-4">
              <label htmlFor="serviceType" className="block text-sm font-medium text-gray-700 mb-1">
                Service Category
              </label>
              <Field
                as="select"
                name="serviceType"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select service category</option>
                <option value="laundry">Laundry</option>
                <option value="transportation">Transportation</option>
                <option value="tourism">Travel & Tourism</option>
              </Field>
              <ErrorMessage name="serviceType" component="div" className="mt-1 text-sm text-red-600" />
            </div>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-6">
          <h2 className="text-3xl font-bold text-gray-800">Create an Account</h2>
          <p className="text-gray-600 mt-2">Sign up to join our platform</p>
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
            <Form className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                    First Name
                  </label>
                  <Field
                    type="text"
                    name="firstName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="First name"
                  />
                  <ErrorMessage name="firstName" component="div" className="mt-1 text-sm text-red-600" />
                </div>

                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                    Last Name
                  </label>
                  <Field
                    type="text"
                    name="lastName"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Last name"
                  />
                  <ErrorMessage name="lastName" component="div" className="mt-1 text-sm text-red-600" />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <Field
                  type="email"
                  name="email"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Email address"
                />
                <ErrorMessage name="email" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Field
                  type="password"
                  name="password"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Password"
                />
                <ErrorMessage name="password" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <Field
                  type="password"
                  name="confirmPassword"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm password"
                />
                <ErrorMessage name="confirmPassword" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                  Register As
                </label>
                <Field
                  as="select"
                  name="role"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => {
                    setFieldValue('role', e.target.value);
                  }}
                >
                  <option value="guest">Guest</option>
                  <option value="hotel_admin">Hotel Admin</option>
                  <option value="service_provider">Service Provider</option>
                </Field>
                <ErrorMessage name="role" component="div" className="mt-1 text-sm text-red-600" />
              </div>

              {renderRoleSpecificFields(values, setFieldValue)}

              <div className="flex items-center">
                <Field
                  type="checkbox"
                  name="acceptTerms"
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="acceptTerms" className="ml-2 block text-sm text-gray-700">
                  I accept the <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">Terms and Conditions</a>
                </label>
              </div>
              <ErrorMessage name="acceptTerms" component="div" className="mt-1 text-sm text-red-600" />

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
                    <span>Registering...</span>
                  </div>
                ) : (
                  'Register'
                )}
              </button>
            </Form>
          )}
        </Formik>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
