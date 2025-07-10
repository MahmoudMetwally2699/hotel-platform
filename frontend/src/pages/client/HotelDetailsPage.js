/**
 * Hotel Details Page
 * Displays detailed information about a specific hotel
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated } from '../../redux/slices/authSlice';
import HotelService from '../../services/hotel.service';

const HotelDetailsPage = () => {
  const { id } = useParams();
  const isAuthenticated = useSelector(selectIsAuthenticated);

  const [hotel, setHotel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Fetch hotel details
  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const hotelService = new HotelService();
        const response = await hotelService.getHotelById(id);
        setHotel(response);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load hotel details');
      } finally {
        setLoading(false);
      }
    };

    fetchHotelDetails();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error Loading Hotel</h2>
          <p className="text-gray-700 mb-6">{error}</p>
          <Link to="/hotels" className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Hotel Not Found</h2>
          <p className="text-gray-700 mb-6">The hotel you're looking for doesn't exist or has been removed.</p>
          <Link to="/hotels" className="inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
            Back to Hotels
          </Link>
        </div>
      </div>
    );
  }

  // Sample hotel data structure until API is connected
  const hotelData = hotel || {
    id: '1',
    name: 'Grand Hotel & Spa',
    description: 'A luxurious 5-star hotel located in the heart of the city with stunning views and exceptional service.',
    address: '123 Main Street, Cityville, State 12345',
    phone: '+1 (555) 123-4567',
    email: 'info@grandhotel.com',
    website: 'https://www.grandhotel.com',
    rating: 4.8,
    reviewCount: 356,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    images: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1170&q=80',
    ],
    amenities: [
      'Free WiFi',
      'Swimming Pool',
      'Spa & Wellness Center',
      'Fitness Center',
      'Restaurant & Bar',
      'Conference Rooms',
      '24/7 Room Service',
      'Laundry Service',
      'Airport Shuttle',
      'Parking',
    ],
    services: [
      { id: '101', name: 'Laundry & Dry Cleaning', category: 'laundry', price: 'From $15' },
      { id: '102', name: 'Airport Transfer', category: 'transportation', price: 'From $50' },
      { id: '103', name: 'City Tour', category: 'tourism', price: 'From $75' },
    ],
  };

  return (
    <div className="bg-gray-50">
      {/* Hero section with image gallery */}
      <div className="relative h-96 overflow-hidden">
        {hotelData.images && hotelData.images.length > 0 ? (
          <>
            <img
              src={hotelData.images[activeImageIndex]}
              alt={hotelData.name}
              className="w-full h-full object-cover"
            />
            {hotelData.images.length > 1 && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                {hotelData.images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveImageIndex(index)}
                    className={`w-3 h-3 rounded-full ${
                      index === activeImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
            <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
              <div className="container mx-auto px-4 py-8">
                <h1 className="text-4xl font-bold text-white mb-2">{hotelData.name}</h1>
                <div className="flex items-center text-white">
                  <div className="flex items-center mr-4">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={index}
                        className={`w-5 h-5 ${
                          index < Math.floor(hotelData.rating)
                            ? 'text-yellow-400'
                            : index < hotelData.rating
                            ? 'text-yellow-400/50'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                    ))}
                  </div>
                  <span>
                    {hotelData.rating} ({hotelData.reviewCount} reviews)
                  </span>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
            <p className="text-gray-500">No images available</p>
          </div>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="bg-white shadow">
        <div className="container mx-auto">
          <div className="flex overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === 'overview'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === 'services'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setActiveTab('amenities')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === 'amenities'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Amenities
            </button>
            <button
              onClick={() => setActiveTab('location')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === 'location'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Location
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 ${
                activeTab === 'reviews'
                  ? 'text-blue-600 border-blue-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              }`}
            >
              Reviews
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto py-8 px-4">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">About {hotelData.name}</h2>
              <p className="text-gray-600 mb-6">{hotelData.description}</p>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Check-in/Check-out</h3>
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-gray-500">Check-in Time</p>
                  <p className="text-gray-800 font-medium">{hotelData.checkInTime}</p>
                </div>
                <div>
                  <p className="text-gray-500">Check-out Time</p>
                  <p className="text-gray-800 font-medium">{hotelData.checkOutTime}</p>
                </div>
              </div>

              <h3 className="text-xl font-semibold text-gray-800 mb-3">Highlighted Amenities</h3>
              <ul className="grid grid-cols-2 gap-2 mb-6">
                {hotelData.amenities && hotelData.amenities.slice(0, 6).map((amenity, index) => (
                  <li key={index} className="flex items-center text-gray-600">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    {amenity}
                  </li>
                ))}
              </ul>

              <div className="flex">
                <button
                  onClick={() => setActiveTab('amenities')}
                  className="text-blue-600 hover:text-blue-800 font-medium"
                >
                  See all amenities
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md h-fit">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  <p className="text-gray-600">{hotelData.address}</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
                  </svg>
                  <p className="text-gray-600">{hotelData.phone}</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                  </svg>
                  <p className="text-gray-600">{hotelData.email}</p>
                </div>
                <div className="flex items-start">
                  <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"></path>
                  </svg>
                  <p className="text-gray-600">{hotelData.website}</p>
                </div>
              </div>

              <div className="mt-6">
                <Link
                  to={`/services/hotel/${hotelData.id}`}
                  className="block w-full bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  Browse Available Services
                </Link>
                {isAuthenticated && (
                  <button
                    className="block w-full mt-3 border border-blue-600 text-blue-600 text-center py-2 px-4 rounded-lg hover:bg-blue-50 transition duration-200"
                  >
                    Contact Hotel
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Services Tab */}
        {activeTab === 'services' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Available Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {hotelData.services && hotelData.services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-800">{service.name}</h3>
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded capitalize">
                        {service.category}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-4">
                      Professional service offered by our trusted partners.
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-900 font-medium">{service.price}</span>
                      <Link
                        to={`/services/details/${service.id}`}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <Link
                to={`/services/hotel/${hotelData.id}`}
                className="inline-block bg-blue-600 text-white py-2 px-6 rounded-lg hover:bg-blue-700"
              >
                View All Services
              </Link>
            </div>
          </div>
        )}

        {/* Amenities Tab */}
        {activeTab === 'amenities' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Hotel Amenities</h2>
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {hotelData.amenities && hotelData.amenities.map((amenity, index) => (
                  <div key={index} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-700">{amenity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Location Tab */}
        {activeTab === 'location' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Location</h2>
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="h-96 bg-gray-200">
                {/* Here would go a map component like Google Maps */}
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-gray-500">Map will be displayed here</p>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Address</h3>
                <p className="text-gray-600 mb-4">{hotelData.address}</p>

                <h3 className="text-lg font-semibold text-gray-800 mb-2">Getting There</h3>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">From the Airport</p>
                      <p className="text-gray-600">20 minutes by taxi or shuttle service</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">Public Transportation</p>
                      <p className="text-gray-600">Bus and subway stations within 5 minutes walk</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <svg className="w-5 h-5 text-gray-500 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"></path>
                    </svg>
                    <div>
                      <p className="text-gray-700 font-medium">Parking</p>
                      <p className="text-gray-600">On-site parking available for guests</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews Tab */}
        {activeTab === 'reviews' && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Guest Reviews</h2>
              {isAuthenticated && (
                <button className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700">
                  Write a Review
                </button>
              )}
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="flex flex-col md:flex-row md:items-center">
                <div className="md:w-1/4 text-center mb-4 md:mb-0">
                  <div className="text-5xl font-bold text-gray-800">{hotelData.rating}</div>
                  <div className="flex justify-center mt-2">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={index}
                        className={`w-5 h-5 ${
                          index < Math.floor(hotelData.rating)
                            ? 'text-yellow-400'
                            : index < hotelData.rating
                            ? 'text-yellow-400/50'
                            : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="text-gray-600 mt-1">{hotelData.reviewCount} reviews</p>
                </div>

                <div className="md:w-3/4 md:pl-6">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-gray-600">5 stars</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '65%' }}></div>
                      </div>
                      <span className="w-10 text-sm text-gray-600 text-right">65%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-gray-600">4 stars</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '20%' }}></div>
                      </div>
                      <span className="w-10 text-sm text-gray-600 text-right">20%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-gray-600">3 stars</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '10%' }}></div>
                      </div>
                      <span className="w-10 text-sm text-gray-600 text-right">10%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-gray-600">2 stars</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '3%' }}></div>
                      </div>
                      <span className="w-10 text-sm text-gray-600 text-right">3%</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-20 text-sm text-gray-600">1 star</span>
                      <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className="bg-yellow-400 h-2 rounded-full" style={{ width: '2%' }}></div>
                      </div>
                      <span className="w-10 text-sm text-gray-600 text-right">2%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              {/* Sample reviews - would come from API */}
              {[1, 2, 3].map((item) => (
                <div key={item} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex justify-between mb-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold">
                        {`JD`}
                      </div>
                      <div className="ml-3">
                        <h4 className="text-gray-800 font-medium">John Doe</h4>
                        <p className="text-gray-500 text-sm">Stayed June 2025</p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {Array.from({ length: 5 }).map((_, index) => (
                        <svg
                          key={index}
                          className={`w-4 h-4 ${index < 5 ? 'text-yellow-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
                          />
                        </svg>
                      ))}
                    </div>
                  </div>
                  <h5 className="text-lg font-semibold text-gray-800 mb-2">Excellent stay, highly recommend!</h5>
                  <p className="text-gray-600 mb-4">
                    The hotel exceeded all my expectations. The staff was incredibly friendly and helpful, the rooms were clean and comfortable, and the location was perfect for exploring the city. Would definitely stay here again on my next visit!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Clean</span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Comfortable</span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Great Location</span>
                    <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">Friendly Staff</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button className="bg-gray-200 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-300">
                Load More Reviews
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HotelDetailsPage;
