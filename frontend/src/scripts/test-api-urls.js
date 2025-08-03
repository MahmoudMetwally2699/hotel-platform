/**
 * API URL Test - Verify the double /api/api/ issue is fixed
 */

// Import the API config
import { SERVICE_API, API_BASE_URL } from '../config/api.config.js';

// Test the corrected API URLs
console.log('🔧 Testing API URL Configuration...');

console.log('API_BASE_URL:', API_BASE_URL);
console.log('');

console.log('✅ SERVICE_API endpoints (should be relative paths):');
Object.entries(SERVICE_API).forEach(([key, url]) => {
  console.log(`${key}: ${url}`);
});

console.log('');
console.log('🎯 When combined with axios baseURL:');
console.log(`Base: ${API_BASE_URL}`);
console.log(`Category Templates: ${API_BASE_URL}${SERVICE_API.CATEGORY_TEMPLATES}/transportation`);
console.log(`Services by Category: ${API_BASE_URL}${SERVICE_API.SERVICES_BY_CATEGORY}/transportation`);

console.log('');
console.log('✅ Should now be:');
console.log('- http://localhost:5000/api/service/category-templates/transportation');
console.log('- http://localhost:5000/api/service/services-by-category/transportation');

console.log('');
console.log('❌ Previously was (WRONG):');
console.log('- http://localhost:5000/api/api/service/category-templates/transportation');
console.log('- http://localhost:5000/api/api/service/services-by-category/transportation');

export { SERVICE_API, API_BASE_URL };
