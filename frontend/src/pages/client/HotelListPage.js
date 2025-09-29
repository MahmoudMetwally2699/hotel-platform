/**
 * Hotel List Page
 * Displays all hotels in the system with filtering and search options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchHotels, selectHotels, selectHotelsLoading } from '../../redux/slices/hotelSlice';
import useRTL from '../../hooks/useRTL';
import { formatPriceByLanguage } from '../../utils/currency';

const HotelListPage = () => {
  const { t, i18n } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const hotels = useSelector(selectHotels);
  const isLoading = useSelector(selectHotelsLoading);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    stars: [],
    amenities: [],
    priceRange: [0, 1000]
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    dispatch(fetchHotels());
  }, [dispatch]);

  // Handle hotel click
  const handleHotelClick = (hotelId) => {
    navigate(`/hotels/${hotelId}`);
  };

  // Filter hotels based on search and filters
  const filteredHotels = hotels.filter(hotel => {
    // Search filter
    const matchesSearch = hotel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         hotel.location.city.toLowerCase().includes(searchTerm.toLowerCase());

    // Stars filter
    const matchesStars = filters.stars.length === 0 ||
                       filters.stars.includes(hotel.stars);

    // Amenities filter
    const matchesAmenities = filters.amenities.length === 0 ||
                          filters.amenities.every(amenity =>
                            hotel.amenities.includes(amenity));

    // Price range filter
    const matchesPriceRange = hotel.averagePrice >= filters.priceRange[0] &&
                            hotel.averagePrice <= filters.priceRange[1];

    return matchesSearch && matchesStars && matchesAmenities && matchesPriceRange;
  });

  // Update star filter
  const handleStarFilterChange = (star) => {
    setFilters(prev => {
      const updatedStars = prev.stars.includes(star)
        ? prev.stars.filter(s => s !== star)
        : [...prev.stars, star];

      return {
        ...prev,
        stars: updatedStars
      };
    });
  };

  // Update amenity filter
  const handleAmenityFilterChange = (amenity) => {
    setFilters(prev => {
      const updatedAmenities = prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity];

      return {
        ...prev,
        amenities: updatedAmenities
      };
    });
  };

  // Common amenities for filter with translations
  const getAmenityTranslation = (amenity) => {
    const amenityMap = {
      wifi: t('hotels.amenities.wifi'),
      pool: t('hotels.amenities.pool'),
      spa: t('hotels.amenities.spa'),
      gym: t('hotels.amenities.gym'),
      restaurant: t('hotels.amenities.restaurant'),
      parking: t('hotels.amenities.parking')
    };
    return amenityMap[amenity] || amenity;
  };

  const commonAmenities = ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'parking'];

  // Filter Content Component
  const FilterContent = () => (
    <>
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('hotels.searchHotels')}</h2>
        <div className="relative">
          <input
            type="text"
            placeholder={t('hotels.searchPlaceholder')}
            className="form-input pl-10 w-full text-sm sm:text-base"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center pointer-events-none`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      {/* Star Rating Filter */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('hotels.starRating')}</h2>
        {[5, 4, 3, 2, 1].map((star) => (
          <div key={star} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`star-${star}`}
              className="form-checkbox h-4 w-4 text-primary-main"
              checked={filters.stars.includes(star)}
              onChange={() => handleStarFilterChange(star)}
            />
            <label htmlFor={`star-${star}`} className="ml-2 flex">
              {Array.from({ length: star }).map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </label>
          </div>
        ))}
      </div>

      {/* Amenities Filter */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('hotels.amenities.title')}</h2>
        {commonAmenities.map((amenity) => (
          <div key={amenity} className="flex items-center mb-2">
            <input
              type="checkbox"
              id={`amenity-${amenity}`}
              className="form-checkbox h-4 w-4 text-primary-main"
              checked={filters.amenities.includes(amenity)}
              onChange={() => handleAmenityFilterChange(amenity)}
            />
            <label htmlFor={`amenity-${amenity}`} className={`${isRTL ? 'mr-2' : 'ml-2'} capitalize`}>
              {getAmenityTranslation(amenity)}
            </label>
          </div>
        ))}
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3">{t('hotels.priceRange')}</h2>
        <div className="px-2">
          <input
            type="range"
            min="0"
            max="1000"
            step="50"
            className="w-full"
            value={filters.priceRange[1]}
            onChange={(e) => setFilters(prev => ({
              ...prev,
              priceRange: [prev.priceRange[0], parseInt(e.target.value)]
            }))}
          />
          <div className="flex justify-between mt-2 text-sm text-gray-500">            <span>{formatPriceByLanguage(filters.priceRange[0], i18n.language)}</span>
            <span>{formatPriceByLanguage(filters.priceRange[1], i18n.language)}</span>
          </div>
        </div>
      </div>

      {/* Clear Filters Button */}
      <button
        className="w-full py-2 text-sm sm:text-base bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
        onClick={() => {
          setSearchTerm('');
          setFilters({
            stars: [],
            amenities: [],
            priceRange: [0, 1000]
          });
          // Close mobile sidebar after clearing filters
          setIsSidebarOpen(false);
        }}
      >
        {t('common.clearFilters')}
      </button>
    </>
  );

  return (    <div className="container mx-auto px-2 sm:px-3 lg:px-4 py-4 sm:py-6 lg:py-8 relative">
      {/* Mobile Filter Button */}
      <div className="lg:hidden mb-4">
        <button
          className="w-full flex items-center justify-center px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          onClick={() => setIsSidebarOpen(true)}
        >
          <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 2v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          {t('common.filter')} & {t('common.search')}
        </button>
      </div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
            onClick={() => setIsSidebarOpen(false)}
          ></div>

          {/* Sidebar */}
          <div className={`relative flex-1 flex flex-col max-w-xs w-full bg-white shadow-xl transform transition-transform ${isRTL ? 'translate-x-0' : 'translate-x-0'}`}>
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">{t('common.filter')} & {t('common.search')}</h2>
              <button
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                onClick={() => setIsSidebarOpen(false)}
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Sidebar content */}
            <div className="flex-1 overflow-y-auto p-4">
              <FilterContent />
            </div>

            {/* Footer with Apply button */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
              <button
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                onClick={() => setIsSidebarOpen(false)}
              >
                View Results ({filteredHotels.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row justify-between items-start gap-6">
        {/* Desktop Filters Sidebar */}
        <div className="hidden lg:block w-64 bg-white p-6 rounded-lg shadow">
          <FilterContent />
        </div>

        {/* Hotel List */}
        <div className="flex-1">
          <div className="mb-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold">{t('navigation.hotels')}</h1>
            <span className="text-sm sm:text-base text-gray-500">
              {t('hotels.hotelsFound', { count: filteredHotels.length })}
            </span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
            </div>
          ) : filteredHotels.length > 0 ? (
            <div className="space-y-4 sm:space-y-6">
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01]"
                  onClick={() => handleHotelClick(hotel._id)}
                >
                  <div className="flex flex-col lg:flex-row">
                    {/* Hotel Image */}
                    <div className="lg:w-1/3 h-48 sm:h-56 lg:h-auto">
                      {hotel.images && hotel.images.length > 0 ? (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400 text-sm sm:text-base">{t('hotels.noImage')}</span>
                        </div>
                      )}
                    </div>

                    {/* Hotel Details */}
                    <div className="flex-1 p-4 sm:p-6 flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                        <h2 className="text-lg sm:text-xl font-bold text-gray-900 pr-2">{hotel.name}</h2>
                        <div className="flex self-start sm:self-auto">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 text-xs sm:text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 sm:h-4 sm:w-4 mr-1 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {hotel.location.street}, {hotel.location.city}, {hotel.location.country}
                        </span>
                      </div>

                      <p className="mt-2 text-xs sm:text-sm text-gray-500 flex-grow line-clamp-2 sm:line-clamp-3">{hotel.description}</p>

                      {/* Amenities */}
                      <div className="mt-3 sm:mt-4 flex flex-wrap gap-1 sm:gap-2">
                        {hotel.amenities.slice(0, 4).map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {getAmenityTranslation(amenity)}
                          </span>
                        ))}
                        {hotel.amenities.length > 4 && (
                          <span className="inline-flex items-center px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{hotel.amenities.length - 4} {t('hotels.more')}
                          </span>
                        )}
                      </div>

                      {/* Price and Services */}
                      <div className="mt-3 sm:mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center pt-3 border-t border-gray-200 gap-2">
                        <div className="flex items-baseline">
                          <span className="text-lg sm:text-xl font-bold text-gray-900">{formatPriceByLanguage(hotel.averagePrice, i18n.language)}</span>
                          <span className="text-xs sm:text-sm text-gray-500 ml-1"> / {t('hotels.night')}</span>
                        </div>
                        <div className="text-xs sm:text-sm text-gray-500">
                          {t('hotels.servicesAvailable', { count: hotel.serviceCount || 0 })}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">{t('hotels.noHotelsFound')}</h3>
              <p className="mt-1 text-sm text-gray-500">
                {t('hotels.adjustSearch')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelListPage;
