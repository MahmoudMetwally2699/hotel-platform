/**
 * Housekeeping Booking Page
 * Page wrapper for the guest housekeeping booking component
 */

import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import GuestHousekeepingBooking from '../../components/guest/GuestHousekeepingBooking';

const HousekeepingBookingPage = () => {
  const { hotelId } = useParams();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(`/hotels/${hotelId}/categories`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <GuestHousekeepingBooking
        hotelId={hotelId}
        onBack={handleBack}
      />
    </div>
  );
};

export default HousekeepingBookingPage;
