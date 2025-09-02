const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('users').del();
  
  // Hash the default password
  const hashedPassword = await bcrypt.hash('Admin123!', 12);
  
  // Inserts seed entries
  await knex('users').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'admin@crm.com',
      password_hash: hashedPassword,
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'manager@crm.com',
      password_hash: hashedPassword,
      first_name: 'Manager',
      last_name: 'User',
      role: 'manager',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    },
    {
      id: knex.raw('gen_random_uuid()'),
      email: 'sales@crm.com',
      password_hash: hashedPassword,
      first_name: 'Sales',
      last_name: 'Rep',
      role: 'sales_rep',
      is_active: true,
      created_at: knex.fn.now(),
      updated_at: knex.fn.now()
    }
  ]);
};