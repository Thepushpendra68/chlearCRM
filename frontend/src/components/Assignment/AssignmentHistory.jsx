import React, { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import assignmentService from '../../services/assignmentService';

const AssignmentHistory = ({ 
  isOpen = true, 
  onClose, 
  leadId = null,
  isEmbedded = false 
}) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    date_from: '',
    date_to: '',
    assigned_by: '',
    assigned_to: ''
  });

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, leadId]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      if (leadId) {
        response = await assignmentService.getLeadAssignmentHistory(leadId);
      } else {
        response = await assignmentService.getAssignmentHistory({ limit: 100 });
      }

      if (response.success) {
        setHistory(response.data);
      } else {
        setError(response.error || 'Failed to load assignment history');
      }
    } catch (err) {
      console.error('Error fetching assignment history:', err);
      setError('Failed to load assignment history');
    } finally {
      setLoading(false);
    }
  };

  const getAssignmentIcon = (assignmentType) => {
    switch (assignmentType) {
      case 'manual':
        return '👤';
      case 'auto':
        return '🤖';
      case 'rule':
        return '⚙️';
      default:
        return '📋';
    }
  };

  const getAssignmentColor = (assignmentType) => {
    switch (assignmentType) {
      case 'manual':
        return 'bg-blue-100 text-blue-800';
      case 'auto':
        return 'bg-green-100 text-green-800';
      case 'rule':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAssignmentReason = (reason) => {
    if (!reason) return 'No reason provided';
    
    // Capitalize first letter and add period if missing
    return reason.charAt(0).toUpperCase() + reason.slice(1) + (reason.endsWith('.') ? '' : '.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-red-800">{error}</p>
        </div>
        <button
          onClick={fetchHistory}
          className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {leadId ? 'Lead Assignment History' : 'All Assignment History'}
            </h2>
            <p className="text-gray-600 mt-1">
              {leadId 
                ? 'Track all assignment changes for this lead'
                : 'View assignment history across all leads'
              }
            </p>
          </div>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Date From</label>
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters(prev => ({ ...prev, date_from: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date To</label>
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters(prev => ({ ...prev, date_to: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned By</label>
            <input
              type="text"
              value={filters.assigned_by}
              onChange={(e) => setFilters(prev => ({ ...prev, assigned_by: e.target.value }))}
              placeholder="Search by name..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <input
              type="text"
              value={filters.assigned_to}
              onChange={(e) => setFilters(prev => ({ ...prev, assigned_to: e.target.value }))}
              placeholder="Search by name..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* History List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Assignment History</h3>
          <p className="text-sm text-gray-600 mt-1">
            {history.length} assignment{history.length !== 1 ? 's' : ''} found
          </p>
        </div>

        {history.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="mt-2">No assignment history found</p>
            <p className="text-sm text-gray-400">
              {leadId 
                ? 'This lead has not been assigned yet.'
                : 'No assignments have been made yet.'
              }
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {history.map((item) => (
              <div key={item.id} className="p-6 hover:bg-gray-50">
                <div className="flex items-start space-x-4">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <span className="text-lg">
                        {getAssignmentIcon(item.assignment_source)}
                      </span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-gray-900">
                          {item.previous_assigned_name ? (
                            <>
                              Reassigned from <span className="font-semibold">{item.previous_assigned_name}</span> to <span className="font-semibold">{item.new_assigned_name}</span>
                            </>
                          ) : (
                            <>
                              Assigned to <span className="font-semibold">{item.new_assigned_name}</span>
                            </>
                          )}
                        </h4>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAssignmentColor(item.assignment_source)}`}>
                          {item.assignment_source}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                      </div>
                    </div>

                    <div className="mt-2 text-sm text-gray-600">
                      <p>
                        <strong>Assigned by:</strong> {item.assigned_by_name} ({item.assigned_by_email})
                      </p>
                      {item.assignment_reason && (
                        <p className="mt-1">
                          <strong>Reason:</strong> {formatAssignmentReason(item.assignment_reason)}
                        </p>
                      )}
                    </div>

                    <div className="mt-2 text-xs text-gray-500">
                      {format(new Date(item.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Summary Statistics */}
      {history.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {history.filter(h => h.assignment_source === 'manual').length}
              </div>
              <div className="text-sm text-gray-500">Manual Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {history.filter(h => h.assignment_source === 'auto').length}
              </div>
              <div className="text-sm text-gray-500">Auto Assignments</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {history.filter(h => h.assignment_source === 'rule').length}
              </div>
              <div className="text-sm text-gray-500">Rule-based Assignments</div>
            </div>
          </div>
        </div>
      )}

      {/* Close Button for Modal */}
      {!isEmbedded && onClose && (
        <div className="flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      )}
    </div>
  );
};

export default AssignmentHistory;
