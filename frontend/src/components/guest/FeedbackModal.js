/**
 * Feedback Modal Component
 * Displays feedback form after successful payment completion
 * Matches the design from the provided screenshot with custom colors
 */

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FaStar, FaTimes } from 'react-icons/fa';
import apiClient from '../../services/api.service';

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
