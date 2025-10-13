import api from './api'

const profileService = {
  // Get current user full profile
  getCurrentProfile: () => {
    return api.get('/users/profile/me')
  },

  // Update basic profile info
  updateProfile: (profileData) => {
    return api.put('/users/profile/me', profileData)
  },

  // Change password
  changePassword: (currentPassword, newPassword) => {
    return api.put('/auth/change-password', {
      currentPassword,
      newPassword
    })
  },

  // Upload avatar (placeholder for future implementation)
  uploadAvatar: async (file) => {
    // TODO: Implement Supabase Storage upload
    // For now, return a mock response
    console.log('Avatar upload not yet implemented:', file)
    return { success: false, message: 'Avatar upload coming soon' }
  },

  // Get user's activity history
  getActivityHistory: (page = 1, limit = 20) => {
    return api.get('/activities', {
      params: {
        page,
        limit,
        user_specific: true // Flag to only get current user's activities
      }
    })
  },

  // Get user performance stats
  getPerformanceStats: () => {
    return api.get('/dashboard/performance-stats')
  }
}

export default profileService
