import React from 'react';
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
  onAddLead 
}) => {
  const getStageColor = (color) => {
    return color || '#3B82F6';
  };

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
        <button
          onClick={() => onAddLead(stage.id)}
          className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          title="Add lead to this stage"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
      </div>

      {/* Column Content */}
      <div className="space-y-3 min-h-96">
        {!Array.isArray(leads) || leads.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">No leads in this stage</p>
            <p className="text-xs text-gray-400 mt-1">Drag leads here or add new ones</p>
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
            {stage.is_won && (
              <span className="text-green-600 font-medium">Won Stage</span>
            )}
            {stage.is_lost && (
              <span className="text-red-600 font-medium">Lost Stage</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PipelineColumn;
