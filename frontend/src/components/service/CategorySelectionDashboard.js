import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
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
  FaSpinner,
  FaTimes
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { showErrorToast } from '../../utils/errorHandler';

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

const CategorySelectionDashboard = ({ onCategorySelect, onBackToCategories }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/service/categories');
      const availableCategories = response.data.data.availableCategories;

      // Filter out dining and housekeeping categories - these are only for inside hotel services
      const filteredCategories = {};
      Object.keys(availableCategories).forEach(categoryKey => {
        // Only show laundry and transportation as main outside categories
        if (categoryKey === 'laundry' || categoryKey === 'transportation') {
          filteredCategories[categoryKey] = availableCategories[categoryKey];
        }
      });

      setCategories(filteredCategories);

      // Filter active categories to only include the ones we're showing
      const filteredActiveCategories = (response.data.data.activeCategories || [])
        .filter(cat => cat === 'laundry' || cat === 'transportation');
      setActiveCategories(filteredActiveCategories);

      // Show message if provided by backend
      if (response.data.data.message) {
        toast.info(response.data.data.message);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);

      // Fallback to local category data if API fails - only show laundry and transportation
      const fallbackCategories = {
        laundry: {
          name: 'Laundry Services', // t('categorySelection.categories.laundry.name'),
          description: 'Professional laundry and dry cleaning', // t('categorySelection.categories.laundry.description'),
          items: [
            { name: 'T-Shirt', category: 'clothing' },
            { name: 'Dress Shirt', category: 'clothing' },
            { name: 'Short Sleeve Shirt', category: 'clothing' },
            { name: 'Suits', category: 'formal' }
          ]
        },
        transportation: {
          name: 'Transportation Services', // t('categorySelection.categories.transportation.name'),
          description: 'Vehicle rental and transportation', // t('categorySelection.categories.transportation.description'),
          vehicleTypes: [
            { name: 'Economy Sedan', capacity: 4 },
            { name: 'Comfort Sedan', capacity: 4 },
            { name: 'Van', capacity: 12 }
          ]
        }
      };

      setCategories(fallbackCategories);
      setActiveCategories([]);
      toast.warn(t('categorySelection.offlineMode'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const activateCategory = async (categoryKey) => {
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

      // Handle specific authorization error (403)
      if (error.response?.status === 403) {
        toast.error(error.response.data.message || 'You are not authorized to activate this service category. Please contact your hotel admin.');
        return;
      }

      // Fallback for offline mode - just activate locally
      if (error.response?.status === 404 || error.code === 'ERR_NETWORK') {
        setActiveCategories(prev => [...prev, categoryKey]);
        toast.success(`${categories[categoryKey]?.name || categoryKey} ${t('categorySelection.activatedLocally')}`);

        // Call the callback if provided
        if (onCategorySelect) {
          onCategorySelect(categoryKey, categories[categoryKey]);
        }
      } else {
        showErrorToast(error, t('categorySelection.failedToActivate'));
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
        toast.success(`${categories[categoryKey]?.name || categoryKey} ${t('categorySelection.deactivatedLocally')}`);
      } else {
        showErrorToast(error, t('categorySelection.failedToDeactivate'));
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Service Categories</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
                Loading available service categories...
              </p>
            </div>
          </div>
        </div>

        {/* Beautiful Loading Animation */}
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
          <div className="flex justify-center items-center h-96">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#67BAE0] border-t-transparent"></div>
              <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-[#3B5787] border-t-transparent animate-ping opacity-20"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6">
        {/* Modern Header Section - Mobile Responsive */}
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>

          <div className="relative flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Service Categories</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
                Select the service categories you want to offer. You can activate multiple categories and manage them independently.
              </p>
            </div>
            {onBackToCategories && (
              <button
                onClick={onBackToCategories}
                className="bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-300 border border-white/20 text-sm sm:text-base shrink-0"
              >
                Back to Categories
              </button>
            )}
          </div>
        </div>

        {activeCategories.length > 0 && (
          <div className="mb-4 sm:mb-6 lg:mb-8 p-4 sm:p-6 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100">
            <div className="flex items-center mb-3 sm:mb-4">
              <div className="w-1 h-6 sm:h-8 bg-gradient-to-b from-[#3B5787] to-[#67BAE0] rounded-full mr-3 sm:mr-4"></div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-900">Active Categories</h3>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              {activeCategories.map(categoryKey => {
                const IconComponent = categoryIcons[categoryKey];
                const categoryName = categories[categoryKey]?.name || categoryKey;
                return (
                  <div key={categoryKey} className="flex items-center bg-gradient-to-r from-green-50 to-green-100 text-green-800 px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl text-xs sm:text-sm font-medium border border-green-200 shadow-sm">
                    {IconComponent && <IconComponent className="mr-1.5 sm:mr-2 text-green-600 text-sm sm:text-base" />}
                    <span className="truncate max-w-[120px] sm:max-w-none">{categoryName}</span>
                    <FaCheck className="ml-1.5 sm:ml-2 text-green-600 text-xs sm:text-sm shrink-0" />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* No Categories Available Message */}
        {Object.keys(categories).length === 0 && (
          <div className="text-center py-12 px-6">
            <div className="max-w-md mx-auto">
              <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 shadow-lg">
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaTimes className="w-8 h-8 text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">No Service Categories Available</h3>
                <p className="text-gray-600 mb-4 leading-relaxed">
                  No service categories are currently enabled for your account. Please contact your hotel admin to enable service categories for your provider account.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Contact your hotel administrator to:</p>
                  <ul className="mt-2 space-y-1 text-left">
                    <li>• Enable service categories</li>
                    <li>• Configure your service permissions</li>
                    <li>• Set up your provider account</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
        {Object.keys(categories).length > 0 && Object.entries(categories).map(([categoryKey, category]) => {
          const IconComponent = categoryIcons[categoryKey];
          const isActive = isCategoryActive(categoryKey);
          const isActivating = activating === categoryKey;
          const isComingSoon = category.comingSoon;

          return (
            <div
              key={categoryKey}
              className={`
                group relative bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-500 border border-gray-100
                ${isActive
                  ? 'ring-2 ring-green-500 bg-gradient-to-br from-green-50 to-white sm:scale-105'
                  : isComingSoon
                  ? 'opacity-75 cursor-not-allowed border-gray-200'
                  : 'hover:shadow-2xl sm:hover:scale-105 sm:hover:-translate-y-2 cursor-pointer hover:border-[#67BAE0]/30'
                }
              `}
              onClick={!isActive && !isActivating && !isComingSoon ? () => activateCategory(categoryKey) : undefined}
            >
              {isActive && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-full p-1.5 sm:p-2 shadow-lg">
                  <FaCheck className="w-3 h-3 sm:w-5 sm:h-5" />
                </div>
              )}

              {isComingSoon && (
                <div className="absolute top-3 right-3 sm:top-4 sm:right-4 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-full px-2 py-0.5 sm:px-3 sm:py-1 shadow-lg">
                  <span className="text-xs font-semibold">Coming Soon</span>
                </div>
              )}

              <div className="p-4 sm:p-6 lg:p-8">
                <div className="flex items-center justify-center mb-4 sm:mb-6">
                  <div className={`
                    p-3 sm:p-4 lg:p-5 rounded-xl sm:rounded-2xl transition-all duration-300
                    ${isActive
                      ? 'bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg'
                      : isComingSoon
                      ? 'bg-gray-100 text-gray-400'
                      : 'bg-gradient-to-br from-[#3B5787]/10 to-[#67BAE0]/10 text-[#3B5787] group-hover:from-[#3B5787] group-hover:to-[#67BAE0] group-hover:text-white group-hover:shadow-lg'
                    }
                  `}>
                    {IconComponent && <IconComponent className="text-2xl sm:text-3xl lg:text-4xl" />}
                  </div>
                </div>

                <h3 className="text-lg sm:text-xl font-bold text-center mb-2 sm:mb-3 text-gray-900">
                  {category.name}
                </h3>

                <p className={`text-center text-xs sm:text-sm mb-4 sm:mb-6 leading-relaxed ${
                  isComingSoon ? 'text-gray-500' : 'text-gray-600'
                }`}>
                  {category.description}
                </p>

                {isActive ? (
                  <button
                    disabled={isActivating}
                    className={`
                      w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg text-sm sm:text-base
                      ${isActivating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-red-500 hover:bg-red-600 text-white hover:shadow-xl transform sm:hover:scale-105'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActivating) deactivateCategory(categoryKey);
                    }}
                  >
                    {isActivating ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-1.5 sm:mr-2 text-sm" />
                        <span>Deactivate</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaTimes className="mr-1.5 sm:mr-2 text-sm" />
                        <span>Deactivate</span>
                      </div>
                    )}
                  </button>
                ) : (
                  <button
                    disabled={isActivating || isComingSoon}
                    className={`
                      w-full py-2.5 sm:py-3 px-4 sm:px-6 rounded-lg sm:rounded-xl font-semibold transition-all duration-300 shadow-lg text-sm sm:text-base
                      ${isActivating
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : isComingSoon
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4065] hover:to-[#3B5787] text-white transform sm:hover:scale-105 group-hover:shadow-xl'
                      }
                    `}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isActivating && !isComingSoon) activateCategory(categoryKey);
                    }}
                  >
                    {isActivating ? (
                      <div className="flex items-center justify-center">
                        <FaSpinner className="animate-spin mr-1.5 sm:mr-2 text-sm" />
                        <span>Activate</span>
                      </div>
                    ) : isComingSoon ? (
                      <div className="flex items-center justify-center">
                        <span>Coming Soon</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaPlus className="mr-1.5 sm:mr-2 text-sm" />
                        <span>Activate</span>
                      </div>
                    )}
                  </button>
                )}

                {/* Modern Sample Services Preview */}
                {category.items && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Sample Services:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {category.items.slice(0, 3).map((item, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 text-[#3B5787] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border border-[#67BAE0]/20"
                        >
                          {item.name}
                        </span>
                      ))}
                      {category.items.length > 3 && (
                        <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          +{category.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {category.vehicleTypes && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Vehicle Types:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {category.vehicleTypes.slice(0, 2).map((vehicle, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-[#67BAE0]/5 to-[#3B5787]/5 text-[#3B5787] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border border-[#3B5787]/20"
                        >
                          {vehicle.name}
                        </span>
                      ))}
                      {category.vehicleTypes.length > 2 && (
                        <span className="text-gray-500 text-xs font-medium bg-gray-100 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">
                          +{category.vehicleTypes.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {category.tourTypes && (
                  <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-100">
                    <p className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Tour Types:</p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {category.tourTypes.slice(0, 2).map((tour, index) => (
                        <span
                          key={index}
                          className="bg-gradient-to-r from-[#3B5787]/5 to-[#67BAE0]/5 text-[#67BAE0] px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-medium border border-[#67BAE0]/20"
                        >
                          {tour.name}
                        </span>
                      ))}
                      {category.tourTypes.length > 2 && (
                        <span className="text-gray-500 text-xs font-medium bg-gray-100 px-3 py-1 rounded-full">
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
          <div className="mt-6 sm:mt-8 text-center bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 lg:p-8 border border-gray-100">
            <div className="max-w-2xl mx-auto">
              <p className="text-sm sm:text-base lg:text-lg text-gray-700 mb-4 sm:mb-6 leading-relaxed">
                🎉 You have successfully activated {activeCategories.length} service {activeCategories.length === 1 ? 'category' : 'categories'}!
                You can now start managing your services and accepting bookings.
              </p>
              <button
                onClick={() => window.location.href = '/service/services'}
                className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4065] hover:to-[#3B5787] text-white px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base lg:text-lg transition-all duration-300 shadow-lg hover:shadow-xl transform sm:hover:scale-105 w-full sm:w-auto"
              >
                Manage Services
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategorySelectionDashboard;
