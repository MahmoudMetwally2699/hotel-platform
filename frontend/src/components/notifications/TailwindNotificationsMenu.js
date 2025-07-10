/**
 * Tailwind Notifications Menu Component
 * Displays user notifications using Tailwind CSS
 */

import React, { useState, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  fetchNotifications,
  markAsRead,
  markAllAsRead,
  selectNotifications,
  selectUnreadCount,
} from '../../redux/slices/notificationSlice';

// Make sure we're importing all the necessary pieces

// Make sure this component is properly defined and exported
const TailwindNotificationsMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  useEffect(() => {
    // Fetch notifications when component mounts
    dispatch(fetchNotifications());

    // Set up interval to fetch notifications every 30 seconds
    const intervalId = setInterval(() => {
      dispatch(fetchNotifications());
    }, 30000);

    // Handle clicks outside the menu to close it
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dispatch]);

  const handleToggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (notification) => {
    dispatch(markAsRead(notification._id));

    // Navigate to relevant page based on notification type
    switch (notification.type) {
      case 'booking':
        navigate(`/bookings/${notification.data?.bookingId}`);
        break;
      case 'payment':
        navigate(`/payments/${notification.data?.paymentId}`);
        break;
      case 'service':
        navigate(`/services/${notification.data?.serviceId}`);
        break;
      default:
        break;
    }

    setIsOpen(false);
  };

  const handleMarkAllAsReadClick = () => {
    dispatch(markAllAsRead());
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking':
        return (
          <div className="rounded-full bg-blue-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        );
      case 'payment':
        return (
          <div className="rounded-full bg-green-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        );
      case 'alert':
        return (
          <div className="rounded-full bg-red-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        );
      default:
        return (
          <div className="rounded-full bg-gray-100 p-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
        );
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      {/* Notification Bell Button */}
      <button
        className="relative p-2 rounded-full hover:bg-gray-100 focus:outline-none"
        onClick={handleToggleMenu}
        aria-label="View notifications"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-500 rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Menu Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="p-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Notifications</h3>
            <button
              onClick={handleMarkAllAsReadClick}
              className="text-xs text-primary-main hover:text-primary-dark font-semibold"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications && notifications.length > 0 ? (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`flex p-4 hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    {/* Notification Icon */}
                    {getNotificationIcon(notification.type)}

                    {/* Notification Content */}
                    <div className="ml-3 flex-1">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : 'text-gray-800'}`}>
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-1">{formatTimestamp(notification.createdAt)}</p>
                    </div>

                    {/* Unread Indicator */}
                    {!notification.isRead && (
                      <div className="flex-shrink-0">
                        <div className="h-2 w-2 rounded-full bg-primary-main"></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-gray-500">
                <p>No notifications yet</p>
              </div>
            )}
          </div>

          <div className="p-2 border-t border-gray-200">
            <button
              className="w-full text-center text-sm text-primary-main hover:text-primary-dark py-1.5 font-medium"
              onClick={() => {
                navigate('/notifications');
                setIsOpen(false);
              }}
            >
              View all notifications
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TailwindNotificationsMenu;
