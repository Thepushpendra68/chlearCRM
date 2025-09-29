import React from 'react';
import { format, formatDistanceToNow } from 'date-fns';

const ActivityDetail = ({ isOpen, onClose, activity, onEdit }) => {
  if (!isOpen || !activity) return null;

  const getActivityIcon = (type) => {
    const iconClass = "w-6 h-6";

    switch (type) {
      case 'call':
        return (
          <svg className={`${iconClass} text-blue-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        );
      case 'email':
        return (
          <svg className={`${iconClass} text-green-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        );
      case 'meeting':
        return (
          <svg className={`${iconClass} text-purple-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        );
      case 'note':
        return (
          <svg className={`${iconClass} text-yellow-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        );
      case 'task':
        return (
          <svg className={`${iconClass} text-orange-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      case 'sms':
        return (
          <svg className={`${iconClass} text-indigo-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        );
      default:
        return (
          <svg className={`${iconClass} text-gray-400`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const formatActivityTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else {
      return format(date, 'MMM dd, yyyy h:mm a');
    }
  };

  const getActivityTypeLabel = (type) => {
    if (!type) return 'Unknown';

    switch (type) {
      case 'call': return 'Phone Call';
      case 'email': return 'Email';
      case 'meeting': return 'Meeting';
      case 'note': return 'Note';
      case 'task': return 'Task';
      case 'sms': return 'SMS';
      default: return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  const getStatusBadge = () => {
    if (activity.is_completed) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Completed
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          Pending
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getActivityIcon(activity?.activity_type || activity?.type)}
              <h2 className="text-xl font-semibold text-gray-900">
                Activity Details
              </h2>
            </div>
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
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <div className="space-y-6">
            {/* Activity Type and Status */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-medium text-gray-900">{activity?.subject || 'No Subject'}</h3>
                <p className="text-sm text-gray-500 mt-1">{getActivityTypeLabel(activity?.activity_type || activity?.type)}</p>
              </div>
              {getStatusBadge()}
            </div>

            {/* Description */}
            {activity.description && (
              <div>
                <h4 className="text-sm font-medium text-gray-700 mb-2">Description</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{activity.description}</p>
                </div>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Lead Information */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Lead Information</h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    {activity.company && (
                      <p className="font-medium text-blue-900">{activity.company}</p>
                    )}
                    {activity.contact_name && (
                      <p className="text-blue-800">{activity.contact_name}</p>
                    )}
                    {activity.email && (
                      <p className="text-blue-700 text-sm">{activity.email}</p>
                    )}
                    {activity.phone && (
                      <p className="text-blue-700 text-sm">{activity.phone}</p>
                    )}
                  </div>
                </div>

                {/* Duration */}
                {activity.duration_minutes && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Duration</h4>
                    <p className="text-gray-900">{activity.duration_minutes} minutes</p>
                  </div>
                )}

                {/* Outcome */}
                {activity.outcome && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Outcome</h4>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                      {activity.outcome.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </div>
                )}
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* Assigned User */}
                {activity.first_name && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Assigned To</h4>
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-gray-600">
                          {activity.first_name?.charAt(0) || ''}{activity.last_name?.charAt(0) || ''}
                        </span>
                      </div>
                      <span className="text-gray-900">{activity.first_name} {activity.last_name}</span>
                    </div>
                  </div>
                )}

                {/* Scheduled Date */}
                {activity.scheduled_at && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Scheduled</h4>
                    <p className="text-gray-900">{format(new Date(activity.scheduled_at), 'MMM dd, yyyy h:mm a')}</p>
                  </div>
                )}

                {/* Created Date */}
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Created</h4>
                  <p className="text-gray-900">{formatActivityTime(activity.created_at)}</p>
                </div>

                {/* Updated Date */}
                {activity.updated_at && activity.updated_at !== activity.created_at && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h4>
                    <p className="text-gray-900">{formatActivityTime(activity.updated_at)}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Close
            </button>
            {onEdit && (
              <button
                onClick={() => {
                  onEdit(activity);
                  onClose();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Edit Activity
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ActivityDetail;