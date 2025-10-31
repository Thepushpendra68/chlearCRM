/**
 * Email System Integration Test
 * Tests that all email modules load correctly
 */

require('dotenv').config();

console.log('🧪 Testing Email Automation System...\n');

let hasErrors = false;

// Test 1: Check environment variables
console.log('1️⃣ Checking environment variables...');
const requiredVars = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
const missingVars = requiredVars.filter(v => !process.env[v]);

if (missingVars.length > 0) {
  console.log(`   ⚠️  Missing: ${missingVars.join(', ')}`);
  console.log('   ℹ️  Email system will work once configured\n');
} else {
  console.log('   ✅ All required variables present\n');
}

// Test 2: Load services
console.log('2️⃣ Loading email services...');
try {
  const emailTemplateService = require('./src/services/emailTemplateService');
  console.log('   ✅ emailTemplateService loaded');
  
  const emailSendService = require('./src/services/emailSendService');
  console.log('   ✅ emailSendService loaded');
  
  const automationService = require('./src/services/automationService');
  console.log('   ✅ automationService loaded\n');
} catch (error) {
  console.log(`   ❌ Error loading services: ${error.message}\n`);
  hasErrors = true;
}

// Test 3: Load controllers
console.log('3️⃣ Loading email controllers...');
try {
  const emailTemplateController = require('./src/controllers/emailTemplateController');
  console.log('   ✅ emailTemplateController loaded');
  
  const emailSendController = require('./src/controllers/emailSendController');
  console.log('   ✅ emailSendController loaded');
  
  const automationController = require('./src/controllers/automationController');
  console.log('   ✅ automationController loaded');
  
  const emailWebhookController = require('./src/controllers/emailWebhookController');
  console.log('   ✅ emailWebhookController loaded\n');
} catch (error) {
  console.log(`   ❌ Error loading controllers: ${error.message}\n`);
  hasErrors = true;
}

// Test 4: Load routes
console.log('4️⃣ Loading email routes...');
try {
  const emailRoutes = require('./src/routes/emailRoutes');
  console.log('   ✅ emailRoutes loaded\n');
} catch (error) {
  console.log(`   ❌ Error loading routes: ${error.message}\n`);
  hasErrors = true;
}

// Test 5: Load worker
console.log('5️⃣ Loading email worker...');
try {
  const emailWorker = require('./src/workers/emailSequenceWorker');
  console.log('   ✅ emailSequenceWorker loaded');
  console.log('   ℹ️  Worker will auto-start in production\n');
} catch (error) {
  console.log(`   ❌ Error loading worker: ${error.message}\n`);
  hasErrors = true;
}

// Test 6: Check dependencies
console.log('6️⃣ Checking email dependencies...');
const dependencies = [
  'mjml',
  'handlebars',
  'postmark',
  'juice',
  'validator',
  'date-fns',
  'node-cron',
  'sanitize-html'
];

let missingDeps = [];
for (const dep of dependencies) {
  try {
    require.resolve(dep);
    console.log(`   ✅ ${dep}`);
  } catch {
    console.log(`   ❌ ${dep} - MISSING`);
    missingDeps.push(dep);
    hasErrors = true;
  }
}

if (missingDeps.length > 0) {
  console.log(`\n   ⚠️  Run: npm install ${missingDeps.join(' ')}`);
}

// Test 7: Test MJML compilation
console.log('\n7️⃣ Testing MJML compilation...');
try {
  const mjml2html = require('mjml');
  const testMjml = '<mjml><mj-body><mj-section><mj-column><mj-text>Test</mj-text></mj-column></mj-section></mj-body></mjml>';
  const result = mjml2html(testMjml);
  if (result.html) {
    console.log('   ✅ MJML compilation works\n');
  } else {
    console.log('   ⚠️  MJML compiled but no HTML output\n');
  }
} catch (error) {
  console.log(`   ❌ MJML compilation failed: ${error.message}\n`);
  hasErrors = true;
}

// Test 8: Test Handlebars
console.log('8️⃣ Testing Handlebars...');
try {
  const Handlebars = require('handlebars');
  const template = Handlebars.compile('Hello {{name}}!');
  const result = template({ name: 'World' });
  if (result === 'Hello World!') {
    console.log('   ✅ Handlebars template rendering works\n');
  } else {
    console.log('   ⚠️  Handlebars output unexpected\n');
  }
} catch (error) {
  console.log(`   ❌ Handlebars test failed: ${error.message}\n`);
  hasErrors = true;
}

// Summary
console.log('═'.repeat(50));
if (hasErrors) {
  console.log('❌ SOME TESTS FAILED');
  console.log('   Fix the errors above and run this test again.\n');
  process.exit(1);
} else {
  console.log('✅ ALL TESTS PASSED!');
  console.log('\n📋 Next Steps:');
  console.log('   1. Run database migration in Supabase SQL Editor');
  console.log('   2. Add POSTMARK_API_KEY to .env');
  console.log('   3. Start backend: npm run dev');
  console.log('   4. Backend will be ready at http://localhost:5000\n');
  process.exit(0);
}

