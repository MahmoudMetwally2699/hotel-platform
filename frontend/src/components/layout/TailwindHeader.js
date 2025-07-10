/**
 * Tailwind Header Component
 * Top navigation bar with user profile menu and notifications using Tailwind CSS
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { selectUnreadCount } from '../../redux/slices/notificationSlice';
import TailwindNotificationsMenu from '../notifications/TailwindNotificationsMenu';

const TailwindHeader = ({ onOpenSidebar }) => {
  const { currentUser, role, logout } = useAuth();
  const unreadCount = useSelector(selectUnreadCount);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Get dashboard route based on user role
  const getDashboardRoute = () => {
    switch (role) {
      case 'super_admin':
        return '/superadmin/dashboard';
      case 'hotel_admin':
        return '/hotel/dashboard';
      case 'service_provider':
        return '/service/dashboard';
      default:
        return '/';
    }
  };

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="sticky top-0 z-10 bg-white shadow-md">
      <div className="flex items-center justify-between px-4 h-16">
        {/* Left side - Logo and mobile menu button */}
        <div className="flex items-center">
          <button
            type="button"
            className="md:hidden p-2 rounded-md text-gray-500 hover:text-gray-900 focus:outline-none"
            onClick={onOpenSidebar}
            aria-label="Open sidebar"
          >
            {/* Hamburger menu icon */}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <Link to={getDashboardRoute()} className="flex items-center ml-2 md:ml-0">
            <span className="text-xl font-bold text-primary-dark">Hotel Service Platform</span>
          </Link>
        </div>

        {/* Right side - Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <TailwindNotificationsMenu />

          {/* User Profile Menu */}
          <div className="relative inline-block text-left" ref={menuRef}>
            <button
              type="button"
              className="flex items-center space-x-2 rounded-full text-gray-700 hover:text-gray-900 focus:outline-none"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <span className="sr-only">Open user menu</span>
              {currentUser?.profileImage ? (
                <img
                  className="h-8 w-8 rounded-full object-cover"
                  src={currentUser.profileImage}
                  alt={currentUser.name}
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary-light text-white flex items-center justify-center">
                  {currentUser?.name?.charAt(0) || 'U'}
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className="block text-sm font-medium">{currentUser?.name || 'User'}</span>
                <span className="block text-xs text-gray-500 truncate capitalize">{role?.replace('_', ' ') || 'Guest'}</span>
              </div>
              {/* Down arrow icon */}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* Profile dropdown menu */}
            {profileMenuOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Your Profile
                  </Link>

                  <Link
                    to="/settings"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setProfileMenuOpen(false)}
                  >
                    Settings
                  </Link>

                  <button
                    type="button"
                    className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => {
                      logout();
                      setProfileMenuOpen(false);
                    }}
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

TailwindHeader.propTypes = {
  onOpenSidebar: PropTypes.func.isRequired
};

export default TailwindHeader;
