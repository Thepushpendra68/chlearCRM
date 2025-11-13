#!/usr/bin/env node
/**
 * Progress Tracker for Chatbot Expansion
 * Usage: node scripts/track-progress.js
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CHATBOT_SERVICE_PATH = path.join(
  __dirname,
  "..",
  "backend",
  "src",
  "services",
  "chatbotService.js",
);
const CHATBOT_FALLBACK_PATH = path.join(
  __dirname,
  "..",
  "backend",
  "src",
  "services",
  "chatbotFallback.js",
);
const OUTPUT_PATH = path.join(
  __dirname,
  "..",
  "chatbot-expansion",
  "PROGRESS.md",
);

// All discovered actions from scanner
const ALL_ACTIONS = {
  activity: [
    "GET_ACTIVITIES",
    "GET_ACTIVITY_BY_ID",
    "CREATE_ACTIVITY",
    "UPDATE_ACTIVITY",
    "DELETE_ACTIVITY",
    "COMPLETE_ACTIVITY",
    "GET_LEAD_TIMELINE",
    "GET_LEAD_ACTIVITIES",
    "GET_USER_ACTIVITIES",
    "CREATE_BULK_ACTIVITIES",
    "GET_ACTIVITY_STATS",
    "GET_LEAD_TIMELINE_SUMMARY",
    "GET_USER_TIMELINE",
    "GET_TEAM_TIMELINE",
    "GET_ACTIVITY_TRENDS",
  ],
  assignment: [
    "GET_RULES",
    "GET_ACTIVE_RULES",
    "GET_RULE_BY_ID",
    "CREATE_RULE",
    "UPDATE_RULE",
    "DELETE_RULE",
    "ASSIGN_LEAD",
    "BULK_ASSIGN_LEADS",
    "GET_LEAD_ASSIGNMENT_HISTORY",
    "GET_TEAM_WORKLOAD",
    "GET_ASSIGNMENT_HISTORY",
    "REDISTRIBUTE_LEADS",
    "GET_ASSIGNMENT_STATS",
    "AUTO_ASSIGN_LEAD",
    "PROCESS_BULK_AUTO_ASSIGNMENT",
    "GET_ASSIGNMENT_RECOMMENDATIONS",
    "GET_ROUTING_STATS",
    "REASSIGN_LEAD",
  ],
  task: [
    "GET_TASKS",
    "GET_TASK_BY_ID",
    "CREATE_TASK",
    "UPDATE_TASK",
    "COMPLETE_TASK",
    "DELETE_TASK",
    "GET_OVERDUE_TASKS",
    "GET_TASK_STATS",
    "GET_TASKS_BY_LEAD_ID",
  ],
  pipeline: [
    "GET_STAGES",
    "CREATE_STAGE",
    "UPDATE_STAGE",
    "DELETE_STAGE",
    "REORDER_STAGES",
    "GET_PIPELINE_OVERVIEW",
    "MOVE_LEAD_TO_STAGE",
    "GET_CONVERSION_RATES",
    "CREATE_DEFAULT_STAGES",
  ],
  emailTemplate: [
    "GET_TEMPLATES",
    "GET_TEMPLATE_BY_ID",
    "CREATE_TEMPLATE",
    "UPDATE_TEMPLATE",
    "DELETE_TEMPLATE",
    "CREATE_VERSION",
    "PUBLISH_VERSION",
    "COMPILE_MJML",
    "PREVIEW_TEMPLATE",
    "GET_FOLDERS",
    "GET_INTEGRATION_SETTINGS",
    "UPSERT_INTEGRATION_SETTINGS",
  ],
  emailSend: [
    "SEND_TO_LEAD",
    "SEND_TO_EMAIL",
    "GET_SENT_EMAILS",
    "GET_EMAIL_DETAILS",
    "GET_SUPPRESSION_LIST",
    "ADD_TO_SUPPRESSION_LIST",
    "REMOVE_FROM_SUPPRESSION_LIST",
  ],
  automation: [
    "GET_SEQUENCES",
    "GET_SEQUENCE_BY_ID",
    "CREATE_SEQUENCE",
    "UPDATE_SEQUENCE",
    "DELETE_SEQUENCE",
    "ENROLL_LEAD",
    "UNENROLL_LEAD",
    "GET_ENROLLMENTS",
    "PROCESS_DUE_ENROLLMENTS",
  ],
  workflowTemplate: [
    "GET_TEMPLATES",
    "GET_TEMPLATE_BY_ID",
    "CREATE_TEMPLATE",
    "CREATE_SEQUENCE_FROM_TEMPLATE",
    "UPDATE_TEMPLATE",
    "DELETE_TEMPLATE",
    "EXPORT_TEMPLATE",
    "IMPORT_TEMPLATE",
    "GET_TEMPLATE_PACKS",
    "GET_PACK_BY_ID",
  ],
  import: [
    "IMPORT_LEADS",
    "DRY_RUN_LEADS",
    "GET_IMPORT_HISTORY",
    "VALIDATE_IMPORT_FILE",
    "CONVERT_TO_CSV",
    "CONVERT_TO_EXCEL",
    "GET_SUGGESTED_MAPPINGS",
    "GET_UPLOAD_MIDDLEWARE",
  ],
  emailWebhook: [
    "HANDLE_POSTMARK_WEBHOOK",
    "HANDLE_SENDGRID_WEBHOOK",
    "TEST_WEBHOOK",
  ],
  leadCapture: ["CREATE_CAPTURE_FORM"],
  auth: [
    "REGISTER",
    "LOGIN",
    "GET_PROFILE",
    "UPDATE_PROFILE",
    "CHANGE_PASSWORD",
    "LOGOUT",
  ],
};

// Current AI actions (manually tracked)
const CURRENT_ACTIONS = new Set([
  "CREATE_LEAD",
  "UPDATE_LEAD",
  "GET_LEAD",
  "SEARCH_LEADS",
  "LIST_LEADS",
  "GET_STATS",
  "DELETE_LEAD",
  "ADD_LEAD_NOTE",
  "VIEW_LEAD_NOTES",
  "MOVE_LEAD_STAGE",
  "ASSIGN_LEAD",
  "UNASSIGN_LEAD",
  "DETECT_DUPLICATES",
  "EXPORT_LEADS",
  "SUGGEST_ASSIGNMENT",
  "LEAD_SCORING",
  "CREATE_TASK",
  "LIST_MY_TASKS",
  "UPDATE_TASK",
  "LOG_ACTIVITY",
  "GET_TEAM_STATS",
  "GET_MY_STATS",
  "BULK_UPDATE_LEADS",
  "BULK_ASSIGN_LEADS",
  "GROUP_BY_ANALYSIS",
  "SCHEDULE_REPORT",
  "CREATE_REMINDER",
]);

// Actions implemented (expand this as you add new ones)
const IMPLEMENTED_ACTIONS = new Set([
  // Core lead actions (already working)
  "CREATE_LEAD",
  "UPDATE_LEAD",
  "GET_LEAD",
  "SEARCH_LEADS",
  "LIST_LEADS",
  "GET_STATS",
  "DELETE_LEAD",
  "ADD_LEAD_NOTE",
  "VIEW_LEAD_NOTES",
  "MOVE_LEAD_STAGE",
  "ASSIGN_LEAD",
  "UNASSIGN_LEAD",
  "DETECT_DUPLICATES",
  "EXPORT_LEADS",
  "SUGGEST_ASSIGNMENT",
  "LEAD_SCORING",
  "CREATE_TASK",
  "LIST_MY_TASKS",
  "UPDATE_TASK",
  "LOG_ACTIVITY",
  "GET_TEAM_STATS",
  "GET_MY_STATS",
  "BULK_UPDATE_LEADS",
  "BULK_ASSIGN_LEADS",
  "GROUP_BY_ANALYSIS",
  "SCHEDULE_REPORT",
  "CREATE_REMINDER",

  // Week 1: Activity Module (15 actions) ✅
  "GET_ACTIVITIES",
  "CREATE_ACTIVITY",
  "GET_ACTIVITY_STATS",
  "GET_TEAM_TIMELINE",
  "COMPLETE_ACTIVITY",
  "GET_ACTIVITY_BY_ID",
  "GET_LEAD_TIMELINE",
  "GET_LEAD_ACTIVITIES",
  "GET_USER_ACTIVITIES",
  "CREATE_BULK_ACTIVITIES",
  "UPDATE_ACTIVITY",
  "DELETE_ACTIVITY",
  "GET_LEAD_TIMELINE_SUMMARY",
  "GET_USER_TIMELINE",
  "GET_ACTIVITY_TRENDS",

  // Week 1: Assignment Module (10 actions) ✅
  "GET_TEAM_WORKLOAD",
  "AUTO_ASSIGN_LEAD",
  "CREATE_ASSIGNMENT_RULE",
  "GET_ASSIGNMENT_RECOMMENDATIONS",
  "REDISTRIBUTE_LEADS",
  "REASSIGN_LEAD",
  "GET_ASSIGNMENT_STATS",
  "GET_ASSIGNMENT_HISTORY",
  "GET_ACTIVE_RULES",
  "GET_ROUTING_STATS",

  // Week 2: Pipeline Module (9 actions) ✅
  "GET_STAGES",
  "CREATE_STAGE",
  "UPDATE_STAGE",
  "DELETE_STAGE",
  "REORDER_STAGES",
  "GET_PIPELINE_OVERVIEW",
  "MOVE_LEAD_TO_STAGE",
  "GET_CONVERSION_RATES",
  "CREATE_DEFAULT_STAGES",

  // Week 2: Task Module (9 actions) ✅
  "GET_TASKS",
  "GET_TASK_BY_ID",
  "CREATE_TASK",
  "UPDATE_TASK",
  "COMPLETE_TASK",
  "DELETE_TASK",
  "GET_OVERDUE_TASKS",
  "GET_TASK_STATS",
  "GET_TASKS_BY_LEAD_ID",

  // Week 3: EmailSend Module (7 actions) ✅
  "SEND_TO_LEAD",
  "SEND_TO_EMAIL",
  "GET_SENT_EMAILS",
  "GET_EMAIL_DETAILS",
  "GET_SUPPRESSION_LIST",
  "ADD_TO_SUPPRESSION_LIST",
  "REMOVE_FROM_SUPPRESSION_LIST",

  // Week 3: EmailTemplate Module (12 actions) ✅
  "GET_TEMPLATES",
  "GET_TEMPLATE_BY_ID",
  "CREATE_TEMPLATE",
  "UPDATE_TEMPLATE",
  "DELETE_TEMPLATE",
  "CREATE_VERSION",
  "PUBLISH_VERSION",
  "COMPILE_MJML",
  "PREVIEW_TEMPLATE",
  "GET_FOLDERS",
  "GET_INTEGRATION_SETTINGS",
  "UPSERT_INTEGRATION_SETTINGS",

  // Week 3: Automation Module (9 actions) ✅
  "GET_SEQUENCES",
  "GET_SEQUENCE_BY_ID",
  "CREATE_SEQUENCE",
  "UPDATE_SEQUENCE",
  "DELETE_SEQUENCE",
  "ENROLL_LEAD",
  "UNENROLL_LEAD",
  "GET_ENROLLMENTS",
  "PROCESS_DUE_ENROLLMENTS",

  // Week 3: WorkflowTemplate Module (10 actions) ✅
  "GET_WORKFLOW_TEMPLATES",
  "GET_WORKFLOW_TEMPLATE_BY_ID",
  "CREATE_WORKFLOW_TEMPLATE",
  "CREATE_SEQUENCE_FROM_TEMPLATE",
  "UPDATE_WORKFLOW_TEMPLATE",
  "DELETE_WORKFLOW_TEMPLATE",
  "EXPORT_WORKFLOW_TEMPLATE",
  "IMPORT_WORKFLOW_TEMPLATE",
  "GET_TEMPLATE_PACKS",
  "GET_PACK_BY_ID",

  // Week 4: Import/Export Module (8 actions) ✅
  "IMPORT_LEADS",
  "DRY_RUN_LEADS",
  "GET_IMPORT_HISTORY",
  "VALIDATE_IMPORT_FILE",
  "CONVERT_TO_CSV",
  "CONVERT_TO_EXCEL",
  "GET_SUGGESTED_MAPPINGS",
  "GET_UPLOAD_MIDDLEWARE",

  // Week 4: Auth Module (6 actions) ✅
  "REGISTER",
  "LOGIN",
  "GET_PROFILE",
  "UPDATE_PROFILE",
  "CHANGE_PASSWORD",
  "LOGOUT",

  // Week 4: EmailWebhook Module (3 actions) ✅
  "HANDLE_POSTMARK_WEBHOOK",
  "HANDLE_SENDGRID_WEBHOOK",
  "TEST_WEBHOOK",

  // Week 4: LeadCapture Module (1 action) ✅
  "CREATE_CAPTURE_FORM",
]);

function countTotalActions() {
  return Object.values(ALL_ACTIONS).reduce(
    (sum, actions) => sum + actions.length,
    0,
  );
}

function generateProgressReport() {
  const totalActions = countTotalActions();
  const implementedCount = IMPLEMENTED_ACTIONS.size;
  const remainingCount = totalActions - implementedCount;
  const completionPercentage = (
    (implementedCount / totalActions) *
    100
  ).toFixed(1);

  let report = `# Chatbot Expansion Progress\n\n`;
  report += `**Generated**: ${new Date().toLocaleString()}\n\n`;

  report += `## Summary\n\n`;
  report += `- **Total Actions Discovered**: ${totalActions}\n`;
  report += `- **Currently Implemented**: ${implementedCount}\n`;
  report += `- **Remaining to Implement**: ${remainingCount}\n`;
  report += `- **Completion**: ${completionPercentage}%\n\n`;

  report += `## Progress by Module\n\n`;
  report += `| Module | Total | Implemented | Remaining | Progress |\n`;
  report += `|--------|-------|-------------|-----------|----------|\n`;

  Object.entries(ALL_ACTIONS).forEach(([module, actions]) => {
    const implementedInModule = actions.filter((action) =>
      IMPLEMENTED_ACTIONS.has(action),
    ).length;
    const remainingInModule = actions.length - implementedInModule;
    const moduleProgress = (
      (implementedInModule / actions.length) *
      100
    ).toFixed(0);

    report += `| ${module} | ${actions.length} | ${implementedInModule} | ${remainingInModule} | ${moduleProgress}% |\n`;
  });

  report += `\n## Implemented Actions (${implementedCount})\n\n`;
  report +=
    IMPLEMENTED_ACTIONS.size > 0
      ? Array.from(IMPLEMENTED_ACTIONS)
          .sort()
          .map((action) => `- ✅ ${action}`)
          .join("\n")
      : "None yet";

  report += `\n\n## Remaining Actions (${remainingCount})\n\n`;

  Object.entries(ALL_ACTIONS).forEach(([module, actions]) => {
    const remainingInModule = actions.filter(
      (action) => !IMPLEMENTED_ACTIONS.has(action),
    );

    if (remainingInModule.length > 0) {
      report += `\n### ${module} (${remainingInModule.length} remaining)\n\n`;
      remainingInModule.forEach((action) => {
        report += `- ❌ ${action}\n`;
      });
    }
  });

  report += `\n## Next Steps\n\n`;
  report += `1. Pick a module with high value (Activity, Assignment, Task)\n`;
  report += `2. Use code generator: \`node scripts/generate-action-code.js <ACTION> <MODULE>\`\n`;
  report += `3. Add to chatbotService.js and chatbotFallback.js\n`;
  report += `4. Update system prompt\n`;
  report += `5. Test thoroughly\n`;
  report += `6. Mark as implemented in this tracker\n`;
  report += `7. Update this progress report\n`;

  report += `\n## Example Workflow\n\n`;
  report += `\`\`\`bash\n`;
  report += `# 1. Generate code for action\n`;
  report += `node scripts/generate-action-code.js GET_ACTIVITIES activity\n\n`;
  report += `# 2. Copy generated code to chatbotService.js\n\n`;
  report += `# 3. Copy generated code to chatbotFallback.js\n\n`;
  report += `# 4. Update system prompt\n\n`;
  report += `# 5. Test via chat UI\n\n`;
  report += `# 6. If working, add to IMPLEMENTED_ACTIONS in this script\n`;
  report += `# IMPLEMENTED_ACTIONS.add('GET_ACTIVITIES')\n\n`;
  report += `# 7. Run this tracker\n`;
  report += `node scripts/track-progress.js\n`;
  report += `\`\`\`\n`;

  return report;
}

function main() {
  console.log("📊 Generating progress report...\n");

  const report = generateProgressReport();

  // Ensure output directory exists
  const outputDir = path.dirname(OUTPUT_PATH);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, report);

  console.log(`✅ Progress report saved to: ${OUTPUT_PATH}\n`);

  // Print summary to console
  const totalActions = countTotalActions();
  const implementedCount = IMPLEMENTED_ACTIONS.size;
  const remainingCount = totalActions - implementedCount;
  const completionPercentage = (
    (implementedCount / totalActions) *
    100
  ).toFixed(1);

  console.log(`📈 Progress Summary:`);
  console.log(`   Total Actions: ${totalActions}`);
  console.log(`   Implemented: ${implementedCount}`);
  console.log(`   Remaining: ${remainingCount}`);
  console.log(`   Completion: ${completionPercentage}%`);
  console.log(`\n🎯 Next action: Pick a module and start implementing!`);
}

main();
