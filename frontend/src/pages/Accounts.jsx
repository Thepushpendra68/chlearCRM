import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, BuildingOfficeIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline'
import accountService from '../services/accountService'
import AccountForm from '../components/AccountForm'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const Accounts = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddAccountForm, setShowAddAccountForm] = useState(false)
  const [showEditAccountForm, setShowEditAccountForm] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [selectedAccounts, setSelectedAccounts] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [industryFilter, setIndustryFilter] = useState('')
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20,
    has_next: false,
    has_prev: false
  })
  const [currentPage, setCurrentPage] = useState(1)

  // Fetch accounts
  const fetchAccounts = async (params = {}) => {
    try {
      setLoading(true)
      const queryParams = {
        page: params.page || currentPage,
        limit: params.limit || 20,
        ...params
      }

      if (searchTerm) queryParams.search = searchTerm
      if (statusFilter) queryParams.status = statusFilter
      if (industryFilter) queryParams.industry = industryFilter

      console.log('Fetching accounts with params:', queryParams)
      const response = await accountService.getAccounts(queryParams)
      console.log('Accounts response:', response)
      
      if (response.success) {
        setAccounts(response.data || [])
        setPagination(response.pagination || pagination)
      }
    } catch (error) {
      console.error('Failed to fetch accounts - Full error:', error)
      console.error('Error response:', error.response)
      console.error('Error data:', error.response?.data)
      
      const errorMsg = error.response?.data?.error?.message || error.response?.data?.message || error.message || 'Failed to load accounts'
      toast.error(errorMsg)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts()
  }, [currentPage])

  // Handle search
  const handleSearch = (e) => {
    setSearchTerm(e.target.value)
    setCurrentPage(1)
  }

  // Apply filters
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchAccounts({ page: 1 })
      setCurrentPage(1)
    }, 500) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, industryFilter])

  // Handle account creation
  const handleAccountSaved = () => {
    setShowAddAccountForm(false)
    fetchAccounts()
  }

  // Handle account edit
  const handleEditAccount = (account) => {
    setEditingAccount(account)
    setShowEditAccountForm(true)
  }

  // Handle account update
  const handleAccountUpdated = () => {
    setShowEditAccountForm(false)
    setEditingAccount(null)
    fetchAccounts()
  }

  // Handle delete account
  const handleDeleteAccount = async (account) => {
    if (!window.confirm(`Are you sure you want to delete ${account.name}?`)) {
      return
    }

    try {
      await accountService.deleteAccount(account.id)
      toast.success(`${account.name} deleted successfully`)
      fetchAccounts()
    } catch (error) {
      console.error('Failed to delete account:', error)
      const errorMessage = error?.error?.message || error?.message || 'Failed to delete account'
      toast.error(errorMessage)
    }
  }

  // Handle bulk selection
  const handleSelectAccount = (accountId) => {
    setSelectedAccounts(prev => {
      const newSelection = prev.includes(accountId)
        ? prev.filter(id => id !== accountId)
        : [...prev, accountId]

      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedAccounts.length === accounts.length) {
      setSelectedAccounts([])
      setShowBulkActions(false)
    } else {
      setSelectedAccounts(accounts.map(account => account.id))
      setShowBulkActions(true)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedAccounts.length} account(s)?`)) {
      return
    }

    try {
      const deletePromises = selectedAccounts.map(id => accountService.deleteAccount(id))
      await Promise.all(deletePromises)
      setSelectedAccounts([])
      setShowBulkActions(false)
      toast.success(`${selectedAccounts.length} account(s) deleted successfully`)
      fetchAccounts()
    } catch (error) {
      console.error('Failed to delete accounts:', error)
      toast.error('Failed to delete accounts')
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedAccounts([])
    setShowBulkActions(false)
  }

  // Get status color
  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'inactive':
        return 'bg-gray-100 text-gray-800'
      case 'archived':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage < 1 || newPage > pagination.total_pages) return
    setCurrentPage(newPage)
  }

  // Get unique industries for filter
  const industries = [...new Set(accounts.map(acc => acc.industry).filter(Boolean))]

  return (
    <div className="overflow-y-auto h-full bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4 md:py-6 lg:py-8">
            {/* Title and Description */}
            <div className="flex items-start gap-3 mb-4">
              <div className="hidden md:flex p-2 bg-primary-100 rounded-lg flex-shrink-0">
                <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">Accounts</h1>
                <p className="mt-1 text-xs md:text-sm text-gray-600">
                  Manage your accounts and organizations
                </p>
              </div>
            </div>

            {/* Stats and Actions */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              {/* Stats */}
              {pagination.total_items > 0 && (
                <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-4 lg:gap-6 text-xs sm:text-sm">
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">{pagination.total_items}</span>
                    <span className="text-gray-500">total accounts</span>
                  </span>
                  <span className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                    <span className="text-gray-900 font-medium">{accounts.filter(acc => acc.status === 'active').length}</span>
                    <span className="text-gray-500">active</span>
                  </span>
                </div>
              )}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => fetchAccounts()}
                  className="inline-flex items-center justify-center px-3 md:px-4 py-2 border border-gray-300 shadow-sm text-xs md:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <svg className="h-4 w-4 md:mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  <span className="hidden md:inline">Refresh</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddAccountForm(true)}
                  className="inline-flex items-center justify-center px-4 md:px-6 py-2 border border-transparent text-xs md:text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {showBulkActions && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-sm font-medium text-blue-800">
                  {selectedAccounts.length} account(s) selected
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={handleBulkDelete}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1" />
                  Delete Selected
                </button>
                <button
                  onClick={clearSelection}
                  className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Clear Selection
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 lg:gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={handleSearch}
                  className="block w-full pl-10 pr-3 py-2 sm:py-3 border border-gray-300 rounded-lg text-sm leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search accounts by name, email, or website..."
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Statuses</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={industryFilter}
                onChange={(e) => setIndustryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Industries</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                <p className="mt-4 text-lg font-medium text-gray-900">Loading accounts...</p>
              </div>
            </div>
          ) : accounts.length === 0 ? (
            <div className="p-12 text-center">
              <BuildingOfficeIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No accounts</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new account.</p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddAccountForm(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  <PlusIcon className="h-4 w-4 mr-2" />
                  Add Account
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedAccounts.length === accounts.length && accounts.length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                        />
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Account Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Industry
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Website
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Assigned To
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Created
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {accounts.map((account) => (
                      <tr key={account.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={selectedAccounts.includes(account.id)}
                            onChange={() => handleSelectAccount(account.id)}
                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-primary-100 rounded-lg flex items-center justify-center">
                              <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                            </div>
                            <div className="ml-4">
                              <div
                                className="text-sm font-medium text-gray-900 cursor-pointer hover:text-primary-600"
                                onClick={() => navigate(`/app/accounts/${account.id}`)}
                              >
                                {account.name}
                              </div>
                              {account.email && (
                                <div className="text-sm text-gray-500">{account.email}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{account.industry || '-'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(account.status)}`}>
                            {account.status || 'active'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {account.website ? (
                            <a
                              href={account.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm text-primary-600 hover:text-primary-800"
                            >
                              {account.website}
                            </a>
                          ) : (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {account.assigned_user_first_name && account.assigned_user_last_name
                              ? `${account.assigned_user_first_name} ${account.assigned_user_last_name}`
                              : '-'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {account.created_at
                            ? new Date(account.created_at).toLocaleDateString()
                            : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => navigate(`/app/accounts/${account.id}`)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleEditAccount(account)}
                              className="text-gray-600 hover:text-gray-900"
                            >
                              <PencilIcon className="h-4 w-4" />
                            </button>
                            {(user?.role === 'company_admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
                              <button
                                onClick={() => handleDeleteAccount(account)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.total_pages > 1 && (
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={!pagination.has_prev}
                      className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.has_next}
                      className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing <span className="font-medium">{(currentPage - 1) * pagination.items_per_page + 1}</span> to{' '}
                        <span className="font-medium">
                          {Math.min(currentPage * pagination.items_per_page, pagination.total_items)}
                        </span>{' '}
                        of <span className="font-medium">{pagination.total_items}</span> results
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                        <button
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.has_prev}
                          className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Previous
                        </button>
                        {[...Array(pagination.total_pages)].map((_, i) => {
                          const page = i + 1
                          if (
                            page === 1 ||
                            page === pagination.total_pages ||
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          ) {
                            return (
                              <button
                                key={page}
                                onClick={() => handlePageChange(page)}
                                className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                                  page === currentPage
                                    ? 'z-10 bg-primary-50 border-primary-500 text-primary-600'
                                    : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                                }`}
                              >
                                {page}
                              </button>
                            )
                          } else if (page === currentPage - 2 || page === currentPage + 2) {
                            return <span key={page} className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">...</span>
                          }
                          return null
                        })}
                        <button
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={!pagination.has_next}
                          className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Add Account Form Modal */}
      {showAddAccountForm && (
        <AccountForm
          onClose={() => setShowAddAccountForm(false)}
          onSuccess={handleAccountSaved}
        />
      )}

      {/* Edit Account Form Modal */}
      {showEditAccountForm && editingAccount && (
        <AccountForm
          account={editingAccount}
          onClose={() => {
            setShowEditAccountForm(false)
            setEditingAccount(null)
          }}
          onSuccess={handleAccountUpdated}
        />
      )}
    </div>
  )
}

export default Accounts

