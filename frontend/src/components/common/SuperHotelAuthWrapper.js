import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * SuperHotelAuthWrapper
 * Prevents the main auth system from interfering with Super Hotel routes
 */
const SuperHotelAuthWrapper = ({ children }) => {
  const location = useLocation();

  useEffect(() => {
    // If we're on a Super Hotel route, prevent the main auth system from clearing tokens
    if (location.pathname.startsWith('/super-hotel-admin')) {
      // Store a flag to indicate we're in Super Hotel mode
      sessionStorage.setItem('isSuperHotelMode', 'true');

      // Temporarily preserve any existing tokens that might get cleared
      const superHotelToken = localStorage.getItem('superHotelToken');
      const superHotelData = localStorage.getItem('superHotelData');

      if (superHotelToken && superHotelData) {
        // Re-store them to ensure they persist
        localStorage.setItem('superHotelToken', superHotelToken);
        localStorage.setItem('superHotelData', superHotelData);
      }
    } else {
      // Remove the flag when leaving Super Hotel routes
      sessionStorage.removeItem('isSuperHotelMode');
    }
  }, [location.pathname]);

  return children;
};

export default SuperHotelAuthWrapper;
