/**
 * MyHotelServicesPage Component
 * Redirects guests to the new category-based service selection flow
 */

import React, { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LoadingScreen from '../../components/common/LoadingScreen';

function MyHotelServicesPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);

  useEffect(() => {
    if (!user) {
      // Still loading user
      return;
    }

    // Get hotel ID from user object
    let hotelId = user?.selectedHotelId;

    if (hotelId) {
      // If hotelId is an object, extract the ID
      if (typeof hotelId === 'object') {
        hotelId = hotelId._id || hotelId.id || hotelId.toString();
      }

      // Redirect to the new category selection flow
      if (hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]') {
        navigate(`/hotels/${hotelId}/categories`);
        return;
      }
    }

    // If no valid hotel ID, show the no hotel selected message
  }, [user, navigate]);

  if (!user) {
    return <LoadingScreen />;
  }

  // Check if user has a hotel selected
  const hasValidHotelId = () => {
    let hotelId = user?.selectedHotelId;
    if (!hotelId) return false;

    if (typeof hotelId === 'object') {
      hotelId = hotelId._id || hotelId.id;
    }

    return hotelId && typeof hotelId === 'string' && hotelId !== '[object Object]';
  };  if (!hasValidHotelId()) {
    return (
      <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8 relative">
        <div className="w-full px-2 sm:px-3 lg:px-4">
          <div className="text-center py-8 sm:py-12">
            <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="mt-2 text-base sm:text-lg font-medium text-gray-900">{t('myServices.noHotelSelected')}</h3>
            <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
              {t('myServices.completeProfile')}
            </p>
            <div className="mt-4 sm:mt-6">
              <button
                onClick={() => navigate('/profile')}
                className="inline-flex items-center px-3 sm:px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
              >
                {t('myServices.updateProfile')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Should not reach here due to useEffect redirect, but just in case
  return <LoadingScreen />;
}

export default MyHotelServicesPage;
