#!/usr/bin/env node
/**
 * Comprehensive Account Module Test
 * This tests the entire account module setup
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

console.log('🧪 ACCOUNT MODULE COMPREHENSIVE TEST\n');
console.log('═'.repeat(60));

let allTestsPassed = true;
const results = [];

// Helper to log results
function test(name, passed, details = '') {
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${name}: ${status}`);
  if (details) console.log(`   ${details}`);
  results.push({ name, passed, details });
  if (!passed) allTestsPassed = false;
}

// Test 1: Check all required files exist
console.log('\n📁 TEST 1: Checking Required Files');
console.log('-'.repeat(60));

const requiredFiles = [
  'backend/src/routes/accountRoutes.js',
  'backend/src/controllers/accountController.js',
  'backend/src/services/accountService.js',
  'backend/src/validators/accountValidators.js',
  'frontend/src/services/accountService.js',
  'frontend/src/pages/Accounts.jsx',
  'frontend/src/pages/AccountDetail.jsx',
  'frontend/src/components/AccountForm.jsx',
  'migrations/20250101_create_accounts_table.sql',
  'migrations/20250102_add_account_id_to_leads.sql',
  'migrations/20250103_add_account_id_to_activities.sql',
  'migrations/20250104_add_account_id_to_tasks.sql'
];

requiredFiles.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  test(file, exists);
});

// Test 2: Check backend/src/app.js has account routes
console.log('\n📦 TEST 2: Backend Route Registration (backend/src/app.js)');
console.log('-'.repeat(60));

try {
  const appJs = fs.readFileSync(path.join(__dirname, 'backend/src/app.js'), 'utf8');
  
  const hasImport = appJs.includes("require('./routes/accountRoutes')");
  test('Account routes imported', hasImport);
  
  const hasRegistration = appJs.includes("app.use('/api/accounts', accountRoutes)");
  test('Route registered as /api/accounts', hasRegistration);
  
  // Check if registration is BEFORE 404 handler
  const lines = appJs.split('\n');
  const registrationLine = lines.findIndex(line => line.includes("app.use('/api/accounts'"));
  const notFoundLine = lines.findIndex(line => line.includes('404 handler'));
  
  if (registrationLine > 0 && notFoundLine > 0) {
    const beforeHandler = registrationLine < notFoundLine;
    test('Route registered BEFORE 404 handler', beforeHandler, 
      `Line ${registrationLine + 1} vs 404 handler at line ${notFoundLine + 1}`);
  }
} catch (e) {
  test('Read backend/src/app.js', false, e.message);
}

// Test 3: Check api/index.js has account routes (Vercel)
console.log('\n🔷 TEST 3: Vercel Route Registration (api/index.js)');
console.log('-'.repeat(60));

try {
  const apiIndexJs = fs.readFileSync(path.join(__dirname, 'api/index.js'), 'utf8');
  
  const hasImport = apiIndexJs.includes("require('../backend/src/routes/accountRoutes')");
  test('Account routes imported in api/index.js', hasImport);
  
  const hasRegistration = apiIndexJs.includes("app.use('/api/accounts', accountRoutes)");
  test('Route registered in api/index.js', hasRegistration);
  
  // Check position relative to other routes
  const lines = apiIndexJs.split('\n');
  const registrationLine = lines.findIndex(line => line.includes("app.use('/api/accounts'"));
  const catchBlockLine = lines.findIndex(line => line.includes('} catch (error)'));
  
  if (registrationLine > 0 && catchBlockLine > 0) {
    const insideTryBlock = registrationLine < catchBlockLine;
    test('Route inside try block', insideTryBlock, 
      `Line ${registrationLine + 1} vs catch at line ${catchBlockLine + 1}`);
  }
} catch (e) {
  test('Read api/index.js', false, e.message);
}

// Test 4: Check route file structure
console.log('\n🛣️  TEST 4: Route File Structure');
console.log('-'.repeat(60));

try {
  const routeFile = fs.readFileSync(path.join(__dirname, 'backend/src/routes/accountRoutes.js'), 'utf8');
  
  // Check route ordering (specific before generic)
  const routes = [
    { name: 'GET /', pattern: /router\.get\('\/', getAccounts\)/ },
    { name: 'GET /:id/leads', pattern: /router\.get\('\/:id\/leads', getAccountLeads\)/ },
    { name: 'GET /:id/stats', pattern: /router\.get\('\/:id\/stats', getAccountStats\)/ },
    { name: 'GET /:id', pattern: /router\.get\('\/:id', getAccountById\)/ },
    { name: 'POST /', pattern: /router\.post\('\/', .*validateAccount.*createAccount\)/ },
    { name: 'PUT /:id', pattern: /router\.put\('\/:id', .*validateAccount.*updateAccount\)/ },
    { name: 'DELETE /:id', pattern: /router\.delete\('\/:id', deleteAccount\)/ }
  ];
  
  const lines = routeFile.split('\n');
  let lastLine = 0;
  let orderCorrect = true;
  
  routes.forEach((route, index) => {
    const lineIndex = lines.findIndex((line, idx) => idx > lastLine && route.pattern.test(line));
    const found = lineIndex >= 0;
    test(`Route ${route.name} registered`, found);
    
    if (found) {
      // Check specific routes come before generic /:id
      if (route.name === 'GET /:id/leads' || route.name === 'GET /:id/stats') {
        const genericIdLine = lines.findIndex((line, idx) => 
          idx > lastLine && /router\.get\('\/:id', getAccountById\)/.test(line)
        );
        if (genericIdLine >= 0 && lineIndex > genericIdLine) {
          orderCorrect = false;
        }
      }
      lastLine = lineIndex;
    }
  });
  
  test('Route ordering correct (specific before generic)', orderCorrect);
  
  // Check module exports
  const hasExport = routeFile.includes('module.exports = router');
  test('Router exported', hasExport);
  
} catch (e) {
  test('Check route file', false, e.message);
}

// Test 5: Check controller exports
console.log('\n🎮 TEST 5: Controller Exports');
console.log('-'.repeat(60));

try {
  const controllerFile = fs.readFileSync(path.join(__dirname, 'backend/src/controllers/accountController.js'), 'utf8');
  
  const requiredExports = [
    'getAccounts',
    'getAccountById',
    'createAccount',
    'updateAccount',
    'deleteAccount',
    'getAccountLeads',
    'getAccountStats'
  ];
  
  requiredExports.forEach(exportName => {
    const hasExport = controllerFile.includes(`${exportName}`);
    test(`Controller exports ${exportName}`, hasExport);
  });
  
  const hasModuleExports = controllerFile.includes('module.exports = {');
  test('Controller has module.exports', hasModuleExports);
  
} catch (e) {
  test('Check controller file', false, e.message);
}

// Test 6: Frontend integration
console.log('\n🎨 TEST 6: Frontend Integration');
console.log('-'.repeat(60));

try {
  const appJsx = fs.readFileSync(path.join(__dirname, 'frontend/src/App.jsx'), 'utf8');
  
  const hasAccountsImport = appJsx.includes("import('./pages/Accounts')");
  test('Accounts page imported', hasAccountsImport);
  
  const hasAccountDetailImport = appJsx.includes("import('./pages/AccountDetail')");
  test('AccountDetail page imported', hasAccountDetailImport);
  
  const hasAccountsRoute = appJsx.includes('path="accounts"');
  test('Accounts route registered', hasAccountsRoute);
  
  const hasAccountDetailRoute = appJsx.includes('path="accounts/:id"');
  test('Account detail route registered', hasAccountDetailRoute);
  
} catch (e) {
  test('Check frontend App.jsx', false, e.message);
}

try {
  const sidebar = fs.readFileSync(path.join(__dirname, 'frontend/src/components/Layout/Sidebar.jsx'), 'utf8');
  
  const hasBuildingIcon = sidebar.includes('BuildingOfficeIcon');
  test('BuildingOfficeIcon imported', hasBuildingIcon);
  
  const hasAccountsNav = sidebar.includes("name: 'Accounts'") || sidebar.includes('Accounts');
  test('Accounts in sidebar navigation', hasAccountsNav);
  
} catch (e) {
  test('Check Sidebar.jsx', false, e.message);
}

// Test 7: Check if server is running
console.log('\n🌐 TEST 7: Server Status');
console.log('-'.repeat(60));

function testServer() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        test('Server is running', res.statusCode === 200);
        resolve(res.statusCode === 200);
      });
    });
    
    req.on('error', () => {
      test('Server is running', false, 'Not running on port 5000');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      test('Server is running', false, 'Timeout');
      resolve(false);
    });
  });
}

// Test 8: Test accounts endpoint
async function testAccountsEndpoint() {
  console.log('\n🔍 TEST 8: Accounts Endpoint');
  console.log('-'.repeat(60));
  
  return new Promise((resolve) => {
    const req = http.get('http://localhost:5000/api/accounts', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 404) {
          test('GET /api/accounts', false, 
            '404 Not Found - SERVER NOT RESTARTED or route not loaded');
          console.log('   ⚠️  SOLUTION: Kill all node processes and restart server');
        } else if (res.statusCode === 401) {
          test('GET /api/accounts', true, 
            '401 Unauthorized - Route exists! (Auth required)');
        } else if (res.statusCode === 200) {
          test('GET /api/accounts', true, 
            '200 OK - Route works!');
        } else {
          test('GET /api/accounts', false, 
            `Unexpected status: ${res.statusCode}`);
        }
        resolve(res.statusCode !== 404);
      });
    });
    
    req.on('error', (err) => {
      test('GET /api/accounts', false, 
        'Server not responding - Make sure server is running');
      console.log('   💡 Run: cd backend && npm run dev');
      resolve(false);
    });
    
    req.setTimeout(2000, () => {
      req.destroy();
      test('GET /api/accounts', false, 'Timeout');
      resolve(false);
    });
  });
}

// Run async tests
(async () => {
  const serverRunning = await testServer();
  
  if (serverRunning) {
    await testAccountsEndpoint();
  } else {
    console.log('\n⚠️  Server not running - skipping endpoint tests');
    console.log('   Start server: cd backend && npm run dev');
  }
  
  // Summary
  console.log('\n' + '═'.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('═'.repeat(60));
  
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const total = results.length;
  
  console.log(`\n✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  
  if (allTestsPassed) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('   Account module is properly set up.');
    console.log('   If you still get 404:');
    console.log('   1. Kill all node processes: taskkill /F /IM node.exe');
    console.log('   2. Restart server: cd backend && npm run dev');
    console.log('   3. Look for logs: ✅ [APP] /api/accounts routes registered');
  } else {
    console.log('\n⚠️  SOME TESTS FAILED');
    console.log('   Review the failures above.');
    
    if (failed === 1 && results.find(r => !r.passed && r.name.includes('GET /api/accounts'))) {
      console.log('\n   📌 Only endpoint test failed = SERVER NEEDS RESTART');
      console.log('   Solution:');
      console.log('   1. taskkill /F /IM node.exe');
      console.log('   2. cd backend && npm run dev');
      console.log('   3. Wait for: ✅ [APP] /api/accounts routes registered');
      console.log('   4. Run this test again: node test-account-module.js');
    }
  }
  
  console.log('\n' + '═'.repeat(60));
  process.exit(allTestsPassed ? 0 : 1);
})();

