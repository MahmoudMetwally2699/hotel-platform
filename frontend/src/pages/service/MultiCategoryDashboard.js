import React, { useState } from 'react';
import {
  FaTh,
  FaChartLine,
  FaClipboardList,
  FaCog,
  FaPlus
} from 'react-icons/fa';

// Import dashboard components
import CategorySelectionDashboard from '../../components/service/CategorySelectionDashboard';
import CategoryOrdersManager from '../../components/service/CategoryOrdersManager';
import ServiceProviderAnalytics from '../../components/service/ServiceProviderAnalytics';
import TransportationServiceCreator from '../../components/service/TransportationServiceCreator';
import ToursServiceCreator from '../../components/service/ToursServiceCreator';
import LaundryServiceCreator from '../../components/service/LaundryServiceCreator';
import ErrorBoundary from '../../components/common/ErrorBoundary';

const MultiCategoryDashboard = () => {
  const [activeTab, setActiveTab] = useState('categories');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryTemplate, setCategoryTemplate] = useState(null);
  const tabs = [
    { id: 'categories', name: 'Service Categories', icon: FaTh },
    { id: 'manage-services', name: 'Manage Services', icon: FaCog },
    { id: 'orders', name: 'Order Management', icon: FaClipboardList },
    { id: 'analytics', name: 'Analytics', icon: FaChartLine }
  ];

  const handleCategorySelect = (category, template) => {
    setSelectedCategory(category);
    setCategoryTemplate(template);
    setActiveTab('create-service');
  };

  const handleServiceCreated = (services) => {
    // Refresh or navigate to services management
    setActiveTab('orders');
    setSelectedCategory(null);
    setCategoryTemplate(null);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'categories':
        return <CategorySelectionDashboard onCategorySelect={handleCategorySelect} />;      case 'create-service':
        if (selectedCategory === 'laundry') {
          return (
            <ErrorBoundary>
              <LaundryServiceCreator />
            </ErrorBoundary>
          );
        } else if (selectedCategory === 'transportation') {
          return (
            <TransportationServiceCreator
              categoryTemplate={categoryTemplate}
              onServiceCreated={handleServiceCreated}
            />
          );
        } else if (selectedCategory === 'tours') {
          return (
            <ToursServiceCreator
              categoryTemplate={categoryTemplate}
              onServiceCreated={handleServiceCreated}
            />
          );
        }

        // Fallback for other categories
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <FaPlus className="mx-auto text-4xl text-gray-400 mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Service Creator for {selectedCategory}
              </h2>
              <p className="text-gray-600 mb-6">
                Service creator for {selectedCategory} category is coming soon!
              </p>
              <button
                onClick={() => setActiveTab('categories')}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Back to Categories
              </button>
            </div>
          </div>
        );      case 'orders':
        return <CategoryOrdersManager />;      case 'manage-services':
        return (
          <ErrorBoundary>
            <LaundryServiceCreator />
          </ErrorBoundary>
        );case 'analytics':
        return <ServiceProviderAnalytics />;

      default:
        return (
          <div className="max-w-4xl mx-auto p-6">
            <div className="bg-white rounded-lg shadow-lg p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Service Dashboard</h2>
              <p className="text-gray-600">Welcome to your service provider dashboard!</p>
            </div>
          </div>
        );
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Tabs */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setSelectedCategory(null);
                    setCategoryTemplate(null);
                  }}
                  className={`
                    flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                    ${activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <IconComponent className="mr-2" />
                  {tab.name}
                </button>
              );
            })}

            {/* Show service creation tab when category is selected */}
            {selectedCategory && activeTab === 'create-service' && (
              <button
                className="flex items-center py-4 px-1 border-b-2 border-green-500 text-green-600 font-medium text-sm"
              >
                <FaPlus className="mr-2" />
                Create {selectedCategory} Services
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default MultiCategoryDashboard;
