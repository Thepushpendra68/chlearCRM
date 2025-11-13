#!/usr/bin/env node
/**
 * Generate action code for chatbot
 * Usage: node scripts/generate-action-code.js <actionName> <moduleName>
 * Example: node scripts/generate-action-code.js getActivities activity
 */

const fs = require("fs");
const path = require("path");

const actionName = process.argv[2];
const moduleName = process.argv[3];

if (!actionName || !moduleName) {
  console.error("Usage: node scripts/generate-action-code.js <actionName> <moduleName>");
  console.error("Example: node scripts/generate-action-code.js getActivities activity");
  process.exit(1);
}

// Convert action name to camelCase (e.g., GET_ACTIVITIES → getActivities)
const camelCaseName = actionName
  .toLowerCase()
  .replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());

// Convert action name to method name (e.g., GET_ACTIVITIES → getActivities)
const methodName = camelCaseName.charAt(0).toLowerCase() + camelCaseName.slice(1);

console.log(`\n🔧 Generating code for: ${actionName} (${moduleName})\n`);

// Generate service method
const serviceCode = `// ${actionName} - Service Method
// Add to chatbotService.js executeAction() switch:
case '${actionName}':
  return await this.${methodName}(parameters, currentUser);

// Add new method at end of class:
async ${methodName}(parameters, currentUser) {
  // Validation
  if (!parameters && this.requiresParameters('${actionName}')) {
    throw new ApiError('Parameters required', 400);
  }

  // Call controller/service
  const controller = require('../controllers/${moduleName}Controller');

  // Convert parameters to req object if needed
  const req = { query: parameters, user: currentUser };
  const res = { json: (data) => data };
  const next = (error) => { throw error; };

  try {
    const result = await controller.${methodName}(req, res, next);
    return { result, action: '${methodName}' };
  } catch (error) {
    console.error('${actionName} error:', error);
    throw error;
  }
}
`;

// Generate fallback handler
const fallbackCode = `// ${actionName} - Fallback Handler
// Add to chatbotFallback.js parseMessage() method:
if (this.matchesPattern(message, ${JSON.stringify(generateKeywords(methodName))})) {
  return this.handle${camelCaseName}(message, originalMessage);
}

// Add handler method:
handle${camelCaseName}(message, originalMessage) {
  const parameters = {};

  // Extract parameters from message
  ${generateParameterExtraction(actionName, methodName)}

  // Validate required fields
  const missingFields = [];
  ${generateValidation(actionName, methodName)}

  return {
    action: '${actionName}',
    intent: '${generateIntent(methodName)}',
    parameters,
    response: '${generateResponse(methodName)}',
    needsConfirmation: ${generateNeedsConfirmation(actionName)},
    missingFields
  };
}
`;

// Generate test cases
const testCode = `// ${actionName} - Test Cases
// Add to CHATBOT_QUICK_REFERENCE.md:

### ${actionName}
- **Purpose**: ${generatePurpose(actionName, methodName)}
- **Confirmation**: ${generateNeedsConfirmation(actionName) ? 'Yes' : 'No'}
- **Module**: ${moduleName}
- **Controller**: ${moduleName}Controller.${methodName}

**Example Queries**:
${generateExamples(methodName)}

**Expected Response**:
{
  "action": "${actionName}",
  "intent": "${generateIntent(methodName)}",
  "parameters": { /* extracted parameters */ },
  "response": "${generateResponse(methodName)}",
  "needsConfirmation": ${generateNeedsConfirmation(actionName)}
}
`;

console.log("📝 SERVICE CODE (add to chatbotService.js):\n");
console.log(serviceCode);

console.log("\n📝 FALLBACK CODE (add to chatbotFallback.js):\n");
console.log(fallbackCode);

console.log("\n📝 TEST CASES (add to documentation):\n");
console.log(testCode);

// Helper functions
function generateKeywords(methodName) {
  const baseKeywords = methodName
    .replace(/([A-Z])/g, ' $1')
    .toLowerCase()
    .split(' ');

  // Add common synonyms
  const synonyms = {
    get: ['show', 'list', 'display', 'get'],
    create: ['create', 'add', 'new'],
    update: ['update', 'change', 'modify', 'edit'],
    delete: ['delete', 'remove', 'drop'],
    assign: ['assign', 'give', 'allocate'],
    send: ['send', 'email', 'mail'],
    getActivities: ['activity', 'activities', 'timeline', 'history'],
    getTasks: ['task', 'tasks', 'todo', 'to-do'],
    getLeads: ['lead', 'leads', 'prospects'],
    getUsers: ['user', 'users', 'team', 'members']
  };

  return [...(synonyms[methodName] || baseKeywords), ...baseKeywords];
}

