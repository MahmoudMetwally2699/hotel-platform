/**
 * Services Management Page for Service Providers
 * Handles category-based service listing and management
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LaundryServiceCreator from '../../components/service/LaundryServiceCreator';
import TransportationServiceCreator from '../../components/service/TransportationServiceCreator';
import { FaTshirt, FaCar, FaSpinner, FaExclamationTriangle } from 'react-icons/fa';

const ServicesPage = () => {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category');

  useEffect(() => {
    // Simulate loading for smooth transition
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [category]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="animate-spin text-4xl text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  const getCategoryInfo = (cat) => {
    switch (cat) {
      case 'laundry':
        return {
          title: t('categories.laundryServices'),
          icon: FaTshirt,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50'
        };
      case 'transportation':
        return {
          title: t('categories.transportationServices'),
          icon: FaCar,
          color: 'text-purple-600',
          bgColor: 'bg-purple-50'
        };
      default:
        return null;
    }
  };

  const categoryInfo = getCategoryInfo(category);

  if (!categoryInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaExclamationTriangle className="text-4xl text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Category</h2>
          <p className="text-gray-600">
            The service category "{category}" is not supported or does not exist.
          </p>
        </div>
      </div>
    );
  }

  const IconComponent = categoryInfo.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className={`${categoryInfo.bgColor} rounded-lg p-6 mb-6`}>
          <div className="flex items-center">
            <div className={`p-3 ${categoryInfo.color} bg-white rounded-lg mr-4`}>
              <IconComponent className="text-2xl" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {categoryInfo.title}
              </h1>
              <p className="text-gray-600 mt-1">
                {category === 'laundry'
                  ? t('serviceProvider.laundry.subtitle')
                  : t('serviceProvider.transportation.subtitle')
                }
              </p>
            </div>
          </div>
        </div>

        {/* Category-specific Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {category === 'laundry' && <LaundryServiceCreator />}
          {category === 'transportation' && <TransportationServiceCreator />}
        </div>
      </div>
    </div>
  );
};

export default ServicesPage;
