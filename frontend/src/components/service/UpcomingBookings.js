/**
 * Upcoming Bookings Component for Service Provider Dashboard
 */

import React from 'react';
import { Link } from 'react-router-dom';

const UpcomingBookings = ({ bookings = [] }) => {
  // If no bookings are passed, show sample data
  const displayBookings = bookings.length > 0 ? bookings : [
    {
      _id: 'sample1',
      orderId: 'ORD-2023001',
      service: { name: 'Airport Transfer' },
      hotel: { name: 'Grand Plaza Hotel' },
      guest: { firstName: 'John', lastName: 'Doe' },
      status: 'confirmed',
      scheduledDate: new Date(Date.now() + 86400000), // Tomorrow
      totalAmount: 75.00,
    },
    {
      _id: 'sample2',
      orderId: 'ORD-2023002',
      service: { name: 'City Tour' },
      hotel: { name: 'Seaside Resort' },
      guest: { firstName: 'Jane', lastName: 'Smith' },
      status: 'confirmed',
      scheduledDate: new Date(Date.now() + 172800000), // Day after tomorrow
      totalAmount: 120.00,
    }
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">Upcoming Bookings</h3>
        <Link to="/service/orders" className="text-sm text-blue-600 hover:text-blue-800">
          View All
        </Link>
      </div>
      <ul className="divide-y divide-gray-200">
        {displayBookings.map((booking) => (
          <li key={booking._id} className="px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center
                    ${booking.status === 'confirmed' ? 'bg-green-100' : 'bg-yellow-100'}`}>
                    <svg className={`h-6 w-6 ${booking.status === 'confirmed' ? 'text-green-600' : 'text-yellow-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <div className="text-sm font-medium text-gray-900">
                    {booking.service.name} - {booking.hotel.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {booking.guest.firstName} {booking.guest.lastName} • Order #{booking.orderId}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-sm font-medium text-gray-900">
                  ${booking.totalAmount.toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">
                  {booking.scheduledDate.toLocaleDateString()} at {booking.scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-end space-x-2">
              <Link
                to={`/service/orders/${booking._id}`}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
              >
                Details
              </Link>
              <button
                type="button"
                className="inline-flex items-center px-2.5 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 focus:outline-none"
              >
                Check-in
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UpcomingBookings;
