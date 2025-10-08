import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { API_BASE_URL } from '../../config/api.config';

const SuperHotelHotels = () => {
  const [hotels, setHotels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchHotels();
  }, []);

  const fetchHotels = async () => {
    try {
      // Get SuperHotel token from localStorage
      const superHotelToken = localStorage.getItem('superHotelToken');

      // Prepare headers
      const headers = {
        'Content-Type': 'application/json'
      };

      // Add Authorization header if token exists
      if (superHotelToken) {
        headers['Authorization'] = `Bearer ${superHotelToken}`;
      }

      const response = await fetch(`${API_BASE_URL}/admin/hotels`, {
        credentials: 'include', // Include cookies as fallback
        headers
      });

      if (response.ok) {
        const data = await response.json();
        setHotels(data.data.hotels);
      } else {
        setError('Failed to fetch hotels');
      }
    } catch (error) {
      console.error('Error fetching hotels:', error);
      setError('Error fetching hotels');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">Assigned Hotels</h1>
        <p className="mt-2 text-gray-600">View and manage your assigned hotels</p>
      </div>

      {/* Hotels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {hotels.map((hotel) => (
          <div key={hotel._id} className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{hotel.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  hotel.isActive && hotel.isPublished
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {hotel.isActive && hotel.isPublished ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="space-y-2 text-sm text-gray-600 mb-4">
                <p><span className="font-medium">Address:</span> {hotel.address?.street}, {hotel.address?.city}</p>
                <p><span className="font-medium">Total Rooms:</span> {hotel.totalRooms || 'N/A'}</p>
                <p><span className="font-medium">Rating:</span> {hotel.averageRating ? `${hotel.averageRating.toFixed(1)}/5` : 'No ratings'}</p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-gray-200">
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{hotel.clientCount || 0}</div>
                  <div className="text-xs text-gray-500">Clients</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">{hotel.totalBookings || 0}</div>
                  <div className="text-xs text-gray-500">Bookings</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-semibold text-gray-900">${hotel.totalRevenue?.toLocaleString() || '0'}</div>
                  <div className="text-xs text-gray-500">Revenue</div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-2">
                <Link
                  to={`/super-hotel-admin/hotels/${hotel._id}`}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-center py-2 px-4 rounded-md text-sm font-medium transition-colors"
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hotels.length === 0 && (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hotels assigned</h3>
          <p className="mt-1 text-sm text-gray-500">Contact the platform administrator to get hotels assigned to your account.</p>
        </div>
      )}
    </div>
  );
};

export default SuperHotelHotels;
