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
  FaCheck,
  FaPlus,
  FaSpinner
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { handleApiError, showErrorToast, showSuccessToast } from '../../utils/errorHandler';

const categoryIcons = {
  laundry: FaTshirt,
  transportation: FaCar,
  tours: FaMapMarkedAlt,
  spa: FaSpa,
  dining: FaUtensils,
  entertainment: FaMusic,
  shopping: FaShoppingBag,
  fitness: FaDumbbell
};

const CategorySelectionDashboard = ({ onCategorySelect }) => {
  const [categories, setCategories] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  useEffect(() => {
    fetchCategories();
  }, []);  const fetchCategories = async () => {
    try {
      const response = await apiClient.get('/service/categories');
      setCategories(response.data.data.availableCategories);
      setActiveCategories(response.data.data.activeCategories || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);

      // Fallback to local category data if API fails
      const fallbackCategories = {
        laundry: {
          name: 'Laundry & Dry Cleaning',
          description: 'Professional laundry and dry cleaning services',
          items: [
            { name: 'Shirts', category: 'clothing' },
            { name: 'Pants', category: 'clothing' },
            { name: 'Dresses', category: 'clothing' },
            { name: 'Suits', category: 'formal' }
          ]
        },
        transportation: {
          name: 'Transportation',
          description: 'Car rental, taxi, and airport transfer services',
          vehicleTypes: [
            { name: 'Sedan', capacity: 4 },
            { name: 'SUV', capacity: 7 },
            { name: 'Van', capacity: 12 }
          ]
        },
        tours: {
          name: 'Tours & Tourism',
          description: 'Guided tours and travel experiences',
          tourTypes: [
            { name: 'City Tour', duration: '4 hours' },
            { name: 'Historical Tour', duration: '6 hours' },
            { name: 'Nature Tour', duration: '8 hours' }
          ]
        },
        spa: {
          name: 'Spa & Wellness',
          description: 'Relaxation and wellness services',
          items: [
            { name: 'Massage', duration: '60 min' },
            { name: 'Facial', duration: '45 min' }
          ]
        }
      };

      setCategories(fallbackCategories);
      setActiveCategories([]);
      toast.warn('Using offline mode - some features may be limited');
      setLoading(false);
    }
  };  const activateCategory = async (categoryKey) => {
    setActivating(categoryKey);
    try {
      const response = await apiClient.post(`/service/categories/${categoryKey}/activate`);
      setActiveCategories(prev => [...prev, categoryKey]);
      toast.success(response.data.message);

      // Call the callback if provided
      if (onCategorySelect) {
        onCategorySelect(categoryKey, categories[categoryKey]);
      }
    } catch (error) {
      console.error('Error activating category:', error);

      // Fallback for offline mode - just activate locally
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        setActiveCategories(prev => [...prev, categoryKey]);
        toast.success(`${categories[categoryKey]?.name || categoryKey} activated locally (offline mode)`);

        // Call the callback if provided
        if (onCategorySelect) {
          onCategorySelect(categoryKey, categories[categoryKey]);
        }      } else {
        showErrorToast(error, 'Failed to activate category');
      }
    } finally {
      setActivating(null);
    }
  };
  const deactivateCategory = async (categoryKey) => {
    setActivating(categoryKey);
    try {
      const response = await apiClient.post(`/service/categories/${categoryKey}/deactivate`);
      setActiveCategories(prev => prev.filter(cat => cat !== categoryKey));
      toast.success(response.data.message);
    } catch (error) {
      console.error('Error deactivating category:', error);

      // Fallback for offline mode
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        setActiveCategories(prev => prev.filter(cat => cat !== categoryKey));
        toast.success(`${categories[categoryKey]?.name || categoryKey} deactivated locally (offline mode)`);      } else {
        showErrorToast(error, 'Failed to deactivate category');
      }
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
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Service Categories</h1>
        <p className="text-gray-600 mb-6">
          Select the service categories you want to offer. You can activate multiple categories and manage them independently.
        </p>

        {activeCategories.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">Active Categories</h3>
            <div className="flex flex-wrap gap-2">
              {activeCategories.map(categoryKey => {
                const category = categories[categoryKey];
                const IconComponent = categoryIcons[categoryKey];
                return (
                  <div key={categoryKey} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    <IconComponent className="mr-2" />
                    {category?.name}
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
                    <IconComponent className="text-3xl" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-center mb-2 text-gray-800">
                  {category.name}
                </h3>

                <p className="text-gray-600 text-center text-sm mb-4">
                  {category.description}
                </p>                {isActive ? (
                  <button
                    disabled={isActivating}
                    className={`
                      w-full py-2 px-4 rounded-lg font-medium transition-colors duration-200
                      ${isActivating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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
                        Deactivating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaCheck className="mr-2" />
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
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
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

                {category.vehicleTypes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Vehicle Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.vehicleTypes.slice(0, 2).map((vehicle, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {vehicle.name}
                        </span>
                      ))}
                      {category.vehicleTypes.length > 2 && (
                        <span className="text-gray-400 text-xs">
                          +{category.vehicleTypes.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {category.tourTypes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">Tour Types:</p>
                    <div className="flex flex-wrap gap-1">
                      {category.tourTypes.slice(0, 2).map((tour, index) => (
                        <span
                          key={index}
                          className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs"
                        >
                          {tour.name}
                        </span>
                      ))}
                      {category.tourTypes.length > 2 && (
                        <span className="text-gray-400 text-xs">
                          +{category.tourTypes.length - 2} more
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
            Great! You've activated {activeCategories.length} categor{activeCategories.length === 1 ? 'y' : 'ies'}.
            Now you can create services for each active category.
          </p>
          <button
            onClick={() => window.location.href = '/service/services'}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            Manage Services
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelectionDashboard;
