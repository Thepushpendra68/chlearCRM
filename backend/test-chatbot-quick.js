require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

console.log('🤖 Quick Chatbot Test\n');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

const systemPrompt = `You are a CRM assistant. Respond ONLY with valid JSON in this format:
{
  "action": "CHAT",
  "response": "your conversational response here"
}`;

async function testChatbot() {
  try {
    console.log('Testing: "Hello, can you help me create a lead?"\n');

    const prompt = `${systemPrompt}

User message: "Hello, can you help me create a lead?"

Respond with JSON only.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    console.log('Raw response:');
    console.log(text);
    console.log('');

    // Try to parse
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleanText);

    console.log('✅ Parsed successfully!');
    console.log('Action:', parsed.action);
    console.log('Response:', parsed.response);
    console.log('');
    console.log('🎉 Chatbot is working correctly!\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testChatbot();