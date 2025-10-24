import React, { useState, useEffect } from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';
import DynamicFormField from './DynamicFormField';
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';

/**
 * DynamicLeadForm Component
 *
 * Renders a complete lead form based on industry configuration.
 * Dynamically generates form sections and fields from config.
 * Handles both create and edit modes.
 * Separates core fields and custom fields for API submission.
 *
 * @param {object} initialData - Initial form data (for edit mode)
 * @param {function} onSubmit - Submit handler: (formData) => void
 * @param {function} onCancel - Cancel handler
 * @param {boolean} isEdit - Whether in edit mode
 */
const DynamicLeadForm = ({
  initialData = {},
  onSubmit,
  onCancel,
  isEdit = false
}) => {
  const { getFormLayout, config } = useIndustryConfig();

  const [formData, setFormData] = useState({});
  const [customFields, setCustomFields] = useState({});
  const [errors, setErrors] = useState({});
  const [collapsedSections, setCollapsedSections] = useState(new Set());

  // Initialize form data from initialData
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const { custom_fields, ...coreFields } = initialData;

      // Set core fields
      setFormData(coreFields);

      // Set custom fields
      setCustomFields(custom_fields || {});
    }
  }, [initialData]);

  const formLayout = getFormLayout();

  /**
   * Handle field value change
   * Automatically determines if field is core or custom
   */
  const handleFieldChange = (fieldName, value) => {
    // Check if this is a custom field
    const isCustomField = !!config?.customFields?.[getFieldNameFromLayout(fieldName)];

    if (isCustomField) {
      setCustomFields(prev => ({ ...prev, [fieldName]: value }));
    } else {
      setFormData(prev => ({ ...prev, [fieldName]: value }));
    }

    // Clear error for this field
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[fieldName];
      return newErrors;
    });
  };

  /**
   * Get field name from layout (handles both direct field names and field objects)
   */
  const getFieldNameFromLayout = (fieldName) => {
    // If fieldName is a string, return it
    if (typeof fieldName === 'string') return fieldName;

    // If it's an object with fieldName property
    if (fieldName && fieldName.fieldName) return fieldName.fieldName;

    return null;
  };

  /**
   * Toggle section collapsed state
   */
  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  /**
   * Validate form before submission
   */
  const validateForm = () => {
    const newErrors = {};

    formLayout.forEach(section => {
      section.fields.forEach(field => {
        if (field.required) {
          const isCustomField = !!config?.customFields?.[field.fieldName];
          const value = isCustomField
            ? customFields[field.name]
            : formData[field.name];

          // Check if value is empty
          if (value === undefined || value === null || value === '') {
            newErrors[field.name] = `${field.label} is required`;
          }
        }

        // Additional type-specific validation
        if (field.type === 'email' && formData[field.name]) {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(formData[field.name])) {
            newErrors[field.name] = 'Please enter a valid email address';
          }
        }
      });
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form submission
   */
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate form
    if (!validateForm()) {
      // Scroll to first error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
      return;
    }

    // Combine core fields and custom fields
    const submitData = {
      ...formData,
      custom_fields: customFields
    };

    console.log('[DynamicLeadForm] Submitting data:', submitData);
    onSubmit(submitData);
  };

  // If no form layout, show message
  if (!formLayout || formLayout.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No form configuration available.</p>
        <p className="text-sm mt-2">Please check your industry configuration.</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {formLayout.map((section) => {
        const isCollapsed = collapsedSections.has(section.id);
        const canCollapse = section.collapsible !== false;

        return (
          <div
            key={section.id}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden"
          >
            {/* Section Header */}
            <div
              className={`px-6 py-4 bg-gray-50 border-b border-gray-200 ${
                canCollapse ? 'cursor-pointer hover:bg-gray-100' : ''
              }`}
              onClick={() => canCollapse && toggleSection(section.id)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {section.title}
                </h3>
                {canCollapse && (
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSection(section.id);
                    }}
                  >
                    {isCollapsed ? (
                      <ChevronDownIcon className="h-5 w-5" />
                    ) : (
                      <ChevronUpIcon className="h-5 w-5" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Section Content */}
            {!isCollapsed && (
              <div className="px-6 py-4">
                <div className="grid grid-cols-12 gap-4">
                  {section.fields.map((field) => {
                    const isCustomField = !!config?.customFields?.[field.fieldName];
                    const value = isCustomField
                      ? customFields[field.name]
                      : formData[field.name];

                    return (
                      <DynamicFormField
                        key={field.fieldName}
                        fieldName={field.fieldName}
                        value={value}
                        onChange={handleFieldChange}
                        errors={errors}
                      />
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          {isEdit ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  );
};

export default DynamicLeadForm;
