import { Fragment, useState } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon, 
  MagnifyingGlassIcon,
  PlusIcon,
  Cog6ToothIcon,
  XMarkIcon,
  SparklesIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import Breadcrumbs from './Breadcrumbs'
import GlobalSearch from '../Search/GlobalSearch'
import { Button } from '../ui/button'

const Header = ({ setSidebarOpen, isCollapsed, currentPath }) => {
  const { user, logout, chatPanelOpen, toggleChatPanel } = useAuth()
  const navigate = useNavigate()
  const [showQuickActions, setShowQuickActions] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const quickActions = [
    { name: 'New Lead', to: '/app/leads?action=create-lead', icon: '👤' },
    { name: 'New Task', to: '/app/tasks?action=create-task', icon: '📋' },
    { name: 'New Activity', to: '/app/activities?action=create-activity', icon: '⏰' },
  ]

  const handleQuickAction = (action) => {
    navigate(action.to)
    setShowQuickActions(false)
  }

  const handleMenuNavigate = (path) => {
    navigate(path)
  }

  return (
    <div className="relative flex-shrink-0 flex h-16 bg-white shadow border-b border-gray-200">
      {/* Mobile hamburger button - only visible on mobile */}
      <button
        type="button"
        className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        onClick={() => setSidebarOpen(true)}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>
      
      {/* Header content - spans only the content area, never overlaps sidebar */}
      <div className="flex-1 px-4 flex justify-between items-center">
        {/* Left side - Breadcrumbs and branding */}
        <div className="flex items-center space-x-4">
          {/* Logo - only show on mobile when sidebar is closed */}
          <div className="md:hidden flex items-center">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span className="ml-2 text-xl font-bold text-gray-900">Sakha</span>
          </div>
          
          {/* Breadcrumbs - hidden on mobile, shown on desktop */}
          <div className="hidden md:block">
            <Breadcrumbs currentPath={currentPath} />
          </div>
        </div>
        
        {/* Center - Global search (desktop only) */}
        <div className="hidden md:flex flex-1 max-w-lg mx-8">
          <GlobalSearch
            placeholder="Search leads, contacts, activities..."
            className="w-full"
          />
        </div>
        
        {/* Right side - Actions and profile */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Mobile search button */}
          <button
            type="button"
            className="md:hidden p-2.5 min-h-11 min-w-11 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg"
            onClick={() => {/* TODO: Open mobile search modal */}}
          >
            <MagnifyingGlassIcon className="h-5 w-5" />
          </button>

          {/* AI Assistant Toggle */}
          <Button
            variant={chatPanelOpen ? "default" : "outline"}
            size="sm"
            onClick={toggleChatPanel}
            className={`flex items-center gap-2 transition-colors min-h-11 px-2 md:px-3 ${
              chatPanelOpen 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <SparklesIcon className="h-4 w-4" />
            <span className="hidden sm:inline text-xs md:text-sm">AI Assistant</span>
          </Button>

          {/* Quick Actions */}
          <Menu as="div" className="relative">
            <Menu.Button
              onClick={() => setShowQuickActions(!showQuickActions)}
              className="p-2.5 min-h-11 min-w-11 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors"
              title="Quick Actions"
            >
              <PlusIcon className="h-5 w-5" />
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
                  {quickActions.map((action) => (
                    <Menu.Item key={action.name}>
                      {({ active }) => (
                        <button
                          onClick={() => handleQuickAction(action)}
                          className={`${
                            active ? 'bg-gray-100' : ''
                          } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                        >
                          <span className="mr-3">{action.icon}</span>
                          {action.name}
                        </button>
                      )}
                    </Menu.Item>
                  ))}
                </div>
              </Menu.Items>
            </Transition>
          </Menu>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2.5 min-h-11 min-w-11 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 rounded-lg transition-colors"
          >
            <span className="sr-only">View notifications</span>
            <BellIcon className="h-5 w-5" />
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon className="h-8 w-8 text-gray-400" />
              <div className="hidden md:block ml-2 text-left">
                <div className="text-sm font-medium text-gray-700">
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
              <Menu.Items className="absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleMenuNavigate('/app/profile')}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      <UserCircleIcon className="h-4 w-4 mr-3" />
                      Your Profile
                    </button>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={() => handleMenuNavigate('/app/settings')}
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
                      onClick={handleLogout}
                      className={`${
                        active ? 'bg-gray-100' : ''
                      } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  )
}

export default Header
