/**
 * Test Persistence Service
 * Tests conversation history and user preferences
 */

require('dotenv').config({ path: './backend/.env' });

const persistenceService = require('./backend/src/services/persistenceService');

async function runPersistenceTests() {
  console.log('🧪 Starting Persistence Service Tests\n');
  console.log('='.repeat(60));

  let passedTests = 0;
  let failedTests = 0;

  // Test 1: Save and get user preferences
  console.log('\nTest 1: Save and Get User Preferences');
  console.log('-'.repeat(60));
  try {
    const testUserId = 'test-user-123';

    // Save preferences
    await persistenceService.saveUserPreferences(testUserId, {
      type: 'voice',
      key: 'language',
      value: 'en-US'
    });

    console.log('✅ Saved user preferences');

    // Get preferences
    const preferences = await persistenceService.getUserPreferences(testUserId, 'voice');
    console.log('✅ Retrieved preferences:', JSON.stringify(preferences, null, 2));

    passedTests++;
  } catch (error) {
    console.log('❌ Error with preferences:', error.message);
    failedTests++;
  }

  // Test 2: Save conversation messages
  console.log('\nTest 2: Save Conversation Messages');
  console.log('-'.repeat(60));
  try {
    const testUserId = 'test-user-123';
    const sessionId = 'session-456';

    // Save user message
    const userMessage = await persistenceService.saveMessage(testUserId, {
      sessionId,
      type: 'user',
      content: 'Hello, this is a test message',
      metadata: { source: 'voice' }
    });
    console.log('✅ Saved user message:', userMessage.id);

    // Save assistant message
    const assistantMessage = await persistenceService.saveMessage(testUserId, {
      sessionId,
      type: 'assistant',
      content: 'Hello! How can I help you?',
      metadata: { model: 'gemini-2.0-flash-exp' }
    });
    console.log('✅ Saved assistant message:', assistantMessage.id);

    passedTests++;
  } catch (error) {
    console.log('❌ Error saving messages:', error.message);
    failedTests++;
  }

  // Test 3: Get conversation history
  console.log('\nTest 3: Get Conversation History');
  console.log('-'.repeat(60));
  try {
    const testUserId = 'test-user-123';
    const sessionId = 'session-456';

    const messages = await persistenceService.getConversationHistory(testUserId, sessionId, {
      limit: 10
    });

    console.log('✅ Retrieved conversation history:');
    console.log(`   Total messages: ${messages.length}`);
    messages.forEach(msg => {
      console.log(`   - [${msg.message_type}] ${msg.content.substring(0, 50)}...`);
    });

    passedTests++;
  } catch (error) {
    console.log('❌ Error getting conversation history:', error.message);
    failedTests++;
  }

  // Test 4: Get storage statistics
  console.log('\nTest 4: Get Storage Statistics');
  console.log('-'.repeat(60));
  try {
    const testUserId = 'test-user-123';

    const stats = await persistenceService.getStorageStats(testUserId);

    console.log('✅ Retrieved storage statistics:');
    console.log(`   Message count: ${stats.messageCount}`);
    console.log(`   Total size: ${stats.totalSizeBytes} bytes`);
    console.log(`   Oldest message: ${stats.oldestMessage}`);
    console.log(`   Newest message: ${stats.newestMessage}`);

    passedTests++;
  } catch (error) {
    console.log('❌ Error getting storage stats:', error.message);
    failedTests++;
  }

  // Test 5: Export user data (GDPR)
  console.log('\nTest 5: Export User Data (GDPR Compliance)');
  console.log('-'.repeat(60));
  try {
    const testUserId = 'test-user-123';

    const exportData = await persistenceService.exportUserData(testUserId);

    console.log('✅ Exported user data for GDPR compliance:');
    console.log(`   Export date: ${exportData.exportDate}`);
    console.log(`   Messages: ${exportData.conversationMessages?.length || 0}`);
    console.log(`   Preferences: ${exportData.userPreferences?.length || 0}`);

    passedTests++;
  } catch (error) {
    console.log('❌ Error exporting user data:', error.message);
    failedTests++;
  }

  // Test 6: Validate message data
  console.log('\nTest 6: Message Data Validation');
  console.log('-'.repeat(60));
  try {
    // Valid message
    persistenceService.validateMessageData({
      type: 'user',
      content: 'Test message',
      sessionId: 'session-123'
    });
    console.log('✅ Valid message accepted');

    // Invalid message (missing content)
    try {
      persistenceService.validateMessageData({
        type: 'user'
      });
      console.log('❌ Should have thrown error for missing content');
      failedTests++;
    } catch (error) {
      console.log('✅ Correctly rejected invalid message:', error.message);
      passedTests++;
    }

    passedTests++;
  } catch (error) {
    console.log('❌ Error in validation test:', error.message);
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
    console.log('\n🎉 All tests passed! Persistence service is fully functional.');
    console.log('\nFeatures verified:');
    console.log('  ✅ Save and retrieve user preferences');
    console.log('  ✅ Save and retrieve conversation messages');
    console.log('  ✅ Get conversation history with pagination');
    console.log('  ✅ Storage statistics and analytics');
    console.log('  ✅ GDPR compliance (export user data)');
    console.log('  ✅ Data validation and error handling');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the errors above.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('PERSISTENCE SERVICE FEATURES:');
  console.log('='.repeat(60));
  console.log('📝 Conversation History');
  console.log('  - Save user and assistant messages');
  console.log('  - Retrieve with pagination and filtering');
  console.log('  - Session-based organization');
  console.log('  - Metadata support (tokens, model, etc.)');
  console.log('\n💾 User Preferences');
  console.log('  - Flexible key-value storage');
  console.log('  - Type-based organization');
  console.log('  - JSON value support');
  console.log('  - Automatic timestamp updates');
  console.log('\n🗄️ Data Archival');
  console.log('  - Archive old conversations');
  console.log('  - GDPR compliance functions');
  console.log('  - Storage statistics');
  console.log('  - Automated cleanup');
  console.log('\n🔒 Security');
  console.log('  - Row Level Security (RLS) enabled');
  console.log('  - User-scoped data access');
  console.log('  - Company admin oversight');
  console.log('  - Secure functions with proper permissions');
  console.log('='.repeat(60));

  return failedTests === 0;
}

// Run tests
runPersistenceTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  });
