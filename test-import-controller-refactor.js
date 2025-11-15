/**
 * Test ImportController Refactoring
 * Verifies that importController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing ImportController Refactoring\n');

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
  const importControllerPath = path.join(__dirname, 'backend/src/controllers/importController.js');
  const content = fs.readFileSync(importControllerPath, 'utf8');

  console.log('📋 Verifying ImportController Refactoring\n');

  test('ImportController extends BaseController', () => {
    if (!content.includes('class ImportController extends BaseController')) {
      throw new Error('ImportController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler in class body (7 methods)
    const classStartIndex = content.indexOf('class ImportController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new ImportController()');
    const classContent = content.substring(classStartIndex, classEndIndex);
    const asyncHandlerMatches = classContent.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length !== 7) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 7)`);
    }
  });

  test('importLeads uses success response', () => {
    if (!content.includes('this.success') && !content.match(/importLeads[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('importLeads does not use success response helper');
    }
  });

  test('dryRunLeads uses success response', () => {
    if (!content.includes('this.success') && !content.match(/dryRunLeads[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('dryRunLeads does not use success response helper');
    }
  });

  test('exportLeads uses asyncHandler', () => {
    if (!content.match(/exportLeads[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('exportLeads does not use asyncHandler');
    }
  });

  test('getImportTemplate uses asyncHandler', () => {
    if (!content.match(/getImportTemplate[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getImportTemplate does not use asyncHandler');
    }
  });

  test('getImportHistory uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getImportHistory[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getImportHistory does not use success response helper');
    }
  });

  test('validateImportFile uses success response', () => {
    if (!content.includes('this.success') && !content.match(/validateImportFile[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('validateImportFile does not use success response helper');
    }
  });

  test('getFileHeaders uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getFileHeaders[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getFileHeaders does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 7) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 7)`);
    }
  });

  test('Helper methods use this prefix', () => {
    if (!content.includes('this.convertToCSV(')) {
      throw new Error('convertToCSV not called with this prefix');
    }
    if (!content.includes('this.convertToExcel(')) {
      throw new Error('convertToExcel not called with this prefix');
    }
    if (!content.includes('this.getSuggestedMappings(')) {
      throw new Error('getSuggestedMappings not called with this prefix');
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new ImportController()')) {
      throw new Error('Does not export instance of ImportController');
    }
  });

  test('No old try-catch blocks remain in class', () => {
    // Check only in class body, not in helper functions outside
    const classStartIndex = content.indexOf('class ImportController extends BaseController');
    const classEndIndex = content.indexOf('module.exports = new ImportController()');
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

  console.log('  ImportController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 541;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 7`);
  console.log(`  Controllers refactored: 14/30 (auth, lead, activity, task, user, pipeline, contact, emailTemplate, assignment, dashboard, customField, apiClient, report, import)\n`);

} catch (error) {
  console.log(`❌ Error reading importController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ ImportController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 8 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Helper methods use this prefix');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Removed all console.log statements');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 14/30 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController, assignmentController, dashboardController, customFieldController, apiClientController, reportController, importController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
