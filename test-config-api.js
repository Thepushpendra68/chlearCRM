/**
 * Test script to verify the /api/config/industry endpoint is working
 * Run with: node test-config-api.js
 */

const axios = require('axios');

const API_URL = 'http://localhost:5000';

// Test with a sample JWT token (you'll need to replace this with a real token)
const testConfig = async () => {
  try {
    console.log('🧪 Testing /api/config/industry endpoint...\n');
    
    // First, let's check if the server is running
    const healthCheck = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is running:', healthCheck.data.status);
    
    // Try to fetch config without auth (will fail, but shows API is working)
    try {
      const response = await axios.get(`${API_URL}/api/config/industry`);
      console.log('✅ Config endpoint response:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      if (error.response?.status === 401) {
        console.log('ℹ️  Expected: 401 Unauthorized (no token provided)');
        console.log('📋 Please authenticate to the frontend and check browser network tab');
        console.log('📋 Look for /api/config/industry request in browser DevTools');
      } else {
        console.error('❌ Unexpected error:', error.message);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('📋 Make sure backend is running: npm run dev');
  }
};

testConfig();
