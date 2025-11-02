/**
 * Profile Page
 * User profile management for all user types
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import * as Yup from 'yup';
import { useTranslation } from 'react-i18next';
import { fetchProfile, selectCurrentUser, selectAuthRole, selectAuthLoading } from '../../redux/slices/authSlice';
import authService from '../../services/auth.service';
import { fetchMyMembership } from '../../redux/slices/loyaltySlice';
import LoyaltyTierCard from '../../components/loyalty/LoyaltyTierCard';

// Validation schema
const validationSchema = (t) => Yup.object({
  firstName: Yup.string().required(t('profile.validation.firstNameRequired')),
  lastName: Yup.string().required(t('profile.validation.lastNameRequired')),
  email: Yup.string().email(t('profile.validation.invalidEmail')).required(t('profile.validation.emailRequired')),
  phone: Yup.string().matches(/^[0-9+\-\s()]{10,15}$/, t('profile.validation.invalidPhone')),
});

const ProfilePage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const currentUser = useSelector(selectCurrentUser);
  const userRole = useSelector(selectAuthRole);
  const isLoading = useSelector(selectAuthLoading);

  // Loyalty state
  const { currentMembership, programDetails, loading: loyaltyLoading, error: loyaltyError } = useSelector(state => state.loyalty);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);

  // Fetch user profile on component mount
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Fetch loyalty membership for guest users
  useEffect(() => {
    if (userRole === 'guest' && currentUser?.selectedHotelId) {
      const hotelId = typeof currentUser.selectedHotelId === 'object'
        ? currentUser.selectedHotelId._id
        : currentUser.selectedHotelId;

      if (hotelId) {
        dispatch(fetchMyMembership(hotelId));
      }
    }
  }, [dispatch, userRole, currentUser?.selectedHotelId]);

  // Handle profile update
  const handleSubmit = async (values) => {
    try {
      setIsSaving(true);
      await authService.updateProfile(values);

      setStatus(t('profile.updateSuccess'));
      setIsEditing(false);
      dispatch(fetchProfile());
    } catch (error) {
      setError(error.response?.data?.message || t('profile.updateFailed'));
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profile.hotelInformation')}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('profile.hotelDetails')}</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.hotelName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.hotel?.name || t('profile.notSet')}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.hotelAddress')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.hotel?.address || t('profile.notSet')}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.contactNumber')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.hotel?.phone || t('profile.notSet')}
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profile.businessInformation')}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('profile.businessDetails')}</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.businessName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.business?.name || t('profile.notSet')}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.serviceType')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.business?.serviceType || t('profile.notSet')}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.businessAddress')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.business?.address || t('profile.notSet')}
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
              <h3 className="text-lg leading-6 font-medium text-gray-900">{t('profile.adminInformation')}</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">{t('profile.adminDetails')}</p>
            </div>
            <div className="border-t border-gray-200">
              <dl>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.accessLevel')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {t('profile.superAdministrator')}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.permissions')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {t('profile.fullSystemAccess')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        );

      default: // guest user
        return null;
    }
  };

  return (
    <div className="w-full py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-2xl font-semibold text-gray-900">{t('profile.myProfile')}</h1>

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

        {/* Loyalty Tier Card for Guest Users */}
        {userRole === 'guest' && currentMembership && programDetails && (
          <div className="mt-6">
            <LoyaltyTierCard
              membership={currentMembership}
              tierDetails={programDetails.tierDetails}
              program={programDetails.program}
              currency={currentUser?.selectedHotelId?.paymentSettings?.currency || currentUser?.hotel?.paymentSettings?.currency || 'USD'}
            />
          </div>
        )}

        {/* Loyalty Loading State */}
        {userRole === 'guest' && loyaltyLoading && !currentMembership && (
          <div className="mt-6 bg-white shadow-lg rounded-2xl p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">{t('profile.loadingLoyaltyInfo')}</span>
            </div>
          </div>
        )}

        {/* Loyalty Error or No Membership State */}
        {userRole === 'guest' && !loyaltyLoading && !currentMembership && currentUser?.selectedHotelId && (
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-6">
            <div className="text-center">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">{t('profile.joinLoyaltyProgram')}</h3>
              <p className="text-blue-700 text-sm">
                {loyaltyError
                  ? t('profile.notEnrolledYet')
                  : t('profile.startEarningPoints')}
              </p>
            </div>
          </div>
        )}

        {/* Profile Header */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mt-4">
          <div className="px-4 py-5 sm:px-6">
            <div className="text-center sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                {currentUser.firstName} {currentUser.lastName}
              </h3>
              <p className="text-sm text-gray-500">{currentUser.email}</p>
            </div>
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
                validationSchema={validationSchema(t)}
                onSubmit={handleSubmit}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-6">
                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <div className="sm:col-span-3">
                        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                          {t('profile.firstName')}
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
                          {t('profile.lastName')}
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
                          {t('profile.emailAddress')}
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
                          {t('profile.phoneNumber')}
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
                        {t('common.cancel')}
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting || isSaving}
                        className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        {isSubmitting || isSaving ? t('profile.saving') : t('common.save')}
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
                  <dt className="text-sm font-medium text-gray-500">{t('profile.fullName')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.firstName} {currentUser.lastName}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.emailAddress')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.email}
                  </dd>
                </div>
                <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                  <dt className="text-sm font-medium text-gray-500">{t('profile.phoneNumber')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                    {currentUser.phone || t('profile.notProvided')}
                  </dd>
                </div>
                <div className="bg-white px-4 py-5 sm:px-6">
                  <div className="flex justify-end">
                    <button
                      onClick={() => setIsEditing(true)}
                      className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {t('profile.editProfile')}
                    </button>
                  </div>
                </div>
              </dl>
            </div>
          )}
        </div>

        {/* Role Specific Information */}
        {getRoleSpecificFields()}
      </div>
    </div>
  );
};

export default ProfilePage;
