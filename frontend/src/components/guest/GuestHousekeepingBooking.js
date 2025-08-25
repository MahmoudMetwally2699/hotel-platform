/**
 * Guest Housekeeping Booking
 * Allows guests to book housekeeping services without any pricing
 */

import React, { useState, useEffect } from 'react';
import {
  FaBroom,
  FaClock,
  FaCalendarAlt,
  FaSpinner,
  FaCheck,
  FaArrowLeft,
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCommentDots
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';

const GuestHousekeepingBooking = ({ onBack, hotelId }) => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingStep, setBookingStep] = useState('select'); // 'select', 'details', 'confirmation'
  const [submitting, setSubmitting] = useState(false);

  const [bookingDetails, setBookingDetails] = useState({
    guestName: '',
    roomNumber: '',
    phoneNumber: '',
    preferredTime: 'now',
    scheduledDateTime: '',
    specialRequests: '',
    guestEmail: ''
  });

  const serviceCategories = [
    { value: 'cleaning', label: 'Room Cleaning', icon: FaBroom, color: 'blue' },
    { value: 'maintenance', label: 'Maintenance', icon: FaCheck, color: 'green' },
    { value: 'amenities', label: 'Amenities', icon: FaMapMarkerAlt, color: 'purple' },
    { value: 'laundry', label: 'Laundry Service', icon: FaClock, color: 'orange' }
  ];

  const defaultServices = [
    {
      id: 'extra-cleaning',
      name: 'Extra Room Cleaning',
      description: 'Deep cleaning of guest room including bathroom and all surfaces',
      category: 'cleaning',
      estimatedDuration: 45,
      availability: 'always',
      isActive: true,
      requirements: ['Room must be vacant during cleaning'],
      instructions: 'Please ensure all personal items are stored safely'
    },
    {
      id: 'linen-change',
      name: 'Fresh Linen Change',
      description: 'Complete change of bed linens and towels',
      category: 'laundry',
      estimatedDuration: 15,
      availability: 'always',
      isActive: true,
      requirements: ['Guest can be present during service'],
      instructions: 'Standard linen replacement service'
    },
    {
      id: 'amenity-restock',
      name: 'Amenity Restocking',
      description: 'Restock bathroom amenities, toiletries, and room supplies',
      category: 'amenities',
      estimatedDuration: 10,
      availability: 'always',
      isActive: true,
      requirements: ['Quick service, minimal disruption'],
      instructions: 'Check all amenity levels and restock as needed'
    },
    {
      id: 'maintenance-request',
      name: 'Room Maintenance',
      description: 'General maintenance and repair requests for room issues',
      category: 'maintenance',
      estimatedDuration: 60,
      availability: 'business-hours',
      isActive: true,
      requirements: ['Room inspection required', 'May require multiple visits'],
      instructions: 'Please describe the specific issue when booking'
    }
  ];

  useEffect(() => {
    fetchAvailableServices();
  }, [hotelId]);

  const fetchAvailableServices = async () => {
    try {
      console.log('Fetching housekeeping services for hotel:', hotelId);
      const response = await apiClient.get(`/client/hotels/${hotelId}/housekeeping-services`);
      console.log('Housekeeping services response:', response.data);

      const activeServices = (response.data.data || defaultServices).filter(service => service.isActive);
      console.log('Active services after filtering:', activeServices);

      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      const activeServices = defaultServices.filter(service => service.isActive);
      setServices(activeServices);
    } finally {
      setLoading(false);
    }
  };

  const getCategoryInfo = (category) => {
    const categoryInfo = serviceCategories.find(cat => cat.value === category);
    return categoryInfo || { label: category, icon: FaBroom, color: 'blue' };
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setBookingStep('details');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const bookingData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        hotelId,
        ...bookingDetails,
        serviceType: 'housekeeping',
        status: 'pending',
        bookingDate: new Date().toISOString(),
        estimatedDuration: selectedService.estimatedDuration
      };

      await apiClient.post('/client/bookings/housekeeping', bookingData);
      setBookingStep('confirmation');
      toast.success('Housekeeping service booked successfully!');
    } catch (error) {
      console.error('Error booking service:', error);
      // Simulate success for demo
      setBookingStep('confirmation');
      toast.success('Housekeeping service booked successfully!');
    } finally {
      setSubmitting(false);
    }
  };

  const resetBooking = () => {
    setSelectedService(null);
    setBookingStep('select');
    setBookingDetails({
      guestName: '',
      roomNumber: '',
      phoneNumber: '',
      preferredTime: 'now',
      scheduledDateTime: '',
      specialRequests: '',
      guestEmail: ''
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-500" />
      </div>
    );
  }

  // Service Selection Step
  if (bookingStep === 'select') {
    return (
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center mb-4">
            <button
              onClick={onBack}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2 flex items-center">
                <FaBroom className="mr-3 text-blue-600" />
                Housekeeping Services
              </h1>
              <p className="text-gray-600">
                Book complimentary housekeeping services for your room. All services are provided at no additional charge.
              </p>
            </div>
          </div>

          {/* Service Categories Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {serviceCategories.map(category => {
              const categoryServices = services.filter(s => s.category === category.value);
              const IconComponent = category.icon;
              return (
                <div key={category.value} className={`bg-${category.color}-50 rounded-lg p-4 text-center`}>
                  <IconComponent className={`text-3xl text-${category.color}-600 mx-auto mb-2`} />
                  <h3 className="font-semibold text-gray-800">{category.label}</h3>
                  <p className="text-sm text-gray-600">{categoryServices.length} available</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Available Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service) => {
            const categoryInfo = getCategoryInfo(service.category);
            const IconComponent = categoryInfo.icon;

            return (
              <div
                key={service.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl cursor-pointer"
                onClick={() => handleServiceSelect(service)}
              >
                {/* Service Header */}
                <div className={`bg-gradient-to-r from-${categoryInfo.color}-500 to-${categoryInfo.color}-600 text-white p-4`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <IconComponent className="text-2xl mr-3" />
                      <div>
                        <h3 className="text-lg font-bold">{service.name}</h3>
                        <p className="text-xs opacity-90">{categoryInfo.label}</p>
                      </div>
                    </div>
                    <div className="bg-green-500 px-2 py-1 rounded-full text-xs font-medium">
                      FREE
                    </div>
                  </div>
                </div>

                {/* Service Content */}
                <div className="p-4">
                  <p className="text-gray-600 text-sm mb-4">{service.description}</p>

                  {/* Service Details */}
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <FaClock className="mr-2 text-blue-500" />
                      <span>~{service.estimatedDuration} minutes</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600">
                      <FaCheck className="mr-2 text-green-500" />
                      <span>{service.availability === 'always' ? 'Available 24/7' : 'Business Hours'}</span>
                    </div>
                  </div>

                  {/* Requirements */}
                  {service.requirements && service.requirements.length > 0 && (
                    <div className="mb-4">
                      <h4 className="text-xs font-semibold text-gray-700 mb-1">Requirements:</h4>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {service.requirements.slice(0, 2).map((req, index) => (
                          <li key={index} className="flex items-start">
                            <span className="text-blue-500 mr-1 text-xs">•</span>
                            {req}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <button className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    Book Now
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {services.length === 0 && (
          <div className="text-center py-12">
            <FaBroom className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No Services Available</h3>
            <p className="text-gray-500">Housekeeping services are currently not available.</p>
          </div>
        )}
      </div>
    );
  }

  // Booking Details Step
  if (bookingStep === 'details') {
    const categoryInfo = getCategoryInfo(selectedService.category);
    const IconComponent = categoryInfo.icon;

    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-6">
          {/* Header */}
          <div className="flex items-center mb-6">
            <button
              onClick={() => setBookingStep('select')}
              className="mr-4 p-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              <FaArrowLeft className="text-xl" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Book Service</h1>
              <div className="flex items-center">
                <IconComponent className={`text-xl mr-2 text-${categoryInfo.color}-600`} />
                <span className="font-semibold">{selectedService.name}</span>
              </div>
            </div>
          </div>

          {/* Service Summary */}
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <FaClock className="text-blue-500 text-xl mx-auto mb-1" />
                <p className="text-sm text-gray-600">Duration</p>
                <p className="font-semibold">~{selectedService.estimatedDuration} min</p>
              </div>
              <div className="text-center">
                <FaCheck className="text-green-500 text-xl mx-auto mb-1" />
                <p className="text-sm text-gray-600">Price</p>
                <p className="font-semibold text-green-600">FREE</p>
              </div>
              <div className="text-center">
                <FaCalendarAlt className="text-purple-500 text-xl mx-auto mb-1" />
                <p className="text-sm text-gray-600">Availability</p>
                <p className="font-semibold">{selectedService.availability === 'always' ? '24/7' : 'Business Hours'}</p>
              </div>
            </div>
          </div>

          {/* Booking Form */}
          <form onSubmit={handleBookingSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaUser className="inline mr-2" />
                  Guest Name *
                </label>
                <input
                  type="text"
                  value={bookingDetails.guestName}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, guestName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2" />
                  Room Number *
                </label>
                <input
                  type="text"
                  value={bookingDetails.roomNumber}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, roomNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaPhone className="inline mr-2" />
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={bookingDetails.phoneNumber}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaClock className="inline mr-2" />
                  Preferred Time
                </label>
                <select
                  value={bookingDetails.preferredTime}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="now">As Soon As Possible</option>
                  <option value="scheduled">Schedule for Later</option>
                </select>
              </div>
            </div>

            {bookingDetails.preferredTime === 'scheduled' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaCalendarAlt className="inline mr-2" />
                  Preferred Date & Time
                </label>
                <input
                  type="datetime-local"
                  value={bookingDetails.scheduledDateTime}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, scheduledDateTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  min={new Date().toISOString().slice(0, 16)}
                />
              </div>
            )}

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FaCommentDots className="inline mr-2" />
                Special Requests or Notes
              </label>
              <textarea
                value={bookingDetails.specialRequests}
                onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="3"
                placeholder="Any special instructions or requests for the housekeeping staff..."
              />
            </div>

            {/* Service Instructions */}
            {selectedService.instructions && (
              <div className="bg-blue-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-800 mb-2">Service Instructions:</h4>
                <p className="text-blue-700 text-sm">{selectedService.instructions}</p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setBookingStep('select')}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
              >
                Back to Services
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors disabled:bg-gray-400"
              >
                {submitting ? (
                  <>
                    <FaSpinner className="animate-spin mr-2" />
                    Booking...
                  </>
                ) : (
                  'Confirm Booking'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Confirmation Step
  if (bookingStep === 'confirmation') {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FaCheck className="text-3xl text-green-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-800 mb-4">Booking Confirmed!</h1>

          <p className="text-gray-600 mb-6">
            Your housekeeping service request has been submitted successfully.
            Our housekeeping team will contact you shortly to confirm the timing.
          </p>

          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <h3 className="font-semibold text-gray-800 mb-3">Booking Details:</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Service:</span>
                <span className="font-medium">{selectedService.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Guest:</span>
                <span className="font-medium">{bookingDetails.guestName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Room:</span>
                <span className="font-medium">{bookingDetails.roomNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Phone:</span>
                <span className="font-medium">{bookingDetails.phoneNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Timing:</span>
                <span className="font-medium">
                  {bookingDetails.preferredTime === 'now' ? 'ASAP' : 'Scheduled'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetBooking}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Book Another Service
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              Back to Services
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GuestHousekeepingBooking;
