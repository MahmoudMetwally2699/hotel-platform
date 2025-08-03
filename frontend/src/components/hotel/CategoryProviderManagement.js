/**
 * Category Service Provider Management
 * Allows hotel admins to assign specific service providers to service categories
 */

import React, { useState, useEffect } from 'react';
import {
  FaTshirt,
  FaCar,
  FaMapMarkedAlt,
  FaSpa,
  FaUtensils,
  FaMusic,
  FaShoppingBag,
  FaDumbbell,
  FaEdit,
  FaCheck,
  FaTimes,
  FaSpinner,
  FaUser,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const CategoryProviderManagement = () => {
  const [categoryProviders, setCategoryProviders] = useState({});
  const [availableProviders, setAvailableProviders] = useState({});
  const [loading, setLoading] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('');

  const categories = [
    { key: 'laundry', name: 'Laundry Services', icon: FaTshirt, color: 'bg-blue-500' },
    { key: 'transportation', name: 'Transportation', icon: FaCar, color: 'bg-green-500' },
    { key: 'tours', name: 'Tours & Activities', icon: FaMapMarkedAlt, color: 'bg-purple-500' },
    { key: 'spa', name: 'Spa & Wellness', icon: FaSpa, color: 'bg-pink-500' },
    { key: 'dining', name: 'Dining Services', icon: FaUtensils, color: 'bg-orange-500' },
    { key: 'entertainment', name: 'Entertainment', icon: FaMusic, color: 'bg-red-500' },
    { key: 'shopping', name: 'Shopping Services', icon: FaShoppingBag, color: 'bg-yellow-500' },
    { key: 'fitness', name: 'Fitness & Sports', icon: FaDumbbell, color: 'bg-indigo-500' }
  ];

  useEffect(() => {
    fetchCategoryProviders();
  }, []);

  const fetchCategoryProviders = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/hotel/category-providers');
      setCategoryProviders(response.data.data.categoryProviders);
    } catch (error) {
      console.error('Error fetching category providers:', error);
      toast.error('Failed to load category assignments');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableProviders = async (category) => {
    try {
      const response = await apiClient.get(`/hotel/available-providers/${category}`);
      setAvailableProviders(prev => ({
        ...prev,
        [category]: response.data.data.providers
      }));
    } catch (error) {
      console.error('Error fetching available providers:', error);
      toast.error('Failed to load available providers');
    }
  };

  const handleEditCategory = async (category) => {
    setEditingCategory(category);
    setSelectedProvider(categoryProviders[category]?._id || '');
    await fetchAvailableProviders(category);
  };

  const handleSaveAssignment = async () => {
    try {
      const response = await apiClient.put(
        `/hotel/category-providers/${editingCategory}`,
        { serviceProviderId: selectedProvider || null }
      );

      // Update local state
      setCategoryProviders(prev => ({
        ...prev,
        [editingCategory]: response.data.data.serviceProvider
      }));

      setEditingCategory(null);
      setSelectedProvider('');
      toast.success('Category assignment updated successfully');
    } catch (error) {
      console.error('Error updating category assignment:', error);
      toast.error('Failed to update assignment');
    }
  };

  const handleCancelEdit = () => {
    setEditingCategory(null);
    setSelectedProvider('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="text-4xl text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Category Service Provider Management</h2>
        <p className="text-gray-600 mb-6">
          Assign specific service providers to each service category. Each category can have one dedicated provider.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const IconComponent = category.icon;
            const assignedProvider = categoryProviders[category.key];
            const isEditing = editingCategory === category.key;

            return (
              <div
                key={category.key}
                className="bg-white border-2 border-gray-200 rounded-lg p-6 hover:border-gray-300 transition-colors"
              >
                {/* Category Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 ${category.color} text-white rounded-lg`}>
                      <IconComponent className="text-xl" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {category.name}
                      </h3>
                    </div>
                  </div>
                  {!isEditing && (
                    <button
                      onClick={() => handleEditCategory(category.key)}
                      className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <FaEdit className="text-lg" />
                    </button>
                  )}
                </div>

                {/* Assignment Status */}
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Service Provider
                      </label>
                      <select
                        value={selectedProvider}
                        onChange={(e) => setSelectedProvider(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">No provider assigned</option>
                        {availableProviders[category.key]?.map((provider) => (
                          <option key={provider._id} value={provider._id}>
                            {provider.businessName} ({provider.servicesCount} services)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveAssignment}
                        className="flex-1 bg-green-600 text-white px-3 py-2 rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
                      >
                        <FaCheck className="mr-2" />
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="flex-1 bg-gray-600 text-white px-3 py-2 rounded-md hover:bg-gray-700 transition-colors flex items-center justify-center"
                      >
                        <FaTimes className="mr-2" />
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    {assignedProvider ? (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <FaUser className="text-gray-400" />
                          <span className="font-medium text-gray-900">
                            {assignedProvider.businessName}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div className="flex items-center space-x-2">
                            <FaEnvelope className="text-gray-400" />
                            <span>{assignedProvider.email}</span>
                          </div>
                          {assignedProvider.contactPhone && (
                            <div className="flex items-center space-x-2">
                              <FaPhone className="text-gray-400" />
                              <span>{assignedProvider.contactPhone}</span>
                            </div>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            assignedProvider.isActive && assignedProvider.isVerified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {assignedProvider.isActive && assignedProvider.isVerified ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="text-gray-400 mb-2">
                          <FaUser className="text-2xl mx-auto" />
                        </div>
                        <p className="text-gray-500 text-sm">
                          No provider assigned
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                          Click edit to assign a provider
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How it works</h3>
        <ul className="text-blue-800 text-sm space-y-1">
          <li>• Each service category can be assigned to one dedicated service provider</li>
          <li>• Only active and verified providers with services in that category are available for assignment</li>
          <li>• Guests will automatically be directed to the assigned provider for each service category</li>
          <li>• You can change assignments at any time or leave categories unassigned</li>
        </ul>
      </div>
    </div>
  );
};

export default CategoryProviderManagement;
