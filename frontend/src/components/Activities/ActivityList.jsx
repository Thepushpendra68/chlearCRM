import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';

const ActivityList = ({ 
  activities = [],
  loading = false,
  error = null,
  leadId, 
  userId, 
  filters = {}, 
  onActivityClick, 
  onEditActivity,
  onRefresh,
  showFilters = true
}) => {
  const [localFilters, setLocalFilters] = useState({
    activity_type: '',
    is_completed: '',
    date_from: '',
    date_to: '',
    ...filters
  });
  const [filteredActivities, setFilteredActivities] = useState([]);

  // Apply client-side filtering to activities
  useEffect(() => {
    console.log('ActivityList filtering activities:', activities.length, 'total activities');
    console.log('Activities received:', activities);
    let filtered = [...activities];
    
    // Filter by leadId if provided
    if (leadId) {
      filtered = filtered.filter(activity => activity.lead_id === leadId);
    }
    
    // Filter by userId if provided
    if (userId) {
      filtered = filtered.filter(activity => activity.user_id === userId);
    }
    
    // Apply local filters
    if (localFilters.activity_type) {
      filtered = filtered.filter(activity => activity.activity_type === localFilters.activity_type);
    }
    
    if (localFilters.is_completed !== '') {
      const isCompleted = localFilters.is_completed === 'true';
      filtered = filtered.filter(activity => activity.is_completed === isCompleted);
    }
    
    if (localFilters.date_from) {
      const fromDate = new Date(localFilters.date_from);
      filtered = filtered.filter(activity => new Date(activity.created_at) >= fromDate);
    }
    
    if (localFilters.date_to) {
      const toDate = new Date(localFilters.date_to);
      toDate.setHours(23, 59, 59, 999); // Include the whole day
      filtered = filtered.filter(activity => new Date(activity.created_at) <= toDate);
    }
    
    console.log('ActivityList filtered to:', filtered.length, 'activities');
    setFilteredActivities(filtered);
  }, [activities, leadId, userId, localFilters]);

  const handleFilterChange = (key, value) => {
    setLocalFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setLocalFilters({
      activity_type: '',
      is_completed: '',
      date_from: '',
      date_to: ''
    });
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

  const getActivityColor = (type) => {
    switch (type) {
      case 'call': return 'bg-blue-100 border-blue-200';
      case 'email': return 'bg-green-100 border-green-200';
      case 'meeting': return 'bg-purple-100 border-purple-200';
      case 'note': return 'bg-yellow-100 border-yellow-200';
      case 'task': return 'bg-orange-100 border-orange-200';
      case 'sms': return 'bg-indigo-100 border-indigo-200';
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
        {onRefresh && (
          <button 
            onClick={onRefresh}
            className="mt-2 text-blue-600 hover:text-blue-800 text-sm"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="activity-list">
      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-900">Filters</h3>
            <button
              onClick={clearFilters}
              className="text-xs text-blue-600 hover:text-blue-800"
            >
              Clear all
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Activity Type Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Activity Type
              </label>
              <select
                value={localFilters.activity_type}
                onChange={(e) => handleFilterChange('activity_type', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Types</option>
                <option value="call">Call</option>
                <option value="email">Email</option>
                <option value="meeting">Meeting</option>
                <option value="note">Note</option>
                <option value="task">Task</option>
                <option value="sms">SMS</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                value={localFilters.is_completed}
                onChange={(e) => handleFilterChange('is_completed', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="true">Completed</option>
                <option value="false">Pending</option>
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                From Date
              </label>
              <input
                type="date"
                value={localFilters.date_from}
                onChange={(e) => handleFilterChange('date_from', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                To Date
              </label>
              <input
                type="date"
                value={localFilters.date_to}
                onChange={(e) => handleFilterChange('date_to', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Activities List */}
      {filteredActivities.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No activities found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredActivities.map((activity) => (
            <div
              key={activity.id}
              onClick={() => onActivityClick && onActivityClick(activity)}
              className={`bg-white border rounded-lg p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer ${getActivityColor(activity.activity_type)}`}
            >
              <div className="flex items-start space-x-3">
                {/* Icon */}
                <div className="flex-shrink-0 mt-1">
                  {getActivityIcon(activity.activity_type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">
                        {activity.subject}
                      </h4>
                      
                      {activity.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {activity.description}
                        </p>
                      )}

                      {/* Activity Details */}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span className="capitalize">{activity.activity_type}</span>
                        
                        {activity.duration_minutes && (
                          <span>{activity.duration_minutes} min</span>
                        )}
                        
                        {activity.outcome && (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {activity.outcome}
                          </span>
                        )}
                        
                        {activity.is_completed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Completed
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Pending
                          </span>
                        )}
                      </div>

                      {/* Lead/User Info */}
                      <div className="mt-2 text-xs text-gray-500">
                        {activity.company && (
                          <span>Lead: {activity.company}</span>
                        )}
                        {activity.contact_name && !activity.company && (
                          <span>Contact: {activity.contact_name}</span>
                        )}
                        {activity.first_name && (
                          <span className={activity.company || activity.contact_name ? 'ml-4' : ''}>
                            User: {activity.first_name} {activity.last_name}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Time and Actions */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-xs text-gray-500">
                        {formatActivityTime(activity.created_at)}
                      </div>
                      
                      <div className="mt-2 flex items-center space-x-2">
                        {onEditActivity && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditActivity(activity);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                          >
                            Edit
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ActivityList;
