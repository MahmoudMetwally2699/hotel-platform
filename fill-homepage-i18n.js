const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

try {
  let enJson = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  enJson.homepage = enJson.homepage || {};
  enJson.homepage.platformName = "Qickroom";
  enJson.homepage.laundryDescription = "Professional washing, dry cleaning, and pressing services directly to your room.";
  enJson.homepage.transportationDescription = "Reliable car bookings, airport transfers, and chauffeur services.";
  enJson.homepage.tourismDescription = "Discover local attractions with expert guided tours and curated experiences.";
  fs.writeFileSync(enPath, JSON.stringify(enJson, null, 2), 'utf8');
  console.log('EN translations updated successfully.');
} catch (e) {
  console.error('Error updating EN translations:', e);
}

try {
  let arJson = JSON.parse(fs.readFileSync(arPath, 'utf8'));
  arJson.homepage = arJson.homepage || {};
  arJson.homepage.platformName = "كيك روم";
  arJson.homepage.laundryDescription = "خدمات غسيل وتنظيف جاف وكي احترافية تصل مباشرة إلى غرفتك.";
  arJson.homepage.transportationDescription = "حجوزات سيارات موثوقة، تنقلات المطار، وخدمات السائق الخاص.";
  arJson.homepage.tourismDescription = "اكتشف المعالم السياحية المحلية مع جولات مخصصة وتجارب مميزة.";
  fs.writeFileSync(arPath, JSON.stringify(arJson, null, 2), 'utf8');
  console.log('AR translations updated successfully.');
} catch (e) {
  console.error('Error updating AR translations:', e);
}
