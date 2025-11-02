/**
 * LoyaltyTierCard Component
 * Displays guest loyalty tier information with modern design
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { FaTrophy, FaStar, FaGift, FaChevronRight } from 'react-icons/fa';
import { getCurrencySymbol } from '../../utils/currency';

// Tier color configurations
const TIER_COLORS = {
  BRONZE: {
    primary: '#CD7F32',
    secondary: '#A0522D',
    light: '#F4E4D7',
    gradient: 'from-amber-700 to-amber-900'
  },
  SILVER: {
    primary: '#C0C0C0',
    secondary: '#A8A8A8',
    light: '#F5F5F5',
    gradient: 'from-gray-400 to-gray-600'
  },
  GOLD: {
    primary: '#FFD700',
    secondary: '#DAA520',
    light: '#FFF9E6',
    gradient: 'from-yellow-400 to-yellow-600'
  },
  PLATINUM: {
    primary: '#E5E4E2',
    secondary: '#C9C9C9',
    light: '#F8F8F8',
    gradient: 'from-slate-300 to-slate-500'
  }
};

// Tier icons
const TIER_ICONS = {
  BRONZE: FaTrophy,
  SILVER: FaStar,
  GOLD: FaTrophy,
  PLATINUM: FaTrophy
};

const LoyaltyTierCard = ({ membership, tierDetails, program, currency = 'USD' }) => {
  const { t } = useTranslation();

  if (!membership || !tierDetails) {
    return null;
  }

  const tierColor = TIER_COLORS[membership.currentTier] || TIER_COLORS.BRONZE;
  const TierIcon = TIER_ICONS[membership.currentTier] || FaTrophy;

  // Calculate progress percentage
  const progressPercentage = membership.tierProgress?.progressPercentage || 0;
  const pointsToNextTier = membership.tierProgress?.pointsToNextTier || 0;
  const nextTier = membership.tierProgress?.nextTier;

  // Calculate redeemable value
  const pointsToMoneyRatio = program?.redemptionRules?.pointsToMoneyRatio || 100;
  const redeemableValue = membership.availablePoints / pointsToMoneyRatio;

  // Get currency symbol
  const currencySymbol = getCurrencySymbol(currency);

  return (
    <div className="bg-white shadow-lg rounded-2xl overflow-hidden border border-gray-100">
      {/* Header Section with Gradient */}
      <div
        className={`bg-gradient-to-r ${tierColor.gradient} p-4 sm:p-6 text-white relative overflow-hidden`}
      >
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-3">
              <div className="bg-white bg-opacity-20 p-2 sm:p-3 rounded-full backdrop-blur-sm">
                <TierIcon className="text-2xl sm:text-3xl" />
              </div>
              <div>
                <p className="text-sm font-medium opacity-90">{t('loyaltyCard.loyaltyTier')}</p>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-wide">{membership.currentTier}</h2>
              </div>
            </div>
            <div className="text-left sm:text-right">
              <p className="text-xs font-medium opacity-90">{t('loyaltyCard.tierPoints')}</p>
              <p className="text-xl sm:text-2xl font-bold">{(membership.tierPoints || membership.totalPoints).toLocaleString()}</p>
              <p className="text-xs font-medium opacity-90 mt-2">{t('loyaltyCard.redeemablePoints')}</p>
              <p className="text-2xl sm:text-3xl font-bold">{membership.availablePoints.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Points Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 divide-x-0 sm:divide-x divide-y sm:divide-y-0 divide-gray-200 bg-gray-50 border-b border-gray-200">
        <div className="p-4 text-center sm:border-b-0 border-b border-gray-200">
          <p className="text-2xl font-bold text-gray-800">{(membership.tierPoints || membership.totalPoints).toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">{t('loyaltyCard.tierPoints')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('loyaltyCard.neverDecrease')}</p>
        </div>
        <div className="p-4 text-center sm:border-b-0 border-b border-gray-200">
          <p className="text-2xl font-bold text-blue-600">{membership.availablePoints.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-1">{t('loyaltyCard.redeemablePoints')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('loyaltyCard.useForRewards')}</p>
        </div>
        <div className="p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{currencySymbol}{redeemableValue.toFixed(2)}</p>
          <p className="text-xs text-gray-600 mt-1">{t('loyaltyCard.cashValue')}</p>
          <p className="text-xs text-gray-500 mt-1">{t('loyaltyCard.currentBalance')}</p>
        </div>
      </div>

      {/* Tier Progress */}
      {nextTier && pointsToNextTier > 0 && (
        <div className="p-4 sm:p-6 bg-white border-b border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-semibold text-gray-700">{t('loyaltyCard.progressTo', { tier: nextTier })}</h3>
            <span className="text-sm font-medium" style={{ color: tierColor.primary }}>
              {t('loyaltyCard.pointsNeeded', { points: pointsToNextTier.toLocaleString() })}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="relative pt-1">
            <div className="overflow-hidden h-3 text-xs flex rounded-full bg-gray-200">
              <div
                style={{
                  width: `${progressPercentage}%`,
                  background: `linear-gradient(to right, ${tierColor.primary}, ${tierColor.secondary})`
                }}
                className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all duration-500 ease-out rounded-full"
              ></div>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-600">{t('loyaltyCard.complete', { percentage: progressPercentage.toFixed(1) })}</span>
              <span className="text-xs font-medium text-gray-700">
                {membership.totalPoints.toLocaleString()} / {(membership.totalPoints + pointsToNextTier).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Already at Highest Tier */}
      {!nextTier && (
        <div className="p-4 sm:p-6 bg-gradient-to-r from-amber-50 to-yellow-50 border-b border-yellow-200">
          <div className="flex items-center justify-center space-x-2 text-yellow-800">
            <FaTrophy className="text-xl" />
            <p className="font-semibold">{t('loyaltyCard.highestTier')}</p>
          </div>
        </div>
      )}

      {/* Tier Benefits */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center space-x-2 mb-4">
          <FaGift className="text-xl" style={{ color: tierColor.primary }} />
          <h3 className="text-lg font-semibold text-gray-800">{t('loyaltyCard.yourBenefits', { tier: membership.currentTier })}</h3>
        </div>

        <div className="space-y-3">
          {tierDetails.benefits && tierDetails.benefits.length > 0 ? (
            tierDetails.benefits.map((benefit, index) => (
              <div key={index} className="flex items-start space-x-3 group">
                <div className="mt-1">
                  <FaChevronRight
                    className="text-sm group-hover:translate-x-1 transition-transform"
                    style={{ color: tierColor.primary }}
                  />
                </div>
                <p className="text-gray-700 text-sm leading-relaxed flex-1">{benefit}</p>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-sm">{t('loyaltyCard.noBenefits')}</p>
          )}
        </div>

        {/* Discount Badge - Removed per user request */}
      </div>

      {/* Membership Info Footer */}
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs text-gray-600 space-y-2 sm:space-y-0">
          <div>
            <p>{t('loyaltyCard.memberSince', { date: new Date(membership.joinDate).toLocaleDateString() })}</p>
          </div>
          {program?.expirationMonths && (
            <div className="text-left sm:text-right">
              <p>{t('loyaltyCard.pointsExpire', { months: program.expirationMonths })}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoyaltyTierCard;
