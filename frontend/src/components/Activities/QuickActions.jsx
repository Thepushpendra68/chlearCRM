import React, { useState } from 'react';

const QuickActions = ({ leadId, onQuickAction }) => {
  const [error, setError] = useState(null);

  const quickActions = [
    {
      id: 'call',
      label: 'Log Call',
      icon: '📞',
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => {
        onQuickAction && onQuickAction(leadId, 'call');
      }
    },
    {
      id: 'email',
      label: 'Log Email',
      icon: '📧',
      color: 'bg-green-500 hover:bg-green-600',
      action: () => {
        onQuickAction && onQuickAction(leadId, 'email');
      }
    },
    {
      id: 'note',
      label: 'Add Note',
      icon: '📝',
      color: 'bg-yellow-500 hover:bg-yellow-600',
      action: () => {
        onQuickAction && onQuickAction(leadId, 'note');
      }
    },
    {
      id: 'meeting',
      label: 'Schedule Meeting',
      icon: '🤝',
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => {
        onQuickAction && onQuickAction(leadId, 'meeting');
      }
    },
    {
      id: 'task',
      label: 'Create Task',
      icon: '✅',
      color: 'bg-orange-500 hover:bg-orange-600',
      action: () => {
        onQuickAction && onQuickAction(leadId, 'task');
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
            disabled={!leadId}
            className={`flex items-center space-x-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${action.color}`}
          >
            <span className="text-lg">{action.icon}</span>
            <span>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
