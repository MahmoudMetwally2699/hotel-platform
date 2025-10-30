/**
 * Loyalty Program Page - Main Dashboard
 * Hotel admin loyalty program management and analytics
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchLoyaltyAnalytics, fetchLoyaltyProgram, fetchMembers } from '../../redux/slices/loyaltySlice';
import LoyaltyProgramConfig from '../../components/hotel/loyalty/LoyaltyProgramConfig';
import {
  Users,
  Award,
  TrendingUp,
  Gift,
  DollarSign,
  Activity,
  Settings,
  BarChart3
} from 'lucide-react';

const LoyaltyProgramPage = () => {
  const dispatch = useDispatch();
  const { analytics, loyaltyProgram, loading, members } = useSelector((state) => state.loyalty);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [pointsAdjustment, setPointsAdjustment] = useState(0);
  const [adjustmentReason, setAdjustmentReason] = useState('');
  const [adjustmentType, setAdjustmentType] = useState('add'); // 'add' or 'deduct'

  // Search and filter states for members modal
  const [memberSearchTerm, setMemberSearchTerm] = useState('');
  const [memberTierFilter, setMemberTierFilter] = useState('');

  // Handler to open members modal and fetch all members
  const handleOpenMembersModal = () => {
    setShowMembersModal(true);
    dispatch(fetchMembers({ limit: 1000 })); // Fetch all members
  };

  // Helper function to get guest display name
  const getGuestDisplayName = (guest) => {
    if (!guest) return 'Guest';
    if (guest.name) return guest.name;
    if (guest.firstName || guest.lastName) {
      return `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
    }
    if (guest.email) return guest.email.split('@')[0];
    return 'Guest';
  };

  useEffect(() => {
    dispatch(fetchLoyaltyAnalytics());
    dispatch(fetchLoyaltyProgram());
  }, [dispatch]);

  // Handle points adjustment
  const handleAdjustPoints = async () => {
    if (!selectedMember || !pointsAdjustment || pointsAdjustment <= 0) {
      alert('Please enter a valid points amount');
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

      const response = await fetch(`${cleanApiUrl}/loyalty/hotel/members/${selectedMember._id}/adjust-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          points: finalPoints,
          reason: adjustmentReason,
          generatePDF: true
        })
      });

      // Check if response is PDF
      const contentType = response.headers.get('content-type');

      if (contentType && contentType.includes('application/pdf')) {
        // Handle PDF download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `points-adjustment-${getGuestDisplayName(selectedMember.guest).replace(/\s+/g, '-')}-${Date.now()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        alert(`Points ${adjustmentType === 'add' ? 'added' : 'deducted'} successfully! PDF report downloaded.`);
        setSelectedMember(null);
        setPointsAdjustment(0);
        setAdjustmentReason('');
        setAdjustmentType('add');
        // Refresh analytics
        dispatch(fetchLoyaltyAnalytics());
      } else {
        // Handle JSON response (error or success without PDF)
        const data = await response.json();

        if (data.success) {
          alert(`Points ${adjustmentType === 'add' ? 'added' : 'deducted'} successfully!`);
          setSelectedMember(null);
          setPointsAdjustment(0);
          setAdjustmentReason('');
          setAdjustmentType('add');
          // Refresh analytics
          dispatch(fetchLoyaltyAnalytics());
        } else {
          alert(data.message || 'Failed to adjust points');
        }
      }
    } catch (error) {
      console.error('Error adjusting points:', error);
      alert('Failed to adjust points. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Helper function to get tier color dynamically from configuration
  const getTierColor = (tierName) => {
    // Get tier configuration from the most recently updated channel program
    let programData;
    if (Array.isArray(loyaltyProgram)) {
      // Filter to only channel-based programs
      const channelPrograms = loyaltyProgram.filter(p =>
        p.channel && ['Travel Agency', 'Corporate', 'Direct'].includes(p.channel)
      );
      // Sort by updatedAt to get the most recent
      const sortedPrograms = channelPrograms.sort((a, b) =>
        new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
      );
      programData = sortedPrograms[0] || loyaltyProgram[0];
    } else {
      programData = loyaltyProgram;
    }

    if (!programData?.tierConfiguration) {
      // Fallback to default colors if program not loaded
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
    // Use member's channel to get the correct redemption ratio
    const programData = Array.isArray(loyaltyProgram)
      ? loyaltyProgram.find(p => p.channel === memberChannel) || loyaltyProgram.find(p => p.channel === 'Direct') || loyaltyProgram[0]
      : loyaltyProgram;

    if (!programData?.redemptionRules?.pointsToMoneyRatio) return 0;
    return points / programData.redemptionRules.pointsToMoneyRatio;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Configuration Modal */}
      <LoyaltyProgramConfig
        isOpen={showConfigModal}
        onClose={() => setShowConfigModal(false)}
        existingProgram={loyaltyProgram}
      />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loyalty Program Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your hotel's loyalty program and rewards</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure Program
          </button>
        </div>
      </div>

      {/* Program Status Alert */}
      {(() => {
        // Check if loyaltyProgram is an array (channel-based) or single object
        const hasActiveProgram = Array.isArray(loyaltyProgram)
          ? loyaltyProgram.some(program => program?.isActive)
          : loyaltyProgram?.isActive;

        const hasProgramConfigured = Array.isArray(loyaltyProgram)
          ? loyaltyProgram.length > 0
          : Boolean(loyaltyProgram);

        return !hasActiveProgram && hasProgramConfigured && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Activity className="h-5 w-5 text-yellow-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Your loyalty program is currently inactive. Activate it to start enrolling guests.
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {(() => {
        const hasProgramConfigured = Array.isArray(loyaltyProgram)
          ? loyaltyProgram.length > 0
          : Boolean(loyaltyProgram);

        return !hasProgramConfigured && !loading && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <Activity className="h-5 w-5 text-blue-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  No loyalty program configured yet. Click "Configure Program" to get started!
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Tier Benefits Section */}
      {(() => {
        // Get tier configuration from the most recently updated channel program
        let programData;
        if (Array.isArray(loyaltyProgram)) {
          // Filter to only channel-based programs
          const channelPrograms = loyaltyProgram.filter(p =>
            p.channel && ['Travel Agency', 'Corporate', 'Direct'].includes(p.channel)
          );
          // Sort by updatedAt to get the most recent
          const sortedPrograms = channelPrograms.sort((a, b) =>
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
          );
          programData = sortedPrograms[0] || loyaltyProgram[0];
        } else {
          programData = loyaltyProgram;
        }

        const hasTierConfig = programData?.tierConfiguration && programData.tierConfiguration.length > 0;

        return hasTierConfig && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Award className="h-6 w-6 text-blue-600" />
              Tier Benefits Overview
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...programData.tierConfiguration]
              .sort((a, b) => a.minPoints - b.minPoints)
              .map((tier) => (
                <div
                  key={tier.name}
                  className="border-2 rounded-lg p-5 hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1"
                  style={{ borderColor: getTierColor(tier.name) }}
                >
                  {/* Tier Header */}
                  <div className="text-center mb-4">
                    <div
                      className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3"
                      style={{ backgroundColor: `${getTierColor(tier.name)}20` }}
                    >
                      <Award
                        className="h-8 w-8"
                        style={{ color: getTierColor(tier.name) }}
                      />
                    </div>
                    <h3
                      className="text-xl font-bold mb-1"
                      style={{ color: getTierColor(tier.name) }}
                    >
                      {tier.name}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tier.minPoints} - {tier.maxPoints === 999999 ? '∞' : tier.maxPoints} points
                    </p>
                  </div>

                  {/* Benefits List */}
                  <div className="space-y-3">
                    {tier.benefits && tier.benefits.length > 0 ? (
                      tier.benefits.map((benefit, index) => (
                        <div key={index} className="flex items-start gap-2">
                          <div
                            className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${getTierColor(tier.name)}20` }}
                          >
                            <svg
                              className="w-3 h-3"
                              style={{ color: getTierColor(tier.name) }}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                clipRule="evenodd"
                              />
                            </svg>
                          </div>
                          <p className="text-sm text-gray-700 flex-1">{benefit}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 italic text-center py-2">
                        No benefits configured
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Members */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.overview?.totalMembers || 0}
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Points Issued */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Points Issued</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.overview?.totalPointsIssued?.toLocaleString() || 0}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <Award className="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Loyalty Revenue</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                ${analytics?.overview?.totalLifetimeSpending?.toFixed(2) || '0.00'}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <DollarSign className="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>

        {/* Program ROI */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Program ROI</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.roi?.roiPercentage?.toFixed(1) || 0}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Member Distribution by Tier */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Members by Tier
          </h2>
          <div className="space-y-4">
            {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier) => {
              const count = analytics?.membersByTier?.[tier] || 0;
              const percentage = analytics?.overview?.totalMembers
                ? ((count / analytics.overview.totalMembers) * 100).toFixed(1)
                : 0;

              return (
                <div key={tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: getTierColor(tier) }}>
                      {tier}
                    </span>
                    <span className="text-gray-600">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: getTierColor(tier)
                      }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Members */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Members
            </h2>
          </div>
          <div className="space-y-3">
            {analytics?.recentMembers?.slice(0, 5).map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-medium text-gray-900">{getGuestDisplayName(member.guest)}</p>
                  <p className="text-sm text-gray-600">{member.guest?.email}</p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 text-xs font-semibold rounded"
                    style={{
                      backgroundColor: `${getTierColor(member.currentTier)}20`,
                      color: getTierColor(member.currentTier)
                    }}
                  >
                    {member.currentTier}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {member.totalPoints} pts
                  </p>
                </div>
              </div>
            ))}
            {(!analytics?.recentMembers || analytics.recentMembers.length === 0) && (
              <p className="text-center text-gray-500 py-4">No members yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            Top Members by Spending
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Member
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tier
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Total Spending
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Points
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {analytics?.topMembers?.slice(0, 10).map((member, index) => (
                <tr key={member._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    #{index + 1}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {getGuestDisplayName(member.guest)}
                      </div>
                      <div className="text-sm text-gray-500">
                        {member.guest?.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 text-xs font-semibold rounded"
                      style={{
                        backgroundColor: `${getTierColor(member.currentTier)}20`,
                        color: getTierColor(member.currentTier)
                      }}
                    >
                      {member.currentTier}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${member.lifetimeSpending?.toFixed(2) || '0.00'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.totalPoints?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
              {(!analytics?.topMembers || analytics.topMembers.length === 0) && (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No members yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={handleOpenMembersModal}
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">View Members</p>
              <p className="text-sm text-gray-600">Manage all members</p>
            </div>
          </button>

          <button
            onClick={() => setShowRewardsModal(true)}
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition"
          >
            <Gift className="h-8 w-8 text-green-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Manage Rewards</p>
              <p className="text-sm text-gray-600">Create and edit rewards</p>
            </div>
          </button>

          <button
            onClick={() => dispatch(fetchLoyaltyAnalytics())}
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">Refresh Analytics</p>
              <p className="text-sm text-gray-600">Update program insights</p>
            </div>
          </button>
        </div>
      </div>

      {/* Members Modal */}
      {showMembersModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Loyalty Members</h2>
                <button
                  onClick={() => setShowMembersModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>

              {/* Search and Filter Section */}
              <div className="flex flex-col sm:flex-row gap-3 mt-4">
                {/* Search Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="Search by email or phone..."
                    value={memberSearchTerm}
                    onChange={(e) => setMemberSearchTerm(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>

                {/* Tier Filter */}
                <div className="sm:w-48">
                  <select
                    value={memberTierFilter}
                    onChange={(e) => setMemberTierFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  >
                    <option value="">All Tiers</option>
                    <option value="BRONZE">Bronze</option>
                    <option value="SILVER">Silver</option>
                    <option value="GOLD">Gold</option>
                    <option value="PLATINUM">Platinum</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Total Members: <span className="font-semibold">
                  {members?.data?.filter(member => {
                    const email = member.guest?.email?.toLowerCase() || '';
                    const phone = member.guest?.phone?.toString().toLowerCase() || '';
                    const searchLower = memberSearchTerm.toLowerCase();
                    const matchesSearch = !memberSearchTerm ||
                      email.includes(searchLower) ||
                      phone.includes(searchLower);
                    const matchesTier = !memberTierFilter || member.currentTier === memberTierFilter;
                    return matchesSearch && matchesTier;
                  }).length || 0}
                </span>
                {(memberSearchTerm || memberTierFilter) && (
                  <span className="text-sm text-gray-500 ml-2">
                    (filtered from {members?.data?.length || analytics?.overview?.totalMembers || 0} total)
                  </span>
                )}
              </p>

              {(() => {
                const allMembers = members?.data || analytics?.recentMembers || [];
                const filteredMembers = allMembers.filter(member => {
                  const email = member.guest?.email?.toLowerCase() || '';
                  const phone = member.guest?.phone?.toString().toLowerCase() || '';
                  const searchLower = memberSearchTerm.toLowerCase();
                  const matchesSearch = !memberSearchTerm ||
                    email.includes(searchLower) ||
                    phone.includes(searchLower);
                  const matchesTier = !memberTierFilter || member.currentTier === memberTierFilter;
                  return matchesSearch && matchesTier;
                });

                return filteredMembers && filteredMembers.length > 0 ? (
                  <div className="space-y-4">
                    {filteredMembers.map((member, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex justify-between items-start gap-4">
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{getGuestDisplayName(member.guest)}</p>
                            <p className="text-sm text-gray-600">{member.guest?.email || 'No email'}</p>
                            {member.guest?.phone && (
                              <p className="text-sm text-gray-600">{member.guest.phone}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              Joined: {new Date(member.joinDate).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              Nights stayed: {member.totalNightsStayed || 0}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className="inline-block px-3 py-1 rounded-full text-sm font-medium"
                              style={{
                                backgroundColor: getTierColor(member.currentTier) + '20',
                                color: getTierColor(member.currentTier)
                              }}
                            >
                              {member.currentTier}
                            </span>
                            <p className="text-sm text-gray-600 mt-1">{member.totalPoints || 0} points</p>
                            <p className="text-xs font-semibold text-green-600 mt-1">
                              ${calculateRedemptionValue(member.availablePoints || 0, member.guest?.channel).toFixed(2)} redeemable
                            </p>
                            <p className="text-xs text-gray-500">Spent: ${member.lifetimeSpending?.toFixed(2) || '0.00'}</p>
                            <button
                              onClick={() => {
                                setSelectedMember(member);
                                setPointsAdjustment(0);
                                setAdjustmentReason('');
                                setAdjustmentType('add');
                              }}
                              className="mt-2 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition"
                            >
                              Manage Points
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {memberSearchTerm || memberTierFilter ? 'No members match your filters' : 'No members yet'}
                    </p>
                    <p className="text-sm text-gray-400 mt-2">
                      {memberSearchTerm || memberTierFilter
                        ? 'Try adjusting your search or filter criteria'
                        : 'Members will appear here when guests are enrolled in the loyalty program'
                      }
                    </p>
                  </div>
                );
              })()}
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowMembersModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Manage Rewards</h2>
                <button
                  onClick={() => setShowRewardsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="text-center py-12">
                <Gift className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">Rewards feature coming soon</p>
                <p className="text-sm text-gray-400">
                  Create redeemable rewards for your loyalty members
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRewardsModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Points Adjustment Modal */}
      {selectedMember && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
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
            <div className="p-6">
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
                    {selectedMember.currentTier}
                  </span>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {selectedMember.totalPoints || 0} points
                    </p>
                    <p className="text-sm font-semibold text-green-600">
                      ${calculateRedemptionValue(selectedMember.availablePoints || 0, selectedMember.guest?.channel).toFixed(2)} redeemable
                    </p>
                  </div>
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

              {/* Points Amount */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Amount
                </label>
                <input
                  type="number"
                  min="0"
                  value={pointsAdjustment}
                  onChange={(e) => setPointsAdjustment(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter points amount"
                />
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
              {pointsAdjustment > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-2">
                    New balance will be:{' '}
                    <span className="font-bold">
                      {adjustmentType === 'add'
                        ? (selectedMember.totalPoints || 0) + pointsAdjustment
                        : Math.max(0, (selectedMember.totalPoints || 0) - pointsAdjustment)}{' '}
                      points
                    </span>
                  </p>
                  <p className="text-xs text-blue-700">
                    Redemption value:{' '}
                    <span className="font-semibold">
                      ${calculateRedemptionValue(
                        adjustmentType === 'add'
                          ? (selectedMember.availablePoints || 0) + pointsAdjustment
                          : Math.max(0, (selectedMember.availablePoints || 0) - pointsAdjustment)
                      ).toFixed(2)}
                    </span>
                  </p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-gray-200 bg-gray-50 flex gap-3">
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

export default LoyaltyProgramPage;
