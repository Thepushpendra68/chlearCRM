/**
 * Automated Refactoring Tool for ActivityController
 * Converts to BaseController pattern
 */

const fs = require('fs');
const path = require('path');

const activityControllerPath = path.join(__dirname, 'backend/src/controllers/activityController.js');
let content = fs.readFileSync(activityControllerPath, 'utf8');

console.log('🔄 Refactoring ActivityController...\n');

// 1. Update the class declaration
content = content.replace(
  /class ActivityController \{/,
  'class ActivityController extends BaseController {'
);

// 2. Replace all async method declarations with arrow functions + asyncHandler
content = content.replace(
  /async (\w+)\(req, res, next\) \{/g,
  '$1 = asyncHandler(async (req, res) => {'
);

// 3. Remove all try-catch blocks and next(error) calls
// This is complex, so let's do it step by step

// First, let's handle each method one by one
const methods = [
  {
    name: 'getActivities',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data,\s*pagination: result\.pagination\s*\}\);/g,
    replacement: 'const pagination = this.getPaginationMeta(result.pagination.total, result.pagination.page, result.pagination.limit);\n      this.paginated(res, result.data, pagination, 200, \'Activities retrieved successfully\');'
  },
  {
    name: 'getActivityById',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data,\s*pagination: result\.pagination\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Activity retrieved successfully\');'
  },
  {
    name: 'createActivity',
    oldPattern: /res\.status\(201\)\.json\(\{\s*success: true,\s*data: result\.data,\s*message: ['"]Activity created successfully['"]\s*\}\);/g,
    replacement: 'this.created(res, result.data, \'Activity created successfully\');'
  },
  {
    name: 'updateActivity',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data,\s*message: ['"]Activity updated successfully['"]\s*\}\);/g,
    replacement: 'this.updated(res, result.data, \'Activity updated successfully\');'
  },
  {
    name: 'deleteActivity',
    oldPattern: /res\.json\(\{\s*success: true,\s*message: result\.message\s*\}\);/g,
    replacement: 'this.success(res, { message: result.message }, 200, result.message);'
  },
  {
    name: 'completeActivity',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data,\s*message: ['"]Activity marked as completed['"]\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Activity marked as completed\');'
  },
  {
    name: 'getLeadTimeline',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Timeline retrieved successfully\');'
  },
  {
    name: 'getLeadActivities',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Lead activities retrieved successfully\');'
  },
  {
    name: 'getUserActivities',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'User activities retrieved successfully\');'
  },
  {
    name: 'createBulkActivities',
    oldPattern: /res\.status\(201\)\.json\(\{\s*success: true,\s*data: result\.data,\s*message: [`]['"]\$\{result\.data\.created_count\} activities created successfully[`]['"]\s*\}\);/g,
    replacement: 'this.created(res, result.data, `${result.data.created_count} activities created successfully`);'
  },
  {
    name: 'getActivityStats',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Activity statistics retrieved successfully\');'
  },
  {
    name: 'getLeadTimelineSummary',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Timeline summary retrieved successfully\');'
  },
  {
    name: 'getUserTimeline',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'User timeline retrieved successfully\');'
  },
  {
    name: 'getTeamTimeline',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Team timeline retrieved successfully\');'
  },
  {
    name: 'getActivityTrends',
    oldPattern: /res\.json\(\{\s*success: true,\s*data: result\.data\s*\}\);/g,
    replacement: 'this.success(res, result.data, 200, \'Activity trends retrieved successfully\');'
  }
];

// Apply replacements
methods.forEach(method => {
  const count = (content.match(method.oldPattern) || []).length;
  if (count > 0) {
    console.log(`  ✓ ${method.name}: ${count} replacement(s)`);
    content = content.replace(method.oldPattern, method.replacement);
  }
});

// 4. Replace helper function calls to use 'this'
content = content.replace(/buildActivitySummary\(/g, 'this.buildActivitySummary(');
content = content.replace(/computeActivityChanges\(/g, 'this.computeActivityChanges(');

// 5. Remove next(error) calls at the end of catch blocks
// This is tricky to do with regex, so we'll leave that for now

console.log('\n✅ Refactoring complete!\n');
console.log('Note: You may need to manually remove catch blocks and next(error) calls');
console.log('      and add error handling with BaseController helpers.\n');

// Write the file
fs.writeFileSync(activityControllerPath, content);
console.log(`📝 Written to ${activityControllerPath}\n`);

process.exit(0);
