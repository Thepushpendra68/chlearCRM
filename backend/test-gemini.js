require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Testing Gemini API connection...');
console.log('API Key:', process.env.GEMINI_API_KEY ? '✅ Found' : '❌ Missing');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Try different model names
const modelNames = ['gemini-pro', 'gemini-1.5-pro', 'gemini-1.5-flash'];

async function testGemini() {
  for (const modelName of modelNames) {
    try {
      console.log(`🤖 Testing model: ${modelName}...`);
      const model = genAI.getGenerativeModel({ model: modelName });

      const result = await model.generateContent('Hello, please respond with "Hello from Gemini!"');
      const response = await result.response;
      const text = response.text();

      console.log(`✅ Model ${modelName} is working!`);
      console.log('📝 Response:', text);
      console.log(`\n💡 Use this model name in your chatbotService.js: "${modelName}"\n`);
      return;

    } catch (error) {
      console.error(`❌ Model ${modelName} failed:`, error.message);
    }
  }

  // If all models failed
  {
    const error = new Error('All models failed');
    console.error('❌ Gemini API test failed:', error.message);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      status: error.status,
      statusText: error.statusText
    });

    if (error.message.includes('API_KEY_INVALID')) {
      console.error('\n💡 The API key appears to be invalid. Please check:');
      console.error('1. The API key is correct');
      console.error('2. The API key has not been revoked');
      console.error('3. The Generative Language API is enabled in your Google Cloud project');
    }
  }
}

testGemini();