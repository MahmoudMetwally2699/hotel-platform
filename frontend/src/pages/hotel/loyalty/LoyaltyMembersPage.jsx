/**
 * Loyalty Members Page - Full page with pagination
 * Displays all loyalty members with search, filter, and pagination
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchMembers, fetchLoyaltyProgram, fetchLoyaltyAnalytics } from '../../../redux/slices/loyaltySlice';
import { selectHotelCurrency } from '../../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../../utils/currency';
import {
  Users,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Mail,
  Phone,
  Bed
} from 'lucide-react';

const LoyaltyMembersPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { members, membersPagination, loyaltyProgram, loading } = useSelector((state) => state.loyalty);
  const reduxCurrency = useSelector(selectHotelCurrency);
  const currency = members?.currency || reduxCurrency;

  // State for filters and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [tierFilter, setTierFilter] = useState('');
  const [channelFilter, setChannelFilter] = useState('');
  const [sortBy, setSortBy] = useState('totalPoints');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedMember, setSelectedMember] = useState(null);
  const [pointsAdjustment, setPointsAdjustment] = useState(0);
  const [cashAdjustment, setCashAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add');
  const [adjustmentMode, setAdjustmentMode] = useState('all');

  const itemsPerPage = 20;

  // Fetch data on mount and when filters change
  useEffect(() => {
    dispatch(fetchLoyaltyProgram());
  }, [dispatch]);

  useEffect(() => {
    const filters = {
      page: currentPage,
      limit: itemsPerPage,
      search: searchTerm,
      tier: tierFilter,
      channel: channelFilter,
      sortBy,
      sortOrder
    };
    dispatch(fetchMembers(filters));
  }, [dispatch, currentPage, searchTerm, tierFilter, channelFilter, sortBy, sortOrder]);

  // Helper function to get guest display name
  const getGuestDisplayName = (guest) => {
    if (!guest) return t('loyaltyProgramPage.guestDisplay.unknownGuest') || 'Unknown Guest';
    if (guest.name) return guest.name;
    if (guest.firstName || guest.lastName) {
      return `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
    }
    if (guest.email) return guest.email.split('@')[0];
    return t('loyaltyProgramPage.guestDisplay.unknownGuest') || 'Unknown Guest';
  };

  // Helper function to translate tier names
  const getTierName = (tierName) => {
    const tierKey = tierName?.toUpperCase();
    return t(`loyaltyProgramPage.tierNames.${tierKey}`, { defaultValue: tierName });
  };

  // Helper function to get tier color from configuration
  const getTierColor = (tierName) => {
    let programData;
    if (Array.isArray(loyaltyProgram)) {
      const channelPrograms = loyaltyProgram.filter(p =>
        p.channel && ['Travel Agency', 'Corporate', 'Direct'].includes(p.channel)
      );
      const sortedPrograms = channelPrograms.sort((a, b) =>
        new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      programData = sortedPrograms[0] || loyaltyProgram[0];
    } else {
      programData = loyaltyProgram;
    }

    if (!programData?.tierConfiguration) {
      const defaultColors = {
        BRONZE: '#CD7F32',
        SILVER: '#C0C0C0',
        GOLD: '#FFD700',
        PLATINUM: '#E5E4E2'
      };
      return defaultColors[tierName] || '#718096';
    }

    const tierConfig = programData.tierConfiguration.find(t => t.name === tierName);
    return tierConfig?.color || '#718096';
  };

  // Helper function to calculate redemption value
  const calculateRedemptionValue = (points, memberChannel = 'Direct') => {
    const programData = Array.isArray(loyaltyProgram)
      ? loyaltyProgram.find(p => p.channel === memberChannel) || loyaltyProgram.find(p => p.channel === 'Direct') || loyaltyProgram[0]
      : loyaltyProgram;

    if (!programData?.redemptionRules?.pointsToMoneyRatio) return 0;
    return points / programData.redemptionRules.pointsToMoneyRatio;
  };

  // Handle search with debounce
  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page on search
  };

  // Handle filter changes
  const handleTierFilterChange = (value) => {
    setTierFilter(value);
    setCurrentPage(1);
  };

  const handleChannelFilterChange = (value) => {
    setChannelFilter(value);
    setCurrentPage(1);
  };

  // Handle sort changes
  const handleSortChange = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Handle pagination
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= (membersPagination?.pages || 1)) {
      setCurrentPage(newPage);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle points adjustment
  const handleAdjustPoints = async () => {
    if (!selectedMember || !pointsAdjustment || pointsAdjustment <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!adjustmentReason.trim()) {
      alert('Please provide a reason for the adjustment');
      return;
    }

    try {
      const finalPoints = adjustmentType === 'add' ? pointsAdjustment : -pointsAdjustment;

      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const cleanApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

      const endpoint = adjustmentMode === 'redeemable'
        ? `${cleanApiUrl}/loyalty/hotel/members/${selectedMember._id}/adjust-redeemable-points`
        : `${cleanApiUrl}/loyalty/hotel/members/${selectedMember._id}/adjust-points`;

      const requestBody = adjustmentMode === 'redeemable'
        ? {
            points: finalPoints,
            reason: adjustmentReason
          }
        : {
            points: finalPoints,
            reason: adjustmentReason,
            generatePDF: true
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(requestBody)
      });

      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/pdf')) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `points-adjustment-${getGuestDisplayName(selectedMember.guest).replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(`Points ${adjustmentType === 'add' ? 'added' : 'deducted'} successfully! PDF receipt downloaded.`);
        setSelectedMember(null);
        setPointsAdjustment(0);
        setCashAdjustment(0);
        setAdjustmentReason('');
        setAdjustmentType('add');
        setAdjustmentMode('all');

        // Refresh the members list
        dispatch(fetchMembers({
          page: currentPage,
          limit: itemsPerPage,
          search: searchTerm,
          tier: tierFilter,
          channel: channelFilter,
          sortBy,
          sortOrder
        }));
        dispatch(fetchLoyaltyAnalytics());
      } else {
        const data = await response.json();

        if (data.success) {
          alert(`Points ${adjustmentType === 'add' ? 'added' : 'deducted'} successfully!`);
          setSelectedMember(null);
          setPointsAdjustment(0);
          setCashAdjustment(0);
          setAdjustmentReason('');
          setAdjustmentType('add');
          setAdjustmentMode('all');

          // Refresh the members list
          dispatch(fetchMembers({
            page: currentPage,
            limit: itemsPerPage,
            search: searchTerm,
            tier: tierFilter,
            channel: channelFilter,
            sortBy,
            sortOrder
          }));
          dispatch(fetchLoyaltyAnalytics());
        } else {
          alert(data.message || 'Failed to adjust points');
        }
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Failed to adjust points');
    }
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
    const pages = [];
    const totalPages = membersPagination?.pages || 1;
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }

    return pages;
  };

  if (loading && !members) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/hotel/loyalty-program')}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
            title="Back to Loyalty Dashboard"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loyalty Members</h1>
            <p className="text-gray-600 mt-1">
              Manage all {membersPagination?.total || 0} loyalty program members
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-5 w-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">Filters & Search</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Tier Filter */}
          <select
            value={tierFilter}
            onChange={(e) => handleTierFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Tiers</option>
            <option value="BRONZE">Bronze</option>
            <option value="SILVER">Silver</option>
            <option value="GOLD">Gold</option>
            <option value="PLATINUM">Platinum</option>
          </select>

          {/* Channel Filter */}
          <select
            value={channelFilter}
            onChange={(e) => handleChannelFilterChange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Channels</option>
            <option value="Direct">Direct</option>
            <option value="Travel Agency">Travel Agency</option>
            <option value="Corporate">Corporate</option>
          </select>

          {/* Sort By */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field);
              setSortOrder(order);
              setCurrentPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="totalPoints-desc">Points: High to Low</option>
            <option value="totalPoints-asc">Points: Low to High</option>
            <option value="lifetimeSpending-desc">Spending: High to Low</option>
            <option value="lifetimeSpending-asc">Spending: Low to High</option>
            <option value="joinDate-desc">Join Date: Newest First</option>
            <option value="joinDate-asc">Join Date: Oldest First</option>
          </select>
        </div>

        {/* Active Filters Display */}
        {(searchTerm || tierFilter || channelFilter) && (
          <div className="mt-4 flex items-center gap-2 flex-wrap">
            <span className="text-sm text-gray-600">Active filters:</span>
            {searchTerm && (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm flex items-center gap-2">
                Search: "{searchTerm}"
                <button onClick={() => handleSearchChange('')} className="hover:text-blue-900">×</button>
              </span>
            )}
            {tierFilter && (
              <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm flex items-center gap-2">
                Tier: {tierFilter}
                <button onClick={() => handleTierFilterChange('')} className="hover:text-purple-900">×</button>
              </span>
            )}
            {channelFilter && (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm flex items-center gap-2">
                Channel: {channelFilter}
                <button onClick={() => handleChannelFilterChange('')} className="hover:text-green-900">×</button>
              </span>
            )}
            <button
              onClick={() => {
                handleSearchChange('');
                handleTierFilterChange('');
                handleChannelFilterChange('');
              }}
              className="text-sm text-red-600 hover:text-red-700 font-medium"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Members Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center p-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : members && members.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Member
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tier
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Channel
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('totalPoints')}
                  >
                    <div className="flex items-center gap-1">
                      Tier Points
                      {sortBy === 'totalPoints' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cash Value
                  </th>
                  <th
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700"
                    onClick={() => handleSortChange('lifetimeSpending')}
                  >
                    <div className="flex items-center gap-1">
                      Lifetime Spending
                      {sortBy === 'lifetimeSpending' && (
                        <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Nights Stayed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {members.map((member) => (
                  <tr key={member._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold text-sm">
                            {getGuestDisplayName(member.guest).charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {getGuestDisplayName(member.guest)}
                          </div>
                          <div className="text-sm text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {member.guest?.email || 'No email'}
                          </div>
                          {member.guest?.phone && (
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {member.guest.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="px-3 py-1 text-xs font-semibold rounded-full"
                        style={{
                          backgroundColor: `${getTierColor(member.currentTier)}20`,
                          color: getTierColor(member.currentTier)
                        }}
                      >
                        {getTierName(member.currentTier)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {member.guest?.channel || 'Direct'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 font-semibold">
                      {(member.tierPoints || member.totalPoints || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-green-600">
                      {formatPriceByLanguage(
                        calculateRedemptionValue(member.availablePoints || 0, member.guest?.channel),
                        i18n.language,
                        currency
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatPriceByLanguage(member.lifetimeSpending || 0, i18n.language, currency)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      <div className="flex items-center gap-1">
                        <Bed className="h-4 w-4 text-gray-400" />
                        {member.totalNightsStayed || 0}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => {
                          setSelectedMember(member);
                          setPointsAdjustment(0);
                          setCashAdjustment(0);
                          setAdjustmentReason('');
                          setAdjustmentType('add');
                          setAdjustmentMode('all');
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                      >
                        Manage Points
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-12">
              <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No members found</p>
              <p className="text-sm text-gray-400 mt-2">
                {searchTerm || tierFilter || channelFilter
                  ? 'Try adjusting your filters'
                  : 'Members will appear here when guests enroll in the loyalty program'}
              </p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {membersPagination && membersPagination.pages > 1 && (
          <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                {Math.min(currentPage * itemsPerPage, membersPagination.total)} of{' '}
                {membersPagination.total} members
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && handlePageChange(page)}
                      disabled={page === '...'}
                      className={`px-3 py-1 rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : page === '...'
                          ? 'text-gray-400 cursor-default'
                          : 'text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === membersPagination.pages}
                  className={`p-2 rounded-lg ${
                    currentPage === membersPagination.pages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Points Adjustment Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 flex-shrink-0">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Adjust Points</h2>
                <button
                  onClick={() => setSelectedMember(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {/* Member Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="font-semibold text-gray-900">{getGuestDisplayName(selectedMember.guest)}</p>
                <p className="text-sm text-gray-600">{selectedMember.guest?.email}</p>
                <div className="flex items-center justify-between mt-2">
                  <span
                    className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                    style={{
                      backgroundColor: getTierColor(selectedMember.currentTier) + '20',
                      color: getTierColor(selectedMember.currentTier)
                    }}
                  >
                    {getTierName(selectedMember.currentTier)}
                  </span>
                  <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Tier Points</p>
                    <p className="text-lg font-bold text-gray-900">
                      {selectedMember.tierPoints || selectedMember.totalPoints || 0}
                    </p>
                    <p className="text-xs text-gray-500 uppercase tracking-wide mt-3 mb-1">Cash Value</p>
                    <p className="text-xl font-bold text-green-600">
                      {formatPriceByLanguage(calculateRedemptionValue(selectedMember.availablePoints || 0, selectedMember.guest?.channel), i18n.language, currency)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Adjustment Mode Selector */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What to Adjust
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setAdjustmentMode('all');
                      setPointsAdjustment(0);
                      setCashAdjustment(0);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition text-left ${
                      adjustmentMode === 'all'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-300 text-gray-700 hover:border-blue-300'
                    }`}
                  >
                    <div className="font-semibold">All Points</div>
                    <div className="text-xs mt-1">Affects tier & cash value</div>
                  </button>
                  <button
                    onClick={() => {
                      setAdjustmentMode('redeemable');
                      setPointsAdjustment(0);
                      setCashAdjustment(0);
                    }}
                    className={`px-4 py-3 rounded-lg border-2 transition text-left ${
                      adjustmentMode === 'redeemable'
                        ? 'border-purple-500 bg-purple-50 text-purple-700'
                        : 'border-gray-300 text-gray-700 hover:border-purple-300'
                    }`}
                  >
                    <div className="font-semibold">Redeemable Only</div>
                    <div className="text-xs mt-1">Cash value only</div>
                  </button>
                </div>
              </div>

              {/* Adjustment Type */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adjustment Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAdjustmentType('add')}
                    className={`px-4 py-2 rounded-lg border-2 transition ${
                      adjustmentType === 'add'
                        ? 'border-green-500 bg-green-50 text-green-700'
                        : 'border-gray-300 text-gray-700 hover:border-green-300'
                    }`}
                  >
                    Add Points
                  </button>
                  <button
                    onClick={() => setAdjustmentType('deduct')}
                    className={`px-4 py-2 rounded-lg border-2 transition ${
                      adjustmentType === 'deduct'
                        ? 'border-red-500 bg-red-50 text-red-700'
                        : 'border-gray-300 text-gray-700 hover:border-red-300'
                    }`}
                  >
                    Deduct Points
                  </button>
                </div>
              </div>

              {/* Amount Input */}
              <div className="mb-4">
                {adjustmentMode === 'all' ? (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Points Amount
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={pointsAdjustment}
                      onChange={(e) => {
                        const points = parseInt(e.target.value) || 0;
                        setPointsAdjustment(points);
                        // Calculate cash value using standard ratio
                        const ratio = 100;
                        setCashAdjustment(points / ratio);
                      }}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter points amount"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Equivalent to {formatPriceByLanguage(cashAdjustment, i18n.language, currency)} cash value
                    </p>
                  </>
                ) : (
                  <>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cash Value Amount
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
                        $
                      </span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={cashAdjustment}
                        onChange={(e) => {
                          const cash = parseFloat(e.target.value) || 0;
                          setCashAdjustment(cash);
                          const ratio = 100;
                          setPointsAdjustment(Math.round(cash * ratio));
                        }}
                        className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="0.00"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Equivalent to {pointsAdjustment} points
                    </p>
                  </>
                )}
              </div>

              {/* Reason */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reason for Adjustment
                </label>
                <textarea
                  value={adjustmentReason}
                  onChange={(e) => setAdjustmentReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter reason (required)"
                  rows="3"
                />
              </div>

              {/* Preview */}
              {(adjustmentMode === 'all' ? pointsAdjustment > 0 : cashAdjustment > 0) && (
                <div className={`border-2 rounded-lg p-4 mb-4 ${
                  adjustmentMode === 'redeemable'
                    ? 'bg-purple-50 border-purple-200'
                    : 'bg-blue-50 border-blue-200'
                }`}>
                  {adjustmentMode === 'all' ? (
                    <>
                      <p className="text-sm text-blue-800 mb-2">
                        <span className="font-semibold">Tier Points:</span>{' '}
                        {(selectedMember.tierPoints || selectedMember.totalPoints || 0)} → {' '}
                        <span className="font-bold">
                          {adjustmentType === 'add'
                            ? (selectedMember.tierPoints || selectedMember.totalPoints || 0) + pointsAdjustment
                            : Math.max(0, (selectedMember.tierPoints || selectedMember.totalPoints || 0) - pointsAdjustment)}
                        </span>
                      </p>
                      <p className="text-sm text-blue-800">
                        <span className="font-semibold">Cash Value:</span>{' '}
                        {formatPriceByLanguage(calculateRedemptionValue(selectedMember.availablePoints || 0, selectedMember.guest?.channel), i18n.language, currency)} → {' '}
                        <span className="font-bold">
                          {formatPriceByLanguage(
                            calculateRedemptionValue(
                              adjustmentType === 'add'
                                ? (selectedMember.availablePoints || 0) + pointsAdjustment
                                : Math.max(0, (selectedMember.availablePoints || 0) - pointsAdjustment),
                              selectedMember.guest?.channel
                            ),
                            i18n.language,
                            currency
                          )}
                        </span>
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-purple-800 mb-2">
                        <span className="font-semibold">Tier Points:</span>{' '}
                        <span className="font-bold">{selectedMember.tierPoints || selectedMember.totalPoints || 0}</span>
                        {' '}<span className="text-xs">(unchanged 🔒)</span>
                      </p>
                      <p className="text-sm text-purple-800">
                        <span className="font-semibold">Cash Value:</span>{' '}
                        {formatPriceByLanguage(calculateRedemptionValue(selectedMember.availablePoints || 0, selectedMember.guest?.channel), i18n.language, currency)} → {' '}
                        <span className="font-bold">
                          {formatPriceByLanguage(
                            adjustmentType === 'add'
                              ? calculateRedemptionValue(selectedMember.availablePoints || 0, selectedMember.guest?.channel) + cashAdjustment
                              : Math.max(0, calculateRedemptionValue(selectedMember.availablePoints || 0, selectedMember.guest?.channel) - cashAdjustment),
                            i18n.language,
                            currency
                          )}
                        </span>
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3 flex-shrink-0">
              <button
                onClick={() => setSelectedMember(null)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustPoints}
                className={`flex-1 px-4 py-2 text-white rounded-lg transition ${
                  adjustmentType === 'add'
                    ? 'bg-green-600 hover:bg-green-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {adjustmentType === 'add' ? 'Add' : 'Deduct'} Points
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyMembersPage;
