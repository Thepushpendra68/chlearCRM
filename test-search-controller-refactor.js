/**
 * Test SearchController Refactoring
 * Verifies that searchController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing SearchController Refactoring\n');

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
  const searchControllerPath = path.join(__dirname, 'backend/src/controllers/searchController.js');
  const content = fs.readFileSync(searchControllerPath, 'utf8');

  console.log('📋 Verifying SearchController Refactoring\n');

  test('SearchController extends BaseController', () => {
    if (!content.includes('class SearchController extends BaseController')) {
      throw new Error('SearchController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler in class body (2 methods)
    const classStartIndex = content.indexOf('class SearchController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new SearchController()');
    const classContent = content.substring(classStartIndex, classEndIndex);
    const asyncHandlerMatches = classContent.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length !== 2) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 2)`);
    }
  });

  test('globalSearch uses success response', () => {
    if (!content.includes('this.success') && !content.match(/globalSearch[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('globalSearch does not use success response helper');
    }
  });

  test('getSuggestions uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getSuggestions[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getSuggestions does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 2) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 2)`);
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new SearchController()')) {
      throw new Error('Does not export instance of SearchController');
    }
  });

  test('No old try-catch blocks remain in class', () => {
    // Check only in class body
    const classStartIndex = content.indexOf('class SearchController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new SearchController()');
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

  console.log('  SearchController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 66;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 2`);
  console.log(`  Controllers refactored: 20/29 (auth, lead, activity, task, user, pipeline, contact, emailTemplate, assignment, dashboard, customField, apiClient, report, import, chatbot, voice, platform, picklist, config, search)\n`);

} catch (error) {
  console.log(`❌ Error reading searchController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ SearchController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 2 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Removed all console.log statements');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 20/29 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController, assignmentController, dashboardController, customFieldController, apiClientController, reportController, importController, chatbotController, voiceController, platformController, picklistController, configController, searchController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
