import api from './api';

class AssignmentService {
  // Assignment Rules Management
  async getRules() {
    try {
      const response = await api.get('/assignments/rules');
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment rules:', error);
      throw error;
    }
  }

  async getActiveRules() {
    try {
      const response = await api.get('/assignments/rules/active');
      return response.data;
    } catch (error) {
      console.error('Error fetching active assignment rules:', error);
      throw error;
    }
  }

  async getRuleById(ruleId) {
    try {
      const response = await api.get(`/assignments/rules/${ruleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment rule:', error);
      throw error;
    }
  }

  async createRule(ruleData) {
    try {
      const response = await api.post('/assignments/rules', ruleData);
      return response.data;
    } catch (error) {
      console.error('Error creating assignment rule:', error);
      throw error;
    }
  }

  async updateRule(ruleId, ruleData) {
    try {
      const response = await api.put(`/assignments/rules/${ruleId}`, ruleData);
      return response.data;
    } catch (error) {
      console.error('Error updating assignment rule:', error);
      throw error;
    }
  }

  async deleteRule(ruleId) {
    try {
      const response = await api.delete(`/assignments/rules/${ruleId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting assignment rule:', error);
      throw error;
    }
  }

  // Lead Assignment Operations
  async assignLead(leadId, assignedTo, reason = 'Manual assignment') {
    try {
      const response = await api.post(`/assignments/leads/${leadId}/assign`, {
        assignedTo,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error assigning lead:', error);
      throw error;
    }
  }

  async bulkAssignLeads(leadIds, assignedTo, reason = 'Bulk assignment') {
    try {
      const response = await api.post('/assignments/leads/bulk-assign', {
        leadIds,
        assignedTo,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error bulk assigning leads:', error);
      throw error;
    }
  }

  async getLeadAssignmentHistory(leadId) {
    try {
      const response = await api.get(`/assignments/leads/${leadId}/assignment-history`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  }

  async getAssignmentHistory(params = {}) {
    try {
      const response = await api.get('/assignments/history', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      throw error;
    }
  }

  async autoAssignLead(leadId) {
    try {
      const response = await api.post(`/assignments/leads/${leadId}/auto-assign`);
      return response.data;
    } catch (error) {
      console.error('Error auto-assigning lead:', error);
      throw error;
    }
  }

  async reassignLead(leadId, newAssignedTo, reason = 'Manual reassignment') {
    try {
      const response = await api.post(`/assignments/leads/${leadId}/reassign`, {
        newAssignedTo,
        reason
      });
      return response.data;
    } catch (error) {
      console.error('Error reassigning lead:', error);
      throw error;
    }
  }

  async getAssignmentRecommendations(leadId) {
    try {
      const response = await api.get(`/assignments/leads/${leadId}/recommendations`);
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment recommendations:', error);
      throw error;
    }
  }

  // Bulk Operations
  async processBulkAutoAssignment(leadIds) {
    try {
      const response = await api.post('/assignments/leads/bulk-auto-assign', {
        leadIds
      });
      return response.data;
    } catch (error) {
      console.error('Error processing bulk auto-assignment:', error);
      throw error;
    }
  }

  // Team Management
  async getTeamWorkload() {
    try {
      const response = await api.get('/assignments/workload');
      return response.data;
    } catch (error) {
      console.error('Error fetching team workload:', error);
      throw error;
    }
  }

  async redistributeLeads() {
    try {
      const response = await api.post('/assignments/redistribute');
      return response.data;
    } catch (error) {
      console.error('Error redistributing leads:', error);
      throw error;
    }
  }

  // Statistics and Analytics
  async getAssignmentStats() {
    try {
      const response = await api.get('/assignments/stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching assignment stats:', error);
      throw error;
    }
  }

  async getRoutingStats() {
    try {
      const response = await api.get('/assignments/routing-stats');
      return response.data;
    } catch (error) {
      console.error('Error fetching routing stats:', error);
      throw error;
    }
  }

  // Utility methods for rule building
  getConditionOperators() {
    return [
      { value: 'equals', label: 'Equals', types: ['string', 'number', 'boolean'] },
      { value: 'not_equals', label: 'Not Equals', types: ['string', 'number', 'boolean'] },
      { value: 'contains', label: 'Contains', types: ['string'] },
      { value: 'not_contains', label: 'Does Not Contain', types: ['string'] },
      { value: 'starts_with', label: 'Starts With', types: ['string'] },
      { value: 'ends_with', label: 'Ends With', types: ['string'] },
      { value: 'in', label: 'In List', types: ['string', 'number'] },
      { value: 'not_in', label: 'Not In List', types: ['string', 'number'] },
      { value: 'greater_than', label: 'Greater Than', types: ['number'] },
      { value: 'less_than', label: 'Less Than', types: ['number'] },
      { value: 'greater_than_or_equal', label: 'Greater Than or Equal', types: ['number'] },
      { value: 'less_than_or_equal', label: 'Less Than or Equal', types: ['number'] },
      { value: 'is_empty', label: 'Is Empty', types: ['string'] },
      { value: 'is_not_empty', label: 'Is Not Empty', types: ['string'] },
      { value: 'regex', label: 'Matches Pattern', types: ['string'] }
    ];
  }

  getLeadFields() {
    return [
      { value: 'lead_source', label: 'Lead Source', type: 'string' },
      { value: 'status', label: 'Lead Status', type: 'string' },
      { value: 'company', label: 'Company', type: 'string' },
      { value: 'industry', label: 'Industry', type: 'string' },
      { value: 'location', label: 'Location', type: 'string' },
      { value: 'lead_score', label: 'Lead Score', type: 'number' },
      { value: 'deal_value', label: 'Deal Value', type: 'number' },
      { value: 'pipeline_stage_id', label: 'Pipeline Stage', type: 'string' },
      { value: 'priority', label: 'Priority', type: 'string' },
      { value: 'created_at', label: 'Created Date', type: 'date' },
      { value: 'last_contact_date', label: 'Last Contact Date', type: 'date' }
    ];
  }

  getAssignmentTypes() {
    return [
      { value: 'round_robin', label: 'Round Robin', description: 'Distribute leads evenly among team members' },
      { value: 'specific_user', label: 'Specific User', description: 'Assign to a specific team member' },
      { value: 'team', label: 'Team', description: 'Assign to team members (round-robin within team)' }
    ];
  }

  // Helper method to validate rule conditions
  validateRuleConditions(conditions) {
    const errors = [];
    
    if (!conditions || typeof conditions !== 'object') {
      errors.push('Conditions must be an object');
      return { valid: false, errors };
    }
    
    const leadFields = this.getLeadFields();
    const operators = this.getConditionOperators();
    
    for (const [field, condition] of Object.entries(conditions)) {
      // Validate field
      const fieldDef = leadFields.find(f => f.value === field);
      if (!fieldDef) {
        errors.push(`Unknown field: ${field}`);
        continue;
      }
      
      // Validate condition structure
      if (!condition || typeof condition !== 'object') {
        errors.push(`Invalid condition for field ${field}`);
        continue;
      }
      
      if (!condition.operator) {
        errors.push(`Missing operator for field ${field}`);
        continue;
      }
      
      // Validate operator
      const operatorDef = operators.find(op => op.value === condition.operator);
      if (!operatorDef) {
        errors.push(`Unknown operator: ${condition.operator}`);
        continue;
      }
      
      // Validate operator compatibility with field type
      if (!operatorDef.types.includes(fieldDef.type)) {
        errors.push(`Operator ${condition.operator} is not compatible with field type ${fieldDef.type}`);
        continue;
      }
      
      // Validate expected value
      if (condition.expected === undefined || condition.expected === null) {
        if (!['is_empty', 'is_not_empty'].includes(condition.operator)) {
          errors.push(`Missing expected value for field ${field}`);
        }
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

export default new AssignmentService();
