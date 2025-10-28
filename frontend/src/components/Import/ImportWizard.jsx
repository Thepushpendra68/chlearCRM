import React, { useState, useRef } from 'react';
import importService from '../../services/importService';

const ImportWizard = ({ isOpen, onClose, onImportComplete, initialStageId }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [importOptions, setImportOptions] = useState({
    duplicatePolicy: 'skip',
    pipelineStageId: initialStageId || null
  });
  const [loading, setLoading] = useState(false);
  const [validationLoading, setValidationLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const [dryRunResult, setDryRunResult] = useState(null);
  const [rowFilter, setRowFilter] = useState('invalid');
  const fileInputRef = useRef(null);

  const steps = [
    { number: 1, title: 'Upload File', description: 'Select CSV or Excel file' },
    { number: 2, title: 'Preview & Map', description: 'Review data and map fields' },
    { number: 3, title: 'Import', description: 'Complete the import process' }
  ];

  const handleFileSelect = async (selectedFile) => {
    setError('');
    setFile(selectedFile);
    setDryRunResult(null);
    setImportResult(null);
    setRowFilter('invalid');

    try {
      // Validate file type
      const fileExt = selectedFile.name.toLowerCase().split('.').pop();
      if (!['csv', 'xlsx', 'xls'].includes(fileExt)) {
        throw new Error('Please select a CSV or Excel file');
      }

      // Get file headers and preview
      if (fileExt === 'csv') {
        const preview = await importService.parseCSVPreview(selectedFile);
        setFilePreview(preview);
        
        // Auto-suggest field mappings
        const suggestions = importService.getSuggestedMappings(preview.headers);
        setFieldMapping(suggestions);
      } else {
        // For Excel files, get headers from server
        const response = await importService.getFileHeaders(selectedFile);
        setFilePreview(response.data);
        
        // Auto-suggest field mappings
        const suggestions = importService.getSuggestedMappings(response.data.headers);
        setFieldMapping(suggestions);
      }

      setCurrentStep(2);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleFieldMappingChange = (csvField, dbField) => {
    setFieldMapping(prev => ({
      ...prev,
      [csvField]: dbField
    }));
    setDryRunResult(null);
    setRowFilter('invalid');
  };

  const getFilteredRows = () => {
    if (!dryRunResult?.rows) {
      return [];
    }

    const filtered = dryRunResult.rows.filter((row) => {
      if (rowFilter === 'invalid') {
        return !row.isValid;
      }
      if (rowFilter === 'valid') {
        return row.isValid;
      }
      if (rowFilter === 'warnings') {
        return Array.isArray(row.warnings) && row.warnings.length > 0;
      }
      return true;
    });

    return filtered.slice(0, 50);
  };

  const getValidationCounts = () => {
    if (!dryRunResult) {
      return { total: 0, valid: 0, invalid: 0, warnings: 0 };
    }

    const stats = dryRunResult.stats || {};
    const total = stats.total ?? (dryRunResult.rows ? dryRunResult.rows.length : 0);
    const valid =
      stats.valid ??
      (dryRunResult.rows ? dryRunResult.rows.filter((row) => row.isValid).length : 0);
    const invalid =
      stats.invalid ??
      (dryRunResult.rows ? dryRunResult.rows.filter((row) => !row.isValid).length : Math.max(total - valid, 0));
    const warnings =
      dryRunResult.validation_warnings?.length ??
      (dryRunResult.rows
        ? dryRunResult.rows.filter((row) => Array.isArray(row.warnings) && row.warnings.length > 0).length
        : 0);

    return { total, valid, invalid, warnings };
  };

  const handleDryRun = async () => {
    if (!file) {
      setError('Please select a file before running validation');
      return;
    }

    setValidationLoading(true);
    setError('');

    try {
      const result = await importService.dryRunLeads(
        file,
        fieldMapping,
        {
          duplicate_policy: importOptions.duplicatePolicy,
          pipeline_stage_id: importOptions.pipelineStageId
        }
      );

      setDryRunResult(result.data);
      setImportResult(null);
      if (result.data?.stats) {
        setRowFilter(result.data.stats.invalid > 0 ? 'invalid' : 'valid');
      }
    } catch (error) {
      setDryRunResult(null);
      setError(error.message);
    } finally {
      setValidationLoading(false);
    }
  };

  const handleImport = async () => {
    if (!dryRunResult) {
      setError('Please run validation before importing your leads.');
      return;
    }

    if (dryRunResult?.stats?.valid === 0) {
      setError('No valid rows to import. Please fix the errors highlighted in the validation results.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await importService.importLeads(
        file,
        fieldMapping,
        {
          duplicate_policy: importOptions.duplicatePolicy,
          pipeline_stage_id: importOptions.pipelineStageId
        }
      );
      setImportResult(result.data);
      setCurrentStep(3);
      
      if (onImportComplete) {
        onImportComplete(result.data);
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setCurrentStep(1);
    setFile(null);
    setFilePreview(null);
    setFieldMapping({});
    setImportOptions({
      duplicatePolicy: 'skip',
      pipelineStageId: initialStageId || null
    });
    setError('');
    setImportResult(null);
    setDryRunResult(null);
    setRowFilter('invalid');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const validationCounts = getValidationCounts();
  const previewRows = getFilteredRows();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Import Leads</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <div key={step.number} className="flex items-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                currentStep >= step.number
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-gray-300 text-gray-500'
              }`}>
                {currentStep > step.number ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  step.number
                )}
              </div>
              <div className="ml-3">
                <p className={`text-sm font-medium ${
                  currentStep >= step.number ? 'text-blue-600' : 'text-gray-500'
                }`}>
                  {step.title}
                </p>
                <p className="text-xs text-gray-500">{step.description}</p>
              </div>
              {index < steps.length - 1 && (
                <div className={`w-16 h-0.5 mx-4 ${
                  currentStep > step.number ? 'bg-blue-600' : 'bg-gray-300'
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <div className="ml-3">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Step Content */}
        {currentStep === 1 && (
          <div className="text-center">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="mt-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="mt-2 block text-sm font-medium text-gray-900">
                    Drop your file here, or click to browse
                  </span>
                  <span className="mt-1 block text-sm text-gray-500">
                    CSV and Excel files up to 10MB
                  </span>
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  className="sr-only"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => e.target.files[0] && handleFileSelect(e.target.files[0])}
                />
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => importService.getImportTemplate()}
                className="text-blue-600 hover:text-blue-500 text-sm font-medium"
              >
                Download import template
              </button>
            </div>
          </div>
        )}

        {currentStep === 2 && filePreview && (
          <div className="space-y-6">
            {/* File Info */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-2">File Information</h3>
              <p className="text-sm text-gray-600">
                <strong>File:</strong> {file.name} ({file.size} bytes)
              </p>
              <p className="text-sm text-gray-600">
                <strong>Rows:</strong> {filePreview.data?.length || 'Unknown'}
              </p>
            </div>

            {/* Field Mapping */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Field Mapping</h3>
              <div className="space-y-3">
                {filePreview.headers?.map((header) => (
                  <div key={header} className="flex items-center space-x-4">
                    <div className="w-1/3">
                      <label className="block text-sm font-medium text-gray-700">
                        {header}
                      </label>
                    </div>
                    <div className="w-1/3">
                      <select
                        value={fieldMapping[header] || ''}
                        onChange={(e) => handleFieldMappingChange(header, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Skip this field</option>
                        <option value="first_name">First Name</option>
                        <option value="last_name">Last Name</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="company">Company</option>
                        <option value="job_title">Job Title</option>
                        <option value="lead_source">Lead Source</option>
                        <option value="status">Status</option>
                        <option value="notes">Notes</option>
                        <option value="deal_value">Deal Value</option>
                        <option value="probability">Probability</option>
                        <option value="expected_close_date">Expected Close Date</option>
                        <option value="priority">Priority</option>
                      </select>
                    </div>
                    <div className="w-1/3">
                      <span className="text-sm text-gray-500">
                        {fieldMapping[header] ? `→ ${fieldMapping[header]}` : 'Not mapped'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Preview */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Data Preview</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {filePreview.headers?.map((header) => (
                        <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filePreview.data?.slice(0, 5).map((row, index) => (
                      <tr key={index}>
                        {filePreview.headers?.map((header) => (
                          <td key={header} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {row[header] || '-'}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Validation Controls */}
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Validation</h3>
                  <p className="text-sm text-gray-600">
                    Run a dry run to confirm mappings and surface issues before importing.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDryRun}
                  disabled={validationLoading}
                  className="inline-flex items-center justify-center px-4 py-2 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  {validationLoading ? 'Validating...' : dryRunResult ? 'Re-run Validation' : 'Run Validation'}
                </button>
              </div>

              {dryRunResult && (
                <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-white">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-gray-50 p-4">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Total Rows</p>
                      <p className="mt-2 text-2xl font-semibold text-gray-900">{validationCounts.total}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-4">
                      <p className="text-xs font-semibold text-green-700 uppercase tracking-wide">Ready to Import</p>
                      <p className="mt-2 text-2xl font-semibold text-green-700">{validationCounts.valid}</p>
                    </div>
                    <div className="rounded-lg bg-red-50 p-4">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide">Needs Attention</p>
                      <p className="mt-2 text-2xl font-semibold text-red-700">{validationCounts.invalid}</p>
                    </div>
                  </div>

                  {validationCounts.warnings > 0 && (
                    <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
                      {validationCounts.warnings} row{validationCounts.warnings === 1 ? '' : 's'} include warnings. Review before importing.
                    </div>
                  )}

                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      {[
                        { key: 'invalid', label: `Invalid (${validationCounts.invalid})` },
                        { key: 'warnings', label: `Warnings (${validationCounts.warnings})` },
                        { key: 'valid', label: `Valid (${validationCounts.valid})` },
                        { key: 'all', label: `All (${validationCounts.total})` }
                      ].map((filter) => (
                        <button
                          key={filter.key}
                          type="button"
                          onClick={() => setRowFilter(filter.key)}
                          className={`px-3 py-1.5 text-sm rounded-md border ${
                            rowFilter === filter.key
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>

                    <div className="overflow-x-auto border border-gray-200 rounded-lg">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Row</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Errors</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warnings</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {previewRows.length === 0 && (
                            <tr>
                              <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                                No rows match the selected filter. Re-run validation if you updated mappings.
                              </td>
                            </tr>
                          )}
                          {previewRows.map((row) => (
                            <tr key={row.rowNumber}>
                              <td className="px-4 py-3 text-sm text-gray-900">Row {row.rowNumber}</td>
                              <td className="px-4 py-3 text-sm">
                                {row.isValid ? (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-green-700 bg-green-100">
                                    Valid
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-red-700 bg-red-100">
                                    Invalid
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row.errors && row.errors.length > 0 ? (
                                  <ul className="list-disc list-inside text-red-600 space-y-1 text-xs">
                                    {row.errors.map((err, idx) => (
                                      <li key={idx}>{err}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-xs text-gray-500">None</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-sm">
                                {row.warnings && row.warnings.length > 0 ? (
                                  <ul className="list-disc list-inside text-yellow-600 space-y-1 text-xs">
                                    {row.warnings.map((warning, idx) => (
                                      <li key={idx}>{warning}</li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span className="text-xs text-gray-500">None</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Showing up to {previewRows.length} rows. Re-run validation to refresh after editing mappings.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Import Options */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Import Options</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Duplicate handling</label>
                  <select
                    value={importOptions.duplicatePolicy}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, duplicatePolicy: e.target.value }))}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="skip">Skip duplicates (recommended)</option>
                    <option value="update">Update existing leads</option>
                  </select>
                  <p className="mt-1 text-xs text-gray-500">
                    Determine how to handle rows when an email already exists in your workspace.
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Pipeline stage (optional)</label>
                  <input
                    type="text"
                    value={importOptions.pipelineStageId || ''}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, pipelineStageId: e.target.value || null }))}
                    placeholder="Pipeline stage ID"
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Provide a pipeline stage ID to assign all imported leads. Leave blank to keep default stage.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && importResult && (
          <div className="text-center">
            <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
              importResult.failed_imports > 0 ? 'bg-yellow-100' : 'bg-green-100'
            }`}>
              <svg className={`h-6 w-6 ${
                importResult.failed_imports > 0 ? 'text-yellow-600' : 'text-green-600'
              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Import Completed!</h3>
            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
                <p className="font-medium text-gray-800">Total Rows</p>
                <p className="mt-1 text-xl font-semibold text-gray-900">
                  {importResult.stats?.total ?? importResult.total_records}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 text-sm text-green-700">
                <p className="font-medium">Imported Successfully</p>
                <p className="mt-1 text-xl font-semibold">
                  {importResult.successful_imports}
                </p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                <p className="font-medium">Failed or Skipped</p>
                <p className="mt-1 text-xl font-semibold">
                  {importResult.failed_imports}
                </p>
              </div>
            </div>

            {importResult.validation_warnings && importResult.validation_warnings.length > 0 && (
              <div className="mt-6 text-left">
                <h4 className="text-sm font-semibold text-yellow-800 mb-3">Warnings:</h4>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {importResult.validation_warnings.map((warning, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-yellow-900 mb-1">
                        Row {warning.row}:
                      </p>
                      <ul className="list-disc list-inside text-sm text-yellow-800 space-y-1">
                        {warning.warnings.map((warn, warnIndex) => (
                          <li key={warnIndex}>{warn}</li>
                        ))}
                      </ul>
                      {warning.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-yellow-700 cursor-pointer hover:text-yellow-900">
                            Show data
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border border-yellow-200 overflow-x-auto">
                            {JSON.stringify(warning.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Validation Errors */}
            {importResult.validation_errors && importResult.validation_errors.length > 0 && (
              <div className="mt-6 text-left">
                <h4 className="text-sm font-semibold text-red-800 mb-3">Validation Errors:</h4>
                <div className="max-h-64 overflow-y-auto space-y-3">
                  {importResult.validation_errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm font-medium text-red-900 mb-1">
                        Row {error.row}:
                      </p>
                      <ul className="list-disc list-inside text-sm text-red-800 space-y-1">
                        {error.errors.map((err, errIndex) => (
                          <li key={errIndex}>{err}</li>
                        ))}
                      </ul>
                      {error.data && (
                        <details className="mt-2">
                          <summary className="text-xs text-red-700 cursor-pointer hover:text-red-900">
                            Show data
                          </summary>
                          <pre className="mt-2 text-xs bg-white p-2 rounded border border-red-200 overflow-x-auto">
                            {JSON.stringify(error.data, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Import Errors */}
            {importResult.errors && importResult.errors.length > 0 && (
              <div className="mt-6 text-left">
                <h4 className="text-sm font-semibold text-red-800 mb-3">Import Errors:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {importResult.errors.map((error, index) => (
                    <div key={index} className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <p className="text-sm text-red-800">
                        {error.batch && <strong>Batch {error.batch}: </strong>}
                        {error.error || JSON.stringify(error)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-between pt-6 border-t mt-6">
          <button
            onClick={currentStep === 1 ? handleClose : () => setCurrentStep(currentStep - 1)}
            className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            {currentStep === 1 ? 'Cancel' : 'Back'}
          </button>
          
          {currentStep === 2 && (
            <button
              onClick={handleImport}
              disabled={
                loading ||
                validationLoading ||
                !dryRunResult ||
                (dryRunResult?.stats?.valid ?? 0) === 0
              }
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              title={
                !dryRunResult
                  ? 'Run validation to enable importing.'
                  : (dryRunResult?.stats?.valid ?? 0) === 0
                    ? 'Fix validation errors before importing.'
                    : undefined
              }
            >
              {loading ? 'Importing...' : 'Import Valid Rows'}
            </button>
          )}
          
          {currentStep === 3 && (
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImportWizard;
