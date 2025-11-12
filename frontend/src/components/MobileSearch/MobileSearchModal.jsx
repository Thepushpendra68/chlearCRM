import { useState, useEffect, useRef } from 'react'
import { Dialog, Transition, Tab } from '@headlessui/react'
import { Fragment } from 'react'
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  MicrophoneIcon,
  ClockIcon,
  FireIcon,
} from '@heroicons/react/24/outline'
import { useNavigate } from 'react-router-dom'
import { useDebounce } from '../../hooks/useDebounce'
import searchService from '../../services/searchService'
import api from '../../services/api'
import toast from 'react-hot-toast'

const MobileSearchModal = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState([])
  const [recentSearches, setRecentSearches] = useState([])
  const [popularSearches, setPopularSearches] = useState([
    'New leads this week',
    'High priority tasks',
    'Completed activities',
    'Qualified leads',
    'Email templates',
  ])
  const [selectedTab, setSelectedTab] = useState(0)
  const searchInputRef = useRef(null)
  const debouncedQuery = useDebounce(query, 300)

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current.focus(), 100)
    }
  }, [isOpen])

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved))
      } catch (e) {
        console.error('Failed to parse recent searches')
      }
    }
  }, [])

  // Perform search when query changes
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setResults([])
      return
    }

    const performSearch = async () => {
      setIsSearching(true)
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(debouncedQuery)}`)
        if (response.data.success) {
          setResults(response.data.data || [])
        }
      } catch (error) {
        console.error('Search failed:', error)
        toast.error('Search failed. Please try again.')
      } finally {
        setIsSearching(false)
      }
    }

    performSearch()
  }, [debouncedQuery])

  // Save search to recent searches
  const saveRecentSearch = (searchQuery) => {
    if (!searchQuery.trim()) return

    const updated = [searchQuery, ...recentSearches.filter(s => s !== searchQuery)].slice(0, 10)
    setRecentSearches(updated)
    localStorage.setItem('recentSearches', JSON.stringify(updated))
  }

  const handleSearch = (searchQuery) => {
    if (!searchQuery.trim()) return

    saveRecentSearch(searchQuery)
    // Navigate to search results page
    navigate(`/app/search?q=${encodeURIComponent(searchQuery)}`)
    onClose()
    setQuery('')
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(query)
    }
  }

  const clearRecentSearches = () => {
    setRecentSearches([])
    localStorage.removeItem('recentSearches')
    toast.success('Recent searches cleared')
  }

  const tabs = [
    { name: 'All', count: results.length },
    { name: 'Leads', count: results.leads?.length || 0 },
    { name: 'Activities', count: results.activities?.length || 0 },
    { name: 'Tasks', count: results.tasks?.length || 0 },
  ]

  const handleResultClick = (result) => {
    saveRecentSearch(query)

    // Navigate based on result type
    const type = result.type || result.entity_type
    const id = result.id

    switch (type) {
      case 'lead':
        navigate(`/app/leads/${id}`)
        break
      case 'activity':
        navigate(`/app/activities`)
        break
      case 'task':
        navigate(`/app/tasks`)
        break
      case 'contact':
        navigate(`/app/contacts/${id}`)
        break
      case 'account':
        navigate(`/app/accounts/${id}`)
        break
      default:
        navigate(`/app/search?q=${encodeURIComponent(query)}`)
    }
    onClose()
    setQuery('')
  }

  const getResultIcon = (type) => {
    switch (type) {
      case 'lead':
        return '👤'
      case 'activity':
        return '⏰'
      case 'task':
        return '✓'
      case 'contact':
        return '👥'
      case 'account':
        return '🏢'
      default:
        return '📄'
    }
  }

  const renderSearchResults = () => {
    const allResults = [
      ...(results.leads || []),
      ...(results.activities || []),
      ...(results.tasks || []),
    ]

    if (allResults.length === 0 && debouncedQuery.trim().length >= 2) {
      return (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <MagnifyingGlassIcon className="h-12 w-12 text-gray-300 mb-4" />
          <p className="text-gray-500 text-center">No results found for "{debouncedQuery}"</p>
        </div>
      )
    }

    return (
      <div className="space-y-1">
        {allResults.map((result, index) => (
          <button
            key={`${result.type}-${result.id}-${index}`}
            onClick={() => handleResultClick(result)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors"
          >
            <span className="text-2xl">{getResultIcon(result.type)}</span>
            <div className="flex-1 text-left">
              <div className="text-sm font-medium text-gray-900">
                {result.name || result.title || result.first_name + ' ' + result.last_name}
              </div>
              {(result.description || result.email) && (
                <div className="text-xs text-gray-500 truncate">
                  {result.description || result.email}
                </div>
              )}
            </div>
            <span className="text-xs text-gray-400 capitalize">{result.type}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="transition-opacity ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="transition-opacity ease-in duration-150"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-x-0 top-0">
              <Transition.Child
                as={Fragment}
                enter="transition ease-out duration-200"
                enterFrom="opacity-0 -translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 -translate-y-1"
              >
                <Dialog.Panel className="pointer-events-auto">
                  <div className="bg-white min-h-screen flex flex-col">
                    {/* Header */}
                    <div className="flex items-center gap-3 p-4 border-b border-gray-200">
                      <button
                        onClick={onClose}
                        className="p-2 -ml-2 text-gray-400 hover:text-gray-600 active:bg-gray-100 rounded-lg transition-colors"
                      >
                        <XMarkIcon className="h-6 w-6" />
                      </button>

                      <div className="flex-1 relative">
                        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                          <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          ref={searchInputRef}
                          type="text"
                          value={query}
                          onChange={(e) => setQuery(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Search leads, activities, tasks..."
                          className="w-full pl-10 pr-20 py-3 bg-gray-100 border-0 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white placeholder-gray-500"
                        />
                        <button
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-400 hover:text-gray-600 active:bg-gray-200 rounded-lg transition-colors"
                          title="Voice search (coming soon)"
                        >
                          <MicrophoneIcon className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 overflow-y-auto">
                      {!query.trim() || query.trim().length < 2 ? (
                        <div className="p-4 space-y-6">
                          {/* Recent Searches */}
                          {recentSearches.length > 0 && (
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                                  <ClockIcon className="h-4 w-4" />
                                  Recent
                                </h3>
                                <button
                                  onClick={clearRecentSearches}
                                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  Clear
                                </button>
                              </div>
                              <div className="space-y-1">
                                {recentSearches.map((search, index) => (
                                  <button
                                    key={index}
                                    onClick={() => handleSearch(search)}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                                  >
                                    <ClockIcon className="h-4 w-4 text-gray-400" />
                                    <span className="text-sm text-gray-700">{search}</span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Popular Searches */}
                          <div>
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                              <FireIcon className="h-4 w-4" />
                              Popular
                            </h3>
                            <div className="space-y-1">
                              {popularSearches.map((search, index) => (
                                <button
                                  key={index}
                                  onClick={() => handleSearch(search)}
                                  className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-50 active:bg-gray-100 rounded-lg transition-colors"
                                >
                                  <FireIcon className="h-4 w-4 text-orange-400" />
                                  <span className="text-sm text-gray-700">{search}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="py-2">
                          {/* Tabs */}
                          <div className="border-b border-gray-200 px-4">
                            <Tab.Group selectedIndex={selectedTab} onChange={setSelectedTab}>
                              <Tab.List className="flex space-x-6">
                                {tabs.map((tab) => (
                                  <Tab
                                    key={tab.name}
                                    className={({ selected }) =>
                                      `py-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                                        selected
                                          ? 'text-primary-600 border-primary-600'
                                          : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                                      }`
                                    }
                                  >
                                    {tab.name}
                                    {tab.count > 0 && (
                                      <span className="ml-2 bg-gray-100 text-gray-600 py-0.5 px-2 rounded-full text-xs">
                                        {tab.count}
                                      </span>
                                    )}
                                  </Tab>
                                ))}
                              </Tab.List>
                            </Tab.Group>
                          </div>

                          {/* Loading State */}
                          {isSearching && (
                            <div className="py-12 flex items-center justify-center">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                            </div>
                          )}

                          {/* Search Results */}
                          {!isSearching && renderSearchResults()}
                        </div>
                      )}
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  )
}

export default MobileSearchModal
