/**
 * Performance optimization migration
 * Adds missing indexes for foreign keys and frequently queried columns
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    // Add indexes for foreign keys that are missing
    .then(() => {
      console.log('📊 Adding foreign key indexes...');

      // Activities table indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_activities_lead_id ON activities(lead_id)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id)');
    })
    .then(() => {
      // Import history table indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_import_history_company_id ON import_history(company_id)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_import_history_created_by ON import_history(created_by)');
    })
    .then(() => {
      // Lead assignment rules indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_lead_assignment_rules_assigned_to ON lead_assignment_rules(assigned_to)');
    })
    .then(() => {
      // Leads table indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_assigned_to ON leads(assigned_to)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_created_by ON leads(created_by)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_pipeline_stage_id ON leads(pipeline_stage_id)');
    })
    .then(() => {
      // Tasks table indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_tasks_lead_id ON tasks(lead_id)');
    })
    .then(() => {
      // User profiles table indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_user_profiles_company_id ON user_profiles(company_id)');
    })
    .then(() => {
      // Pipeline stages indexes
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_pipeline_stages_company_id ON pipeline_stages(company_id)');
    })
    .then(() => {
      console.log('📊 Adding composite indexes for common query patterns...');

      // Composite indexes for dashboard queries
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_company_status_created ON leads(company_id, status, created_at DESC)');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_company_assigned_status ON leads(company_id, assigned_to, status)');
    })
    .then(() => {
      // Composite index for user performance queries
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_assigned_status_created ON leads(assigned_to, status, created_at)');
    })
    .then(() => {
      // Composite index for activity queries
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_activities_company_created_type ON activities(company_id, created_at DESC, type)');
    })
    .then(() => {
      console.log('📊 Adding partial indexes for active records...');

      // Partial indexes for active records only
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_leads_active_assigned ON leads(assigned_to) WHERE assigned_to IS NOT NULL');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_user_profiles_active_company ON user_profiles(company_id) WHERE is_active = true');
    })
    .then(() => {
      return knex.raw('CREATE INDEX IF NOT EXISTS idx_tasks_active_assigned ON tasks(assigned_to) WHERE status != \'completed\'');
    })
    .then(() => {
      console.log('✅ Performance indexes created successfully');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .then(() => {
      console.log('🗑️ Dropping performance indexes...');

      // Drop all the indexes we created
      const indexes = [
        'idx_activities_lead_id',
        'idx_activities_user_id',
        'idx_import_history_company_id',
        'idx_import_history_created_by',
        'idx_lead_assignment_rules_assigned_to',
        'idx_leads_assigned_to',
        'idx_leads_created_by',
        'idx_leads_pipeline_stage_id',
        'idx_tasks_assigned_to',
        'idx_tasks_created_by',
        'idx_tasks_lead_id',
        'idx_user_profiles_company_id',
        'idx_pipeline_stages_company_id',
        'idx_leads_company_status_created',
        'idx_leads_company_assigned_status',
        'idx_leads_assigned_status_created',
        'idx_activities_company_created_type',
        'idx_leads_active_assigned',
        'idx_user_profiles_active_company',
        'idx_tasks_active_assigned'
      ];

      return Promise.all(indexes.map(index => knex.raw(`DROP INDEX IF EXISTS ${index}`)));
    })
    .then(() => {
      console.log('✅ Performance indexes dropped successfully');
    });
};