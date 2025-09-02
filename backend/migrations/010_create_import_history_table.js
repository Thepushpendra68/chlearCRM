/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('import_history', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('file_name', 255).notNullable();
    table.integer('total_records').notNullable();
    table.integer('successful_imports').notNullable();
    table.integer('failed_imports').notNullable();
    table.jsonb('errors');
    table.timestamp('created_at').defaultTo(knex.fn.now());

    // Indexes
    table.index('user_id');
    table.index('created_at');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('import_history');
};
