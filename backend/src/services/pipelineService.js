const { supabaseAdmin } = require('../config/supabase');

class PipelineService {
  // Get all pipeline stages
  async getAllStages(currentUser) {
    try {
      const supabase = supabaseAdmin;

      let query = supabase
        .from('pipeline_stages')
        .select('*')
        .eq('is_active', true)
        .eq('company_id', currentUser.company_id)
        .order('order_position', { ascending: true });

      const { data: stages, error } = await query;

      if (error) {
        console.error('Error fetching pipeline stages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: stages || [] };
    } catch (error) {
      console.error('Error fetching pipeline stages:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new pipeline stage
  async createStage(stageData, currentUser) {
    try {
      const { name, color, order_position } = stageData;

      // Validate required fields
      if (!name || !order_position) {
        return { success: false, error: 'Name and order position are required' };
      }

      // Check if order position already exists
      const { data: existingStage } = await supabaseAdmin
        .from('pipeline_stages')
        .select('id')
        .eq('company_id', currentUser.company_id)
        .eq('order_position', order_position)
        .single();

      if (existingStage) {
        return { success: false, error: 'Order position already exists' };
      }

      const { data: newStage, error } = await supabaseAdmin
        .from('pipeline_stages')
        .insert({
          name,
          color: color || '#3B82F6',
          order_position,
          is_active: true,
          is_closed_won: false,
          is_closed_lost: false,
          company_id: currentUser.company_id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating pipeline stage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: newStage };
    } catch (error) {
      console.error('Error creating pipeline stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Update pipeline stage
  async updateStage(stageId, updateData, currentUser) {
    try {
      const { name, color, order_position, is_active, is_closed_won, is_closed_lost } = updateData;

      // Check if stage exists and belongs to user's company
      const { data: existingStage, error: findError } = await supabaseAdmin
        .from('pipeline_stages')
        .select('*')
        .eq('id', stageId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (findError || !existingStage) {
        return { success: false, error: 'Pipeline stage not found' };
      }

      // If updating order position, check for conflicts
      if (order_position && order_position !== existingStage.order_position) {
        const { data: conflictingStage } = await supabaseAdmin
          .from('pipeline_stages')
          .select('id')
          .eq('company_id', currentUser.company_id)
          .eq('order_position', order_position)
          .neq('id', stageId)
          .single();

        if (conflictingStage) {
          return { success: false, error: 'Order position already exists' };
        }
      }

      const { data: updatedStage, error } = await supabaseAdmin
        .from('pipeline_stages')
        .update({
          ...(name && { name }),
          ...(color && { color }),
          ...(order_position && { order_position }),
          ...(is_active !== undefined && { is_active }),
          ...(is_closed_won !== undefined && { is_closed_won }),
          ...(is_closed_lost !== undefined && { is_closed_lost }),
          updated_at: new Date().toISOString()
        })
        .eq('id', stageId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating pipeline stage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: updatedStage };
    } catch (error) {
      console.error('Error updating pipeline stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete pipeline stage
  async deleteStage(stageId, currentUser) {
    try {
      // Check if stage exists and belongs to user's company
      const { data: existingStage, error: findError } = await supabaseAdmin
        .from('pipeline_stages')
        .select('*')
        .eq('id', stageId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (findError || !existingStage) {
        return { success: false, error: 'Pipeline stage not found' };
      }

      // Check if any leads are using this stage
      const { count: leadsInStage } = await supabaseAdmin
        .from('leads')
        .select('*', { count: 'exact' })
        .eq('company_id', currentUser.company_id)
        .eq('pipeline_stage_id', stageId);

      if (leadsInStage && leadsInStage > 0) {
        return { success: false, error: 'Cannot delete stage with existing leads. Please reassign leads first.' };
      }

      const { error } = await supabaseAdmin
        .from('pipeline_stages')
        .delete()
        .eq('id', stageId)
        .eq('company_id', currentUser.company_id);

      if (error) {
        console.error('Error deleting pipeline stage:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Pipeline stage deleted successfully' };
    } catch (error) {
      console.error('Error deleting pipeline stage:', error);
      return { success: false, error: error.message };
    }
  }

  // Reorder pipeline stages
  async reorderStages(stageOrders, currentUser) {
    try {
      // Validate input
      if (!Array.isArray(stageOrders) || stageOrders.length === 0) {
        return { success: false, error: 'Invalid stage orders provided' };
      }

      // Update each stage's order position
      for (const { id, order_position } of stageOrders) {
        const { error } = await supabaseAdmin
          .from('pipeline_stages')
          .update({
            order_position,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .eq('company_id', currentUser.company_id);

        if (error) {
          console.error('Error updating stage order:', error);
          return { success: false, error: error.message };
        }
      }

      // Return updated stages
      const { data: result, error } = await supabaseAdmin
        .from('pipeline_stages')
        .select('*')
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (error) {
        console.error('Error fetching updated stages:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: result || [] };
    } catch (error) {
      console.error('Error reordering pipeline stages:', error);
      return { success: false, error: error.message };
    }
  }

  // Get pipeline overview with lead counts
  async getPipelineOverview(currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Get stages for the user's company
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (stagesError) {
        console.error('Error fetching stages:', stagesError);
        return { success: false, error: stagesError.message };
      }

      if (!stages || stages.length === 0) {
        return {
          success: true,
          data: {
            stages: [],
            summary: {
              total_leads: 0,
              won_leads: 0,
              lost_leads: 0,
              active_leads: 0
            }
          }
        };
      }

      // Get lead counts for each stage
      const { data: stageCounts, error: countsError } = await supabase
        .from('leads')
        .select('pipeline_stage_id')
        .eq('company_id', currentUser.company_id);

      if (countsError) {
        console.error('Error fetching lead counts:', countsError);
        return { success: false, error: countsError.message };
      }

      // Create a map of stage counts
      const countsMap = {};
      if (stageCounts) {
        stageCounts.forEach(item => {
          countsMap[item.pipeline_stage_id] = (countsMap[item.pipeline_stage_id] || 0) + 1;
        });
      }

      // Add counts to stages
      const stagesWithCounts = stages.map(stage => ({
        ...stage,
        lead_count: countsMap[stage.id] || 0
      }));

      // Calculate total leads
      const totalLeads = stagesWithCounts.reduce((sum, stage) => sum + stage.lead_count, 0);

      // Calculate won/lost counts
      const wonCount = stagesWithCounts
        .filter(stage => stage.is_closed_won)
        .reduce((sum, stage) => sum + stage.lead_count, 0);

      const lostCount = stagesWithCounts
        .filter(stage => stage.is_closed_lost)
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
  async moveLeadToStage(leadId, stageId, userId, currentUser) {
    try {
      // Validate lead exists and belongs to user's company
      const { data: lead, error: leadError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (leadError || !lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Validate stage exists and belongs to user's company
      const { data: stage, error: stageError } = await supabaseAdmin
        .from('pipeline_stages')
        .select('*')
        .eq('id', stageId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (stageError || !stage) {
        return { success: false, error: 'Pipeline stage not found' };
      }

      const previousStageId = lead.pipeline_stage_id;

      // Update lead stage
      const { data: updatedLead, error } = await supabaseAdmin
        .from('leads')
        .update({
          pipeline_stage_id: stageId,
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating lead stage:', error);
        return { success: false, error: error.message };
      }

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
  async getConversionRates(currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Get stages for the user's company
      const { data: stages, error: stagesError } = await supabase
        .from('pipeline_stages')
        .select('*')
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .order('order_position', { ascending: true });

      if (stagesError) {
        console.error('Error fetching stages for conversion rates:', stagesError);
        return { success: false, error: stagesError.message };
      }

      if (!stages || stages.length < 2) {
        return { success: true, data: [] };
      }

      // Get lead counts for each stage
      const { data: stageCounts, error: countsError } = await supabase
        .from('leads')
        .select('pipeline_stage_id')
        .eq('company_id', currentUser.company_id);

      if (countsError) {
        console.error('Error fetching lead counts for conversion rates:', countsError);
        return { success: false, error: countsError.message };
      }

      const countsMap = {};
      if (stageCounts) {
        stageCounts.forEach(item => {
          countsMap[item.pipeline_stage_id] = (countsMap[item.pipeline_stage_id] || 0) + 1;
        });
      }

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

  // Create default pipeline stages for a company
  async createDefaultStages(currentUser) {
    try {
      // Check if company already has stages
      const { data: existingStages, error: checkError } = await supabaseAdmin
        .from('pipeline_stages')
        .select('id')
        .eq('company_id', currentUser.company_id)
        .limit(1);

      if (checkError) {
        console.error('Error checking existing stages:', checkError);
        return { success: false, error: checkError.message };
      }

      if (existingStages && existingStages.length > 0) {
        return { success: false, error: 'Company already has pipeline stages. Delete existing stages first if you want to recreate them.' };
      }

      // Create default stages
      const defaultStages = [
        { name: 'New Lead', color: '#3B82F6', order_position: 1, is_closed_won: false, is_closed_lost: false },
        { name: 'Contacted', color: '#06B6D4', order_position: 2, is_closed_won: false, is_closed_lost: false },
        { name: 'Qualified', color: '#10B981', order_position: 3, is_closed_won: false, is_closed_lost: false },
        { name: 'Proposal Sent', color: '#F59E0B', order_position: 4, is_closed_won: false, is_closed_lost: false },
        { name: 'Negotiation', color: '#F97316', order_position: 5, is_closed_won: false, is_closed_lost: false },
        { name: 'Closed Won', color: '#22C55E', order_position: 6, is_closed_won: true, is_closed_lost: false },
        { name: 'Closed Lost', color: '#EF4444', order_position: 7, is_closed_won: false, is_closed_lost: true },
      ];

      const stagesToInsert = defaultStages.map(stage => ({
        ...stage,
        company_id: currentUser.company_id,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));

      const { data: createdStages, error: insertError } = await supabaseAdmin
        .from('pipeline_stages')
        .insert(stagesToInsert)
        .select();

      if (insertError) {
        console.error('Error creating default stages:', insertError);
        return { success: false, error: insertError.message };
      }

      return { success: true, data: createdStages };
    } catch (error) {
      console.error('Error creating default stages:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new PipelineService();
