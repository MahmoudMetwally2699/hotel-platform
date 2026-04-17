const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enObj.homepage = {
  "login": "Login",
  "mainTitle": "Your Hotel Room Services Platform",
  "subtitle": "Advanced digital solutions for guest services",
  "accessService": "Access Service",
  "footer": "© 2024 Qickroom. All rights reserved",
  "brand": "Qickroom",
  "welcomeBadge": "WELCOME TO QICKROOM"
};

arObj.homepage = {
  "login": "دخول",
  "mainTitle": "منصة خدمات الغرف لفندقك",
  "subtitle": "حلول رقمية متطورة لخدمات الضيوف",
  "accessService": "دخول إلى الخدمة",
  "footer": "© 2024 كيك روم. جميع الحقوق محفوظة",
  "brand": "كيك روم",
  "welcomeBadge": "مرحباً بك في كيك روم"
};

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');

console.log('Homepage translations added successfully.');
