import React, { useState, useEffect } from 'react';
import assignmentService from '../../services/assignmentService';
import userService from '../../services/userService';

const RuleBuilder = ({ 
  isOpen = true, 
  onClose, 
  rule = null, 
  isReadOnly = false,
  onRuleSaved = null 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    conditions: {},
    assignment_type: 'round_robin',
    assigned_to: '',
    priority: 1,
    is_active: true
  });
  const [users, setUsers] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingRule, setEditingRule] = useState(null);
  const [showAddCondition, setShowAddCondition] = useState(false);
  const [newCondition, setNewCondition] = useState({
    field: '',
    operator: '',
    expected: ''
  });

  const leadFields = assignmentService.getLeadFields();
  const operators = assignmentService.getConditionOperators();
  const assignmentTypes = assignmentService.getAssignmentTypes();

  useEffect(() => {
    if (isOpen) {
      fetchData();
      if (rule) {
        setFormData({
          name: rule.name || '',
          conditions: rule.conditions || {},
          assignment_type: rule.assignment_type || 'round_robin',
          assigned_to: rule.assigned_to || '',
          priority: rule.priority || 1,
          is_active: rule.is_active !== undefined ? rule.is_active : true
        });
        setEditingRule(rule);
      }
    }
  }, [isOpen, rule]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [usersResponse, rulesResponse] = await Promise.all([
        userService.getUsers(),
        assignmentService.getRules()
      ]);

      if (usersResponse.success) {
        setUsers(usersResponse.data.users.filter(user => user.role !== 'admin'));
      }

      if (rulesResponse.success) {
        setRules(rulesResponse.data);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddCondition = () => {
    if (!newCondition.field || !newCondition.operator) {
      setError('Please select field and operator');
      return;
    }

    const fieldDef = leadFields.find(f => f.value === newCondition.field);
    const operatorDef = operators.find(op => op.value === newCondition.operator);

    if (!fieldDef || !operatorDef) {
      setError('Invalid field or operator');
      return;
    }

    // Validate expected value based on operator
    if (!['is_empty', 'is_not_empty'].includes(newCondition.operator) && !newCondition.expected) {
      setError('Expected value is required for this operator');
      return;
    }

    setFormData(prev => ({
      ...prev,
      conditions: {
        ...prev.conditions,
        [newCondition.field]: {
          operator: newCondition.operator,
          expected: newCondition.expected
        }
      }
    }));

    setNewCondition({ field: '', operator: '', expected: '' });
    setShowAddCondition(false);
    setError(null);
  };

  const handleRemoveCondition = (field) => {
    setFormData(prev => {
      const newConditions = { ...prev.conditions };
      delete newConditions[field];
      return {
        ...prev,
        conditions: newConditions
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Rule name is required');
      return;
    }

    if (Object.keys(formData.conditions).length === 0) {
      setError('At least one condition is required');
      return;
    }

    if (formData.assignment_type === 'specific_user' && !formData.assigned_to) {
      setError('Please select a user for specific user assignment');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let response;
      if (editingRule) {
        response = await assignmentService.updateRule(editingRule.id, formData);
      } else {
        response = await assignmentService.createRule(formData);
      }

      if (response.success) {
        if (onRuleSaved) {
          onRuleSaved(response.data);
        }
        if (onClose) {
          onClose();
        }
        // Reset form
        setFormData({
          name: '',
          conditions: {},
          assignment_type: 'round_robin',
          assigned_to: '',
          priority: 1,
          is_active: true
        });
        setEditingRule(null);
        await fetchData();
      } else {
        setError(response.error || 'Failed to save rule');
      }
    } catch (err) {
      console.error('Error saving rule:', err);
      setError('Failed to save rule');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) {
      return;
    }

    try {
      setLoading(true);
      const response = await assignmentService.deleteRule(ruleId);
      
      if (response.success) {
        await fetchData();
      } else {
        setError(response.error || 'Failed to delete rule');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      setError('Failed to delete rule');
    } finally {
      setLoading(false);
    }
  };

  const getOperatorForField = (fieldType) => {
    return operators.filter(op => op.types.includes(fieldType));
  };

  const renderConditionValue = (field, operator) => {
    const fieldDef = leadFields.find(f => f.value === field);
    const operatorDef = operators.find(op => op.value === operator);

    if (!fieldDef || !operatorDef) return null;

    if (['is_empty', 'is_not_empty'].includes(operator)) {
      return <span className="text-gray-500 italic">No value needed</span>;
    }

    if (operator === 'in' || operator === 'not_in') {
      return (
        <input
          type="text"
          value={newCondition.expected}
          onChange={(e) => setNewCondition(prev => ({ ...prev, expected: e.target.value }))}
          placeholder="Comma-separated values"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      );
    }

    if (fieldDef.type === 'number') {
      return (
        <input
          type="number"
          value={newCondition.expected}
          onChange={(e) => setNewCondition(prev => ({ ...prev, expected: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      );
    }

    if (fieldDef.type === 'date') {
      return (
        <input
          type="date"
          value={newCondition.expected}
          onChange={(e) => setNewCondition(prev => ({ ...prev, expected: e.target.value }))}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        />
      );
    }

    return (
      <input
        type="text"
        value={newCondition.expected}
        onChange={(e) => setNewCondition(prev => ({ ...prev, expected: e.target.value }))}
        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
    );
  };

  if (isReadOnly) {
    return (
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-4">
            {rules.map((rule) => (
              <div key={rule.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h4 className="text-lg font-medium text-gray-900">{rule.name}</h4>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        rule.is_active 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {rule.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        Priority: {rule.priority}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      {assignmentTypes.find(t => t.value === rule.assignment_type)?.label}
                      {rule.assignment_type === 'specific_user' && rule.assigned_to && (
                        <span> → {users.find(u => u.id === rule.assigned_to)?.name}</span>
                      )}
                    </p>
                    <div className="mt-2">
                      <p className="text-sm text-gray-700">
                        <strong>Conditions:</strong>
                      </p>
                      <ul className="mt-1 text-sm text-gray-600">
                        {Object.entries(rule.conditions).map(([field, condition]) => {
                          const fieldDef = leadFields.find(f => f.value === field);
                          const operatorDef = operators.find(op => op.value === condition.operator);
                          return (
                            <li key={field} className="ml-4">
                              {fieldDef?.label} {operatorDef?.label} {condition.expected}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setFormData({
                          name: rule.name,
                          conditions: rule.conditions,
                          assignment_type: rule.assignment_type,
                          assigned_to: rule.assigned_to || '',
                          priority: rule.priority,
                          is_active: rule.is_active
                        });
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {rules.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No assignment rules configured. Create your first rule to get started.
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Rule Name */}
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Rule Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            placeholder="e.g., High Value Leads"
          />
        </div>

        {/* Priority */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">
            Priority
          </label>
          <input
            type="number"
            id="priority"
            name="priority"
            value={formData.priority}
            onChange={handleInputChange}
            min="1"
            max="10"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <p className="mt-1 text-sm text-gray-500">Higher numbers have higher priority (1-10)</p>
        </div>

        {/* Conditions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Conditions *
          </label>
          
          {/* Existing Conditions */}
          {Object.keys(formData.conditions).length > 0 && (
            <div className="space-y-2 mb-4">
              {Object.entries(formData.conditions).map(([field, condition]) => {
                const fieldDef = leadFields.find(f => f.value === field);
                const operatorDef = operators.find(op => op.value === condition.operator);
                return (
                  <div key={field} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                    <span className="text-sm">
                      <strong>{fieldDef?.label}</strong> {operatorDef?.label} {condition.expected}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCondition(field)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add New Condition */}
          {showAddCondition ? (
            <div className="border border-gray-200 rounded-md p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Field</label>
                  <select
                    value={newCondition.field}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, field: e.target.value, operator: '' }))}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  >
                    <option value="">Select field</option>
                    {leadFields.map(field => (
                      <option key={field.value} value={field.value}>{field.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Operator</label>
                  <select
                    value={newCondition.operator}
                    onChange={(e) => setNewCondition(prev => ({ ...prev, operator: e.target.value }))}
                    disabled={!newCondition.field}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                  >
                    <option value="">Select operator</option>
                    {newCondition.field && getOperatorForField(leadFields.find(f => f.value === newCondition.field)?.type).map(op => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Value</label>
                  {renderConditionValue(newCondition.field, newCondition.operator)}
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddCondition(false);
                    setNewCondition({ field: '', operator: '', expected: '' });
                  }}
                  className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddCondition}
                  className="px-3 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                >
                  Add Condition
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowAddCondition(true)}
              className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
            >
              + Add Condition
            </button>
          )}
        </div>

        {/* Assignment Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Assignment Type *
          </label>
          <div className="space-y-3">
            {assignmentTypes.map(type => (
              <div key={type.value} className="flex items-start">
                <input
                  type="radio"
                  id={type.value}
                  name="assignment_type"
                  value={type.value}
                  checked={formData.assignment_type === type.value}
                  onChange={handleInputChange}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3">
                  <label htmlFor={type.value} className="text-sm font-medium text-gray-700">
                    {type.label}
                  </label>
                  <p className="text-sm text-gray-500">{type.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Specific User Selection */}
        {formData.assignment_type === 'specific_user' && (
          <div>
            <label htmlFor="assigned_to" className="block text-sm font-medium text-gray-700">
              Assign to User *
            </label>
            <select
              id="assigned_to"
              name="assigned_to"
              value={formData.assigned_to}
              onChange={handleInputChange}
              required
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
              ))}
            </select>
          </div>
        )}

        {/* Active Status */}
        <div className="flex items-center">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleInputChange}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
            Rule is active
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end space-x-3">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : editingRule ? 'Update Rule' : 'Create Rule'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RuleBuilder;
