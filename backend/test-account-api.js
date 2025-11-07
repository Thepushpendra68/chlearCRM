/**
 * Test script for Account Management API
 * Run this after starting the backend server
 * Usage: node test-account-api.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = process.env.API_URL || 'http://localhost:5000';
const TEST_EMAIL = process.env.TEST_EMAIL || 'test@example.com';
const TEST_PASSWORD = process.env.TEST_PASSWORD || 'testpassword';

let authToken = null;
let testAccountId = null;

// Helper function to make authenticated requests
async function makeRequest(method, endpoint, data = null) {
  const config = {
    method,
    url: `${BASE_URL}${endpoint}`,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }

  if (data) {
    config.data = data;
  }

  try {
    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

// Test functions
async function testLogin() {
  console.log('\n🔐 Testing Login...');
  const result = await makeRequest('POST', '/api/supabase-auth/login', {
    email: TEST_EMAIL,
    password: TEST_PASSWORD,
  });

  if (result.success && result.data.token) {
    authToken = result.data.token;
    console.log('✅ Login successful');
    return true;
  } else {
    console.log('❌ Login failed:', result.error);
    return false;
  }
}

async function testGetAccounts() {
  console.log('\n📋 Testing GET /api/accounts...');
  const result = await makeRequest('GET', '/api/accounts');

  if (result.success) {
    console.log('✅ Get accounts successful');
    console.log(`   Found ${result.data.data?.length || 0} accounts`);
    return true;
  } else {
    console.log('❌ Get accounts failed:', result.error);
    return false;
  }
}

async function testCreateAccount() {
  console.log('\n➕ Testing POST /api/accounts...');
  const accountData = {
    name: 'Test Account ' + Date.now(),
    website: 'https://testaccount.com',
    industry: 'Technology',
    email: 'contact@testaccount.com',
    phone: '+1234567890',
    status: 'active',
  };

  const result = await makeRequest('POST', '/api/accounts', accountData);

  if (result.success && result.data.data) {
    testAccountId = result.data.data.id;
    console.log('✅ Create account successful');
    console.log(`   Account ID: ${testAccountId}`);
    return true;
  } else {
    console.log('❌ Create account failed:', result.error);
    return false;
  }
}

async function testGetAccountById() {
  if (!testAccountId) {
    console.log('⏭️  Skipping - no account ID');
    return false;
  }

  console.log('\n🔍 Testing GET /api/accounts/:id...');
  const result = await makeRequest('GET', `/api/accounts/${testAccountId}`);

  if (result.success) {
    console.log('✅ Get account by ID successful');
    console.log(`   Account Name: ${result.data.data?.name}`);
    return true;
  } else {
    console.log('❌ Get account by ID failed:', result.error);
    return false;
  }
}

async function testUpdateAccount() {
  if (!testAccountId) {
    console.log('⏭️  Skipping - no account ID');
    return false;
  }

  console.log('\n✏️  Testing PUT /api/accounts/:id...');
  const updateData = {
    name: 'Updated Test Account',
    industry: 'Finance',
  };

  const result = await makeRequest('PUT', `/api/accounts/${testAccountId}`, updateData);

  if (result.success) {
    console.log('✅ Update account successful');
    console.log(`   Updated Name: ${result.data.data?.name}`);
    return true;
  } else {
    console.log('❌ Update account failed:', result.error);
    return false;
  }
}

async function testGetAccountLeads() {
  if (!testAccountId) {
    console.log('⏭️  Skipping - no account ID');
    return false;
  }

  console.log('\n📊 Testing GET /api/accounts/:id/leads...');
  const result = await makeRequest('GET', `/api/accounts/${testAccountId}/leads`);

  if (result.success) {
    console.log('✅ Get account leads successful');
    console.log(`   Found ${result.data.data?.length || 0} leads`);
    return true;
  } else {
    console.log('❌ Get account leads failed:', result.error);
    return false;
  }
}

async function testGetAccountStats() {
  if (!testAccountId) {
    console.log('⏭️  Skipping - no account ID');
    return false;
  }

  console.log('\n📈 Testing GET /api/accounts/:id/stats...');
  const result = await makeRequest('GET', `/api/accounts/${testAccountId}/stats`);

  if (result.success) {
    console.log('✅ Get account stats successful');
    console.log(`   Stats:`, result.data.data);
    return true;
  } else {
    console.log('❌ Get account stats failed:', result.error);
    return false;
  }
}

async function testDeleteAccount() {
  if (!testAccountId) {
    console.log('⏭️  Skipping - no account ID');
    return false;
  }

  console.log('\n🗑️  Testing DELETE /api/accounts/:id...');
  const result = await makeRequest('DELETE', `/api/accounts/${testAccountId}`);

  if (result.success) {
    console.log('✅ Delete account successful');
    testAccountId = null;
    return true;
  } else {
    console.log('❌ Delete account failed:', result.error);
    console.log('   (This is expected if account has leads or child accounts)');
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🧪 Starting Account Management API Tests...');
  console.log(`📍 Base URL: ${BASE_URL}`);

  const results = {
    login: false,
    getAccounts: false,
    createAccount: false,
    getAccountById: false,
    updateAccount: false,
    getAccountLeads: false,
    getAccountStats: false,
    deleteAccount: false,
  };

  // Run tests in sequence
  results.login = await testLogin();
  if (!results.login) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }

  results.getAccounts = await testGetAccounts();
  results.createAccount = await testCreateAccount();
  results.getAccountById = await testGetAccountById();
  results.updateAccount = await testUpdateAccount();
  results.getAccountLeads = await testGetAccountLeads();
  results.getAccountStats = await testGetAccountStats();
  results.deleteAccount = await testDeleteAccount();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 Test Results Summary');
  console.log('='.repeat(50));
  const passed = Object.values(results).filter(Boolean).length;
  const total = Object.keys(results).length;
  console.log(`✅ Passed: ${passed}/${total}`);

  Object.entries(results).forEach(([test, passed]) => {
    console.log(`   ${passed ? '✅' : '❌'} ${test}`);
  });

  if (passed === total) {
    console.log('\n🎉 All tests passed!');
    process.exit(0);
  } else {
    console.log('\n⚠️  Some tests failed. Check the output above.');
    process.exit(1);
  }
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});

