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
  const [showNotifications, setShowNotifications] = useState(false);
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

      console.log('🔍 Checking hotel fetch conditions:', {
        userLoaded: user !== undefined,
        userRole: user?.role,
        userHotelId,
        pathHotelId,
        finalHotelId: hotelId,
        path: location.pathname
      });

      // Only fetch if user is loaded and has the required data, or if we're on a hotel page
      if (hotelId && (user === undefined || user?.role === 'guest')) {
        try {
          console.log('🏨 Fetching hotel details for ID:', hotelId);
          const response = await apiClient.get(`/client/hotels/${hotelId}`);
          console.log('🏨 Hotel details response:', response.data);
          setHotel(response.data.data);
        } catch (error) {
          console.error('❌ Error fetching hotel details:', error);
        }
      } else {
        console.log('❌ Not fetching hotel details:', {
          userExists: !!user,
          hasHotelId: !!hotelId,
          userRole: user?.role
        });
      }
    };

    // Always try to fetch if we can get a hotel ID
    fetchHotelDetails();
  }, [user, location.pathname]);

  const handleProfileClick = () => {
    setShowProfileMenu(!showProfileMenu);
    setShowNotifications(false);
  };

  const handleNotificationsClick = () => {
    setShowNotifications(!showNotifications);
    setShowProfileMenu(false);
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
    const userLoaded = user !== undefined;
    const isGuest = user?.role === 'guest';
    const hasSelectedHotel = !!user?.selectedHotelId;
    const hasHotelLogo = hotel?.logo;
    const hasHotelImagesLogo = hotel?.images?.logo;

    console.log('🖼️ Logo determination:', {
      userLoaded,
      isGuest,
      hasSelectedHotel,
      selectedHotelId: user?.selectedHotelId,
      hasHotelLogo,
      hasHotelImagesLogo,
      hotel: hotel,
      userRole: user?.role,
      user: user
    });

    // Show hotel logo if we have hotel data and a logo, regardless of user state for testing
    if (hasHotelLogo) {
      console.log('✅ Using hotel.logo:', hotel.logo);
      return { src: hotel.logo, alt: `${hotel.name} Logo` };
    } else if (hasHotelImagesLogo) {
      console.log('✅ Using hotel.images.logo:', hotel.images.logo);
      return { src: hotel.images.logo, alt: `${hotel.name} Logo` };
    } else {
      if (hotel) {
        console.log('✅ Using platform logo - Hotel has no logo:', hotel.name);
      } else if (userLoaded) {
        console.log('✅ Using platform logo - Reason:', {
          notGuest: !isGuest,
          noSelectedHotel: !hasSelectedHotel,
          noHotelLogo: !hasHotelLogo && !hasHotelImagesLogo,
          userRole: user?.role
        });
      } else {
        console.log('✅ Using platform logo - User not loaded yet');
      }
      return { src: "/logo.svg", alt: t('homepage.platformName') };
    }
  };

  const logoInfo = getLogoInfo();

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <img
                className="block h-8 w-auto"
                src={logoInfo.src}
                alt={logoInfo.alt}
              />
            </div>
          </div>
          <div className="flex items-center">
            {/* Language Switcher */}
            <div className={`${isRTL ? 'ml-4' : 'mr-4'}`}>
              <LanguageSwitcher />
            </div>

            {/* Notifications dropdown */}
            <div className="relative ml-4">
              <button
                onClick={handleNotificationsClick}
                className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <span className="sr-only">{t('notifications.viewNotifications')}</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                  />
                </svg>
                {/* Notification indicator dot */}
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Temporarily disabled notifications menu to fix render error */}
              {/* {showNotifications && <TailwindNotificationsMenu />} */}
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
