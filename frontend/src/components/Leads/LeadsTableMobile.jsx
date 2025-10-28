import { useState } from 'react'
import { ChevronRightIcon, EllipsisVerticalIcon } from '@heroicons/react/24/outline'
import { Menu, Transition } from '@headlessui/react'
import { Fragment } from 'react'

const LeadsTableMobile = ({
  leads,
  loading,
  onViewLead,
  onEditLead,
  onDeleteLead,
  getStatusLabel,
  getStatusColor,
  getStatusIndicatorColor,
  getSourceLabel,
  getSourceColor,
  getStageName,
  getStageColor,
  selectedLeads,
  onSelectLead
}) => {
  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-3/4 mb-3" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-full mb-2" />
            <div className="h-3 bg-gray-200 rounded animate-pulse w-2/3" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {leads.map((lead) => (
        <div
          key={lead.id}
          className="bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
        >
          {/* Card Header with Avatar and Actions */}
          <div className="p-4 border-b border-gray-100 flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {/* Checkbox */}
              <input
                type="checkbox"
                checked={selectedLeads.includes(lead.id)}
                onChange={() => onSelectLead(lead.id)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded mt-1"
              />
              
              {/* Avatar and Name */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0 h-10 w-10">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center shadow-sm">
                      <span className="text-xs font-semibold text-primary-700">
                        {lead.first_name?.[0] || ''}{lead.last_name?.[0] || ''}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {lead.first_name} {lead.last_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">{lead.email}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Menu */}
            <Menu as="div" className="relative ml-2 flex-shrink-0">
              <Menu.Button className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-all">
                <EllipsisVerticalIcon className="h-5 w-5" />
              </Menu.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onViewLead(lead)}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          View Details
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onEditLead(lead)}
                          className={`${active ? 'bg-gray-100' : ''} block w-full text-left px-4 py-2 text-sm text-gray-700`}
                        >
                          Edit
                        </button>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={() => onDeleteLead(lead)}
                          className={`${active ? 'bg-red-50' : ''} block w-full text-left px-4 py-2 text-sm text-red-700`}
                        >
                          Delete
                        </button>
                      )}
                    </Menu.Item>
                  </div>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>

          {/* Card Body with Details */}
          <div className="px-4 py-3 space-y-2">
            {/* Company and Job Title */}
            {(lead.company || lead.job_title) && (
              <div className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-500 font-medium">Company</span>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {lead.company || <span className="text-gray-400 italic">No company</span>}
                  </p>
                  {lead.job_title && (
                    <p className="text-xs text-gray-500">{lead.job_title}</p>
                  )}
                </div>
              </div>
            )}

            {/* Phone */}
            {lead.phone && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Phone</span>
                <p className="text-sm text-gray-900 font-medium">{lead.phone}</p>
              </div>
            )}

            {/* Status */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Status</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(lead.status)}`}>
                <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${getStatusIndicatorColor(lead.status)}`}></div>
                {getStatusLabel(lead.status)}
              </span>
            </div>

            {/* Source */}
            {lead.lead_source && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Source</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getSourceColor(lead.lead_source)}`}>
                  {getSourceLabel(lead.lead_source)}
                </span>
              </div>
            )}

            {/* Pipeline Stage */}
            {lead.pipeline_stage_id && (
              <div className="flex justify-between items-center gap-2">
                <span className="text-xs text-gray-500 font-medium">Stage</span>
                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStageColor(lead.pipeline_stage_id)}`}>
                  {getStageName(lead.pipeline_stage_id)}
                </span>
              </div>
            )}

            {/* Created Date */}
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Created</span>
              <span className="text-xs text-gray-600">{new Date(lead.created_at).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Card Footer with View Button */}
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
            <button
              onClick={() => onViewLead(lead)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-all"
            >
              View Details
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export default LeadsTableMobile
