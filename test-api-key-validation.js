// Test script for API key validation
const fs = require('fs');
const path = require('path');

// Read the chatbot service file to extract the class
const servicePath = path.join(__dirname, 'backend/src/services/chatbotService.js');
let serviceCode = fs.readFileSync(servicePath, 'utf8');

// Extract just the class definition and methods we need
const { validateApiKey, logEnvironmentStatus, checkKeyRotationWarnings, getApiKeyStatus } =
  eval(`(${serviceCode.match(/class ChatbotService[\s\S]*?(?=\nconst chatbotService)/m)[0]})`);

console.log('=== Testing API Key Validation ===\n');

// Test 1: No API key
console.log('Test 1: No API key');
process.env.GEMINI_API_KEY = '';
const result1 = validateApiKey('');
console.log('Result:', result1);
console.log('');

// Test 2: Invalid API key (too short)
console.log('Test 2: Invalid API key (too short)');
const result2 = validateApiKey('short');
console.log('Result:', result2);
console.log('');

// Test 3: Placeholder API key
console.log('Test 3: Placeholder API key');
const result3 = validateApiKey('your-api-key-here');
console.log('Result:', result3);
console.log('');

// Test 4: Valid-looking API key (mock)
console.log('Test 4: Valid-looking API key (mock)');
process.env.GEMINI_API_KEY = 'AIzaSyC1234567890abcdefghijklmnopqrstuvwx';
const result4 = validateApiKey('AIzaSyC1234567890abcdefghijklmnopqrstuvwx');
console.log('Result:', result4);
console.log('');

// Test 5: Invalid characters
console.log('Test 5: Invalid characters in API key');
const result5 = validateApiKey('AIzaSy@#$%^&*()');
console.log('Result:', result5);
console.log('');

// Test 6: Repeated characters
console.log('Test 6: Repeated characters pattern');
const result6 = validateApiKey('aaaaaaaaaaaa1111111111');
console.log('Result:', result6);
console.log('');

console.log('=== Testing Environment Status Logging ===');
console.log('Note: Environment status is logged automatically during service initialization');
console.log('');

console.log('=== Testing Complete ===');
