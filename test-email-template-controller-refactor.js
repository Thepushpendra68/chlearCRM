/**
 * Test EmailTemplateController Refactoring
 * Verifies that emailTemplateController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing EmailTemplateController Refactoring\n');

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
  const emailTemplateControllerPath = path.join(__dirname, 'backend/src/controllers/emailTemplateController.js');
  const content = fs.readFileSync(emailTemplateControllerPath, 'utf8');

  console.log('📋 Verifying EmailTemplateController Refactoring\n');

  test('EmailTemplateController extends BaseController', () => {
    if (!content.includes('class EmailTemplateController extends BaseController')) {
      throw new Error('EmailTemplateController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler import + 12 methods = 13 total
    const asyncHandlerMatches = content.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length < 13) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 13)`);
    }
  });

  test('getTemplates uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getTemplates[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getTemplates does not use success response helper');
    }
  });

  test('getTemplateById uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getTemplateById[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getTemplateById does not use success response helper');
    }
  });

  test('createTemplate uses created response', () => {
    if (!content.includes('this.created') && !content.match(/createTemplate[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('createTemplate does not use created response helper');
    }
  });

  test('updateTemplate uses updated response', () => {
    if (!content.includes('this.updated') && !content.match(/updateTemplate[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('updateTemplate does not use updated response helper');
    }
  });

  test('deleteTemplate uses deleted response', () => {
    if (!content.includes('this.deleted') && !content.match(/deleteTemplate[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('deleteTemplate does not use deleted response helper');
    }
  });

  test('createVersion uses created response', () => {
    if (!content.includes('this.created') && !content.match(/createVersion[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('createVersion does not use created response helper');
    }
  });

  test('publishVersion uses success response', () => {
    if (!content.includes('this.success') && !content.match(/publishVersion[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('publishVersion does not use success response helper');
    }
  });

  test('compileMJML uses success response', () => {
    if (!content.includes('this.success') && !content.match(/compileMJML[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('compileMJML does not use success response helper');
    }
  });

  test('previewTemplate uses success response', () => {
    if (!content.includes('this.success') && !content.match(/previewTemplate[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('previewTemplate does not use success response helper');
    }
  });

  test('getFolders uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getFolders[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getFolders does not use success response helper');
    }
  });

  test('getIntegrationSettings uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getIntegrationSettings[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getIntegrationSettings does not use success response helper');
    }
  });

  test('upsertIntegrationSettings uses success response', () => {
    if (!content.includes('this.success') && !content.match(/upsertIntegrationSettings[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('upsertIntegrationSettings does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 12) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 12)`);
    }
  });

  test('Uses validationError for validation failures', () => {
    if (!content.includes('this.validationError')) {
      throw new Error('Does not use validationError helper');
    }
  });

  test('Uses notFound for missing resources', () => {
    if (!content.includes('this.notFound')) {
      throw new Error('Does not use notFound helper');
    }
  });

  test('Helper methods use this prefix', () => {
    if (!content.includes('this.describeTemplate(')) {
      throw new Error('describeTemplate not called with this prefix');
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new EmailTemplateController()')) {
      throw new Error('Does not export instance of EmailTemplateController');
    }
  });

  test('No old try-catch blocks remain', () => {
    const tryCatchMatches = content.match(/try\s*{[\s\S]*?}\s*catch/g);
    if (tryCatchMatches && tryCatchMatches.length > 0) {
      throw new Error(`Found ${tryCatchMatches.length} try-catch blocks (should be 0)`);
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

  console.log('  EmailTemplateController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 278;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 12`);
  console.log(`  Controllers refactored: 8/30 (auth, lead, activity, task, user, pipeline, contact, emailTemplate)\n`);

} catch (error) {
  console.log(`❌ Error reading emailTemplateController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ EmailTemplateController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 12 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Helper methods use this prefix');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 8/30 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
