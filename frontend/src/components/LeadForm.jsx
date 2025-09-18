import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import leadService from '../services/leadService';
import userService from '../services/userService';
import pipelineService from '../services/pipelineService';
import { useLeads } from '../context/LeadContext';
import toast from 'react-hot-toast';

const LeadForm = ({ lead = null, onClose, onSuccess, initialStageId = null, onSubmit, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [stages, setStages] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingStages, setLoadingStages] = useState(true);
  
  // Use the global leads context
  const { addLead, updateLead } = useLeads();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      company: '',
      job_title: '',
      lead_source: 'website',
      status: 'new',
      assigned_to: '',
      notes: '',
      pipeline_stage_id: initialStageId || '',
      deal_value: '',
      probability: 0,
      expected_close_date: '',
      priority: 'medium'
    }
  });

  // Load users and stages for dropdowns
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingUsers(true);
        setLoadingStages(true);
        
        const [usersResponse, stagesResponse] = await Promise.all([
          userService.getActiveUsers(),
          pipelineService.getStages()
        ]);
        
        setUsers(usersResponse.data || []);
        setStages(stagesResponse.data || []);
      } catch (error) {
        console.error('Failed to load data:', error);
        toast.error('Failed to load form data');
      } finally {
        setLoadingUsers(false);
        setLoadingStages(false);
      }
    };

    loadData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (lead) {
      setValue('first_name', lead.first_name || '');
      setValue('last_name', lead.last_name || '');
      setValue('email', lead.email || '');
      setValue('phone', lead.phone || '');
      setValue('company', lead.company || '');
      setValue('job_title', lead.job_title || '');
      setValue('lead_source', lead.lead_source || 'website');
      setValue('status', lead.status || 'new');
      setValue('assigned_to', lead.assigned_to || '');
      setValue('notes', lead.notes || '');
      setValue('pipeline_stage_id', lead.pipeline_stage_id || '');
      setValue('deal_value', lead.deal_value || '');
      setValue('probability', lead.probability || 0);
      setValue('expected_close_date', lead.expected_close_date || '');
      setValue('priority', lead.priority || 'medium');
    } else if (initialStageId) {
      setValue('pipeline_stage_id', initialStageId);
    }
  }, [lead, initialStageId, setValue]);

  const handleFormSubmit = async (data) => {
    try {
      setLoading(true);
      
      if (lead) {
        // Update existing lead
        const updatedLead = await leadService.updateLead(lead.id, data);
        updateLead(updatedLead.data); // Update the global state
        toast.success('Lead updated successfully');
        onSuccess?.(updatedLead.data);
      } else {
        // Create new lead
        const newLead = await leadService.createLead(data);
        addLead(newLead.data); // Add to the global state
        toast.success('Lead created successfully');
        onSuccess?.(newLead.data);
      }
      
      if (onSubmit) {
        onSubmit(data);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save lead:', error);
      // Error handling is done in the API interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    if (onCancel) {
      onCancel();
    } else {
      onClose();
    }
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={lead ? 'Edit Lead' : 'Add New Lead'}
      size="lg"
    >
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-1">
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                First Name *
              </label>
              <input
                type="text"
                {...register('first_name', {
                  required: 'First name is required',
                  minLength: {
                    value: 2,
                    message: 'First name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'First name must not exceed 50 characters'
                  }
                })}
                className={`block w-full px-4 py-3 border rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 ${errors.first_name ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}`}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {errors.first_name.message}
                </p>
              )}
            </div>

            {/* Last Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                {...register('last_name', {
                  required: 'Last name is required',
                  minLength: {
                    value: 2,
                    message: 'Last name must be at least 2 characters'
                  },
                  maxLength: {
                    value: 50,
                    message: 'Last name must not exceed 50 characters'
                  }
                })}
                className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
                className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="Enter email address"
              />
              {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
              )}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="tel"
                {...register('phone')}
                className="input"
                placeholder="Enter phone number"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                {...register('company', {
                  maxLength: {
                    value: 100,
                    message: 'Company name must not exceed 100 characters'
                  }
                })}
                className={`input ${errors.company ? 'border-red-500' : ''}`}
                placeholder="Enter company name"
              />
              {errors.company && (
                <p className="text-red-500 text-xs mt-1">{errors.company.message}</p>
              )}
            </div>

            {/* Job Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Job Title
              </label>
              <input
                type="text"
                {...register('job_title', {
                  maxLength: {
                    value: 100,
                    message: 'Job title must not exceed 100 characters'
                  }
                })}
                className={`input ${errors.job_title ? 'border-red-500' : ''}`}
                placeholder="Enter job title"
              />
              {errors.job_title && (
                <p className="text-red-500 text-xs mt-1">{errors.job_title.message}</p>
              )}
            </div>

            {/* Lead Source */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lead Source
              </label>
              <select
                {...register('lead_source')}
                className="input"
              >
                <option value="website">Website</option>
                <option value="referral">Referral</option>
                <option value="cold_call">Cold Call</option>
                <option value="social_media">Social Media</option>
                <option value="advertisement">Advertisement</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('status')}
                className="input"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="qualified">Qualified</option>
                <option value="converted">Converted</option>
                <option value="lost">Lost</option>
              </select>
            </div>

            {/* Pipeline Stage */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pipeline Stage
              </label>
              <select
                {...register('pipeline_stage_id')}
                className="input"
                disabled={loadingStages}
              >
                <option value="">Select stage</option>
                {stages.map((stage) => (
                  <option key={stage.id} value={stage.id}>
                    {stage.name}
                  </option>
                ))}
              </select>
              {loadingStages && (
                <p className="text-gray-500 text-xs mt-1">Loading stages...</p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                {...register('priority')}
                className="input"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Deal Value */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Value
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                {...register('deal_value', {
                  min: {
                    value: 0,
                    message: 'Deal value must be positive'
                  }
                })}
                className={`input ${errors.deal_value ? 'border-red-500' : ''}`}
                placeholder="Enter deal value"
              />
              {errors.deal_value && (
                <p className="text-red-500 text-xs mt-1">{errors.deal_value.message}</p>
              )}
            </div>

            {/* Probability */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Probability (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                {...register('probability', {
                  min: {
                    value: 0,
                    message: 'Probability must be at least 0'
                  },
                  max: {
                    value: 100,
                    message: 'Probability must not exceed 100'
                  }
                })}
                className={`input ${errors.probability ? 'border-red-500' : ''}`}
                placeholder="Enter probability percentage"
              />
              {errors.probability && (
                <p className="text-red-500 text-xs mt-1">{errors.probability.message}</p>
              )}
            </div>

            {/* Expected Close Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Expected Close Date
              </label>
              <input
                type="date"
                {...register('expected_close_date')}
                className="input"
              />
            </div>

            {/* Assigned To */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Assigned To
              </label>
              <select
                {...register('assigned_to')}
                className="input"
                disabled={loadingUsers}
              >
                <option value="">Select user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.first_name} {user.last_name} ({user.role})
                  </option>
                ))}
              </select>
              {loadingUsers && (
                <p className="text-gray-500 text-xs mt-1">Loading users...</p>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                {...register('notes', {
                  maxLength: {
                    value: 1000,
                    message: 'Notes must not exceed 1000 characters'
                  }
                })}
                rows={3}
                className={`input ${errors.notes ? 'border-red-500' : ''}`}
                placeholder="Enter notes about the lead"
              />
              {errors.notes && (
                <p className="text-red-500 text-xs mt-1">{errors.notes.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  Saving...
                </div>
              ) : (
                lead ? 'Update Lead' : 'Create Lead'
              )}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
};

export default LeadForm;
