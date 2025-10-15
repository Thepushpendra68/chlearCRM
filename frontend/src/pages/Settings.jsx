import { useState, useEffect } from 'react'
import {
  ComputerDesktopIcon,
  BellIcon,
  GlobeAltIcon,
  LockClosedIcon,
  UsersIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  TagIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import preferencesService from '../services/preferencesService'
import toast from 'react-hot-toast'
import DisplaySettings from '../components/Settings/DisplaySettings'
import NotificationSettings from '../components/Settings/NotificationSettings'
import RegionalSettings from '../components/Settings/RegionalSettings'
import LeadPicklistSettings from '../components/Settings/LeadPicklistSettings'

const Settings = () => {
  const { user, applyUserPatch } = useAuth()
  const [selectedSection, setSelectedSection] = useState('display')
  const [preferences, setPreferences] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchPreferences()
  }, [])

  const fetchPreferences = async () => {
    try {
      const response = await preferencesService.getPreferences()
      if (response.data.success) {
        setPreferences(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error)
      toast.error('Failed to load preferences')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSavePreferences = async (data) => {
    try {
      const response = await preferencesService.updatePreferences(data)
      if (!response.data.success) {
        throw new Error('Failed to update preferences')
      }

      const payload = response.data.data || {}
      const nextPreferences = payload.preferences || payload

      setPreferences({
        ...(preferences || {}),
        ...nextPreferences
      })

      if (payload.profile) {
        applyUserPatch(payload.profile)
      }

      return response.data
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to update preferences'
      toast.error(message)
      throw new Error(message)
    }
  }

  // Navigation sections configuration
  const allSections = [
    {
      id: 'display',
      name: 'Display',
      icon: ComputerDesktopIcon,
      roles: ['sales_rep', 'manager', 'company_admin', 'super_admin'],
      component: (
        <DisplaySettings
          preferences={preferences}
          onSave={handleSavePreferences}
        />
      )
    },
    {
      id: 'notifications',
      name: 'Notifications',
      icon: BellIcon,
      roles: ['sales_rep', 'manager', 'company_admin', 'super_admin'],
      component: (
        <NotificationSettings
          preferences={preferences}
          onSave={handleSavePreferences}
        />
      )
    },
    {
      id: 'regional',
      name: 'Language & Regional',
      icon: GlobeAltIcon,
      roles: ['sales_rep', 'manager', 'company_admin', 'super_admin'],
      component: (
        <RegionalSettings
          preferences={preferences}
          user={user}
          onSave={handleSavePreferences}
        />
      )
    },
    {
      id: 'privacy',
      name: 'Privacy & Security',
      icon: LockClosedIcon,
      roles: ['sales_rep', 'manager', 'company_admin', 'super_admin'],
      component: (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy & Security</h3>
          <div className="space-y-4">
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Password Management</h4>
              <p className="text-sm text-gray-500 mb-3">
                Change your password from the Profile page under Security settings.
              </p>
              <a
                href="/app/profile"
                className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                Go to Profile Security →
              </a>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">Data & Privacy</h4>
              <p className="text-sm text-gray-500">
                Your data is securely stored and protected. Contact your administrator for data export or deletion requests.
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'team',
      name: 'Team Settings',
      icon: UsersIcon,
      roles: ['manager', 'company_admin', 'super_admin'],
      component: (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Team Settings</h3>
          <p className="text-sm text-gray-500 mb-4">
            Team management features coming soon. You can currently manage users from the Users page.
          </p>
          <a
            href="/app/users"
            className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            Go to Users Management →
          </a>
        </div>
      )
    },
    {
      id: 'company',
      name: 'Company Settings',
      icon: BuildingOfficeIcon,
      roles: ['company_admin', 'super_admin'],
      component: (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Company Settings</h3>
          <p className="text-sm text-gray-500">
            Company-wide configuration and settings coming soon.
          </p>
        </div>
      )
    },
    {
      id: 'lead-picklists',
      name: 'Lead Picklists',
      icon: TagIcon,
      roles: ['manager', 'company_admin', 'super_admin'],
      component: (
        <LeadPicklistSettings />
      )
    },
    {
      id: 'system',
      name: 'System Configuration',
      icon: WrenchScrewdriverIcon,
      roles: ['company_admin', 'super_admin'],
      component: (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">System Configuration</h3>
          <p className="text-sm text-gray-500">
            Advanced system configuration options coming soon.
          </p>
        </div>
      )
    }
  ]

  // Filter sections based on user role
  const sections = allSections.filter(section =>
    section.roles.includes(user?.role)
  )

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  const currentSection = sections.find(s => s.id === selectedSection) || sections[0]

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Settings Layout */}
      <div className="flex gap-6">
        {/* Sidebar Navigation */}
        <div className="w-64 flex-shrink-0">
          <nav className="space-y-1 bg-white rounded-lg shadow-sm p-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setSelectedSection(section.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  selectedSection === section.id
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <section.icon className="h-5 w-5" />
                <span>{section.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-w-0">
          {currentSection.component}
        </div>
      </div>
    </div>
  )
}

export default Settings
