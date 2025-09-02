/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Create lead_assignment_rules table
    .createTable('lead_assignment_rules', function(table) {
      table.uuid('id').primary();
      table.string('name', 100).notNullable();
      table.jsonb('conditions').notNullable(); // Store rule conditions
      table.enum('assignment_type', ['round_robin', 'specific_user', 'team']).notNullable();
      table.uuid('assigned_to').references('id').inTable('users').onDelete('SET NULL');
      table.boolean('is_active').defaultTo(true);
      table.integer('priority').defaultTo(1);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index(['is_active', 'priority'], 'idx_assignment_rules_active_priority');
      table.index(['assignment_type'], 'idx_assignment_rules_type');
    })
    
    // Create lead_assignment_history table
    .createTable('lead_assignment_history', function(table) {
      table.uuid('id').primary();
      table.uuid('lead_id').notNullable().references('id').inTable('leads').onDelete('CASCADE');
      table.uuid('previous_assigned_to').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('new_assigned_to').references('id').inTable('users').onDelete('SET NULL');
      table.uuid('assigned_by').notNullable().references('id').inTable('users').onDelete('CASCADE');
      table.string('assignment_reason', 100);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      // Indexes for performance
      table.index(['lead_id'], 'idx_assignment_history_lead_id');
      table.index(['new_assigned_to'], 'idx_assignment_history_new_assigned_to');
      table.index(['created_at'], 'idx_assignment_history_created_at');
    })
    
    // Add assignment tracking to leads table
    .table('leads', function(table) {
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      table.string('assignment_source', 50).defaultTo('manual'); // 'manual', 'auto', 'rule'
      table.uuid('assignment_rule_id').references('id').inTable('lead_assignment_rules').onDelete('SET NULL');
      
      // Indexes for assignment queries
      table.index(['assigned_at'], 'idx_leads_assigned_at');
      table.index(['assignment_source'], 'idx_leads_assignment_source');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    // Remove assignment columns from leads table
    .table('leads', function(table) {
      table.dropIndex('idx_leads_assigned_at');
      table.dropIndex('idx_leads_assignment_source');
      table.dropColumn('assigned_at');
      table.dropColumn('assignment_source');
      table.dropColumn('assignment_rule_id');
    })
    
    // Drop assignment tables
    .dropTable('lead_assignment_history')
    .dropTable('lead_assignment_rules');
};
