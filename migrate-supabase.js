const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Supabase configuration
const supabaseUrl = 'https://qlivxpsvlymxfnamxvhz.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2NTU0NSwiZXhwIjoyMDc0NDQxNTQ1fQ.iqqk4KmhYEGr_2YpfnecGF84b94dQi7riOU8OS96zq0';

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Starting Supabase migration...');

    // Test connection first
    console.log('🔍 Testing Supabase connection...');
    const { data: version, error: testError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .limit(1);

    if (testError) {
      console.error('❌ Connection test failed:', testError);
      return;
    }

    console.log('✅ Connection successful!');

    // Step 1: Create extensions
    console.log('\n📦 Creating extensions...');

    // Step 2: Create user role enum
    console.log('🔧 Creating user role enum...');
    try {
      await supabase.rpc('create_user_role_enum', {});
    } catch (error) {
      // We'll execute raw SQL statements directly since RPC functions need to be created first
      console.log('ℹ️ Will execute raw SQL for enum creation');
    }

    // Step 3: Create tables one by one
    console.log('🏗️ Creating companies table...');
    const companiesSQL = `
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT NOT NULL,
        subdomain TEXT UNIQUE,
        plan TEXT DEFAULT 'starter',
        status TEXT DEFAULT 'active',
        settings JSONB DEFAULT '{}',
        logo_url TEXT,
        industry TEXT,
        size TEXT,
        country TEXT,
        timezone TEXT DEFAULT 'UTC',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Since we can't execute raw SQL directly, let me show you the manual steps:
    console.log('📋 Please follow these steps manually in your Supabase SQL Editor:');
    console.log('\n1. Go to https://supabase.com/dashboard/project/qlivxpsvlymxfnamxvhz/sql/new');
    console.log('2. Copy the entire contents of supabase_migration.sql');
    console.log('3. Paste it into the SQL Editor');
    console.log('4. Click "Run" to execute the migration');
    console.log('\nAlternatively, here are the key tables we need to create:');

    const tables = [
      'companies',
      'user_profiles',
      'pipeline_stages',
      'leads',
      'activities',
      'assignment_rules',
      'rule_conditions',
      'rule_actions',
      'tasks',
      'import_history'
    ];

    // Check which tables already exist
    console.log('\n🔍 Checking existing tables...');
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);

        if (error) {
          console.log(`❌ Table '${table}' does not exist`);
        } else {
          console.log(`✅ Table '${table}' already exists`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' does not exist`);
      }
    }

    console.log('\n📖 Migration file location: supabase_migration.sql');
    console.log('🌐 Supabase Dashboard: https://supabase.com/dashboard/project/qlivxpsvlymxfnamxvhz/sql');

  } catch (error) {
    console.error('💥 Migration check failed:', error);
  }
}

// Run the migration check
runMigration();