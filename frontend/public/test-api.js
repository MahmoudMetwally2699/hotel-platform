/**
 * Browser Console API Test
 * Copy and paste this code into your browser console to test API connectivity
 */

console.log('🔧 Testing Hotel Platform API Connectivity...');

// Test 1: Basic fetch to login endpoint
const testBasicConnectivity = async () => {
  console.log('\n📡 Test 1: Basic connectivity test...');

  try {
    const response = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'mahmetwally9999@gmail.com',
        password: 'Mah@1234',
        role: 'service'
      })
    });

    console.log('✅ Connection successful!');
    console.log('Status:', response.status);
    console.log('Headers:', Object.fromEntries(response.headers.entries()));

    const data = await response.json();
    console.log('Response:', data);

    if (data.success) {
      console.log('🎉 Login successful!');
      console.log('User:', data.data.user.email);
      console.log('Role:', data.data.user.role);
      console.log('Token received:', !!data.data.token);

      // Store token for testing
      localStorage.setItem('testToken', data.data.token);
      console.log('Token stored in localStorage as "testToken"');

      return true;
    } else {
      console.log('❌ Login failed:', data.message);
      return false;
    }

  } catch (error) {
    console.error('❌ Connection failed:', error);
    console.error('This indicates a network connectivity issue');
    return false;
  }
};

// Test 2: Test with axios (like the app uses)
const testAxiosConnectivity = async () => {
  console.log('\n📡 Test 2: Axios connectivity test...');

  try {
    // Import axios if available
    if (typeof axios === 'undefined') {
      console.log('⚠️ Axios not available in console, skipping this test');
      return;
    }

    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'mahmetwally9999@gmail.com',
      password: 'Mah@1234',
      role: 'service'
    }, {
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ Axios connection successful!');
    console.log('Response:', response.data);

  } catch (error) {
    console.error('❌ Axios connection failed:', error);
  }
};

// Test 3: Check current app state
const checkAppState = () => {
  console.log('\n🔍 Test 3: Checking current app state...');

  // Check localStorage
  console.log('LocalStorage token:', localStorage.getItem('token'));

  // Check if Redux store is available
  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION__) {
    console.log('Redux DevTools available');
  }

  // Check current URL
  console.log('Current URL:', window.location.href);

  // Check if any network requests are being blocked
  console.log('User Agent:', navigator.userAgent);
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive API connectivity tests...\n');

  checkAppState();
  const basicResult = await testBasicConnectivity();
  await testAxiosConnectivity();

  console.log('\n📊 Test Summary:');
  console.log('Basic connectivity:', basicResult ? '✅ PASS' : '❌ FAIL');

  if (basicResult) {
    console.log('\n✅ API is working! The issue might be in the React app\'s axios configuration.');
    console.log('Try refreshing the page and attempting login again.');
  } else {
    console.log('\n❌ API connectivity failed. Please check:');
    console.log('1. Backend server is running: npm start in backend folder');
    console.log('2. Backend is running on port 5000');
    console.log('3. No firewall blocking localhost:5000');
    console.log('4. Browser not blocking local requests');
  }
};

// Auto-run the tests
runAllTests();
