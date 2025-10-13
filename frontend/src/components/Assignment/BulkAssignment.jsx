import React, { useState, useEffect } from 'react';
import assignmentService from '../../services/assignmentService';
import leadService from '../../services/leadService';
import userService from '../../services/userService';

const BulkAssignment = ({ 
  isOpen = true, 
  onClose, 
  isEmbedded = false,
  stageId = null,
  leads: initialLeads = []
}) => {
  const [leads, setLeads] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [filters, setFilters] = useState({
    status: '',
    source: '',
    assigned_to: '',
    search: ''
  });

  useEffect(() => {
    if (isOpen && !isDataLoaded) {
      if (initialLeads.length > 0) {
        setLeads(initialLeads);
        fetchUsers();
        setIsDataLoaded(true);
      } else {
        fetchData();
      }
    }
  }, [isOpen, isDataLoaded]); // Add isDataLoaded to prevent multiple calls

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [leadsResponse, usersResponse] = await Promise.all([
        leadService.getLeads(),
        userService.getUsers()
      ]);

      if (leadsResponse.success) {
        // Handle different possible response structures
        const leadsData = leadsResponse.data.leads || leadsResponse.data || [];
        setLeads(Array.isArray(leadsData) ? leadsData : []);
      } else {
        console.error('Failed to fetch leads:', leadsResponse.error);
        setError('Failed to load leads data');
      }

      if (usersResponse.success) {
        // Handle different possible response structures
        const usersData = usersResponse.data.users || usersResponse.data || [];
        const usersArray = Array.isArray(usersData) ? usersData : [];
        setUsers(usersArray.filter(user => user.role !== 'admin'));
      } else {
        console.error('Failed to fetch users:', usersResponse.error);
        setError('Failed to load users data');
      }

      setIsDataLoaded(true);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load data. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const usersResponse = await userService.getUsers();
      if (usersResponse.success) {
        const usersData = usersResponse.data.users || usersResponse.data || [];
        const usersArray = Array.isArray(usersData) ? usersData : [];
        setUsers(usersArray.filter(user => user.role !== 'admin'));
      } else {
        console.error('Failed to fetch users:', usersResponse.error);
        setError('Failed to load users');
      }
    } catch (err) {
      console.error('Error fetching users:', err);
      setError('Failed to load users');
    }
  };

  // Reset component state when closed
  useEffect(() => {
    if (!isOpen) {
      setLeads([]);
      setUsers([]);
      setSelectedLeads([]);
      setSelectedUser('');
      setReason('');
      setError(null);
      setSuccess(null);
      setIsDataLoaded(false);
    }
  }, [isOpen]);

  const handleLeadSelect = (leadId) => {
    setSelectedLeads(prev => {
      if (prev.includes(leadId)) {
        return prev.filter(id => id !== leadId);
      } else {
        return [...prev, leadId];
      }
    });
  };

  const handleSelectAll = () => {
    const filteredLeads = getFilteredLeads();
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([]);
    } else {
      setSelectedLeads(filteredLeads.map(lead => lead.id));
    }
  };

  const handleBulkAssign = async () => {
    if (selectedLeads.length === 0) {
      setError('Please select at least one lead');
      return;
    }

    if (!selectedUser) {
      setError('Please select a user to assign leads to');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await assignmentService.bulkAssignLeads(
        selectedLeads,
        selectedUser,
        reason || 'Bulk assignment'
      );

      if (response.success) {
        setSuccess(response.message);
        setSelectedLeads([]);
        setSelectedUser('');
        setReason('');
        await fetchData();
      } else {
        setError(response.error || 'Failed to assign leads');
      }
    } catch (err) {
      console.error('Error bulk assigning leads:', err);
      setError('Failed to assign leads');
    } finally {
      setLoading(false);
    }
  };

  const handleAutoAssign = async () => {
    if (selectedLeads.length === 0) {
      setError('Please select at least one lead');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const response = await assignmentService.processBulkAutoAssignment(selectedLeads);

      if (response.success) {
        setSuccess(response.message);
        setSelectedLeads([]);
        await fetchData();
      } else {
        setError(response.error || 'Failed to auto-assign leads');
      }
    } catch (err) {
      console.error('Error auto-assigning leads:', err);
      setError('Failed to auto-assign leads');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredLeads = () => {
    if (!leads || !Array.isArray(leads)) {
      return [];
    }
    
    return leads.filter(lead => {
      if (filters.status && lead.status !== filters.status) return false;
      if (filters.source && (lead.lead_source || lead.source) !== filters.source) return false;
      if (filters.assigned_to && lead.assigned_to !== filters.assigned_to) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        return (
          lead.first_name?.toLowerCase().includes(searchTerm) ||
          lead.last_name?.toLowerCase().includes(searchTerm) ||
          lead.name?.toLowerCase().includes(searchTerm) ||
          lead.email?.toLowerCase().includes(searchTerm) ||
          lead.company?.toLowerCase().includes(searchTerm)
        );
      }
      return true;
    });
  };

  const getUniqueValues = (field) => {
    if (!leads || !Array.isArray(leads)) {
      return [];
    }
    return [...new Set(leads.map(lead => {
      if (field === 'source') {
        return lead.lead_source || lead.source;
      }
      return lead[field];
    }).filter(Boolean))];
  };

  const getUserName = (userId) => {
    if (!users || !Array.isArray(users)) {
      return 'Unknown';
    }
    const user = users.find(u => u.id === userId);
    if (!user) return 'Unknown';
    
    // Handle both old and new user data structures
    const firstName = user.first_name || user.name?.split(' ')[0] || '';
    const lastName = user.last_name || user.name?.split(' ').slice(1).join(' ') || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    return fullName || user.email || 'Unknown';
  };

  if (loading && !isDataLoaded) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading data...</span>
      </div>
    );
  }

  const filteredLeads = getFilteredLeads();

  return (
    <div className="space-y-6">
      {/* Header */}
      {!isEmbedded && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Bulk Assignment</h2>
            <p className="text-gray-600 mt-1">Assign multiple leads to team members</p>
          </div>
        </div>
      )}

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <p className="text-green-800 text-sm">{success}</p>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              {getUniqueValues('status').map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Source</label>
            <select
              value={filters.source}
              onChange={(e) => setFilters(prev => ({ ...prev, source: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Sources</option>
              {getUniqueValues('source').map(source => (
                <option key={source} value={source}>{source}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select
              value={filters.assigned_to}
              onChange={(e) => setFilters(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Users</option>
              <option value="unassigned">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Search leads..."
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Assignment Controls */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Assignment Controls</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Assign to User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">Select user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {`${user.first_name || ''} ${user.last_name || ''}`.trim() || user.email} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Reason (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Team rebalancing"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleBulkAssign}
            disabled={loading || selectedLeads.length === 0 || !selectedUser}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Assigning...' : `Assign ${selectedLeads.length} Leads`}
          </button>
          
          <button
            onClick={handleAutoAssign}
            disabled={loading || selectedLeads.length === 0}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Auto-assigning...' : `Auto-assign ${selectedLeads.length} Leads`}
          </button>
        </div>
      </div>

      {/* Leads List */}
      <div className="bg-white border border-gray-200 rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Leads</h3>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredLeads.length} of {leads?.length || 0} leads
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <span className="text-sm text-gray-500">
                {selectedLeads.length} selected
              </span>
              <button
                onClick={handleSelectAll}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                {selectedLeads.length === filteredLeads.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead
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
                  Assigned To
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Deal Value
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedLeads.includes(lead.id)}
                      onChange={() => handleLeadSelect(lead.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {`${lead.first_name || ''} ${lead.last_name || ''}`.trim() || lead.name || 'Unnamed Lead'}
                      </div>
                      <div className="text-sm text-gray-500">{lead.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.company}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      lead.status === 'active' ? 'bg-green-100 text-green-800' :
                      lead.status === 'won' ? 'bg-blue-100 text-blue-800' :
                      lead.status === 'lost' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.lead_source || lead.source}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.assigned_to ? getUserName(lead.assigned_to) : (
                      <span className="text-gray-500 italic">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {lead.deal_value ? `$${lead.deal_value.toLocaleString()}` : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredLeads.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No leads found matching the current filters.
          </div>
        )}
      </div>

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

export default BulkAssignment;
