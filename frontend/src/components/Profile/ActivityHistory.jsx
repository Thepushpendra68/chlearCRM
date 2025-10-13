import { useState, useEffect } from 'react'
import {
  ClockIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  DocumentTextIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'
import toast from 'react-hot-toast'

const PAGE_SIZE = 20

const ActivityHistory = ({ getActivityHistory }) => {
  const [activities, setActivities] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

  useEffect(() => {
    fetchActivities()
  }, [page])

  const fetchActivities = async () => {
    setIsLoading(true)
    try {
      const response = await getActivityHistory(page, PAGE_SIZE)
      if (response.data.success) {
        const payload = response.data.data
        const pagination = response.data.pagination
        const newActivities = payload?.activities || payload || []
        setActivities(prev => {
          if (page === 1) {
            return newActivities
          }
          const existingIds = new Set(prev.map(activity => activity.id))
          const merged = [...prev]
          newActivities.forEach(activity => {
            if (!existingIds.has(activity.id)) {
              merged.push(activity)
            }
          })
          return merged
        })
        setHasMore(
          pagination?.hasMore ?? newActivities.length === PAGE_SIZE
        )
      }
    } catch (error) {
      toast.error('Failed to load activity history')
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityIcon = (type) => {
    switch (type) {
      case 'email':
        return <EnvelopeIcon className="h-5 w-5 text-blue-500" />
      case 'call':
        return <PhoneIcon className="h-5 w-5 text-green-500" />
      case 'meeting':
        return <UserIcon className="h-5 w-5 text-purple-500" />
      case 'note':
        return <DocumentTextIcon className="h-5 w-5 text-yellow-500" />
      case 'task_completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />
      default:
        return <ClockIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now - date
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const days = Math.floor(hours / 24)

    if (hours < 1) return 'Just now'
    if (hours < 24) return `${hours}h ago`
    if (days < 7) return `${days}d ago`

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    })
  }

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No activity history</h3>
        <p className="mt-1 text-sm text-gray-500">
          Your activities will appear here as you interact with the system.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flow-root">
        <ul className="-mb-8">
          {activities.map((activity, idx) => (
            <li key={activity.id}>
              <div className="relative pb-8">
                {idx !== activities.length - 1 && (
                  <span
                    className="absolute left-5 top-5 -ml-px h-full w-0.5 bg-gray-200"
                    aria-hidden="true"
                  />
                )}
                <div className="relative flex items-start space-x-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center ring-8 ring-white">
                      {getActivityIcon(activity.type)}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div>
                      <div className="text-sm">
                        <span className="font-medium text-gray-900 capitalize">
                          {activity.type.replace('_', ' ')}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500">
                        {formatDate(activity.created_at)}
                      </p>
                    </div>
                    <div className="mt-2 text-sm text-gray-700">
                      <p>{activity.description}</p>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <div className="mt-2 text-xs text-gray-500">
                          {Object.entries(activity.metadata).map(([key, value]) => (
                            <div key={key}>
                              <span className="font-medium">{key}:</span> {String(value)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <button
            onClick={() => setPage(p => p + 1)}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ActivityHistory
