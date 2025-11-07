import { format } from 'date-fns'
import { 
  ClockIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline'

const AccountTimeline = ({ timeline, loading }) => {
  const getEventIcon = (event) => {
    switch (event.type) {
      case 'audit':
        switch (event.event_type) {
          case 'account_created':
            return <PlusIcon className="h-5 w-5 text-green-500" />
          case 'account_updated':
            return <PencilIcon className="h-5 w-5 text-blue-500" />
          case 'account_deleted':
            return <TrashIcon className="h-5 w-5 text-red-500" />
          default:
            return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
        }
      case 'activity':
        switch (event.event_type) {
          case 'call':
            return <PhoneIcon className="h-5 w-5 text-blue-500" />
          case 'email':
            return <EnvelopeIcon className="h-5 w-5 text-purple-500" />
          case 'meeting':
            return <CalendarIcon className="h-5 w-5 text-green-500" />
          default:
            return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
        }
      case 'task':
        return event.status === 'completed' 
          ? <CheckCircleIcon className="h-5 w-5 text-green-500" />
          : <ClockIcon className="h-5 w-5 text-yellow-500" />
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />
    }
  }

  const getEventColor = (event) => {
    switch (event.type) {
      case 'audit':
        return 'bg-blue-100 border-blue-300'
      case 'activity':
        return 'bg-purple-100 border-purple-300'
      case 'task':
        return 'bg-yellow-100 border-yellow-300'
      default:
        return 'bg-gray-100 border-gray-300'
    }
  }

  const formatEventType = (type, eventType) => {
    if (type === 'audit') {
      return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    }
    return eventType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
        <p className="mt-4 text-sm text-gray-500">Loading timeline...</p>
      </div>
    )
  }

  if (!timeline || timeline.length === 0) {
    return (
      <div className="text-center py-8">
        <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-sm text-gray-500">No timeline events yet</p>
      </div>
    )
  }

  // Group timeline by date
  const groupedTimeline = timeline.reduce((groups, event) => {
    const date = format(new Date(event.timestamp), 'yyyy-MM-dd')
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {})

  return (
    <div className="space-y-6">
      {Object.entries(groupedTimeline).map(([date, events]) => (
        <div key={date} className="relative">
          {/* Date Header */}
          <div className="sticky top-0 z-10 bg-white py-2 mb-4 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-700">
              {format(new Date(date), 'EEEE, MMMM dd, yyyy')}
            </h3>
          </div>

          {/* Timeline Events */}
          <div className="relative pl-8 space-y-4">
            {/* Timeline Line */}
            <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            {events.map((event, index) => (
              <div key={`${event.id}-${index}`} className="relative">
                {/* Timeline Dot */}
                <div className="absolute left-0 top-2 transform -translate-x-1/2">
                  <div className={`w-6 h-6 rounded-full border-2 ${getEventColor(event)} flex items-center justify-center`}>
                    {getEventIcon(event)}
                  </div>
                </div>

                {/* Event Card */}
                <div className={`ml-6 p-4 rounded-lg border ${getEventColor(event)} shadow-sm hover:shadow-md transition-shadow`}>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                          {formatEventType(event.type, event.event_type)}
                        </span>
                        {event.type === 'activity' && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            event.is_completed 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {event.is_completed ? 'Completed' : 'Pending'}
                          </span>
                        )}
                        {event.type === 'task' && (
                          <>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              event.status === 'completed' ? 'bg-green-100 text-green-800' :
                              event.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                              'bg-yellow-100 text-yellow-800'
                            }`}>
                              {event.status}
                            </span>
                            {event.priority && (
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                event.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                                event.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {event.priority}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">
                        {event.title}
                      </h4>
                      {event.description && (
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3 w-3" />
                          {format(new Date(event.timestamp), 'h:mm a')}
                        </span>
                        {event.scheduled_at && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Scheduled: {format(new Date(event.scheduled_at), 'MMM dd, h:mm a')}
                          </span>
                        )}
                        {event.due_date && (
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="h-3 w-3" />
                            Due: {format(new Date(event.due_date), 'MMM dd, yyyy')}
                          </span>
                        )}
                        {event.actor && (
                          <span>
                            by {event.actor.email}
                          </span>
                        )}
                      </div>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-2 pt-2 border-t border-gray-200">
                          {event.metadata.outcome && (
                            <span className="text-xs text-gray-600">
                              Outcome: {event.metadata.outcome.replace(/_/g, ' ')}
                            </span>
                          )}
                          {event.metadata.duration_minutes && (
                            <span className="text-xs text-gray-600 ml-3">
                              Duration: {event.metadata.duration_minutes} min
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default AccountTimeline

