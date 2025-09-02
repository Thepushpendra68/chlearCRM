import React, { useState } from 'react';
import activityService from '../../services/activityService';

const QuickActions = ({ leadId, onActivityCreated }) => {
  const [loading, setLoading] = useState(null);
  const [error, setError] = useState(null);

  const quickActions = [
    {
      id: 'call',
      label: 'Log Call',
      icon: '📞',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: async () => {
        const subject = prompt('Call subject:');
        if (!subject) return;
        
        const description = prompt('Call notes (optional):');
        const duration = prompt('Duration in minutes (optional):');
        const outcome = prompt('Outcome (optional):');
        
        try {
          setLoading('call');
          setError(null);
          
          const response = await activityService.logCall(leadId, {
            subject,
            description: description || null,
            duration_minutes: duration ? parseInt(duration) : null,
            outcome: outcome || null
          });
          
          if (response.success) {
            onActivityCreated && onActivityCreated(response.data);
          } else {
            setError(response.error || 'Failed to log call');
          }
        } catch (err) {
          console.error('Error logging call:', err);
          setError('Failed to log call');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'email',
      label: 'Log Email',
      icon: '📧',
      color: 'bg-green-500 hover:bg-green-600',
      action: async () => {
        const subject = prompt('Email subject:');
        if (!subject) return;
        
        const description = prompt('Email content (optional):');
        
        try {
          setLoading('email');
          setError(null);
          
          const response = await activityService.logEmail(leadId, {
            subject,
            description: description || null
          });
          
          if (response.success) {
            onActivityCreated && onActivityCreated(response.data);
          } else {
            setError(response.error || 'Failed to log email');
          }
        } catch (err) {
          console.error('Error logging email:', err);
          setError('Failed to log email');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'note',
      label: 'Add Note',
      icon: '📝',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: async () => {
        const subject = prompt('Note title:');
        if (!subject) return;
        
        const description = prompt('Note content:');
        if (!description) return;
        
        try {
          setLoading('note');
          setError(null);
          
          const response = await activityService.logNote(leadId, {
            subject,
            description
          });
          
          if (response.success) {
            onActivityCreated && onActivityCreated(response.data);
          } else {
            setError(response.error || 'Failed to add note');
          }
        } catch (err) {
          console.error('Error adding note:', err);
          setError('Failed to add note');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'meeting',
      label: 'Schedule Meeting',
      icon: '🤝',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: async () => {
        const subject = prompt('Meeting subject:');
        if (!subject) return;
        
        const description = prompt('Meeting description (optional):');
        const scheduledAt = prompt('Meeting date/time (YYYY-MM-DD HH:MM):');
        const duration = prompt('Duration in minutes (optional):');
        
        try {
          setLoading('meeting');
          setError(null);
          
          const response = await activityService.logMeeting(leadId, {
            subject,
            description: description || null,
            scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
            duration_minutes: duration ? parseInt(duration) : null,
            is_completed: false
          });
          
          if (response.success) {
            onActivityCreated && onActivityCreated(response.data);
          } else {
            setError(response.error || 'Failed to schedule meeting');
          }
        } catch (err) {
          console.error('Error scheduling meeting:', err);
          setError('Failed to schedule meeting');
        } finally {
          setLoading(null);
        }
      }
    },
    {
      id: 'task',
      label: 'Create Task',
      icon: '✅',
      color: 'bg-orange-500 hover:bg-orange-600',
      action: async () => {
        const subject = prompt('Task title:');
        if (!subject) return;
        
        const description = prompt('Task description (optional):');
        const scheduledAt = prompt('Due date/time (YYYY-MM-DD HH:MM, optional):');
        
        try {
          setLoading('task');
          setError(null);
          
          const response = await activityService.createTask(leadId, {
            subject,
            description: description || null,
            scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null
          });
          
          if (response.success) {
            onActivityCreated && onActivityCreated(response.data);
          } else {
            setError(response.error || 'Failed to create task');
          }
        } catch (err) {
          console.error('Error creating task:', err);
          setError('Failed to create task');
        } finally {
          setLoading(null);
        }
      }
    }
  ];

  return (
    <div className="quick-actions">
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="mt-1 text-red-600 hover:text-red-800 text-xs"
          >
            Dismiss
          </button>
        </div>
      )}
      
      <div className="flex flex-wrap gap-2">
        {quickActions.map(action => (
          <button
            key={action.id}
            onClick={action.action}
            disabled={loading === action.id}
            className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
          >
            <span className="text-lg">{action.icon}</span>
            <span>
              {loading === action.id ? 'Processing...' : action.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
