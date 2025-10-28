import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import activityService from '../../services/activityService';

const Timeline = ({ leadId, onActivityClick, onAddActivity }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    if (leadId) {
      fetchTimeline();
      fetchSummary();
    }
  }, [leadId]);

  const fetchTimeline = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await activityService.getLeadTimeline(leadId, {
        limit: 50,
        include_activities: true,
        include_stage_changes: true,
        include_assignments: true
      });

      if (response.success) {
        setTimeline(response.data);
      }
    } catch (err) {
      console.error('Error fetching timeline:', err);
      setError('Failed to load timeline');
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await activityService.getLeadTimelineSummary(leadId);
      if (response.success) {
        setSummary(response.data);
      }
    } catch (err) {
      console.error('Error fetching timeline summary:', err);
    }
  };

  const getActivityIcon = (type) => {
    const iconClass = "w-5 h-5";
    
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
      case 'stage_change':
        return (
          <svg className={`${iconClass} text-indigo-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'assignment_change':
        return (
          <svg className={`${iconClass} text-gray-500`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
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

  const getActivityColor = (type) => {
    switch (type) {
      case 'call': return 'bg-blue-100 border-blue-200';
      case 'email': return 'bg-green-100 border-green-200';
      case 'meeting': return 'bg-purple-100 border-purple-200';
      case 'note': return 'bg-yellow-100 border-yellow-200';
      case 'task': return 'bg-orange-100 border-orange-200';
      case 'stage_change': return 'bg-indigo-100 border-indigo-200';
      case 'assignment_change': return 'bg-gray-100 border-gray-200';
      default: return 'bg-gray-100 border-gray-200';
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

  const renderActivityContent = (item) => {
    switch (item.type) {
      case 'stage_change':
        return (
          <div>
            <p className="text-sm text-gray-900 font-medium">{item.subject}</p>
            {item.stage && (
              <div className="mt-1 flex items-center">
                <div 
                  className="w-3 h-3 rounded-full mr-2" 
                  style={{ backgroundColor: item.stage.color }}
                />
                <span className="text-sm text-gray-600">{item.stage.name}</span>
              </div>
            )}
          </div>
        );
      
      case 'assignment_change':
        return (
          <div>
            <p className="text-sm text-gray-900 font-medium">{item.subject}</p>
            {item.assignment && (
              <div className="mt-1 text-sm text-gray-600">
                {item.assignment.previous.name && item.assignment.new.name ? (
                  <span>
                    From <span className="font-medium">{item.assignment.previous.name}</span> to{' '}
                    <span className="font-medium">{item.assignment.new.name}</span>
                  </span>
                ) : (
                  <span>Assigned to <span className="font-medium">{item.assignment.new.name}</span></span>
                )}
              </div>
            )}
          </div>
        );
      
      default:
        return (
          <div>
            <p className="text-sm text-gray-900 font-medium">{item.subject}</p>
            {item.description && (
              <p className="text-sm text-gray-600 mt-1">{item.description}</p>
            )}
            {item.outcome && (
              <div className="mt-2">
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {item.outcome}
                </span>
              </div>
            )}
            {item.duration_minutes && (
              <div className="mt-1 text-xs text-gray-500">
                Duration: {item.duration_minutes} minutes
              </div>
            )}
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={fetchTimeline}
          className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="timeline-container">
      {/* Timeline Summary */}
      {summary && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Activity Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{summary.total_activities || 0}</div>
              <div className="text-xs text-gray-600">Total Activities</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.calls || 0}</div>
              <div className="text-xs text-gray-600">Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{summary.emails || 0}</div>
              <div className="text-xs text-gray-600">Emails</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{summary.meetings || 0}</div>
              <div className="text-xs text-gray-600">Meetings</div>
            </div>
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {timeline.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No activities yet</p>
            {onAddActivity && (
              <button
                onClick={() => onAddActivity()}
                className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
              >
                Add first activity
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item.id} className="relative flex items-start space-x-3">
                {/* Timeline line */}
                {index < timeline.length - 1 && (
                  <div className="absolute left-4 top-8 w-0.5 h-8 bg-gray-200"></div>
                )}
                
                {/* Icon */}
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border-2 flex items-center justify-center ${getActivityColor(item.activity_type)}`}>
                  {getActivityIcon(item.activity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        {renderActivityContent(item)}
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="text-xs text-gray-500">
                          {formatActivityTime(item.created_at)}
                        </div>
                        {item.user && (
                          <div className="text-xs text-gray-600 mt-1">
                            by {item.user.name}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="mt-3 flex items-center space-x-2">
                      {onActivityClick && (
                        <button
                          onClick={() => onActivityClick(item)}
                          className="text-xs text-blue-600 hover:text-blue-800"
                        >
                          View Details
                        </button>
                      )}
                      {item.activity_type === 'task' && !item.is_completed && (
                        <button
                          onClick={() => {
                            // Handle task completion
                            console.log('Complete task:', item.id);
                          }}
                          className="text-xs text-green-600 hover:text-green-800"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;
