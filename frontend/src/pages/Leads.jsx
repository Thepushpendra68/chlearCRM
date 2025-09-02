import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import ImportWizard from '../components/Import/ImportWizard'
import ExportModal from '../components/Export/ExportModal'
import LeadForm from '../components/LeadForm'
import leadService from '../services/leadService'
import toast from 'react-hot-toast'

const Leads = () => {
  const navigate = useNavigate()
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAddLeadForm, setShowAddLeadForm] = useState(false)
  const [leads, setLeads] = useState([])
  const [loading, setLoading] = useState(true)

  // Fetch leads from API
  const fetchLeads = async () => {
    try {
      setLoading(true)
      const response = await leadService.getLeads()
      setLeads(response.data || [])
    } catch (error) {
      console.error('Failed to fetch leads:', error)
      toast.error('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  // Load leads on component mount
  useEffect(() => {
    fetchLeads()
  }, [])

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

  // Handle lead creation success
  const handleLeadCreated = () => {
    setShowAddLeadForm(false)
    fetchLeads() // Refresh the leads list
    toast.success('Lead created successfully')
  }

  return (
    <div>
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage your leads and track their progress through the sales pipeline.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none flex space-x-3">
          <button
            type="button"
            onClick={() => setShowImportWizard(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
            Import
          </button>
          <button
            type="button"
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
            Export
          </button>
          <button
            type="button"
            onClick={() => setShowAddLeadForm(true)}
            className="btn-primary"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add Lead
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="mb-6">
        <div className="max-w-lg">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              className="input pl-10"
              placeholder="Search leads..."
            />
          </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="card">
        <div className="overflow-hidden">
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              <p className="mt-2 text-sm text-gray-500">Loading leads...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {leads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/leads/${lead.id}`)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                            <span className="text-sm font-medium text-primary-600">
                              {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {lead.company || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(lead.status)}`}>
                        {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSourceColor(lead.lead_source)}`}>
                        {lead.lead_source?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(lead.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button 
                        className="text-primary-600 hover:text-primary-900 mr-4"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Edit
                      </button>
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => e.stopPropagation()}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Empty State */}
      {!loading && leads.length === 0 && (
        <div className="text-center py-12">
          <PlusIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No leads</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new lead.</p>
          <div className="mt-6">
            <button
              type="button"
              onClick={() => setShowAddLeadForm(true)}
              className="btn-primary"
            >
              <PlusIcon className="h-4 w-4 mr-2" />
              Add Lead
            </button>
          </div>
        </div>
      )}

      {/* Import/Export Modals */}
      <ImportWizard
        isOpen={showImportWizard}
        onClose={() => setShowImportWizard(false)}
        onImportComplete={() => {
          // Refresh leads list or show success message
          console.log('Import completed successfully')
        }}
      />
      
      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* Add Lead Modal */}
      {showAddLeadForm && (
        <LeadForm
          onClose={() => setShowAddLeadForm(false)}
          onSuccess={handleLeadCreated}
        />
      )}
    </div>
  )
}

export default Leads