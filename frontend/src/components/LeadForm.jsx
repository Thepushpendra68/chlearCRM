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

  // Enhanced form configuration with strict validation
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    setValue,
    watch
  } = useForm({
    mode: 'onChange', // Validate on every change for immediate feedback
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

  // Watch email and phone for CRM validation
  const emailValue = watch('email');
  const phoneValue = watch('phone');

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

      // Validate required fields client-side as backup
      if (!data.first_name?.trim() || !data.last_name?.trim()) {
        toast.error('First name and last name are required');
        return;
      }

      // CRM Business Rule: Must have at least one contact method
      if (!data.email?.trim() && !data.phone?.trim()) {
        toast.error('🔍 At least one contact method (email or phone) is required for a lead');
        return;
      }

      // Clean data before sending
      const cleanedData = {
        ...data,
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email?.trim() || '',
        phone: data.phone?.trim() || '',
        company: data.company?.trim() || '',
        job_title: data.job_title?.trim() || '',
        notes: data.notes?.trim() || '',
        deal_value: data.deal_value === '' ? null : data.deal_value,
        expected_close_date: data.expected_close_date === '' ? null : data.expected_close_date,
        assigned_to: data.assigned_to === '' ? null : data.assigned_to,
        pipeline_stage_id: data.pipeline_stage_id === '' ? null : data.pipeline_stage_id
      };

      if (lead) {
        // Update existing lead
        const response = await leadService.updateLead(lead.id, cleanedData);
        if (response.success) {
          updateLead(response.data);
          toast.success('Lead updated successfully!');
          onSuccess?.(response.data);
        } else {
          throw new Error(response.message || 'Failed to update lead');
        }
      } else {
        // Create new lead
        const response = await leadService.createLead(cleanedData);
        if (response.success) {
          addLead(response.data);
          toast.success('Lead created successfully!');
          onSuccess?.(response.data);
        } else {
          throw new Error(response.message || 'Failed to create lead');
        }
      }

      if (onSubmit) {
        onSubmit(cleanedData);
      } else {
        onClose();
      }
    } catch (error) {
      console.error('Failed to save lead:', error);

      // Enhanced error handling with specific messages
      let errorMessage = 'An unexpected error occurred';

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.data?.error?.message) {
        errorMessage = error.response.data.error.message;
      } else if (error.response?.data?.errors) {
        // Handle validation errors array
        const validationErrors = error.response.data.errors;
        if (Array.isArray(validationErrors) && validationErrors.length > 0) {
          errorMessage = validationErrors.map(err => err.msg || err.message).join(', ');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Show specific error messages
      if (errorMessage.toLowerCase().includes('email')) {
        toast.error('Please check the email address format');
      } else if (errorMessage.toLowerCase().includes('phone')) {
        toast.error('Please check the phone number format');
      } else if (errorMessage.toLowerCase().includes('validation')) {
        toast.error(`Validation Error: ${errorMessage}`);
      } else if (errorMessage.toLowerCase().includes('required')) {
        toast.error('Please fill in all required fields');
      } else {
        toast.error(errorMessage);
      }
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
        {/* CRM Requirements Notice */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>CRM Requirements:</strong> At least one contact method (email or phone) is required to create a useful lead.
                {!emailValue?.trim() && !phoneValue?.trim() && (
                  <span className="block mt-1 text-blue-600 font-medium">⚠️ Please provide email or phone to continue</span>
                )}
              </p>
            </div>
          </div>
        </div>

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
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'First name can only contain letters and spaces'
                  },
                  validate: {
                    notEmpty: value => value.trim().length > 0 || 'First name cannot be empty or just spaces'
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
                  },
                  pattern: {
                    value: /^[a-zA-Z\s]+$/,
                    message: 'Last name can only contain letters and spaces'
                  },
                  validate: {
                    notEmpty: value => value.trim().length > 0 || 'Last name cannot be empty or just spaces'
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
                Email <span className="text-blue-600 text-xs">(Required if no phone)</span>
              </label>
              <input
                type="email"
                {...register('email', {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Please provide a valid email address'
                  },
                  maxLength: {
                    value: 100,
                    message: 'Email must not exceed 100 characters'
                  },
                  validate: {
                    validOrEmpty: value => !value || /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(value.trim()) || 'Please provide a valid email address'
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
                Phone <span className="text-blue-600 text-xs">(Required if no email)</span>
              </label>
              <input
                type="tel"
                {...register('phone', {
                  pattern: {
                    value: /^[+]?[\d\s()-]{0,20}$/,
                    message: 'Please provide a valid phone number'
                  },
                  maxLength: {
                    value: 20,
                    message: 'Phone number must not exceed 20 characters'
                  }
                })}
                className={`input ${errors.phone ? 'border-red-500' : ''}`}
                placeholder="Enter phone number"
              />
              {errors.phone && (
                <p className="text-red-500 text-xs mt-1">{errors.phone.message}</p>
              )}
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company <span className="text-green-600 text-xs">(Highly recommended for B2B)</span>
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
              disabled={loading || isSubmitting || loadingUsers || loadingStages || (!emailValue?.trim() && !phoneValue?.trim())}
              title={(!emailValue?.trim() && !phoneValue?.trim()) ? 'Please provide email or phone to create a lead' : ''}
            >
              {(loading || isSubmitting) ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  {lead ? 'Updating...' : 'Creating...'}
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
