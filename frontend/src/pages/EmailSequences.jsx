import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailService from '../services/emailService';
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
  EnvelopeIcon,
  BookOpenIcon
} from '@heroicons/react/24/outline';

const EmailSequences = () => {
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
      const response = await emailService.getSequences();
      setSequences(response.data || []);
    } catch (error) {
      console.error('Error fetching sequences:', error);
      toast.error('Failed to load sequences');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (sequence) => {
    try {
      await emailService.updateSequence(sequence.id, {
        is_active: !sequence.is_active
      });
      toast.success(
        sequence.is_active ? 'Sequence paused' : 'Sequence activated'
      );
      fetchSequences();
    } catch (error) {
      console.error('Error updating sequence:', error);
      toast.error('Failed to update sequence');
    }
  };

  const handleDelete = async (sequenceId, sequenceName) => {
    if (!window.confirm(`Are you sure you want to delete "${sequenceName}"?`)) {
      return;
    }

    try {
      await emailService.deleteSequence(sequenceId);
      toast.success('Sequence deleted successfully');
      fetchSequences();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BoltIcon className="h-8 w-8 mr-3 text-primary-600" />
            Email Sequences
          </h1>
          <p className="text-gray-600 mt-1">
            Create automated email sequences for lead nurturing
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/app/email/workflow-library" className="btn-secondary">
            <BookOpenIcon className="h-5 w-5 mr-2" />
            Browse Templates
          </Link>
          <Link to="/app/email/sequences/new" className="btn-primary">
            <PlusIcon className="h-5 w-5 mr-2" />
            New Sequence
          </Link>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Status:</label>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterActive('all')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filterActive === 'all'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setFilterActive('active')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filterActive === 'active'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Active
            </button>
            <button
              onClick={() => setFilterActive('inactive')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                filterActive === 'inactive'
                  ? 'bg-primary-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Inactive
            </button>
          </div>
        </div>
      </div>

      {/* Sequences List */}
      {filteredSequences.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <BoltIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No sequences found</h3>
          <p className="text-gray-600 mb-6">
            {filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'Create your first automated email sequence'}
          </p>
          <Link to="/app/email/sequences/new" className="btn-primary inline-flex">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Sequence
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSequences.map(sequence => {
            const steps = Array.isArray(sequence.steps) ? sequence.steps : [];
            const stepCount = steps.length;
            const enrollmentCount = sequence.enrollment_count || 0;

            return (
              <div
                key={sequence.id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {sequence.name}
                      </h3>
                      {sequence.is_active ? (
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs font-medium rounded">
                          Inactive
                        </span>
                      )}
                    </div>

                    {sequence.description && (
                      <p className="text-gray-600 mb-4">{sequence.description}</p>
                    )}

                    <div className="flex items-center space-x-6 text-sm text-gray-600">
                      <div className="flex items-center space-x-2">
                        <EnvelopeIcon className="h-5 w-5" />
                        <span>{stepCount} step{stepCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <UserGroupIcon className="h-5 w-5" />
                        <span>{enrollmentCount} enrolled</span>
                      </div>
                      <div>
                        Updated {format(new Date(sequence.updated_at), 'MMM d, yyyy')}
                      </div>
                    </div>

                    {/* Steps Preview */}
                    {stepCount > 0 && (
                      <div className="mt-4 flex items-center space-x-2 overflow-x-auto">
                        {steps.slice(0, 5).map((step, index) => (
                          <div
                            key={index}
                            className="flex items-center flex-shrink-0"
                          >
                            <div className="px-3 py-1 bg-primary-50 text-primary-700 text-xs rounded border border-primary-200">
                              {step.action_type === 'send_email'
                                ? `Email ${index + 1}`
                                : step.action_type === 'wait'
                                ? `Wait ${step.wait_days}d`
                                : step.action_type}
                            </div>
                            {index < Math.min(steps.length - 1, 4) && (
                              <div className="w-6 h-px bg-gray-300 mx-1"></div>
                            )}
                          </div>
                        ))}
                        {stepCount > 5 && (
                          <span className="text-xs text-gray-500">
                            +{stepCount - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => navigate(`/app/email/sequences/${sequence.id}`)}
                      className="btn-secondary"
                      title="Edit"
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>

                    <button
                      onClick={() => handleToggleActive(sequence)}
                      className={`btn-secondary ${
                        sequence.is_active
                          ? 'text-orange-600 hover:bg-orange-50'
                          : 'text-green-600 hover:bg-green-50'
                      }`}
                      title={sequence.is_active ? 'Pause' : 'Activate'}
                    >
                      {sequence.is_active ? (
                        <PauseIcon className="h-5 w-5" />
                      ) : (
                        <PlayIcon className="h-5 w-5" />
                      )}
                    </button>

                    <button
                      onClick={() => handleDelete(sequence.id, sequence.name)}
                      className="btn-secondary text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default EmailSequences;

