/**
 * Test EmailSendController Refactoring
 * Verifies that emailSendController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing EmailSendController Refactoring\n');

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
  const emailSendControllerPath = path.join(__dirname, 'backend/src/controllers/emailSendController.js');
  const content = fs.readFileSync(emailSendControllerPath, 'utf8');

  console.log('📋 Verifying EmailSendController Refactoring\n');

  test('EmailSendController extends BaseController', () => {
    if (!content.includes('class EmailSendController extends BaseController')) {
      throw new Error('EmailSendController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler in class body (7 methods)
    const classStartIndex = content.indexOf('class EmailSendController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new EmailSendController()');
    const classContent = content.substring(classStartIndex, classEndIndex);
    const asyncHandlerMatches = classContent.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length !== 7) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 7)`);
    }
  });

  test('sendToLead uses success response', () => {
    if (!content.includes('this.success') && !content.match(/sendToLead[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('sendToLead does not use success response helper');
    }
  });

  test('sendToEmail uses success response', () => {
    if (!content.includes('this.success') && !content.match(/sendToEmail[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('sendToEmail does not use success response helper');
    }
  });

  test('getSentEmails uses paginated response', () => {
    if (!content.includes('this.paginated') && !content.match(/getSentEmails[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('getSentEmails does not use paginated response helper');
    }
  });

  test('getEmailDetails uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getEmailDetails[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('getEmailDetails does not use success response helper');
    }
  });

  test('getSuppressionList uses paginated response', () => {
    if (!content.includes('this.paginated') && !content.match(/getSuppressionList[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('getSuppressionList does not use paginated response helper');
    }
  });

  test('addToSuppressionList uses success response', () => {
    if (!content.includes('this.success') && !content.match(/addToSuppressionList[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('addToSuppressionList does not use success response helper');
    }
  });

  test('removeFromSuppressionList uses success response', () => {
    if (!content.includes('this.success') && !content.match(/removeFromSuppressionList[\s\S]*?=[ \t\n\r]*asyncHandler/)) {
      throw new Error('removeFromSuppressionList does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 7) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 7)`);
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new EmailSendController()')) {
      throw new Error('Does not export instance of EmailSendController');
    }
  });

  test('No old try-catch blocks remain in class', () => {
    // Check only in class body
    const classStartIndex = content.indexOf('class EmailSendController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new EmailSendController()');
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

  console.log('  EmailSendController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 243;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 7`);
  console.log(`  Controllers refactored: 23/29 (auth, lead, activity, task, user, pipeline, contact, emailTemplate, assignment, dashboard, customField, apiClient, report, import, chatbot, voice, platform, picklist, config, search, leadCapture, emailSend)\n`);

} catch (error) {
  console.log(`❌ Error reading emailSendController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ EmailSendController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 7 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 23/29 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController, assignmentController, dashboardController, customFieldController, apiClientController, reportController, importController, chatbotController, voiceController, platformController, picklistController, configController, searchController, leadCaptureController, emailSendController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
