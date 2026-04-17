const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

enObj.qrScanner = {
  title: "Scan QR Code",
  instructions: "Scan the QR code displayed at the hotel reception desk to automatically select your hotel for registration.",
  tryEnableCamera: "Try to enable camera again",
  cameraNeeded: "Camera access is needed to scan QR codes",
  enableCameraBtn: "Enable Camera",
  allowPrompt: "Make sure to allow camera access when prompted",
  cameraRequired: "Camera access is required to scan QR codes",
  enableStepsTitle: "To enable camera access:",
  step1: "Click the camera icon in your browser's address bar",
  step2: "Select \"Always allow\" for camera access",
  step3: "Refresh the page and try again",
  tryAgain: "Try Again",
  cameraActive: "Camera active - Point at QR code",
  highlightInfo: "QR code will be highlighted when detected",
  startCamera: "Start Camera",
  orUploadImage: "Or upload an image with QR code:",
  clickToUpload: "Click to upload QR code image"
};

arObj.qrScanner = {
  title: "امسح رمز QR",
  instructions: "امسح رمز QR الموجود في استقبال الفندق لاختيار فندقك تلقائياً وبدء التسجيل.",
  tryEnableCamera: "حاول تفعيل الكاميرا مرة أخرى",
  cameraNeeded: "يلزم الوصول إلى الكاميرا لمسح رموز QR",
  enableCameraBtn: "تفعيل الكاميرا",
  allowPrompt: "تأكد من السماح بالوصول إلى الكاميرا عند الطلب",
  cameraRequired: "مطلوب السماح بالوصول للكاميرا لمسح رموز QR",
  enableStepsTitle: "لتفعيل الوصول إلى الكاميرا:",
  step1: "اضغط على أيقونة الكاميرا في شريط عنوان المتصفح",
  step2: "اختر \"السماح دائماً\" للوصول إلى الكاميرا",
  step3: "قم بتحديث الصفحة وحاول مرة أخرى",
  tryAgain: "حاول مرة أخرى",
  cameraActive: "الكاميرا نشطة - وجهها نحو رمز QR",
  highlightInfo: "سيتم تمييز رمز QR عند اكتشافه",
  startCamera: "تشغيل الكاميرا",
  orUploadImage: "أو رفع صورة تحتوي على رمز QR:",
  clickToUpload: "اضغط لرفع صورة رمز QR"
};

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');

console.log('QR Scanner translations added.');
