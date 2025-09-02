/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema.createTable('activities', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('lead_id').notNullable().references('id').inTable('leads').onDelete('CASCADE');
    table.uuid('user_id').notNullable().references('id').inTable('users');
    table.string('activity_type', 20).notNullable().checkIn(['call', 'email', 'meeting', 'note', 'task', 'sms', 'stage_change', 'assignment_change']);
    table.string('subject', 200);
    table.text('description');
    table.timestamp('scheduled_at');
    table.timestamp('completed_at');
    table.boolean('is_completed').defaultTo(false);
    table.integer('duration_minutes');
    table.string('outcome', 50); // 'successful', 'no_answer', 'follow_up_required', etc.
    table.jsonb('metadata'); // Store additional activity-specific data
    table.timestamp('created_at').defaultTo(knex.fn.now());
    table.timestamp('updated_at').defaultTo(knex.fn.now());
    
    // Indexes for activity queries
    table.index('lead_id', 'idx_activities_lead_id');
    table.index('user_id', 'idx_activities_user_id');
    table.index('scheduled_at', 'idx_activities_scheduled_at');
    table.index('activity_type', 'idx_activities_type');
    table.index(['lead_id', 'user_id', 'created_at'], 'idx_activities_lead_user_date');
  });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema.dropTable('activities');
};
