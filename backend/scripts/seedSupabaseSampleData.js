#!/usr/bin/env node

/**
 * Supabase seed script to bootstrap demo data without Knex.
 * Creates a demo company, core team members, pipeline stages, and sample leads.
 */

require('dotenv').config();

const { supabaseAdmin, createCompanyWithAdmin } = require('../src/config/supabase');
const { createUser } = require('../src/utils/supabaseAuthUtils');

const ADMIN_EMAIL = 'admin@sakha-demo.com';
const ADMIN_PASSWORD = 'Admin123!';
const MANAGER_EMAIL = 'manager@sakha-demo.com';
const SALES_EMAIL = 'sales@sakha-demo.com';
const DEFAULT_PASSWORD = 'Demo123!';

async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function ensureUserProfile(userId) {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, company_id, role')
      .eq('id', userId)
      .limit(1);

    if (error) {
      throw new Error(`Failed to fetch user profile: ${error.message}`);
    }

    if (data && data.length > 0) {
      return data[0];
    }

    await wait(300);
  }

  throw new Error('Timed out waiting for user profile to be created.');
}

async function ensureDemoCompany() {
  const { data: existingCompanies, error: companyLookupError } = await supabaseAdmin
    .from('companies')
    .select('id, name, subdomain')
    .eq('subdomain', 'sakha-demo')
    .limit(1);

  if (companyLookupError) {
    throw new Error(`Failed to check existing company: ${companyLookupError.message}`);
  }

  if (existingCompanies && existingCompanies.length > 0) {
    const company = existingCompanies[0];
    const { data: adminProfiles, error: adminLookupError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, role')
      .eq('company_id', company.id)
      .eq('role', 'company_admin')
      .limit(1);

    if (adminLookupError) {
      throw new Error(`Failed to find company admin profile: ${adminLookupError.message}`);
    }

    if (!adminProfiles || adminProfiles.length === 0) {
      throw new Error('Demo company exists but no company admin profile was found.');
    }

    return {
      company,
      adminProfile: adminProfiles[0],
      created: false,
    };
  }

  console.log('Creating demo company and admin user in Supabase...');

  const { company, user } = await createCompanyWithAdmin(
    {
      name: 'Sakha Demo Company',
      subdomain: 'sakha-demo',
      plan: 'starter',
      status: 'active',
      settings: {
        industry: 'SaaS',
        timezone: 'UTC',
      },
    },
    {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      first_name: 'Demo',
      last_name: 'Admin',
    },
  );

  const adminProfile = await ensureUserProfile(user.id);

  return {
    company,
    adminProfile,
    adminUser: user,
    created: true,
  };
}

async function ensureTeamMembers(companyId, adminId) {
  const team = {
    adminId,
    managerId: null,
    salesId: null,
  };

  const definitions = [
    {
      key: 'managerId',
      email: MANAGER_EMAIL,
      firstName: 'Demo',
      lastName: 'Manager',
      role: 'manager',
    },
    {
      key: 'salesId',
      email: SALES_EMAIL,
      firstName: 'Demo',
      lastName: 'Sales',
      role: 'sales_rep',
    },
  ];

  for (const definition of definitions) {
    const { email, firstName, lastName, role, key } = definition;

    const { data: existingUser, error: userLookupError } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (userLookupError) {
      throw new Error(`Failed to look up user ${email}: ${userLookupError.message}`);
    }

    if (existingUser?.user) {
      team[key] = existingUser.user.id;
      continue;
    }

    console.log(`Creating ${role} user: ${email}`);

    const result = await createUser(
      {
        email,
        password: DEFAULT_PASSWORD,
        first_name: firstName,
        last_name: lastName,
        role,
      },
      companyId,
      adminId,
    );

    if (!result.success) {
      throw new Error(`Failed to create ${role} user: ${result.error}`);
    }

    team[key] = result.user.id;
  }

  return team;
}

async function ensurePipelineStages(companyId) {
  const { data: existingStages, error: stageLookupError } = await supabaseAdmin
    .from('pipeline_stages')
    .select('id, name')
    .eq('company_id', companyId)
    .order('order_position', { ascending: true });

  if (stageLookupError) {
    throw new Error(`Failed to fetch pipeline stages: ${stageLookupError.message}`);
  }

  if (existingStages && existingStages.length > 0) {
    const stageMap = {};
    existingStages.forEach((stage) => {
      stageMap[stage.name] = stage.id;
    });
    return { stageMap, created: false };
  }

  console.log('Creating default pipeline stages...');

  const definitions = [
    { name: 'New Lead', description: 'Newly captured leads', color: '#3B82F6' },
    { name: 'Contacted', description: 'Initial contact made', color: '#6366F1' },
    { name: 'Qualified', description: 'Qualified opportunity', color: '#8B5CF6' },
    { name: 'Negotiation', description: 'In discussion with prospect', color: '#F59E0B' },
    { name: 'Closed Won', description: 'Deal won', color: '#10B981', is_closed_won: true },
    { name: 'Closed Lost', description: 'Deal lost', color: '#EF4444', is_closed_lost: true },
  ];

  const stagesToInsert = definitions.map((definition, index) => ({
    company_id: companyId,
    name: definition.name,
    description: definition.description,
    color: definition.color,
    order_position: (index + 1) * 10,
    is_active: true,
    is_closed_won: definition.is_closed_won || false,
    is_closed_lost: definition.is_closed_lost || false,
  }));

  const { data: insertedStages, error: insertError } = await supabaseAdmin
    .from('pipeline_stages')
    .insert(stagesToInsert)
    .select('id, name');

  if (insertError) {
    throw new Error(`Failed to insert pipeline stages: ${insertError.message}`);
  }

  const stageMap = {};
  insertedStages.forEach((stage) => {
    stageMap[stage.name] = stage.id;
  });

  return { stageMap, created: true };
}

async function ensureSampleLeads(companyId, stageMap, team) {
  const { data: existingLeads, error: leadLookupError } = await supabaseAdmin
    .from('leads')
    .select('id')
    .eq('company_id', companyId)
    .limit(1);

  if (leadLookupError) {
    throw new Error(`Failed to fetch leads: ${leadLookupError.message}`);
  }

  if (existingLeads && existingLeads.length > 0) {
    return { created: false, count: existingLeads.length };
  }

  console.log('Creating sample leads...');

  const now = new Date().toISOString();

  const leads = [
    {
      company_id: companyId,
      name: 'Acme Corp - Website Inquiry',
      email: 'ceo@acmecorp.io',
      phone: '+1-555-0100',
      company: 'Acme Corp',
      title: 'Chief Executive Officer',
      source: 'Website',
      status: 'new',
      priority: 'high',
      pipeline_stage_id: stageMap['New Lead'],
      assigned_to: team.managerId,
      created_by: team.adminId,
      notes: 'Interested in a discovery call next week.',
      created_at: now,
      updated_at: now,
    },
    {
      company_id: companyId,
      name: 'Globex - Partnership Opportunity',
      email: 'vp.sales@globex.com',
      phone: '+1-555-0111',
      company: 'Globex Corporation',
      title: 'VP of Sales',
      source: 'Referral',
      status: 'in_progress',
      priority: 'medium',
      pipeline_stage_id: stageMap['Qualified'],
      assigned_to: team.salesId,
      created_by: team.managerId,
      notes: 'Needs pricing proposal and reference calls.',
      created_at: now,
      updated_at: now,
    },
    {
      company_id: companyId,
      name: 'Stark Industries - Renewal',
      email: 'procurement@starkindustries.com',
      phone: '+1-555-0122',
      company: 'Stark Industries',
      title: 'Procurement Lead',
      source: 'Customer Success',
      status: 'pending',
      priority: 'high',
      pipeline_stage_id: stageMap['Negotiation'],
      assigned_to: team.salesId,
      created_by: team.adminId,
      notes: 'Renewal with potential upsell on enterprise tier.',
      created_at: now,
      updated_at: now,
    },
  ];

  const { error: insertError } = await supabaseAdmin
    .from('leads')
    .insert(leads);

  if (insertError) {
    throw new Error(`Failed to insert sample leads: ${insertError.message}`);
  }

  return { created: true, count: leads.length };
}

(async () => {
  try {
    console.log('Starting Supabase seed...');

    const { company, adminProfile, created: companyCreated } = await ensureDemoCompany();

    console.log(`Company ready: ${company.name} (${company.id})${companyCreated ? ' [created]' : ''}`);

    const team = await ensureTeamMembers(company.id, adminProfile.id);

    const { stageMap, created: stagesCreated } = await ensurePipelineStages(company.id);

    const leadResult = await ensureSampleLeads(company.id, stageMap, team);

    console.log('Seed completed successfully.');
    console.log('--------------------------------------------------');
    console.log('Demo credentials:');
    console.log(`Admin    : ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
    console.log(`Manager  : ${MANAGER_EMAIL} / ${DEFAULT_PASSWORD}`);
    console.log(`Sales Rep: ${SALES_EMAIL} / ${DEFAULT_PASSWORD}`);
    console.log('--------------------------------------------------');
    console.log(`Company created? ${companyCreated}`);
    console.log(`Pipeline stages created? ${stagesCreated}`);
    console.log(`Sample leads inserted? ${leadResult.created}`);

    process.exit(0);
  } catch (error) {
    console.error('Supabase seed failed:', error.message);
    if (error.stack) {
      console.error(error.stack);
    }
    process.exit(1);
  }
})();
