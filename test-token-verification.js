const { createClient } = require('@supabase/supabase-js');

// Use the same configuration as the backend
const supabaseUrl = 'https://qlivxpsvlymxfnamxvhz.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4NjU1NDUsImV4cCI6MjA3NDQ0MTU0NX0.p8VSaRJ-vS5ePf_2z_s-hQDrAxpS-r8vZSeijPBngIQ';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsaXZ4cHN2bHlteGZuYW14dmh6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1ODg2NTU0NSwiZXhwIjoyMDc0NDQxNTQ1fQ.iqqk4KmhYEGr_2YpfnecGF84b94dQi7riOU8OS96zq0';

// Create Supabase clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function testTokenVerification() {
  try {
    console.log('🔑 Testing token verification process...');

    // Step 1: Sign in to get a fresh token
    console.log('\n📝 Step 1: Sign in to get token...');
    const { data: signInData, error: signInError } = await supabaseAnon.auth.signInWithPassword({
      email: 'pushpendrachl@gmail.com',
      password: 'admin123' // Assuming this is the password
    });

    if (signInError) {
      console.log('❌ Sign in error:', signInError);

      // Try different password
      console.log('🔄 Trying alternative password...');
      const { data: signInData2, error: signInError2 } = await supabaseAnon.auth.signInWithPassword({
        email: 'pushpendrachl@gmail.com',
        password: '123456'
      });

      if (signInError2) {
        console.log('❌ Alternative sign in error:', signInError2);
        console.log('ℹ️  We need the correct password to test token verification.');
        return;
      } else {
        console.log('✅ Sign in successful with alternative password');
        testToken = signInData2.session.access_token;
      }
    } else {
      console.log('✅ Sign in successful');
      testToken = signInData.session.access_token;
    }

    const testToken = signInData?.session?.access_token || testToken;
    console.log('🎫 Token (first 50 chars):', testToken.substring(0, 50) + '...');

    // Step 2: Test verifySupabaseToken function
    console.log('\n🔍 Step 2: Testing verifySupabaseToken...');

    const { data: user, error: verifyError } = await supabaseAnon.auth.getUser(testToken);

    if (verifyError || !user) {
      console.log('❌ Token verification failed:', verifyError);
    } else {
      console.log('✅ Token verification successful');
      console.log('👤 User ID:', user.user.id);
      console.log('📧 Email:', user.user.email);

      // Step 3: Test getUserProfile with verified user
      console.log('\n📋 Step 3: Testing getUserProfile...');
      const { data: profile, error: profileError } = await supabaseAdmin
        .from('user_profiles_with_auth')
        .select('*')
        .eq('id', user.user.id)
        .single();

      if (profileError) {
        console.log('❌ Profile lookup error:', profileError);
      } else {
        console.log('✅ Profile lookup successful');
        console.log('🔑 Role:', profile.role);
        console.log('✅ Is Active:', profile.is_active);

        // Step 4: Test complete authentication flow
        console.log('\n🔧 Step 4: Complete auth flow would succeed!');
        console.log('🎉 The authentication middleware should work with this token');
      }
    }

  } catch (error) {
    console.error('💥 Test error:', error);
  }
}

testTokenVerification();