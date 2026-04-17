const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

if (!enObj.profile) enObj.profile = {};
enObj.profile.guestInformation = "Stay Information";
enObj.profile.guestDetails = "Your current reservation details";
enObj.profile.reservationType = "Reservation Type";
enObj.profile.roomNumber = "Room Number";
enObj.profile.checkInDate = "Check-in Date";
enObj.profile.checkOutDate = "Check-out Date";
enObj.profile.ro = "Room Only (RO)";
enObj.profile.bb = "Bed & Breakfast (BB)";
enObj.profile.fb = "Full Board (FB)";
enObj.profile.allInclusive = "All Inclusive (All)";

if (!arObj.profile) arObj.profile = {};
arObj.profile.guestInformation = "معلومات الإقامة";
arObj.profile.guestDetails = "تفاصيل حجزك الحالي";
arObj.profile.reservationType = "نوع الحجز";
arObj.profile.roomNumber = "رقم الغرفة";
arObj.profile.checkInDate = "تاريخ الوصول";
arObj.profile.checkOutDate = "تاريخ المغادرة";
arObj.profile.ro = "غرفة فقط (RO)";
arObj.profile.bb = "مبيت وإفطار (BB)";
arObj.profile.fb = "إقامة كاملة (FB)";
arObj.profile.allInclusive = "إقامة شاملة (All)";

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');

console.log('Profile guest translations added successfully.');
