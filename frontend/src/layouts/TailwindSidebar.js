/**
 * TailwindSidebar Component
 * Role-based navigation sidebar with mobile bottom navigation bar
 */

import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaTshirt,
  FaCar,
  FaUtensils,
  FaBroom
} from 'react-icons/fa';
import useAuth from '../hooks/useAuth';
import useServiceProviderCategories from '../hooks/useServiceProviderCategories';
import { resolveAuthConflicts } from '../utils/authCleanup';

const TailwindSidebar = ({ isOpen, toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { role } = useAuth();
  const { hasCategory } = useServiceProviderCategories();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState({});
  const [showMobileCategories, setShowMobileCategories] = useState(false);

  // Resolve authentication conflicts on mount and location change
  useEffect(() => {
    resolveAuthConflicts(location.pathname);
  }, [location.pathname]);

  // Check if current language is RTL
  const isRTL = i18n.language === 'ar';

  // Custom function to check if a path is active, including query parameters
  const isPathActive = (itemPath) => {
    if (!itemPath) return false;

    // Split path and query parameters
    const [pathname, search] = itemPath.split('?');
    const currentPathname = location.pathname;
    const currentSearch = location.search;

    // Check if pathname matches
    if (pathname !== currentPathname) return false;

    // If there are query parameters in the item path, check them too
    if (search) {
      const itemParams = new URLSearchParams(search);
      const currentParams = new URLSearchParams(currentSearch);

      // Check if all item parameters exist in current parameters with same values
      for (const [key, value] of itemParams) {
        if (currentParams.get(key) !== value) {
          return false;
        }
      }
    }

    return true;
  };

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
          { name: t('navigation.superHotels'), path: '/superadmin/super-hotels', icon: 'star' },
          { name: t('navigation.feedback'), path: '/superadmin/feedback', icon: 'feedback' },
          { name: 'Payment Management', path: '/superadmin/payment-management', icon: 'credit-card' }
        ];
      case 'hotel':
        return [
          { name: t('navigation.dashboard'), path: '/hotel/dashboard', icon: 'home' },
          { name: t('navigation.orders'), path: '/hotel/orders', icon: 'shopping-bag' },
          { name: t('navigation.guests'), path: '/hotel/guests', icon: 'users' },
          { name: t('navigation.serviceProviders'), path: '/hotel/service-providers', icon: 'briefcase' },
          { name: t('navigation.feedback'), path: '/hotel/feedback', icon: 'feedback' },
          { name: t('navigation.revenue'), path: '/hotel/revenue', icon: 'cash' },
          { name: t('navigation.qrCodes'), path: '/hotel/qr-codes', icon: 'qr-code' },
          { name: t('navigation.loyaltyProgram'), path: '/hotel/loyalty-program', icon: 'gift', comingSoon: true },
          { name: t('navigation.performanceAnalytics'), path: '/hotel/performance-analytics', icon: 'chart-line' },
          { name: t('navigation.settings'), path: '/hotel/settings', icon: 'cog' }
        ];
      case 'service':
        // Build dynamic navigation based on allowed categories
        const serviceNavItems = [
          { name: t('navigation.dashboard'), path: '/service/dashboard', icon: 'home' }
        ];

        // Orders section - include transportation bookings only if transportation is enabled
        const ordersChildren = [
          { name: t('navigation.orders'), path: '/service/orders', icon: 'shopping-bag' }
        ];

        if (hasCategory('transportation')) {
          ordersChildren.push({
            name: t('categorySelection.sidebar.transportationBookings'),
            path: '/service/transportation-bookings',
            icon: 'truck'
          });
        }

        serviceNavItems.push({
          name: t('navigation.orders'),
          icon: 'shopping-bag',
          isExpandable: true,
          key: 'orders-bookings',
          children: ordersChildren
        });

        // Manage Services section - only show enabled categories
        const manageServicesChildren = [];

        if (hasCategory('laundry')) {
          manageServicesChildren.push({
            name: t('categorySelection.sidebar.laundryManagement'),
            path: '/service/services?category=laundry',
            icon: 'laundry'
          });
        }

        if (hasCategory('transportation')) {
          manageServicesChildren.push({
            name: t('categorySelection.sidebar.transportationManagement'),
            path: '/service/services?category=transportation',
            icon: 'truck'
          });
        }

        if (hasCategory('housekeeping')) {
          manageServicesChildren.push({
            name: t('categorySelection.sidebar.housekeepingServices'),
            path: '/service/housekeeping',
            icon: 'broom'
          });
        }

        if (hasCategory('dining')) {
          manageServicesChildren.push({
            name: t('categorySelection.sidebar.restaurantServices'),
            path: '/service/restaurant',
            icon: 'restaurant'
          });
        }

        // Only add Manage Services section if there are any enabled categories
        if (manageServicesChildren.length > 0) {
          serviceNavItems.push({
            name: t('categorySelection.manageServices'),
            icon: 'cog-services',
            isExpandable: true,
            key: 'manage-services',
            children: manageServicesChildren
          });
        }

        // Add feedback
        serviceNavItems.push({ name: t('navigation.feedback'), path: '/service/feedback', icon: 'feedback' });

        // Add earnings
        serviceNavItems.push({ name: t('navigation.earnings'), path: '/service/earnings', icon: 'cash' });

        return serviceNavItems;
      case 'guest':
        return [
          { name: t('navigation.hotelServices'), path: '/my-hotel-services', icon: 'server' },
          {
            name: t('navigation.myBookings'),
            icon: 'clipboard-list',
            submenu: [
              { name: t('navigation.transportationBookings'), path: '/my-transportation-bookings', icon: 'truck' },
              { name: t('navigation.laundryBookings'), path: '/my-laundry-bookings', icon: 'sparkles' },
              { name: t('navigation.restaurantBookings'), path: '/my-restaurant-bookings', icon: 'utensils' },
              { name: t('navigation.housekeepingBookings'), path: '/my-housekeeping-bookings', icon: 'broom' }
            ]
          },
          { name: t('navigation.feedback'), path: '/feedback', icon: 'feedback' },
          { name: t('navigation.profile'), path: '/profile', icon: 'user' }
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
      case 'qr-code':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="5" height="5" rx="1"/>
            <rect x="3" y="16" width="5" height="5" rx="1"/>
            <rect x="16" y="3" width="5" height="5" rx="1"/>
            <path d="M21 16h-3a2 2 0 0 0-2 2v3"/>
            <path d="M21 21v.01"/>
            <path d="M12 7v3a2 2 0 0 1-2 2H7"/>
            <path d="M3 12h.01"/>
            <path d="M12 3h.01"/>
            <path d="M12 16v.01"/>
            <path d="M16 12h1"/>
            <path d="M21 12v.01"/>
            <path d="M12 21v-1"/>
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
      case 'broom':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
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
      case 'utensils':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v4a2 2 0 01-2 2H9a2 2 0 01-2-2v-4m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01" />
          </svg>
        );
      case 'sparkles':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        );
      case 'restaurant':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4v8l2 2v7c0 .55.45 1 1 1h3c.55 0 1-.45 1-1v-7l2-2V4M3 4L9 4M19 4v8c0 1.1-.9 2-2 2h-1v7c0 .55-.45 1-1 1s-1-.45-1-1v-7h-1c-1.1 0-2-.9-2-2V4" />
          </svg>
        );
      case 'user':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
        );
      case 'feedback':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      case 'star':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
        );
      case 'gift':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
          </svg>
        );
      case 'chart-line':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
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

  // Don't render sidebar content if role is not available
  if (!role) {
    return null;
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        style={{ backgroundColor: '#3B5787' }}
        className={`text-white min-h-screen transition-all duration-300 ease-in-out z-30 shadow-xl
          ${collapsed ? 'lg:w-16' : 'lg:w-56 xl:w-64 2xl:w-72'}
          lg:relative lg:translate-x-0
          hidden lg:block
          flex-shrink-0 max-w-xs
        `}
      >
        <div className={`px-6 py-6 border-b border-white/20 min-h-[5rem] ${collapsed ? 'flex justify-center items-center' : 'flex items-center justify-between'}`}>
          {!collapsed && (
            <div className={`flex items-center flex-1 ${isRTL ? 'flex-row-reverse' : ''}`}>
              <div className="relative flex-shrink-0">
                <div className="absolute inset-0 bg-white/10 rounded-full blur-sm"></div>
                <img
                  src="/qickroom.png"
                  alt="Qickroom"
                  className="relative h-11 w-auto object-contain rounded-lg p-1 bg-white/5 backdrop-blur-sm"
                />
              </div>
              <div className={`flex flex-col ${isRTL ? 'mr-5 items-end' : 'ml-5 items-start'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-lg font-bold text-white leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                    Qickroom
                  </span>
                  {(role === 'hotel' || role === 'service') && (
                    <span className="px-2 py-0.5 text-[10px] font-bold tracking-wider bg-white/20 text-white/90 rounded-md">
                      DEMO
                    </span>
                  )}
                </div>
                <span className={`text-sm font-medium text-white/75 leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>
                  {role === 'service' ? t('platform.servicePlatform') : t('platform.hotelPlatform')}
                </span>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="relative">
              <div className="absolute inset-0 bg-white/10 rounded-full blur-sm"></div>
              <img
                src="/qickroom.png"
                alt="Qickroom"
                className="relative h-10 w-auto object-contain rounded-lg p-1 bg-white/5 backdrop-blur-sm"
              />
            </div>
          )}
          <button
            onClick={toggleCollapse}
            className="p-2.5 rounded-lg hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-200 flex-shrink-0"
            title={collapsed ? t('common.expand') : t('common.collapse')}
          >
            {collapsed ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isRTL ? "M11 19l-7-7 7-7m8 14l-7-7 7-7" : "M13 5l7 7-7 7M5 5l7 7-7 7"} />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white/90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isRTL ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
              </svg>
            )}
          </button>
        </div>

        <nav className="mt-6 px-4">
          <ul className="space-y-2">
            {navigationItems.map((item) => (
              <li key={item.path || item.key || item.name}>
                {(item.isExpandable || item.submenu) ? (
                  // Expandable parent menu (for both service and guest roles)
                  <>
                    <button
                      onClick={() => toggleMenu(item.key || item.name)}
                      className={`w-full flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] group ${
                        expandedMenus[item.key || item.name]
                          ? 'text-white shadow-lg'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                      }`}
                      style={expandedMenus[item.key || item.name] ? { backgroundColor: '#48ACDA' } : {}}
                    >
                      <div className={`flex items-center ${collapsed ? 'justify-center' : ''}`}>
                        <span className={`${collapsed ? '' : (isRTL ? 'ml-3' : 'mr-3')} transition-transform group-hover:scale-110`}>
                          {getIcon(item.icon)}
                        </span>
                        <span className={`${collapsed ? 'hidden' : ''} font-medium`}>{item.name}</span>
                      </div>
                      {!collapsed && (
                        <span className={`transition-transform duration-200 ${expandedMenus[item.key || item.name] ? 'rotate-180' : ''}`}>
                          {getIcon('chevron-down')}
                        </span>
                      )}
                    </button>
                    {/* Submenu */}
                    {expandedMenus[item.key || item.name] && !collapsed && (
                      <ul className="mt-2 ml-2 space-y-1 max-w-full overflow-hidden">
                        {(item.children || item.submenu)?.map((child, childIndex) => (
                          <li key={childIndex} className="max-w-full overflow-hidden">
                            <NavLink
                              to={child.path}
                              className={() => {
                                const isActive = isPathActive(child.path);
                                return `
                                  flex items-center px-3 py-2.5 rounded-lg transition-all duration-200 min-h-[36px] group max-w-full
                                  ${isActive
                                    ? 'text-white shadow-lg'
                                    : 'text-white/70 hover:text-white hover:bg-white/10'
                                  }
                                `;
                              }}
                              style={() => {
                                const isActive = isPathActive(child.path);
                                return isActive ? { backgroundColor: '#48ACDA' } : {};
                              }}
                            >
                              <span className={`${isRTL ? 'ml-2' : 'mr-2'} transition-transform group-hover:scale-110 flex-shrink-0`}>
                                {getIcon(child.icon)}
                              </span>
                              <span className="font-medium text-sm truncate">{child.name}</span>
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
                    className={() => {
                      const isActive = isPathActive(item.path);
                      return `
                        flex items-center ${collapsed ? 'justify-center' : 'justify-between'} px-4 py-3 rounded-xl transition-all duration-200 min-h-[48px] group
                        ${isActive
                          ? 'text-white shadow-lg'
                          : 'text-white/80 hover:text-white hover:bg-white/10'
                        }
                      `;
                    }}
                    style={() => {
                      const isActive = isPathActive(item.path);
                      return isActive ? { backgroundColor: '#48ACDA' } : {};
                    }}
                  >
                    <div className="flex items-center">
                      <span className={`${collapsed ? '' : (isRTL ? 'ml-3' : 'mr-3')} transition-transform group-hover:scale-110`}>
                        {getIcon(item.icon)}
                      </span>
                      <span className={`${collapsed ? 'hidden' : ''} font-medium`}>{item.name}</span>
                    </div>
                    {item.comingSoon && !collapsed && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white/90 rounded-md">
                        {t('common.comingSoon') || 'COMING SOON'}
                      </span>
                    )}
                  </NavLink>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div
        style={{ backgroundColor: '#3B5787' }}
        className="lg:hidden fixed bottom-0 left-0 right-0 text-white border-t border-white/10 z-50 shadow-2xl"
      >
        <div className="flex justify-around items-center py-2">
          {navigationItems.slice(0, 5).map((item) => {
            // Handle expandable items specially on mobile
            if (item.isExpandable || item.submenu) {
              return (
                <button
                  key={item.key || item.name}
                  onClick={() => setShowMobileCategories(true)}
                  className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[120px] text-white/80 hover:bg-white/10 hover:text-white"
                >
                  <span className="mb-1">{getIcon(item.icon)}</span>
                  <span className="text-xs text-center leading-tight w-full font-medium break-words">
                    {item.name}
                  </span>
                </button>
              );
            }

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={() => {
                  const isActive = isPathActive(item.path);
                  return `
                    flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[120px] relative
                    ${isActive
                      ? 'text-white shadow-lg'
                      : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }
                  `;
                }}
                style={() => {
                  const isActive = isPathActive(item.path);
                  return isActive ? { backgroundColor: '#48ACDA' } : {};
                }}
              >
                <span className="mb-1">{getIcon(item.icon)}</span>
                <span className="text-xs text-center leading-tight w-full font-medium break-words">
                  {item.name}
                </span>
                {item.comingSoon && (
                  <span className="absolute top-0 right-0 px-1 py-0.5 text-[8px] font-bold bg-white/20 text-white/90 rounded-md">
                    SOON
                  </span>
                )}
              </NavLink>
            );
          })}
          {navigationItems.length > 5 && (
            <button
              onClick={toggleSidebar}
              className="flex flex-col items-center justify-center p-2 rounded-lg transition-all duration-200 min-w-0 flex-1 max-w-[120px] text-white/80 hover:bg-white/10 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <span className="text-xs text-center leading-tight font-medium">More</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Categories Modal for Service Providers */}
      {showMobileCategories && role === 'service' && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setShowMobileCategories(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 lg:hidden max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('categorySelection.manageServices')}
                </h3>
                <button
                  onClick={() => setShowMobileCategories(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Service Categories Grid */}
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const manageServicesItem = navigationItems.find(item => item.isExpandable && item.key === 'manage-services');
                  return manageServicesItem?.children?.map((category) => (
                    <div key={category.path} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <NavLink
                        to={category.path}
                        onClick={() => setShowMobileCategories(false)}
                        className="flex items-center gap-4 w-full"
                      >
                        <div className="flex-shrink-0 p-3 bg-white rounded-lg shadow-sm">
                          <span className="text-2xl">{getIcon(category.icon)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {category.name}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </NavLink>
                    </div>
                  ));
                })()}
              </div>

              {/* Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  {t('common.quickActions') || 'Quick Actions'}
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <NavLink
                    to="/service/dashboard"
                    onClick={() => setShowMobileCategories(false)}
                    className="flex items-center justify-center p-3 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <span className="text-sm font-medium">{t('navigation.dashboard')}</span>
                  </NavLink>
                  <NavLink
                    to="/service/orders"
                    onClick={() => setShowMobileCategories(false)}
                    className="flex items-center justify-center p-3 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <span className="text-sm font-medium">{t('navigation.orders')}</span>
                  </NavLink>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bookings Modal for Guests */}
      {showMobileCategories && role === 'guest' && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
            onClick={() => setShowMobileCategories(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-xl z-50 lg:hidden max-h-[70vh] overflow-y-auto">
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">
                  {t('navigation.myBookings')}
                </h3>
                <button
                  onClick={() => setShowMobileCategories(false)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Booking Categories Grid */}
              <div className="grid grid-cols-1 gap-4">
                {(() => {
                  const myBookingsItem = navigationItems.find(item => item.submenu && item.name === t('navigation.myBookings'));
                  return myBookingsItem?.submenu?.map((booking) => (
                    <div key={booking.path} className="bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors">
                      <NavLink
                        to={booking.path}
                        onClick={() => setShowMobileCategories(false)}
                        className="flex items-center gap-4 w-full"
                      >
                        <div className="flex-shrink-0 p-3 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg shadow-sm">
                          {booking.icon === 'truck' && (
                            <FaCar className="w-6 h-6 text-white" />
                          )}
                          {booking.icon === 'sparkles' && (
                            <FaTshirt className="w-6 h-6 text-white" />
                          )}
                          {booking.icon === 'utensils' && (
                            <FaUtensils className="w-6 h-6 text-white" />
                          )}
                          {booking.icon === 'broom' && (
                            <FaBroom className="w-6 h-6 text-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-lg font-semibold text-gray-900 truncate">
                            {booking.name}
                          </h4>
                        </div>
                        <div className="flex-shrink-0">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </NavLink>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Mobile Overlay Menu for Additional Items */}
      {navigationItems.length > 5 && (
        <>
          <div
            className={`fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden transition-opacity duration-300 ${
              isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={toggleSidebar}
          />          <div
            style={{ backgroundColor: '#3B5787' }}
            className={`text-white fixed bottom-16 left-0 right-0 z-50 lg:hidden transition-all duration-300 ease-in-out shadow-2xl ${
              isOpen ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0'
            }`}
          >
            <div className="p-6">
              <h3 className="text-lg font-bold mb-4 text-white">{t('common.moreOptions') || 'More Options'}</h3>
              <div className="space-y-2">
                {navigationItems.slice(5).map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={toggleSidebar}
                    className={() => {
                      const isActive = isPathActive(item.path);
                      return `
                        flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                        ${isActive
                          ? 'text-white shadow-lg'
                          : 'text-white/80 hover:bg-white/10 hover:text-white'
                        }
                      `;
                    }}
                    style={() => {
                      const isActive = isPathActive(item.path);
                      return isActive ? { backgroundColor: '#48ACDA' } : {};
                    }}
                  >
                    <div className="flex items-center">
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'}`}>{getIcon(item.icon)}</span>
                      <span className="font-medium">{item.name}</span>
                    </div>
                    {item.comingSoon && (
                      <span className="px-2 py-0.5 text-[10px] font-bold bg-white/20 text-white/90 rounded-md">
                        {t('common.comingSoon') || 'COMING SOON'}
                      </span>
                    )}
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
