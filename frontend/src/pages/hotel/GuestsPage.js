import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectAllUsers, selectUserLoading } from '../../redux/slices/userSlice';

/**
 * Hotel Admin Guests Management Page
 * @returns {JSX.Element} Guests management page
 */
const GuestsPage = () => {
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const isLoading = useSelector(selectUserLoading);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchUsers({ role: 'GUEST' }));
  }, [dispatch]);

  // Filter guests by search term and status
  const filteredGuests = users.filter(guest => {
    const matchesSearch = searchTerm === '' ||
      guest.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guest.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === '' || guest.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-6">Guests Management</h1>

      {/* Search and Filter */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Search guests..."
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
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>
        </div>
      </div>

      {/* Guests List */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="py-3 px-4 text-left">Guest Name</th>
                <th className="py-3 px-4 text-left">Email</th>
                <th className="py-3 px-4 text-left">Phone</th>
                <th className="py-3 px-4 text-left">Joined</th>
                <th className="py-3 px-4 text-left">Last Booking</th>
                <th className="py-3 px-4 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-4 px-4 text-center text-gray-500">
                    No guests found
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest._id} className="border-t border-gray-200 hover:bg-gray-50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white mr-3">
                          {guest.firstName?.[0]}{guest.lastName?.[0]}
                        </div>
                        <div>
                          <div className="font-medium">{guest.firstName} {guest.lastName}</div>
                          {guest.roomNumber && (
                            <div className="text-sm text-gray-500">Room #{guest.roomNumber}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {guest.email}
                    </td>
                    <td className="py-3 px-4">
                      {guest.phone || 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      {formatDate(guest.createdAt)}
                    </td>
                    <td className="py-3 px-4">
                      {guest.lastBookingDate ? formatDate(guest.lastBookingDate) : 'No bookings'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        guest.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {guest.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default GuestsPage;
