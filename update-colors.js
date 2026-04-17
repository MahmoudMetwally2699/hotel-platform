const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'frontend/src/pages/guest/GuestOnboardingWizard.js');
let code = fs.readFileSync(filePath, 'utf8');

const replacements = [
  [/text-indigo-600/g, 'text-primary-main'],
  [/text-indigo-700/g, 'text-primary-dark'],
  [/text-indigo-800/g, 'text-primary-dark'],
  [/bg-indigo-100/g, 'bg-primary-light/20'],
  [/bg-indigo-200/g, 'bg-primary-light/40'],
  [/bg-indigo-600/g, 'bg-primary-main'],
  [/bg-indigo-700/g, 'bg-primary-dark'],
  [/focus:ring-indigo-500/g, 'focus:ring-primary-main'],
  [/focus:border-indigo-500/g, 'focus:border-primary-main'],
  [/shadow-indigo-300/g, 'shadow-primary-light'],
  [/shadow-indigo-200/g, 'shadow-primary-light/50'],
  [/from-indigo-50/g, 'from-slate-50'],
  [/to-purple-50/g, 'to-blue-50'],
  [/bg-purple-50/g, 'bg-blue-50'],
  [/bg-indigo-50/g, 'bg-blue-50'],
  [/from-indigo-200\/40/g, 'from-primary-light/20'],
  [/to-purple-200\/40/g, 'to-modern-lightBlue/20'],
  [/to-indigo-200\/40/g, 'to-primary-light/20'],
  [/peer-checked:border-indigo-500/g, 'peer-checked:border-primary-main'],
  [/accent-indigo-600/g, 'accent-primary-main'],
  [/group-hover:text-indigo-600/g, 'group-hover:text-primary-main']
];

let changedCode = code;
for (const [regex, replacement] of replacements) {
  changedCode = changedCode.replace(regex, replacement);
}

fs.writeFileSync(filePath, changedCode, 'utf8');
console.log('Successfully applied custom theme colors.');
