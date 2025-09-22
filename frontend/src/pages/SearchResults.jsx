import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'
import searchService from '../services/searchService'
import GlobalSearch from '../components/Search/GlobalSearch'

const SearchResults = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const query = searchParams.get('q') || ''

  useEffect(() => {
    if (query) {
      performSearch(query)
    }
  }, [query])

  const performSearch = async (searchQuery) => {
    setLoading(true)
    setError(null)
    
    try {
      const searchResults = await searchService.globalSearch(searchQuery)
      setResults(searchResults)
    } catch (err) {
      setError('Search failed. Please try again.')
      console.error('Search error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleResultClick = (result) => {
    navigate(result.href)
  }

  const getResultIcon = (type) => {
    switch (type) {
      case 'lead': return '👤'
      case 'activity': return '⏰'
      case 'task': return '📋'
      case 'user': return '👥'
      default: return '🔍'
    }
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'lead': return 'text-blue-500'
      case 'activity': return 'text-green-500'
      case 'task': return 'text-purple-500'
      case 'user': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  const totalResults = results ? 
    (results.leads?.length || 0) + 
    (results.activities?.length || 0) + 
    (results.tasks?.length || 0) + 
    (results.users?.length || 0) : 0

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
      <div className="py-6">
        {/* Search Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Search Results</h1>
            <div className="w-96">
              <GlobalSearch
                placeholder="Search again..."
                className="w-full"
              />
            </div>
          </div>
          
          {query && (
            <div className="flex items-center text-sm text-gray-600">
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              <span>Results for "{query}"</span>
              {totalResults > 0 && (
                <span className="ml-2 px-2 py-1 bg-gray-100 rounded-full text-xs">
                  {totalResults} result{totalResults !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Searching...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <div className="text-red-500 text-lg mb-2">⚠️</div>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => performSearch(query)}
              className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
            >
              Try Again
            </button>
          </div>
        )}

        {/* No Results */}
        {!loading && !error && results && totalResults === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
            <p className="text-gray-600 mb-4">
              We couldn't find anything matching "{query}". Try different keywords.
            </p>
            <div className="w-96 mx-auto">
              <GlobalSearch
                placeholder="Try a different search..."
                className="w-full"
              />
            </div>
          </div>
        )}

        {/* Results */}
        {!loading && !error && results && totalResults > 0 && (
          <div className="space-y-8">
            {/* Leads */}
            {results.leads && results.leads.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-blue-500 mr-2">👤</span>
                  Leads ({results.leads.length})
                </h2>
                <div className="grid gap-4">
                  {results.leads.map((lead) => (
                    <div
                      key={lead.id}
                      onClick={() => handleResultClick(lead)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {lead.name || `${lead.first_name} ${lead.last_name}`}
                          </h3>
                          <p className="text-sm text-gray-600">{lead.email}</p>
                          {lead.company && (
                            <p className="text-sm text-gray-500">{lead.company}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Activities */}
            {results.activities && results.activities.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-green-500 mr-2">⏰</span>
                  Activities ({results.activities.length})
                </h2>
                <div className="grid gap-4">
                  {results.activities.map((activity) => (
                    <div
                      key={activity.id}
                      onClick={() => handleResultClick(activity)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{activity.title}</h3>
                          <p className="text-sm text-gray-600">{activity.type}</p>
                          {activity.lead_name && (
                            <p className="text-sm text-gray-500">Lead: {activity.lead_name}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-xs text-gray-500">
                            {new Date(activity.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tasks */}
            {results.tasks && results.tasks.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-purple-500 mr-2">📋</span>
                  Tasks ({results.tasks.length})
                </h2>
                <div className="grid gap-4">
                  {results.tasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => handleResultClick(task)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{task.title}</h3>
                          <p className="text-sm text-gray-600">{task.description}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                            {task.status}
                          </span>
                          {task.due_date && (
                            <p className="text-xs text-gray-500 mt-1">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Users */}
            {results.users && results.users.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <span className="text-gray-500 mr-2">👥</span>
                  Users ({results.users.length})
                </h2>
                <div className="grid gap-4">
                  {results.users.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => handleResultClick(user)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 hover:shadow-md cursor-pointer transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </h3>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                        <div className="text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {user.role}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SearchResults
