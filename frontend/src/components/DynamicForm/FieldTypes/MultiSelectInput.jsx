import { useMemo } from 'react';

const MultiSelectInput = ({
  field,
  value = [],
  onChange,
  error,
  disabled = false,
  ...rest
}) => {
  const hasError = !!error;
  const options = field.options || [];

  const normalizedValue = useMemo(() => {
    if (Array.isArray(value)) {
      return value;
    }
    if (typeof value === 'string' && value.length > 0) {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
    return [];
  }, [value]);

  const handleChange = (event) => {
    const selected = Array.from(event.target.selectedOptions).map(option => option.value);
    onChange(selected);
  };

  return (
    <div className={field.gridColumn || 'col-span-12'}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        multiple
        name={field.id}
        value={normalizedValue}
        onChange={handleChange}
        disabled={disabled}
        className={`
          mt-1 block w-full rounded-md shadow-sm h-32
          ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          sm:text-sm
        `}
        {...rest}
      >
        {options.map(option => (
          <option key={option.value ?? option.id} value={option.value ?? option.id}>
            {option.label ?? option.name}
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
};

export default MultiSelectInput;

