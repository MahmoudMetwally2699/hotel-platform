/**
 * Service Details Page
 * Displays detailed information about a service and allows booking
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchServiceDetails, selectServiceDetails, selectServiceLoading } from '../../redux/slices/serviceSlice';
import { format } from 'date-fns';
import useAuth from '../../hooks/useAuth';

const ServiceDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { isAuthenticated } = useAuth();
  const service = useSelector(selectServiceDetails);
  const isLoading = useSelector(selectServiceLoading);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [quantity, setQuantity] = useState(1);

  // Available times for booking (would come from API in a real app)
  const availableTimes = [
    '09:00 AM', '10:00 AM', '11:00 AM',
    '12:00 PM', '01:00 PM', '02:00 PM',
    '03:00 PM', '04:00 PM', '05:00 PM'
  ];

  useEffect(() => {
    if (id) {
      dispatch(fetchServiceDetails(id));
    }
  }, [dispatch, id]);

  // Calculate total price with markup
  const calculateTotal = () => {
    if (!service) return 0;
    const basePrice = service.basePrice || 0;
    const markupPercentage = service.hotel?.markupPercentage || 0;
    return basePrice + (basePrice * (markupPercentage / 100)) * quantity;
  };

  // Handle booking
  const handleBooking = () => {
    if (!isAuthenticated) {
      navigate('/login', {
        state: {
          redirect: `/services/details/${id}`,
          message: 'Please log in to book this service'
        }
      });
      return;
    }

    navigate('/bookings/new', {
      state: {
        serviceId: id,
        date: selectedDate,
        time: selectedTime,
        quantity: quantity,
        totalPrice: calculateTotal()
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-main"></div>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow rounded-lg p-6 text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Service not found</h2>
          <p className="mb-4">The service you're looking for doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumbs */}
      <nav className="mb-6">
        <ol className="flex text-sm">
          <li className="hover:text-primary-main">
            <button onClick={() => navigate('/')}>Home</button>
          </li>
          <li className="mx-2 text-gray-500">/</li>
          <li className="hover:text-primary-main">
            <button onClick={() => navigate(`/services/${service.category}`)}>{service.category}</button>
          </li>
          <li className="mx-2 text-gray-500">/</li>
          <li className="text-gray-500">{service.name}</li>
        </ol>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Service Images */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="relative h-64 md:h-96">
              {service.image ? (
                <img
                  src={service.image}
                  alt={service.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-400">No image available</span>
                </div>
              )}
            </div>

            {/* Service Info */}
            <div className="p-6">
              <div className="flex flex-wrap justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                  <p className="text-gray-600 mt-1">Provided by {service.provider?.name || 'Unknown Provider'}</p>
                </div>

                <div className="flex items-center mt-2 md:mt-0">
                  <div className="flex items-center mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="ml-1 text-gray-700 font-medium">{service.rating.toFixed(1)}</span>
                    <span className="ml-1 text-gray-500">({service.reviewCount || 0} reviews)</span>
                  </div>
                  <span className="text-gray-500">
                    {service.bookingCount || 0} bookings
                  </span>
                </div>
              </div>

              {/* Description */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold text-gray-800">Description</h2>
                <p className="mt-2 text-gray-600">{service.description}</p>
              </div>

              {/* Features */}
              {service.features && service.features.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-xl font-semibold text-gray-800">Features</h2>
                  <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                    {service.features.map((feature, index) => (
                      <div key={index} className="flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="ml-2 text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Provider Info */}
              <div className="mt-6 pb-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-800">About the Provider</h2>
                <div className="mt-4 flex items-start">
                  <div className="flex-shrink-0">
                    {service.provider?.logo ? (
                      <img
                        src={service.provider.logo}
                        alt={service.provider.name}
                        className="h-12 w-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-primary-light text-white flex items-center justify-center text-lg font-semibold">
                        {service.provider?.name?.charAt(0) || 'P'}
                      </div>
                    )}
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-800">{service.provider?.name || 'Unknown Provider'}</h3>
                    <p className="text-sm text-gray-500">Member since {service.provider?.joinedAt ? format(new Date(service.provider.joinedAt), 'MMM yyyy') : 'Unknown'}</p>
                    <p className="mt-1 text-gray-600">{service.provider?.description || 'No description available.'}</p>
                  </div>
                </div>
              </div>

              {/* Reviews Section */}
              <div className="mt-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-gray-800">Reviews</h2>
                  <button className="text-primary-main hover:text-primary-dark font-medium">
                    See all reviews
                  </button>
                </div>

                {/* Reviews would be dynamically loaded here */}
                <div className="mt-4 space-y-4">
                  {service.reviews && service.reviews.length > 0 ? (
                    service.reviews.slice(0, 3).map((review) => (
                      <div key={review._id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex justify-between">
                          <div className="flex items-center">
                            <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {review.user?.name?.charAt(0) || 'U'}
                            </div>
                            <div className="ml-3">
                              <h4 className="text-sm font-medium text-gray-800">{review.user?.name || 'Anonymous'}</h4>
                              <p className="text-xs text-gray-500">{format(new Date(review.createdAt), 'PPP')}</p>
                            </div>
                          </div>
                          <div className="flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="ml-1 text-sm">{review.rating}</span>
                          </div>
                        </div>
                        <p className="mt-2 text-sm text-gray-600">{review.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No reviews yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Booking Section */}
        <div className="lg:col-span-1">
          <div className="sticky top-24 bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Book this service</h2>

            {/* Price Display */}
            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-gray-900">${service.basePrice?.toFixed(2)}</span>
                {service.hotel?.markupPercentage > 0 && (
                  <span className="ml-2 text-sm text-gray-500">
                    + {service.hotel.markupPercentage}% hotel markup
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">Per unit • Includes all taxes and fees</p>
            </div>

            {/* Date Selection */}
            <div className="mb-4">
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input
                type="date"
                id="date"
                className="form-input w-full"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate.toISOString().split('T')[0]}
                onChange={(e) => setSelectedDate(new Date(e.target.value))}
              />
            </div>

            {/* Time Selection */}
            <div className="mb-4">
              <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                Select Time
              </label>
              <select
                id="time"
                className="form-input w-full"
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                required
              >
                <option value="">Select a time</option>
                {availableTimes.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>

            {/* Quantity Selection */}
            <div className="mb-6">
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
                Quantity
              </label>
              <div className="flex items-center">
                <button
                  type="button"
                  className="px-3 py-2 border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  type="number"
                  id="quantity"
                  className="form-input border-l-0 border-r-0 rounded-none text-center"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                />
                <button
                  type="button"
                  className="px-3 py-2 border border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            {/* Total Price */}
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="font-medium">Total</span>
                <span className="text-xl font-bold">${calculateTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Book Now Button */}
            <button
              className="w-full btn-primary py-3 font-medium"
              onClick={handleBooking}
              disabled={!selectedTime}
            >
              Book Now
            </button>

            {/* Cancellation Policy */}
            <p className="mt-4 text-xs text-gray-500 text-center">
              Free cancellation up to 24 hours before the booking.
              <br />
              <span className="text-primary-main hover:text-primary-dark cursor-pointer">View cancellation policy</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ServiceDetailsPage;
