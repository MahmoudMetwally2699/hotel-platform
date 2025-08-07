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
  FaSpinner
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

const CategorySelectionDashboard = ({ onCategorySelect }) => {
  const { t } = useTranslation();
  const [categories, setCategories] = useState({});
  const [activeCategories, setActiveCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(null);

  const fetchCategories = useCallback(async () => {
    try {
      const response = await apiClient.get('/service/categories');
      setCategories(response.data.data.availableCategories);
      setActiveCategories(response.data.data.activeCategories || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching categories:', error);

      // Fallback to local category data if API fails
      const fallbackCategories = {        laundry: {
          name: t('categorySelection.categories.laundry.name'),
          description: t('categorySelection.categories.laundry.description'),
          items: [
            { name: t('categorySelection.sampleItems.shirts'), category: 'clothing' },
            { name: t('categorySelection.sampleItems.pants'), category: 'clothing' },
            { name: t('categorySelection.sampleItems.dresses'), category: 'clothing' },
            { name: t('categorySelection.sampleItems.suits'), category: 'formal' }
          ]
        },
        transportation: {
          name: t('categorySelection.categories.transportation.name'),
          description: t('categorySelection.categories.transportation.description'),
          vehicleTypes: [
            { name: t('categorySelection.sampleItems.sedan'), capacity: 4 },
            { name: t('categorySelection.sampleItems.suv'), capacity: 7 },
            { name: t('categorySelection.sampleItems.van'), capacity: 12 }
          ]
        },
        tours: {
          name: t('categorySelection.categories.tours.name'),
          description: t('categorySelection.categories.tours.description'),
          tourTypes: [
            { name: t('categorySelection.sampleItems.cityTour'), duration: '4 hours' },
            { name: t('categorySelection.sampleItems.historicalTour'), duration: '6 hours' },
            { name: t('categorySelection.sampleItems.natureTour'), duration: '8 hours' }
          ]
        },
        spa: {
          name: t('categorySelection.categories.spa.name'),
          description: t('categorySelection.categories.spa.description'),
          items: [
            { name: t('categorySelection.sampleItems.massage'), duration: '60 min' },
            { name: t('categorySelection.sampleItems.facial'), duration: '45 min' }
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
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('categorySelection.title')}</h1>
        <p className="text-gray-600 mb-6">
          {t('categorySelection.description')}
        </p>

        {activeCategories.length > 0 && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="text-lg font-semibold text-green-800 mb-2">{t('categorySelection.activeCategories')}</h3>
            <div className="flex flex-wrap gap-2">              {activeCategories.map(categoryKey => {
                const IconComponent = categoryIcons[categoryKey];
                return (<div key={categoryKey} className="flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                    {IconComponent && <IconComponent className="mr-2" />}
                    {t(`categorySelection.categories.${categoryKey}.name`)}
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
                </div>                <h3 className="text-xl font-bold text-center mb-2 text-gray-800">
                  {t(`categorySelection.categories.${categoryKey}.name`)}
                </h3>

                <p className="text-gray-600 text-center text-sm mb-4">
                  {t(`categorySelection.categories.${categoryKey}.description`)}
                </p>

                {isActive ? (
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
                        {t('categorySelection.deactivating')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaCheck className="mr-2" />
                        {t('categorySelection.deactivate')}
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
                        {t('categorySelection.activating')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <FaPlus className="mr-2" />
                        {t('categorySelection.activate')}
                      </div>
                    )}
                  </button>
                )}

                {/* Show sample items/services for preview */}
                {category.items && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">{t('categorySelection.sampleServices')}</p>
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
                          +{category.items.length - 3} {t('categorySelection.more')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {category.vehicleTypes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">{t('categorySelection.vehicleTypes')}</p>
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
                          +{category.vehicleTypes.length - 2} {t('categorySelection.more')}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {category.tourTypes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">{t('categorySelection.tourTypes')}</p>
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
                          +{category.tourTypes.length - 2} {t('categorySelection.more')}
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
            {t('categorySelection.successMessage')} {activeCategories.length} {activeCategories.length === 1 ? t('categorySelection.categorySingle') : t('categorySelection.categoryPlural')}.
            {' '}{t('categorySelection.successDescription')}
          </p>
          <button
            onClick={() => window.location.href = '/service/services'}
            className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            {t('categorySelection.manageServices')}
          </button>
        </div>
      )}
    </div>
  );
};

export default CategorySelectionDashboard;
