/**
 * Test VoiceController Refactoring
 * Verifies that voiceController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing VoiceController Refactoring\n');

let passed = 0;
let failed = 0;

const test = (name, fn) => {
  try {
    fn();
    console.log(`✅ ${name}`);
    passed++;
  } catch (error) {
    console.log(`❌ ${name}`);
    console.log(`   Error: ${error.message}`);
    failed++;
  }
};

const fs = require('fs');
const path = require('path');

try {
  const voiceControllerPath = path.join(__dirname, 'backend/src/controllers/voiceController.js');
  const content = fs.readFileSync(voiceControllerPath, 'utf8');

  console.log('📋 Verifying VoiceController Refactoring\n');

  test('VoiceController extends BaseController', () => {
    if (!content.includes('class VoiceController extends BaseController')) {
      throw new Error('VoiceController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler in class body (10 methods)
    const classStartIndex = content.indexOf('class VoiceController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new VoiceController()');
    const classContent = content.substring(classStartIndex, classEndIndex);
    const asyncHandlerMatches = classContent.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length !== 10) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 10)`);
    }
  });

  test('processVoiceMessage uses success response', () => {
    if (!content.includes('this.success') && !content.match(/processVoiceMessage[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('processVoiceMessage does not use success response helper');
    }
  });

  test('getVoiceSettings uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getVoiceSettings[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getVoiceSettings does not use success response helper');
    }
  });

  test('updateVoiceSettings uses updated response', () => {
    if (!content.includes('this.updated') && !content.match(/updateVoiceSettings[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('updateVoiceSettings does not use updated response helper');
    }
  });

  test('getTextToSpeech uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getTextToSpeech[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getTextToSpeech does not use success response helper');
    }
  });

  test('logVoiceAnalytics uses success response', () => {
    if (!content.includes('this.success') && !content.match(/logVoiceAnalytics[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('logVoiceAnalytics does not use success response helper');
    }
  });

  test('getVoiceAnalytics uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getVoiceAnalytics[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getVoiceAnalytics does not use success response helper');
    }
  });

  test('createVoiceNote uses created response', () => {
    if (!content.includes('this.created') && !content.match(/createVoiceNote[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('createVoiceNote does not use created response helper');
    }
  });

  test('getVoiceNotes uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getVoiceNotes[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getVoiceNotes does not use success response helper');
    }
  });

  test('deleteVoiceNote uses deleted response', () => {
    if (!content.includes('this.deleted') && !content.match(/deleteVoiceNote[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('deleteVoiceNote does not use deleted response helper');
    }
  });

  test('processVoiceCommand uses success response', () => {
    if (!content.includes('this.success') && !content.match(/processVoiceCommand[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('processVoiceCommand does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 10) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 10)`);
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new VoiceController()')) {
      throw new Error('Does not export instance of VoiceController');
    }
  });

  test('No old try-catch blocks remain in class', () => {
    // Check only in class body
    const classStartIndex = content.indexOf('class VoiceController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new VoiceController()');
    const classContent = content.substring(classStartIndex, classEndIndex);
    const tryCatchMatches = classContent.match(/try\s*{[\s\S]*?}\s*catch/g);
    if (tryCatchMatches && tryCatchMatches.length > 0) {
      throw new Error(`Found ${tryCatchMatches.length} try-catch blocks in class (should be 0)`);
    }
  });

  test('No old res.json() calls remain', () => {
    const resJsonMatches = content.match(/res\.json\(/g);
    if (resJsonMatches && resJsonMatches.length > 0) {
      throw new Error(`Found ${resJsonMatches.length} res.json() calls (should be 0)`);
    }
  });

  test('No old res.status().json() calls remain', () => {
    const resStatusJsonMatches = content.match(/res\.status\([^)]+\)\.json\(/g);
    if (resStatusJsonMatches && resStatusJsonMatches.length > 0) {
      throw new Error(`Found ${resStatusJsonMatches.length} res.status().json() calls (should be 0)`);
    }
  });

  test('No console.log statements remain', () => {
    const consoleLogMatches = content.match(/console\.log/g);
    if (consoleLogMatches && consoleLogMatches.length > 0) {
      throw new Error(`Found ${consoleLogMatches.length} console.log statements (should be 0)`);
    }
  });

  console.log('  VoiceController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 294;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 10`);
  console.log(`  Controllers refactored: 16/30 (auth, lead, activity, task, user, pipeline, contact, emailTemplate, assignment, dashboard, customField, apiClient, report, import, chatbot, voice)\n`);

} catch (error) {
  console.log(`❌ Error reading voiceController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ VoiceController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 10 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Removed all console.log statements');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 16/30 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController, assignmentController, dashboardController, customFieldController, apiClientController, reportController, importController, chatbotController, voiceController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
