import api from './api'

const authService = {
  // Login user
  login: (email, password) => {
    return api.post('/auth/login', { email, password })
  },

  // Register user
  register: (userData) => {
    return api.post('/auth/register', userData)
  },

  // Logout user
  logout: () => {
    return api.post('/auth/logout')
  },

  // Get current user profile
  getProfile: () => {
    return api.get('/auth/me')
  },

  // Update user profile
  updateProfile: (profileData) => {
    return api.put('/auth/profile', profileData)
  },

  // Change password
  changePassword: (passwordData) => {
    return api.put('/auth/change-password', passwordData)
  },
}

export default authService