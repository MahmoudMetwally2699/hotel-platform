import {
  FaCarSide,      // سيدان
  FaCarRear,      // هاتشباك
  FaVanShuttle,   // SUV / Van
  FaBus,          // ميني باص
  FaTruckPickup,  // بيك أب
  FaTaxi,         // تاكسي
  FaWheelchair,   // سيارة وصول
  FaUsers,        // مشاركة الركوب
  FaCrown         // تاج للفئات المميزة
} from 'react-icons/fa6';
import { FaCar } from 'react-icons/fa'; // fallback افتراضي

// خريطة أدق لأشكال العربيات
export const vehicleIconMap = {
  economy_sedan: FaCarSide,
  comfort_sedan: FaCarSide,
  premium_sedan: FaCarSide, // نقدر نضيف تاج جنبه
  economy_suv: FaVanShuttle,
  comfort_suv: FaVanShuttle,
  premium_suv: FaVanShuttle,
  van: FaVanShuttle,
  minibus: FaBus,
  hatchback: FaCarRear,
  luxury_car: FaCarSide,
  pickup_truck: FaTruckPickup,
  accessible_vehicle: FaWheelchair,
  local_taxi: FaTaxi,
  shared_ride: FaUsers,
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
