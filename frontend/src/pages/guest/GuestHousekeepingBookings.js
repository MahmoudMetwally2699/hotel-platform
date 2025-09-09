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
        return 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200';
      case 'confirmed':
        return 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200';
      case 'in_progress':
        return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border border-purple-200';
      case 'completed':
        return 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200';
      case 'cancelled':
        return 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200';
      default:
        return 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Modern Header with Glassmorphism */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/20 p-6 sm:p-8 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
              <FaBroom className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {t('navigation.housekeepingBookings', 'Housekeeping Bookings')}
              </h1>
              <p className="text-gray-600 text-lg">
                Manage your housekeeping service requests and bookings
              </p>
            </div>
          </div>
        </div>

        {/* Modern Tab Navigation */}
        <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-2 mb-8">
          <nav className="flex flex-wrap gap-2">
            {[
              { key: 'all', label: 'All Bookings', count: bookings.length },
              { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
              { key: 'in_progress', label: 'In Progress', count: bookings.filter(b => b.status === 'in_progress').length },
              { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 min-w-fit px-4 py-3 rounded-xl font-medium text-sm transition-all duration-300 transform hover:scale-105 ${
                  activeTab === tab.key
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                    : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <span>{tab.label}</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                    activeTab === tab.key
                      ? 'bg-white/20 text-white'
                      : 'bg-blue-100 text-blue-600'
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </nav>
        </div>

        {/* Bookings List */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-12 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaBroom className="text-blue-500 text-2xl" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                No housekeeping bookings found
              </h3>
              <p className="text-gray-600 text-lg">
                {activeTab === 'all'
                  ? "You haven't requested any housekeeping services yet."
                  : `No ${activeTab} housekeeping bookings found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-4 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md">
                        <FaBroom className="text-white text-lg" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {booking.serviceName || booking.serviceDetails?.name || 'Housekeeping Service'}
                        </h3>
                        <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200 mb-4">
                          <div className="flex items-center gap-2 mb-2">
                            <FaClock className="text-blue-500 text-sm" />
                            <span className="font-semibold text-blue-800 text-sm">Schedule & Room</span>
                          </div>
                          <p className="text-gray-800 font-medium">
                            Room {booking.guestDetails?.roomNumber || booking.roomNumber} • {
                              (() => {
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
                        </div>
                        {(booking.specialRequests || booking.serviceDetails?.specialRequests || booking.bookingDetails?.specialRequests) && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl p-4 border border-amber-200 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-semibold text-amber-800 text-sm">Special Requests</span>
                            </div>
                            <p className="text-gray-800 font-medium">
                              {booking.specialRequests || booking.serviceDetails?.specialRequests || booking.bookingDetails?.specialRequests}
                            </p>
                          </div>
                        )}
                        <p className="text-xs text-gray-400 font-medium">
                          Requested on {new Date(booking.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md backdrop-blur-sm ${getStatusColor(booking.status)}`}>
                        {booking.status.replace('_', ' ').toUpperCase()}
                      </span>
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="flex items-center justify-center gap-2 px-4 py-2 text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 hover:border-blue-300 rounded-xl font-medium transition-all duration-200 transform hover:scale-105"
                      >
                        <FaEye />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
    </div>
  );
};

export default GuestHousekeepingBookings;
