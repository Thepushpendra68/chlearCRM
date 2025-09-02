/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.alterTable('leads', function(table) {
    table.uuid('pipeline_stage_id').references('id').inTable('pipeline_stages');
    table.date('expected_close_date');
    table.decimal('deal_value', 10, 2).defaultTo(0);
    table.integer('probability').defaultTo(0).checkBetween([0, 100]);
    table.string('lost_reason', 100);
    
    // Add index for pipeline queries
    table.index('pipeline_stage_id', 'idx_leads_pipeline_stage');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.alterTable('leads', function(table) {
    table.dropIndex('pipeline_stage_id', 'idx_leads_pipeline_stage');
    table.dropColumn('pipeline_stage_id');
    table.dropColumn('expected_close_date');
    table.dropColumn('deal_value');
    table.dropColumn('probability');
    table.dropColumn('lost_reason');
  });
};
