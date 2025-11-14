import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getSequences, updateSequence, deleteSequence } from '../services/whatsappService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  BoltIcon,
  PlusIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  PencilIcon,
  UserGroupIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const WhatsAppSequences = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sequences, setSequences] = useState([]);
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchSequences();
  }, []);

  const fetchSequences = async () => {
    try {
      setLoading(true);
      const result = await getSequences();
      if (result.success) {
        setSequences(result.data?.data || []);
      } else {
        toast.error(result.error || 'Failed to load sequences');
        setSequences([]);
      }
    } catch (error) {
      console.error('Error fetching sequences:', error);
      toast.error('Failed to load sequences');
      setSequences([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sequence) => {
    try {
      const result = await updateSequence(sequence.id, {
        is_active: !sequence.is_active
      });
      
      if (result.success) {
        toast.success(
          sequence.is_active ? 'Sequence paused' : 'Sequence activated'
        );
        fetchSequences();
      } else {
        toast.error(result.error || 'Failed to update sequence');
      }
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Failed to update sequence');
    }
  };

  const handleDelete = async (sequenceId, sequenceName) => {
    if (!window.confirm(`Are you sure you want to delete "${sequenceName}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await deleteSequence(sequenceId);
      if (result.success) {
        toast.success('Sequence deleted successfully');
        fetchSequences();
      } else {
        toast.error(result.error || 'Failed to delete sequence');
      }
    } catch (error) {
      console.error('Error deleting sequence:', error);
      toast.error('Failed to delete sequence');
    }
  };

  const filteredSequences = sequences.filter(seq => {
    if (filterActive === 'all') return true;
    if (filterActive === 'active') return seq.is_active;
    if (filterActive === 'inactive') return !seq.is_active;
    return true;
  });

  const getStats = (sequence) => {
    const stats = sequence.stats || {};
    return {
      enrolled: stats.enrolled || 0,
      active: stats.active || 0,
      completed: stats.completed || 0,
      messagesSent: stats.messages_sent || 0
    };
  };

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
            <ChatBubbleLeftRightIcon className="h-8 w-8 mr-3 text-green-600" />
            WhatsApp Campaigns
          </h1>
          <p className="text-gray-600 mt-1">
            Create automated WhatsApp message sequences for lead nurturing
          </p>
        </div>
        <button
          onClick={() => navigate('/app/whatsapp/sequences/new')}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        >
          <PlusIcon className="h-5 w-5" />
          New Campaign
        </button>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterActive('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterActive === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({sequences.length})
        </button>
        <button
          onClick={() => setFilterActive('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterActive === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({sequences.filter(s => s.is_active).length})
        </button>
        <button
          onClick={() => setFilterActive('inactive')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterActive === 'inactive'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Inactive ({sequences.filter(s => !s.is_active).length})
        </button>
      </div>

      {/* Sequences List */}
      {filteredSequences.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <ChatBubbleLeftRightIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first WhatsApp campaign to start nurturing leads automatically
          </p>
          <button
            onClick={() => navigate('/app/whatsapp/sequences/new')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <PlusIcon className="h-5 w-5" />
            Create Campaign
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSequences.map((sequence) => {
            const stats = getStats(sequence);
            const steps = sequence.json_definition?.steps || [];
            
            return (
              <div
                key={sequence.id}
                className="bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {sequence.name}
                      </h3>
                      {sequence.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {sequence.description}
                        </p>
                      )}
                    </div>
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded ${
                        sequence.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {sequence.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-200">
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Enrolled</p>
                      <p className="text-lg font-semibold text-gray-900">{stats.enrolled}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Active</p>
                      <p className="text-lg font-semibold text-green-600">{stats.active}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Completed</p>
                      <p className="text-lg font-semibold text-gray-900">{stats.completed}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 mb-1">Messages Sent</p>
                      <p className="text-lg font-semibold text-gray-900">{stats.messagesSent}</p>
                    </div>
                  </div>

                  {/* Steps Count */}
                  <div className="mb-4">
                    <p className="text-xs text-gray-500 mb-1">Steps</p>
                    <p className="text-sm font-medium text-gray-900">
                      {steps.length} message{steps.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(sequence)}
                      className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        sequence.is_active
                          ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                          : 'bg-green-100 text-green-800 hover:bg-green-200'
                      }`}
                    >
                      {sequence.is_active ? (
                        <>
                          <PauseIcon className="h-4 w-4" />
                          Pause
                        </>
                      ) : (
                        <>
                          <PlayIcon className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => navigate(`/app/whatsapp/sequences/${sequence.id}/edit`)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="Edit"
                    >
                      <PencilIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/app/whatsapp/sequences/${sequence.id}/enrollments`)}
                      className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                      title="View Enrollments"
                    >
                      <UserGroupIcon className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(sequence.id, sequence.name)}
                      className="px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Created Date */}
                  {sequence.created_at && (
                    <p className="text-xs text-gray-500 mt-4 pt-4 border-t border-gray-200">
                      Created {format(new Date(sequence.created_at), 'MMM d, yyyy')}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default WhatsAppSequences;

