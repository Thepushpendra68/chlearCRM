const db = require('../config/database');
const assignmentService = require('./assignmentService');
const AssignmentRules = require('../utils/assignmentRules');

class RoutingService {
  /**
   * Auto-assign lead based on rules
   * @param {string} leadId - Lead ID
   * @param {string} assignedBy - User ID who triggered the assignment
   * @returns {Object} - Assignment result
   */
  async autoAssignLead(leadId, assignedBy = null) {
    try {
      const trx = await db.transaction();

      try {
        // Get lead data
        const lead = await trx('leads')
          .select('*')
          .where('id', leadId)
          .first();

        if (!lead) {
          throw new Error('Lead not found');
        }

        // Check if lead is already assigned
        if (lead.assigned_to) {
          return { success: true, message: 'Lead is already assigned', assignedTo: lead.assigned_to };
        }

        // Get active assignment rules
        const rulesResult = await assignmentService.getActiveRules();
        if (!rulesResult.success) {
          throw new Error(rulesResult.error);
        }

        const rules = rulesResult.data;
        if (rules.length === 0) {
          // No rules available, use round-robin as fallback
          return await this.roundRobinAssignment(leadId, assignedBy);
        }

        // Evaluate rules against lead data
        const matchingRule = AssignmentRules.evaluateRules(lead, rules);
        
        if (!matchingRule) {
          // No rule matches, use round-robin as fallback
          return await this.roundRobinAssignment(leadId, assignedBy);
        }

        // Execute assignment based on rule type
        let assignedTo = null;
        let assignmentSource = 'rule';

        switch (matchingRule.assignment_type) {
          case 'specific_user':
            assignedTo = matchingRule.assigned_to;
            break;
          
          case 'round_robin':
            const roundRobinResult = await this.getRoundRobinUser();
            if (roundRobinResult.success) {
              assignedTo = roundRobinResult.data;
            }
            break;
          
          case 'team':
            // For team assignment, we'll use round-robin among team members
            const teamResult = await this.getTeamRoundRobinUser();
            if (teamResult.success) {
              assignedTo = teamResult.data;
            }
            break;
          
          default:
            throw new Error(`Unknown assignment type: ${matchingRule.assignment_type}`);
        }

        if (!assignedTo) {
          throw new Error('No user available for assignment');
        }

        // Assign the lead
        await trx('leads')
          .where('id', leadId)
          .update({
            assigned_to: assignedTo,
            assigned_at: new Date(),
            assignment_source: assignmentSource,
            assignment_rule_id: matchingRule.id,
            updated_at: new Date()
          });

        // Record assignment history
        await trx('lead_assignment_history').insert({
          lead_id: leadId,
          previous_assigned_to: null,
          new_assigned_to: assignedTo,
          assigned_by: assignedBy,
          assignment_reason: `Auto-assigned by rule: ${matchingRule.name}`
        });

        await trx.commit();

        return {
          success: true,
          message: `Lead assigned by rule: ${matchingRule.name}`,
          assignedTo,
          rule: matchingRule
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Round-robin assignment among all active users
   * @param {string} leadId - Lead ID
   * @param {string} assignedBy - User ID who triggered the assignment
   * @returns {Object} - Assignment result
   */
  async roundRobinAssignment(leadId, assignedBy = null) {
    try {
      const trx = await db.transaction();

      try {
        // Get next user in round-robin sequence
        const userResult = await this.getRoundRobinUser();
        if (!userResult.success) {
          throw new Error(userResult.error);
        }

        const assignedTo = userResult.data;

        // Assign the lead
        await trx('leads')
          .where('id', leadId)
          .update({
            assigned_to: assignedTo,
            assigned_at: new Date(),
            assignment_source: 'auto',
            assignment_rule_id: null,
            updated_at: new Date()
          });

        // Record assignment history
        await trx('lead_assignment_history').insert({
          lead_id: leadId,
          previous_assigned_to: null,
          new_assigned_to: assignedTo,
          assigned_by: assignedBy,
          assignment_reason: 'Round-robin assignment'
        });

        await trx.commit();

        return {
          success: true,
          message: 'Lead assigned using round-robin',
          assignedTo
        };
      } catch (error) {
        await trx.rollback();
        throw error;
      }
    } catch (error) {
      console.error('Error in round-robin assignment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get next user in round-robin sequence
   * @returns {Object} - User result
   */
  async getRoundRobinUser() {
    try {
      // Get all active users (excluding admins)
      const users = await db('users')
        .select('id', 'name', 'email')
        .where('is_active', true)
        .where('role', '!=', 'admin')
        .orderBy('id', 'asc');

      if (users.length === 0) {
        return { success: false, error: 'No active users available for assignment' };
      }

      // Get current assignment counts for each user
      const assignmentCounts = await db('leads')
        .select('assigned_to')
        .count('* as count')
        .whereNotNull('assigned_to')
        .groupBy('assigned_to');

      const countsMap = {};
      assignmentCounts.forEach(item => {
        countsMap[item.assigned_to] = parseInt(item.count);
      });

      // Find user with minimum assignments
      let minCount = Infinity;
      let selectedUser = null;

      for (const user of users) {
        const count = countsMap[user.id] || 0;
        if (count < minCount) {
          minCount = count;
          selectedUser = user;
        }
      }

      return { success: true, data: selectedUser.id };
    } catch (error) {
      console.error('Error getting round-robin user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get next user in team round-robin sequence
   * @returns {Object} - User result
   */
  async getTeamRoundRobinUser() {
    try {
      // For now, this is the same as regular round-robin
      // In the future, this could be enhanced to work with specific teams
      return await this.getRoundRobinUser();
    } catch (error) {
      console.error('Error getting team round-robin user:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process auto-assignment for multiple leads
   * @param {Array} leadIds - Array of lead IDs
   * @param {string} assignedBy - User ID who triggered the assignment
   * @returns {Object} - Assignment results
   */
  async processBulkAutoAssignment(leadIds, assignedBy = null) {
    try {
      const results = [];

      for (const leadId of leadIds) {
        const result = await this.autoAssignLead(leadId, assignedBy);
        results.push({
          leadId,
          success: result.success,
          message: result.message,
          assignedTo: result.assignedTo,
          error: result.error
        });
      }

      const successCount = results.filter(r => r.success).length;
      const errorCount = results.filter(r => !r.success).length;

      return {
        success: true,
        message: `Bulk auto-assignment completed: ${successCount} successful, ${errorCount} failed`,
        results
      };
    } catch (error) {
      console.error('Error in bulk auto-assignment:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Reassign lead to different user
   * @param {string} leadId - Lead ID
   * @param {string} newAssignedTo - New user ID
   * @param {string} assignedBy - User ID who triggered the reassignment
   * @param {string} reason - Reason for reassignment
   * @returns {Object} - Reassignment result
   */
  async reassignLead(leadId, newAssignedTo, assignedBy, reason = 'Manual reassignment') {
    try {
      return await assignmentService.assignLead(leadId, newAssignedTo, assignedBy, reason);
    } catch (error) {
      console.error('Error reassigning lead:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get assignment recommendations for a lead
   * @param {string} leadId - Lead ID
   * @returns {Object} - Recommendation result
   */
  async getAssignmentRecommendations(leadId) {
    try {
      // Get lead data
      const lead = await db('leads')
        .select('*')
        .where('id', leadId)
        .first();

      if (!lead) {
        return { success: false, error: 'Lead not found' };
      }

      // Get active rules
      const rulesResult = await assignmentService.getActiveRules();
      if (!rulesResult.success) {
        return rulesResult;
      }

      const rules = rulesResult.data;
      const recommendations = [];

      // Evaluate each rule
      for (const rule of rules) {
        if (AssignmentRules.evaluateRule(lead, rule)) {
          let recommendedUser = null;

          switch (rule.assignment_type) {
            case 'specific_user':
              recommendedUser = rule.assigned_to;
              break;
            case 'round_robin':
            case 'team':
              const userResult = await this.getRoundRobinUser();
              if (userResult.success) {
                recommendedUser = userResult.data;
              }
              break;
          }

          if (recommendedUser) {
            recommendations.push({
              rule,
              recommendedUser,
              confidence: rule.priority / 10 // Convert priority to confidence score
            });
          }
        }
      }

      // Sort by confidence (highest first)
      recommendations.sort((a, b) => b.confidence - a.confidence);

      return {
        success: true,
        data: {
          lead,
          recommendations
        }
      };
    } catch (error) {
      console.error('Error getting assignment recommendations:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get routing statistics
   * @returns {Object} - Statistics result
   */
  async getRoutingStats() {
    try {
      const stats = await db('leads')
        .select(
          db.raw('COUNT(*) as total_leads'),
          db.raw('COUNT(CASE WHEN assigned_to IS NOT NULL THEN 1 END) as assigned_leads'),
          db.raw('COUNT(CASE WHEN assignment_source = ? THEN 1 END) as auto_assigned', ['auto']),
          db.raw('COUNT(CASE WHEN assignment_source = ? THEN 1 END) as rule_assigned', ['rule']),
          db.raw('COUNT(CASE WHEN assignment_source = ? THEN 1 END) as manually_assigned', ['manual'])
        )
        .first();

      // Get rule usage statistics
      const ruleStats = await db('leads')
        .select('lar.name as rule_name', 'lar.id as rule_id')
        .count('l.id as usage_count')
        .from('lead_assignment_rules as lar')
        .leftJoin('leads as l', 'lar.id', 'l.assignment_rule_id')
        .where('lar.is_active', true)
        .groupBy('lar.id', 'lar.name')
        .orderBy('usage_count', 'desc');

      return {
        success: true,
        data: {
          ...stats,
          ruleUsage: ruleStats
        }
      };
    } catch (error) {
      console.error('Error getting routing stats:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new RoutingService();
