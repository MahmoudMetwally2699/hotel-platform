/**
 * TailwindHeader Component
 * Main header component with user profile and notifications
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import useRTL from '../hooks/useRTL';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import apiClient from '../services/api.service';
// Fix import path to ensure component is available
// import TailwindNotificationsMenu from '../components/notifications/TailwindNotificationsMenu';

const TailwindHeader = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [hotel, setHotel] = useState(null);

  // Fetch hotel details when user has a selected hotel or when on a hotel page
  useEffect(() => {
    // Extract hotel ID from URL path if available
    const getHotelIdFromPath = () => {
      const pathMatch = location.pathname.match(/\/hotels\/([^/]+)/);
      return pathMatch ? pathMatch[1] : null;
    };

    const fetchHotelDetails = async () => {
      // Get hotel ID from user's selectedHotelId or URL path
      const userHotelId = user?.selectedHotelId;
      const pathHotelId = getHotelIdFromPath();
      const hotelId = userHotelId || pathHotelId;

      // Only fetch if user is loaded and has the required data, or if we're on a hotel page
      if (hotelId && (user === undefined || user?.role === 'guest')) {
        try {
          const response = await apiClient.get(`/client/hotels/${hotelId}`);
          setHotel(response.data.data);
        } catch (error) {
        }
      } else {
        // Not fetching hotel details
      }
    };

    // Always try to fetch if we can get a hotel ID
    fetchHotelDetails();
  }, [user, location.pathname]);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const navigateToProfile = () => {
    navigate('/profile');
    setShowProfileMenu(false);
  };

  const navigateToMyHotelServices = () => {
    navigate('/my-hotel-services');
    setShowProfileMenu(false);
  };

  // Compute avatar initial safely
  const userInitialSource = (user?.firstName || user?.lastName || user?.name || user?.email || '').toString().trim();
  const userInitial = userInitialSource ? userInitialSource.charAt(0).toUpperCase() : '';

  // Determine logo source with debugging
  const getLogoInfo = () => {
    const hasHotelLogo = hotel?.logo;
    const hasHotelImagesLogo = hotel?.images?.logo;

    // Show hotel logo if we have hotel data and a logo, regardless of user state for testing
    if (hasHotelLogo) {
      return { src: hotel.logo, alt: `${hotel.name} Logo` };
    } else if (hasHotelImagesLogo) {
      return { src: hotel.images.logo, alt: `${hotel.name} Logo` };
    } else {
      return { src: "/logo.svg", alt: t('homepage.platformName') };
    }
  };

  const logoInfo = getLogoInfo();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-full mx-auto px-2 sm:px-3 lg:px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center gap-2">
              <img
                className="block h-8 w-auto"
                src={logoInfo.src}
                alt={logoInfo.alt}
              />
              {(user?.role === 'hotel' || user?.role === 'service') && (
                <span className="px-2 py-1 text-[10px] font-bold tracking-wider bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-md shadow-lg animate-pulse">
                  DEMO
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center">
            {/* Language Switcher */}
            <div className={`${isRTL ? 'ml-4' : 'mr-4'}`}>
              <LanguageSwitcher />
            </div>

            {/* Profile dropdown */}
            <div className="ml-4 relative flex-shrink-0">
              <div>
                <button
                  onClick={handleProfileClick}
                  className="bg-white rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">{t('common.openUserMenu')}</span>
                  <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-medium text-gray-700">
                    {userInitial ? (
                      userInitial
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M10 2a4 4 0 100 8 4 4 0 000-8zM2 16a8 8 0 1116 0H2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </button>
              </div>

              {showProfileMenu && (
                <div
                  className={`origin-top-${isRTL ? 'left' : 'right'} absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none`}
                ><div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {user?.email}
                    </p>
                  </div>
                  {user?.role === 'guest' && user?.selectedHotelId && (
                    <button                      onClick={navigateToMyHotelServices}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    >
                      {t('navigation.hotelServices')}
                    </button>
                  )}
                  <button
                    onClick={navigateToProfile}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('navigation.profile')}
                  </button>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {t('auth.signOut')}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default TailwindHeader;
