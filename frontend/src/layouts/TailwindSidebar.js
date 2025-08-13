/**
 * TailwindSidebar Component
 * Role-based navigation sidebar with mobile bottom navigation bar
 */

import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import useAuth from '../hooks/useAuth';

const TailwindSidebar = ({ isOpen, toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});

  // Check if current language is RTL
  const isRTL = i18n.language === 'ar';

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const toggleMenu = (menuKey) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };
  // Define navigation items based on user role with hierarchical structure
  const getNavigationItems = () => {
    switch (role) {
      case 'superadmin':
        return [
          { name: t('navigation.dashboard'), path: '/superadmin/dashboard', icon: 'home' },
          { name: t('navigation.hotels'), path: '/superadmin/hotels', icon: 'building' },
          { name: t('navigation.hotelAdmins'), path: '/superadmin/hotel-admins', icon: 'users' },
          { name: t('navigation.platformAnalytics'), path: '/superadmin/analytics', icon: 'chart-bar' },
          { name: t('navigation.platformMetrics'), path: '/superadmin/platform-metrics', icon: 'presentation-chart-line' },
          { name: t('navigation.settings'), path: '/superadmin/settings', icon: 'cog' }
        ];
      case 'hotel':
        return [
          { name: t('navigation.dashboard'), path: '/hotel/dashboard', icon: 'home' },
          { name: t('navigation.orders'), path: '/hotel/orders', icon: 'shopping-bag' },
          { name: t('navigation.serviceProviders'), path: '/hotel/service-providers', icon: 'briefcase' },
          { name: t('navigation.revenue'), path: '/hotel/revenue', icon: 'cash' },
          { name: t('navigation.settings'), path: '/hotel/settings', icon: 'cog' }
        ];
      case 'service':
        return [
          { name: t('navigation.dashboard'), path: '/service/dashboard', icon: 'home' },
          { name: t('navigation.orders'), path: '/service/orders', icon: 'shopping-bag' },
          {
            name: t('categorySelection.manageServices'),
            icon: 'cog-services',
            isExpandable: true,
            key: 'manage-services',
            children: [
              { name: `👕 ${t('categorySelection.sidebar.laundryManagement')}`, path: '/service/services?category=laundry', icon: 'laundry' },
              { name: `🚗 ${t('categorySelection.sidebar.transportationManagement')}`, path: '/service/services?category=transportation', icon: 'truck' },
              { name: `📋 ${t('categorySelection.sidebar.transportationBookings')}`, path: '/service/transportation-bookings', icon: 'truck' }
            ]
          },
          { name: t('navigation.earnings'), path: '/service/earnings', icon: 'cash' },
          { name: t('navigation.settings'), path: '/service/settings', icon: 'cog' }
        ];
      case 'guest':
        return [
          { name: t('navigation.hotelServices'), path: '/my-hotel-services', icon: 'server' },
          { name: 'My Bookings', path: '/my-bookings', icon: 'clipboard-list' },
          { name: t('navigation.myOrders'), path: '/my-orders', icon: 'shopping-bag' }
        ];
      default:
        return [];
    }
  };

  // Icons mapping
  const getIcon = (iconName) => {
    switch (iconName) {
      case 'home':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        );
      case 'building':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        );
      case 'briefcase':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'server':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        );
      case 'users':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        );
      case 'chart-bar':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'presentation-chart-line':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
        );
      case 'cash':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        );
      case 'shopping-bag':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        );
      case 'cog':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        );
      case 'credit-card':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
        );
      case 'clipboard-list':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2V9a2 2 0 00-2-2H9zM9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
        );
      case 'truck':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
          </svg>
        );
      case 'cog-services':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        );
      case 'laundry':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        );
      case 'chevron-down':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        );
      case 'chevron-right':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        );
    }
  };

  const navigationItems = getNavigationItems();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`bg-gray-800 text-white min-h-screen transition-all duration-300 ease-in-out z-30
          ${collapsed ? 'lg:w-16' : 'lg:w-64'}
          lg:relative lg:translate-x-0
          hidden lg:block
        `}
      >
        <div className="p-4 flex justify-between items-center">
          {!collapsed && (
            <span className="text-lg font-semibold">Hotel Platform</span>
          )}
          <button
            onClick={toggleCollapse}
            className="p-1 rounded-full hover:bg-gray-700 focus:outline-none"
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
              </svg>
            )}
          </button>
        </div>

        <nav className="mt-5">
          <ul>
            {navigationItems.map((item) => (
              <li key={item.path || item.key} className="px-2 py-1">
                {item.isExpandable ? (
                  // Expandable parent menu
                  <>
                    <button
                      onClick={() => toggleMenu(item.key)}
                      className={`w-full flex items-center justify-between px-4 py-2 rounded-md transition-colors min-h-[48px] ${
                        expandedMenus[item.key]
                          ? 'bg-gray-900 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className={`${isRTL ? 'ml-3' : 'mr-3'}`}>{getIcon(item.icon)}</span>
                        <span className={`${collapsed ? 'hidden' : ''}`}>{item.name}</span>
                      </div>
                      {!collapsed && (
                        <span className="ml-auto">
                          {expandedMenus[item.key] ? getIcon('chevron-down') : getIcon('chevron-right')}
                        </span>
                      )}
                    </button>
                    {/* Submenu */}
                    {expandedMenus[item.key] && !collapsed && (
                      <ul className="mt-1 ml-4 space-y-1">
                        {item.children?.map((child, childIndex) => (
                          <li key={childIndex} className="px-2 py-1">
                            <NavLink
                              to={child.path}
                              className={({ isActive }) => `
                                flex items-center px-4 py-2 rounded-md transition-colors min-h-[40px]
                                ${isActive ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-gray-700 hover:text-white'}
                              `}
                            >
                              <span className={`${isRTL ? 'ml-3' : 'mr-3'}`}>{getIcon(child.icon)}</span>
                              <span>{child.name}</span>
                            </NavLink>
                          </li>
                        ))}
                      </ul>
                    )}
                  </>
                ) : (
                  // Regular menu item
                  <NavLink
                    to={item.path}
                    className={({ isActive }) => `
                      flex items-center px-4 py-2 rounded-md transition-colors min-h-[48px]
                      ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    <span className={`${isRTL ? 'ml-3' : 'mr-3'}`}>{getIcon(item.icon)}</span>
                    <span className={`${collapsed ? 'hidden' : ''}`}>{item.name}</span>
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-800 text-white border-t border-gray-700 z-50">
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 5).map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 max-w-[80px]
                ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
              `}
            >
              <span className="mb-1">{getIcon(item.icon)}</span>
              <span className="text-xs text-center leading-tight truncate w-full">
                {item.name}
              </span>
            </NavLink>
          ))}
          {navigationItems.length > 5 && (
            <button
              onClick={toggleSidebar}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-colors min-w-0 flex-1 max-w-[80px] text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs text-center leading-tight">More</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Overlay Menu for Additional Items */}
      {navigationItems.length > 5 && (
        <>
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={toggleSidebar}
          />          <div
            className={`bg-gray-800 text-white fixed bottom-16 left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-in-out ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-4">{t('common.moreOptions') || 'More Options'}</h3>
              <div className="space-y-2">
                {navigationItems.slice(5).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={toggleSidebar}
                    className={({ isActive }) => `
                      flex items-center px-4 py-3 rounded-md transition-colors
                      ${isActive ? 'bg-gray-900 text-white' : 'text-gray-300 hover:bg-gray-700 hover:text-white'}
                    `}
                  >
                    <span className={`${isRTL ? 'ml-3' : 'mr-3'}`}>{getIcon(item.icon)}</span>
                    <span>{item.name}</span>
                  </NavLink>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default TailwindSidebar;
