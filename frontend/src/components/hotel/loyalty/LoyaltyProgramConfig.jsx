/**
 * Loyalty Program Configuration Modal
 * Allows hotel admins to create/update loyalty program settings
 */

import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { X, Save, AlertCircle, Users, Building2, UserCheck } from 'lucide-react';
import { fetchLoyaltyProgram } from '../../../redux/slices/loyaltySlice';

const LoyaltyProgramConfig = ({ isOpen, onClose, existingProgram = null }) => {
  const { loading, loyaltyProgram } = useSelector((state) => state.loyalty);
  const dispatch = useDispatch();

  // Channel management
  const [activeChannel, setActiveChannel] = useState('Direct');
  const channels = ['Travel Agency', 'Corporate', 'Direct'];

  // Helper to get channel icons
  const getChannelIcon = (channel) => {
    switch (channel) {
      case 'Travel Agency': return <Users className="w-4 h-4" />;
      case 'Corporate': return <Building2 className="w-4 h-4" />;
      case 'Direct': return <UserCheck className="w-4 h-4" />;
      default: return <Users className="w-4 h-4" />;
    }
  };

  // Helper to get default tier configuration
  const getDefaultTierConfiguration = () => {
    return [
      {
        name: 'BRONZE',
        minPoints: 0,
        maxPoints: 999,
        benefits: ['Priority email support', 'Birthday bonus points'],
        color: '#CD7F32'
      },
      {
        name: 'SILVER',
        minPoints: 1000,
        maxPoints: 2999,
        benefits: ['10% discount on all services', 'Priority phone support', 'Welcome bonus'],
        color: '#C0C0C0'
      },
      {
        name: 'GOLD',
        minPoints: 3000,
        maxPoints: 5999,
        benefits: ['15% discount on all services', 'Free room upgrade', 'Priority support', 'Complimentary breakfast'],
        color: '#FFD700'
      },
      {
        name: 'PLATINUM',
        minPoints: 6000,
        maxPoints: 999999,
        benefits: ['20% discount on all services', 'Free room upgrade', 'VIP support', 'Complimentary spa access', 'Late checkout'],
        color: '#E5E4E2'
      }
    ];
  };

  // Helper to get default channel settings
  const getDefaultChannelSettings = (channel) => {
    const defaults = {
      'Travel Agency': { pointsPerDollar: 1, pointsPerNight: 50, serviceMultipliers: { laundry: 1.2, transportation: 1.5, tourism: 2.0, housekeeping: 1.0 }, pointsToMoneyRatio: 100, minimumRedemption: 500 },
      'Corporate': { pointsPerDollar: 1.5, pointsPerNight: 75, serviceMultipliers: { laundry: 1.5, transportation: 2.0, tourism: 1.2, housekeeping: 1.3 }, pointsToMoneyRatio: 100, minimumRedemption: 1000 },
      'Direct': { pointsPerDollar: 2, pointsPerNight: 100, serviceMultipliers: { laundry: 1.5, transportation: 1.5, tourism: 1.5, housekeeping: 1.5 }, pointsToMoneyRatio: 100, minimumRedemption: 500 }
    };
    return defaults[channel];
  };

  // Channel-specific points settings
  const [channelPointsSettings, setChannelPointsSettings] = useState({
    'Travel Agency': getDefaultChannelSettings('Travel Agency'),
    'Corporate': getDefaultChannelSettings('Corporate'),
    'Direct': getDefaultChannelSettings('Direct')
  });

  // Shared settings (General + Tiers) - Initialize with empty or minimal state
  const [formData, setFormData] = useState({
    isActive: true,
    expirationMonths: 12,
    tierConfiguration: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      // Use the freshest data - prioritize Redux state over prop
      const currentProgram = loyaltyProgram || existingProgram;

      if (currentProgram) {
        console.log('Loading existing program:', currentProgram);
        // Handle array of programs (channel-based) or single program
        const programs = Array.isArray(currentProgram) ? currentProgram : [currentProgram];

        if (programs.length > 0) {
          // IMPORTANT: Filter to only channel-based programs and use the most recently updated one
          const channelPrograms = programs.filter(p => p.channel && ['Travel Agency', 'Corporate', 'Direct'].includes(p.channel));

          // Sort by updatedAt to get the most recent
          const sortedPrograms = channelPrograms.sort((a, b) =>
            new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0)
          );

          console.log('Filtered channel programs:', sortedPrograms);

          // Use the most recently updated program for shared settings
          const firstProgram = sortedPrograms[0] || programs[0];

          console.log('Using program for tier config:', firstProgram);

          // Deep clone tier configuration to avoid reference issues
          const tierConfig = firstProgram.tierConfiguration
            ? JSON.parse(JSON.stringify(firstProgram.tierConfiguration))
            : getDefaultTierConfiguration();

          console.log('Setting tier configuration:', tierConfig);

          setFormData({
            isActive: firstProgram.isActive !== undefined ? firstProgram.isActive : true,
            expirationMonths: firstProgram.expirationMonths || 12,
            tierConfiguration: tierConfig
          });

          // Load channel-specific settings from all channel programs
          const newChannelSettings = {};
          sortedPrograms.forEach(program => {
            if (program.channel && program.pointsRules && program.redemptionRules) {
              newChannelSettings[program.channel] = {
                pointsPerDollar: program.pointsRules.pointsPerDollar,
                pointsPerNight: program.pointsRules.pointsPerNight,
                serviceMultipliers: program.pointsRules.serviceMultipliers,
                pointsToMoneyRatio: program.redemptionRules.pointsToMoneyRatio,
                minimumRedemption: program.redemptionRules.minimumRedemption
              };
            }
          });

          if (Object.keys(newChannelSettings).length > 0) {
            console.log('Setting channel settings:', newChannelSettings);
            setChannelPointsSettings(newChannelSettings);
          }
        }
      } else {
        // No existing program - set defaults for new program
        console.log('No existing program, setting defaults');
        setFormData({
          isActive: true,
          expirationMonths: 12,
          tierConfiguration: getDefaultTierConfiguration()
        });

        // Reset channel settings to defaults
        setChannelPointsSettings({
          'Travel Agency': getDefaultChannelSettings('Travel Agency'),
          'Corporate': getDefaultChannelSettings('Corporate'),
          'Direct': getDefaultChannelSettings('Direct')
        });
      }
    }
  }, [isOpen, loyaltyProgram, existingProgram]);  // Handler for channel-specific points changes
  const handleChannelPointsChange = (field, value) => {
    console.log(`Updating ${activeChannel} - ${field}:`, value);
    setChannelPointsSettings(prev => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        [field]: value
      }
    }));
  };

  // Handler for channel-specific service multipliers
  const handleServiceMultiplierChange = (service, value) => {
    console.log(`Updating ${activeChannel} service multiplier - ${service}:`, value);
    setChannelPointsSettings(prev => ({
      ...prev,
      [activeChannel]: {
        ...prev[activeChannel],
        serviceMultipliers: {
          ...prev[activeChannel].serviceMultipliers,
          [service]: parseFloat(value)
        }
      }
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleTierChange = (index, field, value) => {
    console.log(`Updating tier ${index}, field: ${field}, value:`, value);
    const newTiers = [...formData.tierConfiguration];
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      newTiers[index] = {
        ...newTiers[index],
        [parent]: {
          ...newTiers[index][parent],
          [child]: value
        }
      };
    } else {
      newTiers[index] = {
        ...newTiers[index],
        [field]: value
      };
    }
    console.log('New tier configuration:', newTiers);
    setFormData(prev => ({
      ...prev,
      tierConfiguration: newTiers
    }));
    // Clear tier errors
    if (errors.tiers) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.tiers;
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const currentChannelSettings = channelPointsSettings[activeChannel];

    if (formData.expirationMonths < 1 || formData.expirationMonths > 36) {
      newErrors.expirationMonths = 'Expiration must be between 1 and 36 months';
    }

    if (currentChannelSettings.pointsPerDollar < 1) {
      newErrors.pointsPerDollar = 'Points per dollar must be at least 1';
    }

    if (currentChannelSettings.minimumRedemption < 1) {
      newErrors.minimumRedemption = 'Minimum redemption must be at least 1';
    }

    // Validate tier progression
    for (let i = 0; i < formData.tierConfiguration.length - 1; i++) {
      const currentTier = formData.tierConfiguration[i];
      const nextTier = formData.tierConfiguration[i + 1];

      if (currentTier.maxPoints >= nextTier.minPoints) {
        newErrors.tiers = 'Tier point ranges must not overlap';
        break;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    console.log('Submitting loyalty program with channel settings:', channelPointsSettings);

    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
      const cleanApiUrl = apiUrl.endsWith('/api') ? apiUrl : `${apiUrl}/api`;

      // Save settings for all channels
      const savePromises = channels.map(async (channel) => {
        const channelData = channelPointsSettings[channel];
        const payload = {
          channel: channel,
          isActive: formData.isActive,
          expirationMonths: formData.expirationMonths,
          tierConfiguration: formData.tierConfiguration,
          pointsRules: {
            pointsPerDollar: channelData.pointsPerDollar,
            pointsPerNight: channelData.pointsPerNight,
            serviceMultipliers: channelData.serviceMultipliers
          },
          redemptionRules: {
            pointsToMoneyRatio: channelData.pointsToMoneyRatio,
            minimumRedemption: channelData.minimumRedemption
          }
        };

        console.log(`Saving ${channel} program:`, payload);

        const response = await fetch(`${cleanApiUrl}/loyalty/hotel/program`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || `Failed to save ${channel} program`);
        }

        return response.json();
      });

      const results = await Promise.all(savePromises);
      console.log('All channels saved successfully:', results);

      // Refetch the loyalty program data to get the updated values - WAIT for it to complete
      console.log('Refetching loyalty program data...');
      await dispatch(fetchLoyaltyProgram()).unwrap();
      console.log('Loyalty program data refreshed');

      alert('Loyalty program configured successfully for all channels!');

      onClose();
    } catch (error) {
      console.error('Error saving loyalty program:', error);
      alert(`Failed to save loyalty program: ${error.message}`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {existingProgram ? 'Update' : 'Configure'} Loyalty Program
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Set up tiers, points rules, and redemption policies
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <X className="h-6 w-6 text-gray-600" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-8">
          {/* General Settings */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              General Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => handleInputChange('isActive', e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Program Active
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Enable the loyalty program for guest enrollment
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points Expiration (months)
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={formData.expirationMonths}
                  onChange={(e) => handleInputChange('expirationMonths', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.expirationMonths && (
                  <p className="text-xs text-red-600 mt-1">{errors.expirationMonths}</p>
                )}
              </div>
            </div>
          </div>

          {/* Tier Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Membership Tiers</h3>
            {errors.tiers && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{errors.tiers}</p>
              </div>
            )}

            <div className="space-y-4">
              {(formData.tierConfiguration || []).map((tier, index) => (
                <div key={tier.name} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900">{tier.name} Tier</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Min Points
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.minPoints}
                        onChange={(e) => handleTierChange(index, 'minPoints', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Points
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={tier.maxPoints}
                        onChange={(e) => handleTierChange(index, 'maxPoints', parseInt(e.target.value) || 0)}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Benefits (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tier.benefits ? tier.benefits.join(', ') : ''}
                      onChange={(e) => {
                        const benefitsArray = e.target.value
                          .split(',')
                          .map(b => b.trim())
                          .filter(b => b.length > 0);
                        handleTierChange(index, 'benefits', benefitsArray);
                      }}
                      placeholder="e.g., Priority support, Free upgrades, Complimentary breakfast"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Channel Tabs - Before Points Rules */}
          <div className="border-b border-gray-200 bg-gray-50 rounded-lg">
            <div className="px-4 py-2">
              <p className="text-sm font-medium text-gray-700 mb-2">Select Channel to Configure Points Rules:</p>
            </div>
            <nav className="flex px-4 pb-0">
              {channels.map((channel) => (
                <button
                  key={channel}
                  type="button"
                  onClick={() => setActiveChannel(channel)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeChannel === channel
                      ? 'border-blue-600 text-blue-600 bg-white'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {getChannelIcon(channel)}
                  {channel}
                </button>
              ))}
            </nav>
          </div>

          {/* Points Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Points Earning Rules
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {activeChannel}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points per Dollar Spent
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.1"
                  value={channelPointsSettings[activeChannel].pointsPerDollar}
                  onChange={(e) => handleChannelPointsChange('pointsPerDollar', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.pointsPerDollar && (
                  <p className="text-xs text-red-600 mt-1">{errors.pointsPerDollar}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points per Night Stayed
                </label>
                <input
                  type="number"
                  min="0"
                  value={channelPointsSettings[activeChannel].pointsPerNight}
                  onChange={(e) => handleChannelPointsChange('pointsPerNight', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">Award bonus points for each night guests stay at your hotel</p>
              </div>
            </div>

            <div className="border rounded-lg p-4 bg-gray-50">
              <h4 className="font-medium text-gray-900 mb-3">Service Category Multipliers</h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Laundry (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={channelPointsSettings[activeChannel].serviceMultipliers.laundry}
                    onChange={(e) => handleServiceMultiplierChange('laundry', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Transportation (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={channelPointsSettings[activeChannel].serviceMultipliers.transportation}
                    onChange={(e) => handleServiceMultiplierChange('transportation', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Tourism (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={channelPointsSettings[activeChannel].serviceMultipliers.tourism}
                    onChange={(e) => handleServiceMultiplierChange('tourism', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Housekeeping (x)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={channelPointsSettings[activeChannel].serviceMultipliers.housekeeping}
                    onChange={(e) => handleServiceMultiplierChange('housekeeping', e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Redemption Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Points Redemption Rules
              <span className="text-sm font-normal text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                {activeChannel}
              </span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to Money Ratio
                </label>
                <input
                  type="number"
                  min="1"
                  value={channelPointsSettings[activeChannel].pointsToMoneyRatio}
                  onChange={(e) => handleChannelPointsChange('pointsToMoneyRatio', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {channelPointsSettings[activeChannel].pointsToMoneyRatio} points = $1
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Redemption Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={channelPointsSettings[activeChannel].minimumRedemption}
                  onChange={(e) => handleChannelPointsChange('minimumRedemption', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum {channelPointsSettings[activeChannel].minimumRedemption} points = $
                  {(channelPointsSettings[activeChannel].minimumRedemption / channelPointsSettings[activeChannel].pointsToMoneyRatio).toFixed(2)}
                </p>
                {errors.minimumRedemption && (
                  <p className="text-xs text-red-600 mt-1">{errors.minimumRedemption}</p>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  {existingProgram ? 'Update' : 'Create'} Program
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoyaltyProgramConfig;
