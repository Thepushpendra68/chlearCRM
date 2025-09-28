require('dotenv').config({ path: './backend/.env' });
const { supabaseAdmin } = require('./backend/src/config/supabase');

async function testSupabaseAndFindUserLeads() {
  try {
    console.log('🔍 Testing Supabase connection and querying for pushpendrachl@gmail.com...');

    // First, test basic connection by getting user_profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.log('❌ Error accessing user_profiles table:', profilesError.message);
      return;
    }

    console.log('✅ Successfully connected to Supabase');
    console.log('📊 Total user profiles:', profiles?.length || 0);

    // Look for the specific user email in auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

    if (authError) {
      console.log('❌ Error accessing auth users:', authError.message);
      return;
    }

    console.log('📊 Total auth users:', authUsers?.users?.length || 0);

    // Find the specific user
    const targetUser = authUsers.users.find(user => user.email === 'pushpendrachl@gmail.com');

    if (!targetUser) {
      console.log('❌ User pushpendrachl@gmail.com not found in auth.users');

      // Let's also check user_profiles table for this email
      const { data: profileByEmail, error: profileEmailError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('email', 'pushpendrachl@gmail.com');

      if (profileEmailError) {
        console.log('❌ Error searching profiles by email:', profileEmailError.message);
      } else if (profileByEmail?.length > 0) {
        console.log('✅ Found user in user_profiles table:', profileByEmail[0]);
      } else {
        console.log('❌ User not found in user_profiles table either');
      }
      return;
    }

    console.log('✅ Found user:', {
      id: targetUser.id,
      email: targetUser.email,
      created_at: targetUser.created_at
    });

    // Get user's profile information
    const { data: userProfile, error: userProfileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', targetUser.id)
      .single();

    if (userProfileError) {
      console.log('❌ Error getting user profile:', userProfileError.message);
    } else {
      console.log('✅ User profile:', {
        role: userProfile.role,
        company_id: userProfile.company_id,
        first_name: userProfile.first_name,
        last_name: userProfile.last_name
      });
    }

    // Now query leads - first get all leads to understand the structure
    const { data: allLeads, error: leadsError } = await supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' });

    if (leadsError) {
      console.log('❌ Error accessing leads table:', leadsError.message);
      return;
    }

    console.log('📊 Total leads in database:', allLeads?.length || 0);

    if (allLeads?.length > 0) {
      console.log('🔍 Sample lead structure:', {
        id: allLeads[0].id,
        fields: Object.keys(allLeads[0])
      });
    }

    // Query leads associated with this user (by created_by or assigned_to)
    const { data: userLeads, error: userLeadsError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .or(`created_by.eq.${targetUser.id},assigned_to.eq.${targetUser.id}`);

    if (userLeadsError) {
      console.log('❌ Error querying user leads:', userLeadsError.message);
    } else {
      console.log(`📈 Leads for ${targetUser.email}:`, userLeads?.length || 0);

      if (userLeads?.length > 0) {
        console.log('📋 Lead details:');
        userLeads.forEach((lead, index) => {
          console.log(`  ${index + 1}. ${lead.name || lead.first_name + ' ' + lead.last_name} - ${lead.company || lead.company_name} (${lead.status})`);
        });
      }
    }

    // Also check if there are leads for the user's company
    if (userProfile?.company_id) {
      const { data: companyLeads, error: companyLeadsError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('company_id', userProfile.company_id);

      if (companyLeadsError) {
        console.log('❌ Error querying company leads:', companyLeadsError.message);
      } else {
        console.log(`🏢 Total leads for user's company:`, companyLeads?.length || 0);
      }
    }

  } catch (error) {
    console.log('💥 Connection error:', error.message);
  }
}

testSupabaseAndFindUserLeads();