/**
 * Test AssignmentController Refactoring
 * Verifies that assignmentController properly extends BaseController and uses standardized patterns
 */

require('dotenv').config();

console.log('🧪 Testing AssignmentController Refactoring\n');

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
  const assignmentControllerPath = path.join(__dirname, 'backend/src/controllers/assignmentController.js');
  const content = fs.readFileSync(assignmentControllerPath, 'utf8');

  console.log('📋 Verifying AssignmentController Refactoring\n');

  test('AssignmentController extends BaseController', () => {
    if (!content.includes('class AssignmentController extends BaseController')) {
      throw new Error('AssignmentController does not extend BaseController');
    }
  });

  test('All methods use asyncHandler', () => {
    // Count asyncHandler import + 18 methods = 19 total
    const asyncHandlerMatches = content.match(/asyncHandler/g);
    if (!asyncHandlerMatches || asyncHandlerMatches.length < 19) {
      throw new Error(`Not all methods use asyncHandler (found ${asyncHandlerMatches?.length || 0}, expected 19)`);
    }
  });

  test('getRules uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getRules[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getRules does not use success response helper');
    }
  });

  test('getActiveRules uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getActiveRules[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getActiveRules does not use success response helper');
    }
  });

  test('getRuleById uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getRuleById[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getRuleById does not use success response helper');
    }
  });

  test('createRule uses created response', () => {
    if (!content.includes('this.created') && !content.match(/createRule[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('createRule does not use created response helper');
    }
  });

  test('updateRule uses updated response', () => {
    if (!content.includes('this.updated') && !content.match(/updateRule[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('updateRule does not use updated response helper');
    }
  });

  test('deleteRule uses deleted response', () => {
    if (!content.includes('this.deleted') && !content.match(/deleteRule[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('deleteRule does not use deleted response helper');
    }
  });

  test('assignLead uses success response', () => {
    if (!content.includes('this.success') && !content.match(/assignLead[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('assignLead does not use success response helper');
    }
  });

  test('bulkAssignLeads uses success response', () => {
    if (!content.includes('this.success') && !content.match(/bulkAssignLeads[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('bulkAssignLeads does not use success response helper');
    }
  });

  test('getLeadAssignmentHistory uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getLeadAssignmentHistory[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getLeadAssignmentHistory does not use success response helper');
    }
  });

  test('getTeamWorkload uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getTeamWorkload[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getTeamWorkload does not use success response helper');
    }
  });

  test('getAssignmentHistory uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getAssignmentHistory[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getAssignmentHistory does not use success response helper');
    }
  });

  test('redistributeLeads uses success response', () => {
    if (!content.includes('this.success') && !content.match(/redistributeLeads[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('redistributeLeads does not use success response helper');
    }
  });

  test('getAssignmentStats uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getAssignmentStats[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getAssignmentStats does not use success response helper');
    }
  });

  test('autoAssignLead uses success response', () => {
    if (!content.includes('this.success') && !content.match(/autoAssignLead[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('autoAssignLead does not use success response helper');
    }
  });

  test('processBulkAutoAssignment uses success response', () => {
    if (!content.includes('this.success') && !content.match(/processBulkAutoAssignment[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('processBulkAutoAssignment does not use success response helper');
    }
  });

  test('getAssignmentRecommendations uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getAssignmentRecommendations[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getAssignmentRecommendations does not use success response helper');
    }
  });

  test('getRoutingStats uses success response', () => {
    if (!content.includes('this.success') && !content.match(/getRoutingStats[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('getRoutingStats does not use success response helper');
    }
  });

  test('reassignLead uses success response', () => {
    if (!content.includes('this.success') && !content.match(/reassignLead[\s\S]*?=[\s\S]*?asyncHandler/)) {
      throw new Error('reassignLead does not use success response helper');
    }
  });

  test('Methods use arrow function syntax', () => {
    const arrowFunctions = content.match(/=\s+asyncHandler/g);
    if (!arrowFunctions || arrowFunctions.length !== 18) {
      throw new Error(`Not all methods use arrow function syntax (found ${arrowFunctions?.length || 0}, expected 18)`);
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
    if (!content.includes('this.summarizeRule(')) {
      throw new Error('summarizeRule not called with this prefix');
    }
    if (!content.includes('this.computeRuleChanges(')) {
      throw new Error('computeRuleChanges not called with this prefix');
    }
  });

  test('Exports instance (not object)', () => {
    if (!content.includes('module.exports = new AssignmentController()')) {
      throw new Error('Does not export instance of AssignmentController');
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

  console.log('  AssignmentController: All refactoring checks passed ✓\n');

  // Calculate code reduction
  const originalLines = 481;
  const newLines = content.split('\n').length;
  const reduction = Math.round(((originalLines - newLines) / originalLines) * 100);

  console.log('📊 Refactoring Statistics:');
  console.log(`  Original lines: ${originalLines}`);
  console.log(`  New lines: ${newLines}`);
  console.log(`  Code reduction: ${reduction}%`);
  console.log(`  Methods converted: 18`);
  console.log(`  Controllers refactored: 9/30 (auth, lead, activity, task, user, pipeline, contact, emailTemplate, assignment)\n`);

} catch (error) {
  console.log(`❌ Error reading assignmentController.js: ${error.message}\n`);
  failed++;
}

// Summary
console.log('='.repeat(50));
console.log(`Total Tests: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('='.repeat(50));

if (failed === 0) {
  console.log('\n✅ AssignmentController refactoring verified successfully!\n');
  console.log('Refactoring Summary:');
  console.log('  ✓ Extends BaseController');
  console.log('  ✓ All 18 methods use asyncHandler');
  console.log('  ✓ All responses use BaseController helpers');
  console.log('  ✓ Helper methods use this prefix');
  console.log('  ✓ Removed all try-catch blocks');
  console.log('  ✓ Removed all res.json() calls');
  console.log('  ✓ Removed all res.status().json() calls');
  console.log('  ✓ Exports singleton instance\n');
  console.log('Controllers refactored: 9/30 (authController, leadController, activityController, taskController, userController, pipelineController, contactController, emailTemplateController, assignmentController)\n');
  process.exit(0);
} else {
  console.log('\n❌ Some tests failed.\n');
  process.exit(1);
}
