/**
 * Channel-Based Loyalty Program Settings
 * Allows hotel admins to configure different loyalty programs for different booking channels
 * (Travel Agency, Corporate, Direct)
 */

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Info,
  TrendingUp,
  Users,
  Building2,
  UserCheck
} from 'lucide-react';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const ChannelLoyaltySettings = () => {
  const [activeTab, setActiveTab] = useState('Travel Agency');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const channels = ['Travel Agency', 'Corporate', 'Direct'];

  // State for each channel's settings
  const [channelSettings, setChannelSettings] = useState({
    'Travel Agency': null,
    'Corporate': null,
    'Direct': null
  });

  useEffect(() => {
    fetchAllChannelSettings();
  }, []);

  const fetchAllChannelSettings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/loyalty/hotel/channels`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setChannelSettings(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching channel settings:', error);
      setMessage({
        type: 'error',
        text: 'Failed to load loyalty program settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      const currentSettings = channelSettings[activeTab];

      const payload = {
        channel: activeTab,
        tierConfiguration: currentSettings.tierConfiguration || getDefaultTierConfig(),
        pointsRules: currentSettings.pointsRules,
        redemptionRules: currentSettings.redemptionRules,
        isActive: currentSettings.isActive ?? true,
        expirationMonths: currentSettings.expirationMonths || 12
      };

      const response = await axios.post(
        `${API_BASE_URL}/loyalty/hotel/program`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({
          type: 'success',
          text: `Settings for ${activeTab} saved successfully!`
        });

        // Refresh settings
        await fetchAllChannelSettings();
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({
        type: 'error',
        text: error.response?.data?.message || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
  };

  const handleReset = () => {
    const defaults = getDefaultSettingsForChannel(activeTab);
    setChannelSettings(prev => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        ...defaults,
        exists: prev[activeTab]?.exists || false
      }
    }));
    setMessage({
      type: 'info',
      text: 'Settings reset to defaults. Click Save to apply changes.'
    });
  };

  const getDefaultTierConfig = () => [
    {
      name: 'BRONZE',
      minPoints: 0,
      maxPoints: 999,
      benefits: ['Priority email support', 'Birthday bonus points'],
      discountPercentage: 5,
      color: '#CD7F32'
    },
    {
      name: 'SILVER',
      minPoints: 1000,
      maxPoints: 2999,
      benefits: ['10% discount on all services', 'Free room upgrade (subject to availability)', 'Priority phone support'],
      discountPercentage: 10,
      color: '#C0C0C0'
    },
    {
      name: 'GOLD',
      minPoints: 3000,
      maxPoints: 5999,
      benefits: ['15% discount on all services', 'Late checkout', 'Complimentary breakfast', 'Premium support'],
      discountPercentage: 15,
      color: '#FFD700'
    },
    {
      name: 'PLATINUM',
      minPoints: 6000,
      maxPoints: 999999,
      benefits: ['20% discount on all services', 'Exclusive rewards access', 'Personal concierge', 'Airport transfer discount'],
      discountPercentage: 20,
      color: '#E5E4E2'
    }
  ];

  const getDefaultSettingsForChannel = (channel) => {
    const defaults = {
      'Travel Agency': {
        pointsPerDollar: 1,
        pointsPerNight: 50,
        serviceMultipliers: {
          laundry: 1.2,
          transportation: 1.5,
          tourism: 2.0,
          travel: 2.0,
          housekeeping: 1.0
        },
        pointsToMoneyRatio: 100,
        minimumRedemption: 500,
        maximumRedemption: 10000
      },
      'Corporate': {
        pointsPerDollar: 1.5,
        pointsPerNight: 75,
        serviceMultipliers: {
          laundry: 1.5,
          transportation: 2.0,
          tourism: 1.2,
          travel: 1.2,
          housekeeping: 1.3
        },
        pointsToMoneyRatio: 100,
        minimumRedemption: 1000,
        maximumRedemption: 20000
      },
      'Direct': {
        pointsPerDollar: 2,
        pointsPerNight: 100,
        serviceMultipliers: {
          laundry: 1.5,
          transportation: 1.5,
          tourism: 1.5,
          travel: 1.5,
          housekeeping: 1.5
        },
        pointsToMoneyRatio: 100,
        minimumRedemption: 500,
        maximumRedemption: null
      }
    };

    const channelDefaults = defaults[channel];
    return {
      pointsRules: {
        pointsPerDollar: channelDefaults.pointsPerDollar,
        pointsPerNight: channelDefaults.pointsPerNight,
        serviceMultipliers: channelDefaults.serviceMultipliers
      },
      redemptionRules: {
        pointsToMoneyRatio: channelDefaults.pointsToMoneyRatio,
        minimumRedemption: channelDefaults.minimumRedemption,
        maximumRedemption: channelDefaults.maximumRedemption
      },
      tierConfiguration: getDefaultTierConfig(),
      isActive: true,
      expirationMonths: 12
    };
  };

  const updateChannelSetting = (path, value) => {
    setChannelSettings(prev => {
      const newSettings = { ...prev };
      const current = { ...newSettings[activeTab] };

      const pathParts = path.split('.');
      let obj = current;

      for (let i = 0; i < pathParts.length - 1; i++) {
        obj[pathParts[i]] = { ...obj[pathParts[i]] };
        obj = obj[pathParts[i]];
      }

      obj[pathParts[pathParts.length - 1]] = value;
      newSettings[activeTab] = current;

      return newSettings;
    });
  };

  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'Travel Agency':
        return <Users className="w-5 h-5" />;
      case 'Corporate':
        return <Building2 className="w-5 h-5" />;
      case 'Direct':
        return <UserCheck className="w-5 h-5" />;
      default:
        return <Users className="w-5 h-5" />;
    }
  };

  const currentSettings = channelSettings[activeTab];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Channel-Based Loyalty Programs
        </h1>
        <p className="text-gray-600">
          Configure unique loyalty program settings for each booking channel
        </p>
      </div>

      {/* Message Banner */}
      {message.text && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : message.type === 'error'
              ? 'bg-red-50 text-red-800 border border-red-200'
              : 'bg-blue-50 text-blue-800 border border-blue-200'
          }`}
        >
          {message.type === 'success' && <CheckCircle className="w-5 h-5" />}
          {message.type === 'error' && <AlertCircle className="w-5 h-5" />}
          {message.type === 'info' && <Info className="w-5 h-5" />}
          <span>{message.text}</span>
        </div>
      )}

      {/* Channel Tabs */}
      <div className="bg-white rounded-lg shadow-sm mb-6">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {channels.map((channel) => (
              <button
                key={channel}
                onClick={() => setActiveTab(channel)}
                className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === channel
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {getChannelIcon(channel)}
                {channel}
                {channelSettings[channel]?.exists && (
                  <span className="ml-2 px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                    Active
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Settings Content */}
      {currentSettings && (
        <div className="space-y-6">
          {/* Points Earning Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Points Earning Rules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points per Dollar Spent
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={currentSettings.pointsRules?.pointsPerDollar || 1}
                  onChange={(e) =>
                    updateChannelSetting('pointsRules.pointsPerDollar', parseFloat(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Base points earned per $1 spent
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points per Night Stayed
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentSettings.pointsRules?.pointsPerNight || 50}
                  onChange={(e) =>
                    updateChannelSetting('pointsRules.pointsPerNight', parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Bonus points for each night stayed
                </p>
              </div>
            </div>

            {/* Service Multipliers */}
            <div className="mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Service Category Multipliers
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(currentSettings.pointsRules?.serviceMultipliers || {}).map(
                  ([service, multiplier]) => (
                    <div key={service}>
                      <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                        {service}
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={multiplier}
                        onChange={(e) =>
                          updateChannelSetting(
                            `pointsRules.serviceMultipliers.${service}`,
                            parseFloat(e.target.value)
                          )
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  )
                )}
              </div>
              <p className="mt-3 text-sm text-gray-500">
                Multiply base points by this factor for specific service categories
              </p>
            </div>
          </div>

          {/* Redemption Rules Section */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Points Redemption Rules
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points to Dollar Ratio
                </label>
                <input
                  type="number"
                  min="1"
                  value={currentSettings.redemptionRules?.pointsToMoneyRatio || 100}
                  onChange={(e) =>
                    updateChannelSetting('redemptionRules.pointsToMoneyRatio', parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Points needed for $1 redemption
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Redemption Points
                </label>
                <input
                  type="number"
                  min="0"
                  value={currentSettings.redemptionRules?.minimumRedemption || 500}
                  onChange={(e) =>
                    updateChannelSetting('redemptionRules.minimumRedemption', parseInt(e.target.value))
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Minimum points required to redeem
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Redemption Points
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="Unlimited"
                  value={currentSettings.redemptionRules?.maximumRedemption || ''}
                  onChange={(e) =>
                    updateChannelSetting(
                      'redemptionRules.maximumRedemption',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Maximum per transaction (blank = unlimited)
                </p>
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Redemption Restrictions (Optional)
              </label>
              <textarea
                rows="3"
                value={currentSettings.redemptionRules?.restrictions || ''}
                onChange={(e) =>
                  updateChannelSetting('redemptionRules.restrictions', e.target.value)
                }
                placeholder="Enter any restrictions or terms for point redemption..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Program Settings */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Program Settings
            </h2>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={currentSettings.isActive ?? true}
                  onChange={(e) => updateChannelSetting('isActive', e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                  Program Active
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Points Expiration (Months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="60"
                  value={currentSettings.expirationMonths || 12}
                  onChange={(e) =>
                    updateChannelSetting('expirationMonths', parseInt(e.target.value))
                  }
                  className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="mt-1 text-sm text-gray-500">
                  Points expire after this many months of inactivity
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between bg-white rounded-lg shadow-sm p-6">
            <button
              onClick={handleReset}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" />
              Reset to Defaults
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChannelLoyaltySettings;
