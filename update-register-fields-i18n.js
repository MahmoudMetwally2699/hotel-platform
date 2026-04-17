const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

if (!enObj.register) enObj.register = {};
enObj.register.roomNumber = "Room Number";
enObj.register.roomNumberPlaceholder = "e.g., 101, A205, Suite1";
enObj.register.checkInDate = "Check-in Date";
enObj.register.checkOutDate = "Check-out Date";

if (!arObj.register) arObj.register = {};
arObj.register.roomNumber = "رقم الغرفة";
arObj.register.roomNumberPlaceholder = "مثال: 101، A205، جناح 1";
arObj.register.checkInDate = "تاريخ الوصول";
arObj.register.checkOutDate = "تاريخ المغادرة";

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');

console.log('Room and Date translations added successfully.');
