/**
 * WhatsApp Integration Test Script
 * Tests sending a WhatsApp message via Meta Business API
 */

require('dotenv').config();
const whatsappSendService = require('../src/services/whatsappSendService');
const { createClient } = require('@supabase/supabase-js');

async function testWhatsAppSend() {
  console.log('🚀 Testing WhatsApp Integration...\n');

  // Initialize Supabase
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get the first active company
    const { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('id, name')
      .eq('is_active', true)
      .limit(1);

    if (companyError || !companies || companies.length === 0) {
      throw new Error('No active companies found');
    }

    const company = companies[0];
    console.log(`📋 Using company: ${company.name} (${company.id})\n`);

    // Test phone number (India format)
    const testPhoneNumber = process.env.TEST_WHATSAPP_NUMBER || '919876543210';
    console.log(`📱 Test phone number: ${testPhoneNumber}`);
    console.log(`ℹ️  Set TEST_WHATSAPP_NUMBER in .env to use your own number\n`);

    // Test 1: Send a simple text message
    console.log('📤 Test 1: Sending text message...');
    const result = await whatsappSendService.sendTextMessage({
      to: testPhoneNumber,
      message: '🎉 Hello from Chlear CRM!\n\nThis is a test message from your WhatsApp integration.',
      companyId: company.id
    });

    if (result.success) {
      console.log('✅ Message sent successfully!');
      console.log(`   Message ID: ${result.messageId}`);
      console.log(`   Status: ${result.status}\n`);
    } else {
      console.error('❌ Failed to send message');
      console.error(`   Error: ${result.error}\n`);
    }

    // Instructions for testing incoming messages
    console.log('📥 Test 2: Incoming Messages');
    console.log('   To test incoming messages:');
    console.log('   1. Send a WhatsApp message from your phone to: +' + process.env.META_WHATSAPP_PHONE_NUMBER_ID);
    console.log('   2. Check if webhook receives the message');
    console.log('   3. Message should be logged in whatsapp_messages table\n');

    console.log('✨ Test completed!\n');
    console.log('Next steps:');
    console.log('1. Check your WhatsApp to verify message delivery');
    console.log('2. Send a message back to test incoming webhooks');
    console.log('3. Check Supabase whatsapp_messages table for records');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

// Run the test
testWhatsAppSend();

