/**
 * Loyalty Program Page - Main Dashboard
 * Hotel admin loyalty program management and analytics
 */

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { fetchLoyaltyAnalytics, fetchLoyaltyProgram } from '../../redux/slices/loyaltySlice';
import { selectHotelCurrency } from '../../redux/slices/hotelSlice';
import { formatPriceByLanguage } from '../../utils/currency';
import LoyaltyProgramConfig from '../../components/hotel/loyalty/LoyaltyProgramConfig';
import { useTheme } from '../../context/ThemeContext';
import {
  Users,
  Award,
  TrendingUp,
  Gift,
  DollarSign,
  Activity,
  Settings,
  BarChart3,
  Info
} from 'lucide-react';

const LoyaltyProgramPage = () => {
  const { t, i18n } = useTranslation();
  const dispatch = useDispatch();
  const { theme } = useTheme();
  const { analytics, loyaltyProgram, loading } = useSelector((state) => state.loyalty);
  const reduxCurrency = useSelector(selectHotelCurrency);
  // Prioritize currency from API response (analytics or members), fallback to Redux
  const currency = analytics?.currency || reduxCurrency;
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  // Helper function to get guest display name
  const getGuestDisplayName = (guest) => {
    if (!guest) return t('loyaltyProgramPage.guestDisplay.unknownGuest');
    if (guest.name) return guest.name;
    if (guest.firstName || guest.lastName) {
      return `${guest.firstName || ''} ${guest.lastName || ''}`.trim();
    }
    if (guest.email) return guest.email.split('@')[0];
    return t('loyaltyProgramPage.guestDisplay.unknownGuest');
  };

  // Helper function to translate tier names
  const getTierName = (tierName) => {
    const tierKey = tierName?.toUpperCase();
    return t(`loyaltyProgramPage.tierNames.${tierKey}`, { defaultValue: tierName });
  };

  useEffect(() => {
    dispatch(fetchLoyaltyAnalytics());
    dispatch(fetchLoyaltyProgram());
  }, [dispatch]);

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
          <h1 className="text-3xl font-bold text-gray-900">{t('loyaltyProgramPage.title')}</h1>
          <p className="text-gray-600 mt-1">{t('loyaltyProgramPage.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setShowConfigModal(true)}
            className="px-4 py-2 text-white rounded-lg transition flex items-center gap-2"
            style={{ backgroundColor: theme.primaryColor }}
            onMouseEnter={(e) => e.target.style.backgroundColor = theme.secondaryColor}
            onMouseLeave={(e) => e.target.style.backgroundColor = theme.primaryColor}
          >
            <Settings className="h-4 w-4" />
            {t('loyaltyProgramPage.configureProgram')}
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
                  {t('loyaltyProgramPage.programStatus.inactiveMessage')}
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
          <div className="border-l-4 p-4 rounded" style={{ backgroundColor: `${theme.primaryColor}10`, borderColor: theme.primaryColor }}>
            <div className="flex">
              <div className="flex-shrink-0">
                <Activity className="h-5 w-5" style={{ color: theme.primaryColor }} />
              </div>
              <div className="ml-3">
                <p className="text-sm" style={{ color: theme.primaryColor }}>
                  {t('loyaltyProgramPage.programStatus.notConfiguredMessage')}
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
              <Award className="h-6 w-6" style={{ color: theme.primaryColor }} />
              {t('loyaltyProgramPage.tierBenefits.title')}
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
                      {getTierName(tier.name)}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tier.minPoints} - {tier.maxPoints === 999999 ? '∞' : tier.maxPoints} {t('loyaltyProgramPage.tierBenefits.points')}
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
                        {t('loyaltyProgramPage.tierBenefits.noBenefits')}
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
              <p className="text-sm font-medium text-gray-600">{t('loyaltyProgramPage.overviewCards.totalMembers')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {analytics?.overview?.totalMembers || 0}
              </p>
            </div>
            <div className="p-3 rounded-full" style={{ backgroundColor: `${theme.primaryColor}20` }}>
              <Users className="h-8 w-8" style={{ color: theme.primaryColor }} />
            </div>
          </div>
        </div>

        {/* Points Issued */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">{t('loyaltyProgramPage.overviewCards.pointsIssued')}</p>
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
              <p className="text-sm font-medium text-gray-600">{t('loyaltyProgramPage.overviewCards.loyaltyRevenue')}</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {formatPriceByLanguage(analytics?.overview?.totalLifetimeSpending || 0, i18n.language, currency)}
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
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-gray-600">{t('loyaltyProgramPage.overviewCards.programROI')}</p>
                <div className="group relative">
                  <button className="w-4 h-4 rounded-full border border-gray-400 flex items-center justify-center text-gray-600 hover:border-gray-600 hover:bg-gray-50 transition text-xs font-bold">
                    i
                  </button>
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 hidden group-hover:block w-80 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl z-50">
                    <div className="space-y-2">
                      <p className="font-semibold">{t('loyaltyProgramPage.roiTooltip.title')}</p>
                      <p className="text-gray-300">{t('loyaltyProgramPage.roiTooltip.description')}</p>
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <p className="font-semibold mb-1">{t('loyaltyProgramPage.roiTooltip.formulaLabel')}</p>
                        <p className="font-mono text-xs bg-gray-800 p-1 rounded">{t('loyaltyProgramPage.roiTooltip.formula')}</p>
                      </div>
                      <div className="border-t border-gray-700 pt-2 mt-2">
                        <p className="font-semibold mb-1">{t('loyaltyProgramPage.roiTooltip.exampleLabel')}</p>
                        <p className="text-gray-300">{t('loyaltyProgramPage.roiTooltip.exampleDescription')}</p>
                        <p className="font-mono text-xs bg-gray-800 p-1 rounded mt-1">{t('loyaltyProgramPage.roiTooltip.exampleCalculation')}</p>
                      </div>
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
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
            {t('loyaltyProgramPage.membersByTier.title')}
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
                      {getTierName(tier)}
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
              {t('loyaltyProgramPage.recentMembers.title')}
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
                    {getTierName(member.currentTier)}
                  </span>
                  <p className="text-sm text-gray-600 mt-1">
                    {member.totalPoints} {t('loyaltyProgramPage.recentMembers.pts')}
                  </p>
                </div>
              </div>
            ))}
            {(!analytics?.recentMembers || analytics.recentMembers.length === 0) && (
              <p className="text-center text-gray-500 py-4">{t('loyaltyProgramPage.recentMembers.noMembers')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Top Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
            <Award className="h-5 w-5" />
            {t('loyaltyProgramPage.topMembers.title')}
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('loyaltyProgramPage.topMembers.rank')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('loyaltyProgramPage.topMembers.member')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('loyaltyProgramPage.topMembers.tier')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('loyaltyProgramPage.topMembers.totalSpending')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('loyaltyProgramPage.topMembers.tierPoints')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('loyaltyProgramPage.topMembers.redeemPoints')}
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
                      {getTierName(member.currentTier)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatPriceByLanguage(member.lifetimeSpending || 0, i18n.language, currency)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.tierPoints?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {member.availablePoints?.toLocaleString() || 0}
                  </td>
                </tr>
              ))}
              {(!analytics?.topMembers || analytics.topMembers.length === 0) && (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    {t('loyaltyProgramPage.topMembers.noMembers')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('loyaltyProgramPage.quickActions.title')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/hotel/loyalty/members"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:shadow-md transition"
            onMouseEnter={(e) => e.currentTarget.style.borderColor = theme.primaryColor}
            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          >
            <Users className="h-8 w-8 mr-3" style={{ color: theme.primaryColor }} />
            <div className="text-left">
              <p className="font-semibold text-gray-900">{t('loyaltyProgramPage.quickActions.viewMembers')}</p>
              <p className="text-sm text-gray-600">{t('loyaltyProgramPage.quickActions.viewMembersDesc')}</p>
            </div>
          </Link>

          <button
            onClick={() => dispatch(fetchLoyaltyAnalytics())}
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div className="text-left">
              <p className="font-semibold text-gray-900">{t('loyaltyProgramPage.quickActions.refreshAnalytics')}</p>
              <p className="text-sm text-gray-600">{t('loyaltyProgramPage.quickActions.refreshAnalyticsDesc')}</p>
            </div>
          </button>
        </div>
      </div>

      {/* Rewards Modal */}
      {showRewardsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">{t('loyaltyProgramPage.rewardsModal.title')}</h2>
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
                <p className="text-gray-500 mb-2">{t('loyaltyProgramPage.rewardsModal.comingSoon')}</p>
                <p className="text-sm text-gray-400">
                  {t('loyaltyProgramPage.rewardsModal.description')}
                </p>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setShowRewardsModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
              >
                {t('loyaltyProgramPage.rewardsModal.close')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoyaltyProgramPage;
