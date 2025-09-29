import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import useRTL from '../hooks/useRTL';

/**
 * Test component to demonstrate i18n functionality
 * Shows translations, RTL support, and language switching
 */
const I18nTestPage = () => {
  const { t, i18n } = useTranslation();
  const { isRTL, direction } = useRTL();

  const sampleData = {
    user: {
      name: t('common.name'),
      email: t('common.email'),
      phone: t('common.phone')
    },
    stats: {
      hotels: 15,
      bookings: 234,
      revenue: 12450.75
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 p-8 ${direction}`}>
      <div className="w-full">
        {/* Header with Language Switcher */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-gray-800">
              {t('common.welcome')} - {t('navigation.dashboard')}
            </h1>
            <LanguageSwitcher />
          </div>

          <div className="mt-4 space-y-2">
            <p className="text-gray-600">
              <strong>{t('common.selectLanguage')}:</strong> {i18n.language === 'ar' ? t('common.arabic') : t('common.english')}
            </p>
            <p className="text-gray-600">
              <strong>RTL Mode:</strong> {isRTL ? 'Yes' : 'No'}
            </p>
            <p className="text-gray-600">
              <strong>Direction:</strong> {direction}
            </p>
          </div>
        </div>

        {/* Navigation Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('navigation.home')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
              {t('navigation.dashboard')}
            </button>
            <button className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
              {t('navigation.services')}
            </button>
            <button className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
              {t('navigation.bookings')}
            </button>
            <button className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600">
              {t('navigation.hotels')}
            </button>
          </div>
        </div>

        {/* Form Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('auth.signIn')}</h2>
          <form className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.email')}
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('auth.enterEmail')}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('common.password')}
              </label>
              <input
                type="password"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={t('auth.enterPassword')}
              />
            </div>
            <div className="flex justify-between items-center">
              <label className="flex items-center">
                <input type="checkbox" className="mr-2" />
                {t('auth.rememberMe')}
              </label>
              <a href="#" className="text-blue-600 hover:text-blue-500">
                {t('auth.forgotPassword')}
              </a>
            </div>
            <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700">
              {t('auth.signIn')}
            </button>
          </form>
        </div>

        {/* Services Demo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-semibold mb-4">{t('services.serviceManagement')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">{t('services.laundry')}</h3>
              <p className="text-gray-600 mt-2">{t('services.washAndFold')}</p>
              <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600">
                {t('services.bookService')}
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">{t('services.transportation')}</h3>
              <p className="text-gray-600 mt-2">{t('services.carRental')}</p>
              <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                {t('services.bookService')}
              </button>
            </div>
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold text-lg">{t('services.tourism')}</h3>
              <p className="text-gray-600 mt-2">{t('dashboard.popularServices')}</p>
              <button className="mt-4 bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600">
                {t('services.bookService')}
              </button>
            </div>
          </div>
        </div>

        {/* Hotel Stats Demo */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-semibold mb-4">{t('dashboard.quickStats')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{sampleData.stats.hotels}</div>
              <div className="text-gray-600">{t('hotel.totalRevenue')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{sampleData.stats.bookings}</div>
              <div className="text-gray-600">{t('booking.totalBookings')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">${sampleData.stats.revenue}</div>
              <div className="text-gray-600">{t('dashboard.monthlyRevenue')}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default I18nTestPage;
