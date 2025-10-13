import { useState, useEffect } from 'react'
import { Tab } from '@headlessui/react'
import {
  UserIcon,
  ShieldCheckIcon,
  ClockIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'
import { useAuth } from '../context/AuthContext'
import profileService from '../services/profileService'
import toast from 'react-hot-toast'
import ProfileHeader from '../components/Profile/ProfileHeader'
import PersonalInfoForm from '../components/Profile/PersonalInfoForm'
import SecurityForm from '../components/Profile/SecurityForm'
import ActivityHistory from '../components/Profile/ActivityHistory'

const Profile = () => {
  const { user, updateProfile } = useAuth()
  const [selectedTab, setSelectedTab] = useState(0)
  const [isLoadingProfile, setIsLoadingProfile] = useState(true)
  const [profileData, setProfileData] = useState(null)

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await profileService.getCurrentProfile()
      if (response.data.success) {
        setProfileData(response.data.data)
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error)
      toast.error('Failed to load profile data')
    } finally {
      setIsLoadingProfile(false)
    }
  }

  const handleProfileUpdate = async (data) => {
    const result = await updateProfile(data)
    if (result.success) {
      setProfileData(result.data || null)
    } else {
      throw new Error(result.error)
    }
  }

  const handlePasswordChange = async (currentPassword, newPassword) => {
    await profileService.changePassword(currentPassword, newPassword)
  }

  const handleAvatarUpload = async (file) => {
    try {
      const result = await profileService.uploadAvatar(file)
      if (result.success) {
        toast.success('Avatar updated successfully')
        fetchProfile()
      } else {
        toast.error(result.message || 'Avatar upload not yet implemented')
      }
    } catch (error) {
      toast.error('Failed to upload avatar')
    }
  }

  const tabs = [
    {
      name: 'Personal Information',
      icon: UserIcon,
      component: (
        <PersonalInfoForm
          user={profileData || user}
          onSave={handleProfileUpdate}
        />
      )
    },
    {
      name: 'Security',
      icon: ShieldCheckIcon,
      component: (
        <SecurityForm onChangePassword={handlePasswordChange} />
      )
    },
    {
      name: 'Activity History',
      icon: ClockIcon,
      component: (
        <ActivityHistory getActivityHistory={profileService.getActivityHistory} />
      )
    }
  ]

  if (isLoadingProfile) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your personal information and account settings
        </p>
      </div>

      {/* Profile Header Card */}
      <ProfileHeader
        user={profileData || user}
        onAvatarUpload={handleAvatarUpload}
        isAvatarUploadEnabled={false}
      />

      {/* Tabbed Content */}
      <div className="bg-white rounded-lg shadow-sm">
        <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
          <Tab.List className="flex space-x-1 border-b border-gray-200 px-6">
            {tabs.map((tab) => (
              <Tab
                key={tab.name}
                className={({ selected }) =>
                  `flex items-center space-x-2 px-4 py-4 text-sm font-medium leading-5 focus:outline-none ${
                    selected
                      ? 'border-b-2 border-primary-500 text-primary-600'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`
                }
              >
                <tab.icon className="h-5 w-5" />
                <span>{tab.name}</span>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels className="p-6">
            {tabs.map((tab, idx) => (
              <Tab.Panel key={idx} className="focus:outline-none">
                {tab.component}
              </Tab.Panel>
            ))}
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  )
}

export default Profile
