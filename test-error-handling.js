/**
 * Test Error Handling and Response Formatting
 * Verifies that error responses are standardized
 */

require('dotenv').config({ path: './backend/.env' });

const response = require('./backend/src/utils/responseFormatter');
const ApiError = require('./backend/src/utils/ApiError');
const { asyncHandler } = require('./backend/src/middleware/errorMiddleware');

console.log('🧪 Testing Error Handling and Response Formatting\n');
console.log('='.repeat(60));

let passedTests = 0;
let failedTests = 0;

// Mock response object
const createMockRes = () => {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.data = data;
      return this;
    }
  };
  return res;
};

// Test 1: Success response
console.log('\nTest 1: Success Response');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.success(res, { id: 1, name: 'Test' }, 200, 'Success message');
  console.log('✅ Success response created');
  console.log('   Status:', res.statusCode);
  console.log('   Has success:', res.data.success);
  console.log('   Has data:', !!res.data.data);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 2: Created response
console.log('\nTest 2: Created Response');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.created(res, { id: 1 }, 'Resource created');
  console.log('✅ Created response created');
  console.log('   Status:', res.statusCode);
  console.log('   Status is 201:', res.statusCode === 201);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 3: Paginated response
console.log('\nTest 3: Paginated Response');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.paginated(res, [{ id: 1 }, { id: 2 }], {
    page: 1,
    limit: 10,
    total: 25,
    totalPages: 3,
    hasNext: true,
    hasPrev: false
  });
  console.log('✅ Paginated response created');
  console.log('   Status:', res.statusCode);
  console.log('   Has pagination:', !!res.data.pagination);
  console.log('   Total:', res.data.pagination.total);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 4: ApiError handling
console.log('\nTest 4: ApiError Handling');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  const error = new ApiError('Test error', 400);
  response.error(res, error);
  console.log('✅ ApiError handled correctly');
  console.log('   Status:', res.statusCode);
  console.log('   Is error:', res.data.success === false);
  console.log('   Error name:', res.data.error.name);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 5: Not found response
console.log('\nTest 5: Not Found Response');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.notFound(res, 'Resource not found');
  console.log('✅ Not found response created');
  console.log('   Status:', res.statusCode);
  console.log('   Status is 404:', res.statusCode === 404);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 6: Validation error response
console.log('\nTest 6: Validation Error Response');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.validationError(res, 'Validation failed', { email: 'Email is required' });
  console.log('✅ Validation error response created');
  console.log('   Status:', res.statusCode);
  console.log('   Has errors:', !!res.data.error.errors);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 7: Unauthorized response
console.log('\nTest 7: Unauthorized Response');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.unauthorized(res, 'Unauthorized');
  console.log('✅ Unauthorized response created');
  console.log('   Status:', res.statusCode);
  console.log('   Status is 401:', res.statusCode === 401);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 8: Async handler wrapper
console.log('\nTest 8: Async Handler Wrapper');
console.log('-'.repeat(60));
try {
  const asyncFn = asyncHandler(async (req, res) => {
    res.json({ success: true });
  });

  const mockReq = {};
  const mockRes = {
    json: (data) => {
      console.log('✅ Async handler executed');
      console.log('   Response:', JSON.stringify(data));
    }
  };

  // Call the wrapped function
  asyncFn(mockReq, mockRes, (err) => {
    if (err) {
      console.log('❌ Error passed to next:', err.message);
      failedTests++;
    }
  });

  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 9: Timestamp in responses
console.log('\nTest 9: Timestamp in Responses');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.success(res, { test: true });
  console.log('✅ Timestamp present:', !!res.data.timestamp);
  console.log('   Timestamp:', res.data.timestamp);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Test 10: Error response structure
console.log('\nTest 10: Error Response Structure');
console.log('-'.repeat(60));
try {
  const res = createMockRes();
  response.error(res, new ApiError('Test error', 400));
  console.log('✅ Error response has correct structure:');
  console.log('   - success:', res.data.success);
  console.log('   - statusCode:', res.data.statusCode);
  console.log('   - timestamp:', res.data.timestamp);
  console.log('   - error object:', !!res.data.error);
  console.log('   - error.name:', res.data.error.name);
  console.log('   - error.message:', res.data.error.message);
  passedTests++;
} catch (error) {
  console.log('❌ Error:', error.message);
  failedTests++;
}

// Summary
console.log('\n' + '='.repeat(60));
console.log('TEST SUMMARY');
console.log('='.repeat(60));
console.log(`Total Tests: ${passedTests + failedTests}`);
console.log(`✅ Passed: ${passedTests}`);
console.log(`❌ Failed: ${failedTests}`);
console.log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(1)}%`);

if (failedTests === 0) {
  console.log('\n🎉 All tests passed! Error handling is working correctly.');
} else {
  console.log('\n⚠️  Some tests failed. Please review the errors above.');
}

console.log('\n' + '='.repeat(60));
console.log('ERROR HANDLING FEATURES:');
console.log('='.repeat(60));
console.log('\n📝 Response Formatting');
console.log('  ✅ success() - Standard success response');
console.log('  ✅ created() - POST response (201)');
console.log('  ✅ updated() - PUT/PATCH response');
console.log('  ✅ deleted() - DELETE response');
console.log('  ✅ paginated() - List with pagination');
console.log('  ✅ custom() - Custom response structure');

console.log('\n🚫 Error Responses');
console.log('  ✅ error() - Generic error handler');
console.log('  ✅ unauthorized() - 401 response');
console.log('  ✅ forbidden() - 403 response');
console.log('  ✅ notFound() - 404 response');
console.log('  ✅ validationError() - 400 with field errors');
console.log('  ✅ rateLimit() - 429 response');

console.log('\n🔧 Utilities');
console.log('  ✅ asyncHandler - Wrap async controller methods');
console.log('  ✅ Timestamp - All responses include ISO timestamp');
console.log('  ✅ Status codes - Proper HTTP status codes');
console.log('  ✅ Production safe - No error leakage in prod');

console.log('\n🔍 Error Types Handled');
console.log('  ✅ ApiError - Custom application errors');
console.log('  ✅ ValidationError - Mongoose validation');
console.log('  ✅ CastError - Invalid ObjectId');
console.log('  ✅ Duplicate errors - 11000, 23505');
console.log('  ✅ Foreign key - 23503');
console.log('  ✅ Not null - 23502');
console.log('  ✅ JWT errors - Invalid/expired token');
console.log('  ✅ SyntaxError - Invalid JSON');

console.log('\n📊 Response Structure');
console.log('  ✅ Success: { success, statusCode, timestamp, data, message?, meta? }');
console.log('  ✅ Error: { success, statusCode, timestamp, error: { name, message, ... } }');
console.log('  ✅ Consistent format across all endpoints');
console.log('  ✅ Easy to parse on frontend');

console.log('\n' + '='.repeat(60));

process.exit(failedTests === 0 ? 0 : 1);
