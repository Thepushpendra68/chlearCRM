import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import Modal from './Modal'
import accountService from '../services/accountService'
import userService from '../services/userService'
import toast from 'react-hot-toast'

const AccountForm = ({ account = null, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState([])
  const [accounts, setAccounts] = useState([]) // For parent account selection
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingAccounts, setLoadingAccounts] = useState(true)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch
  } = useForm({
    mode: 'onChange',
    defaultValues: {
      name: '',
      website: '',
      industry: '',
      phone: '',
      email: '',
      address: {},
      annual_revenue: '',
      employee_count: '',
      description: '',
      notes: '',
      assigned_to: '',
      status: 'active',
      parent_account_id: ''
    }
  })

  // Load users and accounts for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true)
        setLoadingAccounts(true)
        
        const [usersResponse, accountsResponse] = await Promise.all([
          userService.getActiveUsers(),
          accountService.getAccounts({ limit: 1000 }) // Get all accounts for parent selection
        ])
        
        setUsers(usersResponse.data || [])
        // Filter out current account from parent options (if editing)
        const availableAccounts = account
          ? (accountsResponse.data || []).filter(acc => acc.id !== account.id)
          : (accountsResponse.data || [])
        setAccounts(availableAccounts)
      } catch (error) {
        console.error('Failed to load data:', error)
        toast.error('Failed to load form data')
      } finally {
        setLoadingUsers(false)
        setLoadingAccounts(false)
      }
    }

    loadData()
  }, [account])

  // Populate form when editing
  useEffect(() => {
    if (account) {
      reset({
        name: account.name || '',
        website: account.website || '',
        industry: account.industry || '',
        phone: account.phone || '',
        email: account.email || '',
        address: account.address || {},
        annual_revenue: account.annual_revenue || '',
        employee_count: account.employee_count || '',
        description: account.description || '',
        notes: account.notes || '',
        assigned_to: account.assigned_to || '',
        status: account.status || 'active',
        parent_account_id: account.parent_account_id || ''
      })
    }
  }, [account, reset])

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true)

      // Validate required fields
      if (!data.name?.trim()) {
        toast.error('Account name is required')
        return
      }

      // Clean data before sending
      const cleanedData = {
        name: data.name.trim(),
        website: data.website?.trim() || null,
        industry: data.industry?.trim() || null,
        phone: data.phone?.trim() || null,
        email: data.email?.trim() || null,
        address: data.address || {},
        annual_revenue: data.annual_revenue === '' ? null : parseFloat(data.annual_revenue),
        employee_count: data.employee_count === '' ? null : parseInt(data.employee_count),
        description: data.description?.trim() || null,
        notes: data.notes?.trim() || null,
        assigned_to: data.assigned_to === '' ? null : data.assigned_to,
        status: data.status || 'active',
        parent_account_id: data.parent_account_id === '' ? null : data.parent_account_id
      }

      if (account) {
        // Update existing account
        const response = await accountService.updateAccount(account.id, cleanedData)
        if (response.success) {
          toast.success('Account updated successfully!')
          onSuccess?.(response.data)
          onClose()
        } else {
          throw new Error(response.message || 'Failed to update account')
        }
      } else {
        // Create new account
        const response = await accountService.createAccount(cleanedData)
        if (response.success) {
          toast.success('Account created successfully!')
          onSuccess?.(response.data)
          onClose()
        } else {
          throw new Error(response.message || 'Failed to create account')
        }
      }
    } catch (error) {
      console.error('Failed to save account:', error)

      let errorMessage = 'An unexpected error occurred'

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message
      } else if (error.response?.data?.errors) {
        const validationErrors = error.response.data.errors
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors.map(err => err.msg || err.message).join(', ')
        }
      } else if (error.message) {
        errorMessage = error.message
      }

      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    reset()
    onClose()
  }

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={account ? 'Edit Account' : 'Add New Account'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Account Name */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Account Name *
            </label>
            <input
              type="text"
              {...register('name', {
                required: 'Account name is required',
                minLength: {
                  value: 1,
                  message: 'Account name must be at least 1 character'
                },
                maxLength: {
                  value: 255,
                  message: 'Account name must not exceed 255 characters'
                }
              })}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                errors.name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
              }`}
              placeholder="Enter account name"
            />
            {errors.name && (
              <p className="text-red-500 text-xs mt-1 flex items-center">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {errors.name.message}
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Website
            </label>
            <input
              type="url"
              {...register('website', {
                pattern: {
                  value: /^https?:\/\/.+/,
                  message: 'Please provide a valid URL (e.g., https://example.com)'
                }
              })}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${
                errors.website ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="https://example.com"
            />
            {errors.website && (
              <p className="text-red-500 text-xs mt-1">{errors.website.message}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Industry
            </label>
            <input
              type="text"
              {...register('industry')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="e.g., Technology, Finance, Healthcare"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Please provide a valid email address'
                }
              })}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="contact@company.com"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              {...register('phone')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Annual Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Annual Revenue
            </label>
            <input
              type="number"
              step="0.01"
              {...register('annual_revenue', {
                min: {
                  value: 0,
                  message: 'Annual revenue must be positive'
                }
              })}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.annual_revenue ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0.00"
            />
            {errors.annual_revenue && (
              <p className="text-red-500 text-xs mt-1">{errors.annual_revenue.message}</p>
            )}
          </div>

          {/* Employee Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Employee Count
            </label>
            <input
              type="number"
              min="0"
              {...register('employee_count', {
                min: {
                  value: 0,
                  message: 'Employee count must be non-negative'
                }
              })}
              className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
                errors.employee_count ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="0"
            />
            {errors.employee_count && (
              <p className="text-red-500 text-xs mt-1">{errors.employee_count.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              {...register('status')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Assigned To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned To
            </label>
            <select
              {...register('assigned_to')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingUsers}
            >
              <option value="">Unassigned</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          {/* Parent Account */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parent Account
            </label>
            <select
              {...register('parent_account_id')}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loadingAccounts}
            >
              <option value="">No Parent Account</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">Select a parent account to create a hierarchy</p>
          </div>

          {/* Description */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter account description..."
            />
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              rows={3}
              className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="Enter internal notes..."
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-200">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading || isSubmitting ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {account ? 'Updating...' : 'Creating...'}
              </span>
            ) : (
              account ? 'Update Account' : 'Create Account'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default AccountForm

