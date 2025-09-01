/**
 * Menu Item Card Component
 * Beautiful card design for displaying restaurant menu items
 * Responsive for both mobile and desktop
 */

import React from 'react';
import { FaPlus, FaMinus, FaLeaf, FaPepperHot, FaClock } from 'react-icons/fa';
import './MenuItemCard.css';

const MenuItemCard = ({
  item,
  quantity = 0,
  onAdd,
  onIncrease,
  onDecrease,
  isMobile = false
}) => {
  const getSpicyLevelIcon = (level) => {
    const levels = {
      mild: '🌶️',
      medium: '🌶️🌶️',
      hot: '🌶️🌶️🌶️',
      very_hot: '🌶️🌶️🌶️🌶️'
    };
    return levels[level] || '';
  };

  if (isMobile) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden mb-4">
        <div className="flex p-4">
          {/* Image Section */}
          <div className="flex-shrink-0 mr-4">
            <div className="w-20 h-20 bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl overflow-hidden border border-orange-200 menu-item-container">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.name}
                  className="w-full h-full object-contain menu-item-image"
                  style={{ objectPosition: 'center' }}
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-3xl">
                  {item.icon || '🍽️'}
                </div>
              )}
            </div>
          </div>

          {/* Content Section */}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {item.name}
              </h3>
              {quantity > 0 && (
                <div className="flex items-center bg-orange-500 rounded-full px-2 py-1 ml-2">
                  <button
                    onClick={onDecrease}
                    className="text-white text-sm font-bold"
                  >
                    <FaMinus className="w-3 h-3" />
                  </button>
                  <span className="text-white text-sm font-bold mx-2 min-w-[20px] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={onIncrease}
                    className="text-white text-sm font-bold"
                  >
                    <FaPlus className="w-3 h-3" />
                  </button>
                </div>
              )}
            </div>

            {/* Description/Features */}
            {item.description && (
              <div className="mb-2">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {item.description}
                </p>
              </div>
            )}

            {/* Tags/Attributes */}
            <div className="flex flex-wrap gap-1 mb-3">
              {item.isVegetarian && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  <FaLeaf className="w-3 h-3 mr-1" />
                  Veg
                </span>
              )}
              {item.isVegan && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 text-green-800">
                  <FaLeaf className="w-3 h-3 mr-1" />
                  Vegan
                </span>
              )}
              {item.spicyLevel && item.spicyLevel !== 'mild' && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-red-100 text-red-800">
                  <FaPepperHot className="w-3 h-3 mr-1" />
                  {getSpicyLevelIcon(item.spicyLevel)}
                </span>
              )}
              {item.preparationTime && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                  <FaClock className="w-3 h-3 mr-1" />
                  {item.preparationTime}min
                </span>
              )}
            </div>

            {/* Price and Add Button */}
            <div className="flex justify-between items-center">
              <span className="text-lg font-bold text-orange-500">
                €{item.price.toFixed(2)}
              </span>
              {quantity === 0 && (
                <button
                  onClick={onAdd}
                  className="bg-orange-500 text-white rounded-full p-2 hover:bg-orange-600 transition-colors"
                >
                  <FaPlus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Desktop Design - Modern & Attractive
  return (
    <div className="group bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-orange-200 transition-all duration-500 transform hover:-translate-y-1">
      {/* Image Section - Redesigned */}
      <div className="relative h-56 bg-gradient-to-br from-orange-50 via-orange-25 to-amber-50 overflow-hidden">
        {item.imageUrl ? (
          <div className="relative w-full h-full p-4">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-contain rounded-2xl group-hover:scale-105 transition-transform duration-500"
              style={{ objectPosition: 'center' }}
              loading="lazy"
            />
            {/* Subtle overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent rounded-2xl"></div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="bg-white/80 rounded-full p-6 shadow-lg">
              <span className="text-6xl">{item.icon || '🍽️'}</span>
            </div>
          </div>
        )}

        {/* Quantity Controls - Floating Design */}
        {quantity > 0 && (
          <div className="absolute top-3 right-3 flex items-center bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-2 shadow-xl border border-orange-200">
            <button
              onClick={onDecrease}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full p-2 transition-all duration-200"
            >
              <FaMinus className="w-3 h-3" />
            </button>
            <span className="text-orange-600 font-bold mx-3 min-w-[28px] text-center text-lg">
              {quantity}
            </span>
            <button
              onClick={onIncrease}
              className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 rounded-full p-2 transition-all duration-200"
            >
              <FaPlus className="w-3 h-3" />
            </button>
          </div>
        )}

        {/* Dietary indicators - Top Left */}
        <div className="absolute top-3 left-3 flex gap-2">
          {item.isVegetarian && (
            <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
              <FaLeaf className="w-3 h-3" />
            </div>
          )}
          {item.spicyLevel && item.spicyLevel !== 'mild' && (
            <div className="bg-red-500 text-white rounded-full p-2 shadow-lg">
              <FaPepperHot className="w-3 h-3" />
            </div>
          )}
        </div>
      </div>

      {/* Content Section - Enhanced */}
      <div className="p-6 relative">
        {/* Title */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 leading-tight group-hover:text-orange-600 transition-colors duration-300">
          {item.name}
        </h3>

        {/* Description */}
        {item.description && (
          <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
            {item.description}
          </p>
        )}

        {/* Attributes - Compact Pills */}
        <div className="flex flex-wrap gap-2 mb-5">
          {item.isVegan && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-700 border border-green-200">
              Vegan
            </span>
          )}
          {item.preparationTime && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-700 border border-blue-200">
              <FaClock className="w-3 h-3 mr-1" />
              {item.preparationTime}min
            </span>
          )}
          {item.spicyLevel && item.spicyLevel !== 'mild' && (
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-red-100 text-red-700 border border-red-200">
              {getSpicyLevelIcon(item.spicyLevel)}
            </span>
          )}
        </div>

        {/* Price and Add Button - Enhanced Layout */}
        <div className="flex justify-between items-center pt-2 border-t border-gray-100">
          <div className="flex flex-col">
            <span className="text-2xl font-bold text-orange-500 leading-none">
              €{item.price.toFixed(2)}
            </span>
            <span className="text-xs text-gray-500 mt-1">per item</span>
          </div>

          {quantity === 0 ? (
            <button
              onClick={onAdd}
              className="bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl px-6 py-3 hover:from-orange-600 hover:to-orange-700 transition-all duration-300 shadow-lg hover:shadow-xl font-medium flex items-center gap-2 group/btn"
            >
              <FaPlus className="w-4 h-4 group-hover/btn:scale-110 transition-transform duration-200" />
              <span>Add</span>
            </button>
          ) : (
            <div className="bg-orange-50 text-orange-600 rounded-2xl px-4 py-2 font-medium border border-orange-200">
              {quantity} in cart
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItemCard;
