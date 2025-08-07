/**
 * Laundry Item Management System
 * Manages individual laundry items and their base pricing for different service types
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
    star: "⭐"
  };

  return <span className={className}>{icons[type] || "❓"}</span>;
};

const LaundryItemManager = () => {
  // Item Manager State
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [editFormData, setEditFormData] = useState(null);
  const [categoryTemplate, setCategoryTemplate] = useState(null);
  const [availableItems, setAvailableItems] = useState([]);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    isPackageService: true,
    expressSurcharge: 0, // Separate express surcharge field
    serviceCombinations: [
      { id: 'wash_only', name: 'Wash Only', icon: '🧼', price: 0, duration: '24 hours' },
      { id: 'iron_only', name: 'Iron Only', icon: '👕', price: 0, duration: '12 hours' },
      { id: 'wash_iron', name: 'Wash & Iron', icon: '⭐', price: 0, duration: '24 hours', isPopular: true },
      { id: 'dry_cleaning', name: 'Dry Cleaning', icon: '✨', price: 0, duration: '48 hours' }
    ]
  });

  useEffect(() => {
    fetchCategoryTemplate();
    fetchItems();
  }, []);

  /**
   * Fetch laundry category template from backend
   */
  const fetchCategoryTemplate = async () => {
    try {
      const response = await apiClient.get('/service/category-templates/laundry');
      const template = response.data.data.template;
      setCategoryTemplate(template);
      setAvailableItems(template.items || []);
    } catch (error) {
      console.error('Error fetching category template:', error);
      toast.error('Failed to load laundry template');
    }
  };

  const fetchItems = async () => {
    try {
      console.log('🔄 Fetching laundry items...');
      const response = await apiClient.get('/service/categories/laundry/items');
      console.log('🔄 Fetch response:', response.data);
      const fetchedItems = response.data.data.items || [];

      // Ensure each item has a services array with proper structure
      const normalizedItems = fetchedItems.map(item => ({
        ...item,
        services: item.services || [],
        serviceCombinations: item.serviceCombinations || []
      }));

      console.log('🔄 Normalized items:', normalizedItems);
      setItems(normalizedItems);
    } catch (error) {
      console.error('Error fetching laundry items:', error);
      toast.error('Failed to load laundry items');
      setItems([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    try {
      // Validate form
      if (!newItem.name.trim()) {
        toast.error('Item name is required');
        return;
      }

      // Validate that at least one service combination has a price > 0
      const hasValidCombination = newItem.serviceCombinations.some(combo => combo.price > 0);
      if (!hasValidCombination) {
        toast.error('At least one service combination must have a price greater than 0');
        return;
      }

      const response = await apiClient.post('/service/categories/laundry/items', newItem);
      setItems(prev => [...prev, response.data.data.item]);
      toast.success('Laundry package created successfully');
      setShowAddForm(false);
      setNewItem({
        name: '',
        description: '',
        isPackageService: true,
        expressSurcharge: 0, // Reset express surcharge
        serviceCombinations: [
          { id: 'wash_only', name: 'Wash Only', icon: '🧼', price: 0, duration: '24 hours' },
          { id: 'iron_only', name: 'Iron Only', icon: '👕', price: 0, duration: '12 hours' },
          { id: 'wash_iron', name: 'Wash & Iron', icon: '⭐', price: 0, duration: '24 hours', isPopular: true },
          { id: 'dry_cleaning', name: 'Dry Cleaning', icon: '✨', price: 0, duration: '48 hours' }
        ]
      });
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error(error.response?.data?.message || 'Failed to add item');
    }
  };

  // Handle cancel add form
  const handleCancelAdd = () => {
    setShowAddForm(false);
    setNewItem({
      name: '',
      description: '',
      isPackageService: true,
      expressSurcharge: 0, // Reset express surcharge
      serviceCombinations: [
        { id: 'wash_only', name: 'Wash Only', icon: '🧼', price: 0, duration: '24 hours' },
        { id: 'iron_only', name: 'Iron Only', icon: '👕', price: 0, duration: '12 hours' },
        { id: 'wash_iron', name: 'Wash & Iron', icon: '⭐', price: 0, duration: '24 hours', isPopular: true },
        { id: 'dry_cleaning', name: 'Dry Cleaning', icon: '✨', price: 0, duration: '48 hours' }
      ]
    });
  };

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      await apiClient.delete(`/service/categories/laundry/items/${itemId}`);
      setItems(prev => prev.filter(item => item.id !== itemId));
      toast.success('Item deleted successfully');
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to delete item');
    }
  };

  // Handle edit item
  const handleEditItem = (item) => {
    console.log('🔧 Starting edit for item:', item);
    setEditingItem(item.id);
    setEditFormData({
      ...item,
      expressSurcharge: item.expressSurcharge || 0, // Include express surcharge
      serviceCombinations: item.serviceCombinations || [
        { id: 'wash_only', name: 'Wash Only', icon: '🧼', price: 0, duration: '24 hours' },
        { id: 'iron_only', name: 'Iron Only', icon: '👕', price: 0, duration: '12 hours' },
        { id: 'wash_iron', name: 'Wash & Iron', icon: '⭐', price: 0, duration: '24 hours', isPopular: true },
        { id: 'dry_cleaning', name: 'Dry Cleaning', icon: '✨', price: 0, duration: '48 hours' }
      ]
    });
    console.log('🔧 Edit form data set, editingItem:', item.id);
  };

  // Handle save edited item
  const handleSaveEdit = async () => {
    try {
      console.log('💾 Saving edit for item:', editingItem, 'with data:', editFormData);

      if (!editFormData.name.trim()) {
        toast.error('Item name is required');
        return;
      }

      const hasValidCombination = editFormData.serviceCombinations.some(combo => combo.price > 0);
      if (!hasValidCombination) {
        toast.error('At least one service combination must have a price greater than 0');
        return;
      }

      console.log('💾 Request data:', JSON.stringify(editFormData, null, 2));

      const response = await apiClient.put(`/service/categories/laundry/items/${editingItem}`, editFormData);

      console.log('💾 Save response:', response.data);

      setItems(prev => prev.map(item =>
        item.id === editingItem ? response.data.data.item : item
      ));
      toast.success('Item updated successfully');
      setEditingItem(null);
      setEditFormData(null);
    } catch (error) {
      console.error('💾 Error updating item:', error);
      console.error('💾 Error response:', error.response?.data);
      toast.error(error.response?.data?.message || 'Failed to update item');
    }
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingItem(null);
    setEditFormData(null);
  };

  // Calculate price for a service combination
  const calculateCombinationPrice = (basePrice, multiplier) => {
    return (basePrice * multiplier).toFixed(2);
  };

  // Update combination price
  const updateCombinationPrice = (combinationIndex, price) => {
    setNewItem(prev => ({
      ...prev,
      serviceCombinations: prev.serviceCombinations.map((combo, index) =>
        index === combinationIndex
          ? { ...combo, price: parseFloat(price) || 0 }
          : combo
      )
    }));
  };

  // Update edit form combination price
  const updateEditCombinationPrice = (combinationIndex, price) => {
    setEditFormData(prev => ({
      ...prev,
      serviceCombinations: prev.serviceCombinations.map((combo, index) =>
        index === combinationIndex
          ? { ...combo, price: parseFloat(price) || 0 }
          : combo
      )
    }));
  };

  // Migration function to fix items without serviceCombinations
  const migrateItemWithoutCombinations = async (itemId) => {
    try {
      console.log('🔄 Migrating item without service combinations:', itemId);

      const defaultServiceCombinations = [
        { id: 'wash_only', name: 'Wash Only', icon: '🧼', price: 0, duration: '24 hours' },
        { id: 'iron_only', name: 'Iron Only', icon: '👕', price: 0, duration: '12 hours' },
        { id: 'wash_iron', name: 'Wash & Iron', icon: '⭐', price: 0, duration: '24 hours', isPopular: true },
        { id: 'dry_cleaning', name: 'Dry Cleaning', icon: '✨', price: 0, duration: '48 hours' }
      ];

      const response = await apiClient.put(`/service/categories/laundry/items/${itemId}`, {
        serviceCombinations: defaultServiceCombinations,
        isPackageService: true
      });

      console.log('🔄 Migration response:', response.data);
      toast.success('Item migrated to new service combination structure');

      // Refresh the items
      await fetchItems();
    } catch (error) {
      console.error('🔄 Migration error:', error);
      toast.error('Failed to migrate item structure');
    }
  };
  if (loading || !categoryTemplate) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3">Loading laundry template...</span>
      </div>
    );
  }

  // Wrap the entire component render in try-catch
  try {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg">
          {/* Header */}
          <div className="border-b border-gray-200">
            <div className="p-6">
              <h2 className="text-3xl font-bold text-gray-800 flex items-center mb-4">
                <Icon type="soap" className="mr-3 text-blue-500" />
                Laundry Item Manager
              </h2>
              <p className="text-gray-600 mb-6">
                Create and manage individual laundry items with pricing for different service types
              </p>
            </div>
          </div>

          {/* Items Section */}
          <div>
            {/* Items Header */}
            <div className="p-6 border-b border-gray-200 bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Laundry Items Management</h3>
                  <p className="text-gray-600 mt-1">
                    Create and manage individual laundry items with pricing for different service types
                  </p>
                </div>
                <button
                  onClick={() => setShowAddForm(true)}
                  className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                >
                  <Icon type="plus" className="mr-2" />
                  Add New Item
                </button>
              </div>
            </div>

            {/* Add New Item Form */}
            {showAddForm && (
              <div className="border-b border-gray-200 p-6 bg-gray-50">
                <h3 className="text-lg font-semibold mb-4">Add New Laundry Item</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>                    <select
                      value={newItem.name}
                      onChange={(e) => {
                        const selectedItem = availableItems.find(item => item.name === e.target.value);
                        setNewItem(prev => ({
                          ...prev,
                          name: e.target.value,
                          // Auto-populate description if available
                          description: selectedItem ? `${selectedItem.category} item` : prev.description
                        }));
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Select a laundry item...</option>
                      {availableItems.map((item, index) => (
                        <option key={index} value={item.name}>
                          {item.icon} {item.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Optional description for this laundry package"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Service Combinations Pricing */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Service Combination Prices</label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {newItem.serviceCombinations.map((combination, index) => (
                      <div key={combination.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center">
                            <span className="text-2xl mr-2">{combination.icon}</span>
                            <div>
                              <h4 className="font-medium text-gray-800">{combination.name}</h4>
                              <p className="text-sm text-gray-500">{combination.duration}</p>
                            </div>
                          </div>
                          {combination.isPopular && (
                            <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                              POPULAR
                            </span>
                          )}
                        </div>

                        <div className="flex items-center">
                          <span className="text-sm text-gray-600 mr-2">$</span>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={combination.price}
                            onChange={(e) => updateCombinationPrice(index, e.target.value)}
                            placeholder="0.00"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    💡 Set the price for each service combination. Leave at $0.00 to disable that option.
                  </p>
                </div>

                {/* Express Surcharge Section */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Express Service Surcharge (Optional)</label>
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">⚡</span>
                        <div>
                          <h4 className="font-medium text-gray-800">Express Service</h4>
                          <p className="text-sm text-gray-500">Rush 4-hour delivery service</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 mr-2">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newItem.expressSurcharge}
                        onChange={(e) => setNewItem(prev => ({ ...prev, expressSurcharge: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    ⚡ Set an additional surcharge for express 4-hour service. Leave at $0.00 to disable express option.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <button
                    onClick={handleAddItem}
                    className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                  >
                    <Icon type="save" className="mr-2" />
                    Save Item
                  </button>
                  <button
                    onClick={handleCancelAdd}
                    className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                  >
                    <Icon type="times" className="mr-2" />
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="p-6">
              {items.length === 0 ? (
                <div className="text-center py-8">
                  <Icon type="tshirt" className="mx-auto text-4xl text-gray-400 mb-4 block" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No laundry items yet</h3>
                  <p className="text-gray-500">Start by adding your first laundry item above</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => {
                    // Safety check to ensure item has required properties
                    if (!item || !item.id) {
                      console.warn('Invalid item structure:', item);
                      return null;
                    }

                    return (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{item.name}</h3>
                            {item.description && (
                              <p className="text-gray-600 text-sm">{item.description}</p>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className="text-blue-500 hover:text-blue-700 p-1"
                              title="Edit item"
                            >
                              <Icon type="edit" />
                            </button>
                            <button
                              onClick={() => handleDeleteItem(item.id)}
                              className="text-red-500 hover:text-red-700 p-1"
                              title="Delete item"
                            >
                              <Icon type="trash" />
                            </button>
                          </div>
                        </div>

                        {/* Express Surcharge Display */}
                        {item.expressSurcharge > 0 && (
                          <div className="bg-blue-50 rounded-lg p-3 mb-3">
                            <div className="flex items-center">
                              <span className="text-xl mr-2">⚡</span>
                              <div>
                                <h4 className="font-medium text-sm text-blue-800">Express Service Available</h4>
                                <p className="text-xs text-blue-600">Additional ${item.expressSurcharge.toFixed(2)} for 4-hour rush service</p>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Service Combinations Display */}
                        <div className="bg-gray-50 rounded-lg p-3 mt-3">
                          <div className="flex items-center mb-3">
                            <Icon type="package" className="text-blue-500 mr-2" />
                            <span className="font-medium text-sm">Available Service Combinations</span>
                          </div>

                          {item.serviceCombinations && item.serviceCombinations.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {item.serviceCombinations.map((combination) => (
                                <div key={combination.id} className={`bg-white rounded-lg p-3 border ${combination.price > 0 ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                                  <div className="flex items-center mb-2">
                                    <span className="text-xl mr-2">{combination.icon}</span>
                                    <div>
                                      <h4 className="font-medium text-sm text-gray-800">{combination.name}</h4>
                                      <p className="text-xs text-gray-500">{combination.duration}</p>
                                    </div>
                                  </div>
                                  <div className="text-center">
                                    {combination.price > 0 ? (
                                      <span className="text-lg font-bold text-green-600">
                                        ${combination.price.toFixed(2)}
                                      </span>
                                    ) : (
                                      <span className="text-sm font-medium text-red-500">
                                        Price not set
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            // Fallback for legacy items (using basePrice * multiplier)
                            <div>
                              <div className="bg-yellow-100 border border-yellow-300 rounded-lg p-3 mb-3">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-yellow-800">Legacy Item Structure</h4>
                                    <p className="text-xs text-yellow-700">This item needs to be upgraded to support custom pricing</p>
                                  </div>
                                  <button
                                    onClick={() => migrateItemWithoutCombinations(item.id)}
                                    className="bg-yellow-600 hover:bg-yellow-700 text-white px-3 py-1 rounded text-xs font-medium"
                                  >
                                    Fix Structure
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                                <div className="flex justify-between">
                                  <span>🧼 Wash Only</span>
                                  <span className="font-bold text-gray-400">${calculateCombinationPrice(item.basePrice || 0, 1.0)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>👕 Iron Only</span>
                                  <span className="font-bold text-gray-400">${calculateCombinationPrice(item.basePrice || 0, 1.3)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>⭐ Wash & Iron</span>
                                  <span className="font-bold text-gray-400">${calculateCombinationPrice(item.basePrice || 0, 1.4)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>✨ Dry Cleaning</span>
                                  <span className="font-bold text-gray-400">${calculateCombinationPrice(item.basePrice || 0, 2.0)}</span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Edit Form (shows when editing this item) */}
                        {editingItem === item.id && editFormData && (
                          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-3">
                            <h4 className="font-semibold text-gray-800 mb-3">Edit Service Combination Prices</h4>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Item Name</label>                                <select
                                  value={editFormData.name}
                                  onChange={(e) => {
                                    const selectedItem = availableItems.find(item => item.name === e.target.value);
                                    setEditFormData(prev => ({
                                      ...prev,
                                      name: e.target.value,
                                      // Auto-populate description if available
                                      description: selectedItem ? `${selectedItem.category} item` : prev.description
                                    }));
                                  }}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                  <option value="">Select a laundry item...</option>
                                  {availableItems.map((item, index) => (
                                    <option key={index} value={item.name}>
                                      {item.icon} {item.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                                <input
                                  type="text"
                                  value={editFormData.description || ''}
                                  onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                              </div>
                            </div>

                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Update Service Combination Prices</label>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {editFormData.serviceCombinations.map((combination, index) => (
                                  <div key={combination.id} className="border border-gray-200 rounded-lg p-4 bg-white shadow-sm">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center">
                                        <span className="text-2xl mr-2">{combination.icon}</span>
                                        <div>
                                          <h4 className="font-medium text-gray-800">{combination.name}</h4>
                                          <p className="text-sm text-gray-500">{combination.duration}</p>
                                        </div>
                                      </div>
                                      {combination.isPopular && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full font-medium">
                                          POPULAR
                                        </span>
                                      )}
                                    </div>

                                    <div className="flex items-center">
                                      <span className="text-sm text-gray-600 mr-2">$</span>
                                      <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={combination.price}
                                        onChange={(e) => updateEditCombinationPrice(index, e.target.value)}
                                        placeholder="0.00"
                                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                💡 Set the price for each service combination. Leave at $0.00 to disable that option.
                              </p>
                            </div>

                            {/* Express Surcharge Section for Edit */}
                            <div className="mb-4">
                              <label className="block text-sm font-medium text-gray-700 mb-2">Express Service Surcharge (Optional)</label>
                              <div className="bg-white border border-gray-200 rounded-lg p-4">
                                <div className="flex items-center justify-between mb-3">
                                  <div className="flex items-center">
                                    <span className="text-2xl mr-2">⚡</span>
                                    <div>
                                      <h4 className="font-medium text-gray-800">Express Service</h4>
                                      <p className="text-sm text-gray-500">Rush 4-hour delivery service</p>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center">
                                  <span className="text-sm text-gray-600 mr-2">$</span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={editFormData.expressSurcharge || 0}
                                    onChange={(e) => setEditFormData(prev => ({ ...prev, expressSurcharge: parseFloat(e.target.value) || 0 }))}
                                    placeholder="0.00"
                                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-right focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  />
                                </div>
                              </div>
                              <p className="text-sm text-gray-500 mt-2">
                                ⚡ Set an additional surcharge for express 4-hour service. Leave at $0.00 to disable express option.
                              </p>
                            </div>

                            <div className="flex space-x-3">
                              <button
                                onClick={handleSaveEdit}
                                className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                              >
                                <Icon type="save" className="mr-2" />
                                Save Changes
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors duration-200"
                              >
                                <Icon type="times" className="mr-2" />
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering LaundryItemManager:', error);
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-red-800 mb-2">Something went wrong</h2>
          <p className="text-red-600">Please refresh the page or contact support if the problem persists.</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }
};

export default LaundryItemManager;
