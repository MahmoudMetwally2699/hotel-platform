/**
 * Simple Transportation Booking Page
 * Client enters destination only - service provider will quote the price
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  FaCar,
  FaArrowLeft,
  FaSpinner,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaClock,
  FaUsers,
  FaSuitcase,
  FaStickyNote,
  FaPaperPlane
} from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { toast } from 'react-toastify';
import useRTL from '../../hooks/useRTL';

const SimpleTransportationBooking = () => {
  const { t } = useTranslation();
  const { isRTL } = useRTL();
  const navigate = useNavigate();
  const location = useLocation();
  const { hotelId } = useParams();

  // Get service and hotel from location state
  const { service: passedService, hotel: passedHotel } = location.state || {};

  const [service, setService] = useState(passedService || null);
  const [hotel, setHotel] = useState(passedHotel || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Simplified booking form
  const [bookingData, setBookingData] = useState({
    destination: '',
    pickupDate: '',
    pickupTime: '',
    pickupLocation: '',
    vehicleType: 'sedan', // Default vehicle preference
    comfortLevel: 'economy', // Default comfort level
    passengerCount: 1,
    luggageCount: 0,
    specialRequests: ''
  });

  const vehicleTypes = [
    { value: 'sedan', label: t('transportation.vehicleTypes.sedan') },
    { value: 'suv', label: t('transportation.vehicleTypes.suv') },
    { value: 'van', label: t('transportation.vehicleTypes.van') },
    { value: 'luxury', label: t('transportation.vehicleTypes.luxury') },
    { value: 'minibus', label: t('transportation.vehicleTypes.minibus') }
  ];

  const comfortLevels = [
    { value: 'economy', label: t('transportation.comfortLevels.economy') },
    { value: 'comfort', label: t('transportation.comfortLevels.comfort') },
    { value: 'premium', label: t('transportation.comfortLevels.premium') }
  ];

  useEffect(() => {
    const fetchServiceDetails = async () => {
      try {
        setLoading(true);

        // If service and hotel are passed via state, use them
        if (passedService && passedHotel) {
          setService(passedService);
          setHotel(passedHotel);
          setLoading(false);
          return;
        }

        // Otherwise fetch hotel details and transportation service
        if (hotelId) {
          const hotelResponse = await apiClient.get(`/client/hotels/${hotelId}`);
          setHotel(hotelResponse.data.data);

          // Fetch transportation services for this hotel
          const servicesResponse = await apiClient.get(`/client/hotels/${hotelId}/services/transportation`);

          if (servicesResponse.data.success && servicesResponse.data.data.services.length > 0) {
            setService(servicesResponse.data.data.services[0]); // Use first service as default
          } else {
            toast.error(t('errors.noTransportationServices'));
            navigate(`/hotels/${hotelId}/categories`);
            return;
          }
        }
      } catch (error) {
        console.error('Error fetching service details:', error);
        toast.error(t('errors.loadServices'));
        navigate(`/hotels/${hotelId}/categories`);
      } finally {
        setLoading(false);
      }
    };

    fetchServiceDetails();
  }, [hotelId, passedService, passedHotel, navigate, t]);

  const handleInputChange = (field, value) => {
    setBookingData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const isValidForm = () => {
    return (
      bookingData.destination.trim() &&
      bookingData.pickupDate &&
      bookingData.pickupTime &&
      bookingData.vehicleType &&
      bookingData.comfortLevel &&
      bookingData.passengerCount > 0
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isValidForm()) {
      toast.error(t('transportation.errors.fillRequiredFields'));
      return;
    }

    try {
      setSubmitting(true);

      // Create transportation booking request
      const bookingPayload = {
        serviceId: service._id,
        hotelId: hotelId,
        tripDetails: {
          destination: bookingData.destination,
          pickupLocation: bookingData.pickupLocation || hotel?.address || '',
          scheduledDateTime: `${bookingData.pickupDate}T${bookingData.pickupTime}:00.000Z`,
          passengerCount: bookingData.passengerCount,
          luggageCount: bookingData.luggageCount
        },
        vehicleDetails: {
          vehicleType: bookingData.vehicleType,
          comfortLevel: bookingData.comfortLevel
        },
        guestNotes: bookingData.specialRequests
      };

      console.log('Creating transportation booking request:', bookingPayload);

      const response = await apiClient.post('/transportation-bookings/guest', bookingPayload);

      if (response.data.success) {
        toast.success(t('transportation.success.requestSent'));
        navigate('/my-bookings'); // Navigate to guest bookings page to see the quote when it arrives
      }
    } catch (error) {
      console.error('Error creating booking request:', error);
      toast.error(error.response?.data?.message || t('transportation.errors.requestFailed'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <FaSpinner className="text-4xl text-blue-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => navigate(`/hotels/${hotelId}/categories`)}
              className={`${isRTL ? 'ml-4' : 'mr-4'} p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors`}
            >
              <FaArrowLeft className={`text-xl ${isRTL ? 'transform rotate-180' : ''}`} />
            </button>
            <div className="flex items-center">
              <div className={`p-3 bg-blue-100 text-blue-600 rounded-lg ${isRTL ? 'ml-4' : 'mr-4'}`}>
                <FaCar className="text-2xl" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {t('transportation.requestRide')}
                </h1>
                <p className="text-gray-600 mt-1">
                  {hotel?.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6">
            {/* Info Banner */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <FaCar className="text-blue-600 mt-1 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">
                    {t('transportation.howItWorks')}
                  </h3>
                  <p className="text-blue-700 text-sm">
                    {t('transportation.howItWorksDescription')}
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Destination - Main field */}
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-2">
                  <FaMapMarkerAlt className="inline mr-2 text-red-500" />
                  {t('transportation.whereToGo')} *
                </label>
                <input
                  type="text"
                  value={bookingData.destination}
                  onChange={(e) => handleInputChange('destination', e.target.value)}
                  placeholder={t('transportation.destinationPlaceholder')}
                  className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCalendarAlt className="inline mr-2" />
                    {t('transportation.pickupDate')} *
                  </label>
                  <input
                    type="date"
                    value={bookingData.pickupDate}
                    onChange={(e) => handleInputChange('pickupDate', e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaClock className="inline mr-2" />
                    {t('transportation.pickupTime')} *
                  </label>
                  <select
                    value={bookingData.pickupTime}
                    onChange={(e) => handleInputChange('pickupTime', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">{t('transportation.selectTime')}</option>
                    {Array.from({ length: 24 }, (_, i) => {
                      const hour = i.toString().padStart(2, '0');
                      return (
                        <option key={hour} value={`${hour}:00`}>
                          {hour}:00
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

              {/* Pickup Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaMapMarkerAlt className="inline mr-2 text-green-500" />
                  {t('transportation.pickupLocation')}
                </label>
                <input
                  type="text"
                  value={bookingData.pickupLocation}
                  onChange={(e) => handleInputChange('pickupLocation', e.target.value)}
                  placeholder={t('transportation.pickupLocationPlaceholder')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('transportation.pickupLocationNote')}
                </p>
              </div>

              {/* Vehicle Preferences */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaCar className="inline mr-2" />
                    {t('transportation.preferredVehicle')} *
                  </label>
                  <select
                    value={bookingData.vehicleType}
                    onChange={(e) => handleInputChange('vehicleType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {vehicleTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('transportation.comfortLevel')} *
                  </label>
                  <select
                    value={bookingData.comfortLevel}
                    onChange={(e) => handleInputChange('comfortLevel', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {comfortLevels.map(level => (
                      <option key={level.value} value={level.value}>
                        {level.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Passenger and Luggage Count */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaUsers className="inline mr-2" />
                    {t('transportation.passengerCount')} *
                  </label>
                  <select
                    value={bookingData.passengerCount}
                    onChange={(e) => handleInputChange('passengerCount', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(count => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? t('transportation.passenger') : t('transportation.passengers')}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <FaSuitcase className="inline mr-2" />
                    {t('transportation.luggageCount')}
                  </label>
                  <select
                    value={bookingData.luggageCount}
                    onChange={(e) => handleInputChange('luggageCount', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    {[0, 1, 2, 3, 4, 5].map(count => (
                      <option key={count} value={count}>
                        {count} {count === 1 ? t('transportation.bag') : t('transportation.bags')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FaStickyNote className="inline mr-2" />
                  {t('transportation.specialRequests')}
                </label>
                <textarea
                  value={bookingData.specialRequests}
                  onChange={(e) => handleInputChange('specialRequests', e.target.value)}
                  placeholder={t('transportation.specialRequestsPlaceholder')}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting || !isValidForm()}
                  className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-4 px-6 rounded-lg transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <>
                      <FaSpinner className="animate-spin mr-2" />
                      {t('transportation.sending')}
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      {t('transportation.sendRequest')}
                    </>
                  )}
                </button>
              </div>

              {/* Info Note */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mt-4">
                <p className="text-yellow-800 text-sm">
                  <strong>{t('transportation.note')}:</strong> {t('transportation.noteDescription')}
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleTransportationBooking;
