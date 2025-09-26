const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Use the same setup as frontend
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

async function simulateFrontendLogin() {
  console.log('🧪 SIMULATING FRONTEND LOGIN PROCESS...');

  try {
    // Step 1: Try to sign in (this sets up the session)
    console.log('Step 1: Attempting sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: 'owner.testcompany123@gmail.com',
      password: 'test123' // You might need to adjust this password
    });

    if (signInError) {
      console.log('❌ Sign in failed:', signInError.message);

      // Try with a different password
      console.log('Trying with different password...');
      const { data: signInData2, error: signInError2 } = await supabase.auth.signInWithPassword({
        email: 'owner.testcompany123@gmail.com',
        password: 'Test123!' // Different password format
      });

      if (signInError2) {
        console.log('❌ Second attempt failed:', signInError2.message);
        return;
      }
    }

    console.log('✅ Sign in successful');

    // Step 2: Get the session
    console.log('Step 2: Getting session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

    if (sessionError) {
      console.log('❌ Session error:', sessionError.message);
      return;
    }

    console.log('Session result:', {
      hasSession: sessionData?.session ? 'Yes' : 'No',
      userId: sessionData?.session?.user?.id
    });

    // Step 3: Try to get user profile (this is where it's probably failing)
    if (sessionData?.session?.user) {
      console.log('Step 3: Getting user profile...');

      const { data: profile, error: profileError } = await supabase
        .from('user_profiles_with_auth')
        .select('*')
        .eq('id', sessionData.session.user.id)
        .single();

      console.log('Profile query result:', {
        profile: profile ? 'Found' : 'None',
        error: profileError ? profileError.message : 'None',
        errorCode: profileError?.code
      });

      if (profile) {
        console.log('✅ PROFILE FOUND:', profile.first_name, profile.last_name);
        console.log('🎉 LOGIN SHOULD WORK!');
      } else {
        console.log('❌ NO PROFILE FOUND - THIS IS THE PROBLEM');
        console.log('Let me check what is in the user_profiles table...');

        // Check what's actually in the table
        const { data: allProfiles } = await supabase.from('user_profiles').select('*');
        console.log('All profiles in table:', allProfiles?.length || 0);

        if (allProfiles && allProfiles.length > 0) {
          console.log('Available profiles:');
          allProfiles.forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.first_name} ${p.last_name}`);
          });

          console.log('Current session user ID:', sessionData.session.user.id);

          // Check if there's a mismatch
          const matchingProfile = allProfiles.find(p => p.id === sessionData.session.user.id);
          if (matchingProfile) {
            console.log('✅ Found matching profile, but query failed - weird!');
          } else {
            console.log('❌ No matching profile found - user ID mismatch!');
          }
        }
      }
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

simulateFrontendLogin();