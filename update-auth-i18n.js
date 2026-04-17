const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enObj.qrAuth = {
  qrRequiredLogin: "QR Code Required for Login",
  scanToLogin: "Scan QR Code to Login",
  scanToEnableLogin: "Scan QR Code to Enable Login",
  validating: "Validating...",
  resetScanner: "Reset Scanner",
  resetScannerHelp: "If QR scanning doesn't work, try resetting the scanner first",
  qrLoginOnlyNotice: "QR scan is required for login only. Registration is always available.",
  selectedViaQR: "Selected via QR code",
  changeHotel: "Change Hotel",
  change: "Change",
  scanQR: "Scan QR Code",
  scanAtReception: "Scan the QR code at hotel reception to proceed with registration"
};

arObj.qrAuth = {
  qrRequiredLogin: "يتطلب مسح رمز QR لتسجيل الدخول",
  scanToLogin: "امسح رمز QR لتسجيل الدخول",
  scanToEnableLogin: "امسح رمز QR لتفعيل تسجيل الدخول",
  validating: "جاري التحقق...",
  resetScanner: "إعادة تهيئة الماسح",
  resetScannerHelp: "إذا لم يعمل الماسح، جرب إعادة تهيئته أولاً",
  qrLoginOnlyNotice: "مسح رمز QR مطلوب لتسجيل الدخول فقط. التسجيل متاح دائماً.",
  selectedViaQR: "تم التحديد عبر رمز QR",
  changeHotel: "تغيير الفندق",
  change: "تغيير",
  scanQR: "امسح رمز QR",
  scanAtReception: "امسح رمز QR في استقبال الفندق للتسجيل"
};

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');

console.log('QR Auth translations added successfully.');
