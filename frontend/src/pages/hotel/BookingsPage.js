import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotelBookings, selectAllBookings, selectBookingLoading } from '../../redux/slices/bookingSlice';
import { selectHotelCurrency } from '../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../utils/currency';
import { useTranslation } from 'react-i18next';
import useAuth from '../../hooks/useAuth';
import apiClient from '../../services/api.service';

/**
 * Hotel Admin Bookings Management Page
 * @returns {JSX.Element} Bookings management page
 */
const BookingsPage = () => {
  const { i18n } = useTranslation();
  const dispatch = useDispatch();
  const bookings = useSelector(selectAllBookings);
  const isLoading = useSelector(selectBookingLoading);
  const currency = useSelector(selectHotelCurrency);
  const { currentUser: user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (user?.hotelId) {
      dispatch(fetchHotelBookings(user.hotelId));
    }
  }, [dispatch, user]);

  // Filter bookings by search term and status
  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = searchTerm === '' ||
      booking.guest?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.guest?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking.service?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      booking._id?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || booking.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Handle viewing booking details
  const handleViewDetails = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
  };

  // Handle marking cash payment as paid
  const handleMarkCashPaymentPaid = async (bookingId) => {
    try {
      const response = await apiClient.put(`/hotel/bookings/${bookingId}/payment-status`, {
        paymentStatus: 'paid'
      });

      if (response.data.status === 'success') {
        // Update the local state
        const updatedBooking = {
          ...selectedBooking,
          payment: {
            ...selectedBooking.payment,
            paymentStatus: 'paid',
            paymentDate: new Date().toISOString(),
            status: 'completed'
          },
          status: selectedBooking.status === 'pending_payment' ? 'confirmed' : selectedBooking.status
        };
        setSelectedBooking(updatedBooking);

        // Refresh the bookings list
        if (user?.hotelId) {
          dispatch(fetchHotelBookings(user.hotelId));
        }

        alert('Cash payment marked as paid successfully!');
      } else {
        throw new Error(response.data.message || 'Failed to update payment status');
      }
    } catch (error) {
      console.error('Error updating payment status:', error);
      alert(error.response?.data?.message || 'Failed to update payment status. Please try again.');
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Bookings Management</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search bookings..."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="w-full md:w-1/3">
          <select
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Booking ID</th>
                <th className="py-3 px-4 text-left">Guest</th>
                <th className="py-3 px-4 text-left">Service</th>
                <th className="py-3 px-4 text-left">Date & Time</th>
                <th className="py-3 px-4 text-left">Amount</th>
                <th className="py-3 px-4 text-left">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookings.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-4 px-4 text-center text-gray-500">
                    No bookings found
                  </td>
                </tr>
              ) : (
                filteredBookings.map((booking) => (
                  <tr key={booking._id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="font-medium">{booking._id.substring(0, 8)}...</div>
                    </td>
                    <td className="py-3 px-4">
                      {booking.guest ? (
                        <div>
                          <div className="font-medium">{booking.guest.firstName} {booking.guest.lastName}</div>
                          <div className="text-sm text-gray-500">{booking.guest.email}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Guest info not available</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {booking.service ? (
                        <div>
                          <div className="font-medium">{booking.service.name}</div>
                          <div className="text-sm text-gray-500">{booking.service.category}</div>
                        </div>
                      ) : (
                        <div className="text-gray-500">Service info not available</div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div>{formatDate(booking.appointmentDate)}</div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium">{formatPriceByLanguage(booking.totalAmount, i18n.language, currency)}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {booking.payment?.paymentMethod === 'cash' ? (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.payment?.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {booking.payment?.paymentStatus === 'paid' ? 'Cash Paid' : 'Cash Pending'}
                          </span>
                        ) : (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            booking.payment?.paymentStatus === 'paid'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {booking.payment?.paymentStatus === 'paid' ? 'Online Paid' : 'Payment Pending'}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        booking.status === 'COMPLETED'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : booking.status === 'IN_PROGRESS'
                          ? 'bg-blue-100 text-blue-800'
                          : booking.status === 'CONFIRMED'
                          ? 'bg-indigo-100 text-indigo-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => handleViewDetails(booking)}
                        className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
                      >
                        Details
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Details Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Booking Details</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Booking Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p><span className="font-medium">ID:</span> {selectedBooking._id}</p>
                  <p><span className="font-medium">Status:</span> {selectedBooking.status}</p>
                  <p><span className="font-medium">Created:</span> {formatDate(selectedBooking.createdAt)}</p>
                  <p><span className="font-medium">Appointment:</span> {formatDate(selectedBooking.appointmentDate)}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Payment Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p><span className="font-medium">Total Amount:</span> {formatPriceByLanguage(selectedBooking.totalAmount || selectedBooking.pricing?.totalAmount || 0, i18n.language, currency)}</p>
                  <p><span className="font-medium">Payment Method:</span> {
                    selectedBooking.payment?.paymentMethod === 'cash' ? 'Cash (Pay at Hotel)' :
                    selectedBooking.payment?.paymentMethod === 'online' ? 'Online Payment' :
                    selectedBooking.paymentMethod || 'N/A'
                  }</p>
                  <p><span className="font-medium">Payment Status:</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                      selectedBooking.payment?.paymentStatus === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {selectedBooking.payment?.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </p>
                  {selectedBooking.payment?.paymentDate && (
                    <p><span className="font-medium">Payment Date:</span> {formatDate(selectedBooking.payment.paymentDate)}</p>
                  )}

                  {/* Cash Payment Action Button */}
                  {selectedBooking.payment?.paymentMethod === 'cash' && selectedBooking.payment?.paymentStatus === 'pending' && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => handleMarkCashPaymentPaid(selectedBooking._id)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                      >
                        Mark Cash Payment as Paid
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Guest Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {selectedBooking.guest ? (
                    <>
                      <p><span className="font-medium">Name:</span> {selectedBooking.guest.firstName} {selectedBooking.guest.lastName}</p>
                      <p><span className="font-medium">Email:</span> {selectedBooking.guest.email}</p>
                      <p><span className="font-medium">Phone:</span> {selectedBooking.guest.phone || 'N/A'}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Guest information not available</p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Service Information</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  {selectedBooking.service ? (
                    <>
                      <p><span className="font-medium">Name:</span> {selectedBooking.service.name}</p>
                      <p><span className="font-medium">Category:</span> {selectedBooking.service.category}</p>
                      <p><span className="font-medium">Provider:</span> {selectedBooking.service.providerName || 'N/A'}</p>
                      <p><span className="font-medium">Base Price:</span> {formatPriceByLanguage(selectedBooking.service.basePrice || 0, i18n.language, currency)}</p>
                    </>
                  ) : (
                    <p className="text-gray-500">Service information not available</p>
                  )}
                </div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-700 mb-2">Notes</h3>
                <div className="bg-gray-50 p-4 rounded-md">
                  <p>{selectedBooking.notes}</p>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