function generateParameterExtraction(actionName, methodName) {
  const extractors = {
    getActivities: `parameters.user_id = currentUser.id;
  parameters.lead_id = this.extractLeadId(message);
  parameters.activity_type = this.extractActivityType(message);
  parameters.date_from = this.extractDateFrom(message);
  parameters.date_to = this.extractDateTo(message);`,

    createActivity: `const email = this.extractEmail(message);
  const leadId = this.extractLeadId(message);
  const activityType = this.extractActivityType(message);
  const description = this.extractDescription(message);

  parameters.email = email;
  parameters.lead_id = leadId;
  parameters.activity_type = activityType;
  parameters.description = description;`,

    getTasks: `parameters.assigned_to = currentUser.id;
  parameters.status = this.extractStatus(message);
  parameters.priority = this.extractPriority(message);
  parameters.overdue = message.includes('overdue');`,

    createTask: `const description = this.extractTaskDescription(message);
  const dueDate = this.extractDueDate(message);
  const priority = this.extractPriority(message);

  parameters.description = description;
  parameters.due_date = dueDate;
  parameters.priority = priority || 'medium';`,

    default: `// TODO: Add parameter extraction logic
  // Extract relevant entities from message
  parameters.search = this.extractSearchQuery(message);`
  };

  return extractors[methodName] || extractors.default;
}

function generateValidation(actionName, methodName) {
  if (actionName.startsWith('CREATE_') ||
      actionName.startsWith('UPDATE_') ||
      actionName.startsWith('DELETE_') ||
      actionName.startsWith('ASSIGN_')) {
    return `if (missingFields.length > 0) {
  // Will ask for confirmation with missing fields
}`;
  }
  return `// No required parameters for viewing actions`;
}

function generateIntent(methodName) {
  const intents = {
    getActivities: 'List user activities',
    createActivity: 'Create activity log',
    getTasks: 'List tasks',
    createTask: 'Create task',
    assignLead: 'Assign lead to user',
    getStats: 'Show statistics'
  };

  return intents[methodName] || methodName.replace(/([A-Z])/g, ' $1').toLowerCase();
}

function generateResponse(methodName) {
  const responses = {
    getActivities: "Here are your recent activities:",
    createActivity: "I'll create that activity for you.",
    getTasks: "Here are your tasks:",
    createTask: "I'll create that task.",
    assignLead: "I'll assign that lead.",
    getStats: "Here are your statistics:"
  };

  return responses[methodName] || `I'll ${methodName.replace(/([A-Z])/g, ' $1').toLowerCase()}.`;
}

function generateNeedsConfirmation(actionName) {
  const destructiveActions = [
    'CREATE_', 'UPDATE_', 'DELETE_', 'ASSIGN_',
    'BULK_', 'REDISTRIBUTE_', 'SEND_'
  ];

  return destructiveActions.some(prefix => actionName.startsWith(prefix)) ? 'true' : 'false';
}

function generatePurpose(actionName, methodName) {
  const purposes = {
    'GET_ACTIVITIES': 'List and filter user activities',
    'CREATE_ACTIVITY': 'Log a call, email, or meeting',
    'GET_TASKS': 'List tasks with filters',
    'CREATE_TASK': 'Create a new task',
    'ASSIGN_LEAD': 'Assign lead to team member',
    'GET_STATS': 'Show statistics and metrics'
  };

  return purposes[actionName] || `Execute ${methodName} operation`;
}

function generateExamples(methodName) {
  const examples = {
    getActivities: `- "Show my activities"
- "List my activities from last week"
- "Show team timeline"`,

    createActivity: `- "Log a call with John Doe"
- "Add meeting with Sarah about project"
- "Record email to customer"`,

    getTasks: `- "Show my tasks"
- "List overdue tasks"
- "Show tasks by priority"`,

    createTask: `- "Create task to follow up with John"
- "Add task for tomorrow"
- "Schedule call with client"`,

    assignLead: `- "Assign lead to Sarah"
- "Give this lead to John"
- "Allocate to senior rep"`,

    getStats: `- "Show activity stats"
- "Display lead statistics"
- "Team performance metrics"`
  };

  return examples[methodName] || `- "${methodName.replace(/([A-Z])/g, ' $1').toLowerCase()}"`;
}
