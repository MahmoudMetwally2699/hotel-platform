const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/guest/GuestOnboardingWizard.js');
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
  [/text-primary-dark/g, 'text-primary-main'],
  [/bg-primary-dark/g, 'bg-primary-main'],
  [/text-primary-main/g, 'text-primary-light'],
  [/bg-primary-main/g, 'bg-primary-light'],
  [/focus:ring-primary-main/g, 'focus:ring-primary-light'],
  [/focus:border-primary-main/g, 'focus:border-primary-light'],
  [/accent-primary-main/g, 'accent-primary-light'],
  [/peer-checked:border-primary-main/g, 'peer-checked:border-primary-light'],
  [/group-hover:text-primary-main/g, 'group-hover:text-primary-light'],
  // Since we downshifted everything, the light variations might need adjustments
  // shadow-primary-light stays the same or becomes a lighter variant? It's fine to leave it.
];

let changedCode = code;
for (const [regex, replacement] of replacements) {
  changedCode = changedCode.replace(regex, replacement);
}

fs.writeFileSync(filePath, changedCode, 'utf8');
console.log('Successfully applied #67BAE0 (primary-light) theme colors.');
