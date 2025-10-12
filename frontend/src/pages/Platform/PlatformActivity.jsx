import { useState, useEffect } from 'react';
import {
  ClockIcon,
  BuildingOfficeIcon,
  UserIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import platformService from '../../services/platformService';
import { formatDistanceToNow } from 'date-fns';

const PlatformActivity = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchActivity = async () => {
    try {
      const response = await platformService.getRecentActivity(limit);
      if (response.success && response.data) {
        // Ensure data is an array
        const activityData = Array.isArray(response.data) ? response.data : [];
        setActivities(activityData);
      } else {
        setActivities([]);
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      setActivities([]);
      if (!autoRefresh) {
        toast.error('Failed to load activity');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivity();
  }, [limit]);

  // Auto-refresh every 30 seconds if enabled
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        fetchActivity();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, limit]);

  const handleRefresh = () => {
    setLoading(true);
    fetchActivity();
    toast.success('Activity refreshed');
  };

  const formatAction = (action) => {
    if (!action) return 'Unknown Action';
    return action
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getActivityIcon = (resourceType) => {
    switch (resourceType) {
      case 'company':
        return BuildingOfficeIcon;
      case 'user':
        return UserIcon;
      default:
        return ClockIcon;
    }
  };

  const getActivityColor = (resourceType) => {
    const colors = {
      'company': 'bg-blue-100 text-blue-800',
      'user': 'bg-green-100 text-green-800',
      'platform': 'bg-purple-100 text-purple-800',
      'lead': 'bg-orange-100 text-orange-800'
    };
    return colors[resourceType] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="ml-4 text-gray-600">Loading activity...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Activity</h1>
          <p className="mt-2 text-gray-600">Real-time activity feed across all companies</p>
        </div>

        <div className="flex items-center space-x-4">
          {/* Auto Refresh Toggle */}
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="sr-only peer"
            />
            <div className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            <span className="ml-3 text-sm font-medium text-gray-700">Auto-refresh</span>
          </label>

          {/* Limit Selector */}
          <select
            value={limit}
            onChange={(e) => setLimit(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value={20}>Last 20</option>
            <option value={50}>Last 50</option>
            <option value={100}>Last 100</option>
            <option value={200}>Last 200</option>
          </select>

          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <ArrowPathIcon className="h-5 w-5" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="bg-white rounded-lg border border-gray-200">
        {activities.length === 0 ? (
          <div className="p-12 text-center">
            <ClockIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No recent activity</p>
            <p className="text-sm text-gray-500 mt-2">Activity will appear here as users interact with the platform</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {activities.map((activity, index) => {
              // Safety check - skip if activity is invalid
              if (!activity || typeof activity !== 'object') return null;

              const ActivityIcon = getActivityIcon(activity.resource_type);
              const timeAgo = activity.created_at
                ? formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })
                : 'Unknown time';

              return (
                <div
                  key={activity.id || index}
                  className="p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start space-x-4">
                    {/* Icon */}
                    <div className={`flex-shrink-0 p-2 rounded-lg ${getActivityColor(activity.resource_type)}`}>
                      <ActivityIcon className="h-6 w-6" />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Action */}
                          <p className="text-sm font-medium text-gray-900">
                            {formatAction(activity.action)}
                          </p>

                          {/* Actor */}
                          <p className="mt-1 text-sm text-gray-600">
                            by <span className="font-medium">{activity.actor_email || 'Unknown User'}</span>
                            {activity.actor_role && (
                              <span className="ml-2 text-xs text-gray-500">
                                ({formatAction(activity.actor_role)})
                              </span>
                            )}
                          </p>

                          {/* Resource */}
                          {activity.resource_name && (
                            <p className="mt-1 text-sm text-gray-600">
                              <span className="text-gray-500">Resource:</span>{' '}
                              <span className="font-medium">{activity.resource_name}</span>
                            </p>
                          )}

                          {/* Details */}
                          {activity.details && typeof activity.details === 'object' && Object.keys(activity.details).length > 0 && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 rounded p-2 max-w-xl">
                              {typeof activity.details === 'string'
                                ? activity.details
                                : JSON.stringify(activity.details, null, 2)}
                            </div>
                          )}
                        </div>

                        {/* Timestamp */}
                        <div className="flex-shrink-0 ml-4 text-right">
                          <p className="text-xs text-gray-500">{timeAgo}</p>
                          {activity.created_at && (
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(activity.created_at).toLocaleString()}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Additional metadata */}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        {activity.ip_address && (
                          <span className="flex items-center">
                            <span className="font-medium">IP:</span> {activity.ip_address}
                          </span>
                        )}
                        {activity.is_impersonation && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800">
                            Impersonation
                          </span>
                        )}
                        {activity.severity && activity.severity !== 'info' && (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                            activity.severity === 'critical'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {activity.severity.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      {activities.length > 0 && (
        <div className="mt-6 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {activities.length} activit{activities.length !== 1 ? 'ies' : 'y'}
          </div>
          {autoRefresh && (
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Auto-refreshing every 30 seconds</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlatformActivity;
