import React, { useState, useRef, useEffect } from 'react';
import LeadCard from './LeadCard';

const PipelineColumn = ({ 
  stage, 
  leads, 
  onDragStart, 
  onDragEnd, 
  onDragOver, 
  onDragLeave, 
  onDrop, 
  onLeadClick,
  isDragOver,
  onAddLead,
  onImportLeads,
  onBulkActions,
  onStageAnalytics,
  onStageSettings 
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getStageColor = (color) => {
    return color || '#3B82F6';
  };

  const handleMenuAction = (action) => {
    setIsDropdownOpen(false);
    
    switch (action) {
      case 'add_lead':
        onAddLead && onAddLead(stage.id);
        break;
      case 'import_leads':
        onImportLeads && onImportLeads(stage.id);
        break;
      case 'bulk_actions':
        onBulkActions && onBulkActions(stage.id, leads);
        break;
      case 'stage_analytics':
        onStageAnalytics && onStageAnalytics(stage.id, leads);
        break;
      case 'stage_settings':
        onStageSettings && onStageSettings(stage);
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  const menuItems = [
    {
      id: 'add_lead',
      label: 'Add New Lead',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
      description: 'Create a new lead in this stage'
    },
    {
      id: 'import_leads',
      label: 'Import Leads',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
        </svg>
      ),
      description: 'Import leads from CSV or Excel'
    },
    {
      id: 'bulk_actions',
      label: 'Bulk Actions',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
      description: 'Perform actions on multiple leads',
      disabled: !Array.isArray(leads) || leads.length === 0
    },
    {
      id: 'stage_analytics',
      label: 'Stage Analytics',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'View stage performance metrics'
    },
    {
      id: 'stage_settings',
      label: 'Stage Settings',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Configure stage properties'
    }
  ];

  return (
    <div 
      className={`flex-1 min-w-80 bg-gray-50 rounded-lg p-4 transition-colors duration-200 ${
        isDragOver ? 'bg-blue-50 border-2 border-blue-300 border-dashed' : ''
      }`}
      onDragOver={(e) => onDragOver(e, stage.id)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, stage.id)}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <div 
            className="w-4 h-4 rounded-full mr-3"
            style={{ backgroundColor: getStageColor(stage.color) }}
          />
          <h3 className="font-semibold text-gray-900">{stage.name}</h3>
          <span className="ml-2 bg-gray-200 text-gray-700 text-xs px-2 py-1 rounded-full">
            {Array.isArray(leads) ? leads.length : 0}
          </span>
        </div>
        {/* Enhanced Dropdown Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-1 rounded-md hover:bg-gray-200"
            title="Stage actions"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
              <div className="py-2">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleMenuAction(item.id)}
                    disabled={item.disabled}
                    className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors duration-150 flex items-start space-x-3 ${
                      item.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                    }`}
                  >
                    <div className="flex-shrink-0 text-gray-400 mt-0.5">
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Column Content */}
      <div className="space-y-3 min-h-96">
        {!Array.isArray(leads) || leads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No leads in this stage</p>
            <p className="text-xs text-gray-400 mt-1">Click the + button to add leads</p>
            <button
              onClick={() => handleMenuAction('add_lead')}
              className="mt-3 px-3 py-1 text-xs bg-blue-100 text-blue-600 rounded-md hover:bg-blue-200 transition-colors duration-150"
            >
              Add First Lead
            </button>
          </div>
        ) : (
          Array.isArray(leads) && leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
              onClick={onLeadClick}
            />
          ))
        )}
      </div>

      {/* Column Footer */}
      {Array.isArray(leads) && leads.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{leads.length} lead{leads.length !== 1 ? 's' : ''}</span>
            <div className="flex items-center space-x-2">
              {stage.is_won && (
                <span className="text-green-600 font-medium">Won Stage</span>
              )}
              {stage.is_lost && (
                <span className="text-red-600 font-medium">Lost Stage</span>
              )}
              <button
                onClick={() => handleMenuAction('bulk_actions')}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Bulk Actions
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineColumn;
