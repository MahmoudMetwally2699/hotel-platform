/**
 * VehicleIcon Component
 *
 * A reusable component that displays actual car images instead of emojis
 * Maps vehicle types to corresponding car images from the public/car-image folder
 */
import React from 'react';

const VehicleIcon = ({ vehicleType, className = "w-16 h-16", size = "medium" }) => {
  // Size presets for different use cases - made even larger for better visibility
  const sizeClasses = {
    small: "w-10 h-10",
    medium: "w-16 h-16",
    large: "w-24 h-24",
    xl: "w-32 h-32"
  };  // Map vehicle types to car images
  const getVehicleImage = (type) => {
    const vehicleImageMap = {
      // Economy types
      'economy': '/car-image/EconomyCompact Car.jpg',
      'compact': '/car-image/EconomyCompact Car.jpg',
      'economy_sedan': '/car-image/EconomyCompact Car.jpg',
      'eco_vehicle': '/car-image/EconomyCompact Car.jpg',
      'local_taxi': '/car-image/EconomyCompact Car.jpg',
      'taxi': '/car-image/EconomyCompact Car.jpg',

      // Sedan types
      'sedan': '/car-image/SedanMidsize.png',
      'midsize': '/car-image/SedanMidsize.png',
      'comfort_sedan': '/car-image/SedanMidsize.png',
      'standard_sedan': '/car-image/SedanMidsize.png',
      'shared_ride': '/car-image/SedanMidsize.png',
      'car': '/car-image/SedanMidsize.png', // default fallback

      // SUV types
      'suv': '/car-image/SUVCrossover.jpg',
      'crossover': '/car-image/SUVCrossover.jpg',
      'economy_suv': '/car-image/SUVCrossover.jpg',
      'comfort_suv': '/car-image/SUVCrossover.jpg',

      // Premium SUV types
      'premium_suv': '/car-image/Premium Suv.png',
      'large_suv': '/car-image/Premium Suv.png',
      'luxury_suv': '/car-image/Premium Suv.png',
      'full_size_suv': '/car-image/Premium Suv.png',

      // Luxury types
      'luxury': '/car-image/LuxuryPremium.png',
      'premium': '/car-image/LuxuryPremium.png',
      'executive': '/car-image/LuxuryPremium.png',
      'luxury_vehicle': '/car-image/LuxuryPremium.png',
      'convertible': '/car-image/LuxuryPremium.png',
      'sports': '/car-image/LuxuryPremium.png',

      // Van/MPV types - Updated to use new van.jpg
      'van': '/car-image/van.jpg',
      'minivan': '/car-image/van.jpg',
      'mpv': '/car-image/van.jpg',
      'van_large': '/car-image/LargeVan.jpg',
      'passenger_van': '/car-image/LargeVan.jpg',
      'accessible_vehicle': '/car-image/van.jpg',
      'wheelchair': '/car-image/van.jpg',

      // Large vehicle types
      'bus': '/car-image/Large Vehicle.png',
      'coach': '/car-image/Large Vehicle.png',
      'shuttle': '/car-image/Large Vehicle.png',
      'truck': '/car-image/Large Vehicle.png',
      'pickup': '/car-image/Large Vehicle.png',
      'large_vehicle': '/car-image/Large Vehicle.png'
    };

    // Clean vehicle type for matching
    const cleanType = type ? type.toLowerCase().replace(/[^a-z0-9]/g, '_') : 'car';

    // Return the matched image or fallback to sedan
    return vehicleImageMap[cleanType] || vehicleImageMap[type?.toLowerCase()] || vehicleImageMap['car'];
  };

  const imageSrc = getVehicleImage(vehicleType);
  const appliedClassName = className || sizeClasses[size];

  // Better styling for container fitting
  const style = {
    objectFit: 'contain',
    maxWidth: '100%',
    maxHeight: '100%'
  };

  return (
    <img
      src={imageSrc}
      alt={`${vehicleType || 'car'} vehicle`}
      className={`${appliedClassName} object-contain`}
      style={style}
      onError={(e) => {
        // Fallback to sedan image if the specific image fails to load
        e.target.src = '/car-image/SedanMidsize.png';
      }}
    />
  );
};

export default VehicleIcon;
