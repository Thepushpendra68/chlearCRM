const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('leads').del();
  await knex('users').del();

  // Inserts seed entries
  const saltRounds = 12;
  
  // Create users
  const users = await knex('users').insert([
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      email: 'admin@crm.com',
      password_hash: await bcrypt.hash('Admin123!', saltRounds),
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      email: 'manager@crm.com',
      password_hash: await bcrypt.hash('Manager123!', saltRounds),
      first_name: 'John',
      last_name: 'Manager',
      role: 'manager',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      email: 'sales1@crm.com',
      password_hash: await bcrypt.hash('Sales123!', saltRounds),
      first_name: 'Jane',
      last_name: 'Smith',
      role: 'sales_rep',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      email: 'sales2@crm.com',
      password_hash: await bcrypt.hash('Sales123!', saltRounds),
      first_name: 'Mike',
      last_name: 'Johnson',
      role: 'sales_rep',
      is_active: true,
      created_at: new Date(),
      updated_at: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      email: 'inactive@crm.com',
      password_hash: await bcrypt.hash('Inactive123!', saltRounds),
      first_name: 'Inactive',
      last_name: 'User',
      role: 'sales_rep',
      is_active: false,
      created_at: new Date(),
      updated_at: new Date()
    }
  ]).returning('*');

  // Create sample leads
  const leads = [
    {
      id: '660e8400-e29b-41d4-a716-446655440001',
      first_name: 'Alice',
      last_name: 'Johnson',
      email: 'alice.johnson@techcorp.com',
      phone: '+1-555-0101',
      company: 'TechCorp Solutions',
      job_title: 'CTO',
      lead_source: 'website',
      status: 'new',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      notes: 'Interested in our enterprise CRM solution. Very responsive to emails.',
      created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440002',
      first_name: 'Bob',
      last_name: 'Williams',
      email: 'bob.williams@startup.io',
      phone: '+1-555-0102',
      company: 'StartupIO',
      job_title: 'Founder',
      lead_source: 'referral',
      status: 'contacted',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      notes: 'Referred by existing client. Looking for basic CRM features.',
      created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440003',
      first_name: 'Carol',
      last_name: 'Davis',
      email: 'carol.davis@bigcorp.com',
      phone: '+1-555-0103',
      company: 'BigCorp Industries',
      job_title: 'Sales Director',
      lead_source: 'cold_call',
      status: 'qualified',
      assigned_to: '550e8400-e29b-41d4-a716-446655440004',
      notes: 'High-value prospect. Budget approved for Q2. Schedule demo.',
      created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440004',
      first_name: 'David',
      last_name: 'Brown',
      email: 'david.brown@retail.com',
      phone: '+1-555-0104',
      company: 'RetailMax',
      job_title: 'Operations Manager',
      lead_source: 'social_media',
      status: 'converted',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      notes: 'Converted to customer! Signed annual contract.',
      created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440005',
      first_name: 'Eva',
      last_name: 'Miller',
      email: 'eva.miller@consulting.com',
      phone: '+1-555-0105',
      company: 'Miller Consulting',
      job_title: 'Partner',
      lead_source: 'advertisement',
      status: 'lost',
      assigned_to: '550e8400-e29b-41d4-a716-446655440004',
      notes: 'Decided to go with competitor. Price was the main factor.',
      created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440006',
      first_name: 'Frank',
      last_name: 'Wilson',
      email: 'frank.wilson@manufacturing.com',
      phone: '+1-555-0106',
      company: 'Wilson Manufacturing',
      job_title: 'IT Director',
      lead_source: 'website',
      status: 'new',
      assigned_to: '550e8400-e29b-41d4-a716-446655440002',
      notes: 'Downloaded whitepaper. Interested in integration capabilities.',
      created_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
      updated_at: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440007',
      first_name: 'Grace',
      last_name: 'Moore',
      email: 'grace.moore@healthcare.com',
      phone: '+1-555-0107',
      company: 'Healthcare Plus',
      job_title: 'Administrator',
      lead_source: 'referral',
      status: 'contacted',
      assigned_to: '550e8400-e29b-41d4-a716-446655440002',
      notes: 'Referred by Dr. Smith. Needs HIPAA compliance features.',
      created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
      updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440008',
      first_name: 'Henry',
      last_name: 'Taylor',
      email: 'henry.taylor@finance.com',
      phone: '+1-555-0108',
      company: 'Taylor Financial',
      job_title: 'Managing Partner',
      lead_source: 'cold_call',
      status: 'qualified',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      notes: 'Very interested. Wants to see security features and compliance.',
      created_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000), // 6 days ago
      updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440009',
      first_name: 'Iris',
      last_name: 'Anderson',
      email: 'iris.anderson@education.com',
      phone: '+1-555-0109',
      company: 'Anderson Academy',
      job_title: 'Principal',
      lead_source: 'social_media',
      status: 'new',
      assigned_to: '550e8400-e29b-41d4-a716-446655440004',
      notes: 'Saw our LinkedIn ad. Interested in student management features.',
      created_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000), // 8 days ago
      updated_at: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440010',
      first_name: 'Jack',
      last_name: 'Thomas',
      email: 'jack.thomas@nonprofit.com',
      phone: '+1-555-0110',
      company: 'Thomas Foundation',
      job_title: 'Executive Director',
      lead_source: 'other',
      status: 'contacted',
      assigned_to: '550e8400-e29b-41d4-a716-446655440002',
      notes: 'Non-profit organization. Interested in discounted pricing.',
      created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      updated_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440011',
      first_name: 'Kate',
      last_name: 'Jackson',
      email: 'kate.jackson@realestate.com',
      phone: '+1-555-0111',
      company: 'Jackson Realty',
      job_title: 'Broker',
      lead_source: 'website',
      status: 'qualified',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      notes: 'High volume of leads. Needs automation features.',
      created_at: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
      updated_at: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440012',
      first_name: 'Liam',
      last_name: 'White',
      email: 'liam.white@agency.com',
      phone: '+1-555-0112',
      company: 'White Marketing Agency',
      job_title: 'Creative Director',
      lead_source: 'referral',
      status: 'converted',
      assigned_to: '550e8400-e29b-41d4-a716-446655440004',
      notes: 'Converted! Signed up for premium plan with custom integrations.',
      created_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
      updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440013',
      first_name: 'Maya',
      last_name: 'Harris',
      email: 'maya.harris@restaurant.com',
      phone: '+1-555-0113',
      company: 'Harris Restaurant Group',
      job_title: 'Operations Manager',
      lead_source: 'advertisement',
      status: 'lost',
      assigned_to: '550e8400-e29b-41d4-a716-446655440002',
      notes: 'Went with local competitor. Price and local support were factors.',
      created_at: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000), // 18 days ago
      updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440014',
      first_name: 'Noah',
      last_name: 'Martin',
      email: 'noah.martin@logistics.com',
      phone: '+1-555-0114',
      company: 'Martin Logistics',
      job_title: 'Fleet Manager',
      lead_source: 'cold_call',
      status: 'new',
      assigned_to: '550e8400-e29b-41d4-a716-446655440003',
      notes: 'Cold call success. Very interested in tracking and reporting features.',
      created_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000), // 20 days ago
      updated_at: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000)
    },
    {
      id: '660e8400-e29b-41d4-a716-446655440015',
      first_name: 'Olivia',
      last_name: 'Garcia',
      email: 'olivia.garcia@fashion.com',
      phone: '+1-555-0115',
      company: 'Garcia Fashion',
      job_title: 'Brand Manager',
      lead_source: 'social_media',
      status: 'contacted',
      assigned_to: '550e8400-e29b-41d4-a716-446655440004',
      notes: 'Instagram follower. Interested in social media integration.',
      created_at: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000), // 22 days ago
      updated_at: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    }
  ];

  await knex('leads').insert(leads);
};
