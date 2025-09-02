import { Fragment } from 'react'
import { Dialog, Transition } from '@headlessui/react'
import { XMarkIcon } from '@heroicons/react/24/outline'
import { NavLink } from 'react-router-dom'
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

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Leads', href: '/leads', icon: UsersIcon },
  { name: 'Pipeline', href: '/pipeline', icon: Squares2X2Icon },
  { name: 'Activities', href: '/activities', icon: ClockIcon },
  { name: 'Assignments', href: '/assignments', icon: UserPlusIcon },
  { name: 'Tasks', href: '/tasks', icon: ClipboardDocumentListIcon },
  { name: 'Users', href: '/users', icon: UserGroupIcon },
  { name: 'Reports', href: '/reports', icon: DocumentChartBarIcon },
]

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const { user } = useAuth()

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
              <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
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
                  <div className="flex-shrink-0 flex items-center px-4">
                    <span className="text-2xl font-bold text-primary-600">CRM</span>
                  </div>
                  <nav className="mt-5 px-2 space-y-1">
                    {navigation.map((item) => (
                      <NavLink
                        key={item.name}
                        to={item.href}
                        className={({ isActive }) =>
                          `${
                            isActive
                              ? 'bg-primary-100 text-primary-900'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          } group flex items-center px-2 py-2 text-base font-medium rounded-md`
                        }
                        onClick={() => setSidebarOpen(false)}
                      >
                        <item.icon
                          className="mr-4 h-6 w-6 flex-shrink-0"
                          aria-hidden="true"
                        />
                        {item.name}
                      </NavLink>
                    ))}
                  </nav>
                </div>
                <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
                  <div className="flex items-center">
                    <div>
                      <div className="text-base font-medium text-gray-800">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="text-sm font-medium text-gray-500 capitalize">
                        {user?.role?.replace('_', ' ')}
                      </div>
                    </div>
                  </div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">{/* Force sidebar to shrink to fit close icon */}</div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1">
            <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
              <div className="flex items-center flex-shrink-0 px-4">
                <span className="text-2xl font-bold text-primary-600">CRM</span>
              </div>
              <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
                {navigation.map((item) => (
                  <NavLink
                    key={item.name}
                    to={item.href}
                    className={({ isActive }) =>
                      `${
                        isActive
                          ? 'bg-primary-100 text-primary-900'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      } group flex items-center px-2 py-2 text-sm font-medium rounded-md`
                    }
                  >
                    <item.icon
                      className="mr-3 h-6 w-6 flex-shrink-0"
                      aria-hidden="true"
                    />
                    {item.name}
                  </NavLink>
                ))}
              </nav>
            </div>
            <div className="flex-shrink-0 flex border-t border-gray-200 p-4">
              <div className="flex items-center w-full">
                <div>
                  <div className="text-sm font-medium text-gray-800">
                    {user?.first_name} {user?.last_name}
                  </div>
                  <div className="text-xs font-medium text-gray-500 capitalize">
                    {user?.role?.replace('_', ' ')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar