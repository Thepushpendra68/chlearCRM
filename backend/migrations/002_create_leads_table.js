/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('leads', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('first_name', 50).notNullable();
    table.string('last_name', 50).notNullable();
    table.string('email', 100);
    table.string('phone', 20);
    table.string('company', 100);
    table.string('job_title', 100);
    table.enum('lead_source', [
      'website', 
      'referral', 
      'cold_call', 
      'social_media', 
      'advertisement', 
      'other'
    ]).defaultTo('other');
    table.enum('status', [
      'new', 
      'contacted', 
      'qualified', 
      'converted', 
      'lost'
    ]).defaultTo('new');
    table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
    table.text('notes');
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index('email');
    table.index('status');
    table.index('lead_source');
    table.index('assigned_to');
    table.index('created_at');
    table.index(['first_name', 'last_name']);
    
    // Full-text search index
    table.index(knex.raw('to_tsvector(\'english\', first_name || \' \' || last_name || \' \' || COALESCE(company, \'\'))'), 'leads_search_idx', 'gin');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('leads');
};