/**
 * Assignment Rules Utility
 * Handles evaluation of assignment rules and lead routing logic
 */

class AssignmentRules {
  /**
   * Evaluate assignment rules against lead data
   * @param {Object} leadData - Lead information
   * @param {Array} rules - Array of assignment rules
   * @returns {Object|null} - Matching rule or null
   */
  static evaluateRules(leadData, rules) {
    // Sort rules by priority (higher priority first)
    const sortedRules = rules.sort((a, b) => b.priority - a.priority);
    
    for (const rule of sortedRules) {
      if (!rule.is_active) continue;
      
      if (this.evaluateRule(leadData, rule)) {
        return rule;
      }
    }
    
    return null;
  }

  /**
   * Evaluate a single rule against lead data
   * @param {Object} leadData - Lead information
   * @param {Object} rule - Assignment rule
   * @returns {boolean} - Whether rule matches
   */
  static evaluateRule(leadData, rule) {
    const conditions = rule.conditions;
    
    // Handle different condition types
    for (const [field, condition] of Object.entries(conditions)) {
      if (!this.evaluateCondition(leadData[field], condition)) {
        return false;
      }
    }
    
    return true;
  }

  /**
   * Evaluate a single condition
   * @param {any} value - Lead field value
   * @param {Object} condition - Condition object
   * @returns {boolean} - Whether condition matches
   */
  static evaluateCondition(value, condition) {
    const { operator, expected } = condition;
    
    switch (operator) {
      case 'equals':
        return value === expected;
      
      case 'not_equals':
        return value !== expected;
      
      case 'contains':
        return value && value.toString().toLowerCase().includes(expected.toLowerCase());
      
      case 'not_contains':
        return !value || !value.toString().toLowerCase().includes(expected.toLowerCase());
      
      case 'starts_with':
        return value && value.toString().toLowerCase().startsWith(expected.toLowerCase());
      
      case 'ends_with':
        return value && value.toString().toLowerCase().endsWith(expected.toLowerCase());
      
      case 'in':
        return Array.isArray(expected) && expected.includes(value);
      
      case 'not_in':
        return !Array.isArray(expected) || !expected.includes(value);
      
      case 'greater_than':
        return Number(value) > Number(expected);
      
      case 'less_than':
        return Number(value) < Number(expected);
      
      case 'greater_than_or_equal':
        return Number(value) >= Number(expected);
      
      case 'less_than_or_equal':
        return Number(value) <= Number(expected);
      
      case 'is_empty':
        return !value || value === '';
      
      case 'is_not_empty':
        return value && value !== '';
      
      case 'regex':
        try {
          const regex = new RegExp(expected, 'i');
          return regex.test(value);
        } catch (e) {
          console.error('Invalid regex pattern:', expected);
          return false;
        }
      
      default:
        console.warn('Unknown condition operator:', operator);
        return false;
    }
  }

  /**
   * Get available condition operators
   * @returns {Array} - Array of operator objects
   */
  static getConditionOperators() {
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

  /**
   * Get available lead fields for rule conditions
   * @returns {Array} - Array of field objects
   */
  static getLeadFields() {
    return [
      { value: 'source', label: 'Lead Source', type: 'string' },
      { value: 'status', label: 'Lead Status', type: 'string' },
      { value: 'company', label: 'Company', type: 'string' },
      { value: 'industry', label: 'Industry', type: 'string' },
      { value: 'location', label: 'Location', type: 'string' },
      { value: 'lead_score', label: 'Lead Score', type: 'number' },
      { value: 'deal_value', label: 'Deal Value', type: 'number' },
      { value: 'pipeline_stage_id', label: 'Pipeline Stage', type: 'string' },
      { value: 'created_at', label: 'Created Date', type: 'date' },
      { value: 'last_contact_date', label: 'Last Contact Date', type: 'date' }
    ];
  }

  /**
   * Validate rule conditions
   * @param {Object} conditions - Rule conditions
   * @returns {Object} - Validation result
   */
  static validateConditions(conditions) {
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

  /**
   * Create default assignment rules
   * @returns {Array} - Array of default rules
   */
  static getDefaultRules() {
    return [
      {
        name: 'High Value Leads',
        conditions: {
          deal_value: { operator: 'greater_than', expected: 10000 }
        },
        assignment_type: 'specific_user',
        priority: 10,
        is_active: true
      },
      {
        name: 'Enterprise Leads',
        conditions: {
          company: { operator: 'contains', expected: 'enterprise' }
        },
        assignment_type: 'team',
        priority: 8,
        is_active: true
      },
      {
        name: 'Hot Leads',
        conditions: {
          lead_score: { operator: 'greater_than', expected: 80 }
        },
        assignment_type: 'round_robin',
        priority: 6,
        is_active: true
      },
      {
        name: 'Default Assignment',
        conditions: {
          source: { operator: 'is_not_empty', expected: '' }
        },
        assignment_type: 'round_robin',
        priority: 1,
        is_active: true
      }
    ];
  }
}

module.exports = AssignmentRules;
