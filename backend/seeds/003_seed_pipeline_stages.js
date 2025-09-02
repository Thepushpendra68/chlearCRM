/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // Deletes ALL existing entries
  await knex('pipeline_stages').del();
  
  // Inserts seed entries
  await knex('pipeline_stages').insert([
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'New',
      color: '#3B82F6',
      order_position: 1,
      is_active: true,
      is_won: false,
      is_lost: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Qualified',
      color: '#10B981',
      order_position: 2,
      is_active: true,
      is_won: false,
      is_lost: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Contacted',
      color: '#F59E0B',
      order_position: 3,
      is_active: true,
      is_won: false,
      is_lost: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Proposal',
      color: '#8B5CF6',
      order_position: 4,
      is_active: true,
      is_won: false,
      is_lost: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Won',
      color: '#059669',
      order_position: 5,
      is_active: true,
      is_won: true,
      is_lost: false
    },
    {
      id: knex.raw('gen_random_uuid()'),
      name: 'Lost',
      color: '#DC2626',
      order_position: 6,
      is_active: true,
      is_won: false,
      is_lost: true
    }
  ]);
};
