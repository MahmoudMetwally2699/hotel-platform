/**
 * Enhanced Laundry Service Creator
 *
 * Simple dropdown-based laundry service creation for service providers:
 * 1. Select items from predefined dropdown
 * 2. Set prices for each service type (Wash Only, Iron Only, Wash + Iron, Dry Cleaning)
 * 3. Add optional express surcharge
 * 4. Create the service package
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import apiClient from '../../services/api.service';

// Icon component using emoji fallbacks
const Icon = ({ type, className = "" }) => {
  const icons = {
    plus: "➕",
    edit: "✏️",
    trash: "🗑️",
    save: "💾",
    times: "✕",
    tshirt: "👕",
    bolt: "⚡",
    clock: "⏰",
    soap: "🧼",
    package: "📦",
    list: "📋",
    check: "✅",
    star: "⭐",
    dollar: "💰"
  };

  return <span className={className}>{icons[type] || "❓"}</span>;
};

const LaundryServiceCreator = () => {
  // State management
  const [loading, setLoading] = useState(false);
  const [categoryTemplate, setCategoryTemplate] = useState(null);
  const [serviceDetails, setServiceDetails] = useState({
    name: '',
    description: '',
    shortDescription: '',
    isActive: true
  });

  // Simple service package with predefined service types
  const [servicePackage, setServicePackage] = useState({
    selectedItems: [], // Items selected from dropdown
    servicePricing: {
      wash_only: { enabled: false, price: 0 },
      iron_only: { enabled: false, price: 0 },
      wash_iron: { enabled: false, price: 0 },
      dry_cleaning: { enabled: false, price: 0 }
    },
    expressSurcharge: { enabled: false, rate: 0 }
  });

  useEffect(() => {
    fetchCategoryTemplate();
  }, []);

  /**
   * Fetch laundry category template from backend
   */
  const fetchCategoryTemplate = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/service/category-templates/laundry');
      setCategoryTemplate(response.data.data.template);
    } catch (error) {
      console.error('Error fetching category template:', error);
      toast.error('Failed to load laundry template');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add item from dropdown selection
   */
  const addItemFromDropdown = (itemName) => {
    if (!itemName) return;

    const item = categoryTemplate.items.find(item => item.name === itemName);
    if (!item) return;

    // Check if item already exists
    if (servicePackage.selectedItems.find(selected => selected.name === item.name)) {
      toast.warn('Item already added to the package');
      return;
    }

    const newItem = {
      ...item,
      id: item.name.toLowerCase().replace(/\s+/g, '_')
    };

    setServicePackage(prev => ({
      ...prev,
      selectedItems: [...prev.selectedItems, newItem]
    }));

    toast.success(`${item.name} added to package`);
  };

  /**
   * Remove item from package
   */
  const removeItem = (itemName) => {
    setServicePackage(prev => ({
      ...prev,
      selectedItems: prev.selectedItems.filter(item => item.name !== itemName)
    }));
    toast.info('Item removed from package');
  };

  /**
   * Update service type pricing
   */
  const updateServicePricing = (serviceTypeId, field, value) => {
    setServicePackage(prev => ({
      ...prev,
      servicePricing: {
        ...prev.servicePricing,
        [serviceTypeId]: {
          ...prev.servicePricing[serviceTypeId],
          [field]: value
        }
      }
    }));
  };

  /**
   * Update express surcharge
   */
  const updateExpressSurcharge = (field, value) => {
    setServicePackage(prev => ({
      ...prev,
      expressSurcharge: {
        ...prev.expressSurcharge,
        [field]: value
      }
    }));
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    if (!serviceDetails.name.trim()) {
      toast.error('Service name is required');
      return false;
    }

    if (servicePackage.selectedItems.length === 0) {
      toast.error('Please select at least one laundry item');
      return false;
    }

    // Check if at least one service type is enabled with price > 0
    const hasValidPricing = Object.values(servicePackage.servicePricing).some(
      pricing => pricing.enabled && pricing.price > 0
    );

    if (!hasValidPricing) {
      toast.error('Please enable at least one service type with a price greater than 0');
      return false;
    }

    return true;
  };

  /**
   * Create the laundry service package
   */
  const createService = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Build service combinations based on enabled service types
      const serviceCombinations = [];

      Object.entries(servicePackage.servicePricing).forEach(([serviceTypeId, pricing]) => {
        if (pricing.enabled && pricing.price > 0) {
          const serviceType = categoryTemplate.serviceTypes.find(st => st.id === serviceTypeId);
          if (serviceType) {
            serviceCombinations.push({
              id: serviceTypeId,
              name: serviceType.name,
              description: serviceType.description,
              serviceTypes: [serviceTypeId],
              duration: serviceType.duration,
              icon: serviceType.icon,
              isPopular: serviceType.isPopular || false,
              price: pricing.price // Base price set by provider
            });
          }
        }
      });

      const serviceData = {
        ...serviceDetails,
        category: 'laundry',
        subcategory: 'package_service',
        serviceType: 'laundry_package',
        isPackageService: true,
        selectedItems: servicePackage.selectedItems,
        serviceCombinations,
        expressSurcharge: servicePackage.expressSurcharge.enabled ? {
          enabled: true,
          rate: servicePackage.expressSurcharge.rate,
          name: categoryTemplate.expressSurcharge.name,
          description: categoryTemplate.expressSurcharge.description,
          duration: categoryTemplate.expressSurcharge.duration,
          icon: categoryTemplate.expressSurcharge.icon
        } : { enabled: false },
        // Set base price as the lowest service combination price for sorting
        pricing: {
          basePrice: Math.min(...serviceCombinations.map(sc => sc.price)),
          pricingType: 'per-item',
          currency: 'USD'
        }
      };

      const response = await apiClient.post('/service/categories/laundry/items', serviceData);

      toast.success('Laundry service package created successfully!');

      // Reset form
      setServiceDetails({
        name: '',
        description: '',
        shortDescription: '',
        isActive: true
      });
      setServicePackage({
        selectedItems: [],
        servicePricing: {
          wash_only: { enabled: false, price: 0 },
          iron_only: { enabled: false, price: 0 },
          wash_iron: { enabled: false, price: 0 },
          dry_cleaning: { enabled: false, price: 0 }
        },
        expressSurcharge: { enabled: false, rate: 0 }
      });

    } catch (error) {
      console.error('Error creating laundry service:', error);
      toast.error(error.response?.data?.message || 'Failed to create laundry service');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !categoryTemplate) {
    return (
      <div className="flex items-center justify-center p-8">
        <Icon type="package" className="text-4xl mr-2" />
        <span>Loading laundry template...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          <Icon type="tshirt" className="mr-2" />
          Create Laundry Service Package
        </h2>
        <p className="text-gray-600">
          Select laundry items from dropdown and set your pricing for different service types
        </p>
      </div>

      {/* Service Details Form */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Package Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Name *
            </label>
            <input
              type="text"
              value={serviceDetails.name}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, name: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="e.g., Complete Laundry Package"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Short Description
            </label>
            <input
              type="text"
              value={serviceDetails.shortDescription}
              onChange={(e) => setServiceDetails(prev => ({ ...prev, shortDescription: e.target.value }))}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Brief package description"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Detailed Description
          </label>
          <textarea
            value={serviceDetails.description}
            onChange={(e) => setServiceDetails(prev => ({ ...prev, description: e.target.value }))}
            rows="3"
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of your laundry service package..."
          />
        </div>
      </div>

      {/* Item Selection Dropdown */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Select Laundry Items</h3>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Add Item to Package
          </label>
          <select
            onChange={(e) => {
              addItemFromDropdown(e.target.value);
              e.target.value = ''; // Reset dropdown
            }}
            className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Choose an item to add...</option>
            {categoryTemplate?.items.map((item, index) => (
              <option key={index} value={item.name}>
                {item.icon} {item.name} ({item.category})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Items Display */}
        {servicePackage.selectedItems.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-700">Selected Items:</h4>
            <div className="flex flex-wrap gap-2">
              {servicePackage.selectedItems.map((item, index) => (
                <div key={index} className="flex items-center bg-blue-100 text-blue-800 px-3 py-2 rounded-lg text-sm">
                  <span className="mr-2">{item.icon}</span>
                  <span className="mr-2">{item.name}</span>
                  <button
                    onClick={() => removeItem(item.name)}
                    className="text-blue-600 hover:text-blue-800 ml-1"
                  >
                    <Icon type="times" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Service Type Pricing */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Service Type Pricing</h3>
        <p className="text-gray-600 mb-4">Set prices for different service types. Enable only the services you want to offer.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categoryTemplate?.serviceTypes.map((serviceType) => (
            <div key={serviceType.id} className="border border-gray-200 rounded-lg p-4 bg-white">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id={serviceType.id}
                    checked={servicePackage.servicePricing[serviceType.id]?.enabled || false}
                    onChange={(e) => updateServicePricing(serviceType.id, 'enabled', e.target.checked)}
                    className="mr-3"
                  />
                  <label htmlFor={serviceType.id} className="font-medium cursor-pointer">
                    {serviceType.icon} {serviceType.name}
                    {serviceType.isPopular && <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">Popular</span>}
                  </label>
                </div>
              </div>

              <p className="text-sm text-gray-600 mb-3">{serviceType.description}</p>
              <p className="text-xs text-gray-500 mb-3">
                Duration: {serviceType.duration.value} {serviceType.duration.unit}
              </p>

              {servicePackage.servicePricing[serviceType.id]?.enabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price per item ($)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={servicePackage.servicePricing[serviceType.id]?.price || ''}
                    onChange={(e) => updateServicePricing(serviceType.id, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Express Surcharge */}
      <div className="mb-8 p-6 bg-gray-50 rounded-lg">
        <h3 className="text-xl font-semibold mb-4">Express Service (Optional)</h3>

        <div className="flex items-center mb-4">
          <input
            type="checkbox"
            id="express-enabled"
            checked={servicePackage.expressSurcharge.enabled}
            onChange={(e) => updateExpressSurcharge('enabled', e.target.checked)}
            className="mr-3"
          />
          <label htmlFor="express-enabled" className="font-medium cursor-pointer">
            ⚡ Offer Express Service ({categoryTemplate?.expressSurcharge?.duration?.value} {categoryTemplate?.expressSurcharge?.duration?.unit})
          </label>
        </div>

        {servicePackage.expressSurcharge.enabled && (
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Express Surcharge Rate ($)
            </label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={servicePackage.expressSurcharge.rate}
              onChange={(e) => updateExpressSurcharge('rate', parseFloat(e.target.value) || 0)}
              className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              placeholder="Additional flat rate for express service"
            />
            <p className="text-sm text-gray-600 mt-2">
              {categoryTemplate?.expressSurcharge?.description}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4">
        <button
          onClick={() => {
            setServiceDetails({
              name: '',
              description: '',
              shortDescription: '',
              isActive: true
            });
            setServicePackage({
              selectedItems: [],
              servicePricing: {
                wash_only: { enabled: false, price: 0 },
                iron_only: { enabled: false, price: 0 },
                wash_iron: { enabled: false, price: 0 },
                dry_cleaning: { enabled: false, price: 0 }
              },
              expressSurcharge: { enabled: false, rate: 0 }
            });
          }}
          className="px-6 py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset Form
        </button>

        <button
          onClick={createService}
          disabled={loading}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? (
            <>
              <Icon type="package" className="mr-2" />
              Creating...
            </>
          ) : (
            <>
              <Icon type="save" className="mr-2" />
              Create Laundry Package
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default LaundryServiceCreator;
