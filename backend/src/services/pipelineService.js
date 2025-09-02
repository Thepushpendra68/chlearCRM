const db = require('../config/database');

class PipelineService {
  // Get all pipeline stages
  async getAllStages() {
    try {
      const stages = await db('pipeline_stages')
        .select('*')
        .where('is_active', true)
        .orderBy('order_position', 'asc');
      
      return { success: true, data: stages };
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new pipeline stage
  async createStage(stageData) {
    try {
      const { name, color, order_position } = stageData;
      
      // Validate required fields
      if (!name || !order_position) {
        return { success: false, error: 'Name and order position are required' };
      }

      // Check if order position already exists
      const existingStage = await db('pipeline_stages')
        .where('order_position', order_position)
        .first();
      
      if (existingStage) {
        return { success: false, error: 'Order position already exists' };
      }

      const [newStage] = await db('pipeline_stages')
        .insert({
          name,
          color: color || '#3B82F6',
          order_position,
          is_active: true,
          is_won: false,
          is_lost: false
        })
        .returning('*');

      return { success: true, data: newStage };
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Update pipeline stage
  async updateStage(stageId, updateData) {
    try {
      const { name, color, order_position, is_active, is_won, is_lost } = updateData;
      
      // Check if stage exists
      const existingStage = await db('pipeline_stages')
        .where('id', stageId)
        .first();
      
      if (!existingStage) {
        return { success: false, error: 'Pipeline stage not found' };
      }

      // If updating order position, check for conflicts
      if (order_position && order_position !== existingStage.order_position) {
        const conflictingStage = await db('pipeline_stages')
          .where('order_position', order_position)
          .where('id', '!=', stageId)
          .first();
        
        if (conflictingStage) {
          return { success: false, error: 'Order position already exists' };
        }
      }

      const [updatedStage] = await db('pipeline_stages')
        .where('id', stageId)
        .update({
          ...(name && { name }),
          ...(color && { color }),
          ...(order_position && { order_position }),
          ...(is_active !== undefined && { is_active }),
          ...(is_won !== undefined && { is_won }),
          ...(is_lost !== undefined && { is_lost }),
          updated_at: db.fn.now()
        })
        .returning('*');

      return { success: true, data: updatedStage };
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete pipeline stage
  async deleteStage(stageId) {
    try {
      // Check if stage exists
      const existingStage = await db('pipeline_stages')
        .where('id', stageId)
        .first();
      
      if (!existingStage) {
        return { success: false, error: 'Pipeline stage not found' };
      }

      // Check if any leads are using this stage
      const leadsInStage = await db('leads')
        .where('pipeline_stage_id', stageId)
        .count('* as count')
        .first();
      
      if (leadsInStage.count > 0) {
        return { success: false, error: 'Cannot delete stage with existing leads. Please reassign leads first.' };
      }

      await db('pipeline_stages')
        .where('id', stageId)
        .del();

      return { success: true, message: 'Pipeline stage deleted successfully' };
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Reorder pipeline stages
  async reorderStages(stageOrders) {
    try {
      // Validate input
      if (!Array.isArray(stageOrders) || stageOrders.length === 0) {
        return { success: false, error: 'Invalid stage orders provided' };
      }

      // Use transaction to ensure all updates succeed or fail together
      const result = await db.transaction(async (trx) => {
        for (const { id, order_position } of stageOrders) {
          await trx('pipeline_stages')
            .where('id', id)
            .update({ 
              order_position,
              updated_at: trx.fn.now()
            });
        }
        
        // Return updated stages
        return await trx('pipeline_stages')
          .select('*')
          .orderBy('order_position', 'asc');
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Error reordering pipeline stages:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pipeline overview with lead counts
  async getPipelineOverview() {
    try {
      const stages = await db('pipeline_stages')
        .select('*')
        .where('is_active', true)
        .orderBy('order_position', 'asc');

      // Get lead counts for each stage
      const stageCounts = await db('leads')
        .select('pipeline_stage_id')
        .count('* as count')
        .groupBy('pipeline_stage_id');

      // Create a map of stage counts
      const countsMap = {};
      stageCounts.forEach(item => {
        countsMap[item.pipeline_stage_id] = parseInt(item.count);
      });

      // Add counts to stages
      const stagesWithCounts = stages.map(stage => ({
        ...stage,
        lead_count: countsMap[stage.id] || 0
      }));

      // Calculate total leads
      const totalLeads = stagesWithCounts.reduce((sum, stage) => sum + stage.lead_count, 0);

      // Calculate won/lost counts
      const wonCount = stagesWithCounts
        .filter(stage => stage.is_won)
        .reduce((sum, stage) => sum + stage.lead_count, 0);
      
      const lostCount = stagesWithCounts
        .filter(stage => stage.is_lost)
        .reduce((sum, stage) => sum + stage.lead_count, 0);

      return {
        success: true,
        data: {
          stages: stagesWithCounts,
          summary: {
            total_leads: totalLeads,
            won_leads: wonCount,
            lost_leads: lostCount,
            active_leads: totalLeads - wonCount - lostCount
          }
        }
      };
    } catch (error) {
      console.error('Error fetching pipeline overview:', error);
      return { success: false, error: error.message };
    }
  }

  // Move lead to different stage
  async moveLeadToStage(leadId, stageId, userId) {
    try {
      // Validate lead exists
      const lead = await db('leads')
        .where('id', leadId)
        .first();
      
      if (!lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Validate stage exists
      const stage = await db('pipeline_stages')
        .where('id', stageId)
        .first();
      
      if (!stage) {
        return { success: false, error: 'Pipeline stage not found' };
      }

      const previousStageId = lead.pipeline_stage_id;

      // Update lead stage
      const [updatedLead] = await db('leads')
        .where('id', leadId)
        .update({
          pipeline_stage_id: stageId,
          updated_at: db.fn.now()
        })
        .returning('*');

      // Log the stage change activity (we'll implement this in the activity system)
      // For now, we'll just return the updated lead
      
      return {
        success: true,
        data: {
          lead: updatedLead,
          previous_stage_id: previousStageId,
          new_stage_id: stageId
        }
      };
    } catch (error) {
      console.error('Error moving lead to stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Get conversion rates between stages
  async getConversionRates() {
    try {
      const stages = await db('pipeline_stages')
        .select('*')
        .where('is_active', true)
        .orderBy('order_position', 'asc');

      const stageCounts = await db('leads')
        .select('pipeline_stage_id')
        .count('* as count')
        .groupBy('pipeline_stage_id');

      const countsMap = {};
      stageCounts.forEach(item => {
        countsMap[item.pipeline_stage_id] = parseInt(item.count);
      });

      // Calculate conversion rates
      const conversionRates = [];
      for (let i = 0; i < stages.length - 1; i++) {
        const currentStage = stages[i];
        const nextStage = stages[i + 1];
        
        const currentCount = countsMap[currentStage.id] || 0;
        const nextCount = countsMap[nextStage.id] || 0;
        
        const conversionRate = currentCount > 0 ? (nextCount / currentCount) * 100 : 0;
        
        conversionRates.push({
          from_stage: currentStage.name,
          to_stage: nextStage.name,
          from_count: currentCount,
          to_count: nextCount,
          conversion_rate: Math.round(conversionRate * 100) / 100
        });
      }

      return { success: true, data: conversionRates };
    } catch (error) {
      console.error('Error calculating conversion rates:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PipelineService();
