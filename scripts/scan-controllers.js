#!/usr/bin/env node
/**
 * Automated Controller Scanner
 * Scans all controllers and generates chatbot action scaffolding
 *
 * Usage: node scripts/scan-controllers.js
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONTROLLERS_DIR = path.join(
  __dirname,
  "..",
  "backend",
  "src",
  "controllers",
);
const OUTPUT_DIR = path.join(__dirname, "..", "chatbot-expansion");

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// Read controller files
function scanControllers() {
  const controllerFiles = fs
    .readdirSync(CONTROLLERS_DIR)
    .filter((file) => file.endsWith("Controller.js"));

  const results = [];

  for (const file of controllerFiles) {
    const controllerName = file.replace("Controller.js", "");
    const filePath = path.join(CONTROLLERS_DIR, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Extract method names (public methods only)
    const methodRegex =
      /^(?:async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(?:async\s*)?\(/gm;
    let match;
    const methods = [];

    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      // Filter out private methods and common non-business methods
      if (
        !methodName.startsWith("_") &&
        !methodName.includes("Validation") &&
        !methodName.includes("middleware") &&
        !methodName.includes("handler")
      ) {
        methods.push({
          name: methodName,
          camelCase: toCamelCase(methodName),
          actionName: toActionName(methodName),
        });
      }
    }

    if (methods.length > 0) {
      results.push({
        controllerName,
        fileName: file,
        methods,
      });
    }
  }

  return results;
}

// Convert to camelCase
function toCamelCase(str) {
  return str.replace(/(^[a-z]|_[a-z])/g, (match) =>
    match.replace("_", "").toUpperCase(),
  );
}

// Convert to action name (e.g., getLeads -> GET_LEADS)
function toActionName(methodName) {
  const camel = toCamelCase(methodName);
  return camel
    .replace(/^[a-z]/, (c) => c.toUpperCase())
    .replace(/[A-Z]/g, (c) => "_" + c)
    .toUpperCase();
}

// Generate service methods
function generateServiceMethods(controllerInfo) {
  let output = `// Service Methods for ${controllerInfo.controllerName}\n`;

  controllerInfo.methods.forEach((method) => {
    output += `
async ${method.camelCase}(parameters, currentUser) {
  // TODO: Implement ${method.name}
  // Validation
  if (!parameters) {
    throw new ApiError('Parameters required', 400);
  }

  // Business logic
  const result = await require('../controllers/${controllerInfo.controllerName}Controller').${method.name}(parameters);

  return { result, action: '${method.name}' };
}
`;
  });

  return output;
}

// Generate fallback handlers
function generateFallbackHandlers(controllerInfo) {
  let output = `// Fallback Handlers for ${controllerInfo.controllerName}\n`;

  controllerInfo.methods.forEach((method) => {
    const keywords = extractKeywords(method.name);
    output += `
handle${method.camelCase}(message, originalMessage) {
  // Pattern matching for ${method.name}
  const parameters = {};

  // Extract parameters from message
  // TODO: Add parameter extraction logic

  return {
    action: '${method.actionName}',
    intent: '${method.name.replace(/([A-Z])/g, " $1").trim()}',
    parameters,
    response: 'I will ${method.name.replace(/([A-Z])/g, " $1").toLowerCase()}.',
    needsConfirmation: true,
    missingFields: []
  };
}
`;
  });

  return output;
}

// Extract keywords from method name
function extractKeywords(methodName) {
  const words = methodName
    .replace(/([A-Z])/g, " $1")
    .trim()
    .toLowerCase();
  return words.split(" ");
}

// Generate pattern matchers
function generatePatternMatchers(controllerInfo) {
  let output = `// Pattern Matchers for ${controllerInfo.controllerName}\n\n`;

  controllerInfo.methods.forEach((method) => {
    const keywords = extractKeywords(method.name);
    output += `if (this.matchesPattern(message, ${JSON.stringify(keywords)})) {
  return this.handle${method.camelCase}(message, originalMessage);
}\n\n`;
  });

  return output;
}

// Generate markdown documentation
function generateMarkdownDocs(controllerInfo) {
  let output = `# ${controllerInfo.controllerName} Actions\n\n`;
  output += `| Action | Intent | Confirmation | Example |\n`;
  output += `|--------|--------|--------------|---------|\n`;

  controllerInfo.methods.forEach((method) => {
    const example = generateExample(method);
    output += `| ${method.actionName} | ${method.name.replace(/([A-Z])/g, " $1").trim()} | ${method.name.match(/create|update|delete/i) ? "Yes" : "No"} | "${example}" |\n`;
  });

  return output;
}

// Generate example query
function generateExample(method) {
  const examples = {
    getLeads: "Show me all leads",
    createLead: "Create a new lead",
    updateLead: "Update lead status",
    deleteLead: "Delete lead",
    getUsers: "Show all users",
    createUser: "Create a new user",
    updateUser: "Update user",
    deleteUser: "Delete user",
    getContacts: "Show all contacts",
    createContact: "Create a contact",
    updateContact: "Update contact",
    deleteContact: "Delete contact",
  };

  return (
    examples[method.name] ||
    `Perform ${method.name.replace(/([A-Z])/g, " $1").toLowerCase()}`
  );
}

// Main execution
function main() {
  console.log("🔍 Scanning controllers...\n");

  const controllers = scanControllers();

  console.log(`Found ${controllers.length} controllers with methods:\n`);

  controllers.forEach((controller) => {
    console.log(`📁 ${controller.controllerName}`);
    controller.methods.forEach((method) => {
      console.log(`   └── ${method.name} → ${method.actionName}`);
    });
  });

  // Generate files
  console.log("\n📝 Generating scaffolding...\n");

  controllers.forEach((controller) => {
    const baseName = controller.controllerName;

    // Generate service methods
    const serviceContent = generateServiceMethods(controller);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}-service-methods.js`),
      serviceContent,
    );
    console.log(`✅ Generated: ${baseName}-service-methods.js`);

    // Generate fallback handlers
    const fallbackContent = generateFallbackHandlers(controller);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}-fallback-handlers.js`),
      fallbackContent,
    );
    console.log(`✅ Generated: ${baseName}-fallback-handlers.js`);

    // Generate pattern matchers
    const patternContent = generatePatternMatchers(controller);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}-pattern-matchers.js`),
      patternContent,
    );
    console.log(`✅ Generated: ${baseName}-pattern-matchers.js`);

    // Generate markdown docs
    const docContent = generateMarkdownDocs(controller);
    fs.writeFileSync(
      path.join(OUTPUT_DIR, `${baseName}-actions.md`),
      docContent,
    );
    console.log(`✅ Generated: ${baseName}-actions.md`);
  });

  // Generate summary
  const totalMethods = controllers.reduce(
    (sum, c) => sum + c.methods.length,
    0,
  );
  const summary = `# Chatbot Expansion Summary

Total Controllers: ${controllers.length}
Total Methods: ${totalMethods}
Average Methods per Controller: ${(totalMethods / controllers.length).toFixed(1)}

## Controllers
${controllers.map((c) => `- ${c.controllerName}: ${c.methods.length} methods`).join("\n")}

## Next Steps
1. Review generated files in ${OUTPUT_DIR}
2. Copy methods to chatbotService.js
3. Add patterns to chatbotFallback.js
4. Update system prompt
5. Test thoroughly

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "SUMMARY.md"), summary);
  console.log(`\n✅ Generated: SUMMARY.md`);
  console.log(`\n📂 All files saved to: ${OUTPUT_DIR}`);
  console.log(`\n🎯 Total Actions Found: ${totalMethods}`);
  console.log(`\n🚀 Ready to expand chatbot coverage!`);
}

// Run
main();
