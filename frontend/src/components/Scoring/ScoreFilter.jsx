import React from 'react';
import ScoreBadge from './ScoreBadge';

const ScoreFilter = ({ selectedRanges, onChange, className = '' }) => {
  // Predefined score ranges
  const scoreRanges = [
    { label: 'Hot', min: 76, max: 100, color: 'red' },
    { label: 'Warm', min: 51, max: 75, color: 'orange' },
    { label: 'Cold', min: 0, max: 50, color: 'blue' }
  ];

  const handleRangeToggle = (range) => {
    const rangeKey = `${range.min}-${range.max}`;
    const newSelected = { ...selectedRanges };

    if (newSelected[rangeKey]) {
      delete newSelected[rangeKey];
    } else {
      newSelected[rangeKey] = range;
    }

    onChange(newSelected);
  };

  const clearAll = () => {
    onChange({});
  };

  const hasSelections = Object.keys(selectedRanges).length > 0;

  return (
    <div className={`bg-white ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-gray-900">Lead Score</h4>
        {hasSelections && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-600 hover:text-blue-700 font-medium"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {scoreRanges.map((range) => {
          const rangeKey = `${range.min}-${range.max}`;
          const isSelected = !!selectedRanges[rangeKey];

          return (
            <button
              key={rangeKey}
              onClick={() => handleRangeToggle(range)}
              className={`
                w-full flex items-center justify-between p-2 rounded-lg border transition-colors
                ${isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
                }
              `}
            >
              <div className="flex items-center gap-2">
                <div
                  className={`
                    w-4 h-4 rounded border-2 flex items-center justify-center
                    ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}
                  `}
                >
                  {isSelected && (
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-gray-700">
                  {range.label}
                </span>
              </div>
              <ScoreBadge
                score={range.min === 0 ? range.max : range.min}
                size="sm"
                showLabel={false}
              />
            </button>
          );
        })}
      </div>

      {hasSelections && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-600">
            {Object.keys(selectedRanges).length} range(s) selected
          </p>
        </div>
      )}
    </div>
  );
};

export default ScoreFilter;
