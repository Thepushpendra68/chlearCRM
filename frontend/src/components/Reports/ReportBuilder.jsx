import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon, 
  PlusIcon, 
  TrashIcon,
  EyeIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { reportService } from '../../services/reportService';

const ReportBuilder = ({ onClose, onSave }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportOptions, setReportOptions] = useState(null);
  
  const [reportConfig, setReportConfig] = useState({
    name: '',
    description: '',
    reportType: 'leads',
    metrics: [],
    dimensions: [],
    filters: {},
    dateRange: {
      from: '',
      to: ''
    },
    groupBy: '',
    sortBy: ''
  });

  const [previewData, setPreviewData] = useState(null);

  useEffect(() => {
    loadReportOptions();
  }, []);

  const loadReportOptions = async () => {
    try {
      const options = await reportService.getReportOptions();
      setReportOptions(options.data);
    } catch (err) {
      setError('Failed to load report options');
      console.error('Error loading report options:', err);
    }
  };

  const handleMetricToggle = (metric) => {
    setReportConfig(prev => ({
      ...prev,
      metrics: prev.metrics.includes(metric.id)
        ? prev.metrics.filter(id => id !== metric.id)
        : [...prev.metrics, metric.id]
    }));
  };

  const handleDimensionToggle = (dimension) => {
    setReportConfig(prev => ({
      ...prev,
      dimensions: prev.dimensions.includes(dimension.id)
        ? prev.dimensions.filter(id => id !== dimension.id)
        : [...prev.dimensions, dimension.id]
    }));
  };

  const handleFilterChange = (filterId, value) => {
    setReportConfig(prev => ({
      ...prev,
      filters: {
        ...prev.filters,
        [filterId]: value
      }
    }));
  };

  const generatePreview = async () => {
    if (reportConfig.metrics.length === 0) {
      setError('Please select at least one metric');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const customReportConfig = {
        reportType: reportConfig.reportType,
        metrics: reportConfig.metrics,
        dimensions: reportConfig.dimensions,
        filters: reportConfig.filters,
        dateRange: reportConfig.dateRange,
        groupBy: reportConfig.groupBy,
        sortBy: reportConfig.sortBy
      };

      const result = await reportService.generateCustomReport(customReportConfig);
      setPreviewData(result.data);
      setCurrentStep(3);
    } catch (err) {
      setError('Failed to generate preview');
      console.error('Error generating preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveReport = () => {
    if (!reportConfig.name.trim()) {
      setError('Please enter a report name');
      return;
    }

    const savedReport = {
      ...reportConfig,
      id: `custom_${Date.now()}`,
      createdAt: new Date().toISOString(),
      data: previewData
    };

    onSave(savedReport);
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Configuration</h3>
        
        {/* Report Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Name *
          </label>
          <input
            type="text"
            value={reportConfig.name}
            onChange={(e) => setReportConfig(prev => ({ ...prev, name: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter report name"
          />
        </div>

        {/* Report Description */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={reportConfig.description}
            onChange={(e) => setReportConfig(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            placeholder="Enter report description"
          />
        </div>

        {/* Report Type */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Report Type
          </label>
          <select
            value={reportConfig.reportType}
            onChange={(e) => setReportConfig(prev => ({ ...prev, reportType: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="leads">Leads</option>
            <option value="activities">Activities</option>
            <option value="pipeline">Pipeline</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Select Metrics & Dimensions</h3>
        
        {/* Metrics Selection */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Metrics *</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportOptions?.metrics?.map((metric) => (
              <label key={metric.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={reportConfig.metrics.includes(metric.id)}
                  onChange={() => handleMetricToggle(metric)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{metric.name}</div>
                  <div className="text-xs text-gray-500">{metric.type}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Dimensions Selection */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Dimensions</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {reportOptions?.dimensions?.map((dimension) => (
              <label key={dimension.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={reportConfig.dimensions.includes(dimension.id)}
                  onChange={() => handleDimensionToggle(dimension)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="ml-3">
                  <div className="text-sm font-medium text-gray-900">{dimension.name}</div>
                  <div className="text-xs text-gray-500">{dimension.type}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-800 mb-3">Filters</h4>
          <div className="space-y-4">
            {reportOptions?.filters?.map((filter) => (
              <div key={filter.id} className="flex items-center space-x-4">
                <label className="w-32 text-sm font-medium text-gray-700">
                  {filter.name}
                </label>
                {filter.type === 'date_range' ? (
                  <div className="flex space-x-2">
                    <input
                      type="date"
                      value={reportConfig.dateRange.from}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, from: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input
                      type="date"
                      value={reportConfig.dateRange.to}
                      onChange={(e) => setReportConfig(prev => ({
                        ...prev,
                        dateRange: { ...prev.dateRange, to: e.target.value }
                      }))}
                      className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={reportConfig.filters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Enter ${filter.name.toLowerCase()}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Group By */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Group By
          </label>
          <select
            value={reportConfig.groupBy}
            onChange={(e) => setReportConfig(prev => ({ ...prev, groupBy: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">No grouping</option>
            {reportConfig.dimensions.map(dimId => {
              const dimension = reportOptions?.dimensions?.find(d => d.id === dimId);
              return dimension ? (
                <option key={dimId} value={dimId}>{dimension.name}</option>
              ) : null;
            })}
          </select>
        </div>

        {/* Sort By */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort By
          </label>
          <select
            value={reportConfig.sortBy}
            onChange={(e) => setReportConfig(prev => ({ ...prev, sortBy: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Default sorting</option>
            {reportConfig.metrics.map(metricId => {
              const metric = reportOptions?.metrics?.find(m => m.id === metricId);
              return metric ? (
                <option key={metricId} value={metricId}>{metric.name}</option>
              ) : null;
            })}
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Report Preview</h3>
        
        {previewData && previewData.data && previewData.data.length > 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h4 className="text-md font-medium text-gray-900">
                {reportConfig.name} - Preview ({previewData.data.length} rows)
              </h4>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {Object.keys(previewData.data[0]).map((header, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {previewData.data.slice(0, 10).map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {previewData.data.length > 10 && (
              <div className="px-6 py-3 bg-gray-50 text-sm text-gray-500">
                Showing first 10 rows of {previewData.data.length} total rows
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <DocumentTextIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
            <p className="mt-1 text-sm text-gray-500">Try adjusting your filters or date range</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
              currentStep >= step
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-gray-300 text-gray-500'
            }`}>
              {step}
            </div>
            {step < 3 && (
              <div className={`w-16 h-0.5 ${
                currentStep > step ? 'bg-blue-600' : 'bg-gray-300'
              }`} />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h2 className="text-xl font-semibold text-gray-900">Custom Report Builder</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Step Indicator */}
        {renderStepIndicator()}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
        )}

        {/* Content */}
        <div className="mb-6">
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <div>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Previous
              </button>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Cancel
            </button>
            
            {currentStep < 3 ? (
              <button
                onClick={() => {
                  if (currentStep === 2) {
                    generatePreview();
                  } else {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                disabled={loading || (currentStep === 1 && !reportConfig.name.trim())}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Generating...
                  </>
                ) : currentStep === 2 ? (
                  <>
                    <EyeIcon className="h-4 w-4 mr-2" />
                    Generate Preview
                  </>
                ) : (
                  'Next'
                )}
              </button>
            ) : (
              <button
                onClick={saveReport}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Save Report
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportBuilder;
