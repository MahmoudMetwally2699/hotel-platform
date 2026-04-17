const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'frontend/src/components/guest/GuestCategorySelection.js');
let fileContent = fs.readFileSync(targetPath, 'utf8');

// Replace the wrong hex with the exact brand hex
fileContent = fileContent.replace(/#61B6DE/g, '#67BAE0');

fs.writeFileSync(targetPath, fileContent, 'utf8');
console.log('Successfully updated primary brand color to #67BAE0');
