import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowUpTrayIcon } from '@heroicons/react/24/outline'
import ImportWizard from '../components/Import/ImportWizard'
import ExportModal from '../components/Export/ExportModal'
import LeadForm from '../components/LeadForm'
import { useLeads } from '../context/LeadContext'
import pipelineService from '../services/pipelineService'
import toast from 'react-hot-toast'

const Leads = () => {
  const navigate = useNavigate()
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAddLeadForm, setShowAddLeadForm] = useState(false)
  const [pipelineStages, setPipelineStages] = useState([])
  
  // Use the global leads context
  const { leads, loading, fetchLeads, addLead, lastUpdated, refreshLeads } = useLeads()

  // Load leads and pipeline stages on component mount
  useEffect(() => {
    const loadData = async () => {
      await fetchLeads()
      try {
        const stagesResponse = await pipelineService.getStages()
        if (stagesResponse.success) {
          setPipelineStages(stagesResponse.data)
        }
      } catch (error) {
        console.error('Failed to fetch pipeline stages:', error)
      }
    }
    loadData()
  }, []) // Remove fetchLeads dependency to prevent infinite loops

  // Refresh pipeline stages when leads are updated (for better sync)
  useEffect(() => {
    const refreshStages = async () => {
      try {
        const stagesResponse = await pipelineService.getStages()
        if (stagesResponse.success) {
          setPipelineStages(stagesResponse.data)
        }
      } catch (error) {
        console.error('Failed to refresh pipeline stages:', error)
      }
    }
    
    if (lastUpdated) {
      refreshStages()
    }
  }, [lastUpdated])

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

  const getStageName = (stageId) => {
    if (!stageId) return 'No Stage'
    const stage = pipelineStages.find(s => s.id === stageId)
    return stage ? stage.name : 'Unknown Stage'
  }

  const getStageColor = (stageId) => {
    if (!stageId) return 'bg-gray-100 text-gray-800'
    const stage = pipelineStages.find(s => s.id === stageId)
    if (!stage) return 'bg-gray-100 text-gray-800'
    
    // Use predefined colors based on stage color
    const colorMap = {
      '#3B82F6': 'bg-blue-100 text-blue-800',
      '#10B981': 'bg-green-100 text-green-800',
      '#F59E0B': 'bg-yellow-100 text-yellow-800',
      '#EF4444': 'bg-red-100 text-red-800',
      '#8B5CF6': 'bg-purple-100 text-purple-800',
      '#F97316': 'bg-orange-100 text-orange-800',
      '#06B6D4': 'bg-cyan-100 text-cyan-800',
      '#EC4899': 'bg-pink-100 text-pink-800'
    }
    
    return colorMap[stage.color] || 'bg-gray-100 text-gray-800'
  }

  // Handle lead creation success
  const handleLeadCreated = (newLead) => {
    setShowAddLeadForm(false)
    addLead(newLead) // Add the new lead to the global state
    toast.success('Lead created successfully')
  }

  // Debug: Log leads data
  useEffect(() => {
    console.log('Leads page - Current leads:', leads)
    console.log('Leads page - Pipeline stages:', pipelineStages)
  }, [leads, pipelineStages])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <div className="sm:flex sm:items-center sm:justify-between">
              <div className="sm:flex-auto">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-primary-100 rounded-lg">
                    <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">Leads</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Manage your leads and track their progress through the sales pipeline
                    </p>
                  </div>
                </div>
                {leads.length > 0 && (
                  <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      {leads.length} total leads
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      {leads.filter(lead => lead.status === 'new').length} new
                    </span>
                    <span className="flex items-center">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      {leads.filter(lead => lead.status === 'qualified').length} qualified
                    </span>
                  </div>
                )}
              </div>
              <div className="mt-6 sm:mt-0 sm:ml-16 sm:flex-none">
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={() => refreshLeads()}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportWizard(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    Import
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLeadForm(true)}
                    className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    Add Lead
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
                  placeholder="Search leads by name, company, or email..."
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                <option>All Status</option>
                <option>New</option>
                <option>Contacted</option>
                <option>Qualified</option>
                <option>Converted</option>
                <option>Lost</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                <option>All Sources</option>
                <option>Website</option>
                <option>Referral</option>
                <option>Cold Call</option>
                <option>Social Media</option>
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                <option>All Stages</option>
                {pipelineStages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Leads Table */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {loading ? (
            <div className="p-12">
              <div className="flex flex-col items-center justify-center">
                <div className="relative">
                  <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-8 h-8 bg-primary-100 rounded-full animate-pulse"></div>
                  </div>
                </div>
                <p className="mt-4 text-lg font-medium text-gray-900">Loading leads...</p>
                <p className="mt-1 text-sm text-gray-500">Please wait while we fetch your data</p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Company
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Source
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Pipeline Stage
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Created
                    </th>
                    <th className="relative px-6 py-4">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {leads.map((lead) => (
                    <tr 
                      key={lead.id} 
                      className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent cursor-pointer transition-all duration-200 group" 
                      onClick={() => navigate(`/app/leads/${lead.id}`)}
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-12 w-12">
                            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow duration-200">
                              <span className="text-sm font-semibold text-primary-700">
                                {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                              </span>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors duration-200">
                              {lead.first_name} {lead.last_name}
                            </div>
                            <div className="text-sm text-gray-500">{lead.email}</div>
                            {lead.phone && (
                              <div className="text-xs text-gray-400">{lead.phone}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {lead.company || <span className="text-gray-400 italic">No company</span>}
                        </div>
                        {lead.job_title && (
                          <div className="text-sm text-gray-500">{lead.job_title}</div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)} shadow-sm`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${
                            lead.status === 'new' ? 'bg-green-400' :
                            lead.status === 'contacted' ? 'bg-blue-400' :
                            lead.status === 'qualified' ? 'bg-yellow-400' :
                            lead.status === 'converted' ? 'bg-purple-400' :
                            'bg-red-400'
                          }`}></div>
                          {lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getSourceColor(lead.lead_source)} shadow-sm`}>
                          {lead.lead_source?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStageColor(lead.pipeline_stage_id)} shadow-sm`}>
                          {getStageName(lead.pipeline_stage_id)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex flex-col">
                          <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(lead.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button 
                            className="text-primary-600 hover:text-primary-800 p-2 rounded-lg hover:bg-primary-50 transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                            title="Edit lead"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                            onClick={(e) => e.stopPropagation()}
                            title="Delete lead"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Empty State */}
      {!loading && leads.length === 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="mx-auto w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-full flex items-center justify-center mb-6">
              <PlusIcon className="h-12 w-12 text-primary-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No leads yet</h3>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              Start building your sales pipeline by adding your first lead. You can import leads from a file or create them manually.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                type="button"
                onClick={() => setShowAddLeadForm(true)}
                className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                Create Your First Lead
              </button>
              <button
                type="button"
                onClick={() => setShowImportWizard(true)}
                className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              >
                <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
                Import Leads
              </button>
            </div>
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Track Contacts</h4>
                <p className="text-sm text-gray-600">Keep all your potential customers organized in one place</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Monitor Progress</h4>
                <p className="text-sm text-gray-600">Follow leads through your sales pipeline stages</p>
              </div>
              <div className="text-center">
                <div className="mx-auto w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Boost Sales</h4>
                <p className="text-sm text-gray-600">Convert more leads into paying customers</p>
              </div>
            </div>
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