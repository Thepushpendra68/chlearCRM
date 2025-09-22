import api from './api'

class SearchService {
  // Global search across all modules
  async globalSearch(query, limit = 10) {
    try {
      const response = await api.get('/search', {
        params: { q: query, limit }
      })
      const payload = response.data?.data ?? response.data
      return payload
    } catch (error) {
      console.error('Global search error:', error)
      
      // Extract meaningful error message
      let errorMessage = 'Search failed. Please try again.'
      
      if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.message) {
        errorMessage = error.message
      }
      
      // Create a more informative error object
      const searchError = new Error(errorMessage)
      searchError.status = error.response?.status
      searchError.originalError = error
      
      throw searchError
    }
  }

  // Search specific modules
  async searchLeads(query, limit = 5) {
    try {
      const response = await api.get('/leads/search', {
        params: { q: query, limit }
      })
      const payload = response.data?.data ?? response.data
      return payload
    } catch (error) {
      console.error('Leads search error:', error)
      throw error
    }
  }

  async searchActivities(query, limit = 5) {
    try {
      const response = await api.get('/activities/search', {
        params: { q: query, limit }
      })
      const payload = response.data?.data ?? response.data
      return payload
    } catch (error) {
      console.error('Activities search error:', error)
      throw error
    }
  }

  async searchTasks(query, limit = 5) {
    try {
      const response = await api.get('/tasks/search', {
        params: { q: query, limit }
      })
      const payload = response.data?.data ?? response.data
      return payload
    } catch (error) {
      console.error('Tasks search error:', error)
      throw error
    }
  }

  async searchUsers(query, limit = 5) {
    try {
      const response = await api.get('/users/search', {
        params: { q: query, limit }
      })
      const payload = response.data?.data ?? response.data
      return payload
    } catch (error) {
      console.error('Users search error:', error)
      throw error
    }
  }

  // Get search suggestions
  async getSearchSuggestions(query) {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: query }
      })
      const payload = response.data?.data ?? response.data
      return payload
    } catch (error) {
      console.error('Search suggestions error:', error)
      throw error
    }
  }

  // Get recent searches
  getRecentSearches() {
    try {
      const recent = localStorage.getItem('recentSearches')
      return recent ? JSON.parse(recent) : []
    } catch (error) {
      console.error('Error getting recent searches:', error)
      return []
    }
  }

  // Save search to recent searches
  saveRecentSearch(query) {
    try {
      const recent = this.getRecentSearches()
      const filtered = recent.filter(item => item !== query)
      const updated = [query, ...filtered].slice(0, 5) // Keep only 5 recent searches
      localStorage.setItem('recentSearches', JSON.stringify(updated))
    } catch (error) {
      console.error('Error saving recent search:', error)
    }
  }

  // Clear recent searches
  clearRecentSearches() {
    try {
      localStorage.removeItem('recentSearches')
    } catch (error) {
      console.error('Error clearing recent searches:', error)
    }
  }
}

export default new SearchService()

