import React from 'react';
import { useIndustryConfig } from '../../context/IndustryConfigContext';

/**
 * DynamicFormField Component
 *
 * Renders a form field based on industry configuration.
 * Supports all field types: text, email, tel, number, currency, date, datetime,
 * select, multiselect, textarea, checkbox, and more.
 *
 * @param {string} fieldName - Field name from configuration
 * @param {any} value - Current field value
 * @param {function} onChange - Change handler: (fieldName, value) => void
 * @param {object} errors - Validation errors object
 * @param {boolean} disabled - Whether field is disabled
 */
const DynamicFormField = ({
  fieldName,
  value,
  onChange,
  errors = {},
  disabled = false
}) => {
  const { getFieldDefinition } = useIndustryConfig();
  const field = getFieldDefinition(fieldName);

  if (!field) {
    console.warn(`[DynamicFormField] Field definition not found for: ${fieldName}`);
    return null;
  }

  const hasError = !!errors[field.name];
  const errorMessage = errors[field.name];

  const baseInputClasses = `
    mt-1 block w-full rounded-md border-gray-300 shadow-sm
    focus:border-blue-500 focus:ring-blue-500 sm:text-sm
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  `.trim();

  const errorInputClasses = `
    mt-1 block w-full rounded-md border-red-300 shadow-sm
    focus:border-red-500 focus:ring-red-500 sm:text-sm
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  `.trim();

  const inputClasses = hasError ? errorInputClasses : baseInputClasses;

  const handleChange = (e) => {
    const newValue = e.target.value;
    onChange(field.name, newValue);
  };

  const handleCheckboxChange = (e) => {
    onChange(field.name, e.target.checked);
  };

  const handleMultiSelectChange = (e) => {
    const options = Array.from(e.target.selectedOptions, option => option.value);
    onChange(field.name, options);
  };

  const renderLabel = () => (
    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  const renderHelpText = () => {
    if (!field.helpText) return null;
    return <p className="mt-1 text-sm text-gray-500">{field.helpText}</p>;
  };

  const renderError = () => {
    if (!hasError) return null;
    return <p className="mt-1 text-sm text-red-600">{errorMessage}</p>;
  };

  // Render different input types based on field configuration
  const renderInput = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'tel':
        return renderTextInput();

      case 'number':
      case 'currency':
        return renderNumberInput();

      case 'date':
      case 'datetime':
        return renderDateInput();

      case 'select':
        return renderSelectInput();

      case 'multiselect':
        return renderMultiSelectInput();

      case 'textarea':
        return renderTextarea();

      case 'checkbox':
        return renderCheckbox();

      case 'user':
      case 'pipeline_stage':
        // These would need special handling with data fetching
        // For now, render as text input
        return renderTextInput();

      default:
        console.warn(`[DynamicFormField] Unknown field type: ${field.type}`);
        return renderTextInput();
    }
  };

  function renderTextInput() {
    return (
      <>
        {renderLabel()}
        <input
          type={field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          maxLength={field.maxLength}
          pattern={field.validation?.pattern?.source}
          className={inputClasses}
        />
        {renderHelpText()}
        {renderError()}
      </>
    );
  }

  function renderNumberInput() {
    return (
      <>
        {renderLabel()}
        <input
          type="number"
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          min={field.min}
          max={field.max}
          step={field.type === 'currency' ? '0.01' : '1'}
          className={inputClasses}
        />
        {renderHelpText()}
        {renderError()}
      </>
    );
  }

  function renderDateInput() {
    return (
      <>
        {renderLabel()}
        <input
          type={field.type === 'datetime' ? 'datetime-local' : 'date'}
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          required={field.required}
          className={inputClasses}
        />
        {renderHelpText()}
        {renderError()}
      </>
    );
  }

  function renderSelectInput() {
    return (
      <>
        {renderLabel()}
        <select
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          required={field.required}
          className={inputClasses}
        >
          <option value="">{field.placeholder || 'Select...'}</option>
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {renderHelpText()}
        {renderError()}
      </>
    );
  }

  function renderMultiSelectInput() {
    return (
      <>
        {renderLabel()}
        <select
          id={field.name}
          name={field.name}
          value={value || []}
          onChange={handleMultiSelectChange}
          disabled={disabled}
          required={field.required}
          multiple
          size={Math.min(field.options?.length || 5, 8)}
          className={`${inputClasses} h-auto`}
        >
          {field.options?.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <p className="mt-1 text-sm text-gray-500">
          Hold Ctrl/Cmd to select multiple options
        </p>
        {renderHelpText()}
        {renderError()}
      </>
    );
  }

  function renderTextarea() {
    return (
      <>
        {renderLabel()}
        <textarea
          id={field.name}
          name={field.name}
          value={value || ''}
          onChange={handleChange}
          placeholder={field.placeholder}
          disabled={disabled}
          required={field.required}
          maxLength={field.maxLength}
          rows={field.rows || 4}
          className={inputClasses}
        />
        {renderHelpText()}
        {renderError()}
      </>
    );
  }

  function renderCheckbox() {
    return (
      <div className="flex items-start">
        <div className="flex items-center h-5">
          <input
            type="checkbox"
            id={field.name}
            name={field.name}
            checked={value || false}
            onChange={handleCheckboxChange}
            disabled={disabled}
            className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
          />
        </div>
        <div className="ml-3 text-sm">
          <label htmlFor={field.name} className="font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
          {field.helpText && (
            <p className="text-gray-500">{field.helpText}</p>
          )}
        </div>
        {hasError && (
          <p className="mt-1 text-sm text-red-600 ml-7">{errorMessage}</p>
        )}
      </div>
    );
  }

  // Main render with grid column classes
  return (
    <div className={field.gridColumn || 'col-span-12'}>
      {renderInput()}
    </div>
  );
};

export default DynamicFormField;
