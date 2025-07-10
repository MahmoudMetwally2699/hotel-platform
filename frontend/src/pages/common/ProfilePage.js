/**
 * Profile Page
 * User profile management for all user types
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { fetchProfile, selectCurrentUser, selectAuthRole, selectAuthLoading } from '../../redux/slices/authSlice';
import authService from '../../services/auth.service';

// Validation schema
const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email address').required('Email is required'),
  phone: Yup.string().matches(/^[0-9+\-\s()]{10,15}$/, 'Invalid phone number'),
});

const ProfilePage = () => {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectAuthRole);
  const isLoading = useSelector(selectAuthLoading);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [avatar, setAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);

  // Fetch user profile on component mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Handle file change for avatar upload
  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      setAvatar(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatar) return;

    try {
      setIsSaving(true);      const formData = new FormData();
      formData.append('avatar', avatar);

      await authService.updateAvatar(formData);

      setStatus('Avatar updated successfully');
      dispatch(fetchProfile());
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update avatar');
    } finally {
      setIsSaving(false);
      setAvatar(null);
    }  };

  // Handle profile update
  const handleSubmit = async (values) => {
    try {
      setIsSaving(true);
      await authService.updateProfile(values);

      setStatus('Profile updated successfully');
      setIsEditing(false);
      dispatch(fetchProfile());
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  // Reset status and error messages after 5 seconds
  useEffect(() => {
    if (status || error) {
      const timer = setTimeout(() => {
        setStatus(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, error]);

  if (isLoading || !currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Get role-specific fields based on user role
  const getRoleSpecificFields = () => {
    switch (userRole) {
      case 'hotel_admin':
        return (
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Hotel Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your hotel.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Hotel name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.hotel?.name || 'Not set'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Hotel address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.hotel?.address || 'Not set'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Contact number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.hotel?.phone || 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      case 'service_provider':
        return (
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Business Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Details about your service business.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Business name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.business?.name || 'Not set'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Service type</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.business?.serviceType || 'Not set'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Business address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.business?.address || 'Not set'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      case 'super_admin':
        return (
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Admin Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">System administrator details.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Access Level</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    Super Administrator
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Permissions</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    Full system access
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      default: // guest user
        return (
          <div className="mt-6 bg-white shadow overflow-hidden rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Guest Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Additional details about your account.</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Member since</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {new Date(currentUser.createdAt).toLocaleDateString()}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Last login</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.lastLogin ? new Date(currentUser.lastLogin).toLocaleDateString() : 'N/A'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>

        {/* Status and Error Messages */}
        {status && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{status}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setStatus(null)}>
              <svg className="fill-current h-6 w-6 text-green-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
            <span className="block sm:inline">{error}</span>
            <span className="absolute top-0 bottom-0 right-0 px-4 py-3" onClick={() => setError(null)}>
              <svg className="fill-current h-6 w-6 text-red-500" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <title>Close</title>
                <path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/>
              </svg>
            </span>
          </div>
        )}

        {/* Profile Header with Avatar */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
          <div className="px-4 py-5 sm:px-6 flex flex-col sm:flex-row justify-between items-center">
            <div className="flex flex-col sm:flex-row items-center">
              <div className="relative">
                <img
                  src={avatarPreview || currentUser.avatarUrl || "https://via.placeholder.com/150"}
                  alt="Profile"
                  className="h-24 w-24 rounded-full object-cover"
                />
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-blue-500 p-1 rounded-full cursor-pointer text-white hover:bg-blue-600"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </label>
              </div>
              <div className="ml-0 sm:ml-4 mt-4 sm:mt-0 text-center sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-gray-900">
                  {currentUser.firstName} {currentUser.lastName}
                </h3>
                <p className="text-sm text-gray-500">
                  {userRole === 'super_admin' && 'Super Administrator'}
                  {userRole === 'hotel_admin' && 'Hotel Administrator'}
                  {userRole === 'service_provider' && 'Service Provider'}
                  {userRole === 'guest' && 'Guest User'}
                </p>
                <p className="text-sm text-gray-500">{currentUser.email}</p>
              </div>
            </div>
            {avatar && (
              <button
                onClick={handleAvatarUpload}
                disabled={isSaving}
                className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {isSaving ? 'Updating...' : 'Update Avatar'}
              </button>
            )}
          </div>

          {/* Profile Details */}
          {isEditing ? (
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <Formik
                initialValues={{
                  firstName: currentUser.firstName || '',
                  lastName: currentUser.lastName || '',
                  email: currentUser.email || '',
                  phone: currentUser.phone || '',
                }}
                validationSchema={validationSchema}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          First name
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="firstName"
                            id="firstName"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="firstName" component="p" className="mt-2 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-3">
                        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                          Last name
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="lastName"
                            id="lastName"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="lastName" component="p" className="mt-2 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-6">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                          Email address
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="email"
                            id="email"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="email" component="p" className="mt-2 text-sm text-red-600" />
                        </div>
                      </div>

                      <div className="sm:col-span-4">
                        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                          Phone number
                        </label>
                        <div className="mt-1">
                          <Field
                            type="text"
                            name="phone"
                            id="phone"
                            className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                          />
                          <ErrorMessage name="phone" component="p" className="mt-2 text-sm text-red-600" />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || isSaving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isSubmitting || isSaving ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          ) : (
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Full name</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.firstName} {currentUser.lastName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Email address</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.email}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Phone number</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.phone || 'Not provided'}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">Role</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {userRole === 'super_admin' && 'Super Administrator'}
                    {userRole === 'hotel_admin' && 'Hotel Administrator'}
                    {userRole === 'service_provider' && 'Service Provider'}
                    {userRole === 'guest' && 'Guest User'}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:px-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Edit Profile
                    </button>
                  </div>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Role Specific Information */}
        {getRoleSpecificFields()}

        {/* Security Section */}
        <div className="mt-6 bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Security Settings</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">Manage your account security.</p>
          </div>
          <div className="border-t border-gray-200">
            <dl>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Password</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                  <span>••••••••</span>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Change Password
                  </button>
                </dd>
              </div>
              <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Two-factor authentication</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex justify-between items-center">
                  <span>Not enabled</span>
                  <button
                    type="button"
                    className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-green-700 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Enable
                  </button>
                </dd>
              </div>
              <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                <dt className="text-sm font-medium text-gray-500">Connected accounts</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex flex-col">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.604-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.268 2.75 1.026A9.578 9.578 0 0110 4.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.026 2.747-1.026.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C17.14 18.163 20 14.418 20 10c0-5.523-4.477-10-10-10z" clipRule="evenodd" />
                      </svg>
                      <span>GitHub</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Connect
                    </button>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 0C4.477 0 0 4.477 0 10c0 5.523 4.477 10 10 10 5.523 0 10-4.477 10-10 0-5.523-4.477-10-10-10zm6.885 5.968c.26.378.45.784.565 1.207.11.425.17.863.17 1.315 0 1.36-.36 2.473-1.073 3.342-.716.87-1.72 1.305-3.015 1.305-.655 0-1.25-.14-1.783-.418-.533-.28-.954-.675-1.263-1.188-.5.537-1.104.804-1.808.804-.67 0-1.212-.197-1.624-.592-.413-.395-.62-.926-.62-1.592 0-.46.145-.95.434-1.47.29-.52.69-1.02 1.203-1.5.513-.48 1.047-.875 1.604-1.185s1.133-.517 1.707-.517c.32 0 .644.07.97.21.325.14.65.326.975.56l-.434 4.882h1.276l.083-1.66c.54.324 1.082.486 1.626.486.462 0 .872-.092 1.23-.277.36-.184.663-.447.912-.787.25-.34.438-.74.565-1.198.128-.46.19-.962.19-1.505 0-2.33-1.1-4.2-3.294-5.607-1.76-1.134-3.957-1.7-6.595-1.7-1.375 0-2.664.192-3.867.576-1.203.385-2.246.96-3.127 1.727-.88.768-1.58 1.695-2.097 2.783-.52 1.088-.78 2.315-.78 3.682 0 1.367.26 2.585.78 3.653.518 1.07 1.218 1.988 2.098 2.756.88.767 1.924 1.346 3.127 1.737 1.203.39 2.492.586 3.867.586 1.997 0 3.664-.33 5-.992 1.335-.66 2.442-1.73 3.32-3.21l-1.87-.827c-.628 1.043-1.43 1.817-2.407 2.32-.978.504-2.114.756-3.41.756-1.043 0-2.015-.14-2.916-.417-.9-.277-1.69-.696-2.37-1.257-.68-.56-1.214-1.257-1.597-2.09-.384-.834-.576-1.813-.576-2.935 0-1.124.194-2.103.582-2.937.39-.834.923-1.535 1.602-2.1.68-.567 1.468-.992 2.368-1.276.9-.284 1.87-.426 2.912-.426 2.19 0 3.972.47 5.345 1.408 1.69 1.163 2.535 2.7 2.535 4.612 0 .354-.04.688-.12 1.003-.08.315-.21.59-.39.827-.178.236-.41.425-.695.565-.287.14-.633.21-1.04.21-.408 0-.793-.086-1.153-.26-.36-.174-.6-.445-.72-.814l.694-4.27c-.006-.006-.135-.227-.39-.662-.255-.434-.746-.652-1.472-.652-.327 0-.655.096-.985.288-.33.192-.64.435-.93.73-.29.294-.53.615-.72.96-.19.347-.283.67-.283.97 0 .386.103.668.31.845.205.177.462.266.77.266.245 0 .487-.053.73-.157.245-.105.434-.27.57-.497l1.03.565c-.218.386-.522.682-.915.888-.393.204-.84.306-1.34.306-.664 0-1.214-.2-1.65-.6-.434-.4-.652-.967-.652-1.702 0-.537.127-1.05.38-1.535.254-.486.582-.91.985-1.275.402-.365.852-.653 1.35-.862.5-.21.997-.314 1.495-.314.664 0 1.283.157 1.855.47.573.313.992.776 1.258 1.386.267-.61.714-1.073 1.342-1.386.627-.314 1.258-.47 1.893-.47 1.48 0 2.552.376 3.215 1.128z" clipRule="evenodd" />
                      </svg>
                      <span>Google</span>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                      Connect
                    </button>
                  </div>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
