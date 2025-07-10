import React, { useState, useEffect } from 'react';
import { FaPlus, FaMinus, FaSave, FaSpinner, FaCheck } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';

const LaundryServiceCreator = ({ categoryTemplate, onServiceCreated }) => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [serviceTypes, setServiceTypes] = useState([]);
  const [services, setServices] = useState([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (categoryTemplate) {
      setServiceTypes(categoryTemplate.serviceTypes || []);
    }
  }, [categoryTemplate]);

  const handleItemSelection = (item) => {
    setSelectedItems(prev => {
      const exists = prev.find(selected => selected.name === item.name);
      if (exists) {
        return prev.filter(selected => selected.name !== item.name);
      } else {
        return [...prev, { ...item, selectedTypes: [], customPrice: item.basePrice }];
      }
    });
  };

  const handleServiceTypeSelection = (itemName, serviceType) => {
    setSelectedItems(prev =>
      prev.map(item => {
        if (item.name === itemName) {
          const exists = item.selectedTypes.find(type => type.id === serviceType.id);
          if (exists) {
            return {
              ...item,
              selectedTypes: item.selectedTypes.filter(type => type.id !== serviceType.id)
            };
          } else {
            return {
              ...item,
              selectedTypes: [...item.selectedTypes, serviceType]
            };
          }
        }
        return item;
      })
    );
  };

  const updateCustomPrice = (itemName, price) => {
    setSelectedItems(prev =>
      prev.map(item =>
        item.name === itemName ? { ...item, customPrice: parseFloat(price) || 0 } : item
      )
    );
  };

  const generateServices = () => {
    const generatedServices = [];

    selectedItems.forEach(item => {
      item.selectedTypes.forEach(serviceType => {
        const finalPrice = item.customPrice * (1 + serviceType.priceModifier);

        generatedServices.push({
          name: `${item.name} - ${serviceType.name}`,
          description: `${serviceType.description} for ${item.name}`,
          basePrice: finalPrice,
          category: item.category || 'clothing',
          subcategory: 'laundry',
          serviceType: serviceType.id,
          pricingType: 'per-item',
          combinations: [{
            name: serviceType.name,
            description: serviceType.description,
            basePrice: finalPrice,
            duration: serviceType.duration,
            isPopular: serviceType.isPopular || false,
            features: [serviceType.name]
          }],
          minimumCharge: finalPrice
        });
      });
    });

    setServices(generatedServices);
  };

  const handleSaveServices = async () => {
    if (services.length === 0) {
      toast.error('Please generate services first');
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post('/api/service/categories/laundry/services', {
        services: services
      });

      toast.success(response.data.message);
      if (onServiceCreated) {
        onServiceCreated(services);
      }

      // Reset form
      setSelectedItems([]);
      setServices([]);
    } catch (error) {
      console.error('Error saving services:', error);
      toast.error(error.response?.data?.message || 'Failed to save services');
    } finally {
      setSaving(false);
    }
  };
  const isItemSelected = (item) => {
    return selectedItems.some(selected => selected.name === item.name);
  };

  if (!categoryTemplate) {
    return <div>Loading template...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Laundry Services</h2>

        {/* Step 1: Select Items */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Step 1: Select Laundry Items</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryTemplate.items?.map((item, index) => (
              <div
                key={index}
                className={`
                  p-3 border rounded-lg cursor-pointer transition-all duration-200
                  ${isItemSelected(item)
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
                onClick={() => handleItemSelection(item)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.name}</span>
                  {isItemSelected(item) && <FaCheck className="text-blue-500" />}
                </div>
                <div className="text-sm text-gray-500 mt-1">
                  Base: ${item.basePrice}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Step 2: Configure Selected Items */}
        {selectedItems.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Step 2: Configure Service Types</h3>
            <div className="space-y-6">
              {selectedItems.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-800">{item.name}</h4>
                    <button
                      onClick={() => handleItemSelection(item)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <FaMinus />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Base Price
                      </label>
                      <input
                        type="number"
                        value={item.customPrice}
                        onChange={(e) => updateCustomPrice(item.name, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                        step="0.01"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Service Types
                    </label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {serviceTypes.map((serviceType, typeIndex) => {
                        const isSelected = item.selectedTypes.some(type => type.id === serviceType.id);
                        const finalPrice = item.customPrice * (1 + serviceType.priceModifier);

                        return (
                          <div
                            key={typeIndex}
                            className={`
                              p-3 border rounded-lg cursor-pointer transition-all duration-200
                              ${isSelected
                                ? 'border-green-500 bg-green-50 text-green-700'
                                : 'border-gray-200 hover:border-gray-300'
                              }
                            `}
                            onClick={() => handleServiceTypeSelection(item.name, serviceType)}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-medium">{serviceType.name}</span>
                              {isSelected && <FaCheck className="text-green-500" />}
                            </div>
                            <div className="text-sm text-gray-600 mb-1">
                              {serviceType.description}
                            </div>
                            <div className="text-sm font-medium">
                              ${finalPrice.toFixed(2)}
                              {serviceType.priceModifier > 0 && (
                                <span className="text-green-600 ml-1">
                                  (+{(serviceType.priceModifier * 100).toFixed(0)}%)
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-500">
                              {serviceType.duration.value} {serviceType.duration.unit}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Generate Services */}
        {selectedItems.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Step 3: Generate Services</h3>
              <button
                onClick={generateServices}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
              >
                <FaPlus className="mr-2" />
                Generate Services
              </button>
            </div>

            {services.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-800 mb-3">
                  Generated Services ({services.length})
                </h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {services.map((service, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <div>
                        <span className="font-medium">{service.name}</span>
                        <div className="text-sm text-gray-600">{service.description}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">${service.basePrice.toFixed(2)}</div>
                        <div className="text-sm text-gray-500">{service.pricingType}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    onClick={handleSaveServices}
                    disabled={saving}
                    className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center"
                  >
                    {saving ? (
                      <>
                        <FaSpinner className="animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FaSave className="mr-2" />
                        Save Services
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LaundryServiceCreator;
