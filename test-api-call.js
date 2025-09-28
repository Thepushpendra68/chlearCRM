const axios = require('axios');

async function testApiCall() {
  try {
    console.log('🌐 Testing API call to backend...');

    // Test a simple API call without authentication first
    console.log('\n🏥 Testing health endpoint...');
    const healthResponse = await axios.get('http://localhost:5000/health');
    console.log('✅ Health check successful:', healthResponse.data);

    // Now test an authenticated endpoint (this should fail with 401)
    console.log('\n🔒 Testing authenticated endpoint without token...');
    try {
      const dashboardResponse = await axios.get('http://localhost:5000/api/dashboard/stats');
      console.log('❌ This should not succeed:', dashboardResponse.data);
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('✅ Expected 401 Unauthorized:', error.response.data);
      } else {
        console.log('❌ Unexpected error:', error.response?.data || error.message);
      }
    }

    // Test with a fake token to see the exact error
    console.log('\n🎭 Testing with fake token...');
    try {
      const fakeTokenResponse = await axios.get('http://localhost:5000/api/dashboard/stats', {
        headers: {
          Authorization: 'Bearer fake-token-123'
        }
      });
      console.log('❌ This should not succeed:', fakeTokenResponse.data);
    } catch (error) {
      console.log('✅ Expected error with fake token:', error.response?.data || error.message);
    }

    console.log('\n💡 The backend is accessible and authentication middleware is working.');
    console.log('💡 The issue is likely that the frontend token is not being sent correctly');
    console.log('💡 or the token verification is failing for a specific reason.');

  } catch (error) {
    console.error('💥 API test error:', error.message);
  }
}

testApiCall();