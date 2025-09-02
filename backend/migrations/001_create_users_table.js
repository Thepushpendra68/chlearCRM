/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('users', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 100).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('first_name', 50);
    table.string('last_name', 50);
    table.enum('role', ['admin', 'manager', 'sales_rep']).defaultTo('sales_rep');
    table.boolean('is_active').defaultTo(true);
    table.timestamps(true, true);
    
    // Indexes for performance
    table.index('email');
    table.index('role');
    table.index('is_active');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('users');
};