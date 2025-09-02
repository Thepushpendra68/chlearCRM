/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('pipeline_stages', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 50).notNullable();
    table.string('color', 7).defaultTo('#3B82F6'); // Hex color code
    table.integer('order_position').notNullable();
    table.boolean('is_active').defaultTo(true);
    table.boolean('is_won').defaultTo(false);
    table.boolean('is_lost').defaultTo(false);
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Add unique constraint on order_position
    table.unique('order_position');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('pipeline_stages');
};
