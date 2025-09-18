import React, { useState, useEffect, forwardRef, useImperativeHandle } from 'react';
import PipelineColumn from './PipelineColumn';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import pipelineService from '../../services/pipelineService';
import { useLeads } from '../../context/LeadContext';
import ImportWizard from '../Import/ImportWizard';
import BulkAssignment from '../Assignment/BulkAssignment';
import StageManager from './StageManager';
import StageAnalyticsModal from './StageAnalyticsModal';

const PipelineBoard = forwardRef(({ onLeadClick, onAddLead }, ref) => {
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use the global leads context
  const { leads, fetchLeads, moveLeadToStage } = useLeads();

  // Debug: Log leads data
  useEffect(() => {
    console.log('PipelineBoard - Current leads:', leads)
    console.log('PipelineBoard - Stages:', stages)
  }, [leads, stages]);
  
  // Modal states
  const [showImportWizard, setShowImportWizard] = useState(false);
  const [showBulkAssignment, setShowBulkAssignment] = useState(false);
  const [showStageManager, setShowStageManager] = useState(false);
  const [showStageAnalytics, setShowStageAnalytics] = useState(false);
  const [selectedStageForImport, setSelectedStageForImport] = useState(null);
  const [selectedStageForBulk, setSelectedStageForBulk] = useState(null);
  const [selectedStageForAnalytics, setSelectedStageForAnalytics] = useState(null);
  const [selectedStageForSettings, setSelectedStageForSettings] = useState(null);

  const {
    draggedItem,
    dragOverColumn,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd
  } = useDragAndDrop();

  // Expose refresh function to parent
  useImperativeHandle(ref, () => ({
    refreshData: fetchPipelineData
  }));

  // Fetch pipeline data
  useEffect(() => {
    fetchPipelineData();
  }, []); // Remove dependencies to prevent infinite loops

  const fetchPipelineData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch pipeline overview and leads in parallel
      const [pipelineResponse, leadsData] = await Promise.all([
        pipelineService.getPipelineOverview(),
        fetchLeads() // Use the global context to fetch leads
      ]);

      if (pipelineResponse.success) {
        setStages(pipelineResponse.data.stages);
      } else {
        console.error('Pipeline overview failed:', pipelineResponse.error);
        setError('Failed to load pipeline stages');
      }
    } catch (err) {
      console.error('Error fetching pipeline data:', err);
      setError('Failed to load pipeline data');
    } finally {
      setLoading(false);
    }
  };

  // Group leads by pipeline stage
  const getLeadsByStage = (stageId) => {
    if (!Array.isArray(leads)) {
      return [];
    }
    return leads.filter(lead => lead.pipeline_stage_id === stageId);
  };

  // Handle lead movement between stages
  const handleLeadMove = async (lead, sourceStageId, targetStageId) => {
    try {
      // Optimistically update the global state
      moveLeadToStage(lead.id, targetStageId);

      // Make API call to move lead
      const response = await pipelineService.moveLeadToStage(lead.id, targetStageId);
      
      if (!response.success) {
        // Revert the optimistic update on error
        moveLeadToStage(lead.id, sourceStageId);
        throw new Error(response.error || 'Failed to move lead');
      }

      // The global state is already updated optimistically
      // No need to update again since the API call succeeded
    } catch (err) {
      console.error('Error moving lead:', err);
      setError('Failed to move lead. Please try again.');
    }
  };

  // Handle drag start
  const onDragStart = (e, lead) => {
    const sourceStageId = lead.pipeline_stage_id;
    handleDragStart(e, lead, sourceStageId);
  };

  // Handle drag over
  const onDragOver = (e, targetStageId) => {
    handleDragOver(e, targetStageId);
  };

  // Handle drop
  const onDrop = (e, targetStageId) => {
    handleDrop(e, targetStageId, handleLeadMove);
  };

  // Handle add lead to stage
  const handleAddLeadToStage = (stageId) => {
    if (onAddLead) {
      onAddLead(stageId);
    }
  };

  // Handle import leads
  const handleImportLeads = (stageId) => {
    setSelectedStageForImport(stageId);
    setShowImportWizard(true);
  };

  // Handle bulk actions
  const handleBulkActions = (stageId, leads) => {
    setSelectedStageForBulk(stageId);
    setShowBulkAssignment(true);
  };

  // Handle stage analytics
  const handleStageAnalytics = (stageId, leads) => {
    setSelectedStageForAnalytics(stageId);
    setShowStageAnalytics(true);
  };

  // Handle stage settings
  const handleStageSettings = (stage) => {
    setSelectedStageForSettings(stage);
    setShowStageManager(true);
  };

  // Handle modal close functions
  const handleCloseImportWizard = () => {
    setShowImportWizard(false);
    setSelectedStageForImport(null);
  };

  const handleCloseBulkAssignment = () => {
    setShowBulkAssignment(false);
    setSelectedStageForBulk(null);
  };

  const handleCloseStageManager = () => {
    setShowStageManager(false);
    setSelectedStageForSettings(null);
  };

  const handleCloseStageAnalytics = () => {
    setShowStageAnalytics(false);
    setSelectedStageForAnalytics(null);
  };

  // Handle import completion
  const handleImportComplete = (result) => {
    console.log('Import completed:', result);
    // Refresh leads data after import
    fetchLeads();
  };

  // Handle stage updates
  const handleStagesUpdated = () => {
    fetchPipelineData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={fetchPipelineData}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="pipeline-board">
      {/* Pipeline Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Sales Pipeline</h2>
            <p className="text-gray-600 mt-1">Manage your leads through the sales process</p>
          </div>
          <div className="flex items-center space-x-4">
            <button
              onClick={fetchPipelineData}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Pipeline Columns */}
      <div className="flex space-x-6 overflow-x-auto pb-4">
        {Array.isArray(stages) && stages.map((stage) => (
          <PipelineColumn
            key={stage.id}
            stage={stage}
            leads={getLeadsByStage(stage.id)}
            onDragStart={onDragStart}
            onDragEnd={handleDragEnd}
            onDragOver={onDragOver}
            onDragLeave={handleDragLeave}
            onDrop={onDrop}
            onLeadClick={onLeadClick}
            onAddLead={handleAddLeadToStage}
            onImportLeads={handleImportLeads}
            onBulkActions={handleBulkActions}
            onStageAnalytics={handleStageAnalytics}
            onStageSettings={handleStageSettings}
            isDragOver={dragOverColumn === stage.id}
          />
        ))}
      </div>

      {/* Pipeline Summary */}
      {Array.isArray(stages) && stages.length > 0 && (
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">Pipeline Summary</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Array.isArray(leads) ? leads.filter(lead => !lead.pipeline_stage_id || 
                  !stages.find(s => s.id === lead.pipeline_stage_id)?.is_won && 
                  !stages.find(s => s.id === lead.pipeline_stage_id)?.is_lost
                ).length : 0}
              </div>
              <div className="text-sm text-gray-600">Active Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Array.isArray(leads) ? leads.filter(lead => 
                  stages.find(s => s.id === lead.pipeline_stage_id)?.is_won
                ).length : 0}
              </div>
              <div className="text-sm text-gray-600">Won Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {Array.isArray(leads) ? leads.filter(lead => 
                  stages.find(s => s.id === lead.pipeline_stage_id)?.is_lost
                ).length : 0}
              </div>
              <div className="text-sm text-gray-600">Lost Leads</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-600">
                {Array.isArray(leads) ? leads.length : 0}
              </div>
              <div className="text-sm text-gray-600">Total Leads</div>
            </div>
          </div>
        </div>
      )}

      {/* Import Wizard Modal */}
      {showImportWizard && (
        <ImportWizard
          isOpen={showImportWizard}
          onClose={handleCloseImportWizard}
          onImportComplete={handleImportComplete}
          initialStageId={selectedStageForImport}
        />
      )}

      {/* Bulk Assignment Modal */}
      {showBulkAssignment && (
        <BulkAssignment
          isOpen={showBulkAssignment}
          onClose={handleCloseBulkAssignment}
          stageId={selectedStageForBulk}
          leads={getLeadsByStage(selectedStageForBulk)}
        />
      )}

      {/* Stage Manager Modal */}
      {showStageManager && (
        <StageManager
          isOpen={showStageManager}
          onClose={handleCloseStageManager}
          onStagesUpdated={handleStagesUpdated}
          editingStage={selectedStageForSettings}
        />
      )}

      {/* Stage Analytics Modal */}
      {showStageAnalytics && (
        <StageAnalyticsModal
          isOpen={showStageAnalytics}
          onClose={handleCloseStageAnalytics}
          stageId={selectedStageForAnalytics}
          leads={getLeadsByStage(selectedStageForAnalytics)}
          stage={stages.find(s => s.id === selectedStageForAnalytics)}
        />
      )}
    </div>
  );
});

PipelineBoard.displayName = 'PipelineBoard';

export default PipelineBoard;
