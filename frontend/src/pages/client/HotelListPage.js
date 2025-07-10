/**
 * Hotel List Page
 * Displays all hotels in the system with filtering and search options
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchHotels, selectHotels, selectHotelsLoading } from '../../redux/slices/hotelSlice';

const HotelListPage = () => {
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

  // Common amenities for filter
  const commonAmenities = ['wifi', 'pool', 'spa', 'gym', 'restaurant', 'parking'];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 bg-white p-4 rounded-lg shadow">
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Search Hotels</h2>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or location"
                className="form-input pl-10 w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Star Rating Filter */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Star Rating</h2>
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
            <h2 className="text-lg font-semibold mb-3">Amenities</h2>
            {commonAmenities.map((amenity) => (
              <div key={amenity} className="flex items-center mb-2">
                <input
                  type="checkbox"
                  id={`amenity-${amenity}`}
                  className="form-checkbox h-4 w-4 text-primary-main"
                  checked={filters.amenities.includes(amenity)}
                  onChange={() => handleAmenityFilterChange(amenity)}
                />
                <label htmlFor={`amenity-${amenity}`} className="ml-2 capitalize">
                  {amenity}
                </label>
              </div>
            ))}
          </div>

          {/* Price Range Filter */}
          <div>
            <h2 className="text-lg font-semibold mb-3">Price Range</h2>
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
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>${filters.priceRange[0]}</span>
                <span>${filters.priceRange[1]}</span>
              </div>
            </div>
          </div>

          {/* Clear Filters Button */}
          <button
            className="mt-6 w-full py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
            onClick={() => {
              setSearchTerm('');
              setFilters({
                stars: [],
                amenities: [],
                priceRange: [0, 1000]
              });
            }}
          >
            Clear Filters
          </button>
        </div>

        {/* Hotel List */}
        <div className="flex-1">
          <div className="mb-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold">Hotels</h1>
            <span className="text-gray-500">{filteredHotels.length} hotels found</span>
          </div>

          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
            </div>
          ) : filteredHotels.length > 0 ? (
            <div className="space-y-6">
              {filteredHotels.map((hotel) => (
                <div
                  key={hotel._id}
                  className="bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-transform hover:shadow-lg hover:scale-[1.01]"
                  onClick={() => handleHotelClick(hotel._id)}
                >
                  <div className="flex flex-col md:flex-row">
                    {/* Hotel Image */}
                    <div className="md:w-1/3 h-48 md:h-auto">
                      {hotel.images && hotel.images.length > 0 ? (
                        <img
                          src={hotel.images[0]}
                          alt={hotel.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                          <span className="text-gray-400">No image</span>
                        </div>
                      )}
                    </div>

                    {/* Hotel Details */}
                    <div className="flex-1 p-4 flex flex-col">
                      <div className="flex justify-between">
                        <h2 className="text-xl font-bold text-gray-900">{hotel.name}</h2>
                        <div className="flex">
                          {Array.from({ length: hotel.stars }).map((_, i) => (
                            <svg key={i} xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                      </div>

                      <div className="mt-2 text-sm text-gray-600 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {hotel.location.street}, {hotel.location.city}, {hotel.location.country}
                      </div>

                      <p className="mt-2 text-sm text-gray-500 flex-grow">{hotel.description}</p>

                      {/* Amenities */}
                      <div className="mt-4 flex flex-wrap gap-2">
                        {hotel.amenities.slice(0, 5).map((amenity, index) => (
                          <span key={index} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {amenity}
                          </span>
                        ))}
                        {hotel.amenities.length > 5 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            +{hotel.amenities.length - 5} more
                          </span>
                        )}
                      </div>

                      {/* Price and Services */}
                      <div className="mt-4 flex justify-between items-center pt-3 border-t border-gray-200">
                        <div>
                          <span className="text-xl font-bold text-gray-900">${hotel.averagePrice}</span>
                          <span className="text-sm text-gray-500"> / night</span>
                        </div>
                        <div className="text-sm text-gray-500">
                          {hotel.serviceCount || 0} services available
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
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hotels found</h3>
              <p className="mt-1 text-sm text-gray-500">
                Try adjusting your search or filter to find what you're looking for.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HotelListPage;
