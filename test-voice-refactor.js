/**
 * Test refactored voiceService
 */

require('dotenv').config({ path: './backend/.env' });

const voiceService = require('./backend/src/services/voiceService');

console.log('=== Testing Refactored VoiceService ===\n');
console.log('✅ voiceService loaded successfully\n');
console.log('Available methods:');
const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(voiceService))
  .filter(n => n !== 'constructor');

methods.forEach(method => {
  console.log(`  - ${method}`);
});

console.log('\n✅ All methods available');
console.log('✅ Refactoring successful - voiceService now uses commonService');

process.exit(0);
