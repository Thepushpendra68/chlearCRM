import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import activityService from '../../services/activityService';

const ActivityForm = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  leadId, 
  activity = null, 
  initialType = 'note' 
}) => {
  const [formData, setFormData] = useState({
    activity_type: initialType,
    subject: '',
    description: '',
    scheduled_at: '',
    duration_minutes: '',
    outcome: '',
    is_completed: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activityTypes = [
    { value: 'call', label: 'Phone Call', icon: '📞' },
    { value: 'email', label: 'Email', icon: '📧' },
    { value: 'meeting', label: 'Meeting', icon: '🤝' },
    { value: 'note', label: 'Note', icon: '📝' },
    { value: 'task', label: 'Task', icon: '✅' },
    { value: 'sms', label: 'SMS', icon: '💬' }
  ];

  const outcomes = [
    { value: 'successful', label: 'Successful' },
    { value: 'no_answer', label: 'No Answer' },
    { value: 'follow_up_required', label: 'Follow-up Required' },
    { value: 'not_interested', label: 'Not Interested' },
    { value: 'callback_requested', label: 'Callback Requested' },
    { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
    { value: 'proposal_sent', label: 'Proposal Sent' },
    { value: 'deal_closed', label: 'Deal Closed' }
  ];

  useEffect(() => {
    if (activity) {
      setFormData({
        activity_type: activity.activity_type || initialType,
        subject: activity.subject || '',
        description: activity.description || '',
        scheduled_at: activity.scheduled_at ? format(new Date(activity.scheduled_at), "yyyy-MM-dd'T'HH:mm") : '',
        duration_minutes: activity.duration_minutes || '',
        outcome: activity.outcome || '',
        is_completed: activity.is_completed || false
      });
    } else {
      setFormData({
        activity_type: initialType,
        subject: '',
        description: '',
        scheduled_at: '',
        duration_minutes: '',
        outcome: '',
        is_completed: false
      });
    }
  }, [activity, initialType, isOpen]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const activityData = {
        ...formData,
        lead_id: leadId,
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null,
        scheduled_at: formData.scheduled_at || null,
        is_completed: formData.is_completed || formData.activity_type === 'note'
      };

      let response;
      if (activity) {
        response = await activityService.updateActivity(activity.id, activityData);
      } else {
        response = await activityService.createActivity(activityData);
      }

      if (response.success) {
        onSubmit && onSubmit(response.data);
        onClose();
      } else {
        setError(response.error || 'Failed to save activity');
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickComplete = async () => {
    if (!formData.subject.trim()) {
      setError('Subject is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const activityData = {
        ...formData,
        lead_id: leadId,
        is_completed: true,
        completed_at: new Date().toISOString(),
        duration_minutes: formData.duration_minutes ? parseInt(formData.duration_minutes) : null
      };

      const response = await activityService.createActivity(activityData);

      if (response.success) {
        onSubmit && onSubmit(response.data);
        onClose();
      } else {
        setError(response.error || 'Failed to save activity');
      }
    } catch (err) {
      console.error('Error saving activity:', err);
      setError('Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {activity ? 'Edit Activity' : 'Add New Activity'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* Activity Type */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Activity Type
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activityTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, activity_type: type.value }))}
                  className={`p-3 rounded-lg border text-left transition-colors ${
                    formData.activity_type === type.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{type.icon}</span>
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Subject */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Subject *
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter activity subject"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter activity description"
            />
          </div>

          {/* Scheduled Date/Time */}
          {formData.activity_type === 'meeting' || formData.activity_type === 'task' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Scheduled Date/Time
              </label>
              <input
                type="datetime-local"
                name="scheduled_at"
                value={formData.scheduled_at}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          ) : null}

          {/* Duration */}
          {formData.activity_type === 'call' || formData.activity_type === 'meeting' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                name="duration_minutes"
                value={formData.duration_minutes}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter duration in minutes"
              />
            </div>
          ) : null}

          {/* Outcome */}
          {formData.activity_type === 'call' || formData.activity_type === 'meeting' || formData.activity_type === 'email' ? (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Outcome
              </label>
              <select
                name="outcome"
                value={formData.outcome}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select outcome</option>
                {outcomes.map(outcome => (
                  <option key={outcome.value} value={outcome.value}>
                    {outcome.label}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          {/* Completed Checkbox */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                name="is_completed"
                checked={formData.is_completed}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Mark as completed</span>
            </label>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            {!activity && formData.activity_type !== 'task' && (
              <button
                type="button"
                onClick={handleQuickComplete}
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Quick Complete'}
              </button>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Saving...' : (activity ? 'Update Activity' : 'Save Activity')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityForm;
