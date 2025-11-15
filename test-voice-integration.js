/**
 * Test script for voice service integration
 * Tests database operations without starting the full backend
 */

// Load environment variables
require('dotenv').config({ path: './backend/.env' });

const voiceService = require('./backend/src/services/voiceService');

// Mock user ID for testing
const TEST_USER_ID = 'test-user-123';
const TEST_COMPANY_ID = 'test-company-456';

async function testVoiceService() {
  console.log('🧪 Testing Voice Service Integration\n');

  try {
    // Test 1: Get user voice settings (should return defaults)
    console.log('Test 1: Get user voice settings');
    const settings = await voiceService.getUserVoiceSettings(TEST_USER_ID);
    console.log('✅ Retrieved settings:', JSON.stringify(settings, null, 2));
    console.log('');

    // Test 2: Update user voice settings
    console.log('Test 2: Update user voice settings');
    const updatedSettings = await voiceService.updateUserVoiceSettings(TEST_USER_ID, {
      enabled: true,
      language: 'en-US',
      autoSpeak: true,
      voiceActivation: false,
      wakeWord: 'Hey Sakha',
      rate: 1.0,
      pitch: 1.0,
      volume: 0.8,
      silenceDelay: 5000,
      privacy: {
        storeVoiceNotes: true,
        allowVoiceAnalytics: true,
        dataRetentionDays: 30
      }
    });
    console.log('✅ Updated settings:', JSON.stringify(updatedSettings, null, 2));
    console.log('');

    // Test 3: Log voice event
    console.log('Test 3: Log voice event');
    await voiceService.logVoiceEvent(TEST_USER_ID, {
      type: 'voice_input',
      accuracy: 95,
      duration: 3000,
      transcriptLength: 50,
      commandType: 'chatbot',
      success: true
    });
    console.log('✅ Logged voice event');
    console.log('');

    // Test 4: Get voice analytics
    console.log('Test 4: Get voice analytics');
    const analytics = await voiceService.getVoiceAnalytics(TEST_USER_ID, '7d');
    console.log('✅ Retrieved analytics:', JSON.stringify(analytics, null, 2));
    console.log('');

    // Test 5: Create voice note
    console.log('Test 5: Create voice note');
    const note = await voiceService.createVoiceNote(TEST_USER_ID, {
      transcription: 'This is a test voice note',
      context: { lead_id: 'test-lead' },
      duration: 5000
    });
    console.log('✅ Created voice note:', JSON.stringify(note, null, 2));
    console.log('');

    // Test 6: Get user voice notes
    console.log('Test 6: Get user voice notes');
    const notes = await voiceService.getUserVoiceNotes(TEST_USER_ID);
    console.log('✅ Retrieved voice notes:', JSON.stringify(notes, null, 2));
    console.log('');

    console.log('🎉 All voice service tests passed!');
    console.log('\nNote: Some operations may show mock data if database is not fully configured.');
    console.log('The important thing is that the methods execute without errors.');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testVoiceService();
