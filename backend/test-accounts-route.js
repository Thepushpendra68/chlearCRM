/**
 * Quick test script to verify accounts route is accessible
 * Run this after restarting the server: node test-accounts-route.js
 */

const http = require('http');

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/accounts',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

console.log('🧪 Testing /api/accounts route...');
console.log('📍 URL: http://localhost:5000/api/accounts');
console.log('');

const req = http.request(options, (res) => {
  console.log(`✅ Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 404) {
      console.log('❌ Route not found (404)');
      console.log('💡 Make sure:');
      console.log('   1. Backend server is restarted');
      console.log('   2. Route is registered in app.js');
      console.log('   3. Route file exists: backend/src/routes/accountRoutes.js');
    } else if (res.statusCode === 401) {
      console.log('✅ Route exists! (401 Unauthorized - expected without auth token)');
      console.log('💡 This means the route is working, you just need to authenticate');
    } else {
      console.log('✅ Route is accessible!');
      console.log('📄 Response:', data.substring(0, 200));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('💡 Make sure the backend server is running on port 5000');
});

req.end();

