const chatbotFallback = require('./src/services/chatbotFallback');

console.log('🧪 Testing Chatbot Fallback System\n');
console.log('═══════════════════════════════════════════════\n');

const testCases = [
  'Show me all leads',
  'Show me all active leads',
  'Show qualified leads',
  'Create a lead named John Doe, email john@example.com, from Acme Corp',
  'Update john@example.com status to qualified',
  'Search for mike.chen@startup.co',
  'Find Lisa Davis',
  'Show me lead statistics',
  'Hello',
  'Help me',
  'What can you do?'
];

console.log('Testing pattern matching for various queries:\n');

testCases.forEach((testCase, index) => {
  console.log(`${index + 1}. User: "${testCase}"`);

  try {
    const result = chatbotFallback.parseMessage(testCase);

    console.log(`   Action: ${result.action}`);
    console.log(`   Intent: ${result.intent}`);

    if (Object.keys(result.parameters).length > 0) {
      console.log(`   Parameters: ${JSON.stringify(result.parameters)}`);
    }

    console.log(`   Response: "${result.response.substring(0, 80)}${result.response.length > 80 ? '...' : ''}"`);
    console.log(`   Needs Confirmation: ${result.needsConfirmation}`);
    console.log('');
  } catch (error) {
    console.error(`   ❌ Error: ${error.message}\n`);
  }
});

console.log('═══════════════════════════════════════════════');
console.log('✅ Fallback system test complete!\n');
console.log('The chatbot will automatically use these patterns when:');
console.log('1. Gemini AI returns an error');
console.log('2. GEMINI_API_KEY is not set');
console.log('3. CHATBOT_FALLBACK_ONLY=true in .env\n');