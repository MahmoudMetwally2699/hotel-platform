/**
 * Quick API Test for Transportation Template
 * Run this in browser console to test the API endpoint
 */

// Test the API with proper base URL
async function testTransportationAPI() {
  try {
    console.log('🚗 Testing Transportation API...');

    // Use environment variable or fallback to localhost
    const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

    // Method 1: Direct fetch with full URL
    console.log('Method 1: Direct fetch with full URL');
    const response1 = await fetch(`${baseURL}/service/category-templates/transportation`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token') || 'your-token-here'}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Response 1 Status:', response1.status);

    if (response1.ok) {
      const data1 = await response1.json();
      console.log('✅ Direct fetch successful:', data1);
    } else {
      console.log('❌ Direct fetch failed:', await response1.text());
    }

    // Method 2: Using updated api service
    console.log('\nMethod 2: Using api service with baseURL');

    // Import the api service
    const { default: api } = await import('/src/services/api.service.js');

    const response2 = await api.get('/service/category-templates/transportation');
    console.log('✅ API service successful:', response2.data);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the test
console.log('Run testTransportationAPI() to test the endpoints');

// Export for manual execution
window.testTransportationAPI = testTransportationAPI;
