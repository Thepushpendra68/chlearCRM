import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  MagnifyingGlassIcon, 
  XMarkIcon,
  ClockIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  UsersIcon
} from '@heroicons/react/24/outline'
import searchService from '../../services/searchService'
// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

const GlobalSearch = ({ 
  placeholder = "Search leads, contacts, activities...", 
  className = "",
  onClose
}) => {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [recentSearches, setRecentSearches] = useState([])
  const [selectedIndex, setSelectedIndex] = useState(-1)
  
  const navigate = useNavigate()
  const inputRef = useRef(null)
  const resultsRef = useRef(null)

  // Load recent searches on mount
  useEffect(() => {
    setRecentSearches(searchService.getRecentSearches())
  }, [])

  // Debounced search function
  const debouncedSearch = debounce(async (searchQuery) => {
    if (!searchQuery.trim()) {
      setResults(null)
      setShowResults(false)
      return
    }

    setIsLoading(true)
    try {
      const searchResults = await searchService.globalSearch(searchQuery)
      setResults(searchResults)
      setShowResults(true)
    } catch (error) {
      console.error('Search error:', error)
      // Show error state with meaningful message
      setResults({
        error: error.message || 'Search failed. Please check your connection and try again.',
        leads: [],
        activities: [],
        tasks: [],
        users: []
      })
      setShowResults(true)
    } finally {
      setIsLoading(false)
    }
  }, 300)

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value
    setQuery(value)
    setSelectedIndex(-1)
    
    if (value.trim()) {
      debouncedSearch(value)
    } else {
      setResults(null)
      setShowResults(true) // Show recent searches when empty
    }
  }

  // Handle search
  const handleSearch = async (searchQuery = query) => {
    if (!searchQuery.trim()) return

    searchService.saveRecentSearch(searchQuery)
    setRecentSearches(searchService.getRecentSearches())
    setShowResults(false)
    setQuery('')
    
    // Navigate to search results page or perform action
    navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`)
    onClose?.()
  }

  // Handle result click
  const handleResultClick = (result) => {
    searchService.saveRecentSearch(query)
    setRecentSearches(searchService.getRecentSearches())
    setShowResults(false)
    setQuery('')
    
    // Navigate to the specific item
    navigate(result.href)
    onClose?.()
  }

  // Handle recent search click
  const handleRecentSearchClick = (recentQuery) => {
    setQuery(recentQuery)
    handleSearch(recentQuery)
  }

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showResults) return

    const allItems = [
      ...(recentSearches || []),
      ...(results?.leads || []),
      ...(results?.contacts || []),
      ...(results?.activities || []),
      ...(results?.tasks || []),
      ...(results?.users || [])
    ]

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setSelectedIndex(prev => 
          prev < allItems.length - 1 ? prev + 1 : prev
        )
        break
      case 'ArrowUp':
        e.preventDefault()
        setSelectedIndex(prev => prev > 0 ? prev - 1 : -1)
        break
      case 'Enter':
        e.preventDefault()
        if (selectedIndex >= 0 && selectedIndex < allItems.length) {
          if (selectedIndex < recentSearches.length) {
            handleRecentSearchClick(recentSearches[selectedIndex])
          } else {
            const resultIndex = selectedIndex - recentSearches.length
            const result = allItems[selectedIndex]
            handleResultClick(result)
          }
        } else {
          handleSearch()
        }
        break
      case 'Escape':
        setShowResults(false)
        setSelectedIndex(-1)
        break
    }
  }

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false)
        setSelectedIndex(-1)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const getResultIcon = (type) => {
    switch (type) {
      case 'lead': return <UsersIcon className="h-4 w-4" />
      case 'contact': return <UserIcon className="h-4 w-4" />
      case 'activity': return <ClockIcon className="h-4 w-4" />
      case 'task': return <ClipboardDocumentListIcon className="h-4 w-4" />
      case 'user': return <UserIcon className="h-4 w-4" />
      default: return <MagnifyingGlassIcon className="h-4 w-4" />
    }
  }

  const getResultColor = (type) => {
    switch (type) {
      case 'lead': return 'text-blue-500'
      case 'contact': return 'text-teal-500'
      case 'activity': return 'text-green-500'
      case 'task': return 'text-purple-500'
      case 'user': return 'text-gray-500'
      default: return 'text-gray-400'
    }
  }

  return (
    <div className={`relative ${className}`} ref={resultsRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowResults(true)}
          className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
          placeholder={placeholder}
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('')
              setResults(null)
              setShowResults(false)
              inputRef.current?.focus()
            }}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <XMarkIcon className="h-4 w-4 text-gray-400 hover:text-gray-600" />
          </button>
        )}
      </div>

      {/* Search Results Dropdown */}
      {showResults && (
        <div className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
          {isLoading ? (
            <div className="px-4 py-3 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500 mx-auto"></div>
              <p className="mt-2 text-sm">Searching...</p>
            </div>
          ) : results?.error ? (
            <div className="px-4 py-3 text-center text-red-500">
              <p className="text-sm">{results.error}</p>
            </div>
          ) : !query.trim() && recentSearches.length > 0 ? (
            // Recent Searches
            <div>
              <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                Recent Searches
              </div>
              {recentSearches.map((recentQuery, index) => (
                <button
                  key={index}
                  onClick={() => handleRecentSearchClick(recentQuery)}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${
                    selectedIndex === index ? 'bg-gray-50' : ''
                  }`}
                >
                  <ClockIcon className="h-4 w-4 text-gray-400 mr-3" />
                  {recentQuery}
                </button>
              ))}
              <div className="px-4 py-2 border-t border-gray-100">
                <button
                  onClick={() => {
                    searchService.clearRecentSearches()
                    setRecentSearches([])
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Clear recent searches
                </button>
              </div>
            </div>
          ) : results && Object.keys(results).length > 0 ? (
            // Search Results
            <div>
              {results.leads && results.leads.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Leads ({results.leads.length})
                  </div>
                  {results.leads.map((lead, index) => (
                    <button
                      key={lead.id}
                      onClick={() => handleResultClick(lead)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${
                        selectedIndex === recentSearches.length + index ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className={`${getResultColor('lead')} mr-3`}>
                        {getResultIcon('lead')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {lead.name || `${lead.first_name} ${lead.last_name}`}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {lead.email || lead.company}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.contacts && results.contacts.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Contacts ({results.contacts.length})
                  </div>
                  {results.contacts.map((contact, index) => (
                    <button
                      key={contact.id}
                      onClick={() => handleResultClick(contact)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${
                        selectedIndex === recentSearches.length + (results.leads?.length || 0) + index ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className={`${getResultColor('contact')} mr-3`}>
                        {getResultIcon('contact')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {contact.name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.email || 'Contact'}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {contact.email || contact.phone || contact.account_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.activities && results.activities.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Activities ({results.activities.length})
                  </div>
                  {results.activities.map((activity, index) => (
                    <button
                      key={activity.id}
                      onClick={() => handleResultClick(activity)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${
                        selectedIndex === recentSearches.length + (results.leads?.length || 0) + (results.contacts?.length || 0) + index ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className={`${getResultColor('activity')} mr-3`}>
                        {getResultIcon('activity')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {activity.title}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {activity.type} • {activity.lead_name}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.tasks && results.tasks.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Tasks ({results.tasks.length})
                  </div>
                  {results.tasks.map((task, index) => (
                    <button
                      key={task.id}
                      onClick={() => handleResultClick(task)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${
                        selectedIndex === recentSearches.length + (results.leads?.length || 0) + (results.contacts?.length || 0) + (results.activities?.length || 0) + index ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className={`${getResultColor('task')} mr-3`}>
                        {getResultIcon('task')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {task.title}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {task.status} • Due {task.due_date}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {results.users && results.users.length > 0 && (
                <div>
                  <div className="px-4 py-2 text-xs font-medium text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    Users ({results.users.length})
                  </div>
                  {results.users.map((user, index) => (
                    <button
                      key={user.id}
                      onClick={() => handleResultClick(user)}
                      className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center ${
                        selectedIndex === recentSearches.length + (results.leads?.length || 0) + (results.contacts?.length || 0) + (results.activities?.length || 0) + (results.tasks?.length || 0) + index ? 'bg-gray-50' : ''
                      }`}
                    >
                      <div className={`${getResultColor('user')} mr-3`}>
                        {getResultIcon('user')}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {user.first_name} {user.last_name}
                        </p>
                        <p className="text-gray-500 text-xs truncate">
                          {user.email} • {user.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* No results */}
              {Object.values(results).every(arr => !arr || arr.length === 0) && (
                <div className="px-4 py-3 text-center text-gray-500">
                  <p className="text-sm">No results found for "{query}"</p>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}

export default GlobalSearch
