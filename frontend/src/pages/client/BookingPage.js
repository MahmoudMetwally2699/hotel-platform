/**
 * Booking Page
 * Allows guests to view their bookings and make new ones
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserBookings, selectUserBookings } from '../../redux/slices/bookingSlice';
import { fetchUserProfile, selectUserProfile } from '../../redux/slices/authSlice';

const BookingPage = () => {
  const dispatch = useDispatch();
  const bookings = useSelector(selectUserBookings);
  const userProfile = useSelector(selectUserProfile);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    const loadBookings = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          dispatch(fetchUserBookings()),
          dispatch(fetchUserProfile())
        ]);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, [dispatch]);

  // Filter bookings based on active tab
  const filteredBookings = bookings.filter(booking => {
    const bookingDate = new Date(booking.date);
    const today = new Date();

    if (activeTab === 'upcoming') {
      return bookingDate >= today && booking.status !== 'cancelled';
    } else if (activeTab === 'past') {
      return bookingDate < today || booking.status === 'completed';
    } else {
      return booking.status === 'cancelled';
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
        <button className="btn-primary">Book New Service</button>
      </div>

      {/* User Info Card */}
      <div className="card p-6">
        <div className="flex items-center">
          <div className="h-16 w-16 rounded-full bg-primary-light flex items-center justify-center text-white text-2xl font-medium">
            {userProfile?.name?.charAt(0) || 'G'}
          </div>
          <div className="ml-4">
            <h2 className="text-xl font-medium text-gray-900">{userProfile?.name || 'Guest User'}</h2>
            <p className="text-gray-500">{userProfile?.email || 'No email provided'}</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'upcoming'
                ? 'border-primary-main text-primary-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'past'
                ? 'border-primary-main text-primary-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Past
          </button>
          <button
            onClick={() => setActiveTab('cancelled')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'cancelled'
                ? 'border-primary-main text-primary-main'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Cancelled
          </button>
        </nav>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <div key={booking._id} className="card p-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div className="mb-4 md:mb-0">
                    <div className="flex items-center">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                          ${
                            booking.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : booking.status === 'cancelled'
                              ? 'bg-red-100 text-red-800'
                              : booking.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                      >
                        {booking.status}
                      </span>
                      <span className="ml-2 text-sm text-gray-500">#{booking.bookingId}</span>
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mt-1">{booking.service?.name || 'Service'}</h3>
                    <p className="text-gray-500">
                      {new Date(booking.date).toLocaleDateString()} at {new Date(booking.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  <div className="flex flex-col items-end">
                    <span className="text-lg font-bold">${booking.amount?.toFixed(2) || '0.00'}</span>
                    <div className="flex space-x-2 mt-2">
                      {booking.status !== 'cancelled' && booking.status !== 'completed' && (
                        <>
                          <button className="px-3 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50">
                            Reschedule
                          </button>
                          <button className="px-3 py-1 bg-white border border-red-300 rounded-md text-sm text-red-700 hover:bg-red-50">
                            Cancel
                          </button>
                        </>
                      )}
                      <button className="px-3 py-1 bg-primary-main text-white rounded-md text-sm hover:bg-primary-dark">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>

                {/* Service Details */}
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Service Provider</h4>
                      <p className="mt-1">{booking.provider?.name || 'Unknown Provider'}</p>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">Hotel</h4>
                      <p className="mt-1">{booking.hotel?.name || 'Unknown Hotel'}</p>
                    </div>
                    {booking.notes && (
                      <div className="col-span-1 md:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500">Notes</h4>
                        <p className="mt-1 text-sm text-gray-600">{booking.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No bookings found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'upcoming'
                  ? "You don't have any upcoming bookings."
                  : activeTab === 'past'
                  ? "You don't have any past bookings."
                  : "You don't have any cancelled bookings."}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="btn-primary"
                >
                  Book a service
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BookingPage;
