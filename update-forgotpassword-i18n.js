const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, 'frontend/src/i18n/locales/en/translation.json');
const arPath = path.join(__dirname, 'frontend/src/i18n/locales/ar/translation.json');

const enObj = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const arObj = JSON.parse(fs.readFileSync(arPath, 'utf8'));

if (!enObj.login) enObj.login = {};
if (!arObj.login) arObj.login = {};

enObj.login.forgotPassword = "Forgot your password?";
arObj.login.forgotPassword = "هل نسيت كلمة المرور؟";

fs.writeFileSync(enPath, JSON.stringify(enObj, null, 2), 'utf8');
fs.writeFileSync(arPath, JSON.stringify(arObj, null, 2), 'utf8');

console.log('Forgot password translation added successfully.');
