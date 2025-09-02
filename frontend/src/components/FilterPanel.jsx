import { useState } from 'react';
import { FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

const FilterPanel = ({ 
  filters = {}, 
  onFiltersChange, 
  filterOptions = {},
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState(filters);

  const handleFilterChange = (key, value) => {
    const newFilters = {
      ...localFilters,
      [key]: value === '' ? undefined : value
    };
    setLocalFilters(newFilters);
  };

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = Object.values(localFilters).some(value => 
    value !== undefined && value !== ''
  );

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`btn-secondary flex items-center space-x-2 ${
          hasActiveFilters ? 'bg-primary-100 text-primary-700 border-primary-300' : ''
        }`}
      >
        <FunnelIcon className="h-4 w-4" />
        <span>Filters</span>
        {hasActiveFilters && (
          <span className="bg-primary-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {Object.values(localFilters).filter(v => v !== undefined && v !== '').length}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Status Filter */}
              {filterOptions.status && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={localFilters.status || ''}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                    className="input"
                  >
                    <option value="">All Statuses</option>
                    {filterOptions.status.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Source Filter */}
              {filterOptions.source && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Source
                  </label>
                  <select
                    value={localFilters.source || ''}
                    onChange={(e) => handleFilterChange('source', e.target.value)}
                    className="input"
                  >
                    <option value="">All Sources</option>
                    {filterOptions.source.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Role Filter */}
              {filterOptions.role && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Role
                  </label>
                  <select
                    value={localFilters.role || ''}
                    onChange={(e) => handleFilterChange('role', e.target.value)}
                    className="input"
                  >
                    <option value="">All Roles</option>
                    {filterOptions.role.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Active Status Filter */}
              {filterOptions.is_active !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status
                  </label>
                  <select
                    value={localFilters.is_active || ''}
                    onChange={(e) => handleFilterChange('is_active', e.target.value)}
                    className="input"
                  >
                    <option value="">All Users</option>
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              )}

              {/* Assigned To Filter */}
              {filterOptions.assigned_to && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assigned To
                  </label>
                  <select
                    value={localFilters.assigned_to || ''}
                    onChange={(e) => handleFilterChange('assigned_to', e.target.value)}
                    className="input"
                  >
                    <option value="">All Users</option>
                    {filterOptions.assigned_to.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Date Range Filter */}
              {filterOptions.dateRange && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={localFilters.date_from || ''}
                      onChange={(e) => handleFilterChange('date_from', e.target.value)}
                      className="input"
                      placeholder="From"
                    />
                    <input
                      type="date"
                      value={localFilters.date_to || ''}
                      onChange={(e) => handleFilterChange('date_to', e.target.value)}
                      className="input"
                      placeholder="To"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <button
                onClick={handleClearFilters}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Clear All
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyFilters}
                  className="btn-primary"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
