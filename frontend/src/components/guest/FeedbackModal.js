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
                  <h3 className="font-semibold text-gray-900 mb-1 capitalize">
                    {booking.serviceId?.category ||
                     booking.serviceType ||
                     booking.bookingType ||
                     booking.category ||
                     booking.serviceDetails?.category ||
                     'Service'} Service
                  </h3>

                  {/* Booking Number */}
                  <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                    <FaReceipt className="text-gray-400" />
                    <span className="font-mono">
                      {booking.bookingNumber || booking.bookingReference || booking._id?.slice(-8)}
                    </span>
                  </div>

                  {/* Service-specific details */}
                  <div className="text-sm text-gray-600 space-y-1">
                    {/* Laundry Details */}
                    {(booking.bookingType === 'laundry' || booking.serviceType === 'laundry') && (
                      <>
                        {(booking.bookingConfig?.laundryItems?.length || booking.laundryItems?.length) && (
                          <div className="flex items-center gap-2">
                            <FaTshirt className="text-gray-400 text-xs" />
                            <span>
                              {booking.bookingConfig?.laundryItems?.length || booking.laundryItems?.length} {t('feedback.items', 'items')}
                            </span>
                          </div>
                        )}
                        {(booking.schedule?.preferredDate || booking.scheduledDate) && (
                          <div className="flex items-center gap-2">
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
                        {booking.tripDetails?.destination && (
                          <div className="flex items-center gap-2">
                            <FaMapMarkerAlt className="text-gray-400 text-xs" />
                            <span className="truncate">
                              {booking.tripDetails.destination}
                            </span>
                          </div>
                        )}
                        {booking.tripDetails?.scheduledDateTime && (
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span>
                              {new Date(booking.tripDetails.scheduledDateTime).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Restaurant Details */}
                    {(booking.bookingType === 'restaurant' || booking.serviceType === 'restaurant') && (
                      <>
                        {(booking.reservationDetails?.date || booking.bookingDate) && (
                          <div className="flex items-center gap-2">
                            <FaCalendarAlt className="text-gray-400 text-xs" />
                            <span>
                              {booking.reservationDetails?.date || booking.bookingDate}
                              {(booking.reservationDetails?.time || booking.bookingTime) &&
                                ` at ${booking.reservationDetails?.time || booking.bookingTime}`}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Total Amount */}
                    {(booking.payment?.totalAmount || booking.pricing?.total) && (
                      <div className="mt-2 pt-2 border-t border-gray-200">
                        <span className="font-semibold text-gray-900">
                          {formatPriceByLanguage(
                            booking.payment?.totalAmount || booking.pricing?.total,
                            'en'
                          )}
                        </span>
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
