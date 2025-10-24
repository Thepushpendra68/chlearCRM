import { forwardRef } from 'react';
import { usePicklists } from '../../../context/PicklistContext';

/**
 * PicklistInput - Dynamic picklist field component
 * Fetches options from the picklist system based on field configuration
 */
const PicklistInput = forwardRef(({
  field,
  value,
  onChange,
  error,
  disabled = false,
  ...rest
}, ref) => {
  const hasError = !!error;
  const { leadSourcesDisplay, leadStatusesDisplay, loading: picklistsLoading } = usePicklists();

  // Determine which picklist to use based on field configuration
  let options = [];
  if (field.picklistType === 'source') {
    options = leadSourcesDisplay;
  } else if (field.picklistType === 'status') {
    options = leadStatusesDisplay;
  } else if (field.options) {
    // Fallback to field.options if provided
    options = field.options;
  }

  return (
    <div className={field.gridColumn || 'col-span-12'}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={field.id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || picklistsLoading}
        className={`
          mt-1 block w-full rounded-md shadow-sm
          ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled || picklistsLoading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          sm:text-sm
        `}
        ref={ref}
        {...rest}
      >
        <option value="">{field.placeholder || 'Select an option'}</option>
        {options.map(option => (
          <option key={option.id} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {field.helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {hasError && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

PicklistInput.displayName = 'PicklistInput';

export default PicklistInput;
