import { useState, useEffect } from 'react';
import Modal from '../Modal';
import DynamicFormField from './DynamicFormField';
import { useIndustryConfig } from '../../context/IndustryConfigContext';
import { useLeads } from '../../context/LeadContext';
import leadService from '../../services/leadService';
import toast from 'react-hot-toast';

/**
 * DynamicLeadForm - Configuration-driven lead form
 * Renders form fields based on industry configuration
 * Supports both create and edit modes
 */
const DynamicLeadForm = ({ lead = null, onClose, onSuccess, initialStageId = null }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  
  const { config, getFields, formLayout, loading: configLoading } = useIndustryConfig();
  const { addLead, updateLead: updateLeadInContext } = useLeads();

  const isEditMode = !!lead;
  const allFields = getFields();

  // Initialize form data when lead or configuration changes
  useEffect(() => {
    if (configLoading) return;

    const initialData = {};
    
    allFields.forEach(field => {
      if (isEditMode && lead) {
        // Edit mode: populate from existing lead
        if (field.isCustomField) {
          // Custom fields come from lead.custom_fields
          initialData[field.id] = lead.custom_fields?.[field.name] ?? field.defaultValue ?? '';
        } else {
          // Core fields come from lead directly
          initialData[field.id] = lead[field.name] ?? field.defaultValue ?? '';
        }
      } else {
        // Create mode: use default values
        initialData[field.id] = field.defaultValue ?? '';
      }
    });

    // Set initial pipeline stage if provided
    if (initialStageId && !isEditMode) {
      initialData.pipeline_stage_id = initialStageId;
    }

    setFormData(initialData);
  }, [lead, allFields, configLoading, isEditMode, initialStageId]);

  /**
   * Handle field value change
   */
  const handleFieldChange = (fieldId, value) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  /**
   * Validate form data
   */
  const validateForm = () => {
    const newErrors = {};

    allFields.forEach(field => {
      const value = formData[field.id];

      // Required field validation
      if (field.required && (!value || value === '')) {
        newErrors[field.id] = `${field.label} is required`;
        return;
      }

      // Skip further validation if field is empty and not required
      if (!value || value === '') return;

      // Type-specific validation
      if (field.validation) {
        const { pattern, minLength, maxLength, min, max } = field.validation;

        // Pattern validation
        if (pattern) {
          const regex = new RegExp(pattern);
          if (!regex.test(String(value))) {
            newErrors[field.id] = field.validation.message || `Invalid ${field.label} format`;
          }
        }

        // Length validation
        if (minLength && String(value).length < minLength) {
          newErrors[field.id] = `${field.label} must be at least ${minLength} characters`;
        }
        if (maxLength && String(value).length > maxLength) {
          newErrors[field.id] = `${field.label} must not exceed ${maxLength} characters`;
        }

        // Number validation
        if (field.type === 'number' || field.type === 'currency') {
          const numValue = parseFloat(value);
          if (min !== undefined && numValue < min) {
            newErrors[field.id] = `${field.label} must be at least ${min}`;
          }
          if (max !== undefined && numValue > max) {
            newErrors[field.id] = `${field.label} must not exceed ${max}`;
          }
        }
      }

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Invalid email address';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    try {
      setLoading(true);

      // Separate core fields from custom fields
      const coreData = {};
      const customFieldsData = {};

      allFields.forEach(field => {
        const value = formData[field.id];
        
        // Skip empty values for optional fields
        if (!field.required && (value === '' || value === null || value === undefined)) {
          return;
        }

        if (field.isCustomField) {
          customFieldsData[field.name] = value;
        } else {
          coreData[field.name] = value;
        }
      });

      // Build payload
      const payload = {
        ...coreData,
        custom_fields: customFieldsData,
      };

      let response;
      if (isEditMode) {
        // Update existing lead
        response = await leadService.updateLead(lead.id, payload);
        if (response.success) {
          updateLeadInContext(response.data);
          toast.success(`${config?.terminology?.lead || 'Lead'} updated successfully!`);
        }
      } else {
        // Create new lead
        response = await leadService.createLead(payload);
        if (response.success) {
          addLead(response.data);
          toast.success(`${config?.terminology?.lead || 'Lead'} created successfully!`);
        }
      }

      // Call success callback if provided
      if (onSuccess) {
        onSuccess(response.data);
      }

      // Close the form
      onClose();
    } catch (error) {
      console.error('Failed to save lead:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Failed to save lead';
      toast.error(errorMessage);

      // Handle validation errors from server
      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        setErrors(serverErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  // Show loading state while configuration loads
  if (configLoading) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Loading..." size="lg">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-4 text-gray-600">Loading configuration...</span>
        </div>
      </Modal>
    );
  }

  // Show error if configuration not available
  if (!config || !formLayout) {
    return (
      <Modal isOpen={true} onClose={onClose} title="Error" size="lg">
        <div className="text-center py-12">
          <p className="text-red-600">Unable to load form configuration</p>
          <button
            onClick={onClose}
            className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </Modal>
    );
  }

  const modalTitle = isEditMode 
    ? `Edit ${config.terminology.lead || 'Lead'}` 
    : `Add New ${config.terminology.lead || 'Lead'}`;

  return (
    <Modal isOpen={true} onClose={onClose} title={modalTitle} size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Render form sections based on layout configuration */}
        {formLayout.sections && formLayout.sections.map(section => {
          // Get fields for this section
          const sectionFields = section.fields
            .map(fieldId => allFields.find(f => f.id === fieldId || f.fieldKey === fieldId))
            .filter(Boolean);

          if (sectionFields.length === 0) return null;

          return (
            <div key={section.id} className="border-b border-gray-200 pb-6 last:border-b-0">
              {section.title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  {section.title}
                </h3>
              )}
              {section.description && (
                <p className="text-sm text-gray-600 mb-4">
                  {section.description}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {sectionFields.map(field => (
                  <DynamicFormField
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={(value) => handleFieldChange(field.id, value)}
                    error={errors[field.id]}
                    disabled={loading}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {/* Form Actions */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-8 py-3 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              `${isEditMode ? 'Update' : 'Create'} ${config.terminology.lead || 'Lead'}`
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DynamicLeadForm;
