/**
 * Guest Housekeeping Bookings Management
 * Shows guest's housekeeping bookings and service requests
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-toastify';
import { FaBroom, FaClock, FaCalendarAlt, FaSpinner, FaCheck, FaTimes, FaEye } from 'react-icons/fa';
import apiClient from '../../services/api.service';

const GuestHousekeepingBookings = () => {
  const { t, i18n } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      // Get all bookings and filter housekeeping ones on the frontend
      const response = await apiClient.get('/client/bookings');

      if (response.data.success) {
        // Filter for housekeeping bookings (including all housekeeping categories)
        const allBookings = response.data.data.bookings || [];

        // Debug: Log all bookings to see what we're working with
        console.log('🔍 All bookings received:', allBookings);
        console.log('🔍 Total bookings count:', allBookings.length);

        // Debug: Log detailed structure of each booking
        allBookings.forEach((booking, index) => {
          console.log(`🔍 Booking ${index + 1} structure:`, {
            id: booking._id,
            serviceName: booking.serviceName,
            serviceType: booking.serviceType,
            category: booking.category,
            serviceDetails: booking.serviceDetails,
            guestDetails: booking.guestDetails,
            schedule: booking.schedule,
            fullBooking: booking
          });
        });

        const housekeepingBookings = allBookings.filter(booking => {
          const serviceName = (booking.serviceName || booking.serviceDetails?.name || '').toLowerCase();
          const serviceCategory = (booking.serviceDetails?.category || booking.category || '').toLowerCase();
          const serviceType = booking.serviceType;

          // Debug: Log each booking's relevant fields
          console.log('🔍 Checking booking:', {
            id: booking._id,
            serviceName: booking.serviceName,
            serviceType: booking.serviceType,
            category: booking.category,
            serviceDetailsCategory: booking.serviceDetails?.category,
            serviceName_lower: serviceName,
            serviceCategory_lower: serviceCategory
          });

          const isHousekeeping = (
            serviceType === 'housekeeping' ||
            serviceCategory === 'housekeeping' ||
            serviceCategory === 'cleaning' ||
            serviceCategory === 'laundry' ||
            serviceCategory === 'amenities' ||
            serviceCategory === 'maintenance' ||
            booking.category === 'cleaning' ||
            booking.category === 'laundry' ||
            booking.category === 'amenities' ||
            booking.category === 'maintenance' ||
            serviceName.includes('housekeeping') ||
            serviceName.includes('cleaning') ||
            serviceName.includes('room cleaning') ||
            serviceName.includes('laundry') ||
            serviceName.includes('amenities') ||
            serviceName.includes('maintenance') ||
            serviceName.includes('repair') ||
            serviceName.includes('technical support')
          );

          console.log('🔍 Is housekeeping?', isHousekeeping);
          return isHousekeeping;
        });

        console.log('🔍 Filtered housekeeping bookings:', housekeepingBookings);
        console.log('🔍 Housekeeping bookings count:', housekeepingBookings.length);

        setBookings(housekeepingBookings);
      } else {
        // For demo purposes, create comprehensive sample bookings
        console.log('🔍 No bookings from API, using sample data');
        setBookings([
          {
            id: 1,
            serviceName: 'Room Cleaning',
            category: 'cleaning',
            serviceType: 'housekeeping',
            status: 'pending',
            roomNumber: '204',
            guestDetails: { roomNumber: '204' },
            schedule: { preferredTime: '10:00' },
            scheduledDateTime: new Date().toISOString(),
            preferredTime: '10:00',
            specialRequests: 'Please clean bathroom thoroughly',
            createdAt: new Date().toISOString()
          },
          {
            id: 2,
            serviceName: 'Amenities Refill',
            category: 'amenities',
            serviceType: 'housekeeping',
            status: 'completed',
            roomNumber: '204',
            guestDetails: { roomNumber: '204' },
            schedule: { preferredTime: '14:00' },
            scheduledDateTime: new Date(Date.now() - 86400000).toISOString(),
            preferredTime: '14:00',
            specialRequests: 'Extra towels needed',
            createdAt: new Date(Date.now() - 86400000).toISOString()
          },
          {
            id: 3,
            serviceName: 'Maintenance Request',
            category: 'maintenance',
            serviceType: 'housekeeping',
            status: 'in_progress',
            roomNumber: '204',
            guestDetails: { roomNumber: '204' },
            schedule: { preferredTime: 'ASAP' },
            scheduledDateTime: new Date().toISOString(),
            preferredTime: 'ASAP',
            specialRequests: 'Air conditioning not working properly',
            createdAt: new Date().toISOString()
          },
          {
            id: 4,
            serviceName: 'Extra Towels',
            category: 'amenities',
            serviceType: 'housekeeping',
            status: 'pending',
            roomNumber: '301',
            guestDetails: { roomNumber: '301' },
            schedule: { preferredTime: 'Evening' },
            scheduledDateTime: new Date().toISOString(),
            preferredTime: 'Evening',
            specialRequests: 'Need 4 extra towels for guests',
            createdAt: new Date().toISOString()
          }
        ]);
      }
    } catch (error) {
      console.error('Error fetching housekeeping bookings:', error);
      // Set demo data on error
      setBookings([
        {
          id: 1,
          serviceName: 'Room Cleaning',
          category: 'cleaning',
          status: 'pending',
          roomNumber: '204',
          scheduledDateTime: new Date().toISOString(),
          preferredTime: '10:00',
          specialRequests: 'Please clean bathroom thoroughly',
          createdAt: new Date().toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to determine service category from service name
  const getServiceCategory = (serviceName) => {
    if (!serviceName) return 'cleaning';

    const name = serviceName.toLowerCase();
    if (name.includes('maintenance') || name.includes('repair') || name.includes('technical')) {
      return 'maintenance';
    } else if (name.includes('amenities') || name.includes('supplies') || name.includes('towels')) {
      return 'amenities';
    } else {
      return 'cleaning';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'cleaning':
        return <FaBroom className="text-blue-600" />;
      case 'amenities':
        return <FaCheck className="text-green-600" />;
      case 'maintenance':
        return <FaClock className="text-orange-600" />;
      default:
        return <FaBroom className="text-gray-600" />;
    }
  };

  const filteredBookings = bookings.filter(booking => {
    if (activeTab === 'all') return true;
    return booking.status === activeTab;
  });

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
        <span className="ml-2 text-lg">Loading your housekeeping bookings...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center">
              <FaBroom className="text-3xl text-blue-600 mr-4" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {t('navigation.housekeepingBookings', 'Housekeeping Bookings')}
                </h1>
                <p className="text-sm text-gray-600">
                  Manage your housekeeping service requests and bookings
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { key: 'all', label: 'All Bookings', count: bookings.length },
                { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
                { key: 'in_progress', label: 'In Progress', count: bookings.filter(b => b.status === 'in_progress').length },
                { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length }
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.key
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label} ({tab.count})
                </button>
              ))}
            </nav>
          </div>

          {/* Bookings List */}
          <div className="p-6">
            {filteredBookings.length === 0 ? (
              <div className="text-center py-12">
                <FaBroom className="text-6xl text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">
                  No housekeeping bookings found
                </h3>
                <p className="text-gray-500">
                  {activeTab === 'all'
                    ? "You haven't requested any housekeeping services yet."
                    : `No ${activeTab} housekeeping bookings found.`
                  }
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {getCategoryIcon(
                            booking.category ||
                            booking.serviceDetails?.category ||
                            getServiceCategory(booking.serviceName || booking.serviceDetails?.name)
                          )}
                        </div>
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {booking.serviceName || booking.serviceDetails?.name || 'Housekeeping Service'}
                          </h3>
                          <p className="text-sm text-gray-600 mt-1">
                            Room {booking.guestDetails?.roomNumber || booking.roomNumber} • {
                              (() => {
                                // Check the original preferred time stored in bookingDetails first
                                const originalPreferredTime = booking.bookingDetails?.preferredTime || booking.preferredTime;
                                const schedulePreferredTime = booking.schedule?.preferredTime;

                                if (originalPreferredTime === 'ASAP' || originalPreferredTime === 'now' ||
                                    schedulePreferredTime === 'ASAP' || schedulePreferredTime === 'now') {
                                  return 'As soon as possible';
                                }

                                return `Scheduled for ${schedulePreferredTime || originalPreferredTime || 'TBD'}`;
                              })()
                            }
                          </p>
                          {(booking.specialRequests || booking.serviceDetails?.specialRequests || booking.bookingDetails?.specialRequests) && (
                            <p className="text-sm text-gray-500 mt-2">
                              <strong>Special requests:</strong> {booking.specialRequests || booking.serviceDetails?.specialRequests || booking.bookingDetails?.specialRequests}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 mt-2">
                            Requested on {new Date(booking.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(booking.status)}`}>
                          {booking.status.replace('_', ' ').toUpperCase()}
                        </span>
                        <button
                          onClick={() => handleViewDetails(booking)}
                          className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                        >
                          <FaEye />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {showDetailsModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Booking Details
                </h3>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimes />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700">Service</label>
                  <p className="text-gray-900">{selectedBooking.serviceName}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Status</label>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedBooking.status)}`}>
                    {selectedBooking.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Room Number</label>
                  <p className="text-gray-900">{selectedBooking.roomNumber}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">Preferred Time</label>
                  <p className="text-gray-900">
                    {selectedBooking.preferredTime === 'ASAP' || selectedBooking.preferredTime === 'now'
                      ? 'As soon as possible'
                      : selectedBooking.preferredTime
                    }
                  </p>
                </div>

                {selectedBooking.specialRequests && (
                  <div>
                    <label className="text-sm font-medium text-gray-700">Special Requests</label>
                    <p className="text-gray-900">{selectedBooking.specialRequests}</p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-700">Requested On</label>
                  <p className="text-gray-900">
                    {new Date(selectedBooking.createdAt).toLocaleDateString()} at{' '}
                    {new Date(selectedBooking.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestHousekeepingBookings;
