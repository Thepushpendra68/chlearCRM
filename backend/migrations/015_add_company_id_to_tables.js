/**
 * Migration: Add company_id columns to all existing tables
 * This migration adds tenant isolation by adding company_id foreign keys
 * to all business entity tables for multi-tenant data separation.
 */

exports.up = function(knex) {
  return Promise.all([
    // Add company_id to users table
    knex.schema.alterTable('users', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
    }),

    // Add company_id to leads table
    knex.schema.alterTable('leads', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
      table.index(['company_id', 'assigned_to']);
    }),

    // Add company_id to activities table
    knex.schema.alterTable('activities', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
      table.index(['company_id', 'lead_id']);
    }),

    // Add company_id to pipeline_stages table
    knex.schema.alterTable('pipeline_stages', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
      table.index(['company_id', 'order_position']);
    }),

    // Add company_id to lead_assignment_rules table (correct table name)
    knex.schema.alterTable('lead_assignment_rules', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
      table.index(['company_id', 'is_active']);
    }),

    // Add company_id to tasks table
    knex.schema.alterTable('tasks', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
      table.index(['company_id', 'assigned_to']);
    }),

    // Add company_id to import_history table
    knex.schema.alterTable('import_history', function(table) {
      table.uuid('company_id').references('companies.id').onDelete('CASCADE');
      table.index(['company_id']);
    })
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    // Remove company_id from all tables
    knex.schema.alterTable('users', function(table) {
      table.dropColumn('company_id');
    }),
    knex.schema.alterTable('leads', function(table) {
      table.dropColumn('company_id');
    }),
    knex.schema.alterTable('activities', function(table) {
      table.dropColumn('company_id');
    }),
    knex.schema.alterTable('pipeline_stages', function(table) {
      table.dropColumn('company_id');
    }),
    knex.schema.alterTable('lead_assignment_rules', function(table) {
      table.dropColumn('company_id');
    }),
    knex.schema.alterTable('tasks', function(table) {
      table.dropColumn('company_id');
    }),
    knex.schema.alterTable('import_history', function(table) {
      table.dropColumn('company_id');
    })
  ]);
};
