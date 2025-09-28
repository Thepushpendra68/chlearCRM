const { supabaseAdmin } = require('../config/supabase');
const AssignmentRules = require('../utils/assignmentRules');

class AssignmentService {
  // Get all assignment rules
  async getAllRules(currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Check permissions - managers and admins can view rules
      if (!['company_admin', 'super_admin', 'manager'].includes(currentUser.role)) {
        return { success: false, error: 'Access denied' };
      }

      const { data: rules, error } = await supabase
        .from('lead_assignment_rules')
        .select('*')
        .eq('company_id', currentUser.company_id)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching assignment rules:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: rules || [] };
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      return { success: false, error: error.message };
    }
  }

  // Get active assignment rules
  async getActiveRules(currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: rules, error } = await supabase
        .from('lead_assignment_rules')
        .select('*')
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching active assignment rules:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: rules || [] };
    } catch (error) {
      console.error('Error fetching active assignment rules:', error);
      return { success: false, error: error.message };
    }
  }

  // Get assignment rule by ID
  async getRuleById(ruleId, currentUser) {
    try {
      const supabase = supabaseAdmin;

      const { data: rule, error } = await supabase
        .from('lead_assignment_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (error || !rule) {
        return { success: false, error: 'Assignment rule not found' };
      }

      return { success: true, data: rule };
    } catch (error) {
      console.error('Error fetching assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Create new assignment rule
  async createRule(ruleData, currentUser) {
    try {
      // Only admins and managers can create assignment rules
      if (!['company_admin', 'super_admin', 'manager'].includes(currentUser.role)) {
        return { success: false, error: 'Access denied' };
      }

      // Validate conditions
      const validation = AssignmentRules.validateConditions(ruleData.conditions);
      if (!validation.valid) {
        return { success: false, error: `Invalid conditions: ${validation.errors.join(', ')}` };
      }

      const supabase = supabaseAdmin;

      const newRule = {
        name: ruleData.name,
        conditions: ruleData.conditions, // Store as object, not JSON string
        assignment_type: ruleData.assignment_type,
        assigned_to: ruleData.assigned_to || null,
        is_active: ruleData.is_active !== undefined ? ruleData.is_active : true,
        priority: ruleData.priority || 1,
        company_id: currentUser.company_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: rule, error } = await supabase
        .from('lead_assignment_rules')
        .insert(newRule)
        .select()
        .single();

      if (error) {
        console.error('Error creating assignment rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: rule };
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Update assignment rule
  async updateRule(ruleId, ruleData, currentUser) {
    try {
      // Only admins and managers can update assignment rules
      if (!['company_admin', 'super_admin', 'manager'].includes(currentUser.role)) {
        return { success: false, error: 'Access denied' };
      }

      const supabase = supabaseAdmin;

      // Check if rule exists and belongs to company
      const { data: existingRule, error: findError } = await supabase
        .from('lead_assignment_rules')
        .select('*')
        .eq('id', ruleId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (findError || !existingRule) {
        return { success: false, error: 'Assignment rule not found' };
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
        updated_at: new Date().toISOString()
      };

      const { data: updatedRule, error } = await supabase
        .from('lead_assignment_rules')
        .update(updateData)
        .eq('id', ruleId)
        .eq('company_id', currentUser.company_id)
        .select()
        .single();

      if (error) {
        console.error('Error updating assignment rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data: updatedRule };
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Delete assignment rule
  async deleteRule(ruleId, currentUser) {
    try {
      // Only admins and managers can delete assignment rules
      if (!['company_admin', 'super_admin', 'manager'].includes(currentUser.role)) {
        return { success: false, error: 'Access denied' };
      }

      const supabase = supabaseAdmin;

      const { error } = await supabase
        .from('lead_assignment_rules')
        .delete()
        .eq('id', ruleId)
        .eq('company_id', currentUser.company_id);

      if (error) {
        console.error('Error deleting assignment rule:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Assignment rule deleted successfully' };
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      return { success: false, error: error.message };
    }
  }

  // Assign lead manually
  async assignLead(leadId, assignedTo, assignedBy, reason = 'Manual assignment', currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Check if lead exists and belongs to company
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id)
        .single();

      if (leadError || !lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Check if assigned user exists and belongs to company
      const { data: assignedUser, error: userError } = await supabase
        .from('user_profiles_with_auth')
        .select('id')
        .eq('id', assignedTo)
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .single();

      if (userError || !assignedUser) {
        return { success: false, error: 'Assigned user not found' };
      }

      // Update lead assignment
      const { error } = await supabase
        .from('leads')
        .update({
          assigned_to: assignedTo,
          assigned_at: new Date().toISOString(),
          assignment_source: 'manual',
          updated_at: new Date().toISOString()
        })
        .eq('id', leadId)
        .eq('company_id', currentUser.company_id);

      if (error) {
        console.error('Error assigning lead:', error);
        return { success: false, error: error.message };
      }

      return { success: true, message: 'Lead assigned successfully' };
    } catch (error) {
      console.error('Error assigning lead:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk assign leads
  async bulkAssignLeads(leadIds, assignedTo, assignedBy, reason = 'Bulk assignment', currentUser) {
    try {
      const results = [];

      for (const leadId of leadIds) {
        const result = await this.assignLead(leadId, assignedTo, assignedBy, reason, currentUser);
        results.push({ leadId, success: result.success, error: result.error });
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Bulk assignment completed: ${successCount} successful, ${errorCount} failed`,
        results
      };
    } catch (error) {
      console.error('Error in bulk assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // Get assignment history for a lead
  async getLeadAssignmentHistory(leadId, currentUser) {
    try {
      // Since we don't have assignment history table, return basic info
      return {
        success: true,
        data: [],
        message: 'Assignment history not available in current schema'
      };
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      return { success: false, error: error.message };
    }
  }

  // Get team workload distribution
  async getTeamWorkload(currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Get users in the company using the view that includes email
      const { data: users, error: usersError } = await supabase
        .from('user_profiles_with_auth')
        .select('id, first_name, last_name, email')
        .eq('company_id', currentUser.company_id)
        .eq('is_active', true)
        .neq('role', 'super_admin');

      if (usersError) {
        console.error('Error fetching users:', usersError);
        return { success: false, error: usersError.message };
      }

      // Get lead counts by assigned user
      const { data: leadCounts, error: countsError } = await supabase
        .from('leads')
        .select('assigned_to, status')
        .eq('company_id', currentUser.company_id);

      if (countsError) {
        console.error('Error fetching lead counts:', countsError);
        return { success: false, error: countsError.message };
      }

      // Calculate workload for each user
      const workload = users.map(user => {
        const userLeads = leadCounts.filter(lead => lead.assigned_to === user.id);
        const activeLeads = userLeads.filter(lead => lead.status === 'active').length;
        const wonLeads = userLeads.filter(lead => lead.status === 'converted').length;
        const lostLeads = userLeads.filter(lead => lead.status === 'lost').length;

        return {
          user_id: user.id,
          user_name: `${user.first_name} ${user.last_name}`,
          user_email: user.email,
          total_leads: userLeads.length,
          active_leads: activeLeads,
          won_leads: wonLeads,
          lost_leads: lostLeads,
          total_deal_value: 0, // Not available in current schema
          avg_deal_value: 0    // Not available in current schema
        };
      });

      return { success: true, data: workload };
    } catch (error) {
      console.error('Error fetching team workload:', error);
      return { success: false, error: error.message };
    }
  }

  // Redistribute leads based on workload
  async redistributeLeads(assignedBy, currentUser) {
    try {
      // Check permissions - only admins can redistribute leads
      if (!['company_admin', 'super_admin'].includes(currentUser.role)) {
        return { success: false, error: 'Access denied' };
      }

      // Get current workload
      const workloadResult = await this.getTeamWorkload(currentUser);
      if (!workloadResult.success) {
        return workloadResult;
      }

      const workload = workloadResult.data;

      // Find user with minimum leads
      const minLeads = Math.min(...workload.map(w => w.total_leads));
      const targetUser = workload.find(w => w.total_leads === minLeads);

      if (!targetUser) {
        return { success: false, error: 'No target user found for redistribution' };
      }

      // Get unassigned leads
      const supabase = supabaseAdmin;
      const { data: unassignedLeads, error } = await supabase
        .from('leads')
        .select('id')
        .eq('company_id', currentUser.company_id)
        .is('assigned_to', null)
        .limit(10); // Limit to prevent overwhelming

      if (error) {
        console.error('Error fetching unassigned leads:', error);
        return { success: false, error: error.message };
      }

      // Assign unassigned leads to target user
      const results = [];
      for (const lead of unassignedLeads || []) {
        const result = await this.assignLead(lead.id, targetUser.user_id, assignedBy, 'Workload redistribution', currentUser);
        results.push({ leadId: lead.id, success: result.success, error: result.error });
      }

      return {
        success: true,
        message: `Redistributed ${results.filter(r => r.success).length} leads to ${targetUser.user_name}`,
        results
      };
    } catch (error) {
      console.error('Error redistributing leads:', error);
      return { success: false, error: error.message };
    }
  }

  // Get assignment statistics
  async getAssignmentStats(currentUser) {
    try {
      const supabase = supabaseAdmin;

      // Get lead counts by assignment status and source
      const { data: leads, error } = await supabase
        .from('leads')
        .select('assigned_to, assignment_source')
        .eq('company_id', currentUser.company_id);

      if (error) {
        console.error('Error fetching leads for stats:', error);
        return { success: false, error: error.message };
      }

      const totalLeads = leads.length;
      const assignedLeads = leads.filter(lead => lead.assigned_to !== null).length;
      const unassignedLeads = totalLeads - assignedLeads;
      const manualAssignments = leads.filter(lead => lead.assignment_source === 'manual').length;
      const autoAssignments = leads.filter(lead => lead.assignment_source === 'auto').length;
      const ruleAssignments = leads.filter(lead => lead.assignment_source === 'rule').length;

      const stats = {
        total_leads: totalLeads,
        assigned_leads: assignedLeads,
        unassigned_leads: unassignedLeads,
        manual_assignments: manualAssignments,
        auto_assignments: autoAssignments,
        rule_assignments: ruleAssignments
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AssignmentService();
