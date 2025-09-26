const { createClient } = require('@supabase/supabase-js');

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

async function debugUserLookup() {
  try {
    console.log('🔍 Debug: User lookup process...');

    // Get auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) throw authError;

    console.log('👥 Auth users:');
    authUsers.users.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id})`);
    });

    if (authUsers.users.length === 0) {
      console.log('❌ No auth users found!');
      return;
    }

    const testUserId = authUsers.users[0].id;
    console.log(`\n🧪 Testing lookup for user: ${testUserId}`);

    // Test 1: Check user_profiles table directly
    console.log('\n📋 Test 1: Direct user_profiles query...');
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (profileError) {
      console.log('❌ user_profiles query error:', profileError);
    } else {
      console.log('✅ user_profiles found:', profiles);
    }

    // Test 2: Check user_profiles_with_auth view
    console.log('\n👁️ Test 2: user_profiles_with_auth view query...');
    const { data: viewData, error: viewError } = await supabase
      .from('user_profiles_with_auth')
      .select('*')
      .eq('id', testUserId)
      .single();

    if (viewError) {
      console.log('❌ user_profiles_with_auth query error:', viewError);
    } else {
      console.log('✅ user_profiles_with_auth found:', viewData);
    }

    // Test 3: Check if view exists
    console.log('\n🔍 Test 3: Check if view exists...');
    const { data: viewExists, error: viewExistsError } = await supabase
      .from('user_profiles_with_auth')
      .select('count')
      .limit(1);

    if (viewExistsError) {
      console.log('❌ View does not exist or has error:', viewExistsError);

      // Fallback: try to create missing view or use fallback query
      console.log('\n🔧 Fallback: Using direct user_profiles query...');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('user_profiles')
        .select(`
          *,
          companies (
            id,
            name,
            subdomain,
            settings
          )
        `)
        .eq('id', testUserId)
        .single();

      if (fallbackError) {
        console.log('❌ Fallback query error:', fallbackError);
      } else {
        console.log('✅ Fallback query success:', fallbackData);
      }
    } else {
      console.log('✅ View exists and accessible');
    }

  } catch (error) {
    console.error('💥 Debug error:', error);
  }
}

// Run the debug
debugUserLookup();