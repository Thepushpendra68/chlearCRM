import React, { useState, useEffect } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, TrophyIcon } from '../utils/icons';
import axios from 'axios';
import toast from 'react-hot-toast';

const ScoringRules = () => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    rule_type: 'activity',
    activity_type: '',
    field_name: '',
    condition_operator: '=',
    condition_value: '',
    score_value: 0,
    is_active: true
  });

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/scoring/rules', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setRules(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching rules:', error);
      toast.error('Failed to fetch scoring rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      if (editingRule) {
        await axios.put(`/api/scoring/rules/${editingRule.id}`, formData, config);
        toast.success('Scoring rule updated successfully');
      } else {
        await axios.post('/api/scoring/rules', formData, config);
        toast.success('Scoring rule created successfully');
      }

      setShowModal(false);
      setEditingRule(null);
      resetForm();
      fetchRules();
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error(error.response?.data?.message || 'Failed to save scoring rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/scoring/rules/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Scoring rule deleted successfully');
      fetchRules();
    } catch (error) {
      console.error('Error deleting rule:', error);
      toast.error('Failed to delete scoring rule');
    }
  };

  const handleEdit = (rule) => {
    setEditingRule(rule);
    setFormData({
      name: rule.name,
      description: rule.description || '',
      rule_type: rule.rule_type,
      activity_type: rule.activity_type || '',
      field_name: rule.field_name || '',
      condition_operator: rule.condition_operator || '=',
      condition_value: rule.condition_value || '',
      score_value: rule.score_value,
      is_active: rule.is_active
    });
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      rule_type: 'activity',
      activity_type: '',
      field_name: '',
      condition_operator: '=',
      condition_value: '',
      score_value: 0,
      is_active: true
    });
  };

  const getRuleTypeLabel = (type) => {
    const labels = {
      activity: 'Activity-based',
      field: 'Field-based',
      engagement: 'Engagement'
    };
    return labels[type] || type;
  };

  const getScoreBadgeColor = (value) => {
    return value > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Scoring Rules</h1>
            <p className="text-sm text-gray-600 mt-1">
              Configure how leads earn points based on their activities and field values
            </p>
          </div>
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            Add Rule
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {rules.length === 0 ? (
          <div className="text-center py-12">
            <TrophyIcon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No scoring rules yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first scoring rule to start tracking lead engagement
            </p>
            <button
              onClick={() => {
                resetForm();
                setShowModal(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
            >
              <PlusIcon className="w-5 h-5" />
              Create Rule
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {rules.map((rule) => (
              <div key={rule.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {rule.name}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">
                        {getRuleTypeLabel(rule.rule_type)}
                      </span>
                      {!rule.is_active && (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">
                          Inactive
                        </span>
                      )}
                    </div>
                    {rule.description && (
                      <p className="text-sm text-gray-600 mb-3">
                        {rule.description}
                      </p>
                    )}
                    <div className="flex items-center gap-4 text-sm">
                      {rule.rule_type === 'activity' && (
                        <span className="text-gray-600">
                          <strong>Activity:</strong> {rule.activity_type}
                        </span>
                      )}
                      {rule.rule_type === 'field' && (
                        <span className="text-gray-600">
                          <strong>Field:</strong> {rule.field_name}{' '}
                          {rule.condition_operator} {rule.condition_value}
                        </span>
                      )}
                      <span
                        className={`font-semibold ${getScoreBadgeColor(
                          rule.score_value
                        )}`}
                      >
                        {rule.score_value > 0 ? '+' : ''}
                        {rule.score_value} points
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    >
                      <PencilIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <TrashIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-900">
                {editingRule ? 'Edit' : 'Create'} Scoring Rule
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rule Type
                </label>
                <select
                  value={formData.rule_type}
                  onChange={(e) =>
                    setFormData({ ...formData, rule_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="activity">Activity-based</option>
                  <option value="field">Field-based</option>
                  <option value="engagement">Engagement</option>
                </select>
              </div>

              {formData.rule_type === 'activity' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Activity Type
                  </label>
                  <select
                    value={formData.activity_type}
                    onChange={(e) =>
                      setFormData({ ...formData, activity_type: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select activity type</option>
                    <option value="email_opened">Email Opened</option>
                    <option value="email_clicked">Email Clicked</option>
                    <option value="call">Call</option>
                    <option value="meeting">Meeting</option>
                    <option value="form_submit">Form Submitted</option>
                    <option value="note">Note Added</option>
                    <option value="task">Task Completed</option>
                  </select>
                </div>
              )}

              {formData.rule_type === 'field' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Field Name
                    </label>
                    <select
                      value={formData.field_name}
                      onChange={(e) =>
                        setFormData({ ...formData, field_name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    >
                      <option value="">Select field</option>
                      <option value="deal_value">Deal Value</option>
                      <option value="source">Source</option>
                      <option value="status">Status</option>
                      <option value="priority">Priority</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Condition
                      </label>
                      <select
                        value={formData.condition_operator}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            condition_operator: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="=">=</option>
                        <option value=">">{'>'}</option>
                        <option value="<">{'<'}</option>
                        <option value=">=">{'>='}</option>
                        <option value="<=">{'<='}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Value
                      </label>
                      <input
                        type="text"
                        value={formData.condition_value}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            condition_value: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Score Value (points)
                </label>
                <input
                  type="number"
                  value={formData.score_value}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      score_value: parseInt(e.target.value)
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  min="-100"
                  max="100"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use negative values for penalties
                </p>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) =>
                    setFormData({ ...formData, is_active: e.target.checked })
                  }
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingRule(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  {editingRule ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoringRules;
