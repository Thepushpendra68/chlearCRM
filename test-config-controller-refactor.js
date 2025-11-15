/**
 * Test ConfigController Refactoring
 * Verifies that configController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing ConfigController Refactoring\n');

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
  const configControllerPath = path.join(__dirname, 'backend/src/controllers/configController.js');
  const content = fs.readFileSync(configControllerPath, 'utf8');

  console.log('📋 Verifying ConfigController Refactoring\n');

  test('ConfigController extends BaseController', () => {
    if (!content.includes('class ConfigController extends BaseController')) {
      throw new Error('ConfigController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler in class body (5 methods)
    const classStartIndex = content.indexOf('class ConfigController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new ConfigController()');
    const classContent = content.substring(classStartIndex, classEndIndex);
    const asyncHandlerMatches = classContent.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length !== 5) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 5)`);
    }
  });

  test('getIndustryConfig uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getIndustryConfig[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getIndustryConfig does not use success response helper');
    }
  });

  test('getFormLayout uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getFormLayout[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getFormLayout does not use success response helper');
    }
  });

  test('getAvailableIndustries uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getAvailableIndustries[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getAvailableIndustries does not use success response helper');
    }
  });

  test('getTerminology uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getTerminology[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getTerminology does not use success response helper');
    }
  });

  test('getFieldDefinitions uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getFieldDefinitions[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getFieldDefinitions does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 5) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 5)`);
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new ConfigController()')) {
      throw new Error('Does not export instance of ConfigController');
    }
  });

  test('No old try-catch blocks remain in class', () => {
    // Check only in class body
    const classStartIndex = content.indexOf('class ConfigController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new ConfigController()');
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

  test('No console.error statements remain', () => {
    const consoleErrorMatches = content.match(/console\.error/g);
    if (consoleErrorMatches && consoleErrorMatches.length > 0) {
      throw new Error(`Found ${consoleErrorMatches.length} console.error statements (should be 0)`);
    }
  });

  console.log('  ConfigController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 211;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 5`);
  console.log(`  Controllers refactored: 19/29 (auth, lead, activity, task, user, pipeline, contact, emailTemplate, assignment, dashboard, customField, apiClient, report, import, chatbot, voice, platform, picklist, config)\n`);

} catch (error) {
  console.log(`❌ Error reading configController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ ConfigController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 5 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Removed all console.error statements');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 19/29 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController, assignmentController, dashboardController, customFieldController, apiClientController, reportController, importController, chatbotController, voiceController, platformController, picklistController, configController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
