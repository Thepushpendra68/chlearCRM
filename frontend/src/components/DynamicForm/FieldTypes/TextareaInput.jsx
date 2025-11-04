import { forwardRef } from 'react';

/**
 * TextareaInput - Multiline text field component for dynamic forms
 */
const TextareaInput = forwardRef(({
  field,
  value,
  onChange,
  error,
  disabled = false,
  ...rest
}, ref) => {
  const hasError = !!error;
  const rows = field.rows || 4;

  return (
    <div className={field.gridColumn || 'col-span-12'}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <textarea
        name={field.id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        disabled={disabled}
        maxLength={field.maxLength}
        rows={rows}
        className={`
          mt-1 block w-full rounded-md shadow-sm
          ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          sm:text-sm
        `}
        ref={ref}
        {...rest}
      />
      {field.helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {hasError && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

TextareaInput.displayName = 'TextareaInput';

export default TextareaInput;
