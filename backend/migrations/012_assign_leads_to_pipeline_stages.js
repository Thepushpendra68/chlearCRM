/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Get all pipeline stages
  const stages = await knex('pipeline_stages')
    .select('*')
    .where('is_active', true)
    .orderBy('order_position', 'asc');

  // Create a mapping of status to stage
  const statusToStageMap = {
    'new': 'New',
    'contacted': 'Contacted', 
    'qualified': 'Qualified',
    'converted': 'Won',
    'lost': 'Lost'
  };

  // Get the first stage (New) for any unmapped statuses
  const newStage = stages.find(stage => stage.name === 'New');

  if (!newStage) {
    console.log('No pipeline stages found, skipping lead assignment');
    return;
  }

  // Update leads to assign them to appropriate pipeline stages
  for (const lead of await knex('leads').select('*')) {
    const stageName = statusToStageMap[lead.status] || 'New';
    const stage = stages.find(s => s.name === stageName);
    
    if (stage) {
      await knex('leads')
        .where('id', lead.id)
        .update({ 
          pipeline_stage_id: stage.id,
          updated_at: knex.fn.now()
        });
    } else {
      // Fallback to New stage if stage not found
      await knex('leads')
        .where('id', lead.id)
        .update({ 
          pipeline_stage_id: newStage.id,
          updated_at: knex.fn.now()
        });
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Remove pipeline_stage_id from all leads
  await knex('leads')
    .update({ 
      pipeline_stage_id: null,
      updated_at: knex.fn.now()
    });
};

