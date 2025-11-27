/**
 * WhatsApp Broadcasts Page
 * Manage and send bulk WhatsApp broadcasts
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MegaphoneIcon, 
  PlusIcon, 
  PlayIcon, 
  PauseIcon, 
  TrashIcon, 
  EyeIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { format, formatDistanceToNow } from 'date-fns';
import { 
  getBroadcasts, 
  sendBroadcast, 
  cancelBroadcast, 
  deleteBroadcast,
  getBroadcastStats 
} from '../services/whatsappService';
import CreateBroadcastModal from '../components/WhatsApp/CreateBroadcastModal';
import BroadcastStatsModal from '../components/WhatsApp/BroadcastStatsModal';

const WhatsAppBroadcasts = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [broadcasts, setBroadcasts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBroadcast, setSelectedBroadcast] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, [filterStatus]);

  const fetchBroadcasts = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const result = await getBroadcasts(filters);
      
      if (result.success) {
        setBroadcasts(result.data || []);
      } else {
        toast.error(result.error || 'Failed to load broadcasts');
        setBroadcasts([]);
      }
    } catch (error) {
      console.error('Error fetching broadcasts:', error);
      toast.error('Failed to load broadcasts');
      setBroadcasts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (broadcastId) => {
    if (!window.confirm('Are you sure you want to send this broadcast? This action cannot be undone.')) {
      return;
    }

    try {
      const result = await sendBroadcast(broadcastId);
      if (result.success) {
        toast.success(`Broadcast sent! ${result.data.sent} messages sent, ${result.data.failed} failed`);
        fetchBroadcasts();
      } else {
        toast.error(result.error || 'Failed to send broadcast');
      }
    } catch (error) {
      console.error('Error sending broadcast:', error);
      toast.error('Failed to send broadcast');
    }
  };

  const handleCancel = async (broadcastId) => {
    if (!window.confirm('Are you sure you want to cancel this broadcast?')) {
      return;
    }

    try {
      const result = await cancelBroadcast(broadcastId);
      if (result.success) {
        toast.success('Broadcast cancelled');
        fetchBroadcasts();
      } else {
        toast.error(result.error || 'Failed to cancel broadcast');
      }
    } catch (error) {
      console.error('Error cancelling broadcast:', error);
      toast.error('Failed to cancel broadcast');
    }
  };

  const handleDelete = async (broadcastId, broadcastName) => {
    if (!window.confirm(`Are you sure you want to delete "${broadcastName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteBroadcast(broadcastId);
      if (result.success) {
        toast.success('Broadcast deleted');
        fetchBroadcasts();
      } else {
        toast.error(result.error || 'Failed to delete broadcast');
      }
    } catch (error) {
      console.error('Error deleting broadcast:', error);
      toast.error('Failed to delete broadcast');
    }
  };

  const handleViewStats = async (broadcast) => {
    setSelectedBroadcast(broadcast);
    setLoadingStats(true);
    setShowStatsModal(true);

    try {
      const result = await getBroadcastStats(broadcast.id);
      if (result.success) {
        setStats(result.data);
      } else {
        toast.error(result.error || 'Failed to load statistics');
        setStats(null);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      toast.error('Failed to load statistics');
      setStats(null);
    } finally {
      setLoadingStats(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      draft: { bg: 'bg-gray-100', text: 'text-gray-800', icon: ClockIcon, label: 'Draft' },
      scheduled: { bg: 'bg-blue-100', text: 'text-blue-800', icon: ClockIcon, label: 'Scheduled' },
      sending: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: PlayIcon, label: 'Sending' },
      sent: { bg: 'bg-green-100', text: 'text-green-800', icon: CheckCircleIcon, label: 'Sent' },
      paused: { bg: 'bg-orange-100', text: 'text-orange-800', icon: PauseIcon, label: 'Paused' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', icon: XMarkIcon, label: 'Cancelled' },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: ExclamationCircleIcon, label: 'Failed' }
    };

    const config = statusConfig[status] || statusConfig.draft;
    const Icon = config.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </span>
    );
  };

  const getMessageTypeLabel = (type) => {
    const types = {
      text: 'Text',
      template: 'Template',
      media: 'Media'
    };
    return types[type] || type;
  };

  const getRecipientTypeLabel = (type) => {
    const types = {
      leads: 'All Leads',
      contacts: 'All Contacts',
      custom: 'Custom List',
      filter: 'Filtered Leads'
    };
    return types[type] || type;
  };

  const filteredBroadcasts = broadcasts.filter(b => {
    if (filterStatus === 'all') return true;
    return b.status === filterStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <MegaphoneIcon className="h-8 w-8 mr-3 text-green-600" />
            WhatsApp Broadcasts
          </h1>
          <p className="text-gray-600 mt-1">
            Send bulk WhatsApp messages to multiple recipients
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Broadcast
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-6">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilterStatus('draft')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'draft'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Draft
        </button>
        <button
          onClick={() => setFilterStatus('scheduled')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'scheduled'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Scheduled
        </button>
        <button
          onClick={() => setFilterStatus('sending')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'sending'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Sending
        </button>
        <button
          onClick={() => setFilterStatus('sent')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filterStatus === 'sent'
              ? 'bg-green-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
          }`}
        >
          Sent
        </button>
      </div>

      {/* Broadcasts List */}
      {filteredBroadcasts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <MegaphoneIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No broadcasts yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first broadcast to send messages to multiple recipients at once
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Broadcast
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredBroadcasts.map((broadcast) => {
            const progress = broadcast.progress || { sent: 0, delivered: 0, read: 0, failed: 0 };
            const total = progress.sent + progress.delivered + progress.read + progress.failed;
            const successRate = broadcast.recipient_count > 0 
              ? ((progress.sent + progress.delivered + progress.read) / broadcast.recipient_count * 100).toFixed(1)
              : 0;

            return (
              <div
                key={broadcast.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {broadcast.name}
                        </h3>
                        {getStatusBadge(broadcast.status)}
                      </div>
                      {broadcast.description && (
                        <p className="text-sm text-gray-600 mb-2">
                          {broadcast.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Type: {getMessageTypeLabel(broadcast.message_type)}</span>
                        <span>•</span>
                        <span>Recipients: {getRecipientTypeLabel(broadcast.recipient_type)}</span>
                        <span>•</span>
                        <span>{broadcast.recipient_count || 0} contacts</span>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {broadcast.status === 'sending' || broadcast.status === 'sent' ? (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>Progress</span>
                        <span>{successRate}% success rate</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all"
                          style={{ width: `${successRate}%` }}
                        ></div>
                      </div>
                      <div className="flex items-center justify-between text-xs text-gray-500 mt-2">
                        <span>Sent: {progress.sent}</span>
                        <span>Delivered: {progress.delivered}</span>
                        <span>Read: {progress.read}</span>
                        <span>Failed: {progress.failed}</span>
                      </div>
                    </div>
                  ) : null}

                  {/* Metadata */}
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-4">
                      {broadcast.created_at && (
                        <span>
                          Created {formatDistanceToNow(new Date(broadcast.created_at), { addSuffix: true })}
                        </span>
                      )}
                      {broadcast.scheduled_at && (
                        <span>
                          Scheduled: {format(new Date(broadcast.scheduled_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                      {broadcast.completed_at && (
                        <span>
                          Completed: {format(new Date(broadcast.completed_at), 'MMM d, yyyy h:mm a')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-gray-200">
                    {broadcast.status === 'draft' && (
                      <button
                        onClick={() => handleSend(broadcast.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        <PlayIcon className="h-4 w-4" />
                        Send Now
                      </button>
                    )}
                    {broadcast.status === 'scheduled' && (
                      <button
                        onClick={() => handleCancel(broadcast.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
                      >
                        <XMarkIcon className="h-4 w-4" />
                        Cancel
                      </button>
                    )}
                    {broadcast.status === 'sending' && (
                      <button
                        onClick={() => handleCancel(broadcast.id)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <PauseIcon className="h-4 w-4" />
                        Stop Sending
                      </button>
                    )}
                    {(broadcast.status === 'sent' || broadcast.status === 'cancelled' || broadcast.status === 'failed') && (
                      <button
                        onClick={() => handleViewStats(broadcast)}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <EyeIcon className="h-4 w-4" />
                        View Stats
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(broadcast.id, broadcast.name)}
                      className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <TrashIcon className="h-4 w-4" />
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateBroadcastModal
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            fetchBroadcasts();
          }}
        />
      )}

      {showStatsModal && selectedBroadcast && (
        <BroadcastStatsModal
          isOpen={showStatsModal}
          onClose={() => {
            setShowStatsModal(false);
            setSelectedBroadcast(null);
            setStats(null);
          }}
          broadcast={selectedBroadcast}
          stats={stats}
          loading={loadingStats}
        />
      )}
    </div>
  );
};

export default WhatsAppBroadcasts;

