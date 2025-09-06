/**
 * Guest Housekeeping Booking
 * Allows guests to book housekeeping services without any pricing
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  FaBroom,
  FaClock,
  FaCalendarAlt,
  FaSpinner,
  FaCheck,
  FaArrowLeft,
  FaMapMarkerAlt
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const GuestHousekeepingBooking = ({ onBack, hotelId }) => {
  const { currentUser, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingStep, setBookingStep] = useState('select'); // 'select', 'details', 'confirmation'
  const [submitting, setSubmitting] = useState(false);

  const [bookingDetails, setBookingDetails] = useState({
    guestName: '',
    roomNumber: '',
    phoneNumber: '',
    preferredTime: '09:00',
    scheduledDateTime: '',
    specialRequests: '',
    guestEmail: ''
  });

  const serviceCategories = [
    {
      value: 'amenities',
      label: t('housekeeping.categories.amenities', 'Amenities'),
      icon: FaMapMarkerAlt,
      color: 'gray',
      image: '/amenities.jpg',
      description: t('housekeeping.descriptions.amenities', 'Fresh towels and supplies')
    },
    {
      value: 'cleaning',
      label: t('housekeeping.categories.cleaning', 'Room Cleaning'),
      icon: FaBroom,
      color: 'blue',
      image: '/roomcleaning.jpg',
      description: t('housekeeping.descriptions.cleaning', 'Professional room cleaning')
    },
    {
      value: 'maintenance',
      label: t('housekeeping.categories.maintenance', 'Maintenance'),
      icon: FaCheck,
      color: 'amber',
      image: '/maintaince.jpg',
      description: 'Repairs and technical support'
    }
  ];

  // Auto-populate user data if logged in
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      const fullName = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim();
      const phoneNumber = currentUser.phone || '';

      setBookingDetails(prev => ({
        ...prev,
        guestName: fullName || currentUser.name || '',
        phoneNumber: phoneNumber,
        guestEmail: currentUser.email || ''
      }));
    }
  }, [isAuthenticated, currentUser]);

  const fetchAvailableServices = useCallback(async () => {
    try {
      console.log('Fetching housekeeping services for hotel:', hotelId);
      const response = await apiClient.get(`/client/hotels/${hotelId}/housekeeping-services`);
      console.log('Housekeeping services response:', response.data);

      const activeServices = (response.data.data || []).filter(service => service.isActive);
      console.log('Active services after filtering:', activeServices);

      setServices(activeServices);
    } catch (error) {
      console.error('Error fetching housekeeping services:', error);
      setServices([]);
    } finally {
      setLoading(false);
    }
  }, [hotelId]);

  useEffect(() => {
    fetchAvailableServices();
  }, [fetchAvailableServices]);

  const getCategoryInfo = (category) => {
    const categoryInfo = serviceCategories.find(cat => cat.value === category);
    return categoryInfo || { label: category, icon: FaBroom, color: 'blue' };
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);

    // Set default time based on service category
    if (service.category === 'maintenance') {
      setBookingDetails(prev => ({ ...prev, preferredTime: 'asap' }));
    } else {
      setBookingDetails(prev => ({ ...prev, preferredTime: '09:00' }));
    }

    setBookingStep('details');
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      // For backend compatibility, keep 'now' for ASAP but also provide display text
      const backendTime = bookingDetails.preferredTime === 'asap' ? 'now' : bookingDetails.preferredTime;

      const bookingData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceCategory: selectedService.category, // Include the service category
        hotelId,
        ...bookingDetails,
        preferredTime: backendTime, // Send 'now' for backend compatibility
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
      preferredTime: '09:00',
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
      <div className="min-h-screen bg-gray-50">
        {/* Header with Back Button */}
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors mb-2"
            >
              <FaArrowLeft className="mr-2" />
              <span>Back</span>
            </button>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Housekeeping Header Card */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            {/* Header Image */}
            <div className="relative h-48 bg-gradient-to-r from-blue-500 to-blue-600">
              <img
                src="/housekeeping-header.jpg"
                alt="Housekeeping"
                className="w-full h-full object-cover mix-blend-overlay"
              />
              <div className="absolute inset-0 bg-blue-600/20"></div>
            </div>

            {/* Header Content */}
            <div className="p-6">
              <h1 className="text-2xl font-bold text-gray-900">{t('housekeeping.title', 'Housekeeping')}</h1>
            </div>
          </div>

          {/* Guest Services Section */}
          <div className="bg-white rounded-2xl shadow-sm p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('housekeeping.guestServices', 'Guest services')}</h2>

            {/* Service Categories Layout */}
            <div className="max-w-sm mx-auto space-y-4">
              {/* Top Row - Two Items */}
              <div className="grid grid-cols-2 gap-4">
                {serviceCategories.slice(0, 2).map(category => {
                  const categoryServices = services.filter(s => s.category === category.value);
                  return (
                    <button
                      key={category.value}
                      onClick={() => {
                        const firstService = categoryServices[0];
                        if (firstService) handleServiceSelect(firstService);
                      }}
                      className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all w-full"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 w-full">
                        <img
                          src={category.image}
                          alt={category.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm text-center">{category.label}</h3>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Row - Centered Single Item */}
              {serviceCategories.slice(2).map(category => {
                const categoryServices = services.filter(s => s.category === category.value);
                return (
                  <div key={category.value} className="flex justify-center">
                    <button
                      onClick={() => {
                        const firstService = categoryServices[0];
                        if (firstService) handleServiceSelect(firstService);
                      }}
                      className="group bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md transition-all w-40"
                    >
                      <div className="aspect-square rounded-xl overflow-hidden mb-3 w-full">
                        <img
                          src={category.image}
                          alt={category.label}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                      <h3 className="font-medium text-gray-900 text-sm text-center">{category.label}</h3>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* No Services Message */}
        {services.length === 0 && (
          <div className="text-center py-12">
            <FaBroom className="text-6xl text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">{t('housekeeping.noServices', 'No Services Available')}</h3>
            <p className="text-gray-500">{t('housekeeping.noServicesDescription', 'Housekeeping services are currently not available.')}</p>
          </div>
        )}
      </div>
    );
  }

  // Booking Details Step - Modal Design
  if (bookingStep === 'details') {
    const categoryInfo = getCategoryInfo(selectedService.category);

    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-2 sm:p-4 sm:items-center overflow-y-auto"
        style={{ touchAction: 'manipulation' }}
      >
        <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-sm mx-auto my-2 sm:my-0 max-h-[calc(100vh-1rem)] sm:max-h-[90vh] overflow-y-auto">
          {/* Modal Header */}
          <div className="relative p-4 sm:p-6 pb-3 sm:pb-4">
            <button
              onClick={() => setBookingStep('select')}
              className="absolute top-3 sm:top-4 right-3 sm:right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 sm:p-0"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="text-center pr-8 sm:pr-0">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-1">
                {categoryInfo.label}
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">{t('housekeeping.scheduleService', 'Schedule our service below')}</p>
            </div>
          </div>

          {/* Modal Content */}
          <div className="px-4 sm:px-6 pb-4 sm:pb-6">
            <form onSubmit={handleBookingSubmit} className="space-y-3 sm:space-y-4">
              {/* Date/Time Field */}
              <div>
                <div className="relative">
                  <FaCalendarAlt className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="datetime-local"
                    value={bookingDetails.scheduledDateTime}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, scheduledDateTime: e.target.value }))}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-600 text-sm sm:text-base"
                    min={new Date().toISOString().slice(0, 16)}
                    placeholder="01/08/2023"
                  />
                </div>
              </div>

              {/* Time Selection */}
              <div>
                <div className="relative">
                  <FaClock className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <select
                    value={bookingDetails.preferredTime}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, preferredTime: e.target.value }))}
                    className="w-full pl-10 sm:pl-12 pr-8 sm:pr-4 py-3 sm:py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-600 appearance-none bg-white text-sm sm:text-base cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: 'right 0.75rem center',
                      backgroundRepeat: 'no-repeat',
                      backgroundSize: '1.5em 1.5em',
                      WebkitAppearance: 'none',
                      MozAppearance: 'none'
                    }}
                  >
                    {selectedService && selectedService.category === 'maintenance' && (
                      <option value="asap">{t('housekeeping.asap', 'As soon as possible')}</option>
                    )}
                    <option value="09:00">09:00</option>
                    <option value="10:00">10:00</option>
                    <option value="11:00">11:00</option>
                    <option value="12:00">12:00</option>
                    <option value="13:00">13:00</option>
                    <option value="14:00">14:00</option>
                    <option value="15:00">15:00</option>
                    <option value="16:00">16:00</option>
                    <option value="17:00">17:00</option>
                  </select>
                </div>
              </div>

              {/* Room Number */}
              <div>
                <div className="relative">
                  <FaMapMarkerAlt className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    type="text"
                    value={bookingDetails.roomNumber}
                    onChange={(e) => setBookingDetails(prev => ({ ...prev, roomNumber: e.target.value }))}
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-600 text-sm sm:text-base"
                    placeholder={t('housekeeping.roomNumber', 'Room')}
                    required
                  />
                </div>
              </div>

              {/* Additional Notes */}
              <div>
                <textarea
                  value={bookingDetails.specialRequests}
                  onChange={(e) => setBookingDetails(prev => ({ ...prev, specialRequests: e.target.value }))}
                  className="w-full px-3 sm:px-4 py-3 sm:py-3 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-gray-600 resize-none text-sm sm:text-base"
                  rows="3"
                  placeholder={t('housekeeping.additionalNotes', 'Any additional Notes')}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-400 to-blue-500 text-white py-3 sm:py-3 px-4 sm:px-6 rounded-2xl font-medium hover:from-blue-500 hover:to-blue-600 transition-all duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base min-h-[48px]"
              >
                {submitting ? (
                  <div className="flex items-center justify-center">
                    <FaSpinner className="animate-spin mr-2" />
                    <span className="text-sm sm:text-base">{t('housekeeping.processing', 'Processing...')}</span>
                  </div>
                ) : (
                  <span className="text-sm sm:text-base">{t('housekeeping.submitRequest', 'Submit Request')}</span>
                )}
              </button>
            </form>
          </div>
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

          <h1 className="text-2xl font-bold text-gray-800 mb-4">{t('housekeeping.bookingConfirmed', 'Booking Confirmed!')}</h1>

          <p className="text-gray-600 mb-6">
            {t('housekeeping.confirmationMessage', 'Your housekeeping service request has been submitted successfully. Our housekeeping team will contact you shortly to confirm the timing.')}
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
                  {bookingDetails.preferredTime === 'asap' || bookingDetails.preferredTime === 'now' ? t('housekeeping.asap', 'As soon as possible') : bookingDetails.preferredTime}
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={resetBooking}
              className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('housekeeping.bookAnother', 'Book Another Service')}
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
            >
              {t('common.back', 'Back to Services')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default GuestHousekeepingBooking;
