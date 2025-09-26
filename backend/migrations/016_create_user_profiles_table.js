/**
 * Migration: Create user_profiles table extending Supabase auth.users
 * This migration creates a user_profiles table that extends Supabase's auth.users
 * with company-specific information and role assignments.
 */

exports.up = function(knex) {
  return knex.schema.createTable('user_profiles', function(table) {
    // Primary key references Supabase auth.users.id
    table.uuid('id').primary();

    // Company association (tenant isolation)
    table.uuid('company_id').references('companies.id').onDelete('CASCADE').notNullable();

    // Role within the company
    table.specificType('role', 'user_role_new').defaultTo('sales_rep');

    // Profile information
    table.string('first_name', 50);
    table.string('last_name', 50);
    table.string('avatar_url');
    table.string('phone', 20);
    table.string('title', 100);
    table.string('department', 50);

    // Settings and preferences
    table.jsonb('settings').defaultTo('{}');
    table.jsonb('permissions').defaultTo('{}'); // Company-specific permission overrides

    // Status and metadata
    table.boolean('is_active').defaultTo(true);
    table.boolean('email_verified').defaultTo(false);
    table.timestamp('last_login_at');
    table.string('timezone', 50).defaultTo('UTC');
    table.string('language', 10).defaultTo('en');

    // Onboarding and setup
    table.boolean('onboarding_completed').defaultTo(false);
    table.jsonb('onboarding_steps').defaultTo('{}');

    // Audit fields
    table.uuid('created_by');
    table.timestamps(true, true);

    // Indexes for efficient queries
    table.index(['company_id']);
    table.index(['company_id', 'role']);
    table.index(['company_id', 'is_active']);
    table.index(['email_verified']);
    table.index(['last_login_at']);
  })
  .then(() => {
    // Create a view for easier user data access combining auth.users and user_profiles
    return knex.schema.raw(`
      CREATE OR REPLACE VIEW user_profiles_with_auth AS
      SELECT
        up.id,
        up.company_id,
        up.role,
        up.first_name,
        up.last_name,
        up.avatar_url,
        up.phone,
        up.title,
        up.department,
        up.settings,
        up.permissions,
        up.is_active,
        up.email_verified,
        up.last_login_at,
        up.timezone,
        up.language,
        up.onboarding_completed,
        up.onboarding_steps,
        up.created_by,
        up.created_at,
        up.updated_at,
        au.email,
        au.email_confirmed_at,
        au.created_at as auth_created_at,
        au.updated_at as auth_updated_at
      FROM user_profiles up
      LEFT JOIN auth.users au ON up.id = au.id;
    `);
  });
};

exports.down = function(knex) {
  return knex.schema.raw('DROP VIEW IF EXISTS user_profiles_with_auth')
    .then(() => {
      return knex.schema.dropTable('user_profiles');
    });
};