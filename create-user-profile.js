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

async function createUserProfile() {
  try {
    console.log('🔍 Checking current state...');

    // Get all auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    if (authError) {
      throw authError;
    }

    console.log(`📊 Found ${authUsers.users.length} auth users`);

    // Get existing user profiles
    const { data: profiles, error: profileError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profileError) {
      throw profileError;
    }

    console.log(`📊 Found ${profiles.length} user profiles`);

    // Find users without profiles
    const usersWithoutProfiles = authUsers.users.filter(user =>
      !profiles.find(profile => profile.id === user.id)
    );

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ All users have profiles!');
      return;
    }

    console.log(`🔧 Creating profiles for ${usersWithoutProfiles.length} users...`);

    // First, check if we have a default company or create one
    let { data: companies, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .limit(1);

    if (companyError) {
      throw companyError;
    }

    let companyId;
    if (companies.length === 0) {
      // Create a default company
      console.log('🏢 Creating default company...');
      const { data: newCompany, error: createCompanyError } = await supabase
        .from('companies')
        .insert({
          name: 'Default Company',
          subdomain: 'default',
          settings: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createCompanyError) {
        throw createCompanyError;
      }

      companyId = newCompany.id;
      console.log(`✅ Created company: ${companyId}`);
    } else {
      companyId = companies[0].id;
      console.log(`📋 Using existing company: ${companyId}`);
    }

    // Create user profiles
    for (const user of usersWithoutProfiles) {
      console.log(`👤 Creating profile for ${user.email}...`);

      const userData = user.user_metadata || {};
      const { data: newProfile, error: createError } = await supabase
        .from('user_profiles')
        .insert({
          id: user.id,
          first_name: userData.first_name || user.email.split('@')[0],
          last_name: userData.last_name || '',
          email: user.email,
          role: userData.role || 'company_admin', // First user gets admin role
          company_id: companyId,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error(`❌ Error creating profile for ${user.email}:`, createError);
      } else {
        console.log(`✅ Created profile for ${user.email} with role: ${newProfile.role}`);
      }
    }

    console.log('🎉 User profile creation completed!');

  } catch (error) {
    console.error('💥 Error:', error);
    process.exit(1);
  }
}

// Run the script
createUserProfile();