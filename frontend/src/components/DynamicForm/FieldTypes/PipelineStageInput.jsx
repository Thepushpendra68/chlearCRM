import { forwardRef, useState, useEffect } from 'react';
import pipelineService from '../../../services/pipelineService';

/**
 * PipelineStageInput - Pipeline stage selection field component
 * Fetches and displays available pipeline stages
 */
const PipelineStageInput = forwardRef(({
  field,
  value,
  onChange,
  error,
  disabled = false,
  ...rest
}, ref) => {
  const hasError = !!error;
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStages = async () => {
      try {
        setLoading(true);
        const response = await pipelineService.getStages();
        const stageData = response.data || response;
        setStages(Array.isArray(stageData) ? stageData : []);
      } catch (err) {
        console.error('Failed to load pipeline stages:', err);
        setStages([]);
      } finally {
        setLoading(false);
      }
    };

    loadStages();
  }, []);

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
        disabled={disabled || loading}
        className={`
          mt-1 block w-full rounded-md shadow-sm
          ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          sm:text-sm
        `}
        ref={ref}
        {...rest}
      >
        <option value="">{loading ? 'Loading stages...' : (field.placeholder || 'Select a stage')}</option>
        {stages.map(stage => (
          <option key={stage.id} value={stage.id}>
            {stage.name}
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

PipelineStageInput.displayName = 'PipelineStageInput';

export default PipelineStageInput;
