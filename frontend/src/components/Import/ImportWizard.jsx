import React, { useState, useRef } from 'react';
import importService from '../../services/importService';

const ImportWizard = ({ isOpen, onClose, onImportComplete }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fieldMapping, setFieldMapping] = useState({});
  const [importOptions, setImportOptions] = useState({
    skipDuplicates: true,
    updateExisting: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [importResult, setImportResult] = useState(null);
  const fileInputRef = useRef(null);

  const steps = [
    { number: 1, title: 'Upload File', description: 'Select CSV or Excel file' },
    { number: 2, title: 'Preview & Map', description: 'Review data and map fields' },
    { number: 3, title: 'Import', description: 'Complete the import process' }
  ];

  const handleFileSelect = async (selectedFile) => {
    setError('');
    setFile(selectedFile);

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
  };

  const handleImport = async () => {
    setLoading(true);
    setError('');

    try {
      const result = await importService.importLeads(file, fieldMapping, importOptions);
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
      skipDuplicates: true,
      updateExisting: false
    });
    setError('');
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

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
                        <option value="name">Name</option>
                        <option value="email">Email</option>
                        <option value="phone">Phone</option>
                        <option value="company">Company</option>
                        <option value="position">Position</option>
                        <option value="source">Source</option>
                        <option value="status">Status</option>
                        <option value="notes">Notes</option>
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

            {/* Import Options */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Import Options</h3>
              <div className="space-y-3">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.skipDuplicates}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, skipDuplicates: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Skip duplicate emails</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={importOptions.updateExisting}
                    onChange={(e) => setImportOptions(prev => ({ ...prev, updateExisting: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-700">Update existing leads</span>
                </label>
              </div>
            </div>
          </div>
        )}

        {currentStep === 3 && importResult && (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">Import Completed!</h3>
            <div className="mt-4 bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">
                <strong>Total Records:</strong> {importResult.total_records}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Successful:</strong> {importResult.successful_imports}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Failed:</strong> {importResult.failed_imports}
              </p>
            </div>
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
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Importing...' : 'Import Leads'}
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
