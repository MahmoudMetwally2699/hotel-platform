/**
 * Two-Tier Service Dashboard
 * Manages navigation between Outside and Inside Hotel Services
 * Includes routing to specific service management components
 */

import React, { useState } from 'react';
import ServiceCategorySelector from './ServiceCategorySelector';
import CategorySelectionDashboard from './CategorySelectionDashboard';
import InsideServicesCategorySelection from './InsideServicesCategorySelection';
import HousekeepingServiceManagement from './HousekeepingServiceManagement';

const TwoTierServiceDashboard = () => {
  const [currentView, setCurrentView] = useState('main'); // 'main', 'outside', 'inside', 'housekeeping'
  const [selectedCategory, setSelectedCategory] = useState(null);

  const handleCategoryTypeSelect = (categoryType) => {
    console.log('TwoTierServiceDashboard: Category type selected:', categoryType);

    // categoryType is the full object with id, title, etc.
    if (categoryType.id === 'outside') {
      setCurrentView('outside');
    } else if (categoryType.id === 'inside') {
      setCurrentView('inside');
    }
  };

  const handleInsideCategorySelect = (categoryKey, categoryData) => {
    setSelectedCategory({ key: categoryKey, data: categoryData });

    // Route to specific service management based on category
    if (categoryKey === 'housekeeping-requests') {
      setCurrentView('housekeeping');
    } else {
      // For other inside services, you can add more specific components here
      console.log('Selected inside service category:', categoryKey, categoryData);
    }
  };

  const handleBackToMain = () => {
    setCurrentView('main');
    setSelectedCategory(null);
  };

  const handleBackToInside = () => {
    setCurrentView('inside');
    setSelectedCategory(null);
  };

  const handleBackToOutside = () => {
    setCurrentView('outside');
    setSelectedCategory(null);
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
          <CategorySelectionDashboard
            onBackToCategories={handleBackToMain}
          />
        );

      case 'inside':
        return (
          <InsideServicesCategorySelection
            onCategorySelect={handleInsideCategorySelect}
            onBackToCategories={handleBackToMain}
          />
        );

      case 'housekeeping':
        return (
          <HousekeepingServiceManagement
            onBack={handleBackToInside}
            category={selectedCategory}
          />
        );

      default:
        return (
          <ServiceCategorySelector
            onCategoryTypeClick={handleCategoryTypeSelect}
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
