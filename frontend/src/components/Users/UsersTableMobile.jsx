import { CheckCircleIcon, XCircleIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const UsersTableMobile = ({
  users,
  loading,
  onEdit,
  onReactivate,
  onDeactivate,
  roleLabels
}) => {
  const formatDateTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '—'
    }
    return date.toLocaleDateString()
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

  return (
    <div className="space-y-3">
      {users.map((userItem) => (
        <div
          key={userItem.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Card Header */}
          <div className="p-4 border-b border-gray-100 flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-10 w-10">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-sm">
                    <span className="text-xs font-semibold text-blue-700">
                      {userItem.first_name?.[0]}{userItem.last_name?.[0]}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {userItem.first_name} {userItem.last_name}
                  </p>
                  <p className="text-xs text-gray-500 truncate">{userItem.email}</p>
                </div>
              </div>
            </div>

            {/* Action Menu */}
            <Menu as="div" className="relative ml-2 flex-shrink-0">
              <Menu.Button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
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
                          onClick={() => onEdit(userItem)}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    {userItem.is_active ? (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => onDeactivate(userItem)}
                            className={`${active ? 'bg-red-50' : ''} block w-full text-left px-4 py-2 text-sm text-red-700`}
                          >
                            Deactivate
                          </button>
                        )}
                      </Menu.Item>
                    ) : (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => onReactivate(userItem)}
                            className={`${active ? 'bg-green-50' : ''} block w-full text-left px-4 py-2 text-sm text-green-700`}
                          >
                            Reactivate
                          </button>
                        )}
                      </Menu.Item>
                    )}
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Card Body */}
          <div className="px-4 py-3 space-y-2">
            {/* Role */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Role</span>
              <span className="text-sm font-medium text-gray-900">{roleLabels[userItem.role] || userItem.role}</span>
            </div>

            {/* Status */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status</span>
              <div className="flex items-center gap-1">
                {userItem.is_active ? (
                  <>
                    <CheckCircleIcon className="h-4 w-4 text-green-600" />
                    <span className="text-xs font-medium text-green-700">Active</span>
                  </>
                ) : (
                  <>
                    <XCircleIcon className="h-4 w-4 text-red-600" />
                    <span className="text-xs font-medium text-red-700">Inactive</span>
                  </>
                )}
              </div>
            </div>

            {/* Last Active */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Last Active</span>
              <span className="text-xs text-gray-600">{formatDateTime(userItem.last_sign_in_at)}</span>
            </div>

            {/* Created */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Joined</span>
              <span className="text-xs text-gray-600">{formatDateTime(userItem.created_at)}</span>
            </div>
          </div>

          {/* Card Footer */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex gap-2">
            <button
              onClick={() => onEdit(userItem)}
              className="flex-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-all"
            >
              Edit
            </button>
            {userItem.is_active ? (
              <button
                onClick={() => onDeactivate(userItem)}
                className="flex-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
              >
                Deactivate
              </button>
            ) : (
              <button
                onClick={() => onReactivate(userItem)}
                className="flex-1 px-3 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-all"
              >
                Reactivate
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}

export default UsersTableMobile
