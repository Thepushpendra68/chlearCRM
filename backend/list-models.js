require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🔍 Listing available Gemini models...');

if (!process.env.GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function listModels() {
  try {
    console.log('Fetching models...');

    // Try to list models
    const models = await genAI.listModels();

    console.log('\n✅ Available models:');
    models.forEach((model) => {
      console.log(`  - ${model.name}`);
      console.log(`    Display Name: ${model.displayName}`);
      console.log(`    Supported Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error listing models:', error.message);
    console.error('\n💡 This might mean:');
    console.error('1. The API key is invalid or revoked');
    console.error('2. The Generative Language API is not enabled');
    console.error('3. You need to enable the API at: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
  }
}

listModels();