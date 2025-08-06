/**
 * TailwindHeader Component
 * Main header component with user profile and notifications
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';
import useRTL from '../hooks/useRTL';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
// Fix import path to ensure component is available
// import TailwindNotificationsMenu from '../components/notifications/TailwindNotificationsMenu';

const TailwindHeader = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

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

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">              <img
                className="block h-8 w-auto"
                src="/logo192.png"
                alt={t('homepage.platformName')}
              />
            </div>
          </div>          <div className="flex items-center">
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
                  className="bg-white rounded-full flex focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <span className="sr-only">{t('common.openUserMenu')}</span>
                  <img
                    className="h-8 w-8 rounded-full"
                    src={user?.avatar || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixqx=CSFCItvz2e&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"}                    alt={user?.firstName || t('common.userAvatar')}
                  />
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
