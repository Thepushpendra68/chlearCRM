require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Testing Gemini API with different configurations...\n');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Different model identifiers to try
const modelsToTry = [
  'models/gemini-pro',
  'models/gemini-1.5-pro',
  'models/gemini-1.5-flash',
  'gemini-pro',
  'gemini-1.5-pro',
  'gemini-1.5-flash',
  'text-bison-001',
  'chat-bison-001'
];

async function testModel(modelName) {
  try {
    console.log(`🤖 Testing: ${modelName}...`);
    const model = genAI.getGenerativeModel({ model: modelName });

    const result = await model.generateContent('Say "Hello"');
    const response = await result.response;
    const text = response.text();

    console.log(`✅ SUCCESS! Model ${modelName} works!`);
    console.log(`📝 Response: ${text}\n`);
    return modelName;

  } catch (error) {
    console.log(`❌ Failed: ${error.message.split('\n')[0]}\n`);
    return null;
  }
}

async function testAll() {
  console.log('Testing all possible model names...\n');

  for (const modelName of modelsToTry) {
    const workingModel = await testModel(modelName);
    if (workingModel) {
      console.log(`\n🎉 Found working model: "${workingModel}"`);
      console.log(`\n💡 Update chatbotService.js to use:`);
      console.log(`   this.model = this.genAI.getGenerativeModel({ model: '${workingModel}' });`);
      return;
    }
  }

  console.log('\n❌ No working models found. Possible issues:');
  console.log('1. API key might be invalid');
  console.log('2. Generative Language API not enabled in Google Cloud Console');
  console.log('3. API key might not have proper permissions\n');
  console.log('📖 Enable the API here: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
}

testAll();