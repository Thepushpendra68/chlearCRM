import { format } from 'date-fns'
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon, TrashIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon, GlobeAltIcon, UsersIcon, PlusIcon, UserPlusIcon, UserMinusIcon, UserIcon, LinkIcon } from '@heroicons/react/24/outline'
import accountService from '../services/accountService'
import activityService from '../services/activityService'
import taskService from '../services/taskService'
import contactService from '../services/contactService'
import AccountForm from '../components/AccountForm'
import AccountTimeline from '../components/AccountTimeline'
import ActivityForm from '../components/Activities/ActivityForm'
import TaskForm from '../components/Tasks/TaskForm'
import ContactForm from '../components/Contacts/ContactForm'
import Modal from '../components/Modal'
import toast from 'react-hot-toast'
import { useAuth } from '../context/AuthContext'

const AccountDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [accountLeads, setAccountLeads] = useState([])
  const [accountStats, setAccountStats] = useState(null)
  const [accountActivities, setAccountActivities] = useState([])
  const [accountTasks, setAccountTasks] = useState([])
  const [accountTimeline, setAccountTimeline] = useState([])
  const [accountContacts, setAccountContacts] = useState([])
  const [loadingLeads, setLoadingLeads] = useState(false)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingTimeline, setLoadingTimeline] = useState(false)
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  const linkedContactIds = useMemo(() => {
    return new Set((accountContacts || []).map(contact => contact.id).filter(Boolean))
  }, [accountContacts])

  const [showContactModal, setShowContactModal] = useState(false)
  const [selectedContact, setSelectedContact] = useState(null)
  const [showExistingContactModal, setShowExistingContactModal] = useState(false)
  const [contactSearchTerm, setContactSearchTerm] = useState('')
  const [contactSearchResults, setContactSearchResults] = useState([])
  const [searchingContacts, setSearchingContacts] = useState(false)
  const [linkingContactId, setLinkingContactId] = useState(null)

  const availableContactsToLink = useMemo(() => {
    return (contactSearchResults || []).filter(contact => contact?.id && !linkedContactIds.has(contact.id))
  }, [contactSearchResults, linkedContactIds])

  useEffect(() => {
    fetchAccount()
    fetchAccountLeads()
    fetchAccountStats()
    fetchAccountActivities()
    fetchAccountTasks()
    fetchAccountTimeline()
    fetchAccountContacts()
  }, [id])

  const fetchAccount = async () => {
    try {
      setLoading(true)
      const response = await accountService.getAccountById(id)
      setAccount(response.data)
    } catch (error) {
      console.error('Failed to fetch account:', error)
      toast.error('Failed to load account details')
      navigate('/app/accounts')
    } finally {
      setLoading(false)
    }
  }

  const fetchAccountLeads = async () => {
    try {
      setLoadingLeads(true)
      const response = await accountService.getAccountLeads(id)
      setAccountLeads(response.data || [])
    } catch (error) {
      console.error('Failed to fetch account leads:', error)
    } finally {
      setLoadingLeads(false)
    }
  }

  const fetchAccountStats = async () => {
    try {
      setLoadingStats(true)
      const response = await accountService.getAccountStats(id)
      setAccountStats(response.data)
    } catch (error) {
      console.error('Failed to fetch account stats:', error)
    } finally {
      setLoadingStats(false)
    }
  }

  const fetchAccountActivities = async () => {
    try {
      setLoadingActivities(true)
      const response = await activityService.getActivities({ account_id: id, limit: 50 })
      setAccountActivities(response.data || [])
    } catch (error) {
      console.error('Failed to fetch account activities:', error)
    } finally {
      setLoadingActivities(false)
    }
  }

  const fetchAccountTasks = async () => {
    try {
      setLoadingTasks(true)
      const response = await taskService.getTasks({ account_id: id, limit: 50 })
      setAccountTasks(response.data || [])
    } catch (error) {
      console.error('Failed to fetch account tasks:', error)
    } finally {
      setLoadingTasks(false)
    }
  }

  const fetchAccountContacts = async () => {
    try {
      setLoadingContacts(true)
      const params = {
        account_id: id,
        limit: 100,
        sort_by: 'first_name',
        sort_order: 'asc'
      }
      const response = await contactService.getContacts(params)
      const contactsData = response?.data ?? response?.contacts ?? []
      setAccountContacts(Array.isArray(contactsData) ? contactsData : [])
    } catch (error) {
      console.error('Failed to fetch account contacts:', error)
      toast.error('Failed to load account contacts')
    } finally {
      setLoadingContacts(false)
    }
  }

  const handleTaskSaved = () => {
    fetchAccountTasks()
    fetchAccountStats()
    fetchAccountTimeline()
  }

  const fetchAccountTimeline = async () => {
    try {
      setLoadingTimeline(true)
      const response = await accountService.getAccountTimeline(id)
      setAccountTimeline(response.data || [])
    } catch (error) {
      console.error('Failed to fetch account timeline:', error)
    } finally {
      setLoadingTimeline(false)
    }
  }

  useEffect(() => {
    if (!showExistingContactModal) {
      setContactSearchTerm('')
      setContactSearchResults([])
      setSearchingContacts(false)
      setLinkingContactId(null)
    }
  }, [showExistingContactModal])

  const handleActivitySaved = () => {
    fetchAccountActivities()
    fetchAccountStats()
    fetchAccountTimeline()
  }

  const handleOpenNewContactModal = () => {
    setSelectedContact(null)
    setShowContactModal(true)
  }

  const handleEditContact = (contact) => {
    setSelectedContact(contact)
    setShowContactModal(true)
  }

  const handleContactFormSuccess = async (savedContact) => {
    try {
      if (!selectedContact && accountContacts.length === 0 && savedContact?.id) {
        try {
          await contactService.updateContact(savedContact.id, { is_primary: true })
        } catch (error) {
          console.error('Failed to mark contact as primary:', error)
        }
      }
      await fetchAccountContacts()
      await fetchAccountStats()
    } finally {
      setShowContactModal(false)
      setSelectedContact(null)
    }
  }

  const performContactSearch = async (term = '') => {
    setSearchingContacts(true)
    try {
      const params = {
        limit: 25,
        sort_by: 'created_at',
        sort_order: 'desc'
      }
      if (term) {
        params.search = term
      }
      const response = await contactService.getContacts(params)
      const contactsData = response?.data ?? response?.contacts ?? []
      setContactSearchResults(Array.isArray(contactsData) ? contactsData : [])
    } catch (error) {
      console.error('Failed to search contacts:', error)
      toast.error('Failed to search contacts')
    } finally {
      setSearchingContacts(false)
    }
  }

  const handleContactSearchSubmit = async (event) => {
    event.preventDefault()
    await performContactSearch(contactSearchTerm)
  }

  const handleOpenExistingContactModal = () => {
    setShowExistingContactModal(true)
    performContactSearch('')
  }

  const handleLinkExistingContact = async (contactId) => {
    if (!contactId) {
      return
    }

    setLinkingContactId(contactId)
    try {
      await contactService.updateContact(contactId, {
        account_id: id,
        is_primary: accountContacts.length === 0
      })
      toast.success('Contact linked to account')
      setShowExistingContactModal(false)
      await fetchAccountContacts()
      await fetchAccountStats()
    } catch (error) {
      console.error('Failed to link contact:', error)
      toast.error(error?.response?.data?.error?.message || 'Failed to link contact')
    } finally {
      setLinkingContactId(null)
    }
  }

  const handleUnlinkContact = async (contactId) => {
    if (!contactId) {
      return
    }
    if (!window.confirm('Are you sure you want to unlink this contact from the account?')) {
      return
    }

    try {
      await contactService.updateContact(contactId, { account_id: null, is_primary: false })
      toast.success('Contact unlinked from account')
      await fetchAccountContacts()
      await fetchAccountStats()
    } catch (error) {
      console.error('Failed to unlink contact:', error)
      toast.error(error?.response?.data?.error?.message || 'Failed to unlink contact')
    }
  }

  const handleSetPrimaryContact = async (contactId) => {
    if (!contactId) {
      return
    }
    try {
      await contactService.updateContact(contactId, { is_primary: true, account_id: id })
      const otherPrimaryContacts = accountContacts.filter(contact => contact.id !== contactId && contact.is_primary)
      if (otherPrimaryContacts.length > 0) {
        await Promise.all(
          otherPrimaryContacts.map(contact => contactService.updateContact(contact.id, { is_primary: false }))
        )
      }
      toast.success('Primary contact updated')
      await fetchAccountContacts()
      await fetchAccountStats()
    } catch (error) {
      console.error('Failed to set primary contact:', error)
      toast.error(error?.response?.data?.error?.message || 'Failed to update contact')
    }
  }

  const handleClearPrimaryContact = async (contactId) => {
    if (!contactId) {
      return
    }
    try {
      await contactService.updateContact(contactId, { is_primary: false })
      toast.success('Primary contact cleared')
      await fetchAccountContacts()
      await fetchAccountStats()
    } catch (error) {
      console.error('Failed to clear primary contact:', error)
      toast.error(error?.response?.data?.error?.message || 'Failed to update contact')
    }
  }

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

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    fetchAccount()
    fetchAccountStats()
    fetchAccountContacts()
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this account?')) {
      return
    }

    try {
      await accountService.deleteAccount(id)
      toast.success('Account deleted successfully')
      navigate('/app/accounts')
    } catch (error) {
      console.error('Failed to delete account:', error)
      const errorMessage = error?.error?.message || error?.message || 'Failed to delete account'
      toast.error(errorMessage)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-gray-900">Loading account details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!account) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <BuildingOfficeIcon className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Account not found</h3>
            <p className="text-sm text-gray-600 mb-6">The account you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/app/accounts')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Accounts
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/app/accounts')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                    <BuildingOfficeIcon className="h-6 w-6 text-primary-600" />
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {account.name}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                        {account.status || 'active'}
                      </span>
                      {account.industry && (
                        <span className="text-xs text-gray-500">• {account.industry}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={handleEdit}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <PencilIcon className="h-4 w-4 mr-1.5" />
                  Edit
                </button>
                {(user?.role === 'company_admin' || user?.role === 'super_admin' || user?.role === 'manager') && (
                  <button 
                    onClick={handleDelete}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                  >
                    <TrashIcon className="h-4 w-4 mr-1.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Account Information Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {account.email && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                        <EnvelopeIcon className="h-4 w-4 text-primary-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Email</p>
                        <a href={`mailto:${account.email}`} className="text-sm text-primary-600 hover:text-primary-800">
                          {account.email}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <PhoneIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <a href={`tel:${account.phone}`} className="text-sm text-primary-600 hover:text-primary-800">
                          {account.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.website && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                        <GlobeAltIcon className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Website</p>
                        <a
                          href={account.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary-600 hover:text-primary-800"
                        >
                          {account.website}
                        </a>
                      </div>
                    </div>
                  )}
                  {account.industry && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Industry</p>
                        <p className="text-sm text-gray-600">{account.industry}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Account Contacts Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Contacts</h2>
                    <p className="text-sm text-gray-500">
                      {loadingContacts
                        ? 'Loading contacts...'
                        : `${accountContacts.length} contact${accountContacts.length !== 1 ? 's' : ''} linked to this account`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleOpenExistingContactModal}
                      className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <LinkIcon className="mr-1.5 h-4 w-4" />
                      Link Existing
                    </button>
                    <button
                      onClick={handleOpenNewContactModal}
                      className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-3 py-1.5 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                    >
                      <UserPlusIcon className="mr-1.5 h-4 w-4" />
                      New Contact
                    </button>
                  </div>
                </div>
              </div>
              <div className="px-6 py-6">
                {loadingContacts ? (
                  <div className="flex flex-col items-center justify-center py-12 text-sm text-gray-500">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
                    <p className="mt-3">Loading contacts...</p>
                  </div>
                ) : accountContacts.length > 0 ? (
                  <div className="space-y-4">
                    {accountContacts.map(contact => {
                      const fullName = `${contact.first_name || ''} ${contact.last_name || ''}`.trim()
                      const displayName = fullName || contact.email || 'Unnamed Contact'
                      const initials = (contact.first_name?.[0] || '') + (contact.last_name?.[0] || '') || contact.email?.[0] || 'C'

                      return (
                        <div
                          key={contact.id}
                          className="flex flex-col gap-4 rounded-lg border border-gray-200 p-4 md:flex-row md:items-center md:justify-between"
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-medium text-primary-700">
                                {initials.toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-gray-900">{displayName}</p>
                                <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
                                  {contact.is_primary && (
                                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-800">
                                      Primary
                                    </span>
                                  )}
                                  {contact.is_decision_maker && (
                                    <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 font-medium text-purple-800">
                                      Decision Maker
                                    </span>
                                  )}
                                  {contact.status && (
                                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">
                                      {contact.status}
                                    </span>
                                  )}
                                  {contact.lifecycle_stage && (
                                    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                                      {contact.lifecycle_stage.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-gray-600">
                              {contact.email && (
                                <a href={`mailto:${contact.email}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-800">
                                  <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                                  {contact.email}
                                </a>
                              )}
                              {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-1 text-primary-600 hover:text-primary-800">
                                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                                  {contact.phone}
                                </a>
                              )}
                              {contact.mobile_phone && (
                                <span className="flex items-center gap-1">
                                  <PhoneIcon className="h-4 w-4 text-gray-400" />
                                  {contact.mobile_phone}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => navigate(`/app/contacts/${contact.id}`)}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <UserIcon className="mr-1.5 h-4 w-4" /> View
                            </button>
                            <button
                              onClick={() => handleEditContact(contact)}
                              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                              <PencilIcon className="mr-1.5 h-4 w-4" /> Edit
                            </button>
                            {contact.is_primary ? (
                              <button
                                onClick={() => handleClearPrimaryContact(contact.id)}
                                className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                              >
                                Remove Primary
                              </button>
                            ) : (
                              <button
                                onClick={() => handleSetPrimaryContact(contact.id)}
                                className="inline-flex items-center rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100"
                              >
                                Set Primary
                              </button>
                            )}
                            <button
                              onClick={() => handleUnlinkContact(contact.id)}
                              className="inline-flex items-center rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-600 hover:bg-red-50"
                            >
                              <UserMinusIcon className="mr-1.5 h-4 w-4" /> Unlink
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                    <p>No contacts linked to this account yet.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        onClick={handleOpenNewContactModal}
                        className="inline-flex items-center rounded-md border border-primary-600 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100"
                      >
                        <UserPlusIcon className="mr-1.5 h-4 w-4" /> New Contact
                      </button>
                      <button
                        onClick={handleOpenExistingContactModal}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <LinkIcon className="mr-1.5 h-4 w-4" /> Link Existing
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Account Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Account Details</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(account.status)}`}>
                      {account.status || 'active'}
                    </span>
                  </div>
                  {account.annual_revenue && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Annual Revenue</p>
                      <p className="text-sm font-bold text-green-600">
                        ${parseFloat(account.annual_revenue).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                  {account.employee_count && (
                    <div>
                      <p className="text-sm font-medium text-gray-500 mb-1">Employee Count</p>
                      <div className="flex items-center space-x-2">
                        <UsersIcon className="h-4 w-4 text-gray-400" />
                        <p className="text-sm text-gray-900 font-medium">{account.employee_count}</p>
                      </div>
                    </div>
                  )}
                </div>
                {account.parent_account_name && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Parent Account</p>
                    <p className="text-sm text-gray-900 font-medium">{account.parent_account_name}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Description Section */}
            {account.description && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Description</h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{account.description}</p>
                </div>
              </div>
            )}

            {/* Notes Section */}
            {account.notes && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{account.notes}</p>
                </div>
              </div>
            )}

            {/* Account Activities */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Activities</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {accountActivities.length} activit{accountActivities.length !== 1 ? 'ies' : 'y'}
                  </span>
                  <button
                    onClick={() => setShowActivityForm(true)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Activity
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                {loadingActivities ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : accountActivities.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No activities for this account</p>
                ) : (
                  <div className="space-y-3">
                    {accountActivities.map((activity) => (
                      <div
                        key={activity.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{activity.subject}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {activity.activity_type} • {format(new Date(activity.created_at), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          activity.is_completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {activity.is_completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Tasks */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {accountTasks.length} task{accountTasks.length !== 1 ? 's' : ''}
                  </span>
                  <button
                    onClick={() => setShowTaskForm(true)}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700"
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Task
                  </button>
                </div>
              </div>
              <div className="px-6 py-4">
                {loadingTasks ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : accountTasks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No tasks for this account</p>
                ) : (
                  <div className="space-y-3">
                    {accountTasks.map((task) => (
                      <div
                        key={task.id}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{task.title}</p>
                          <p className="text-xs text-gray-500 mt-1">
                            {task.task_type} • {task.due_date ? format(new Date(task.due_date), 'MMM dd, yyyy') : 'No due date'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            task.status === 'completed' ? 'bg-green-100 text-green-800' :
                            task.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {task.status}
                          </span>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            task.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                            task.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                            task.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Account Leads */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Associated Leads</h2>
                <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                  {accountLeads.length} lead{accountLeads.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div className="px-6 py-4">
                {loadingLeads ? (
                  <div className="text-center py-4">
                    <div className="w-6 h-6 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto"></div>
                  </div>
                ) : accountLeads.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">No leads associated with this account</p>
                ) : (
                  <div className="space-y-3">
                    {accountLeads.map((lead) => (
                      <div
                        key={lead.id}
                        onClick={() => navigate(`/app/leads/${lead.id}`)}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </p>
                          {lead.email && (
                            <p className="text-xs text-gray-500">{lead.email}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            lead.status === 'new' ? 'bg-green-100 text-green-800' :
                            lead.status === 'qualified' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {lead.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Child Accounts */}
            {account.child_accounts && account.child_accounts.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Child Accounts</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {account.child_accounts.length} account{account.child_accounts.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <div className="space-y-3">
                    {account.child_accounts.map((child) => (
                      <div
                        key={child.id}
                        onClick={() => navigate(`/app/accounts/${child.id}`)}
                        className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900">{child.name}</p>
                          {child.industry && (
                            <p className="text-xs text-gray-500">{child.industry}</p>
                          )}
                        </div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(child.status)}`}>
                          {child.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Account Timeline */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Timeline</h2>
                <p className="text-sm text-gray-500 mt-1">Complete history of activities, tasks, and changes</p>
              </div>
              <div className="px-6 py-4">
                <AccountTimeline timeline={accountTimeline} loading={loadingTimeline} />
              </div>
            </div>

            {/* Custom Fields Section */}
            {account.custom_fields && Object.keys(account.custom_fields).length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Custom Fields</h2>
                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                    {Object.keys(account.custom_fields).length} field{Object.keys(account.custom_fields).length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="px-6 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(account.custom_fields).map(([key, value]) => {
                      const formattedKey = key
                        .split('_')
                        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                        .join(' ')
                      
                      const displayValue = (() => {
                        if (value === null || value === undefined) return 'N/A'
                        if (typeof value === 'boolean') return value ? 'Yes' : 'No'
                        if (typeof value === 'object') return JSON.stringify(value)
                        return String(value)
                      })()

                      return (
                        <div key={key} className="flex flex-col space-y-1">
                          <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                            {formattedKey}
                          </dt>
                          <dd className="text-sm text-gray-900 font-medium break-words">
                            {displayValue}
                          </dd>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Account Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Account Summary</h3>
              </div>
              <div className="px-4 py-3">
                <dl className="space-y-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-xs font-medium text-gray-500">Account ID</dt>
                    <dd className="text-xs text-gray-900 font-mono">
                      {account.id.substring(0, 8)}...
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-xs font-medium text-gray-500">Created</dt>
                    <dd className="text-xs text-gray-900">
                      {account.created_at
                        ? format(new Date(account.created_at), 'MMM dd, yyyy')
                        : '-'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-xs font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-xs text-gray-900">
                      {account.updated_at
                        ? format(new Date(account.updated_at), 'MMM dd, yyyy')
                        : '-'}
                    </dd>
                  </div>
                  {account.assigned_user_first_name && (
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Assigned To</dt>
                      <dd className="text-xs text-gray-900">
                        {account.assigned_user_first_name} {account.assigned_user_last_name}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Account Statistics */}
            {accountStats && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-4 py-3 border-b border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900">Statistics</h3>
                </div>
                <div className="px-4 py-3">
                  <dl className="space-y-3">
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Leads</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {accountStats.leads_count || 0}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Activities</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {accountStats.activities_count || 0}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Tasks</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {accountStats.tasks_count || 0}
                      </dd>
                    </div>
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Child Accounts</dt>
                      <dd className="text-sm font-semibold text-gray-900">
                        {accountStats.child_accounts_count || 0}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      {showEditForm && (
        <AccountForm
          account={account}
          onClose={() => setShowEditForm(false)}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Activity Form Modal */}
      {showActivityForm && (
        <ActivityForm
          isOpen={showActivityForm}
          onClose={() => setShowActivityForm(false)}
          onSubmit={handleActivitySaved}
          accountId={id}
          selectedAccount={account}
        />
      )}

      {/* Task Form Modal */}
      {showTaskForm && (
        <TaskForm
          isOpen={showTaskForm}
          onCancel={() => setShowTaskForm(false)}
          onSave={async (taskData) => {
            try {
              await taskService.createTask(taskData)
              toast.success('Task created successfully')
              handleTaskSaved()
              setShowTaskForm(false)
            } catch (error) {
              console.error('Failed to create task:', error)
              toast.error('Failed to create task')
            }
          }}
          accountId={id}
        />
      )}

      <ContactForm
        isOpen={showContactModal}
        contact={selectedContact}
        defaultAccountId={id}
        lockAccountSelection={!selectedContact}
        onClose={() => {
          setShowContactModal(false)
          setSelectedContact(null)
        }}
        onSuccess={handleContactFormSuccess}
      />

      <Modal
        isOpen={showExistingContactModal}
        onClose={() => setShowExistingContactModal(false)}
        title="Link Existing Contact"
        size="lg"
      >
        <div className="space-y-4">
          <form onSubmit={handleContactSearchSubmit} className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={contactSearchTerm}
              onChange={(event) => setContactSearchTerm(event.target.value)}
              placeholder="Search contacts by name, email, or phone"
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              Search
            </button>
          </form>

          <div className="max-h-80 space-y-3 overflow-y-auto rounded-lg border border-gray-200 p-3">
            {searchingContacts ? (
              <div className="flex items-center justify-center py-8 text-sm text-gray-500">
                Searching contacts...
              </div>
            ) : availableContactsToLink.length > 0 ? (
              availableContactsToLink.map(contact => (
                  <div
                    key={contact.id}
                    className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {`${contact.first_name || ''} ${contact.last_name || ''}`.trim() || contact.full_name || contact.email || 'Unnamed Contact'}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-xs text-gray-500">
                        {contact.email && <span>{contact.email}</span>}
                        {contact.phone && <span>{contact.phone}</span>}
                        {contact.mobile_phone && <span>Mobile: {contact.mobile_phone}</span>}
                        {contact.account_name && contact.account_id && contact.account_id !== id && (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                            Linked to {contact.account_name}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/app/contacts/${contact.id}`)}
                        className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                      >
                        <UserIcon className="mr-1.5 h-4 w-4" /> View
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLinkExistingContact(contact.id)}
                        disabled={linkingContactId === contact.id}
                        className="inline-flex items-center rounded-md border border-primary-600 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {linkingContactId === contact.id ? 'Linking...' : 'Link to Account'}
                      </button>
                    </div>
                  </div>
                ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-sm text-gray-500">
                <p>No matching contacts found. Try a different search term.</p>
                <button
                  type="button"
                  onClick={handleOpenNewContactModal}
                  className="mt-3 inline-flex items-center rounded-md border border-primary-600 bg-primary-50 px-3 py-1.5 text-sm font-medium text-primary-600 hover:bg-primary-100"
                >
                  <UserPlusIcon className="mr-1.5 h-4 w-4" /> Create New Contact
                </button>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default AccountDetail

