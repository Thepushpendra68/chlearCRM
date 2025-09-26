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

async function testLoggedInUser() {
  try {
    // Test the specific user that's logged in according to frontend logs
    const loggedInUserId = '8cc7c99f-c91f-41e7-a80f-36117d9523e8';
    const loggedInEmail = 'pushpendrachl@gmail.com';

    console.log(`🔍 Testing logged-in user: ${loggedInEmail}`);
    console.log(`🆔 User ID: ${loggedInUserId}`);

    // Test the exact query used by getUserProfile
    console.log('\n📋 Testing getUserProfile query...');
    const { data, error } = await supabase
      .from('user_profiles_with_auth')
      .select('*')
      .eq('id', loggedInUserId)
      .single();

    if (error) {
      console.log('❌ getUserProfile error:', error);
    } else {
      console.log('✅ getUserProfile success:');
      console.log('📧 Email:', data.email);
      console.log('👤 Name:', data.first_name, data.last_name);
      console.log('🏢 Company ID:', data.company_id);
      console.log('🔑 Role:', data.role);
      console.log('✅ Is Active:', data.is_active);
    }

    // Also test with fallback to user_profiles
    console.log('\n🔄 Testing fallback to user_profiles...');
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', loggedInUserId)
      .single();

    if (fallbackError) {
      console.log('❌ Fallback error:', fallbackError);
    } else {
      console.log('✅ Fallback success - User exists in user_profiles');
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

testLoggedInUser();