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
      navigate('/leads')
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
      navigate('/leads')
    } catch (error) {
      console.error('Failed to delete lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  const handleActivitySubmit = (activityData) => {
    toast.success('Activity added successfully')
    setShowActivityForm(false)
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
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        <p className="mt-2 text-sm text-gray-500">Loading lead details...</p>
      </div>
    )
  }

  if (!lead) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-gray-500">Lead not found</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate('/leads')}
              className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {lead.first_name} {lead.last_name}
              </h1>
              <p className="text-sm text-gray-500">Lead Details</p>
            </div>
          </div>
          <div className="flex space-x-3">
            <button 
              onClick={handleEdit}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              <PencilIcon className="h-4 w-4 mr-2" />
              Edit
            </button>
            <button 
              onClick={handleDelete}
              className="inline-flex items-center px-4 py-2 border border-red-300 shadow-sm text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
            >
              <TrashIcon className="h-4 w-4 mr-2" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info Card */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center mb-6">
              <div className="flex-shrink-0 h-16 w-16">
                <div className="h-16 w-16 rounded-full bg-primary-100 flex items-center justify-center">
                  <span className="text-xl font-medium text-primary-600">
                    {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                  </span>
                </div>
              </div>
              <div className="ml-4 flex-1">
                <h2 className="text-xl font-semibold text-gray-900">
                  {lead.first_name} {lead.last_name}
                </h2>
                <p className="text-sm text-gray-500">{lead.job_title || 'No title'}</p>
                <div className="mt-2 flex items-center space-x-4">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                    {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                  </span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(lead.lead_source)}`}>
                    {lead.lead_source?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Contact Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email</p>
                    <a href={`mailto:${lead.email}`} className="text-sm text-primary-600 hover:text-primary-800">
                      {lead.email}
                    </a>
                  </div>
                </div>
                {lead.phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <a href={`tel:${lead.phone}`} className="text-sm text-primary-600 hover:text-primary-800">
                        {lead.phone}
                      </a>
                    </div>
                  </div>
                )}
                {lead.company && (
                  <div className="flex items-center">
                    <BuildingOfficeIcon className="h-5 w-5 text-gray-400 mr-3" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Company</p>
                      <p className="text-sm text-gray-600">{lead.company}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Additional Details Section */}
            <div className="mt-6 space-y-6">
              {/* Lead Details Grid */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {lead.job_title && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Job Title</dt>
                      <dd className="text-sm text-gray-900">{lead.job_title}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Lead Source</dt>
                    <dd className="text-sm text-gray-900 capitalize">
                      {lead.lead_source?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Status</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Priority</dt>
                    <dd className="text-sm text-gray-900">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        lead.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                        lead.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                        lead.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {lead.priority?.charAt(0).toUpperCase() + lead.priority?.slice(1)}
                      </span>
                    </dd>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              {lead.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Notes</h3>
                  <div className="bg-gray-50 rounded-lg p-4 border">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{lead.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Lead Summary */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Summary</h3>
            <dl className="space-y-3">
              <div>
                <dt className="text-sm font-medium text-gray-500">Created Date</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(lead.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                <dd className="text-sm text-gray-900">
                  {new Date(lead.updated_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </dd>
              </div>
              {(lead.assigned_user_first_name || lead.assigned_user_last_name) && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
                  <dd className="text-sm text-gray-900">
                    {lead.assigned_user_first_name} {lead.assigned_user_last_name}
                  </dd>
                </div>
              )}
              {lead.priority && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Priority</dt>
                  <dd className="text-sm text-gray-900 capitalize">{lead.priority}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Quick Actions */}
          <div className="card">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
            <div className="space-y-3">
              {lead.email && (
                <a
                  href={`mailto:${lead.email}`}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <EnvelopeIcon className="h-4 w-4 mr-2" />
                  Send Email
                </a>
              )}
              {lead.phone && (
                <a
                  href={`tel:${lead.phone}`}
                  className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  <PhoneIcon className="h-4 w-4 mr-2" />
                  Call Now
                </a>
              )}
              <button 
                onClick={() => {
                  setActivityType('note')
                  setShowActivityForm(true)
                }}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700"
              >
                Add Activity
              </button>
              <button 
                onClick={() => setShowTaskForm(true)}
                className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700"
              >
                Create Task
              </button>
            </div>
          </div>

          {/* Value Information */}
          {lead.value && (
            <div className="card">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Lead Value</h3>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary-600">
                  ${parseFloat(lead.value).toLocaleString()}
                </p>
                <p className="text-sm text-gray-500 mt-1">Estimated Value</p>
              </div>
            </div>
          )}
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