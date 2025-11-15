import React, { useMemo } from 'react';
import { format } from 'date-fns';

const LeadCard = ({ lead, onDragStart, onDragEnd, onClick }) => {
  // Memoize currency formatter to prevent recreation on every render
  const formatCurrency = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    return (amount) => formatter.format(amount);
  }, []);

  // Memoize priority colors to prevent recreation
  const priorityColors = useMemo(() => ({
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-green-100 text-green-800 border-green-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  }), []);

  // Memoize status colors
  const statusColors = useMemo(() => ({
    hot: 'bg-red-500',
    warm: 'bg-orange-500',
    cold: 'bg-blue-500',
    default: 'bg-gray-500'
  }), []);

  // Memoize computed values to prevent unnecessary recalculations
  const computedValues = useMemo(() => {
    const displayName = lead.company || 'No Company';
    const contactName = lead.first_name && lead.last_name
      ? `${lead.first_name} ${lead.last_name}`
      : 'No Contact';
    const formattedDate = lead.expected_close_date
      ? format(new Date(lead.expected_close_date), 'dd-MM-yyyy')
      : null;
    const assignedUserName = lead.assigned_user_first_name || lead.assigned_user_last_name
      ? `${lead.assigned_user_first_name || ''} ${lead.assigned_user_last_name || ''}`.trim()
      : null;
    const formattedCreatedDate = format(new Date(lead.created_at), 'MMM dd');

    return {
      displayName,
      contactName,
      formattedDate,
      assignedUserName,
      formattedCreatedDate
    };
  }, [lead.company, lead.first_name, lead.last_name, lead.expected_close_date, lead.assigned_user_first_name, lead.assigned_user_last_name, lead.created_at]);

  const getPriorityColor = (priority) => {
    return priorityColors[priority?.toLowerCase()] || priorityColors.default;
  };

  const getStatusColor = (status) => {
    return statusColors[status?.toLowerCase()] || statusColors.default;
  };

  return (
    <div
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow duration-200 mb-3"
      draggable
      onDragStart={(e) => onDragStart(e, lead)}
      onDragEnd={onDragEnd}
      onClick={() => onClick(lead)}
    >
      {/* Lead Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h4 className="font-semibold text-gray-900 text-sm leading-tight">
            {computedValues.displayName}
          </h4>
          <p className="text-gray-600 text-xs mt-1">
            {computedValues.contactName}
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {lead.priority && (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(lead.priority)}`}>
              {lead.priority}
            </span>
          )}
          {lead.status && (
            <div className={`w-3 h-3 rounded-full ${getStatusColor(lead.status)}`} title={lead.status} />
          )}
        </div>
      </div>

      {/* Lead Details */}
      <div className="space-y-2">
        {lead.email && (
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {lead.email}
          </div>
        )}

        {lead.phone && (
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {lead.phone}
          </div>
        )}

        {lead.deal_value && lead.deal_value > 0 && (
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
            {formatCurrency(lead.deal_value)}
          </div>
        )}

        {computedValues.formattedDate && (
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {computedValues.formattedDate}
          </div>
        )}
      </div>

      {/* Assignment Info */}
      {computedValues.assignedUserName && (
        <div className="flex items-center text-xs text-gray-600 mt-2">
          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Assigned to {computedValues.assignedUserName}</span>
        </div>
      )}

      {/* Lead Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <span>Created {computedValues.formattedCreatedDate}</span>
        </div>
        {lead.probability && lead.probability > 0 && (
          <div className="text-xs font-medium text-gray-700">
            {lead.probability}%
          </div>
        )}
      </div>
    </div>
  );
};

// Memoize the LeadCard component to prevent unnecessary re-renders
// This is critical for list items in the pipeline board
export default React.memo(LeadCard, (prevProps, nextProps) => {
  // Custom comparison function for more fine-grained control
  // Only re-render if the lead data actually changed
  return (
    prevProps.lead.id === nextProps.lead.id &&
    prevProps.lead.company === nextProps.lead.company &&
    prevProps.lead.first_name === nextProps.lead.first_name &&
    prevProps.lead.last_name === nextProps.lead.last_name &&
    prevProps.lead.email === nextProps.lead.email &&
    prevProps.lead.phone === nextProps.lead.phone &&
    prevProps.lead.deal_value === nextProps.lead.deal_value &&
    prevProps.lead.expected_close_date === nextProps.lead.expected_close_date &&
    prevProps.lead.assigned_user_first_name === nextProps.lead.assigned_user_first_name &&
    prevProps.lead.assigned_user_last_name === nextProps.lead.assigned_user_last_name &&
    prevProps.lead.status === nextProps.lead.status &&
    prevProps.lead.priority === nextProps.lead.priority &&
    prevProps.lead.probability === nextProps.lead.probability &&
    prevProps.lead.created_at === nextProps.lead.created_at &&
    prevProps.onDragStart === nextProps.onDragStart &&
    prevProps.onDragEnd === nextProps.onDragEnd &&
    prevProps.onClick === nextProps.onClick
  );
});
