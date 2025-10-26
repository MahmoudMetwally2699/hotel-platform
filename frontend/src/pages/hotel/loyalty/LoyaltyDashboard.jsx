import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { fetchLoyaltyAnalytics, fetchLoyaltyProgram } from '../../../redux/slices/loyaltySlice';
import {
  Users,
  Award,
  TrendingUp,
  Gift,
  DollarSign,
  Activity
} from 'lucide-react';

const LoyaltyDashboard = () => {
  const dispatch = useDispatch();
  const { analytics, loyaltyProgram, loading } = useSelector((state) => state.loyalty);

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

  const tierColors = {
    BRONZE: '#CD7F32',
    SILVER: '#C0C0C0',
    GOLD: '#FFD700',
    PLATINUM: '#E5E4E2'
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loyalty Program Dashboard</h1>
          <p className="text-gray-600 mt-1">Manage your hotel's loyalty program and rewards</p>
        </div>
        <div className="flex gap-3">
          <Link
            to="/hotel/loyalty/program-config"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Configure Program
          </Link>
          <Link
            to="/hotel/loyalty/rewards"
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
          >
            Manage Rewards
          </Link>
        </div>
      </div>

      {/* Program Status Alert */}
      {!loyaltyProgram?.isActive && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <Activity className="h-5 w-5 text-yellow-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Your loyalty program is currently inactive.
                <Link to="/hotel/loyalty/program-config" className="font-medium underline ml-1">
                  Activate it here
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Members */}
        <div className="bg-white rounded-lg shadow p-6">
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
        <div className="bg-white rounded-lg shadow p-6">
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
        <div className="bg-white rounded-lg shadow p-6">
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
        <div className="bg-white rounded-lg shadow p-6">
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
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Members by Tier</h2>
          <div className="space-y-4">
            {['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'].map((tier) => {
              const count = analytics?.membersByTier?.[tier] || 0;
              const percentage = analytics?.overview?.totalMembers
                ? ((count / analytics.overview.totalMembers) * 100).toFixed(1)
                : 0;

              return (
                <div key={tier}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="font-medium" style={{ color: tierColors[tier] }}>
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
                        backgroundColor: tierColors[tier]
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
            <h2 className="text-xl font-semibold text-gray-900">Recent Members</h2>
            <Link
              to="/hotel/loyalty/members"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All
            </Link>
          </div>
          <div className="space-y-3">
            {analytics?.recentMembers?.slice(0, 5).map((member) => (
              <div
                key={member._id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium text-gray-900">{member.guest?.name || 'Guest'}</p>
                  <p className="text-sm text-gray-600">{member.guest?.email}</p>
                </div>
                <div className="text-right">
                  <span
                    className="px-2 py-1 text-xs font-semibold rounded"
                    style={{
                      backgroundColor: `${tierColors[member.currentTier]}20`,
                      color: tierColors[member.currentTier]
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
          </div>
        </div>
      </div>

      {/* Top Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Top Members by Spending</h2>
          <Link
            to="/hotel/loyalty/analytics"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View Analytics
          </Link>
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
                        {member.guest?.name || 'Guest'}
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
                        backgroundColor: `${tierColors[member.currentTier]}20`,
                        color: tierColors[member.currentTier]
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
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/hotel/loyalty/members"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:shadow-md transition"
          >
            <Users className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">Manage Members</p>
              <p className="text-sm text-gray-600">View and manage all members</p>
            </div>
          </Link>

          <Link
            to="/hotel/loyalty/rewards"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:shadow-md transition"
          >
            <Gift className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">Manage Rewards</p>
              <p className="text-sm text-gray-600">Create and edit rewards</p>
            </div>
          </Link>

          <Link
            to="/hotel/loyalty/analytics"
            className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:shadow-md transition"
          >
            <TrendingUp className="h-8 w-8 text-purple-600 mr-3" />
            <div>
              <p className="font-semibold text-gray-900">View Analytics</p>
              <p className="text-sm text-gray-600">Detailed program insights</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoyaltyDashboard;
