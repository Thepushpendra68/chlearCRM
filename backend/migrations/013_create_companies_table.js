/**
 * Migration: Create companies table for multi-tenant architecture
 * This migration creates the companies (tenants) table that will be the foundation
 * for multi-tenant data isolation in the Supabase migration.
 */

exports.up = function(knex) {
  return knex.schema.createTable('companies', function(table) {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('name', 100).notNullable();
    table.string('subdomain', 50).unique();
    table.string('plan', 20).defaultTo('starter');
    table.string('status', 20).defaultTo('active');
    table.jsonb('settings').defaultTo('{}');
    table.text('logo_url');
    table.string('industry', 50);
    table.string('size', 20);
    table.string('country', 50);
    table.string('timezone', 50).defaultTo('UTC');
    table.timestamps(true, true);

    // Indexes
    table.index('subdomain');
    table.index('status');
    table.index('plan');
  });
};

exports.down = function(knex) {
  return knex.schema.dropTable('companies');
};