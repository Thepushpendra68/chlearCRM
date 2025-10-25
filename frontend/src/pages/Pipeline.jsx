import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import PipelineBoard from '../components/Pipeline/PipelineBoard';
import { DynamicLeadForm } from '../components/DynamicForm';

const Pipeline = () => {
  const navigate = useNavigate();
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [selectedStageId, setSelectedStageId] = useState(null);
  const [selectedLead, setSelectedLead] = useState(null);
  const pipelineBoardRef = useRef();

  const handleLeadClick = (lead) => {
    // Navigate to lead detail page or open lead modal
    navigate(`/app/leads/${lead.id}`);
  };

  const handleAddLead = (stageId) => {
    setSelectedStageId(stageId);
    setShowLeadForm(true);
  };

  const handleCloseLeadForm = () => {
    setShowLeadForm(false);
    setSelectedStageId(null);
    setSelectedLead(null);
  };

  const handleLeadFormSubmit = (leadData) => {
    // The DynamicLeadForm component handles the API call
    // We need to close the modal and refresh the pipeline
    handleCloseLeadForm();
    // Refresh the pipeline data
    if (pipelineBoardRef.current?.refreshData) {
      pipelineBoardRef.current.refreshData();
    }
  };

  return (
    <div className="pipeline-page">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PipelineBoard
          ref={pipelineBoardRef}
          onLeadClick={handleLeadClick}
          onAddLead={handleAddLead}
        />
      </div>

      {/* Lead Form Modal */}
      {showLeadForm && (
        <DynamicLeadForm
          lead={selectedLead}
          initialStageId={selectedStageId}
          onSuccess={handleLeadFormSubmit}
          onClose={handleCloseLeadForm}
        />
      )}
    </div>
  );
};

export default Pipeline;
