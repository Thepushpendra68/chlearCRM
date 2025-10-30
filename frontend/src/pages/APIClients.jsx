import React, { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  KeyIcon, 
  TrashIcon, 
  EyeIcon, 
  EyeSlashIcon,
  ArrowPathIcon,
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClipboardDocumentIcon,
  ClipboardDocumentCheckIcon
} from '@heroicons/react/24/outline';
import api from '../services/api';

function APIClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showSecretModal, setShowSecretModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [newSecret, setNewSecret] = useState(null);
  const [stats, setStats] = useState(null);
  const [copiedField, setCopiedField] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    client_name: '',
    rate_limit: 100,
    allowed_origins: '',
    default_lead_source: 'api',
    webhook_url: '',
    default_assigned_to: ''
  });

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/api-clients');
      setClients(response.data.data);
    } catch (error) {
      console.error('Error loading API clients:', error);
      setError('Failed to load API clients. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      
      // Parse allowed origins
      const allowedOrigins = formData.allowed_origins
        .split(',')
        .map(o => o.trim())
        .filter(o => o.length > 0);

      const data = {
        ...formData,
        allowed_origins: allowedOrigins,
        default_assigned_to: formData.default_assigned_to || null
      };

      const response = await api.post('/api-clients', data);
      
      // Show the secret immediately
      setNewSecret({
        client_name: response.data.data.client_name,
        api_key: response.data.data.api_key,
        api_secret: response.data.data.api_secret
      });
      
      setShowCreateModal(false);
      setShowSecretModal(true);
      setSuccess('API client created successfully!');
      
      // Reset form
      setFormData({
        client_name: '',
        rate_limit: 100,
        allowed_origins: '',
        default_lead_source: 'api',
        webhook_url: '',
        default_assigned_to: ''
      });
      
      // Reload list
      loadClients();
    } catch (error) {
      console.error('Error creating API client:', error);
      setError(error.response?.data?.error?.message || 'Failed to create API client');
    }
  };

  const handleRegenerateSecret = async (client) => {
    if (!window.confirm(`Are you sure you want to regenerate the secret for "${client.client_name}"? The old secret will stop working immediately.`)) {
      return;
    }

    try {
      setError(null);
      const response = await api.post(`/api-clients/${client.id}/regenerate-secret`);
      
      setNewSecret({
        client_name: client.client_name,
        api_key: response.data.data.api_key,
        api_secret: response.data.data.api_secret
      });
      
      setShowSecretModal(true);
      setSuccess('API secret regenerated successfully!');
    } catch (error) {
      console.error('Error regenerating secret:', error);
      setError('Failed to regenerate secret. Please try again.');
    }
  };

  const handleToggleActive = async (client) => {
    try {
      setError(null);
      await api.put(`/api-clients/${client.id}`, {
        is_active: !client.is_active
      });
      
      setSuccess(`API client ${!client.is_active ? 'activated' : 'deactivated'} successfully!`);
      loadClients();
    } catch (error) {
      console.error('Error toggling client status:', error);
      setError('Failed to update client status. Please try again.');
    }
  };

  const handleDelete = async (client) => {
    if (!window.confirm(`Are you sure you want to delete "${client.client_name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setError(null);
      await api.delete(`/api-clients/${client.id}`);
      setSuccess('API client deleted successfully!');
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      setError('Failed to delete client. Please try again.');
    }
  };

  const handleViewStats = async (client) => {
    try {
      setError(null);
      setSelectedClient(client);
      setShowStatsModal(true);
      
      const response = await api.get(`/api-clients/${client.id}/stats?days=30`);
      setStats(response.data.data);
    } catch (error) {
      console.error('Error loading stats:', error);
      setError('Failed to load statistics. Please try again.');
    }
  };

  const copyToClipboard = (text, field) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">API Clients</h1>
          <p className="text-gray-600 mt-2">
            Manage API credentials for lead capture integrations
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <PlusIcon className="w-5 h-5 mr-2" />
          Create API Client
        </button>
      </div>

      {/* Success/Error Messages */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center">
          <XCircleIcon className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center">
          <CheckCircleIcon className="w-5 h-5 mr-2" />
          {success}
        </div>
      )}

      {/* API Clients List */}
      {clients.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <KeyIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No API Clients Yet</h3>
          <p className="text-gray-600 mb-6">
            Create your first API client to start capturing leads from external sources.
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            <PlusIcon className="w-5 h-5 mr-2" />
            Create API Client
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {clients.map((client) => (
            <div key={client.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {client.client_name}
                      </h3>
                      {client.is_active ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        <span className="font-medium">API Key:</span>{' '}
                        <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                          {client.api_key}
                        </code>
                        <button
                          onClick={() => copyToClipboard(client.api_key, `key-${client.id}`)}
                          className="ml-2 text-indigo-600 hover:text-indigo-800"
                        >
                          {copiedField === `key-${client.id}` ? (
                            <ClipboardDocumentCheckIcon className="w-4 h-4 inline" />
                          ) : (
                            <ClipboardDocumentIcon className="w-4 h-4 inline" />
                          )}
                        </button>
                      </p>
                      <p>
                        <span className="font-medium">Rate Limit:</span> {client.rate_limit} req/hour
                      </p>
                      {client.default_lead_source && (
                        <p>
                          <span className="font-medium">Default Source:</span> {client.default_lead_source}
                        </p>
                      )}
                      {client.last_used_at && (
                        <p>
                          <span className="font-medium">Last Used:</span>{' '}
                          {new Date(client.last_used_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => handleViewStats(client)}
                    className="flex items-center px-3 py-2 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <ChartBarIcon className="w-4 h-4 mr-2" />
                    View Stats
                  </button>
                  
                  <button
                    onClick={() => handleRegenerateSecret(client)}
                    className="flex items-center px-3 py-2 text-sm bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Regenerate Secret
                  </button>

                  <button
                    onClick={() => handleToggleActive(client)}
                    className={`flex items-center px-3 py-2 text-sm rounded-lg transition-colors ${
                      client.is_active
                        ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        : 'bg-green-50 text-green-700 hover:bg-green-100'
                    }`}
                  >
                    {client.is_active ? 'Deactivate' : 'Activate'}
                  </button>

                  <button
                    onClick={() => handleDelete(client)}
                    className="flex items-center px-3 py-2 text-sm bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Create API Client</h2>
              
              <form onSubmit={handleCreate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name *
                  </label>
                  <input
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    placeholder="e.g., Homepage Contact Form"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    A descriptive name for this integration
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rate Limit (requests per hour)
                  </label>
                  <input
                    type="number"
                    value={formData.rate_limit}
                    onChange={(e) => setFormData({ ...formData, rate_limit: parseInt(e.target.value) })}
                    min="1"
                    max="10000"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Maximum number of requests allowed per hour
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Allowed Origins (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={formData.allowed_origins}
                    onChange={(e) => setFormData({ ...formData, allowed_origins: e.target.value })}
                    placeholder="https://example.com, https://www.example.com"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Domains allowed to use this API (for CORS)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Default Lead Source
                  </label>
                  <input
                    type="text"
                    value={formData.default_lead_source}
                    onChange={(e) => setFormData({ ...formData, default_lead_source: e.target.value })}
                    placeholder="api"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Default source tag for leads captured via this API
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Webhook URL (optional)
                  </label>
                  <input
                    type="url"
                    value={formData.webhook_url}
                    onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })}
                    placeholder="https://example.com/webhook"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    URL to receive notifications when leads are captured
                  </p>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                  >
                    Create API Client
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Secret Modal */}
      {showSecretModal && newSecret && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mx-auto mb-4">
                <KeyIcon className="w-8 h-8 text-yellow-600" />
              </div>
              
              <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Save These Credentials!
              </h2>
              <p className="text-center text-red-600 font-medium mb-6">
                ⚠️ The API secret will only be shown once. Save it securely!
              </p>

              <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Client Name
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-300 text-sm">
                      {newSecret.client_name}
                    </code>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Key
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-300 text-sm break-all">
                      {newSecret.api_key}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newSecret.api_key, 'new-key')}
                      className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      {copiedField === 'new-key' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    API Secret
                  </label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 bg-white px-4 py-2 rounded border border-gray-300 text-sm break-all">
                      {newSecret.api_secret}
                    </code>
                    <button
                      onClick={() => copyToClipboard(newSecret.api_secret, 'new-secret')}
                      className="px-3 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors"
                    >
                      {copiedField === 'new-secret' ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong>
                  <ol className="list-decimal list-inside mt-2 space-y-1">
                    <li>Copy both credentials and save them securely</li>
                    <li>Share them with your client or developer</li>
                    <li>Include the integration documentation</li>
                    <li>Test the integration before going live</li>
                  </ol>
                </p>
              </div>

              <button
                onClick={() => {
                  setShowSecretModal(false);
                  setNewSecret(null);
                }}
                className="w-full mt-6 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                I've Saved the Credentials
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stats Modal */}
      {showStatsModal && selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Usage Statistics - {selectedClient.client_name}
              </h2>

              {stats ? (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Requests</p>
                    <p className="text-3xl font-bold text-blue-900 mt-2">
                      {stats.total_requests}
                    </p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Successful</p>
                    <p className="text-3xl font-bold text-green-900 mt-2">
                      {stats.successful_requests}
                    </p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Failed</p>
                    <p className="text-3xl font-bold text-red-900 mt-2">
                      {stats.failed_requests}
                    </p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Leads Created</p>
                    <p className="text-3xl font-bold text-purple-900 mt-2">
                      {stats.leads_created}
                    </p>
                  </div>

                  <div className="col-span-2 bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 font-medium">Avg Response Time</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {stats.average_response_time_ms}ms
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                </div>
              )}

              <button
                onClick={() => {
                  setShowStatsModal(false);
                  setSelectedClient(null);
                  setStats(null);
                }}
                className="w-full mt-6 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default APIClients;

