const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://qlivxpsvlymxfnamxvhz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2NTU0NSwiZXhwIjoyMDc0NDQxNTQ1fQ.iqqk4KmhYEGr_2YpfnecGF84b94dQi7riOU8OS96zq0';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  try {
    console.log('🚀 Starting Supabase migration...');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'supabase_migration.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📖 Migration SQL loaded successfully');
    console.log(`📝 Migration size: ${migrationSQL.length} characters`);

    // Split the migration into smaller chunks to avoid timeouts
    const sqlStatements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && stmt !== 'BEGIN' && stmt !== 'COMMIT');

    console.log(`🔧 Executing ${sqlStatements.length} SQL statements...`);

    // Execute statements one by one
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];

      try {
        console.log(`\n[${i + 1}/${sqlStatements.length}] Executing statement...`);
        console.log(`Statement preview: ${statement.substring(0, 100)}...`);

        const { data, error } = await supabase.rpc('exec_sql', {
          sql: statement
        });

        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error);
          errorCount++;

          // Continue with non-critical errors
          if (error.message.includes('already exists') || error.message.includes('does not exist')) {
            console.log('ℹ️ Skipping non-critical error...');
            continue;
          }
        } else {
          console.log(`✅ Statement ${i + 1} executed successfully`);
          successCount++;
        }
      } catch (err) {
        console.error(`❌ Exception in statement ${i + 1}:`, err.message);
        errorCount++;
      }

      // Add small delay between statements
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n🎉 Migration completed!');
    console.log(`✅ Successful statements: ${successCount}`);
    console.log(`❌ Failed statements: ${errorCount}`);
    console.log(`📊 Total statements: ${sqlStatements.length}`);

    if (errorCount === 0) {
      console.log('\n🚀 All statements executed successfully! Your Supabase database is ready.');
    } else {
      console.log('\n⚠️ Some statements failed. Please check the errors above.');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
runMigration();