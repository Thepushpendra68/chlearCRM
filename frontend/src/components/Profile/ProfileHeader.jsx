import { UserCircleIcon, CameraIcon } from '@heroicons/react/24/outline'
import { useState } from 'react'

const ProfileHeader = ({ user, onAvatarUpload, isAvatarUploadEnabled = true }) => {
  const [isHovering, setIsHovering] = useState(false)

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file && onAvatarUpload) {
      onAvatarUpload(file)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center space-x-6">
        {/* Avatar */}
        <div
          className="relative"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={`${user.first_name} ${user.last_name}`}
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <UserCircleIcon className="h-24 w-24 text-gray-400" />
          )}

          {/* Upload overlay */}
          {isAvatarUploadEnabled && isHovering && (
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full cursor-pointer">
              <CameraIcon className="h-8 w-8 text-white" />
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* User Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900">
            {user?.first_name} {user?.last_name}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{user?.email}</p>
          <div className="flex items-center mt-2 space-x-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 capitalize">
              {user?.role?.replace('_', ' ')}
            </span>
            {user?.title && (
              <span className="text-sm text-gray-600">{user.title}</span>
            )}
            {user?.department && (
              <span className="text-sm text-gray-600">• {user.department}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProfileHeader
