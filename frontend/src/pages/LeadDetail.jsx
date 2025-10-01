import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeftIcon, PencilIcon, TrashIcon, PhoneIcon, EnvelopeIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import leadService from '../services/leadService'
import LeadForm from '../components/LeadForm'
import ActivityForm from '../components/Activities/ActivityForm'
import TaskForm from '../components/Tasks/TaskForm'
import taskService from '../services/taskService'
import toast from 'react-hot-toast'

const LeadDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showActivityForm, setShowActivityForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [activityType, setActivityType] = useState('note')

  useEffect(() => {
    fetchLead()
  }, [id])

  const fetchLead = async () => {
    try {
      setLoading(true)
      const response = await leadService.getLeadById(id)
      setLead(response.data)
    } catch (error) {
      console.error('Failed to fetch lead:', error)
      toast.error('Failed to load lead details')
      navigate('/app/leads')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800'
      case 'converted':
        return 'bg-purple-100 text-purple-800'
      case 'lost':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getSourceColor = (source) => {
    switch (source) {
      case 'website':
        return 'bg-primary-100 text-primary-800'
      case 'referral':
        return 'bg-green-100 text-green-800'
      case 'social_media':
        return 'bg-pink-100 text-pink-800'
      case 'cold_call':
        return 'bg-orange-100 text-orange-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const handleEdit = () => {
    setShowEditForm(true)
  }

  const handleEditSuccess = () => {
    setShowEditForm(false)
    fetchLead() // Refresh lead data
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this lead?')) {
      return
    }

    try {
      await leadService.deleteLead(id)
      toast.success('Lead deleted successfully')
      navigate('/app/leads')
    } catch (error) {
      console.error('Failed to delete lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const handleActivitySubmit = (activityData) => {
    console.log('Activity submitted for lead:', activityData)
    toast.success('Activity added successfully')
    setShowActivityForm(false)
    // Could refresh lead data or update timeline here if needed
  }

  const handleTaskSubmit = async (taskData) => {
    try {
      await taskService.createTask(taskData)
      toast.success('Task created successfully')
      setShowTaskForm(false)
    } catch (error) {
      console.error('Failed to create task:', error)
      toast.error('Failed to create task')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-8 h-8 border-2 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            <p className="mt-4 text-sm font-medium text-gray-900">Loading lead details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead not found</h3>
            <p className="text-sm text-gray-600 mb-6">The lead you're looking for doesn't exist or has been removed.</p>
            <button
              onClick={() => navigate('/app/leads')}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back to Leads
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Compact Modern Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => navigate('/app/leads')}
                  className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <ArrowLeftIcon className="h-4 w-4" />
                </button>
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary-700">
                      {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                    </span>
                  </div>
                  <div>
                    <h1 className="text-lg font-semibold text-gray-900">
                      {lead.first_name} {lead.last_name}
                    </h1>
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                      </span>
                      {lead.company && (
                        <span className="text-xs text-gray-500">• {lead.company}</span>
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
                <button 
                  onClick={handleDelete}
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <TrashIcon className="h-4 w-4 mr-1.5" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Contact Information Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                      <EnvelopeIcon className="h-4 w-4 text-primary-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <a href={`mailto:${lead.email}`} className="text-sm text-primary-600 hover:text-primary-800">
                        {lead.email}
                      </a>
                    </div>
                  </div>
                  {lead.phone && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <PhoneIcon className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Phone</p>
                        <a href={`tel:${lead.phone}`} className="text-sm text-primary-600 hover:text-primary-800">
                          {lead.phone}
                        </a>
                      </div>
                    </div>
                  )}
                  {lead.company && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BuildingOfficeIcon className="h-4 w-4 text-purple-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Company</p>
                        <p className="text-sm text-gray-600">{lead.company}</p>
                      </div>
                    </div>
                  )}
                  {lead.job_title && (
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                        <svg className="h-4 w-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V8a2 2 0 012-2V6" />
                        </svg>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">Job Title</p>
                        <p className="text-sm text-gray-600">{lead.job_title}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lead Details Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Lead Details</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Lead Source</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(lead.lead_source)}`}>
                      {lead.lead_source?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Status</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                      {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Priority</p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      lead.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                      lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                      lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {lead.priority?.charAt(0).toUpperCase() + lead.priority?.slice(1) || 'Medium'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pipeline & Deal Information Card */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Pipeline & Deal Information</h2>
              </div>
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Pipeline Stage</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {lead.pipeline_stage_id ? 'Stage Assigned' : 'No Stage'}
                    </p>
                    {lead.pipeline_stage_id && (
                      <p className="text-xs text-gray-500">ID: {lead.pipeline_stage_id.substring(0, 8)}...</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Deal Value</p>
                    {lead.deal_value ? (
                      <p className="text-sm font-bold text-green-600">
                        ${parseFloat(lead.deal_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    ) : (
                      <p className="text-sm text-gray-400">No value set</p>
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Probability</p>
                    {lead.probability !== null && lead.probability !== undefined ? (
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${lead.probability}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{lead.probability}%</span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Not set</p>
                    )}
                  </div>
                </div>

                {lead.expected_close_date && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <p className="text-sm font-medium text-gray-500 mb-1">Expected Close Date</p>
                    <div className="flex items-center space-x-2">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <p className="text-sm text-gray-900 font-medium">
                        {new Date(lead.expected_close_date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        new Date(lead.expected_close_date) < new Date() ? 'bg-red-100 text-red-800' :
                        new Date(lead.expected_close_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {new Date(lead.expected_close_date) < new Date() ? 'Overdue' :
                         new Date(lead.expected_close_date) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) ? 'Due Soon' :
                         'Future'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Notes Section */}
            {lead.notes && (
              <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
                </div>
                <div className="px-6 py-4">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Lead Summary */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Lead Summary</h3>
              </div>
              <div className="px-4 py-3">
                <dl className="space-y-3">
                  <div className="flex justify-between items-center">
                    <dt className="text-xs font-medium text-gray-500">Lead ID</dt>
                    <dd className="text-xs text-gray-900 font-mono">
                      {lead.id?.substring(0, 8)}...
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-xs font-medium text-gray-500">Created</dt>
                    <dd className="text-xs text-gray-900">
                      {new Date(lead.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center">
                    <dt className="text-xs font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-xs text-gray-900">
                      {new Date(lead.updated_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </dd>
                  </div>
                  {(lead.assigned_user_first_name || lead.assigned_user_last_name) && (
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Assigned To</dt>
                      <dd className="text-xs text-gray-900">
                        {lead.assigned_user_first_name} {lead.assigned_user_last_name}
                      </dd>
                    </div>
                  )}
                  {lead.assigned_at && (
                    <div className="flex justify-between items-center">
                      <dt className="text-xs font-medium text-gray-500">Assigned Date</dt>
                      <dd className="text-xs text-gray-900">
                        {new Date(lead.assigned_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric'
                        })}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            {/* Deal Value Card */}
            {lead.deal_value && (
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg border border-green-200 shadow-sm">
                <div className="px-4 py-3 border-b border-green-200">
                  <h3 className="text-sm font-semibold text-green-900">Deal Value</h3>
                </div>
                <div className="px-4 py-4 text-center">
                  <p className="text-2xl font-bold text-green-600 mb-1">
                    ${parseFloat(lead.deal_value).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-xs text-green-700">Estimated Revenue</p>
                  {lead.probability !== null && lead.probability !== undefined && (
                    <div className="mt-2 pt-2 border-t border-green-200">
                      <p className="text-xs text-green-600">
                        Expected Value: ${(parseFloat(lead.deal_value) * (lead.probability / 100)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Lead Score/Health */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Lead Health</h3>
              </div>
              <div className="px-4 py-3">
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-500">Contact Info</span>
                      <span className={`text-xs font-medium ${(lead.email && lead.phone) ? 'text-green-600' : (lead.email || lead.phone) ? 'text-yellow-600' : 'text-red-600'}`}>
                        {(lead.email && lead.phone) ? 'Complete' : (lead.email || lead.phone) ? 'Partial' : 'Missing'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${(lead.email && lead.phone) ? 'bg-green-500' : (lead.email || lead.phone) ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(lead.email && lead.phone) ? '100' : (lead.email || lead.phone) ? '50' : '0'}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-500">Company Info</span>
                      <span className={`text-xs font-medium ${(lead.company && lead.job_title) ? 'text-green-600' : lead.company ? 'text-yellow-600' : 'text-red-600'}`}>
                        {(lead.company && lead.job_title) ? 'Complete' : lead.company ? 'Partial' : 'Missing'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${(lead.company && lead.job_title) ? 'bg-green-500' : lead.company ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${(lead.company && lead.job_title) ? '100' : lead.company ? '50' : '0'}%` }}
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs font-medium text-gray-500">Deal Details</span>
                      <span className={`text-xs font-medium ${lead.deal_value ? 'text-green-600' : 'text-gray-500'}`}>
                        {lead.deal_value ? 'Set' : 'Not Set'}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div
                        className={`h-1.5 rounded-full ${lead.deal_value ? 'bg-green-500' : 'bg-gray-300'}`}
                        style={{ width: `${lead.deal_value ? '100' : '0'}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Quick Actions</h3>
              </div>
              <div className="px-4 py-3">
                <div className="space-y-2">
                  {lead.email && (
                    <a
                      href={`mailto:${lead.email}`}
                      className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-primary-50 hover:text-primary-700 transition-colors"
                    >
                      <EnvelopeIcon className="h-3 w-3 mr-2" />
                      Send Email
                    </a>
                  )}
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone}`}
                      className="flex items-center px-3 py-2 text-xs font-medium text-gray-700 bg-gray-50 rounded-md hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <PhoneIcon className="h-3 w-3 mr-2" />
                      Call Now
                    </a>
                  )}
                  <button 
                    onClick={() => {
                      setActivityType('note')
                      setShowActivityForm(true)
                    }}
                    className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors"
                  >
                    <svg className="h-3 w-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Add Activity
                  </button>
                  <button 
                    onClick={() => setShowTaskForm(true)}
                    className="w-full flex items-center justify-center px-3 py-2 text-xs font-medium text-white bg-green-600 rounded-md hover:bg-green-700 transition-colors"
                  >
                    <svg className="h-3 w-3 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                    Create Task
                  </button>
                </div>
              </div>
            </div>

            {/* Lead Metadata */}
            <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-900">Additional Information</h3>
              </div>
              <div className="px-4 py-3">
                <dl className="space-y-2">
                  <div className="flex justify-between items-center text-xs">
                    <dt className="font-medium text-gray-500">Assignment Method</dt>
                    <dd className="text-gray-900 capitalize">
                      {lead.assignment_source || 'Manual'}
                    </dd>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <dt className="font-medium text-gray-500">Full Name</dt>
                    <dd className="text-gray-900">
                      {lead.name || `${lead.first_name || ''} ${lead.last_name || ''}`.trim()}
                    </dd>
                  </div>
                  {lead.created_by && (
                    <div className="flex justify-between items-center text-xs">
                      <dt className="font-medium text-gray-500">Created By</dt>
                      <dd className="text-gray-900">User ID: {lead.created_by.substring(0, 8)}...</dd>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-xs">
                    <dt className="font-medium text-gray-500">Record Age</dt>
                    <dd className="text-gray-900">
                      {Math.floor((new Date() - new Date(lead.created_at)) / (1000 * 60 * 60 * 24))} days
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Edit Lead Modal */}
        {showEditForm && (
          <LeadForm
            lead={lead}
            onClose={() => setShowEditForm(false)}
            onSuccess={handleEditSuccess}
          />
        )}

        {/* Activity Form Modal */}
        {showActivityForm && (
          <ActivityForm
            isOpen={showActivityForm}
            onClose={() => setShowActivityForm(false)}
            onSubmit={handleActivitySubmit}
            leadId={id}
            initialType={activityType}
          />
        )}

        {/* Task Form Modal */}
        {showTaskForm && (
          <TaskForm
            isOpen={showTaskForm}
            onSave={handleTaskSubmit}
            onCancel={() => setShowTaskForm(false)}
            task={{lead_id: id}}
          />
        )}
      </div>
  )
}

export default LeadDetail