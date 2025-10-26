/**
 * Loyalty Program Configuration Modal
 * Allows hotel admins to create/update loyalty program settings
 */

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { X, Save, Plus, Trash2, AlertCircle } from 'lucide-react';

const LoyaltyProgramConfig = ({ isOpen, onClose, existingProgram = null }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.loyalty);

  const [formData, setFormData] = useState({
    isActive: true,
    expirationMonths: 12,
    tierConfiguration: [
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
    ],
    pointsRules: {
      pointsPerDollar: 10,
      pointsPerNight: 50,
      serviceMultipliers: {
        laundry: 1,
        transportation: 1,
        tourism: 1.5,
        housekeeping: 1
      }
    },
    redemptionRules: {
      pointsToMoneyRatio: 100,
      minimumRedemption: 500
    }
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (existingProgram) {
      setFormData({
        isActive: existingProgram.isActive,
        expirationMonths: existingProgram.expirationMonths || 12,
        tierConfiguration: existingProgram.tierConfiguration,
        pointsRules: existingProgram.pointsRules,
        redemptionRules: existingProgram.redemptionRules
      });
    }
  }, [existingProgram]);

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

  const handleNestedChange = (parent, field, value) => {
    setFormData(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [field]: value
      }
    }));
  };

  const handleTierChange = (index, field, value) => {
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
    setFormData(prev => ({
      ...prev,
      tierConfiguration: newTiers
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.expirationMonths < 1 || formData.expirationMonths > 36) {
      newErrors.expirationMonths = 'Expiration must be between 1 and 36 months';
    }

    if (formData.pointsRules.pointsPerDollar < 1) {
      newErrors.pointsPerDollar = 'Points per dollar must be at least 1';
    }

    if (formData.redemptionRules.minimumRedeemablePoints < 1) {
      newErrors.minimumRedeemablePoints = 'Minimum redeemable points must be at least 1';
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

    try {
      const response = await fetch('http://localhost:5000/api/loyalty/hotel/program', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        alert('Loyalty program configured successfully!');
        onClose();
        // Refresh the page to load the new program
        window.location.reload();
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Error saving loyalty program:', error);
      alert('Failed to save loyalty program. Please try again.');
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
              {formData.tierConfiguration.map((tier, index) => (
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
                        value={tier.minPoints}
                        onChange={(e) => handleTierChange(index, 'minPoints', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Max Points
                      </label>
                      <input
                        type="number"
                        value={tier.maxPoints}
                        onChange={(e) => handleTierChange(index, 'maxPoints', parseInt(e.target.value))}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Tier Color
                      </label>
                      <input
                        type="color"
                        value={tier.color}
                        onChange={(e) => handleTierChange(index, 'color', e.target.value)}
                        className="w-full h-10 px-1 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Benefits (comma-separated)
                    </label>
                    <input
                      type="text"
                      value={tier.benefits.join(', ')}
                      onChange={(e) => handleTierChange(index, 'benefits', e.target.value.split(',').map(b => b.trim()))}
                      placeholder="e.g., Priority support, Free upgrades, Complimentary breakfast"
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Points Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Points Earning Rules</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points per Dollar Spent
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.pointsRules.pointsPerDollar}
                  onChange={(e) => handleNestedChange('pointsRules', 'pointsPerDollar', parseInt(e.target.value))}
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
                  value={formData.pointsRules.pointsPerNight}
                  onChange={(e) => handleNestedChange('pointsRules', 'pointsPerNight', parseInt(e.target.value))}
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
                    value={formData.pointsRules.serviceMultipliers.laundry}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pointsRules: {
                        ...prev.pointsRules,
                        serviceMultipliers: {
                          ...prev.pointsRules.serviceMultipliers,
                          laundry: parseFloat(e.target.value)
                        }
                      }
                    }))}
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
                    value={formData.pointsRules.serviceMultipliers.transportation}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pointsRules: {
                        ...prev.pointsRules,
                        serviceMultipliers: {
                          ...prev.pointsRules.serviceMultipliers,
                          transportation: parseFloat(e.target.value)
                        }
                      }
                    }))}
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
                    value={formData.pointsRules.serviceMultipliers.tourism}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pointsRules: {
                        ...prev.pointsRules,
                        serviceMultipliers: {
                          ...prev.pointsRules.serviceMultipliers,
                          tourism: parseFloat(e.target.value)
                        }
                      }
                    }))}
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
                    value={formData.pointsRules.serviceMultipliers.housekeeping}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      pointsRules: {
                        ...prev.pointsRules,
                        serviceMultipliers: {
                          ...prev.pointsRules.serviceMultipliers,
                          housekeeping: parseFloat(e.target.value)
                        }
                      }
                    }))}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Redemption Rules */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">Points Redemption Rules</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Points to Money Ratio
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.redemptionRules.pointsToMoneyRatio}
                  onChange={(e) => handleNestedChange('redemptionRules', 'pointsToMoneyRatio', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.redemptionRules.pointsToMoneyRatio} points = $1
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Minimum Redemption Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.redemptionRules.minimumRedemption}
                  onChange={(e) => handleNestedChange('redemptionRules', 'minimumRedemption', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Minimum {formData.redemptionRules.minimumRedemption} points = $
                  {(formData.redemptionRules.minimumRedemption / formData.redemptionRules.pointsToMoneyRatio).toFixed(2)}
                </p>
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
