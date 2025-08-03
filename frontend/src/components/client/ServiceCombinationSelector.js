/**
 * Service Combination Selector
 * Component for selecting service combinations in package services
 */

import React, { useEffect } from 'react';

// Icon component using emoji fallbacks
const Icon = ({ type, className = "" }) => {
  const icons = {
    wash: "🧼",
    iron: "👕",
    express: "⚡",
    check: "✅",
    clock: "⏰",
    star: "⭐",
    info: "ℹ️"
  };

  return <span className={className}>{icons[type] || "❓"}</span>;
};

const ServiceCombinationSelector = ({
  service,
  selectedCombination,
  onCombinationChange,
  quantity = 1
}) => {
  // Use service combinations from the service data
  const combinations = service?.serviceCombinations || [
    {
      id: 'washing_only',
      name: 'Wash Only',
      description: 'Machine wash with appropriate detergent',
      serviceTypes: ['washing'],
      price: 5.00,
      duration: '24 hours',
      icon: '🧼',
      isPopular: false
    },
    {
      id: 'iron_only',
      name: 'Iron Only',
      description: 'Professional ironing and pressing',
      serviceTypes: ['ironing'],
      price: 6.50,
      duration: '12 hours',
      icon: '👕',
      isPopular: false
    },
    {
      id: 'wash_iron',
      name: 'Wash & Iron',
      description: 'Complete wash and iron service',
      serviceTypes: ['washing', 'ironing'],
      price: 7.00,
      duration: '24 hours',
      icon: '⭐',
      isPopular: true
    },
    {
      id: 'express_only',
      name: 'Express Service',
      description: 'Rush 4-hour delivery service',
      serviceTypes: ['express'],
      price: 10.00,
      duration: '4 hours',
      icon: '⚡',
      isPopular: false
    },
    {
      id: 'express_wash',
      name: 'Express + Wash',
      description: 'Express wash with 4-hour delivery',
      serviceTypes: ['washing', 'express'],
      price: 11.00,
      duration: '4 hours',
      icon: '⚡',
      isPopular: false
    },
    {
      id: 'express_iron',
      name: 'Express + Iron',
      description: 'Express ironing with 4-hour delivery',
      serviceTypes: ['ironing', 'express'],
      price: 12.50,
      duration: '4 hours',
      icon: '⚡',
      isPopular: false
    },
    {
      id: 'express_wash_iron',
      name: 'All Services',
      description: 'Complete service with 4-hour delivery',
      serviceTypes: ['washing', 'ironing', 'express'],
      price: 14.00,
      duration: '4 hours',
      icon: '✅',
      isPopular: false
    }
  ].filter(combo => combo.price > 0); // Only show combinations with prices set

  const calculateTotal = (combination) => {
    return Math.round(combination.price * quantity * 100) / 100;
  };

  const handleCombinationSelect = (combination) => {
    const totalPrice = calculateTotal(combination);
    onCombinationChange({
      ...combination,
      finalPrice: combination.price,
      totalPrice
    });
  };  useEffect(() => {
    // Auto-select popular combination if none selected
    if (!selectedCombination && service && combinations.length > 0) {
      const popular = combinations.find(c => c.isPopular) || combinations[0];
      if (popular) {
        const totalPrice = Math.round(popular.price * quantity * 100) / 100;
        onCombinationChange({
          ...popular,
          finalPrice: popular.price,
          totalPrice
        });
      }
    }
  }, [selectedCombination, combinations, quantity, onCombinationChange, service]);

  if (!service?.packagePricing?.isPackageService) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex items-center mb-4">
        <Icon type="star" className="text-yellow-500 mr-2" />
        <h3 className="text-lg font-semibold text-gray-800">Choose Your Service</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">        {combinations.map((combination) => {
          const price = combination.price;
          const total = calculateTotal(combination);
          const isSelected = selectedCombination?.id === combination.id;

          return (
            <div
              key={combination.id}
              className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 ${
                isSelected
                  ? 'border-primary-main bg-primary-light bg-opacity-10'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              onClick={() => handleCombinationSelect(combination)}
            >
              {/* Popular Badge */}
              {combination.isPopular && (
                <div className="absolute -top-2 -right-2 bg-yellow-400 text-yellow-800 text-xs font-bold px-2 py-1 rounded-full">
                  POPULAR
                </div>
              )}

              {/* Selection Indicator */}
              <div className="absolute top-3 right-3">
                {isSelected ? (
                  <div className="w-6 h-6 bg-primary-main rounded-full flex items-center justify-center">
                    <Icon type="check" className="text-white text-sm" />
                  </div>
                ) : (
                  <div className="w-6 h-6 border-2 border-gray-300 rounded-full"></div>
                )}
              </div>

              <div className="pr-8">                {/* Service Icon & Name */}
                <div className="flex items-center mb-2">
                  <span className="text-2xl mr-2">{combination.icon}</span>
                  <div>
                    <h4 className="font-medium text-gray-800">{combination.name}</h4>
                    <p className="text-sm text-gray-600">{combination.description}</p>
                  </div>
                </div>

                {/* Service Types */}
                <div className="flex flex-wrap gap-1 mb-3">
                  {combination.serviceTypes.map((type) => (
                    <span
                      key={type}
                      className="inline-block bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full"
                    >
                      {type}
                    </span>
                  ))}
                </div>

                {/* Duration */}
                <div className="flex items-center mb-3">
                  <Icon type="clock" className="text-gray-400 mr-1" />
                  <span className="text-sm text-gray-600">Ready in {combination.duration}</span>
                </div>

                {/* Pricing */}
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Per item:</span>
                    <span className="font-bold text-lg text-gray-800">${price.toFixed(2)}</span>
                  </div>
                  {quantity > 1 && (
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-sm text-gray-600">Total ({quantity} items):</span>
                      <span className="font-bold text-xl text-primary-main">${total.toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Combination Summary */}
      {selectedCombination && (
        <div className="mt-6 p-4 bg-primary-light bg-opacity-10 rounded-lg border border-primary-main border-opacity-20">
          <div className="flex items-center mb-2">
            <Icon type="info" className="text-primary-main mr-2" />
            <span className="font-medium text-primary-main">Selected Service</span>
          </div>
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium text-gray-800">{selectedCombination.name}</span>
              {quantity > 1 && (
                <span className="text-sm text-gray-600 ml-2">× {quantity} items</span>
              )}
            </div>
            <span className="text-xl font-bold text-primary-main">
              ${selectedCombination.totalPrice.toFixed(2)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServiceCombinationSelector;
