/**
 * Service Category Selector - Two-tier category system
 * Allows service providers to choose between Outside Hotel Services and Inside Hotel Services
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaBuilding,
  FaHotel,
  FaArrowRight,
  FaTshirt,
  FaCar,
  FaMapMarkedAlt,
  FaSpa,
  FaUtensils,
  FaMusic,
  FaShoppingBag,
  FaDumbbell,
  FaConciergeBell,
  FaCoffee
} from 'react-icons/fa';

const ServiceCategorySelector = ({ onCategoryTypeSelect }) => {
  const { t } = useTranslation();
  const [hoveredCard, setHoveredCard] = useState(null);

  const categoryTypes = [
    {
      id: 'outside',
      title: 'Outside Hotel Services',
      description: 'Services provided by external service providers',
      icon: FaBuilding,
      color: 'blue',
      services: [
        { name: 'Laundry Services', icon: FaTshirt, description: 'Professional laundry and dry cleaning' },
        { name: 'Transportation Services', icon: FaCar, description: 'Vehicle rental and transportation' },
        { name: 'Tours & Activities', icon: FaMapMarkedAlt, description: 'Guided tours and recreational activities' },
        { name: 'Spa & Wellness', icon: FaSpa, description: 'Relaxation and wellness services' },
        { name: 'Dining Services', icon: FaUtensils, description: 'Food delivery and catering services' },
        { name: 'Entertainment', icon: FaMusic, description: 'Live music, DJ services, and events' },
        { name: 'Shopping Services', icon: FaShoppingBag, description: 'Personal shopping and delivery services' },
        { name: 'Fitness Services', icon: FaDumbbell, description: 'Personal training and sports activities' }
      ]
    },
    {
      id: 'inside',
      title: 'Inside Hotel Services',
      description: 'Services provided within hotel premises',
      icon: FaHotel,
      color: 'green',
      services: [
        { name: 'Room Service', icon: FaConciergeBell, description: 'In-room dining and service requests' },
        { name: 'Hotel Restaurant', icon: FaCoffee, description: 'Main dining facilities and reservations' },
        { name: 'Concierge Services', icon: FaConciergeBell, description: 'Guest assistance and recommendations' },
        { name: 'Housekeeping', icon: FaHotel, description: 'Room cleaning and maintenance requests' }
      ]
    }
  ];

  const handleCategoryTypeClick = (categoryType) => {
    console.log('Category clicked:', categoryType.id);

    if (onCategoryTypeSelect) {
      onCategoryTypeSelect(categoryType);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Categories</h1>
        <p className="text-gray-600 mb-6">
          Select the type of services you want to offer. You can activate multiple categories and manage them independently.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {categoryTypes.map((categoryType) => {
          const IconComponent = categoryType.icon;
          const isHovered = hoveredCard === categoryType.id;

          return (
            <div
              key={categoryType.id}
              className={`
                relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 cursor-pointer
                ${isHovered ? 'shadow-2xl transform scale-105' : 'hover:shadow-xl'}
                ${categoryType.color === 'blue'
                  ? 'border-2 border-transparent hover:border-blue-200'
                  : 'border-2 border-transparent hover:border-green-200'
                }
              `}
              onClick={() => handleCategoryTypeClick(categoryType)}
              onMouseEnter={() => setHoveredCard(categoryType.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Header */}
              <div className={`${categoryType.color === 'blue' ? 'bg-blue-500' : 'bg-green-500'} text-white p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className="p-3 bg-white bg-opacity-20 rounded-full mr-4">
                      <IconComponent className="text-2xl" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">{categoryType.title}</h2>
                      <p className="text-sm opacity-90">{categoryType.description}</p>
                    </div>
                  </div>
                  <FaArrowRight className={`text-lg transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`} />
                </div>
              </div>

              {/* Services Preview */}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available Services:</h3>
                <div className="space-y-3">
                  {categoryType.services.slice(0, 4).map((service, index) => {
                    const ServiceIcon = service.icon;
                    return (
                      <div key={index} className="flex items-center p-3 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full mr-3 ${
                          categoryType.color === 'blue'
                            ? 'bg-blue-100 text-blue-600'
                            : 'bg-green-100 text-green-600'
                        }`}>
                          <ServiceIcon className="text-sm" />
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-medium text-gray-800">{service.name}</h4>
                          <p className="text-xs text-gray-600">{service.description}</p>
                        </div>
                      </div>
                    );
                  })}
                  {categoryType.services.length > 4 && (
                    <div className="text-center">
                      <span className="text-sm text-gray-500">
                        +{categoryType.services.length - 4} more services
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                <button className={`
                  w-full py-3 px-4 rounded-lg font-medium transition-all duration-200
                  ${categoryType.color === 'blue'
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : 'bg-green-500 hover:bg-green-600'
                  } text-white
                  flex items-center justify-center
                `}>
                  <span>Select {categoryType.title}</span>
                  <FaArrowRight className="ml-2" />
                </button>
              </div>

              {/* Hover Overlay */}
              {isHovered && (
                <div className="absolute inset-0 bg-black bg-opacity-5 pointer-events-none transition-opacity duration-300" />
              )}
            </div>
          );
        })}
      </div>

      {/* Information Section */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">How it works</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-blue-800 text-sm">
          <ul className="space-y-2">
            <li>• <strong>Outside Hotel Services:</strong> Partner with external service providers</li>
            <li>• Set markup percentages on service provider base prices</li>
            <li>• Guests pay final price (base + markup)</li>
            <li>• Hotel receives markup, provider receives base price</li>
          </ul>
          <ul className="space-y-2">
            <li>• <strong>Inside Hotel Services:</strong> Services you provide within hotel premises</li>
            <li>• Direct service delivery to hotel guests</li>
            <li>• On-site service management and execution</li>
            <li>• Coordinate with hotel staff for seamless service</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ServiceCategorySelector;
