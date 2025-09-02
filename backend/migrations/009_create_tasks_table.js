/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('tasks', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lead_id').references('id').inTable('leads').onDelete('CASCADE');
    table.uuid('assigned_to').notNullable().references('id').inTable('users');
    table.uuid('created_by').notNullable().references('id').inTable('users');
    table.string('title', 200).notNullable();
    table.text('description');
    table.timestamp('due_date');
    table.enum('priority', ['low', 'medium', 'high', 'urgent']).defaultTo('medium');
    table.enum('status', ['pending', 'in_progress', 'completed', 'cancelled']).defaultTo('pending');
    table.enum('task_type', ['follow_up', 'call', 'email', 'meeting', 'demo', 'proposal', 'other']).defaultTo('follow_up');
    table.timestamp('completed_at');
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());

    // Indexes for performance
    table.index('assigned_to');
    table.index('lead_id');
    table.index('due_date');
    table.index('status');
    table.index(['assigned_to', 'status']);
    table.index(['due_date', 'status']);
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('tasks');
};
