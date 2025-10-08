import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectAllUsers, selectUserLoading } from '../../redux/slices/userSlice';
import { HiSearch, HiFilter, HiUserAdd, HiCheckCircle, HiXCircle, HiPencil } from 'react-icons/hi';
import { useAuth } from '../../hooks/useAuth';
import hotelService from '../../services/hotel.service';

/**
 * Hotel Admin Guests Management Page
 * @returns {JSX.Element} Guests management page
 */
const GuestsPage = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const users = useSelector(selectAllUsers);
  const isLoading = useSelector(selectUserLoading);
  const { currentUser } = useAuth();

  // State management
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });
  const [guests, setGuests] = useState([]);
  const [filteredGuests, setFilteredGuests] = useState([]);
  const [updating, setUpdating] = useState(new Set());

  // Edit modal state
  const [editModal, setEditModal] = useState({
    isOpen: false,
    guest: null,
    roomNumber: '',
    checkInDate: '',
    checkOutDate: ''
  });

  // Fetch guests with pagination
  const fetchGuests = useCallback(async () => {
    try {
      const response = await hotelService.getHotelGuests({
        page: pagination.page,
        limit: pagination.limit,
        search: searchTerm,
        status: statusFilter
      });

      setGuests(response.data.guests || []);
      setPagination(prev => ({
        ...prev,
        total: response.data.total || 0,
        totalPages: response.data.totalPages || 0
      }));
    } catch (error) {
      // Fallback to redux for now
      dispatch(fetchUsers({ role: 'GUEST' }));
      setGuests(users);
    }
  }, [pagination.page, pagination.limit, searchTerm, statusFilter, dispatch, users]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  useEffect(() => {
    // Apply filters locally until backend is updated
    const filtered = guests.filter(guest => {
      const matchesSearch = searchTerm === '' ||
        guest.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        guest.fullGuestName?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === '' || guest.isActive === (statusFilter === 'ACTIVE');

      return matchesSearch && matchesStatus;
    });

    setFilteredGuests(filtered);
  }, [guests, searchTerm, statusFilter]);

  // Handle search with debounce
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Handle status filter change
  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  // Toggle guest active status
  const toggleGuestStatus = async (guestId, currentStatus) => {
    setUpdating(prev => new Set(prev).add(guestId));

    try {
      await hotelService.updateGuestStatus(guestId, !currentStatus);

      // Update local state
      setGuests(prev => prev.map(guest =>
        guest._id === guestId
          ? { ...guest, isActive: !currentStatus }
          : guest
      ));

      // Show success message (you can implement toast notifications)
    } catch (error) {
      console.error('Error updating guest status:', error);
      // Show error message
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(guestId);
        return newSet;
      });
    }
  };

  // Open edit modal
  const openEditModal = (guest) => {
    setEditModal({
      isOpen: true,
      guest,
      roomNumber: guest.roomNumber || '',
      checkInDate: guest.checkInDate ? new Date(guest.checkInDate).toISOString().split('T')[0] : '',
      checkOutDate: guest.checkOutDate ? new Date(guest.checkOutDate).toISOString().split('T')[0] : ''
    });
  };

  // Close edit modal
  const closeEditModal = () => {
    setEditModal({
      isOpen: false,
      guest: null,
      roomNumber: '',
      checkInDate: '',
      checkOutDate: ''
    });
  };

  // Update guest room and dates
  const updateGuestInfo = async () => {
    if (!editModal.guest) return;

    setUpdating(prev => new Set(prev).add(editModal.guest._id));

    try {
      const updateData = {
        roomNumber: editModal.roomNumber,
        checkInDate: editModal.checkInDate,
        checkOutDate: editModal.checkOutDate
      };

      await hotelService.updateGuestInfo(editModal.guest._id, updateData);

      // Update local state
      setGuests(prev => prev.map(guest =>
        guest._id === editModal.guest._id
          ? { ...guest, ...updateData }
          : guest
      ));

      closeEditModal();
    } catch (error) {
      console.error('Error updating guest information:', error);
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(editModal.guest._id);
        return newSet;
      });
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Get guest display name
  const getGuestName = (guest) => {
    if (guest.fullGuestName) return guest.fullGuestName;
    if (guest.firstName && guest.lastName) {
      return `${guest.firstName} ${guest.lastName}`.replace(' undefined', '').trim();
    }
    return guest.firstName || guest.lastName || guest.name || t('hotelAdmin.guests.unknownGuest');
  };

  // Get guest initials
  const getGuestInitials = (guest) => {
    const name = getGuestName(guest);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gradient-to-r from-modern-blue to-modern-lightBlue rounded-full animate-spin border-t-transparent"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-modern-lightBlue/20 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-modern-blue to-modern-lightBlue rounded-lg p-6 mb-6 text-white">
        <h1 className="text-2xl font-bold mb-2">{t('hotelAdmin.guests.title')}</h1>
        <p className="text-blue-100">{t('hotelAdmin.guests.subtitle')}</p>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <div className="relative">
              <HiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder={t('hotelAdmin.guests.searchPlaceholder')}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-modern-blue"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Status Filter */}
          <div className="lg:w-48">
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-modern-blue focus:border-modern-blue"
              value={statusFilter}
              onChange={handleStatusFilter}
            >
              <option value="">{t('hotelAdmin.guests.filters.allStatuses')}</option>
              <option value="ACTIVE">{t('hotelAdmin.guests.filters.active')}</option>
              <option value="INACTIVE">{t('hotelAdmin.guests.filters.inactive')}</option>
            </select>
          </div>

          {/* Results Count */}
          <div className="flex items-center text-sm text-gray-500">
            <HiFilter className="h-4 w-4 mr-1" />
            {t('hotelAdmin.guests.resultsCount', { count: filteredGuests.length })}
          </div>
        </div>
      </div>

      {/* Guests Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('hotelAdmin.guests.table.guest')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Room & Dates
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('hotelAdmin.guests.table.contact')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('hotelAdmin.guests.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('hotelAdmin.guests.table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="text-gray-500">
                      <HiUserAdd className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                      <h3 className="text-lg font-medium">{t('hotelAdmin.guests.noGuests')}</h3>
                      <p className="text-sm">{t('hotelAdmin.guests.noGuestsDescription')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredGuests.map((guest) => (
                  <tr key={guest._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold text-sm">
                          {getGuestInitials(guest)}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getGuestName(guest)}
                          </div>
                          <div className="text-sm text-gray-500">{guest.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {guest.roomNumber ? `Room ${guest.roomNumber}` : 'No room assigned'}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>Check-in: {formatDate(guest.checkInDate)}</div>
                          <div>Check-out: {formatDate(guest.checkOutDate)}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{guest.phone || t('hotelAdmin.guests.noPhone')}</div>
                      <div className="text-sm text-gray-500">Joined: {formatDate(guest.createdAt)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        guest.isActive !== false
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {guest.isActive !== false ? t('hotelAdmin.guests.filters.active') : t('hotelAdmin.guests.filters.inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openEditModal(guest)}
                          disabled={updating.has(guest._id)}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <HiPencil className="w-4 h-4 mr-1" />
                          Edit Room
                        </button>
                        <button
                          onClick={() => toggleGuestStatus(guest._id, guest.isActive !== false)}
                          disabled={updating.has(guest._id)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            guest.isActive !== false
                              ? 'bg-red-100 text-red-700 hover:bg-red-200'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updating.has(guest._id) ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          ) : guest.isActive !== false ? (
                            <HiXCircle className="w-4 h-4 mr-1" />
                          ) : (
                            <HiCheckCircle className="w-4 h-4 mr-1" />
                          )}
                          {guest.isActive !== false ? t('hotelAdmin.guests.actions.deactivate') : t('hotelAdmin.guests.actions.activate')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-4 p-4">
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12">
              <HiUserAdd className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">{t('hotelAdmin.guests.noGuests')}</h3>
              <p className="text-sm text-gray-500">{t('hotelAdmin.guests.noGuestsDescription')}</p>
            </div>
          ) : (
            filteredGuests.map((guest) => (
              <div key={guest._id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-modern-blue to-modern-lightBlue flex items-center justify-center text-white font-bold text-sm">
                      {getGuestInitials(guest)}
                    </div>
                    <div className="ml-3">
                      <div className="font-medium text-gray-900">{getGuestName(guest)}</div>
                      <div className="text-sm text-gray-500">{guest.email}</div>
                    </div>
                  </div>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    guest.isActive !== false
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {guest.isActive !== false ? t('hotelAdmin.guests.filters.active') : t('hotelAdmin.guests.filters.inactive')}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <span className="text-gray-500">{t('hotelAdmin.guests.table.phone')}:</span>
                    <div className="font-medium">{guest.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">{t('hotelAdmin.guests.table.joined')}:</span>
                    <div className="font-medium">{formatDate(guest.createdAt)}</div>
                  </div>
                  {guest.roomNumber && (
                    <div>
                      <span className="text-gray-500">{t('hotelAdmin.guests.table.room')}:</span>
                      <div className="font-medium">#{guest.roomNumber}</div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => toggleGuestStatus(guest._id, guest.isActive !== false)}
                  disabled={updating.has(guest._id)}
                  className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    guest.isActive !== false
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {updating.has(guest._id) ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : guest.isActive !== false ? (
                    <HiXCircle className="w-5 h-5 mr-2" />
                  ) : (
                    <HiCheckCircle className="w-5 h-5 mr-2" />
                  )}
                  {guest.isActive !== false ? t('hotelAdmin.guests.actions.deactivateGuest') : t('hotelAdmin.guests.actions.activateGuest')}
                </button>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {filteredGuests.length > 0 && (
          <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
            {/* Mobile Pagination */}
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                disabled={pagination.page <= 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('hotelAdmin.guests.pagination.previous')}
              </button>
              <span className="text-sm text-gray-700 flex items-center">
                {t('hotelAdmin.guests.pagination.pageOf', { page: pagination.page, totalPages: pagination.totalPages })}
              </span>
              <button
                onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                disabled={pagination.page >= pagination.totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {t('hotelAdmin.guests.pagination.next')}
              </button>
            </div>

            {/* Desktop Pagination */}
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  <Trans
                    i18nKey="hotelAdmin.guests.pagination.showing"
                    values={{
                      from: Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total),
                      to: Math.min(pagination.page * pagination.limit, pagination.total),
                      total: pagination.total
                    }}
                    components={{
                      1: <span className="font-medium" />,
                      2: <span className="font-medium" />,
                      3: <span className="font-medium" />
                    }}
                  />
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.max(1, prev.page - 1) }))}
                    disabled={pagination.page <= 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">{t('hotelAdmin.guests.pagination.previous')}</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>

                  {/* Page Numbers */}
                  {[...Array(Math.min(5, pagination.totalPages))].map((_, index) => {
                    let pageNumber;
                    if (pagination.totalPages <= 5) {
                      pageNumber = index + 1;
                    } else if (pagination.page <= 3) {
                      pageNumber = index + 1;
                    } else if (pagination.page >= pagination.totalPages - 2) {
                      pageNumber = pagination.totalPages - 4 + index;
                    } else {
                      pageNumber = pagination.page - 2 + index;
                    }

                    return (
                      <button
                        key={pageNumber}
                        onClick={() => setPagination(prev => ({ ...prev, page: pageNumber }))}
                        className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                          pagination.page === pageNumber
                            ? 'z-10 bg-modern-blue border-modern-blue text-white'
                            : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}

                  <button
                    onClick={() => setPagination(prev => ({ ...prev, page: Math.min(prev.totalPages, prev.page + 1) }))}
                    disabled={pagination.page >= pagination.totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="sr-only">{t('hotelAdmin.guests.pagination.next')}</span>
                    <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Guest Modal */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Edit Guest Information
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Guest Name
                  </label>
                  <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded border">
                    {getGuestName(editModal.guest)}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Room Number
                  </label>
                  <input
                    type="text"
                    value={editModal.roomNumber}
                    onChange={(e) => setEditModal(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter room number"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={editModal.checkInDate}
                    onChange={(e) => setEditModal(prev => ({ ...prev, checkInDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={editModal.checkOutDate}
                    onChange={(e) => setEditModal(prev => ({ ...prev, checkOutDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeEditModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={updateGuestInfo}
                  disabled={updating.has(editModal.guest?._id)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating.has(editModal.guest?._id) ? (
                    <div className="flex items-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Updating...
                    </div>
                  ) : (
                    'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GuestsPage;
