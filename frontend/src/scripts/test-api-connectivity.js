// Quick API connectivity test
// Run this in the browser console to test API connectivity

const testAPI = async () => {
  console.log('Testing API connectivity...');

  // Use environment variable or fallback to localhost
  const baseURL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  console.log('Base URL:', baseURL);

  try {
    // Test basic connectivity
    const response = await fetch(`${baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        email: 'mahmetwally9999@gmail.com',
        password: 'Mah@1234',
        role: 'service'
      })
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);

    const data = await response.json();
    console.log('Response data:', data);

    if (data.success) {
      console.log('✅ API connectivity is working!');
      console.log('Token received:', data.data.token);
    } else {
      console.log('❌ API returned error:', data.message);
    }

  } catch (error) {
    console.error('❌ API connectivity failed:', error);
    console.error('This suggests a network issue or CORS problem');
  }
};

// Run the test
testAPI();
