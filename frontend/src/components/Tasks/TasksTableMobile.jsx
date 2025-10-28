import { format, formatDistanceToNow } from 'date-fns'
import { EllipsisVerticalIcon, CheckCircleIcon, ClockIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const TasksTableMobile = ({
  tasks,
  loading,
  onTaskClick,
  onEditTask,
  onDeleteTask,
  onCompleteTask
}) => {
  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'completed':
        return 'bg-green-50 border-green-200'
      case 'pending':
        return 'bg-yellow-50 border-yellow-200'
      case 'overdue':
        return 'bg-red-50 border-red-200'
      default:
        return 'bg-gray-50 border-gray-200'
    }
  }

  const getStatusLabel = (task) => {
    if (task.is_completed) return 'Completed'
    if (task.due_date) {
      const dueDate = new Date(task.due_date)
      if (dueDate < new Date()) return 'Overdue'
    }
    return 'Pending'
  }

  const isOverdue = (task) => {
    if (task.is_completed || !task.due_date) return false
    return new Date(task.due_date) < new Date()
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

  if (!tasks || tasks.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">No tasks found</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {tasks.map((task) => (
        <div
          key={task.id}
          className={`border rounded-lg overflow-hidden hover:shadow-md transition-shadow cursor-pointer ${getStatusColor(getStatusLabel(task))}`}
          onClick={() => onTaskClick(task)}
        >
          {/* Card Header */}
          <div className="p-4 border-b border-gray-200 bg-white flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={task.is_completed}
                onChange={(e) => {
                  e.stopPropagation()
                  onCompleteTask(task.id, e.target.checked)
                }}
                className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-0.5 flex-shrink-0"
              />

              {/* Task Info */}
              <div className="flex-1 min-w-0">
                <h3 className={`text-sm font-semibold truncate ${task.is_completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                {task.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {task.description}
                  </p>
                )}
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
                            onTaskClick(task)
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
                            onEditTask(task)
                          }}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    {!task.is_completed && (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onCompleteTask(task.id, true)
                            }}
                            className={`${active ? 'bg-green-50' : ''} block w-full text-left px-4 py-2 text-sm text-green-700`}
                          >
                            Mark Complete
                          </button>
                        )}
                      </Menu.Item>
                    )}
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            if (window.confirm('Delete this task?')) {
                              onDeleteTask(task.id)
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
            {/* Priority and Status */}
            <div className="flex items-center gap-2 flex-wrap">
              {task.priority && (
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                  {task.priority}
                </span>
              )}
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                {getStatusLabel(task)}
              </span>
            </div>

            {/* Due Date */}
            {task.due_date && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500 font-medium flex items-center gap-1">
                  <ClockIcon className="h-3.5 w-3.5" />
                  Due
                </span>
                <span className={`text-xs font-medium ${isOverdue(task) ? 'text-red-700' : 'text-gray-600'}`}>
                  {format(new Date(task.due_date), 'MMM dd, yyyy')}
                </span>
              </div>
            )}

            {/* Related To */}
            {task.lead_name && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Related to</span>
                <span className="text-xs text-gray-900 font-medium">{task.lead_name}</span>
              </div>
            )}

            {/* Created Date */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Created</span>
              <span className="text-xs text-gray-600">
                {formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}
              </span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex gap-2">
            {!task.is_completed ? (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onCompleteTask(task.id, true)
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
                >
                  Complete
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onEditTask(task)
                  }}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
                >
                  Edit
                </button>
              </>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onEditTask(task)
                }}
                className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-all"
              >
                View Details
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default TasksTableMobile
