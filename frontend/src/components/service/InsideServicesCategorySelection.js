/**
 * Inside Hotel Services Category Selection Dashboard
 * Similar to CategorySelectionDashboard but for inside hotel services
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaConciergeBell,
  FaCoffee,
  FaHotel,
  FaBroom,
  FaCheck,
  FaPlus,
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { showErrorToast } from '../../utils/errorHandler';

const categoryIcons = {
  'room-service': FaConciergeBell,
  'hotel-restaurant': FaCoffee,
  'concierge-services': FaConciergeBell,
  'housekeeping-requests': FaBroom
};

const InsideServicesCategorySelection = ({ onCategorySelect, onBackToCategories }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/service/inside-services');

      // Transform the response into category format
      const categoriesData = {
        'room-service': {
          name: 'Room Service',
          description: 'In-room dining and service requests',
          items: [
            { name: 'Breakfast in bed', category: 'dining' },
            { name: 'Late night snacks', category: 'dining' },
            { name: 'Mini bar restocking', category: 'service' },
            { name: 'Special dietary meals', category: 'dining' }
          ]
        },
        'hotel-restaurant': {
          name: 'Hotel Restaurant',
          description: 'Main dining facilities and reservations',
          items: [
            { name: 'Table reservations', category: 'booking' },
            { name: 'Private dining', category: 'special' },
            { name: 'Event catering', category: 'events' },
            { name: 'Wine selection', category: 'beverage' }
          ]
        },
        'concierge-services': {
          name: 'Concierge Services',
          description: 'Guest assistance and recommendations',
          items: [
            { name: 'Local recommendations', category: 'guidance' },
            { name: 'Booking assistance', category: 'booking' },
            { name: 'Transportation arrangements', category: 'transport' },
            { name: 'Special requests', category: 'service' }
          ]
        },
        'housekeeping-requests': {
          name: 'Housekeeping Services',
          description: 'Room cleaning and maintenance requests',
          items: [
            { name: 'Extra cleaning', category: 'cleaning' },
            { name: 'Amenity requests', category: 'amenities' },
            { name: 'Maintenance issues', category: 'maintenance' },
            { name: 'Linen change', category: 'cleaning' }
          ]
        }
      };

      // Get active categories from response
      const serviceData = response.data.data || [];
      const activeCats = serviceData
        .filter(service => service.isActive)
        .map(service => service.id);

      setCategories(categoriesData);
      setActiveCategories(activeCats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inside service categories:', error);

      // Fallback to local category data if API fails
      const fallbackCategories = {
        'room-service': {
          name: 'Room Service',
          description: 'In-room dining and service requests',
          items: [
            { name: 'Breakfast in bed', category: 'dining' },
            { name: 'Late night snacks', category: 'dining' },
            { name: 'Mini bar restocking', category: 'service' }
          ]
        },
        'hotel-restaurant': {
          name: 'Hotel Restaurant',
          description: 'Main dining facilities and reservations',
          items: [
            { name: 'Table reservations', category: 'booking' },
            { name: 'Private dining', category: 'special' },
            { name: 'Event catering', category: 'events' }
          ]
        },
        'concierge-services': {
          name: 'Concierge Services',
          description: 'Guest assistance and recommendations',
          items: [
            { name: 'Local recommendations', category: 'guidance' },
            { name: 'Booking assistance', category: 'booking' },
            { name: 'Special requests', category: 'service' }
          ]
        },
        'housekeeping-requests': {
          name: 'Housekeeping Services',
          description: 'Room cleaning and maintenance requests',
          items: [
            { name: 'Extra cleaning', category: 'cleaning' },
            { name: 'Amenity requests', category: 'amenities' },
            { name: 'Maintenance issues', category: 'maintenance' }
          ]
        }
      };

      setCategories(fallbackCategories);
      setActiveCategories([]);
      toast.warn('Using default inside service categories. API connection failed.');
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const activateCategory = async (categoryKey) => {
    setActivating(categoryKey);
    try {
      const response = await apiClient.post(`/service/inside-services/${categoryKey}/activate`);
      setActiveCategories(prev => [...prev, categoryKey]);
      toast.success(response.data.message || 'Service activated successfully');

      // Call the callback if provided
      if (onCategorySelect) {
        onCategorySelect(categoryKey, categories[categoryKey]);
      }
    } catch (error) {
      console.error('Error activating inside service category:', error);
      showErrorToast(error, 'Failed to activate service');
    } finally {
      setActivating(null);
    }
  };

  const deactivateCategory = async (categoryKey) => {
    setActivating(categoryKey);
    try {
      const response = await apiClient.post(`/service/inside-services/${categoryKey}/deactivate`);
      setActiveCategories(prev => prev.filter(cat => cat !== categoryKey));
      toast.success(response.data.message || 'Service deactivated successfully');
    } catch (error) {
      console.error('Error deactivating inside service category:', error);
      showErrorToast(error, 'Failed to deactivate service');
    } finally {
      setActivating(null);
    }
  };

  const isCategoryActive = (categoryKey) => {
    return activeCategories.includes(categoryKey);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Inside Hotel Services</h1>
            <p className="text-gray-600 mb-6">
              Select and activate the inside hotel services you want to offer. These services are provided within the hotel premises.
            </p>
          </div>
          {onBackToCategories && (
            <button
              onClick={onBackToCategories}
              className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Back to Categories
            </button>
          )}
        </div>

        {activeCategories.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Active Inside Services</h3>
            <div className="flex flex-wrap gap-2">
              {activeCategories.map(categoryKey => {
                const IconComponent = categoryIcons[categoryKey];
                return (
                  <div key={categoryKey} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {IconComponent && <IconComponent className="mr-2" />}
                    {categories[categoryKey]?.name}
                    <FaCheck className="ml-2 text-green-600" />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Object.entries(categories).map(([categoryKey, category]) => {
          const IconComponent = categoryIcons[categoryKey];
          const isActive = isCategoryActive(categoryKey);
          const isActivating = activating === categoryKey;

          return (
            <div
              key={categoryKey}
              className={`
                relative bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl
                ${isActive
                  ? 'ring-2 ring-green-500 bg-green-50'
                  : 'hover:transform hover:scale-105 cursor-pointer'
                }
              `}
              onClick={!isActive && !isActivating ? () => activateCategory(categoryKey) : undefined}
            >
              {isActive && (
                <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                  <FaCheck className="w-4 h-4" />
                </div>
              )}

              <div className="p-6">
                <div className="flex items-center justify-center mb-4">
                  <div className={`
                    p-4 rounded-full
                    ${isActive
                      ? 'bg-green-100 text-green-600'
                      : 'bg-blue-100 text-blue-600'
                    }
                  `}>
                    {IconComponent && <IconComponent className="text-3xl" />}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-center mb-2 text-gray-800">
                  {category.name}
                </h3>

                <p className="text-gray-600 text-center text-sm mb-4">
                  {category.description}
                </p>

                {isActive ? (
                  <button
                    disabled={isActivating}
                    className={`
                      w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200
                      ${isActivating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActivating) deactivateCategory(categoryKey);
                    }}
                  >
                    {isActivating ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Processing...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaTimes className="mr-2" />
                        Deactivate
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={isActivating}
                    className={`
                      w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200
                      ${isActivating
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-500 hover:bg-blue-600 text-white'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActivating) activateCategory(categoryKey);
                    }}
                  >
                    {isActivating ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-2" />
                        Activating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaPlus className="mr-2" />
                        Activate
                      </div>
                    )}
                  </button>
                )}

                {/* Show sample items/services for preview */}
                {category.items && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Sample Services:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.items.slice(0, 3).map((item, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {item.name}
                        </span>
                      ))}
                      {category.items.length > 3 && (
                        <span className="text-gray-400 text-xs">
                          +{category.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {activeCategories.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 mb-4">
            You have {activeCategories.length} active inside hotel services.
            Guests can now book these services directly within the hotel premises.
          </p>
          <button
            onClick={() => window.location.href = '/service/inside-services/manage'}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Manage Service Details
          </button>
        </div>
      )}
    </div>
  );
};

export default InsideServicesCategorySelection;
