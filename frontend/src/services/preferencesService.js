import api from './api'

const preferencesService = {
  // Get user preferences
  getPreferences: () => {
    return api.get('/preferences')
  },

  // Update user preferences
  updatePreferences: (preferences) => {
    return api.put('/preferences', preferences)
  },

  // Reset preferences to defaults
  resetPreferences: () => {
    return api.post('/preferences/reset')
  }
}

export default preferencesService
