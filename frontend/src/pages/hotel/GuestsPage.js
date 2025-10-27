import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation, Trans } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUsers, selectAllUsers, selectUserLoading } from '../../redux/slices/userSlice';
import { HiSearch, HiFilter, HiUserAdd, HiCheckCircle, HiXCircle, HiPencil, HiStar, HiBan } from 'react-icons/hi';
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
  const [loyaltyUpdating, setLoyaltyUpdating] = useState(new Set());

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

      const guestsData = response.data.guests || [];
      console.log('Fetched guests:', guestsData);
      console.log('Guest with history example:', guestsData.find(g => g.stayHistory && g.stayHistory.length > 0));

      setGuests(guestsData);
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
    // If activating an inactive guest, open modal to enter new dates
    if (currentStatus === false) {
      const guest = guests.find(g => g._id === guestId);
      if (guest) {
        openEditModal(guest);
      }
      return;
    }

    // If deactivating, proceed with confirmation
    if (!window.confirm('Are you sure you want to deactivate this guest? Their stay will be saved to history.')) {
      return;
    }

    setUpdating(prev => new Set(prev).add(guestId));

    try {
      await hotelService.updateGuestStatus(guestId, !currentStatus);

      // Refresh guests to get updated data including history
      await fetchGuests();

      alert('Guest deactivated successfully. Stay saved to history.');
    } catch (error) {
      console.error('Error updating guest status:', error);
      alert(error.response?.data?.message || 'Failed to update guest status');
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

      // If guest is inactive, also activate them
      if (editModal.guest.isActive === false) {
        updateData.isActive = true;
      }

      await hotelService.updateGuestInfo(editModal.guest._id, updateData);

      // Refresh guests to get updated data
      await fetchGuests();

      closeEditModal();

      if (editModal.guest.isActive === false) {
        alert('Guest activated successfully with new stay information!');
      } else {
        alert('Guest information updated successfully!');
      }
    } catch (error) {
      console.error('Error updating guest information:', error);
      alert(error.response?.data?.message || 'Failed to update guest information');
    } finally {
      setUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(editModal.guest._id);
        return newSet;
      });
    }
  };

  // Toggle guest loyalty program membership
  const toggleLoyaltyMembership = async (guestId, isEnrolled) => {
    setLoyaltyUpdating(prev => new Set(prev).add(guestId));

    try {
      let response;
      if (isEnrolled) {
        // Deactivate loyalty membership
        response = await hotelService.deactivateGuestLoyalty(guestId);
      } else {
        // Activate loyalty membership
        response = await hotelService.activateGuestLoyalty(guestId);
      }

      // Update local state to reflect loyalty status change
      setGuests(prev => prev.map(guest => {
        if (guest._id === guestId) {
          // If activating, set loyalty tier to BRONZE, otherwise clear it
          return {
            ...guest,
            loyaltyTier: isEnrolled ? null : 'BRONZE',
            loyaltyPoints: isEnrolled ? 0 : guest.loyaltyPoints,
            availableLoyaltyPoints: isEnrolled ? 0 : guest.availableLoyaltyPoints,
            isLoyaltyActive: !isEnrolled
          };
        }
        return guest;
      }));

      // Refresh guests to get updated data from server
      await fetchGuests();

      // Show success message (implement toast if available)
      console.log(response.message);
    } catch (error) {
      console.error('Error toggling loyalty membership:', error);
      // Show error message
      alert(error.response?.data?.message || 'Failed to update loyalty membership');
    } finally {
      setLoyaltyUpdating(prev => {
        const newSet = new Set(prev);
        newSet.delete(guestId);
        return newSet;
      });
    }
  };

  // View stay history modal
  const [historyModal, setHistoryModal] = useState({
    isOpen: false,
    guest: null,
    stayHistory: []
  });

  // Handle view history
  const handleViewHistory = (guest) => {
    setHistoryModal({
      isOpen: true,
      guest: guest,
      stayHistory: guest.stayHistory || []
    });
  };

  // Close history modal
  const closeHistoryModal = () => {
    setHistoryModal({
      isOpen: false,
      guest: null,
      stayHistory: []
    });
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

  // Get tier color and style
  const getTierBadgeColor = (tier) => {
    if (!tier) return 'bg-gray-100 text-gray-600';
    const colors = {
      BRONZE: 'bg-orange-100 text-orange-700 border-orange-200',
      SILVER: 'bg-gray-200 text-gray-700 border-gray-300',
      GOLD: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      PLATINUM: 'bg-purple-100 text-purple-700 border-purple-200'
    };
    return colors[tier.toUpperCase()] || 'bg-gray-100 text-gray-600';
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
                  Loyalty Tier
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
                  <td colSpan="6" className="px-6 py-12 text-center">
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
                      {guest.loyaltyTier ? (
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getTierBadgeColor(guest.loyaltyTier)}`}>
                          {guest.loyaltyTier.toUpperCase()}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-200">
                          Not Enrolled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">
                            {guest.isActive === false ? '---' : (guest.roomNumber ? `Room ${guest.roomNumber}` : 'No room assigned')}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500">
                          <div>Check-in: {guest.isActive === false ? '---' : formatDate(guest.checkInDate)}</div>
                          <div>Check-out: {guest.isActive === false ? '---' : formatDate(guest.checkOutDate)}</div>
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
                      <div className="flex flex-wrap gap-2">
                        {/* Edit Room Button - Only for active guests */}
                        {guest.isActive !== false && (
                          <button
                            onClick={() => openEditModal(guest)}
                            disabled={updating.has(guest._id)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <HiPencil className="w-4 h-4 mr-1" />
                            Edit Room
                          </button>
                        )}

                        {/* View History Button - For guests with stay history */}
                        {guest.stayHistory && guest.stayHistory.length > 0 && (
                          <button
                            onClick={() => handleViewHistory(guest)}
                            className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 hover:bg-indigo-200 transition-colors"
                            title="View stay history"
                          >
                            <HiCheckCircle className="w-4 h-4 mr-1" />
                            View History
                          </button>
                        )}

                        {/* Loyalty Program Toggle Button */}
                        <button
                          onClick={() => toggleLoyaltyMembership(guest._id, guest.loyaltyTier !== null && guest.loyaltyTier !== undefined)}
                          disabled={loyaltyUpdating.has(guest._id)}
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            guest.loyaltyTier
                              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                              : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                          title={guest.loyaltyTier ? 'Remove from Loyalty Program' : 'Add to Loyalty Program'}
                        >
                          {loyaltyUpdating.has(guest._id) ? (
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-1" />
                          ) : guest.loyaltyTier ? (
                            <HiBan className="w-4 h-4 mr-1" />
                          ) : (
                            <HiStar className="w-4 h-4 mr-1" />
                          )}
                          {guest.loyaltyTier ? 'Remove Loyalty' : 'Add Loyalty'}
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
                  {guest.loyaltyTier && (
                    <div>
                      <span className="text-gray-500">Loyalty Tier:</span>
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getTierBadgeColor(guest.loyaltyTier)}`}>
                          {guest.loyaltyTier.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  )}
                  {guest.roomNumber && (
                    <div>
                      <span className="text-gray-500">{t('hotelAdmin.guests.table.room')}:</span>
                      <div className="font-medium">#{guest.roomNumber}</div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 mt-4">
                  {/* Loyalty Program Button */}
                  <button
                    onClick={() => toggleLoyaltyMembership(guest._id, guest.loyaltyTier !== null && guest.loyaltyTier !== undefined)}
                    disabled={loyaltyUpdating.has(guest._id)}
                    className={`w-full inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      guest.loyaltyTier
                        ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                        : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {loyaltyUpdating.has(guest._id) ? (
                      <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    ) : guest.loyaltyTier ? (
                      <HiBan className="w-5 h-5 mr-2" />
                    ) : (
                      <HiStar className="w-5 h-5 mr-2" />
                    )}
                    {guest.loyaltyTier ? 'Remove from Loyalty Program' : 'Add to Loyalty Program'}
                  </button>

                  {/* Guest Status Button */}
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
                {editModal.guest?.isActive === false ? 'Activate Guest - Enter New Stay Information' : 'Edit Guest Information'}
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
                      {editModal.guest?.isActive === false ? 'Activating...' : 'Updating...'}
                    </div>
                  ) : (
                    editModal.guest?.isActive === false ? 'Activate Guest' : 'Update'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stay History Modal */}
      {historyModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900">
                Stay History - {getGuestName(historyModal.guest)}
              </h3>
              <button
                onClick={closeHistoryModal}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {historyModal.stayHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No stay history available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {historyModal.stayHistory.map((stay, index) => (
                    <div
                      key={index}
                      className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-in</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(stay.checkInDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Check-out</p>
                          <p className="font-medium text-gray-900">
                            {formatDate(stay.checkOutDate)}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Room</p>
                          <p className="font-medium text-gray-900">
                            {stay.roomNumber || 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1">Nights</p>
                          <p className="font-medium text-gray-900">
                            {stay.numberOfNights || 0}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={closeHistoryModal}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
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

export default GuestsPage;
