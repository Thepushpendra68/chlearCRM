console.log('🔍 Verifying Account Module Setup\n');

// Check files exist
const fs = require('fs');
const path = require('path');

const files = [
  'src/routes/accountRoutes.js',
  'src/controllers/accountController.js',
  'src/services/accountService.js',
  'src/validators/accountValidators.js'
];

console.log('📁 Checking files...');
files.forEach(file => {
  const exists = fs.existsSync(path.join(__dirname, file));
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
});

console.log('\n📦 Checking if modules can be loaded (without env vars)...');
console.log('Note: These will fail with Supabase errors, but we just want to see if files load\n');

// We need to check if require works, but Supabase errors are expected
console.log('  Testing accountRoutes...');
try {
  // This will fail due to Supabase, but we'll see if it's a syntax error or Supabase error
  const routes = require('./src/routes/accountRoutes');
  console.log('  ✅ accountRoutes syntax is valid');
} catch (e) {
  if (e.message.includes('Supabase')) {
    console.log('  ✅ accountRoutes file loads (Supabase error is expected)');
  } else {
    console.log('  ❌ accountRoutes has error:', e.message);
  }
}

console.log('\n📋 Checking app.js registration...');
const appContent = fs.readFileSync(path.join(__dirname, 'src/app.js'), 'utf8');
const hasImport = appContent.includes("require('./routes/accountRoutes')");
const hasRegistration = appContent.includes("app.use('/api/accounts', accountRoutes)");

console.log(`  ${hasImport ? '✅' : '❌'} accountRoutes imported`);
console.log(`  ${hasRegistration ? '✅' : '❌'} /api/accounts route registered`);

// Check position of route registration
const lines = appContent.split('\n');
const registrationLine = lines.findIndex(line => line.includes("app.use('/api/accounts'"));
const notFoundLine = lines.findIndex(line => line.includes("404 handler"));

if (registrationLine > 0 && notFoundLine > 0) {
  if (registrationLine < notFoundLine) {
    console.log(`  ✅ Route registered BEFORE 404 handler (line ${registrationLine + 1})`);
  } else {
    console.log(`  ❌ Route registered AFTER 404 handler (line ${registrationLine + 1})`);
  }
}

console.log('\n✅ Setup verification complete');
console.log('\nNext steps:');
console.log('1. Make sure backend server is STOPPED');
console.log('2. Run: cd backend && npm run dev');
console.log('3. Look for these logs:');
console.log('   - 📦 [ACCOUNT ROUTES] Loading account routes module...');
console.log('   - ✅ [ACCOUNT ROUTES] Router created successfully');
console.log('   - ✅ [APP] Account routes loaded successfully');
console.log('   - ✅ [APP] /api/accounts routes registered');
console.log('4. If you see those logs, the route is loaded');
console.log('5. Test with: curl http://localhost:5000/api/accounts');
console.log('   Expected: 401 Unauthorized (good) or 200 OK (good)');
console.log('   Bad: 404 Not Found');

