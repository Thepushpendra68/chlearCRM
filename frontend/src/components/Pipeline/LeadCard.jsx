import React from 'react';
import { format } from 'date-fns';

const LeadCard = ({ lead, onDragStart, onDragEnd, onClick }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'hot':
        return 'bg-red-500';
      case 'warm':
        return 'bg-orange-500';
      case 'cold':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
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
            {lead.company || 'No Company'}
          </h4>
          <p className="text-gray-600 text-xs mt-1">
            {lead.first_name && lead.last_name ? `${lead.first_name} ${lead.last_name}` : 'No Contact'}
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

        {lead.expected_close_date && (
          <div className="flex items-center text-xs text-gray-600">
            <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            {format(new Date(lead.expected_close_date), 'dd-MM-yyyy')}
          </div>
        )}
      </div>

      {/* Assignment Info */}
      {(lead.assigned_user_first_name || lead.assigned_user_last_name) && (
        <div className="flex items-center text-xs text-gray-600 mt-2">
          <svg className="w-3 h-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span>Assigned to {lead.assigned_user_first_name} {lead.assigned_user_last_name}</span>
        </div>
      )}

      {/* Lead Footer */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
        <div className="flex items-center text-xs text-gray-500">
          <span>Created {format(new Date(lead.created_at), 'MMM dd')}</span>
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

export default LeadCard;
