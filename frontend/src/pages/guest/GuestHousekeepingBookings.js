/**
 * Guest Housekeeping Bookings Management
 * Shows guest's housekeeping bookings and service requests
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FaBroom, FaClock, FaSpinner, FaCheck, FaTimes, FaEye, FaChevronLeft, FaChevronRight, FaMapMarkerAlt } from 'react-icons/fa';
import apiClient from '../../services/api.service';

const GuestHousekeepingBookings = () => {
  const { t } = useTranslation();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [activeTab, setActiveTab] = useState('pending');
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBookings, setTotalBookings] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1); // Reset to page 1 when tab changes
    fetchBookings();
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchBookings();
  }, [currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

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
        setTotalBookings(housekeepingBookings.length);
        setTotalPages(Math.ceil(housekeepingBookings.length / itemsPerPage));
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
          },
          {
            id: 5,
            serviceName: 'Technical support',
            category: 'maintenance',
            serviceType: 'housekeeping',
            status: 'completed',
            roomNumber: '301',
            guestDetails: { roomNumber: '301' },
            schedule: { preferredTime: 'Morning' },
            scheduledDateTime: new Date(Date.now() - 172800000).toISOString(),
            preferredTime: 'Morning',
            specialRequests: 'WiFi not working in room',
            createdAt: new Date(Date.now() - 172800000).toISOString()
          }
        ]);
        setTotalBookings(5);
        setTotalPages(1);
        setTotalBookings(4);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching housekeeping bookings:', error);
      // Set demo data on error
      const demoBookings = [
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
      ];
      setBookings(demoBookings);
      setTotalBookings(demoBookings.length);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'pending': 'bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 border border-yellow-200',
      'confirmed': 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-800 border border-emerald-200',
      'in_progress': 'bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] border border-[#67BAE0]/20',
      'completed': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border border-blue-200',
      'cancelled': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border border-red-200'
    };
    return colors[status] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-800 border border-gray-200';
  };

  const getStatusLabel = (status) => {
    const statusLabels = {
      'pending': t('common.pending') || 'Pending',
      'confirmed': t('common.confirmed') || 'Confirmed',
      'in_progress': t('common.inProgress') || 'In Progress',
      'completed': t('common.completed') || 'Completed',
      'cancelled': t('common.cancelled') || 'Cancelled'
    };
    return statusLabels[status] || status;
  };

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  // Helper function to determine service category from service name
  const getServiceCategory = (booking) => {
    const serviceName = (booking.serviceName || booking.serviceDetails?.name || '').toLowerCase();
    const serviceCategory = (booking.serviceDetails?.category || booking.category || '').toLowerCase();

    if (serviceName.includes('maintenance') || serviceName.includes('repair') || serviceName.includes('technical') ||
        serviceCategory === 'maintenance' || booking.category === 'maintenance') {
      return 'maintenance';
    } else if (serviceName.includes('amenities') || serviceName.includes('supplies') || serviceName.includes('towels') ||
               serviceCategory === 'amenities' || booking.category === 'amenities') {
      return 'amenities';
    } else {
      return 'cleaning';
    }
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'cleaning':
        return <FaBroom className="text-white text-xs sm:text-sm" />;
      case 'amenities':
        return <FaCheck className="text-white text-xs sm:text-sm" />;
      case 'maintenance':
        return <FaClock className="text-white text-xs sm:text-sm" />;
      default:
        return <FaBroom className="text-white text-xs sm:text-sm" />;
    }
  };

  const renderBookingCard = (booking) => {
    const category = getServiceCategory(booking);

    return (
      <div key={booking.id} className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg border border-white/20 p-2.5 sm:p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300">
      {/* Compact Header */}
      <div className="flex justify-between items-start mb-2 sm:mb-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 sm:w-10 sm:h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-lg flex items-center justify-center shadow-md">
            {getCategoryIcon(category)}
          </div>
          <div>
            <h3 className="text-sm sm:text-lg font-bold text-gray-900">
              {booking.serviceName || booking.serviceDetails?.name || 'Housekeeping Service'}
            </h3>
          </div>
        </div>
        <div className="text-right">
          <span className={`px-4 py-2 rounded-full text-sm font-semibold shadow-md backdrop-blur-sm ${getStatusColor(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </span>
          <p className="text-xs text-gray-400 mt-2 font-medium">
            {new Date(booking.createdAt).toLocaleDateString()}
          </p>
        </div>
      </div>

      {/* Ultra Compact Info */}
      <div className="space-y-2 mb-3">
        {/* Room & Schedule in One Row */}
        <div className="bg-gradient-to-r from-[#3B5787]/10 to-[#67BAE0]/10 rounded-lg p-2 border border-[#67BAE0]/20">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5">
              <FaMapMarkerAlt className="text-[#3B5787] text-xs" />
              <span className="font-semibold text-gray-900 truncate">
                Room {booking.guestDetails?.roomNumber || booking.roomNumber || 'N/A'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-gray-600 ml-2">
              <FaClock className="text-[#67BAE0] text-xs" />
              <span className="whitespace-nowrap">
                {(() => {
                  const originalPreferredTime = booking.bookingDetails?.preferredTime || booking.preferredTime;
                  const schedulePreferredTime = booking.schedule?.preferredTime;

                  if (originalPreferredTime === 'ASAP' || originalPreferredTime === 'now' ||
                      schedulePreferredTime === 'ASAP' || schedulePreferredTime === 'now') {
                    return 'ASAP';
                  }

                  return schedulePreferredTime || originalPreferredTime || 'TBD';
                })()}
              </span>
            </div>
          </div>
        </div>

        {/* Special Requests */}
        {(booking.specialRequests || booking.serviceDetails?.specialRequests || booking.bookingDetails?.specialRequests) && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-2 border border-amber-200">
            <div className="flex items-center gap-1 text-xs">
              <span className="font-medium text-amber-800">Special Requests:</span>
              <span className="text-gray-700 truncate">
                {booking.specialRequests || booking.serviceDetails?.specialRequests || booking.bookingDetails?.specialRequests}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Ultra Compact Action Buttons */}
      <div className="flex gap-1.5 pt-1.5 border-t border-gray-100 mt-2">
        <button
          onClick={() => handleViewDetails(booking)}
          className="flex-1 flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20 border border-[#3B5787]/20 hover:border-[#67BAE0]/30 rounded-md font-medium text-xs transition-all duration-200"
        >
          <FaEye />
          <span>Details</span>
        </button>
      </div>
      </div>
    );
  };

  const filteredBookings = bookings.filter(booking => {
    return booking.status === activeTab;
  });

  const tabs = [
    { id: 'pending', label: t('housekeeping.labels.pending', 'Pending'), icon: FaClock },
    { id: 'in_progress', label: t('housekeeping.labels.inProgress', 'In Progress'), icon: FaSpinner },
    { id: 'completed', label: t('housekeeping.labels.completed', 'Completed'), icon: FaCheck }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3B5787]/5 via-white to-[#67BAE0]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Modern Header */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <div className="flex items-center gap-4 mb-3">
              <div className="w-14 h-14 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-2xl flex items-center justify-center shadow-lg">
                <FaBroom className="text-white text-2xl" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent">
                  {t('navigation.housekeepingBookings', 'Housekeeping Bookings')}
                </h1>
                <p className="text-gray-600 mt-1">Manage your housekeeping service requests and bookings</p>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Tabs */}
        <div className="mb-8">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
            <nav className="flex space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 flex items-center justify-center gap-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-lg transform scale-[1.02]'
                      : 'text-gray-600 hover:text-[#3B5787] hover:bg-[#67BAE0]/10'
                  }`}
                >
                  <tab.icon className="text-sm" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
              <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>
              <div className="relative flex flex-col items-center">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">My Housekeeping Bookings</h1>
                <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">{t('housekeeping.labels.processing', 'Loading...')}</p>
              </div>
            </div>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
              <div className="flex justify-center items-center h-96">
                <div className="relative">
                  <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
                  <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-[#3B5787] border-t-transparent animate-ping opacity-20"></div>
                </div>
              </div>
            </div>
          </div>
        ) : filteredBookings.length > 0 ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredBookings.map(renderBookingCard)}
            </div>

            {/* Pagination */}
            <div className="mt-8 bg-white/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/20">
              {(totalPages > 1 || totalBookings > itemsPerPage) && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600">
                    Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalBookings)} of {totalBookings} bookings
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Previous Button */}
                    <button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        currentPage === 1
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20'
                      }`}
                    >
                      <FaChevronLeft className="text-xs" />
                      <span className="hidden sm:inline">Previous</span>
                    </button>

                    {/* Page Numbers */}
                    <div className="flex gap-1">
                      {[...Array(totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        const isActive = pageNumber === currentPage;

                        // Show first page, last page, current page, and pages around current
                        if (
                          pageNumber === 1 ||
                          pageNumber === totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <button
                              key={pageNumber}
                              onClick={() => setCurrentPage(pageNumber)}
                              className={`w-8 h-8 rounded-lg font-medium text-sm transition-all duration-200 ${
                                isActive
                                  ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white shadow-md'
                                  : 'text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20'
                              }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <span key={pageNumber} className="px-2 py-2 text-gray-400">
                              ...
                            </span>
                          );
                        }
                        return null;
                      })}
                    </div>

                    {/* Next Button */}
                    <button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`flex items-center gap-1 px-3 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
                        currentPage === totalPages
                          ? 'text-gray-400 cursor-not-allowed'
                          : 'text-[#3B5787] hover:text-[#67BAE0] bg-[#3B5787]/10 hover:bg-[#67BAE0]/20'
                      }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <FaChevronRight className="text-xs" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gradient-to-br from-[#3B5787]/20 to-[#67BAE0]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <FaBroom className="text-[#3B5787] text-2xl" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {t('housekeeping.noBookings', 'No bookings found')}
            </h3>
            <p className="text-gray-500 mb-4">
              {t('housekeeping.noBookingsDescription', 'You don\'t have any housekeeping bookings yet.')}
            </p>
          </div>
        )}

        {/* Details Modal */}
        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto border border-white/20">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-xl flex items-center justify-center shadow-md">
                      <FaBroom className="text-white text-sm" />
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-[#3B5787] to-[#67BAE0] bg-clip-text text-transparent">
                      Booking Details
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 rounded-xl p-4 border border-[#67BAE0]/10">
                    <label className="text-sm font-semibold text-[#3B5787] mb-1 block">Service</label>
                    <p className="text-gray-900 font-medium">
                      {selectedBooking.serviceName || selectedBooking.serviceDetails?.name || 'Housekeeping Service'}
                    </p>
                  </div>

                  <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 rounded-xl p-4 border border-[#67BAE0]/10">
                    <label className="text-sm font-semibold text-[#3B5787] mb-2 block">Status</label>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${getStatusColor(selectedBooking.status)}`}>
                      {getStatusLabel(selectedBooking.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 rounded-xl p-4 border border-[#67BAE0]/10">
                      <label className="text-sm font-semibold text-[#3B5787] mb-1 block">Room</label>
                      <p className="text-gray-900 font-medium">
                        {selectedBooking.roomNumber || selectedBooking.guestDetails?.roomNumber || 'N/A'}
                      </p>
                    </div>

                    <div className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 rounded-xl p-4 border border-[#67BAE0]/10">
                      <label className="text-sm font-semibold text-[#3B5787] mb-1 block">Time</label>
                      <p className="text-gray-900 font-medium">
                        {(() => {
                          const preferredTime = selectedBooking.preferredTime ||
                                               selectedBooking.schedule?.preferredTime ||
                                               selectedBooking.bookingDetails?.preferredTime;

                          if (preferredTime === 'ASAP' || preferredTime === 'now') {
                            return 'As soon as possible';
                          }
                          return preferredTime || 'Not specified';
                        })()}
                      </p>
                    </div>
                  </div>

                  {(selectedBooking.specialRequests || selectedBooking.serviceDetails?.specialRequests || selectedBooking.bookingDetails?.specialRequests) && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
                      <label className="text-sm font-semibold text-amber-800 mb-1 block">Special Requests</label>
                      <p className="text-gray-800 font-medium">
                        {selectedBooking.specialRequests || selectedBooking.serviceDetails?.specialRequests || selectedBooking.bookingDetails?.specialRequests}
                      </p>
                    </div>
                  )}

                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                    <label className="text-sm font-semibold text-gray-700 mb-1 block">Requested On</label>
                    <p className="text-gray-800 font-medium">
                      {new Date(selectedBooking.createdAt).toLocaleDateString()} at{' '}
                      {new Date(selectedBooking.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="px-6 py-3 bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-200"
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
