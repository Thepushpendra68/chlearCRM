/**
 * Test script for Activity Module Actions
 * Tests the 5 new activity actions we just implemented
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';
const API_KEY = process.env.TEST_API_KEY || 'your-api-key';

// Test messages for activity actions
const testMessages = [
  {
    action: 'GET_ACTIVITIES',
    message: 'Show my activities',
    expected: 'GET_ACTIVITIES'
  },
  {
    action: 'GET_ACTIVITIES',
    message: 'Show my activities from last week',
    expected: 'GET_ACTIVITIES'
  },
  {
    action: 'CREATE_ACTIVITY',
    message: 'Create activity: Log call with John Doe about pricing',
    expected: 'CREATE_ACTIVITY'
  },
  {
    action: 'GET_ACTIVITY_STATS',
    message: 'Show activity statistics this month',
    expected: 'GET_ACTIVITY_STATS'
  },
  {
    action: 'GET_TEAM_TIMELINE',
    message: 'Show team timeline',
    expected: 'GET_TEAM_TIMELINE'
  },
  {
    action: 'COMPLETE_ACTIVITY',
    message: 'Complete activity #5',
    expected: 'COMPLETE_ACTIVITY'
  }
];

async function testChatbot(message) {
  try {
    console.log(`\n📝 Testing: "${message}"`);
    console.log('─'.repeat(60));

    const response = await axios.post(
      `${BASE_URL}/api/chatbot/message`,
      {
        message: message,
        user_id: 'test-user-id'
      },
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Response:');
    console.log(JSON.stringify(response.data, null, 2));

    return response.data;
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Activity Actions Test Suite');
  console.log('═'.repeat(60));

  let passed = 0;
  let failed = 0;

  for (const test of testMessages) {
    try {
      const result = await testChatbot(test.message);

      if (result && result.action === test.expected) {
        console.log(`✅ PASS: Correctly identified as ${test.expected}`);
        passed++;
      } else if (result) {
        console.log(`❌ FAIL: Expected ${test.expected}, got ${result.action}`);
        failed++;
      } else {
        console.log(`❌ FAIL: No response`);
        failed++;
      }
    } catch (error) {
      console.error(`❌ FAIL: ${error.message}`);
      failed++;
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 Test Results:');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('═'.repeat(60));
}

// Run tests
runTests().catch(console.error);
