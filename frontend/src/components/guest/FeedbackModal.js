/**
 * Feedback Modal Component
 * Displays feedback form after successful payment completion
 * Matches the design from the provided screenshot with custom colors
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar, FaTimes, FaTshirt, FaCar, FaUtensils, FaCalendarAlt, FaMapMarkerAlt, FaReceipt } from 'react-icons/fa';
import apiClient from '../../services/api.service';
import { formatPriceByLanguage } from '../../utils/currency';

const FeedbackModal = ({
  isOpen,
  onClose,
  booking,
  onFeedbackSubmitted
}) => {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !booking) return null;

  // Debug: Log booking data to understand structure
  console.log('📋 FeedbackModal - Booking data:', {
    serviceId: booking.serviceId,
    serviceType: booking.serviceType,
    bookingType: booking.bookingType,
    category: booking.category,
    serviceDetails: booking.serviceDetails,
    fullBooking: booking
  });

  const handleStarClick = (starRating) => {
    setRating(starRating);
  };

  const handleStarHover = (starRating) => {
    setHoveredRating(starRating);
  };

  const handleStarLeave = () => {
    setHoveredRating(0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      setError(t('feedback.ratingRequired'));
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const feedbackData = {
        bookingId: booking._id,
        rating,
        comment: comment.trim(),
        serviceType: booking.serviceType || booking.bookingType || 'regular'
      };

      console.log('💬 Submitting feedback:', {
        bookingData: {
          _id: booking._id,
          bookingNumber: booking.bookingNumber,
          id: booking.id
        },
        feedbackData,
        fullBooking: booking
      });

      const response = await apiClient.post('/client/feedback', feedbackData);

      if (response.data.success) {
        // Store in localStorage that feedback was submitted for this booking
        if (booking._id) {
          localStorage.setItem(`feedback_${booking._id}`, 'submitted');
        }

        // Call parent callback to handle success
        if (onFeedbackSubmitted) {
          onFeedbackSubmitted(response.data.data);
        }
        onClose();
      } else {
        setError(response.data.message || t('feedback.submitError'));
      }
    } catch (error) {
      console.error('Feedback submission error:', error);
      setError(
        error.response?.data?.message ||
        t('feedback.submitError')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden shadow-2xl relative">
        {/* Decorative header with gradient */}
        <div
          className="h-20 relative"
          style={{
            background: `linear-gradient(135deg, #67BAE0 0%, #3B5787 100%)`
          }}
        >
          {/* Decorative dots pattern */}
          <div className="absolute inset-0 opacity-20">
            <div className="flex flex-wrap gap-2 p-4">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-full bg-white"
                  style={{
                    animationDelay: `${i * 0.1}s`,
                    animation: 'pulse 2s infinite'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all duration-200"
            disabled={isSubmitting}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Icon and title */}
          <div className="text-center mb-6">
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: '#67BAE0' }}
            >
              <FaStar className="text-white text-2xl" />
            </div>
            <h2
              className="text-xl font-semibold mb-2"
              style={{ color: '#3B5787' }}
            >
              {t('feedback.title', 'Share your feedback')}
            </h2>
          </div>

          {/* Booking Details Section */}
          {booking && (
            <div className="mb-6 bg-gray-50 rounded-lg p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                {/* Service Icon */}
                <div className="flex-shrink-0">
                  {booking.bookingType === 'laundry' || booking.serviceType === 'laundry' ? (
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                      <FaTshirt className="text-blue-600 text-xl" />
                    </div>
                  ) : booking.bookingType === 'transportation' || booking.serviceType === 'transportation' ? (
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                      <FaCar className="text-green-600 text-xl" />
                    </div>
                  ) : booking.bookingType === 'restaurant' || booking.serviceType === 'restaurant' ? (
                    <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                      <FaUtensils className="text-orange-600 text-xl" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                      <FaReceipt className="text-purple-600 text-xl" />
                    </div>
                  )}
                </div>

                {/* Booking Info */}
                <div className="flex-1 min-w-0">
                  {/* Service Type */}
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {(() => {
                      // Get the base category
                      const baseCategory = booking.serviceCategory ||
                                         booking.serviceId?.category ||
                                         booking.category ||
                                         booking.serviceDetails?.category ||
                                         booking.serviceType ||
                                         booking.bookingType;

                      console.log('🔍 Base service category:', baseCategory);
                      console.log('🔍 Housekeeping type field:', booking.serviceDetails?.housekeepingType);

                      // For housekeeping services, check the resolved housekeepingType field first
                      if (baseCategory === 'housekeeping') {
                        const housekeepingType = booking.serviceDetails?.housekeepingType;

                        if (housekeepingType) {
                          // Extract the type name - handle both string and object formats
                          const typeValue = typeof housekeepingType === 'string'
                            ? housekeepingType
                            : housekeepingType.name || housekeepingType.id;

                          // Use the pre-determined housekeeping type with translation
                          const translationKey = `feedback.serviceTypes.${typeValue}`;
                          console.log('✅ Using housekeepingType field:', typeValue);
                          return `${t(translationKey)} ${t('feedback.serviceTypes.service')}`;
                        }

                        // Fallback: Determine from specificCategory if housekeepingType is not set
                        if (booking.serviceDetails?.specificCategory) {
                          const specificCategories = Array.isArray(booking.serviceDetails.specificCategory)
                            ? booking.serviceDetails.specificCategory
                            : [booking.serviceDetails.specificCategory];

                          console.log('🔍 Specific categories found:', specificCategories);

                          // Determine the type based on specificCategory values
                          const hasMaintenanceIssues = specificCategories.some(cat =>
                            ['electrical_issues', 'plumbing_issues', 'ac_heating', 'furniture_repair', 'electronics_issues'].includes(cat)
                          );

                          const hasCleaningIssues = specificCategories.some(cat =>
                            ['general_cleaning', 'deep_cleaning', 'stain_removal'].includes(cat)
                          );

                          const hasAmenitiesIssues = specificCategories.some(cat =>
                            ['bathroom_amenities', 'room_supplies', 'cleaning_supplies'].includes(cat)
                          );

                          let typeKey = 'housekeeping';

                          if (hasMaintenanceIssues) {
                            typeKey = 'maintenance';
                          } else if (hasCleaningIssues) {
                            typeKey = 'cleaning';
                          } else if (hasAmenitiesIssues) {
                            typeKey = 'amenities';
                          }

                          console.log('✅ Displaying specific housekeeping type from specificCategory:', typeKey);
                          return `${t(`feedback.serviceTypes.${typeKey}`)} ${t('feedback.serviceTypes.service')}`;
                        }

                        // Default fallback for housekeeping
                        return `${t('feedback.serviceTypes.housekeeping')} ${t('feedback.serviceTypes.service')}`;
                      }

                      // For non-housekeeping services or when no specific category
                      if (['cleaning', 'amenities', 'maintenance'].includes(baseCategory)) {
                        return `${t(`feedback.serviceTypes.${baseCategory}`)} ${t('feedback.serviceTypes.service')}`;
                      }

                      // For other known service types
                      if (['laundry', 'transportation', 'restaurant'].includes(baseCategory)) {
                        return `${t(`feedback.serviceTypes.${baseCategory}`)} ${t('feedback.serviceTypes.service')}`;
                      }

                      // For unknown service types
                      const displayCategory = baseCategory ?
                        baseCategory.charAt(0).toUpperCase() + baseCategory.slice(1) :
                        t('feedback.serviceTypes.service');

                      return `${displayCategory} ${t('feedback.serviceTypes.service')}`;
                    })()}
                  </h3>                  {/* Booking Number */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FaReceipt className="text-gray-400" />
                    <span className="font-mono">
                      {booking.bookingNumber || booking.bookingReference || booking._id?.slice(-8)}
                    </span>
                  </div>

                  {/* Service-specific details */}
                  <div className="text-sm text-gray-600 space-y-2">
                    {/* Housekeeping Details */}
                    {(booking.bookingType === 'housekeeping' || booking.serviceType === 'housekeeping') && (
                      <>
                        {/* Show housekeeping type */}
                        {booking.serviceDetails?.housekeepingType && (
                          <div className="flex items-start gap-2 mt-2">
                            <span className="font-medium text-gray-700">Type:</span>
                            <span className="capitalize">
                              {typeof booking.serviceDetails.housekeepingType === 'string'
                                ? booking.serviceDetails.housekeepingType.replace(/_/g, ' ')
                                : booking.serviceDetails.housekeepingType.name?.replace(/_/g, ' ') || 'N/A'
                              }
                            </span>
                          </div>
                        )}

                        {/* Show specific issue categories */}
                        {booking.serviceDetails?.specificCategory &&
                         Array.isArray(booking.serviceDetails.specificCategory) &&
                         booking.serviceDetails.specificCategory.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700 block mb-1">Issue Categories:</span>
                            <div className="flex flex-wrap gap-1">
                              {booking.serviceDetails.specificCategory.map((category, index) => {
                                // Format category name
                                const formattedCategory = category
                                  .split('_')
                                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                  .join(' ');

                                return (
                                  <span
                                    key={index}
                                    className="inline-block bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs"
                                  >
                                    {formattedCategory}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Show description if available */}
                        {booking.serviceDetails?.description && booking.serviceDetails.description.length > 0 && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700 block mb-1">Details:</span>
                            <p className="text-xs text-gray-600 italic">
                              "{booking.serviceDetails.description}"
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Laundry Details */}
                    {(booking.bookingType === 'laundry' || booking.serviceType === 'laundry') && (
                      <>
                        {((booking.bookingConfig?.laundryItems?.length > 0) || (booking.laundryItems?.length > 0)) && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700 block mb-1">
                              Laundry Items ({booking.bookingConfig?.laundryItems?.length || booking.laundryItems?.length}):
                            </span>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(booking.bookingConfig?.laundryItems || booking.laundryItems || []).map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-xs bg-blue-50 p-2 rounded">
                                  <span className="font-medium">{item.itemName || item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">{item.quantity || 1}x</span>
                                    <span className="text-blue-600">
                                      {typeof (item.serviceType || item.type) === 'string'
                                        ? (item.serviceType || item.type)
                                        : (item.serviceType?.name || item.type?.name || 'N/A')
                                      }
                                    </span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {!!(booking.schedule?.preferredDate || booking.scheduledDate) && (
                          <div className="flex items-center gap-2 mt-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span>
                              {booking.schedule?.preferredDate || booking.scheduledDate}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Transportation Details */}
                    {(booking.bookingType === 'transportation' || booking.serviceType === 'transportation') && (
                      <>
                        {!!booking.tripDetails?.pickupLocation && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700 block mb-1">Pickup:</span>
                            <div className="flex items-center gap-2 text-xs">
                              <FaMapMarkerAlt className="text-green-500" />
                              <span>{booking.tripDetails.pickupLocation}</span>
                            </div>
                          </div>
                        )}
                        {!!booking.tripDetails?.destination && (
                          <div className="mt-1">
                            <span className="font-medium text-gray-700 block mb-1">Destination:</span>
                            <div className="flex items-center gap-2 text-xs">
                              <FaMapMarkerAlt className="text-red-500" />
                              <span>{booking.tripDetails.destination}</span>
                            </div>
                          </div>
                        )}
                        {!!booking.tripDetails?.scheduledDateTime && (
                          <div className="flex items-center gap-2 mt-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span className="text-xs">
                              {new Date(booking.tripDetails.scheduledDateTime).toLocaleString()}
                            </span>
                          </div>
                        )}
                        {!!booking.tripDetails?.passengers && (
                          <div className="mt-2">
                            <span className="text-xs">
                              <span className="font-medium">Passengers:</span> {booking.tripDetails.passengers}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Restaurant/Dining Details */}
                    {(booking.bookingType === 'restaurant' || booking.serviceType === 'restaurant' || booking.serviceType === 'dining') && (
                      <>
                        {/* Show ordered items */}
                        {((booking.bookingConfig?.selectedItems?.length > 0) || (booking.orderItems?.length > 0) || (booking.items?.length > 0)) && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700 block mb-1">
                              Order Items:
                            </span>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(booking.bookingConfig?.selectedItems || booking.orderItems || booking.items || []).map((item, index) => (
                                <div key={index} className="flex justify-between items-center text-xs bg-orange-50 p-2 rounded">
                                  <span className="font-medium">{item.itemName || item.name}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-gray-600">{item.quantity || 1}x</span>
                                    {item.price && (
                                      <span className="text-orange-600">
                                        {formatPriceByLanguage(item.price * (item.quantity || 1), 'en')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reservation details */}
                        {!!(booking.reservationDetails?.date || booking.bookingDate) && (
                          <div className="flex items-center gap-2 mt-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span className="text-xs">
                              {booking.reservationDetails?.date || booking.bookingDate}
                              {(booking.reservationDetails?.time || booking.bookingTime) &&
                                ` at ${booking.reservationDetails?.time || booking.bookingTime}`}
                            </span>
                          </div>
                        )}

                        {!!booking.reservationDetails?.numberOfGuests && (
                          <div className="mt-1">
                            <span className="text-xs">
                              <span className="font-medium">Guests:</span> {booking.reservationDetails.numberOfGuests}
                            </span>
                          </div>
                        )}

                        {/* Special requests */}
                        {!!(booking.specialRequests || booking.reservationDetails?.specialRequests) && (
                          <div className="mt-2">
                            <span className="font-medium text-gray-700 block mb-1 text-xs">Special Requests:</span>
                            <p className="text-xs text-gray-600 italic">
                              "{booking.specialRequests || booking.reservationDetails.specialRequests}"
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Total Amount */}
                    {!!(booking.payment?.totalAmount || booking.pricing?.total || booking.pricing?.totalAmount) && (
                      <div className="mt-3 pt-2 border-t border-gray-200">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">Total Amount:</span>
                          <span className="font-semibold text-gray-900">
                            {formatPriceByLanguage(
                              booking.payment?.totalAmount || booking.pricing?.total || booking.pricing?.totalAmount,
                              'en'
                            )}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Star Rating */}
            <div className="text-center">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const isActive = star <= (hoveredRating || rating);
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => handleStarClick(star)}
                      onMouseEnter={() => handleStarHover(star)}
                      onMouseLeave={handleStarLeave}
                      className="transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-2 rounded"
                      style={{
                        focusRingColor: '#67BAE0'
                      }}
                      disabled={isSubmitting}
                    >
                      <FaStar
                        size={32}
                        className={`transition-colors duration-200 ${
                          isActive
                            ? 'text-yellow-400'
                            : 'text-gray-300 hover:text-yellow-400'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
              {rating > 0 && (
                <p className="text-sm text-gray-600">
                  {rating === 1 && t('feedback.rating1', 'Poor')}
                  {rating === 2 && t('feedback.rating2', 'Fair')}
                  {rating === 3 && t('feedback.rating3', 'Good')}
                  {rating === 4 && t('feedback.rating4', 'Very Good')}
                  {rating === 5 && t('feedback.rating5', 'Excellent')}
                </p>
              )}
            </div>

            {/* Comment Section */}
            <div>
              <label
                className="block text-sm font-medium mb-2"
                style={{ color: '#3B5787' }}
              >
                {t('feedback.commentLabel', 'Any suggestions for further improvement? (optional)')}
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={t('feedback.commentPlaceholder', 'Your feedback')}
                rows={4}
                maxLength={1000}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:border-transparent transition-all duration-200"
                style={{
                  focusRingColor: '#67BAE0'
                }}
                disabled={isSubmitting}
              />
              <p className="text-xs text-gray-500 mt-1">
                {t('feedback.privacyNote', "Don't include personal or customer data in this feedback.")}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                {comment.length}/1000 {t('feedback.charactersRemaining', 'characters')}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSkip}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2"
                style={{ focusRingColor: '#67BAE0' }}
                disabled={isSubmitting}
              >
                {t('feedback.skip', 'Skip')}
              </button>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                className="flex-1 py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: rating === 0 ? '#9CA3AF' : 'linear-gradient(135deg, #67BAE0 0%, #3B5787 100%)',
                  focusRingColor: '#67BAE0'
                }}
              >
                {isSubmitting ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('feedback.submitting', 'Submitting...')}
                  </div>
                ) : (
                  t('feedback.submit', 'Send Feedback')
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default FeedbackModal;
