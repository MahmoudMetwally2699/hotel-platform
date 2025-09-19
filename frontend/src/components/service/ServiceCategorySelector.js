/**
 * Service Category Selector - Two-tier category system
 * Allows service providers to choose between Outside Hotel Services and Inside Hotel Services
 */

import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FaBuilding,
  FaHotel,
  FaArrowRight,
  FaTshirt,
  FaCar,
  FaCoffee
} from 'react-icons/fa';
import useServiceProviderCategories from '../../hooks/useServiceProviderCategories';
import apiClient from '../../services/api.service';

const ServiceCategorySelector = ({ onCategoryTypeSelect }) => {
  const { t } = useTranslation();
  const [hoveredCard, setHoveredCard] = useState(null);
  const { categories, loading, hasCategory } = useServiceProviderCategories();
  const [insideServicesAvailable, setInsideServicesAvailable] = useState(false);

  // Check if inside services are available
  useEffect(() => {
    const checkInsideServices = async () => {
      try {
        const response = await apiClient.get('/service/inside-services');
        const insideServices = response.data.data || [];
        setInsideServicesAvailable(insideServices.length > 0);
      } catch (error) {
        console.error('Error checking inside services:', error);
        setInsideServicesAvailable(false);
      }
    };

    if (!loading) {
      checkInsideServices();
    }
  }, [loading]);

  // Filter category types based on available services
  const getAvailableCategoryTypes = () => {
    const categoryTypes = [];

    // Outside Hotel Services - only laundry and transportation (no dining here)
    const outsideCategories = ['laundry', 'transportation'];
    const hasOutsideServices = outsideCategories.some(cat => hasCategory(cat));

    if (hasOutsideServices) {
      categoryTypes.push({
        id: 'outside',
        title: 'Outside Hotel Services',
        description: 'Services provided by external service providers',
        icon: FaBuilding,
        color: 'blue',
        services: [
          { name: 'Laundry Services', icon: FaTshirt, description: 'Professional laundry and dry cleaning' },
          { name: 'Transportation Services', icon: FaCar, description: 'Vehicle rental and transportation' }
        ]
      });
    }

    // Inside Hotel Services - check if dining or housekeeping are available (required for inside services)
    // This is based on the backend inside-services endpoint which maps these to hotel restaurant and housekeeping
    const hasInsideServiceCategories = hasCategory('dining') || hasCategory('housekeeping');

    if (hasInsideServiceCategories && insideServicesAvailable) {
      categoryTypes.push({
        id: 'inside',
        title: 'Inside Hotel Services',
        description: 'Services provided within hotel premises',
        icon: FaHotel,
        color: 'green',
        services: [
          { name: 'Hotel Restaurant', icon: FaCoffee, description: 'Main dining facilities and reservations' },
          { name: 'Housekeeping Services', icon: FaHotel, description: 'Room cleaning and maintenance requests' }
        ]
      });
    }

    return categoryTypes;
  };

  const handleCategoryTypeClick = (categoryType) => {
    console.log('Category clicked:', categoryType.id);

    if (onCategoryTypeSelect) {
      onCategoryTypeSelect(categoryType);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        {/* Header Section with Gradient Background */}
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white relative overflow-hidden mx-3 sm:mx-4 lg:mx-6">
          {/* Background Pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
          <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>

          <div className="relative max-w-4xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Service Categories</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
              Loading available service categories...
            </p>
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

  const availableCategoryTypes = getAvailableCategoryTypes();

  // Show empty state if no categories are available
  if (availableCategoryTypes.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-8 text-white">
            <div className="max-w-4xl">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Service Categories</h1>
              <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
                No service categories are currently available for your account.
              </p>
            </div>
          </div>

          {/* Empty state */}
          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <div className="mb-8">
                <FaHotel className="text-6xl text-gray-400 mx-auto mb-4" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Service Categories Available</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                No service categories are currently enabled for your account. Please contact your hotel administrator to enable service categories such as laundry, transportation, dining, or housekeeping.
              </p>
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
        <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 mb-4 sm:mb-6 lg:mb-8 text-white">
          <div className="max-w-4xl">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 sm:mb-4">Service Categories</h1>
            <p className="text-sm sm:text-base lg:text-xl text-white/90 leading-relaxed">
              Select the type of services you want to offer. You can activate multiple categories and manage them independently.
            </p>
          </div>
        </div>

        <div className={`grid gap-4 sm:gap-6 lg:gap-8 ${
          availableCategoryTypes.length === 1
            ? 'grid-cols-1 max-w-2xl mx-auto'
            : 'grid-cols-1 lg:grid-cols-2'
        }`}>
          {availableCategoryTypes.map((categoryType) => {
            const IconComponent = categoryType.icon;
            const isHovered = hoveredCard === categoryType.id;

            return (
              <div
                key={categoryType.id}
                className={`
                  group relative bg-white rounded-xl sm:rounded-2xl shadow-xl overflow-hidden transition-all duration-500 cursor-pointer
                  ${isHovered ? 'shadow-2xl transform sm:scale-[1.02] sm:-translate-y-2' : 'hover:shadow-2xl'}
                  border border-gray-100 hover:border-[#67BAE0]/30
                `}
                onClick={() => handleCategoryTypeClick(categoryType)}
                onMouseEnter={() => setHoveredCard(categoryType.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                {/* Modern Header with Gradient */}
                <div className={`${
                  categoryType.color === 'blue'
                    ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0]'
                    : 'bg-gradient-to-r from-[#67BAE0] to-[#3B5787]'
                } text-white p-4 sm:p-6 lg:p-8 relative overflow-hidden`}>
                  {/* Background Pattern */}
                  <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                  <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full opacity-50"></div>
                  <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/5 rounded-full opacity-50"></div>

                  <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 space-y-4 sm:space-y-0">
                    <div className="flex items-center">
                      <div className="p-3 sm:p-4 bg-white/20 backdrop-blur-sm rounded-xl sm:rounded-2xl mr-4 sm:mr-6 group-hover:bg-white/30 transition-all duration-300 shrink-0">
                        <IconComponent className="text-2xl sm:text-3xl" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h2 className="text-xl sm:text-2xl font-bold mb-1 sm:mb-2">{categoryType.title}</h2>
                        <p className="text-white/90 text-sm sm:text-base lg:text-lg">{categoryType.description}</p>
                      </div>
                    </div>
                    <div className="flex items-center self-center sm:self-auto">
                      <FaArrowRight className={`text-xl sm:text-2xl transition-all duration-300 ${
                        isHovered ? 'sm:translate-x-2 sm:scale-110' : ''
                      } group-hover:text-white`} />
                    </div>
                  </div>
                </div>

                {/* Modern Services Preview */}
                <div className="p-4 sm:p-6 lg:p-8">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
                    <span className="w-1 h-5 sm:h-6 bg-gradient-to-b from-[#3B5787] to-[#67BAE0] rounded-full mr-2 sm:mr-3"></span>
                    Available Services:
                  </h3>
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                    {categoryType.services.slice(0, 4).map((service, index) => {
                      const ServiceIcon = service.icon;
                      return (
                        <div key={index} className="group flex items-center p-3 sm:p-4 bg-gradient-to-r from-gray-50 to-white rounded-lg sm:rounded-xl border border-gray-100 hover:border-[#67BAE0]/30 hover:shadow-md transition-all duration-300">
                          <div className={`p-2 sm:p-3 rounded-lg sm:rounded-xl mr-3 sm:mr-4 transition-all duration-300 shrink-0 ${
                            categoryType.color === 'blue'
                              ? 'bg-[#3B5787]/10 text-[#3B5787] group-hover:bg-[#3B5787] group-hover:text-white'
                              : 'bg-[#67BAE0]/10 text-[#67BAE0] group-hover:bg-[#67BAE0] group-hover:text-white'
                          }`}>
                            <ServiceIcon className="text-base sm:text-lg" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-0.5 sm:mb-1">{service.name}</h4>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">{service.description}</p>
                          </div>
                        </div>
                      );
                    })}
                    {categoryType.services.length > 4 && (
                      <div className="text-center mt-3 sm:mt-4">
                        <span className="inline-flex items-center px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-full">
                          +{categoryType.services.length - 4} more services
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modern Action Button */}
                <div className="px-4 sm:px-6 lg:px-8 pb-4 sm:pb-6 lg:pb-8">
                  <button className={`
                    w-full py-3 sm:py-4 px-4 sm:px-6 rounded-xl sm:rounded-2xl font-semibold text-sm sm:text-base lg:text-lg transition-all duration-300
                    ${categoryType.color === 'blue'
                      ? 'bg-gradient-to-r from-[#3B5787] to-[#67BAE0] hover:from-[#2A4065] hover:to-[#3B5787]'
                      : 'bg-gradient-to-r from-[#67BAE0] to-[#3B5787] hover:from-[#3B5787] hover:to-[#2A4065]'
                    } text-white shadow-lg hover:shadow-xl transform sm:hover:scale-[1.02]
                    flex items-center justify-center group
                  `}>
                    <span>Select {categoryType.title}</span>
                    <FaArrowRight className="ml-2 sm:ml-3 transition-transform duration-300 group-hover:translate-x-1 text-sm sm:text-base" />
                  </button>
                </div>

                {/* Modern Hover Overlay */}
                {isHovered && (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#3B5787]/5 to-[#67BAE0]/5 pointer-events-none transition-opacity duration-500" />
                )}
              </div>
            );
          })}
      </div>

        {/* Modern Information Section */}
        <div className="mt-8 sm:mt-10 lg:mt-12 bg-white rounded-xl sm:rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#3B5787] to-[#67BAE0] px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <h3 className="text-xl sm:text-2xl font-bold text-white mb-1 sm:mb-2">How it works</h3>
            <p className="text-white/90 text-sm sm:text-base">Choose your service category and start earning with our platform</p>
          </div>
          <div className="p-4 sm:p-6 lg:p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#3B5787] to-[#67BAE0] rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 sm:mt-1 shrink-0">
                    <FaBuilding className="text-white text-xs sm:text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Outside Hotel Services</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#67BAE0] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Partner</strong> with external service providers</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#67BAE0] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Set markup</strong> percentages on service provider base prices</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#67BAE0] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Guests pay</strong> final price (base + markup)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#67BAE0] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Revenue split:</strong> Hotel receives markup, provider receives base price</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div className="flex items-start">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-[#67BAE0] to-[#3B5787] rounded-full flex items-center justify-center mr-3 sm:mr-4 mt-0.5 sm:mt-1 shrink-0">
                    <FaHotel className="text-white text-xs sm:text-sm" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base sm:text-lg font-bold text-gray-900 mb-2">Inside Hotel Services</h4>
                    <ul className="space-y-1.5 sm:space-y-2 text-gray-700">
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3B5787] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Direct services</strong> within hotel premises</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3B5787] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>On-site delivery</strong> to hotel guests</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3B5787] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Coordinate</strong> with hotel staff for seamless service</span>
                      </li>
                      <li className="flex items-start">
                        <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-[#3B5787] rounded-full mt-1.5 sm:mt-2 mr-2 sm:mr-3 flex-shrink-0"></span>
                        <span className="text-sm sm:text-base"><strong>Full control</strong> over service management and execution</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  </div>
  );
};

export default ServiceCategorySelector;
