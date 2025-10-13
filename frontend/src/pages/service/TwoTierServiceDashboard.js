/**
 * Two-Tier Service Category Dashboard
 * Main component that handles navigation between category types and specific categories
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ServiceCategorySelector from '../../components/service/ServiceCategorySelector';
import CategorySelectionDashboard from '../../components/service/CategorySelectionDashboard';
import InsideServicesCategorySelection from '../../components/service/InsideServicesCategorySelection';

const TwoTierServiceDashboard = () => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState('main'); // 'main', 'outside', 'inside'
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryTypeSelect = (categoryType) => {
    if (categoryType.id === 'outside') {
      setCurrentView('outside');
    } else if (categoryType.id === 'inside') {
      setCurrentView('inside');
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedCategory(null);
  };

  const handleCategorySelect = (category, template) => {
    setSelectedCategory(category);
    // You can handle specific category selection here
    // For now, we'll stay in the outside services view
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'main':
        return (
          <ServiceCategorySelector
            onCategoryTypeSelect={handleCategoryTypeSelect}
          />
        );

      case 'outside':
        return (
          <div>
            {/* Breadcrumb */}
            <div className="w-full p-6 pb-0">
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <button
                  onClick={handleBackToMain}
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('serviceProvider.dashboard.breadcrumbs.serviceCategories')}
                </button>
                <span>/</span>
                <span className="text-gray-900 font-medium">{t('serviceProvider.dashboard.breadcrumbs.outsideHotelServices')}</span>
              </nav>
            </div>

            <CategorySelectionDashboard
              onCategorySelect={handleCategorySelect}
              onBackToCategories={handleBackToMain}
            />
          </div>
        );

      case 'inside':
        return (
          <div>
            {/* Breadcrumb */}
            <div className="w-full p-6 pb-0">
              <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
                <button
                  onClick={handleBackToMain}
                  className="hover:text-blue-600 transition-colors"
                >
                  {t('serviceProvider.dashboard.breadcrumbs.serviceCategories')}
                </button>
                <span>/</span>
                <span className="text-gray-900 font-medium">{t('serviceProvider.dashboard.breadcrumbs.insideHotelServices')}</span>
              </nav>
            </div>

            <InsideServicesCategorySelection
              onBackToCategories={handleBackToMain}
            />
          </div>
        );

      default:
        return (
          <ServiceCategorySelector
            onCategoryTypeSelect={handleCategoryTypeSelect}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {renderCurrentView()}
    </div>
  );
};

export default TwoTierServiceDashboard;
