/**
 * Markup Settings Page
 * Allows hotel admins to set markup percentages on service provider base prices
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import { HOTEL_API } from '../../config/api.config';

const MarkupSettingsPage = () => {
  const [categories, setCategories] = useState([
    { id: 'laundry', name: 'Laundry', markup: 0, providers: [] },
    { id: 'transportation', name: 'Transportation', markup: 0, providers: [] },
    { id: 'tourism', name: 'Tourism & Travel', markup: 0, providers: [] }
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Fetch current markup settings
  useEffect(() => {
    const fetchMarkupSettings = async () => {
      try {
        setLoading(true);
        const response = await axios.get(HOTEL_API.MARKUP_SETTINGS);

        // Update categories with fetched markups
        const updatedCategories = [...categories];
        response.data.forEach(setting => {
          const index = updatedCategories.findIndex(cat => cat.id === setting.categoryId);
          if (index !== -1) {
            updatedCategories[index].markup = setting.markupPercentage;
            updatedCategories[index].providers = setting.providers || [];
          }
        });

        setCategories(updatedCategories);
        setLoading(false);
      } catch (err) {
        setError('Failed to load markup settings');
        toast.error('Failed to load markup settings');
        setLoading(false);
        console.error('Error fetching markup settings:', err);
      }
    };

    fetchMarkupSettings();
  }, []);

  const handleCategoryMarkupChange = (categoryId, value) => {
    // Limit to valid percentage (0-100)
    const markupValue = Math.min(100, Math.max(0, parseFloat(value) || 0));

    setCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? { ...category, markup: markupValue }
          : category
      )
    );
  };

  const handleProviderMarkupChange = (categoryId, providerId, value) => {
    // Limit to valid percentage (0-100)
    const markupValue = Math.min(100, Math.max(0, parseFloat(value) || 0));

    setCategories(prevCategories =>
      prevCategories.map(category =>
        category.id === categoryId
          ? {
              ...category,
              providers: category.providers.map(provider =>
                provider._id === providerId
                  ? { ...provider, customMarkup: markupValue }
                  : provider
              )
            }
          : category
      )
    );
  };

  const saveMarkupSettings = async () => {
    try {
      setSaving(true);

      const markupData = categories.map(category => ({
        categoryId: category.id,
        markupPercentage: category.markup,
        providers: category.providers.map(provider => ({
          providerId: provider._id,
          customMarkup: provider.customMarkup || category.markup
        }))
      }));

      await axios.post(HOTEL_API.MARKUP_SETTINGS, markupData);

      toast.success('Markup settings saved successfully');
      setSaving(false);
    } catch (err) {
      toast.error('Failed to save markup settings');
      console.error('Error saving markup settings:', err);
      setSaving(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-screen">Loading markup settings...</div>;
  if (error) return <div className="text-red-500 text-center">{error}</div>;

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Markup Settings</h1>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded disabled:bg-blue-300"
          onClick={saveMarkupSettings}
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">How Markup Works</h2>
        <p className="text-gray-600 mb-4">
          Set markup percentages for each service category. This percentage will be added to the base price of services.
          The final price shown to guests will include this markup. You can also set custom markups for individual providers.
        </p>
        <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2h-1V9a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Formula</h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>Final Price = Base Price + (Base Price × Markup Percentage)</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Markup Settings */}
      <div className="space-y-6">
        {categories.map(category => (
          <div key={category.id} className="bg-white shadow-md rounded-lg overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{category.name} Services</h3>
                <div className="flex items-center">
                  <label className="block text-sm font-medium text-gray-700 mr-2">
                    Category Markup %:
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={category.markup}
                    onChange={(e) => handleCategoryMarkupChange(category.id, e.target.value)}
                    className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-20"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Default markup for all {category.name.toLowerCase()} services unless custom provider markup is set.
              </p>
            </div>

            {/* Provider-specific markups */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Provider
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Base Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Custom Markup %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Final Price
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {category.providers.length > 0 ? (
                    category.providers.map(provider => {
                      const effectiveMarkup = provider.customMarkup !== undefined ? provider.customMarkup : category.markup;
                      const finalPrice = provider.basePrice + (provider.basePrice * (effectiveMarkup / 100));

                      return (
                        <tr key={provider._id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900">{provider.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-gray-500">${provider.basePrice.toFixed(2)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={provider.customMarkup !== undefined ? provider.customMarkup : category.markup}
                              onChange={(e) => handleProviderMarkupChange(category.id, provider._id, e.target.value)}
                              className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 w-20"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="font-bold text-green-600">${finalPrice.toFixed(2)}</div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                        No {category.name.toLowerCase()} service providers found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MarkupSettingsPage;
