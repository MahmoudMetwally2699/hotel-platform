/**
 * Inside Hotel Services Category Selection Dashboard
 * Similar to CategorySelectionDashboard but for inside hotel services
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaCoffee,
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
  'hotel-restaurant': FaCoffee,
  'housekeeping-requests': FaBroom,
  'room-service': FaCoffee
};

const InsideServicesCategorySelection = ({ onCategorySelect, onBackToCategories }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [categories, setCategories] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/service/inside-services');

      // Check if we have inside services data
      const serviceData = response.data.data || [];

      // Show message if provided by backend
      if (response.data.message) {
        toast.info(response.data.message);
      }

      if (serviceData.length === 0) {
        setCategories({});
        setActiveCategories([]);
        setLoading(false);
        return;
      }

      // Transform the response into category format
      const categoriesData = {};
      const activeCats = [];

      serviceData.forEach(service => {
        // Map service to category structure
        if (service.id === 'hotel-restaurant') {
          categoriesData['hotel-restaurant'] = {
            name: 'Hotel Restaurant',
            description: 'Main dining facilities and reservations',
            items: [
              { name: 'Table reservations', category: 'booking' },
              { name: 'Private dining', category: 'special' },
              { name: 'Event catering', category: 'events' },
              { name: 'Wine selection', category: 'beverage' }
            ]
          };
        } else if (service.id === 'housekeeping-requests') {
          categoriesData['housekeeping-requests'] = {
            name: 'Housekeeping Services',
            description: 'Room cleaning and maintenance requests',
            items: [
              { name: 'Extra cleaning', category: 'cleaning' },
              { name: 'Amenity requests', category: 'amenities' },
              { name: 'Maintenance issues', category: 'maintenance' },
              { name: 'Linen change', category: 'cleaning' }
            ]
          };
        } else if (service.id === 'room-service') {
          categoriesData['room-service'] = {
            name: 'Room Service',
            description: 'In-room dining and service requests',
            items: [
              { name: 'Breakfast in bed', category: 'dining' },
              { name: 'Late night snacks', category: 'dining' },
              { name: 'Mini bar restocking', category: 'service' }
            ]
          };
        } else if (service.id === 'concierge-services') {
          categoriesData['concierge-services'] = {
            name: 'Concierge Services',
            description: 'Guest assistance and recommendations',
            items: [
              { name: 'Local recommendations', category: 'guidance' },
              { name: 'Booking assistance', category: 'booking' },
              { name: 'Special requests', category: 'service' }
            ]
          };
        }

        // Track active services
        if (service.isActive) {
          activeCats.push(service.id);
        }
      });

      setCategories(categoriesData);
      setActiveCategories(activeCats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching inside service categories:', error);

      // Enhanced error handling
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'Access denied. Please contact your hotel admin.');
        setCategories({});
        setActiveCategories([]);
      } else {
        // Fallback to empty state on error
        setCategories({});
        setActiveCategories([]);
        toast.error('Failed to load inside services. Please contact your hotel admin.');
      }

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

      // Navigate to specific service management page based on category
      if (categoryKey === 'hotel-restaurant') {
        navigate('/service/restaurant');
      } else if (categoryKey === 'housekeeping-requests') {
        navigate('/service/housekeeping');
      }
      // Add more navigation cases as needed for other services

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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto p-6">
        {/* Modern Header Section */}
        <div className="bg-gradient-to-r from-[#67BAE0] to-[#3B5787] rounded-2xl shadow-2xl p-8 mb-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full"></div>

          <div className="relative flex items-center justify-between">
            <div className="max-w-4xl">
              <h1 className="text-4xl font-bold mb-4">Inside Hotel Services</h1>
              <p className="text-xl text-white/90 leading-relaxed">
                Select and activate the inside hotel services you want to offer. These services are provided within the hotel premises.
              </p>
            </div>
            {onBackToCategories && (
              <button
                onClick={onBackToCategories}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-6 py-3 rounded-xl font-medium transition-all duration-300 border border-white/20"
              >
                Back to Categories
              </button>
            )}
          </div>
        </div>

        {activeCategories.length > 0 && (
          <div className="mb-8 p-6 bg-white rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center mb-4">
              <div className="w-1 h-8 bg-gradient-to-b from-[#67BAE0] to-[#3B5787] rounded-full mr-4"></div>
              <h3 className="text-xl font-bold text-gray-900">Active Inside Services</h3>
            </div>
            <div className="flex flex-wrap gap-3">
              {activeCategories.map(categoryKey => {
                const IconComponent = categoryIcons[categoryKey];
                return (
                  <div key={categoryKey} className="flex items-center bg-gradient-to-r from-green-50 to-green-100 text-green-800 px-4 py-2 rounded-xl text-sm font-medium border border-green-200 shadow-sm">
                    {IconComponent && <IconComponent className="mr-2 text-green-600" />}
                    {categories[categoryKey]?.name}
                    <FaCheck className="ml-2 text-green-600" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No categories available state */}
        {Object.keys(categories).length === 0 && (
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <FaTimes className="text-6xl text-gray-400 mx-auto mb-4" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Inside Hotel Services Available</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                No inside hotel service categories are currently enabled for your account. Please contact your hotel administrator to enable the required service categories such as dining or housekeeping.
              </p>
              {onBackToCategories && (
                <button
                  onClick={onBackToCategories}
                  className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] text-white px-8 py-3 rounded-xl font-semibold hover:shadow-lg transform hover:scale-105 transition-all duration-300"
                >
                  Back to Categories
                </button>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {Object.entries(categories).map(([categoryKey, category]) => {
            const IconComponent = categoryIcons[categoryKey];
            const isActive = isCategoryActive(categoryKey);
            const isActivating = activating === categoryKey;

            return (
              <div
                key={categoryKey}
                className={`
                  group relative bg-white rounded-2xl shadow-xl overflow-hidden transition-all duration-500 border border-gray-100
                  ${isActive
                    ? 'ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-white scale-105'
                    : 'hover:shadow-2xl hover:scale-105 hover:-translate-y-2 cursor-pointer hover:border-[#67BAE0]/30'
                  }
                `}
              onClick={!isActivating ? () => {
                if (isActive) {
                  // Navigate to management page if already active
                  if (categoryKey === 'hotel-restaurant') {
                    navigate('/service/restaurant');
                  } else if (categoryKey === 'housekeeping-requests') {
                    navigate('/service/housekeeping');
                  }
                } else {
                  activateCategory(categoryKey);
                }
              } : undefined}
            >
                {isActive && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full p-2 shadow-lg">
                    <FaCheck className="w-5 h-5" />
                  </div>
                )}

                <div className="p-8">
                  <div className="flex items-center justify-center mb-6">
                    <div className={`
                      p-5 rounded-2xl transition-all duration-300
                      ${isActive
                        ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                        : 'bg-gradient-to-br from-[#67BAE0]/10 to-[#3B5787]/10 text-[#67BAE0] group-hover:from-[#67BAE0] group-hover:to-[#3B5787] group-hover:text-white group-hover:shadow-lg'
                      }
                    `}>
                      {IconComponent && <IconComponent className="text-4xl" />}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-center mb-3 text-gray-900">
                    {category.name}
                  </h3>

                  <p className="text-gray-600 text-center text-sm mb-6 leading-relaxed">
                    {category.description}
                  </p>

                  {isActive ? (
                    <div className="space-y-3">
                      <button
                        disabled={isActivating}
                        className={`
                          w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg
                          ${isActivating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-xl transform hover:scale-105'
                          }
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isActivating) {
                            if (categoryKey === 'hotel-restaurant') {
                              navigate('/service/restaurant');
                            } else if (categoryKey === 'housekeeping-requests') {
                              navigate('/service/housekeeping');
                            }
                          }
                        }}
                      >
                        {isActivating ? (
                          <div className="flex items-center justify-center">
                            <FaSpinner className="animate-spin mr-2" />
                            Processing...
                          </div>
                        ) : (
                          <div className="flex items-center justify-center">
                            <FaCheck className="mr-2" />
                            Manage Service
                          </div>
                        )}
                      </button>
                      <button
                        disabled={isActivating}
                        className={`
                          w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg
                          ${isActivating
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl transform hover:scale-105'
                          }
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isActivating) deactivateCategory(categoryKey);
                        }}
                      >
                        <div className="flex items-center justify-center">
                          <FaTimes className="mr-2" />
                          Deactivate
                        </div>
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isActivating}
                      className={`
                        w-full py-3 px-6 rounded-xl font-semibold transition-all duration-300 shadow-lg group-hover:shadow-xl
                        ${isActivating
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-[#67BAE0] to-[#3B5787] hover:from-[#3B5787] hover:to-[#2A4065] text-white transform hover:scale-105'
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

                  {/* Modern Sample Services Preview */}
                  {category.items && (
                    <div className="mt-6 pt-6 border-t border-gray-100">
                      <p className="text-sm font-medium text-gray-700 mb-3">Sample Services:</p>
                      <div className="flex flex-wrap gap-2">
                        {category.items.slice(0, 3).map((item, index) => (
                          <span
                            key={index}
                            className="bg-gradient-to-r from-[#67BAE0]/5 to-[#3B5787]/5 text-[#3B5787] px-3 py-1 rounded-full text-xs font-medium border border-[#67BAE0]/20"
                          >
                            {item.name}
                          </span>
                        ))}
                        {category.items.length > 3 && (
                          <span className="text-gray-500 text-xs font-medium bg-gray-100 px-3 py-1 rounded-full">
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
          <div className="mt-8 text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <div className="max-w-2xl mx-auto">
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                🏨 Excellent! You have activated {activeCategories.length} inside hotel service{activeCategories.length === 1 ? '' : 's'}!
                Guests can now book these services directly within the hotel premises.
              </p>
              <button
                onClick={() => window.location.href = '/service/inside-services/manage'}
                className="bg-gradient-to-r from-[#67BAE0] to-[#3B5787] hover:from-[#3B5787] hover:to-[#2A4065] text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                Manage Service Details
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InsideServicesCategorySelection;
