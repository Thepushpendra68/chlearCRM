import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { PlusIcon, MagnifyingGlassIcon, ArrowDownTrayIcon, ArrowUpTrayIcon, TrashIcon } from '@heroicons/react/24/outline'
import ImportWizard from '../components/Import/ImportWizard'
import ExportModal from '../components/Export/ExportModal'
import LeadForm from '../components/LeadForm'
import { useLeads } from '../context/LeadContext'
import pipelineService from '../services/pipelineService'
import leadService from '../services/leadService'
import toast from 'react-hot-toast'
import { usePicklists } from '../context/PicklistContext'
import { MobileOnly, TabletAndDesktop, ResponsiveContainer, ContentWrapper, ResponsiveTableWrapper } from '../components/ResponsiveUtils'
import LeadsTableMobile from '../components/Leads/LeadsTableMobile'

const Leads = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [showImportWizard, setShowImportWizard] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [showAddLeadForm, setShowAddLeadForm] = useState(false)
  const [showEditLeadForm, setShowEditLeadForm] = useState(false)
  const [editingLead, setEditingLead] = useState(null)
  const [selectedLeads, setSelectedLeads] = useState([])
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [pipelineStages, setPipelineStages] = useState([])
  const [isPageChanging, setIsPageChanging] = useState(false)
  const { leadSources, leadStatuses } = usePicklists()

  const formatPicklistValue = (value, fallback = 'Unknown') => {
    if (!value) return fallback
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
  }

  const getStatusOption = (status) => leadStatuses.find(option => option.value === status)
  const getSourceOption = (source) => leadSources.find(option => option.value === source)

  const getStatusLabel = (status) => {
    const option = getStatusOption(status)
    return option?.label || formatPicklistValue(status)
  }

  const getSourceLabel = (source) => {
    const option = getSourceOption(source)
    return option?.label || formatPicklistValue(source)
  }
 
  // Use the global leads context
  const { leads, loading, pagination, fetchLeads, deleteLead, lastUpdated, refreshLeads } = useLeads()

  const totalItems = pagination?.total_items ?? leads.length
  const currentPage = pagination?.current_page ?? 1
  const itemsPerPage = pagination?.items_per_page ?? 20
  const totalPages = pagination?.total_pages ?? Math.max(1, Math.ceil(totalItems / (itemsPerPage || 1)))
  const hasNextPage = pagination?.has_next ?? currentPage < totalPages
  const hasPrevPage = pagination?.has_prev ?? currentPage > 1
  const startItemIndex = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1
  const endItemIndex = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems)
 
  useEffect(() => {
    const action = searchParams.get('action')
    if (action === 'create-lead') {
      setShowAddLeadForm(true)
      navigate('/app/leads', { replace: true })
    }
  }, [searchParams, navigate])

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
    const option = getStatusOption(status)

    if (option?.metadata?.is_won) {
      return 'bg-emerald-100 text-emerald-800'
    }

    if (option?.metadata?.is_lost) {
      return 'bg-red-100 text-red-800'
    }

    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800'
      case 'contacted':
        return 'bg-blue-100 text-blue-800'
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800'
      case 'proposal':
        return 'bg-amber-100 text-amber-800'
      case 'negotiation':
        return 'bg-purple-100 text-purple-800'
      case 'nurture':
        return 'bg-slate-100 text-slate-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIndicatorColor = (status) => {
    const option = getStatusOption(status)

    if (option?.metadata?.is_won) {
      return 'bg-emerald-500'
    }

    if (option?.metadata?.is_lost) {
      return 'bg-red-500'
    }

    switch (status) {
      case 'new':
        return 'bg-green-400'
      case 'contacted':
        return 'bg-blue-400'
      case 'qualified':
        return 'bg-yellow-400'
      case 'proposal':
        return 'bg-amber-400'
      case 'negotiation':
        return 'bg-purple-400'
      case 'nurture':
        return 'bg-slate-400'
      default:
        return 'bg-gray-400'
    }
  }

  const getSourceColor = (source) => {
    const option = getSourceOption(source)

    switch (source) {
      case 'website':
        return 'bg-primary-100 text-primary-800'
      case 'referral':
        return 'bg-green-100 text-green-800'
      case 'outbound_call':
      case 'cold_call':
        return 'bg-orange-100 text-orange-800'
      case 'social_media':
        return 'bg-pink-100 text-pink-800'
      case 'social_paid':
        return 'bg-violet-100 text-violet-800'
      case 'event':
        return 'bg-amber-100 text-amber-800'
      case 'partner':
        return 'bg-indigo-100 text-indigo-800'
      case 'email':
        return 'bg-blue-100 text-blue-800'
      case 'advertisement':
        return 'bg-rose-100 text-rose-800'
      case 'import':
        return 'bg-slate-100 text-slate-800'
      default:
        if (option?.metadata?.is_system) {
          return 'bg-slate-100 text-slate-800'
        }
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
  const handleLeadSaved = (leadData) => {
    setShowAddLeadForm(false)
    // LeadForm already handles adding to global state
  }

  // Handle lead edit
  const handleEditLead = (lead) => {
    setEditingLead(lead)
    setShowEditLeadForm(true)
  }

  // Handle lead update success
  const handleLeadUpdated = (leadData) => {
    setShowEditLeadForm(false)
    setEditingLead(null)
    // LeadForm already handles updating global state
  }

  // Handle delete lead
  const handleDeleteLead = async (lead) => {
    if (!window.confirm(`Are you sure you want to delete ${lead.first_name} ${lead.last_name}?`)) {
      return
    }

    try {
      await leadService.deleteLead(lead.id)
      deleteLead(lead.id)
      toast.success(`${lead.first_name} ${lead.last_name} deleted successfully`)
    } catch (error) {
      console.error('Failed to delete lead:', error)
      toast.error('Failed to delete lead')
    }
  }

  // Handle bulk selection
  const handleSelectLead = (leadId) => {
    setSelectedLeads(prev => {
      const newSelection = prev.includes(leadId)
        ? prev.filter(id => id !== leadId)
        : [...prev, leadId]

      setShowBulkActions(newSelection.length > 0)
      return newSelection
    })
  }

  // Handle select all
  const handleSelectAll = () => {
    if (selectedLeads.length === leads.length) {
      setSelectedLeads([])
      setShowBulkActions(false)
    } else {
      setSelectedLeads(leads.map(lead => lead.id))
      setShowBulkActions(true)
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedLeads.length} lead(s)?`)) {
      return
    }

    try {
      // Delete leads one by one
      const deletePromises = selectedLeads.map(id => leadService.deleteLead(id))
      await Promise.all(deletePromises)

      // Update state
      selectedLeads.forEach(id => deleteLead(id))
      setSelectedLeads([])
      setShowBulkActions(false)
      toast.success(`${selectedLeads.length} lead(s) deleted successfully`)
    } catch (error) {
      console.error('Failed to delete leads:', error)
      toast.error('Failed to delete leads')
    }
  }

  // Clear selection
  const clearSelection = () => {
    setSelectedLeads([])
    setShowBulkActions(false)
  }

  // Debug: Log leads data
  useEffect(() => {
    console.log('Leads page - Current leads:', leads)
    console.log('Leads page - Pipeline stages:', pipelineStages)
  }, [leads, pipelineStages])

  const handlePageChange = async (newPage) => {
    if (
      loading ||
      isPageChanging ||
      newPage === currentPage ||
      newPage < 1 ||
      newPage > totalPages
    ) {
      return
    }

    setIsPageChanging(true)
    try {
      await fetchLeads({ page: newPage })
    } catch (error) {
      console.error('Failed to change page:', error)
    } finally {
      setIsPageChanging(false)
    }
  }

  const handlePageSizeChange = async (event) => {
    const newLimit = parseInt(event.target.value, 10)
    if (Number.isNaN(newLimit) || newLimit <= 0 || newLimit === itemsPerPage) {
      return
    }

    setIsPageChanging(true)
    try {
      await fetchLeads({ page: 1, limit: newLimit })
    } catch (error) {
      console.error('Failed to change page size:', error)
    } finally {
      setIsPageChanging(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Enhanced Header Section */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6 md:py-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-center md:space-x-3">
                  <div className="hidden md:flex p-2 bg-primary-100 rounded-lg flex-shrink-0">
                    <svg className="h-6 w-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Leads</h1>
                    <p className="mt-1 text-sm text-gray-600">
                      Manage your leads and track their progress through the sales pipeline
                    </p>
                  </div>
                </div>
                {(pagination?.total_items > 0 || leads.length > 0) && (
                  <div className="mt-3 md:mt-4 flex flex-col sm:flex-row gap-3 sm:gap-6 text-xs sm:text-sm text-gray-500">
                    <span className="flex items-center">
                      <div className="hidden sm:block w-2 h-2 bg-green-400 rounded-full mr-2"></div>
                      <span className="sm:hidden text-gray-900 font-medium">Total:</span>
                      <span className="sm:hidden mx-2">•</span>
                      {pagination?.total_items || leads.length} total leads
                    </span>
                    <span className="flex items-center">
                      <div className="hidden sm:block w-2 h-2 bg-blue-400 rounded-full mr-2"></div>
                      <span className="sm:hidden text-gray-900 font-medium">New:</span>
                      <span className="sm:hidden mx-2">•</span>
                      {leads.filter(lead => lead.status === 'new').length} new
                    </span>
                    <span className="flex items-center">
                      <div className="hidden sm:block w-2 h-2 bg-yellow-400 rounded-full mr-2"></div>
                      <span className="sm:hidden text-gray-900 font-medium">Qualified:</span>
                      <span className="sm:hidden mx-2">•</span>
                      {leads.filter(lead => lead.status === 'qualified').length} qualified
                    </span>
                  </div>
                )}
              </div>
              <div className="w-full md:w-auto flex-shrink-0">
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => refreshLeads()}
                    className="flex-1 min-w-max sm:min-w-0 inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span className="hidden sm:inline">Refresh</span>
                    <span className="sm:hidden">Refresh</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowImportWizard(true)}
                    className="flex-1 min-w-max sm:min-w-0 inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Import</span>
                    <span className="sm:hidden">Import</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowExportModal(true)}
                    className="flex-1 min-w-max sm:min-w-0 inline-flex items-center justify-center sm:justify-start px-3 sm:px-4 py-2 border border-gray-300 shadow-sm text-xs sm:text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Export</span>
                    <span className="sm:hidden">Export</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddLeadForm(true)}
                    className="flex-1 min-w-max sm:min-w-0 inline-flex items-center justify-center sm:justify-start px-4 sm:px-6 py-2 border border-transparent text-xs sm:text-sm font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
                  >
                    <PlusIcon className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Add Lead</span>
                    <span className="sm:hidden">Add</span>
                  </button>
                </div>
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
                  {selectedLeads.length} lead(s) selected
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
                <option>All Statuses</option>
                {leadStatuses.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label || formatPicklistValue(option.value)}
                  </option>
                ))}
              </select>
              <select className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200">
                <option>All Sources</option>
                {leadSources.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label || formatPicklistValue(option.value)}
                  </option>
                ))}
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

      {/* Enhanced Leads Table - Responsive */}
      <ContentWrapper>
        {/* Mobile View */}
        <MobileOnly>
          <div className="pb-8">
            <LeadsTableMobile
              leads={leads}
              loading={loading}
              onViewLead={(lead) => navigate(`/app/leads/${lead.id}`)}
              onEditLead={handleEditLead}
              onDeleteLead={handleDeleteLead}
              getStatusLabel={getStatusLabel}
              getStatusColor={getStatusColor}
              getStatusIndicatorColor={getStatusIndicatorColor}
              getSourceLabel={getSourceLabel}
              getSourceColor={getSourceColor}
              getStageName={getStageName}
              getStageColor={getStageColor}
              selectedLeads={selectedLeads}
              onSelectLead={handleSelectLead}
            />
          </div>
        </MobileOnly>

        {/* Desktop View - Table */}
        <TabletAndDesktop>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden pb-8">
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
              <ResponsiveTableWrapper className="rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onChange={handleSelectAll}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </th>
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
                      className="hover:bg-gradient-to-r hover:from-primary-50 hover:to-transparent transition-all duration-200 group"
                    >
                      <td className="px-6 py-5 whitespace-nowrap">
                        <input
                          type="checkbox"
                          checked={selectedLeads.includes(lead.id)}
                          onChange={() => handleSelectLead(lead.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/app/leads/${lead.id}`)}>
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
                      <td className="px-6 py-5 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/app/leads/${lead.id}`)}>
                        <div className="text-sm font-medium text-gray-900">
                          {lead.company || <span className="text-gray-400 italic">No company</span>}
                        </div>
                        {lead.job_title && (
                          <div className="text-sm text-gray-500">{lead.job_title}</div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/app/leads/${lead.id}`)}>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)} shadow-sm`}>
                          <div className={`w-2 h-2 rounded-full mr-2 ${getStatusIndicatorColor(lead.status)}`}></div>
                          {getStatusLabel(lead.status)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/app/leads/${lead.id}`)}>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getSourceColor(lead.lead_source)} shadow-sm`}>
                          {getSourceLabel(lead.lead_source)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap cursor-pointer" onClick={() => navigate(`/app/leads/${lead.id}`)}>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStageColor(lead.pipeline_stage_id)} shadow-sm`}>
                          {getStageName(lead.pipeline_stage_id)}
                        </span>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500 cursor-pointer" onClick={() => navigate(`/app/leads/${lead.id}`)}>
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
                            onClick={(e) => {
                              e.stopPropagation()
                              handleEditLead(lead)
                            }}
                            title="Edit lead"
                          >
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 p-2 rounded-lg hover:bg-red-50 transition-all duration-200"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDeleteLead(lead)
                            }}
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
              </ResponsiveTableWrapper>
            )}
          </div>
        </TabletAndDesktop>
      </ContentWrapper>

      <ContentWrapper className="pb-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">Rows per page:</span>
            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200"
              value={String(itemsPerPage)}
              onChange={handlePageSizeChange}
              disabled={loading}
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
          </div>

          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <span>
              <span className="font-medium text-gray-900">{startItemIndex}</span> -{' '}
              <span className="font-medium text-gray-900">{endItemIndex}</span> of{' '}
              <span className="font-medium text-gray-900">{totalItems}</span>
            </span>
            <div className="flex items-center space-x-2">
              <button
                className={`px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-all duration-200 ${
                  loading || isPageChanging || !hasPrevPage
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={loading || isPageChanging || !hasPrevPage}
              >
                Previous
              </button>
              <button
                className={`px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white hover:bg-gray-50 transition-all duration-200 ${
                  loading || isPageChanging || !hasNextPage
                    ? 'opacity-50 cursor-not-allowed'
                    : ''
                }`}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={loading || isPageChanging || !hasNextPage}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </ContentWrapper>

      {/* Enhanced Empty State */}
      {!loading && leads.length === 0 && (
        <ContentWrapper className="py-16">
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
        </ContentWrapper>
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
          onSuccess={handleLeadSaved}
        />
      )}

      {/* Edit Lead Modal */}
      {showEditLeadForm && editingLead && (
        <LeadForm
          lead={editingLead}
          onClose={() => {
            setShowEditLeadForm(false)
            setEditingLead(null)
          }}
          onSuccess={handleLeadUpdated}
        />
      )}
    </div>
  )
}

export default Leads
