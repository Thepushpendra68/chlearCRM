// Simple test for API key validation logic
console.log('=== Testing API Key Validation Logic ===\n');

// Simulate the validateApiKey function logic
function validateApiKey(apiKey) {
  // Check if API key is present
  if (!apiKey) {
    return {
      isValid: false,
      error: "API key is not set in environment variables",
    };
  }

  // Check minimum length
  if (apiKey.length < 20) {
    return {
      isValid: false,
      error: `API key too short (${apiKey.length} chars), expected at least 20 characters`,
    };
  }

  // Check for valid characters
  const validKeyPattern = /^[A-Za-z0-9_\-]+$/;
  if (!validKeyPattern.test(apiKey)) {
    return {
      isValid: false,
      error: "API key contains invalid characters",
    };
  }

  // Check for common invalid patterns
  if (apiKey.includes("your-api-key-here") || apiKey.includes("placeholder")) {
    return {
      isValid: false,
      error: "API key appears to be a placeholder value",
    };
  }

  // Check for repeated characters
  const repeatedCharPattern = /(.)\1{10,}/;
  if (repeatedCharPattern.test(apiKey)) {
    return {
      isValid: false,
      error: "API key has repeated character patterns",
    };
  }

  return {
    isValid: true,
    error: null,
  };
}

// Test cases
const tests = [
  { name: 'Empty API key', key: '' },
  { name: 'Too short (5 chars)', key: 'short' },
  { name: 'Too short (15 chars)', key: '123456789012345' },
  { name: 'Placeholder value', key: 'your-api-key-here' },
  { name: 'Placeholder text', key: 'placeholder-key' },
  { name: 'Invalid characters', key: 'AIzaSy@#$%^&*()' },
  { name: 'Repeated characters', key: 'aaaaaaaaaaaa1111111111' },
  { name: 'Valid mock key', key: 'AIzaSyC1234567890abcdefghijklmnopqrstuvwx' },
  { name: 'Valid key with dashes', key: 'valid-key-with-dashes-and-underscores_123' },
];

tests.forEach(test => {
  console.log(`Test: ${test.name}`);
  const result = validateApiKey(test.key);
  console.log(`  Input: "${test.key}"`);
  console.log(`  Valid: ${result.isValid}`);
  if (!result.isValid) {
    console.log(`  Error: ${result.error}`);
  }
  console.log('');
});

console.log('=== All Tests Complete ===');
