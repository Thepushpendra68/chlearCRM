import { Fragment, useState, useRef, useEffect } from 'react'
import { Dialog, Transition, Menu } from '@headlessui/react'
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon
} from '@heroicons/react/24/outline'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ClockIcon,
  UserPlusIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
} from '@heroicons/react/24/outline'

// Main navigation items (top section)
const mainNavigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, badge: null },
  { name: 'Leads', href: '/leads', icon: UsersIcon, badge: 3 },
  { name: 'Pipeline', href: '/pipeline', icon: Squares2X2Icon, badge: null },
  { name: 'Activities', href: '/activities', icon: ClockIcon, badge: 2 },
]

// Utility/admin navigation items (bottom section)
const utilityNavigation = [
  { name: 'Assignments', href: '/assignments', icon: UserPlusIcon, badge: null },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon, badge: 5 },
  { name: 'Users', href: '/users', icon: UserGroupIcon, badge: null },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon, badge: null },
]


const Sidebar = ({ sidebarOpen, setSidebarOpen, isCollapsed, setIsCollapsed }) => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [isDarkMode, setIsDarkMode] = useState(false)

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === 'b') {
        e.preventDefault()
        setIsCollapsed(!isCollapsed)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCollapsed, setIsCollapsed])


  // Navigation item component
  const NavItem = ({ item, isCollapsed, onClick }) => (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive
            ? 'bg-primary-500 text-white shadow-sm'
            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
        } ${isCollapsed ? 'justify-center' : ''}`
      }
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon
        className={`h-5 w-5 flex-shrink-0 ${
          isCollapsed ? '' : 'mr-3'
        }`}
        aria-hidden="true"
      />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.name}</span>
          {item.badge && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && item.badge && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </NavLink>
  )

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col w-60 bg-gray-50">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon className="h-6 w-6 text-white" aria-hidden="true" />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  {/* Logo */}
                  <div className="flex items-center px-4 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">C</span>
                      </div>
                      <span className="ml-3 text-xl font-bold text-gray-900">CRM</span>
                    </div>
                  </div>


                  {/* Main Navigation */}
                  <nav className="px-2 space-y-1 mb-6">
                    {mainNavigation.map((item) => (
                      <NavItem
                        key={item.name}
                        item={item}
                        isCollapsed={false}
                        onClick={() => setSidebarOpen(false)}
                      />
                    ))}
                  </nav>

                  {/* Divider */}
                  <div className="px-4 mb-4">
                    <div className="border-t border-gray-200"></div>
                  </div>

                  {/* Utility Navigation */}
                  <nav className="px-2 space-y-1">
                    {utilityNavigation.map((item) => (
                      <NavItem
                        key={item.name}
                        item={item}
                        isCollapsed={false}
                        onClick={() => setSidebarOpen(false)}
                      />
                    ))}
                  </nav>
                </div>

                {/* User Profile */}
                <div className="flex-shrink-0 border-t border-gray-200 p-4">
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center w-full text-left">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-800">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user?.role?.replace('_', ' ')}
                        </div>
                      </div>
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
                      <Menu.Items className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                                Settings
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={logout}
                                className={`${
                                  active ? 'bg-gray-100' : ''
                                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${
        isCollapsed ? 'md:w-16' : 'md:w-60'
      }`}>
        <div className="flex flex-col w-full bg-gray-50 border-r border-gray-200">
          <div className="flex flex-col h-0 flex-1">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              {!isCollapsed && (
                <div className="flex items-center">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">C</span>
                  </div>
                  <span className="ml-3 text-xl font-bold text-gray-900">CRM</span>
                </div>
              )}
              {isCollapsed && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center mx-auto">
                  <span className="text-white font-bold text-sm">C</span>
                </div>
              )}
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? (
                  <ChevronRightIcon className="h-4 w-4 text-gray-500" />
                ) : (
                  <ChevronLeftIcon className="h-4 w-4 text-gray-500" />
                )}
              </button>
            </div>


            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Main Navigation */}
              <nav className="px-2 space-y-1 mb-6">
                {mainNavigation.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </nav>

              {/* Divider */}
              <div className="px-4 mb-4">
                <div className="border-t border-gray-200"></div>
              </div>

              {/* Utility Navigation */}
              <nav className="px-2 space-y-1">
                {utilityNavigation.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </nav>
            </div>

            {/* User Profile */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center w-full text-left">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  {!isCollapsed && (
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize truncate">
                        {user?.role?.replace('_', ' ')}
                      </div>
                    </div>
                  )}
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
                  <Menu.Items className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            <Cog6ToothIcon className="h-4 w-4 mr-3" />
                            Settings
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`${
                              active ? 'bg-gray-100' : ''
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>

    </>
  )
}

export default Sidebar