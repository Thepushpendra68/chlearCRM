import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSequenceById, getSequenceEnrollments, unenrollLead } from '../services/whatsappService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  ArrowLeftIcon,
  UserGroupIcon,
  XMarkIcon,
  CheckCircleIcon,
  ClockIcon,
  PauseCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const WhatsAppSequenceEnrollments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sequence, setSequence] = useState(null);
  const [enrollments, setEnrollments] = useState([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    fetchSequence();
    fetchEnrollments();
  }, [id, filterStatus]);

  const fetchSequence = async () => {
    try {
      const result = await getSequenceById(id);
      if (result.success && result.data?.data) {
        setSequence(result.data.data);
      } else {
        toast.error(result.error || 'Failed to load sequence');
        navigate('/app/whatsapp/sequences');
      }
    } catch (error) {
      console.error('Error fetching sequence:', error);
      toast.error('Failed to load sequence');
      navigate('/app/whatsapp/sequences');
    }
  };

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const filters = filterStatus !== 'all' ? { status: filterStatus } : {};
      const result = await getSequenceEnrollments(id, filters);
      if (result.success) {
        setEnrollments(result.data?.data || []);
      } else {
        toast.error(result.error || 'Failed to load enrollments');
        setEnrollments([]);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
      toast.error('Failed to load enrollments');
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleUnenroll = async (leadId, leadName) => {
    if (!window.confirm(`Are you sure you want to unenroll ${leadName} from this sequence?`)) {
      return;
    }

    try {
      const result = await unenrollLead(id, leadId);
      if (result.success) {
        toast.success('Lead unenrolled successfully');
        fetchEnrollments();
      } else {
        toast.error(result.error || 'Failed to unenroll lead');
      }
    } catch (error) {
      console.error('Error unenrolling lead:', error);
      toast.error('Failed to unenroll lead');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active':
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case 'paused':
        return <PauseCircleIcon className="h-5 w-5 text-yellow-600" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-blue-600" />;
      case 'cancelled':
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'paused':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'cancelled':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const statusCounts = enrollments.reduce((acc, enrollment) => {
    acc[enrollment.status] = (acc[enrollment.status] || 0) + 1;
    return acc;
  }, {});

  if (loading && !sequence) {
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
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/whatsapp/sequences')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <UserGroupIcon className="h-8 w-8 mr-3 text-green-600" />
              Enrollments
            </h1>
            {sequence && (
              <p className="text-gray-600 mt-1">
                {sequence.name}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      {enrollments.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Total</p>
            <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Active</p>
            <p className="text-2xl font-bold text-green-600">{statusCounts.active || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Completed</p>
            <p className="text-2xl font-bold text-blue-600">{statusCounts.completed || 0}</p>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600 mb-1">Paused</p>
            <p className="text-2xl font-bold text-yellow-600">{statusCounts.paused || 0}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mb-6 flex gap-2">
        <button
          onClick={() => setFilterStatus('all')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'all'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All ({enrollments.length})
        </button>
        <button
          onClick={() => setFilterStatus('active')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Active ({statusCounts.active || 0})
        </button>
        <button
          onClick={() => setFilterStatus('completed')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'completed'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Completed ({statusCounts.completed || 0})
        </button>
        <button
          onClick={() => setFilterStatus('paused')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'paused'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Paused ({statusCounts.paused || 0})
        </button>
        <button
          onClick={() => setFilterStatus('cancelled')}
          className={`px-4 py-2 rounded-lg transition-colors ${
            filterStatus === 'cancelled'
              ? 'bg-green-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Cancelled ({statusCounts.cancelled || 0})
        </button>
      </div>

      {/* Enrollments List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
        </div>
      ) : enrollments.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <UserGroupIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No enrollments found</h3>
          <p className="text-gray-600">
            {filterStatus !== 'all'
              ? `No enrollments with status "${filterStatus}"`
              : 'No leads have been enrolled in this sequence yet'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Step
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Next Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {enrollments.map((enrollment) => {
                  const lead = enrollment.lead || {};
                  const leadName = lead.first_name || lead.last_name
                    ? `${lead.first_name || ''} ${lead.last_name || ''}`.trim()
                    : lead.email || 'Unknown Lead';

                  return (
                    <tr key={enrollment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{leadName}</div>
                          {lead.email && (
                            <div className="text-sm text-gray-500">{lead.email}</div>
                          )}
                          {lead.phone && (
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(enrollment.status)}>
                          <span className="flex items-center gap-1">
                            {getStatusIcon(enrollment.status)}
                            {enrollment.status || 'pending'}
                          </span>
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {enrollment.current_step !== null && enrollment.current_step !== undefined
                          ? `Step ${enrollment.current_step + 1}`
                          : 'Not started'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enrollment.started_at
                          ? format(new Date(enrollment.started_at), 'MMM d, yyyy HH:mm')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {enrollment.next_run_at
                          ? format(new Date(enrollment.next_run_at), 'MMM d, yyyy HH:mm')
                          : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {enrollment.status === 'active' && (
                          <button
                            onClick={() => handleUnenroll(enrollment.lead_id, leadName)}
                            className="text-red-600 hover:text-red-900 flex items-center gap-1"
                          >
                            <XMarkIcon className="h-4 w-4" />
                            Unenroll
                          </button>
                          )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default WhatsAppSequenceEnrollments;

