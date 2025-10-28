import { format, formatDistanceToNow } from 'date-fns'
import { EllipsisVerticalIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const ActivitiesTableMobile = ({
  activities,
  loading,
  onActivityClick,
  onEditActivity,
  onDeleteActivity
}) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'call':
        return '📞'
      case 'email':
        return '📧'
      case 'meeting':
        return '📅'
      case 'note':
        return '📝'
      case 'task':
        return '✓'
      default:
        return '📌'
    }
  }

  const getActivityTypeLabel = (type) => {
    return type
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getActivityTypeColor = (type) => {
    switch (type) {
      case 'call':
        return 'bg-blue-50 border-blue-200'
      case 'email':
        return 'bg-green-50 border-green-200'
      case 'meeting':
        return 'bg-purple-50 border-purple-200'
      case 'note':
        return 'bg-yellow-50 border-yellow-200'
      case 'task':
        return 'bg-indigo-50 border-indigo-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  if (!activities || activities.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No activities found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {activities.map((activity) => (
        <div
          key={activity.id}
          className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${getActivityTypeColor(activity.activity_type)}`}
          onClick={() => onActivityClick(activity)}
        >
          {/* Card Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Type Icon */}
              <span className="text-2xl flex-shrink-0">{getActivityIcon(activity.activity_type)}</span>

              {/* Activity Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold text-gray-900 truncate">
                    {activity.title || getActivityTypeLabel(activity.activity_type)}
                  </h3>
                  {activity.is_completed && (
                    <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {activity.description ? activity.description.substring(0, 60) + (activity.description.length > 60 ? '...' : '') : 'No description'}
                </p>
              </div>
            </div>

            {/* Action Menu */}
            <Menu as="div" className="relative ml-2 flex-shrink-0">
              <Menu.Button 
                className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                onClick={(e) => e.stopPropagation()}
              >
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onActivityClick(activity)
                          }}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          View Details
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditActivity(activity)
                          }}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Delete this activity?')) {
                              onDeleteActivity(activity.id)
                            }
                          }}
                          className={`${active ? 'bg-red-50' : ''} block w-full text-left px-4 py-2 text-sm text-red-700`}
                        >
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Card Body */}
          <div className="px-4 py-3 bg-white space-y-2">
            {/* Activity Type Badge */}
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                {getActivityTypeLabel(activity.activity_type)}
              </span>
              {activity.is_completed && (
                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                  Completed
                </span>
              )}
            </div>

            {/* Lead Reference */}
            {activity.lead_name && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Related to</span>
                <span className="text-sm text-gray-900 font-medium">{activity.lead_name}</span>
              </div>
            )}

            {/* Date */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Created</span>
              <span className="text-xs text-gray-600">
                {format(new Date(activity.created_at), 'MMM dd, yyyy')}
              </span>
            </div>

            {/* Time Ago */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Time</span>
              <span className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onActivityClick(activity)
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
            >
              View
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onEditActivity(activity)
              }}
              className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
            >
              Edit
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default ActivitiesTableMobile
