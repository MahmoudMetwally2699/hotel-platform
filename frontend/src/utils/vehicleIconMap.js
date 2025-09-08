import {
  FaCarSide,      // سيدان
  FaCarRear,      // هاتشباك
  FaVanShuttle,   // SUV / Van
  FaBus,          // ميني باص
  FaTruckPickup,  // بيك أب
  FaTaxi,         // تاكسي
  FaWheelchair,   // سيارة وصول
  FaUsers         // مشاركة الركوب
} from 'react-icons/fa6';
import { FaCar } from 'react-icons/fa'; // fallback افتراضي

// خريطة أدق لأشكال العربيات
export const vehicleIconMap = {
  economy_sedan: FaCarSide,
  comfort_sedan: FaCarSide,
  premium_sedan: FaCarSide,
  economy_suv: FaVanShuttle,
  comfort_suv: FaVanShuttle,
  premium_suv: FaVanShuttle,
  suv: FaVanShuttle,
  crossover: FaVanShuttle,
  van: FaVanShuttle,
  minivan: FaVanShuttle,
  mpv: FaVanShuttle,
  minibus: FaBus,
  bus: FaBus,
  coach: FaBus,
  shuttle: FaBus,
  hatchback: FaCarRear,
  luxury_car: FaCarSide,
  luxury: FaCarSide,
  premium: FaCarSide,
  executive: FaCarSide,
  sedan: FaCarSide,
  midsize: FaCarSide,
  economy: FaCarSide,
  compact: FaCarSide,
  pickup_truck: FaTruckPickup,
  truck: FaTruckPickup,
  pickup: FaTruckPickup,
  accessible_vehicle: FaWheelchair,
  local_taxi: FaTaxi,
  taxi: FaTaxi,
  cab: FaTaxi,
  shared_ride: FaUsers,
  sports: FaCarSide,
  sport: FaCarSide,
  convertible: FaCarSide,
  cabriolet: FaCarSide,
};

// الدالة زي ما هي
export function getVehicleIcon(vehicleType) {
  const Icon = vehicleIconMap[vehicleType] || FaCar;
  return (
    <Icon
      className="inline text-lg text-gray-600"
      style={{ marginInlineStart: '0.5rem', marginInlineEnd: '0.75rem' }}
      aria-label={vehicleType}
    />
  );
}
