const db = require('../config/database');
const AssignmentRules = require('../utils/assignmentRules');

class AssignmentService {
  // Get all assignment rules
  async getAllRules() {
    try {
      const rules = await db('lead_assignment_rules')
        .select('*')
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'asc');
      
      return { success: true, data: rules };
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active assignment rules
  async getActiveRules() {
    try {
      const rules = await db('lead_assignment_rules')
        .select('*')
        .where('is_active', true)
        .orderBy('priority', 'desc')
        .orderBy('created_at', 'asc');
      
      return { success: true, data: rules };
    } catch (error) {
      console.error('Error fetching active assignment rules:', error);
      return { success: false, error: error.message };
    }
  }

  // Get assignment rule by ID
  async getRuleById(ruleId) {
    try {
      const rule = await db('lead_assignment_rules')
        .select('*')
        .where('id', ruleId)
        .first();
      
      if (!rule) {
        return { success: false, error: 'Assignment rule not found' };
      }
      
      return { success: true, data: rule };
    } catch (error) {
      console.error('Error fetching assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new assignment rule
  async createRule(ruleData) {
    try {
      // Validate conditions
      const validation = AssignmentRules.validateConditions(ruleData.conditions);
      if (!validation.valid) {
        return { success: false, error: `Invalid conditions: ${validation.errors.join(', ')}` };
      }

      const newRule = {
        name: ruleData.name,
        conditions: JSON.stringify(ruleData.conditions),
        assignment_type: ruleData.assignment_type,
        assigned_to: ruleData.assigned_to || null,
        is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
        priority: ruleData.priority || 1,
        created_at: new Date(),
        updated_at: new Date()
      };

      const [ruleId] = await db('lead_assignment_rules').insert(newRule).returning('id');
      
      // Fetch the created rule
      const createdRule = await this.getRuleById(ruleId.id);
      
      return { success: true, data: createdRule.data };
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Update assignment rule
  async updateRule(ruleId, ruleData) {
    try {
      // Check if rule exists
      const existingRule = await this.getRuleById(ruleId);
      if (!existingRule.success) {
        return existingRule;
      }

      // Validate conditions if provided
      if (ruleData.conditions) {
        const validation = AssignmentRules.validateConditions(ruleData.conditions);
        if (!validation.valid) {
          return { success: false, error: `Invalid conditions: ${validation.errors.join(', ')}` };
        }
      }

      const updateData = {
        ...ruleData,
        updated_at: new Date()
      };

      // Convert conditions to JSON if provided
      if (updateData.conditions) {
        updateData.conditions = JSON.stringify(updateData.conditions);
      }

      await db('lead_assignment_rules')
        .where('id', ruleId)
        .update(updateData);

      // Fetch the updated rule
      const updatedRule = await this.getRuleById(ruleId);
      
      return { success: true, data: updatedRule.data };
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete assignment rule
  async deleteRule(ruleId) {
    try {
      const result = await db('lead_assignment_rules')
        .where('id', ruleId)
        .del();
      
      if (result === 0) {
        return { success: false, error: 'Assignment rule not found' };
      }
      
      return { success: true, message: 'Assignment rule deleted successfully' };
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Assign lead manually
  async assignLead(leadId, assignedTo, assignedBy, reason = 'Manual assignment') {
    try {
      const trx = await db.transaction();

      try {
        // Get current lead assignment
        const lead = await trx('leads')
          .select('assigned_to')
          .where('id', leadId)
          .first();

        if (!lead) {
          throw new Error('Lead not found');
        }

        // Update lead assignment
        await trx('leads')
          .where('id', leadId)
          .update({
            assigned_to: assignedTo,
            assigned_at: new Date(),
            assignment_source: 'manual',
            assignment_rule_id: null,
            updated_at: new Date()
          });

        // Record assignment history
        await trx('lead_assignment_history').insert({
          lead_id: leadId,
          previous_assigned_to: lead.assigned_to,
          new_assigned_to: assignedTo,
          assigned_by: assignedBy,
          assignment_reason: reason
        });

        await trx.commit();

        return { success: true, message: 'Lead assigned successfully' };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error assigning lead:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk assign leads
  async bulkAssignLeads(leadIds, assignedTo, assignedBy, reason = 'Bulk assignment') {
    try {
      const trx = await db.transaction();

      try {
        const results = [];

        for (const leadId of leadIds) {
          const result = await this.assignLead(leadId, assignedTo, assignedBy, reason);
          results.push({ leadId, success: result.success, error: result.error });
        }

        await trx.commit();

        const successCount = results.filter(r => r.success).length;
        const errorCount = results.filter(r => !r.success).length;

        return {
          success: true,
          message: `Bulk assignment completed: ${successCount} successful, ${errorCount} failed`,
          results
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get assignment history for a lead
  async getLeadAssignmentHistory(leadId) {
    try {
      const history = await db('lead_assignment_history')
        .select(
          'lah.*',
          db.raw("CONCAT(u1.first_name, ' ', u1.last_name) as assigned_by_name"),
          'u1.email as assigned_by_email',
          db.raw("CONCAT(u2.first_name, ' ', u2.last_name) as previous_assigned_name"),
          'u2.email as previous_assigned_email',
          db.raw("CONCAT(u3.first_name, ' ', u3.last_name) as new_assigned_name"),
          'u3.email as new_assigned_email'
        )
        .from('lead_assignment_history as lah')
        .leftJoin('users as u1', 'lah.assigned_by', 'u1.id')
        .leftJoin('users as u2', 'lah.previous_assigned_to', 'u2.id')
        .leftJoin('users as u3', 'lah.new_assigned_to', 'u3.id')
        .where('lah.lead_id', leadId)
        .orderBy('lah.created_at', 'desc');

      return { success: true, data: history };
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      return { success: false, error: error.message };
    }
  }

  // Get team workload distribution
  async getTeamWorkload() {
    try {
      const workload = await db('leads')
        .select(
          'u.id as user_id',
          db.raw("CONCAT(u.first_name, ' ', u.last_name) as user_name"),
          'u.email as user_email',
          db.raw('COUNT(l.id) as total_leads'),
          db.raw('COUNT(CASE WHEN l.status = ? THEN 1 END) as active_leads', ['active']),
          db.raw('COUNT(CASE WHEN l.status = ? THEN 1 END) as won_leads', ['won']),
          db.raw('COUNT(CASE WHEN l.status = ? THEN 1 END) as lost_leads', ['lost']),
          db.raw('COALESCE(SUM(l.deal_value), 0) as total_deal_value'),
          db.raw('COALESCE(AVG(l.deal_value), 0) as avg_deal_value')
        )
        .from('users as u')
        .leftJoin('leads as l', 'u.id', 'l.assigned_to')
        .where('u.role', '!=', 'admin')
        .groupBy('u.id', 'u.first_name', 'u.last_name', 'u.email')
        .orderBy('total_leads', 'desc');

      return { success: true, data: workload };
    } catch (error) {
      console.error('Error fetching team workload:', error);
      return { success: false, error: error.message };
    }
  }

  // Redistribute leads based on workload
  async redistributeLeads(assignedBy) {
    try {
      const trx = await db.transaction();

      try {
        // Get current workload
        const workloadResult = await this.getTeamWorkload();
        if (!workloadResult.success) {
          throw new Error(workloadResult.error);
        }

        const workload = workloadResult.data;
        
        // Find user with minimum leads
        const minLeads = Math.min(...workload.map(w => w.total_leads));
        const targetUser = workload.find(w => w.total_leads === minLeads);

        if (!targetUser) {
          throw new Error('No target user found for redistribution');
        }

        // Get unassigned leads
        const unassignedLeads = await trx('leads')
          .select('id')
          .whereNull('assigned_to')
          .limit(10); // Limit to prevent overwhelming

        // Assign unassigned leads to target user
        const results = [];
        for (const lead of unassignedLeads) {
          const result = await this.assignLead(lead.id, targetUser.user_id, assignedBy, 'Workload redistribution');
          results.push({ leadId: lead.id, success: result.success, error: result.error });
        }

        await trx.commit();

        return {
          success: true,
          message: `Redistributed ${results.filter(r => r.success).length} leads to ${targetUser.user_name}`,
          results
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error redistributing leads:', error);
      return { success: false, error: error.message };
    }
  }

  // Get assignment statistics
  async getAssignmentStats() {
    try {
      const stats = await db('leads')
        .select(
          db.raw('COUNT(*) as total_leads'),
          db.raw('COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_leads'),
          db.raw('COUNT(CASE WHEN assigned_to IS NULL THEN 1 END) as unassigned_leads'),
          db.raw('COUNT(CASE WHEN assignment_source = ? THEN 1 END) as manual_assignments', ['manual']),
          db.raw('COUNT(CASE WHEN assignment_source = ? THEN 1 END) as auto_assignments', ['auto']),
          db.raw('COUNT(CASE WHEN assignment_source = ? THEN 1 END) as rule_assignments', ['rule'])
        )
        .first();

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AssignmentService();
