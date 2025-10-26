import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import {
  fetchMyMembership,
  fetchPointsHistory,
  clearError
} from '../../../redux/slices/loyaltySlice';
import {
  Award,
  TrendingUp,
  Gift,
  Clock,
  ChevronRight,
  Star
} from 'lucide-react';

const MyLoyalty = () => {
  const dispatch = useDispatch();
  const { hotelId } = useParams();
  const { currentMembership, pointsHistory, redemptionHistory, loading, error } = useSelector(
    (state) => state.loyalty
  );
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (hotelId) {
      dispatch(fetchMyMembership(hotelId));
      dispatch(fetchPointsHistory({ hotelId, limit: 20 }));
    }
  }, [dispatch, hotelId]);

  useEffect(() => {
    if (error) {
      setTimeout(() => dispatch(clearError()), 5000);
    }
  }, [error, dispatch]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentMembership) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <p className="text-yellow-700">
            You are not enrolled in this hotel's loyalty program yet. Make your first booking to join!
          </p>
        </div>
      </div>
    );
  }

  const tierColors = {
    BRONZE: '#CD7F32',
    SILVER: '#C0C0C0',
    GOLD: '#FFD700',
    PLATINUM: '#E5E4E2'
  };

  const tierColor = tierColors[currentMembership.currentTier] || tierColors.BRONZE;

  const tierBenefits = {
    BRONZE: ['Priority email support', 'Birthday bonus points', '5% discount on all services'],
    SILVER: ['10% discount on all services', 'Free room upgrade (subject to availability)', 'Priority phone support'],
    GOLD: ['15% discount on all services', 'Late checkout', 'Complimentary breakfast', 'Premium support'],
    PLATINUM: ['20% discount on all services', 'Exclusive rewards access', 'Personal concierge', 'Airport transfer discount']
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* Header with Tier Badge */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">My Loyalty Status</h1>
            <p className="text-blue-100">
              Member since {new Date(currentMembership.joinDate).toLocaleDateString()}
            </p>
          </div>
          <div
            className="px-6 py-3 rounded-full text-2xl font-bold shadow-lg"
            style={{
              backgroundColor: tierColor,
              color: currentMembership.currentTier === 'GOLD' ? '#000' : '#fff'
            }}
          >
            {currentMembership.currentTier}
          </div>
        </div>

        {/* Progress to Next Tier */}
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Progress to {currentMembership.tierProgress.nextTier || 'Max Tier'}</span>
            <span>
              {currentMembership.tierProgress.nextTier
                ? `${currentMembership.tierProgress.pointsToNextTier} points to go`
                : 'Maximum tier reached!'}
            </span>
          </div>
          <div className="w-full bg-white/30 rounded-full h-3">
            <div
              className="h-3 rounded-full bg-white transition-all duration-500"
              style={{
                width: `${currentMembership.tierProgress.progressPercentage || 100}%`
              }}
            ></div>
          </div>
        </div>
      </div>

      {/* Points Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 font-medium">Available Points</p>
            <Award className="h-6 w-6 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currentMembership.availablePoints?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Ready to redeem</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 font-medium">Total Points</p>
            <Star className="h-6 w-6 text-yellow-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            {currentMembership.totalPoints?.toLocaleString() || 0}
          </p>
          <p className="text-sm text-gray-500 mt-1">Lifetime earned</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 font-medium">Lifetime Spending</p>
            <TrendingUp className="h-6 w-6 text-blue-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">
            ${currentMembership.lifetimeSpending?.toFixed(2) || '0.00'}
          </p>
          <p className="text-sm text-gray-500 mt-1">Total spent</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                activeTab === 'overview'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Benefits
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                activeTab === 'history'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Points History
            </button>
            <button
              onClick={() => setActiveTab('rewards')}
              className={`px-6 py-3 border-b-2 font-medium text-sm transition ${
                activeTab === 'rewards'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Redemptions
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Benefits Tab */}
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Your {currentMembership.currentTier} Tier Benefits
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {tierBenefits[currentMembership.currentTier]?.map((benefit, index) => (
                  <div
                    key={index}
                    className="flex items-start p-4 bg-gray-50 rounded-lg"
                  >
                    <ChevronRight className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{benefit}</span>
                  </div>
                ))}
              </div>

              {/* Tier Comparison */}
              <div className="mt-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">
                  All Tier Benefits
                </h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Tier
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Points Required
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Discount
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Benefits
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier) => (
                        <tr
                          key={tier}
                          className={
                            tier === currentMembership.currentTier
                              ? 'bg-blue-50'
                              : ''
                          }
                        >
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className="px-3 py-1 text-sm font-semibold rounded"
                              style={{
                                backgroundColor: `${tierColors[tier]}40`,
                                color: tierColors[tier]
                              }}
                            >
                              {tier}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tier === 'BRONZE' && '0+'}
                            {tier === 'SILVER' && '1,000+'}
                            {tier === 'GOLD' && '3,000+'}
                            {tier === 'PLATINUM' && '6,000+'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {tier === 'BRONZE' && '5%'}
                            {tier === 'SILVER' && '10%'}
                            {tier === 'GOLD' && '15%'}
                            {tier === 'PLATINUM' && '20%'}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {tierBenefits[tier]?.slice(0, 2).join(', ')}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Points History Tab */}
          {activeTab === 'history' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Points Activity
              </h3>
              <div className="space-y-3">
                {pointsHistory?.length > 0 ? (
                  pointsHistory.map((entry, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div
                          className={`p-2 rounded-full mr-4 ${
                            entry.points > 0 ? 'bg-green-100' : 'bg-red-100'
                          }`}
                        >
                          {entry.points > 0 ? (
                            <TrendingUp className="h-5 w-5 text-green-600" />
                          ) : (
                            <Gift className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {entry.description}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(entry.date).toLocaleDateString()} at{' '}
                            {new Date(entry.date).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`text-lg font-bold ${
                            entry.points > 0 ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {entry.points > 0 ? '+' : ''}
                          {entry.points}
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded ${
                            entry.type === 'EARNED'
                              ? 'bg-green-100 text-green-800'
                              : entry.type === 'REDEEMED'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {entry.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No points history yet. Start booking to earn points!
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Redemptions Tab */}
          {activeTab === 'rewards' && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Redemption History
              </h3>
              <div className="space-y-3">
                {redemptionHistory?.length > 0 ? (
                  redemptionHistory.map((redemption, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center">
                        <div className="p-2 bg-purple-100 rounded-full mr-4">
                          <Gift className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {redemption.rewardName}
                          </p>
                          <p className="text-sm text-gray-500 flex items-center mt-1">
                            <Clock className="h-4 w-4 mr-1" />
                            {new Date(redemption.date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-600">
                          {redemption.points} pts
                        </p>
                        <p className="text-sm text-gray-600">
                          ${redemption.value.toFixed(2)} value
                        </p>
                        <span
                          className={`text-xs px-2 py-1 rounded mt-1 inline-block ${
                            redemption.status === 'APPLIED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {redemption.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Gift className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-500">
                      No redemptions yet. Browse available rewards!
                    </p>
                    <a
                      href={`/guest/loyalty/rewards/${hotelId}`}
                      className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      View Rewards
                    </a>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2">Explore Available Rewards</h3>
            <p className="text-purple-100">
              Redeem your {currentMembership.availablePoints} points for exclusive rewards!
            </p>
          </div>
          <a
            href={`/guest/loyalty/rewards/${hotelId}`}
            className="px-6 py-3 bg-white text-purple-600 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center"
          >
            Browse Rewards
            <ChevronRight className="h-5 w-5 ml-2" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default MyLoyalty;
