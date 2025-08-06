/**
 * Home Page - Simplified
 * Main landing page focused on My Hotel Services
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import useRTL from '../../hooks/useRTL';
import LanguageSwitcher from '../../components/common/LanguageSwitcher';

const HomePage = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const isAuthenticated = useSelector(selectIsAuthenticated);
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Language Switcher - Top Right */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>      {/* Hero Section */}
      <div className="bg-blue-700 text-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-24 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {t('homepage.title')}
            </h1>
            <p className="mt-6 text-xl max-w-3xl mx-auto">
              {t('homepage.heroDescription')}
            </p>

            {/* Main Action - My Hotel Services */}
            {isAuthenticated ? (
              <div className="mt-10">
                <Link
                  to="/my-hotel-services"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 transition duration-200 shadow-lg"
                >
                  <svg className={`w-6 h-6 ${isRTL ? 'ml-3' : 'mr-3'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H3m2 0h3M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {t('homepage.viewHotelServices')}
                </Link>
                <p className="mt-4 text-blue-100">
                  {t('homepage.browseServices')}
                </p>
              </div>
            ) : (
              <div className="mt-10">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center px-8 py-4 border border-transparent text-lg font-medium rounded-md text-blue-700 bg-white hover:bg-gray-100 transition duration-200 shadow-lg"
                >
                  {t('auth.signIn')}
                </Link>
                <p className="mt-4 text-blue-100">
                  {t('homepage.signInToView')}
                </p>
              </div>            )}
          </div>
        </div>
      </div>

      {/* Services Overview Section */}
      <div className="max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:py-20 lg:px-8">        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            {t('homepage.availableServices')}
          </h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            {t('homepage.servicesDescription')}
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🧺</div>
            <h3 className="text-xl font-semibold text-gray-900">{t('services.laundry')}</h3>
            <p className="mt-2 text-gray-600">{t('homepage.laundryDescription')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🚗</div>
            <h3 className="text-xl font-semibold text-gray-900">{t('services.transportation')}</h3>
            <p className="mt-2 text-gray-600">{t('homepage.transportationDescription')}</p>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-xl font-semibold text-gray-900">{t('services.tourism')}</h3>
            <p className="mt-2 text-gray-600">{t('homepage.tourismDescription')}</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 text-white">
        <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:py-12 lg:px-8">
          <div className="text-center">            <p className="text-base text-gray-400">
              &copy; 2025 {t('homepage.platformName')}. {t('homepage.allRightsReserved')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
