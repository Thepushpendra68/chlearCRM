/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('leads', function(table) {
    table.uuid('created_by').references('id').inTable('users');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    
    // Add indexes
    table.index('created_by', 'idx_leads_created_by');
    table.index('priority', 'idx_leads_priority');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('leads', function(table) {
    table.dropIndex('created_by', 'idx_leads_created_by');
    table.dropIndex('priority', 'idx_leads_priority');
    table.dropColumn('created_by');
    table.dropColumn('priority');
  });
};