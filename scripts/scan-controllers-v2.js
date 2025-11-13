#!/usr/bin/env node
/**
 * Automated Controller Scanner v2
 * Scans all controllers and generates chatbot action scaffolding
 *
 * Usage: node scripts/scan-controllers-v2.js
 */

const fs = require("fs");
const path = require("path");

// Configuration
const CONTROLLERS_DIR = path.join(__dirname, "..", "backend", "src", "controllers");
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

    // Extract method names from class-based controllers
    // Match: async methodName(req, res, next) {
    const methodRegex = /(?:^|\n)\s*(?:async\s+)?([a-zA-Z_][a-zA-Z0-9_]*)\s*\([^)]*\)\s*\{/gm;
    let match;
    const methods = [];

    while ((match = methodRegex.exec(content)) !== null) {
      const methodName = match[1];
      // Filter out private methods and common non-business methods
      if (
        !methodName.startsWith("_") &&
        !methodName.includes("Validation") &&
        !methodName.includes("middleware") &&
        !methodName.includes("handler") &&
        !methodName.includes("constructor") &&
        methodName.length > 2
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

  // Generate summary
  const totalMethods = controllers.reduce((sum, c) => sum + c.methods.length, 0);
  const summary = `# Chatbot Expansion Summary

Total Controllers: ${controllers.length}
Total Methods: ${totalMethods}
Average Methods per Controller: ${(totalMethods / controllers.length).toFixed(1)}

## Controllers
${controllers.map((c) => `- ${c.controllerName}: ${c.methods.length} methods`).join("\n")}

## All Actions (${totalMethods} total)
${controllers
  .map((c) =>
    c.methods
      .map((m) => `- **${m.actionName}** (${c.controllerName}.${m.name})`)
      .join("\n"),
  )
  .join("\n\n")}

## Next Steps
1. Review this list
2. Prioritize actions by module
3. Add to chatbotService.js and chatbotFallback.js
4. Update system prompt
5. Test thoroughly

Generated: ${new Date().toISOString()}
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "ALL_ACTIONS.md"), summary);
  console.log(`\n✅ Generated: ALL_ACTIONS.md`);
  console.log(`\n📂 All files saved to: ${OUTPUT_DIR}`);
  console.log(`\n🎯 Total Actions Found: ${totalMethods}`);
  console.log(`\n🚀 Ready to expand chatbot coverage!`);
}

// Run
main();
