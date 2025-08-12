import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import LoadingScreen from '../../components/common/LoadingScreen';
import { API_BASE_URL, CLIENT_API } from '../../config/api.config';
import { formatPriceByLanguage } from '../../utils/currency';

/**
 * MyOrders Component
 * Displays user's booking history and current orders
 */
const MyOrdersPage = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);

  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Check for success message from navigation
  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // Clear the message after 5 seconds
      setTimeout(() => setSuccessMessage(''), 5000);
    }
  }, [location.state]);
  // Fetch user bookings
  const fetchBookings = React.useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      const statusFilter = activeTab !== 'all' ? `?status=${activeTab}` : '';

      // Construct the full API URL
      const apiUrl = `${API_BASE_URL}${CLIENT_API.BOOKINGS}${statusFilter}`;
      console.log('🔍 MyOrdersPage: Making request to:', apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('🔍 MyOrdersPage: Response status:', response.status);
      const data = await response.json();
      console.log('🔍 MyOrdersPage: Response data:', data);

      if (data.success) {
        // Handle the new response structure with bookings array inside data
        const bookingsData = data.data.bookings || data.data;
        setBookings(Array.isArray(bookingsData) ? bookingsData : []);
        console.log('🔍 MyOrdersPage: Bookings set:', bookingsData);
        // Log the structure of the first booking to understand the data format
        if (bookingsData && bookingsData.length > 0) {
          console.log('🔍 MyOrdersPage: First booking structure:', bookingsData[0]);
          console.log('🔍 MyOrdersPage: First booking keys:', Object.keys(bookingsData[0]));
          console.log('🔍 MyOrdersPage: Schedule:', bookingsData[0].schedule);
          console.log('🔍 MyOrdersPage: Pricing:', bookingsData[0].pricing);
          console.log('🔍 MyOrdersPage: Service Details:', bookingsData[0].serviceDetails);
        }
      } else {
        setError(data.message);
        console.error('🔍 MyOrdersPage: API error:', data.message);
      }
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error('🔍 MyOrdersPage: Fetch bookings error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // Status color mapping
  const getStatusColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in-progress': return 'bg-purple-100 text-purple-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  // Tab configuration
  const tabs = [
    { key: 'all', label: t('myOrders.tabs.allOrders'), count: Array.isArray(bookings) ? bookings.length : 0 },
    { key: 'pending', label: t('myOrders.tabs.pending'), count: Array.isArray(bookings) ? bookings.filter(b => b.status === 'pending').length : 0 },
    { key: 'confirmed', label: t('myOrders.tabs.confirmed'), count: Array.isArray(bookings) ? bookings.filter(b => b.status === 'confirmed').length : 0 },
    { key: 'completed', label: t('myOrders.tabs.completed'), count: Array.isArray(bookings) ? bookings.filter(b => b.status === 'completed').length : 0 }
  ];

  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  if (isLoading) return <LoadingScreen />;  return (
    <div className="min-h-screen bg-gray-50 py-8 pb-20 lg:pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{t('myOrders.title')}</h1>
          <p className="mt-2 text-sm sm:text-base text-gray-600">{t('myOrders.description')}</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">{t('common.success')}!</h3>
                <div className="mt-2 text-sm text-green-700">{successMessage}</div>
              </div>
              <div className="ml-auto pl-3">
                <div className="-mx-1.5 -my-1.5">
                  <button
                    onClick={() => setSuccessMessage('')}
                    className="inline-flex bg-green-50 rounded-md p-1.5 text-green-500 hover:bg-green-100"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}        {/* Tabs */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex flex-wrap space-x-2 sm:space-x-8 overflow-x-auto">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`py-2 px-2 sm:px-3 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={`ml-1 sm:ml-2 py-0.5 px-1.5 sm:px-2 rounded-full text-xs ${
                      activeTab === tab.key ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-900'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">{t('common.error')}</h3>
                <div className="mt-2 text-sm text-red-700">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Bookings List */}
        {!Array.isArray(bookings) || bookings.length === 0 ? (
          <div className="text-center py-12">
            <div className="mx-auto h-12 w-12 text-gray-400">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="mt-2 text-lg font-medium text-gray-900">{t('myOrders.noOrdersFound')}</h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeTab === 'all'
                ? t('myOrders.noBookingsYet')
                : t('myOrders.noOrdersInCategory', { category: activeTab })
              }
            </p>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {bookings.map((booking) => (
                <li key={booking._id} className="px-4 sm:px-6 py-4 hover:bg-gray-50">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
                        <div className="flex-1">
                          <h3 className="text-lg font-medium text-gray-900 truncate">
                            {booking.serviceDetails?.name || booking.serviceId?.name || t('myOrders.serviceName')}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {t('myOrders.bookingNumber')} #{booking.bookingNumber || booking._id.slice(-8)}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full self-start sm:self-auto ${getStatusColor(booking.status)}`}>
                            {booking.status?.charAt(0).toUpperCase() + booking.status?.slice(1)}
                          </span>
                          <div className="text-left sm:text-right">
                            <p className="text-lg font-semibold text-gray-900">
                              {formatPriceByLanguage(booking.pricing?.totalAmount || 0, i18n.language)}
                            </p>
                            <p className="text-sm text-gray-500">
                              {booking.serviceDetails?.category || booking.serviceId?.category}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4 text-sm text-gray-600">
                        <div className="truncate">
                          <span className="font-medium">{t('myOrders.date')}: </span>
                          <span className="break-words">
                            {booking.schedule?.preferredDate
                              ? format(new Date(booking.schedule.preferredDate), 'PPP')
                              : t('myOrders.notSpecified')
                            }
                          </span>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">{t('myOrders.time')}: </span>
                          <span>{booking.schedule?.preferredTime || t('myOrders.notSpecified')}</span>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">{t('myOrders.hotel')}: </span>
                          <span className="break-words">{booking.hotelId?.name || t('myOrders.hotelName')}</span>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">{t('myOrders.room')}: </span>
                          <span>{user?.roomNumber || booking.guestDetails?.roomNumber || t('myOrders.notSpecified')}</span>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">{t('myOrders.quantity')}: </span>
                          <span>{booking.bookingConfig?.quantity || booking.pricing?.quantity || 1}</span>
                        </div>
                        <div className="truncate">
                          <span className="font-medium">{t('myOrders.provider')}: </span>
                          <span className="break-words">{booking.serviceProviderId?.businessName || t('myOrders.providerName')}</span>
                        </div>
                      </div>

                      {booking.specialRequests && (
                        <div className="mt-2">
                          <span className="text-sm font-medium text-gray-600">{t('myOrders.specialRequests')}: </span>
                          <span className="text-sm text-gray-500 break-words">{booking.specialRequests}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 self-start sm:self-auto sm:ml-6">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="w-full sm:w-auto bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        {t('myOrders.viewDetails')}
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}        {/* Details Modal */}
        {showDetailsModal && selectedBooking && (
          <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <div className="fixed inset-0 transition-opacity" aria-hidden="true">
                <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
              </div>

              <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full max-w-full mx-4 sm:mx-0">
                <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-medium text-gray-900 pr-4">{t('myOrders.bookingDetails')}</h3>
                    <button
                      onClick={() => setShowDetailsModal(false)}
                      className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                    >
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">{t('myOrders.serviceInformation')}</h4>
                      <p className="text-sm text-gray-600 break-words">{selectedBooking.serviceId?.name}</p>
                      <p className="text-sm text-gray-500">{selectedBooking.serviceId?.category}</p>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">{t('myOrders.bookingDetails')}</h4>
                      <div className="text-sm text-gray-600 space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="font-medium w-full sm:w-32 flex-shrink-0">{t('myOrders.bookingNumber')}:</span>
                          <span className="break-words">{selectedBooking.bookingNumber || selectedBooking._id.slice(-8)}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="font-medium w-full sm:w-32 flex-shrink-0">{t('myOrders.date')}:</span>
                          <span className="break-words">{selectedBooking.bookingDate ? format(new Date(selectedBooking.bookingDate), 'PPP') : t('myOrders.notSpecified')}</span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="font-medium w-full sm:w-32 flex-shrink-0">{t('myOrders.status')}:</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full self-start ${getStatusColor(selectedBooking.status)}`}>
                            {selectedBooking.status?.charAt(0).toUpperCase() + selectedBooking.status?.slice(1)}
                          </span>
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="font-medium w-full sm:w-32 flex-shrink-0">{t('myOrders.room')}:</span>
                          <span>{user?.roomNumber || selectedBooking.guestDetails?.roomNumber || t('myOrders.notSpecified')}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">{t('myOrders.pricing')}</h4>
                      <div className="text-sm text-gray-600">
                        <div className="flex flex-col sm:flex-row sm:items-center">
                          <span className="font-medium w-full sm:w-32 flex-shrink-0">{t('myOrders.totalAmount')}:</span>
                          <span className="text-lg font-semibold text-gray-900">{formatPriceByLanguage(selectedBooking.totalAmount || 0, i18n.language)}</span>
                        </div>
                      </div>
                    </div>

                    {selectedBooking.specialRequests && (
                      <div>
                        <h4 className="font-medium text-gray-800 mb-2">{t('myOrders.specialRequests')}</h4>
                        <p className="text-sm text-gray-600 break-words">{selectedBooking.specialRequests}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                  <button
                    onClick={() => setShowDetailsModal(false)}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-indigo-600 text-base font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
                  >
                    {t('common.close')}
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

export default MyOrdersPage;
