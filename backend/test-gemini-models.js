require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Testing Gemini API with Google AI Studio Key\n');
console.log('═══════════════════════════════════════════════\n');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('✅ API Key found:', process.env.GEMINI_API_KEY.substring(0, 20) + '...\n');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// All possible Gemini model names (as of 2025)
const modelsToTry = [
  // Gemini 2.0 models (newest)
  'gemini-2.0-flash-exp',

  // Gemini 1.5 models (stable)
  'gemini-1.5-pro',
  'gemini-1.5-pro-latest',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-8b-latest',

  // Legacy models
  'gemini-pro',
  'gemini-pro-latest'
];

let successfulModel = null;

async function testModel(modelName) {
  try {
    console.log(`🤖 Testing: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent('Say "Hello from Gemini!" in 5 words or less.');
    const response = await result.response;
    const text = response.text();

    console.log(`   ✅ SUCCESS!`);
    console.log(`   📝 Response: "${text.trim()}"`);
    console.log('');

    return modelName;

  } catch (error) {
    const errorMsg = error.message.split('\n')[0];

    if (errorMsg.includes('API_KEY_INVALID')) {
      console.log(`   ❌ API KEY IS INVALID`);
      console.log(`   💡 Get a new key from: https://aistudio.google.com/apikey\n`);
    } else if (errorMsg.includes('404')) {
      console.log(`   ⚠️  Model not found/not available\n`);
    } else if (errorMsg.includes('403') || errorMsg.includes('PERMISSION_DENIED')) {
      console.log(`   ❌ Permission denied - API might not be enabled\n`);
    } else {
      console.log(`   ❌ Error: ${errorMsg.substring(0, 80)}...\n`);
    }

    return null;
  }
}

async function testAll() {
  console.log('Testing all available Gemini models...\n');
  console.log('═══════════════════════════════════════════════\n');

  for (const modelName of modelsToTry) {
    const workingModel = await testModel(modelName);

    if (workingModel && !successfulModel) {
      successfulModel = workingModel;
      // Continue testing to show all available models
    }

    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log('═══════════════════════════════════════════════\n');

  if (successfulModel) {
    console.log('🎉 FOUND WORKING MODEL!\n');
    console.log('═══════════════════════════════════════════════');
    console.log(`✅ Model Name: ${successfulModel}`);
    console.log('═══════════════════════════════════════════════\n');
    console.log('📝 Update your chatbotService.js:');
    console.log('   Line 21 should be:');
    console.log(`   this.model = this.genAI.getGenerativeModel({ model: '${successfulModel}' });\n`);
    console.log('✅ Your Google AI Studio key is working perfectly!\n');
  } else {
    console.log('❌ NO WORKING MODELS FOUND\n');
    console.log('Possible issues:');
    console.log('1. ❌ API key is invalid or expired');
    console.log('2. ❌ API key doesn\'t have access to Gemini models');
    console.log('3. ❌ Rate limit exceeded (wait a few minutes)\n');
    console.log('💡 Solutions:');
    console.log('   • Get a new API key: https://aistudio.google.com/apikey');
    console.log('   • Make sure you\'re using a Google AI Studio key (not Google Cloud)');
    console.log('   • Wait 1-2 minutes if you hit rate limits\n');
  }
}

testAll().catch(console.error);