/**
 * Feedback Prompt Component
 * Automatically checks for pending feedback requests and displays the modal
 * Persists across sessions until user submits feedback or skips it
 */

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../hooks/useAuth';
import bookingService from '../../services/booking.service';
import FeedbackModal from './FeedbackModal';

const FeedbackPrompt = () => {
  const { isAuthenticated, role } = useAuth();
  const [pendingBooking, setPendingBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isCheckingRef = useRef(false);
  const hasCheckedRef = useRef(false);

  const checkForPendingFeedback = async () => {
    // Prevent multiple simultaneous checks
    if (isCheckingRef.current || hasCheckedRef.current) return;

    // Only check for guests
    if (!isAuthenticated || role !== 'guest') return;

    isCheckingRef.current = true;
    try {
      const response = await bookingService.getPendingFeedback();

      if (response.success && response.data) {
        console.log('Found pending feedback for booking:', response.data.bookingNumber);
        setPendingBooking(response.data);
        setIsModalOpen(true);
        hasCheckedRef.current = true; // Mark as checked to prevent re-checking
      } else {
        hasCheckedRef.current = true;
      }
    } catch (error) {
      console.error('Error checking for pending feedback:', error);
    } finally {
      isCheckingRef.current = false;
    }
  };

  // Check for pending feedback when component mounts, user authenticates, or page refreshes
  useEffect(() => {
    // Reset check flag on mount (page refresh will trigger new mount)
    hasCheckedRef.current = false;

    if (isAuthenticated && role === 'guest') {
      checkForPendingFeedback();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, role]);

  const handleFeedbackSubmitted = () => {
    setPendingBooking(null);
    setIsModalOpen(false);
    hasCheckedRef.current = false; // Allow checking again after feedback submitted
  };

  const handleSkip = async () => {
    if (pendingBooking) {
      try {
        await bookingService.skipFeedback(pendingBooking._id);
        setPendingBooking(null);
        setIsModalOpen(false);
        hasCheckedRef.current = false; // Allow checking again after skip
      } catch (error) {
        console.error('Error skipping feedback:', error);
        // Still close the modal even if the API call fails
        setIsModalOpen(false);
      }
    } else {
      setIsModalOpen(false);
    }
  };

  // Only render the modal if we have a pending booking
  if (!pendingBooking) {
    return null;
  }

  return (
    <FeedbackModal
      isOpen={isModalOpen}
      onClose={handleSkip}
      booking={pendingBooking}
      onFeedbackSubmitted={handleFeedbackSubmitted}
    />
  );
};

export default FeedbackPrompt;
