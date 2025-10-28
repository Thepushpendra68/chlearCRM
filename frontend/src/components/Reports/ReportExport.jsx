import React, { useState } from 'react';
import { 
  DocumentArrowDownIcon, 
  XMarkIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { reportService } from '../../services/reportService';

const ReportExport = ({ reportType, data, onClose }) => {
  const [exportFormat, setExportFormat] = useState('csv');
  const [filename, setFilename] = useState(`${reportType}_${new Date().toISOString().split('T')[0]}`);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null);
  const [error, setError] = useState(null);

  const exportFormats = [
    {
      id: 'csv',
      name: 'CSV',
      description: 'Comma-separated values file',
      icon: '📄',
      extension: '.csv'
    },
    {
      id: 'excel',
      name: 'Excel',
      description: 'Microsoft Excel spreadsheet',
      icon: '📊',
      extension: '.xlsx'
    },
    {
      id: 'pdf',
      name: 'PDF',
      description: 'Portable Document Format',
      icon: '📋',
      extension: '.pdf'
    }
  ];

  const handleExport = async () => {
    if (!data) {
      setError('No data available to export');
      return;
    }

    setIsExporting(true);
    setError(null);
    setExportStatus(null);

    try {
      const exportConfig = {
        type: exportFormat,
        reportType: reportType,
        data: data,
        format: exportFormat,
        filename: filename
      };

      const result = await reportService.exportReport(exportConfig);
      
      setExportStatus({
        success: true,
        message: `Report exported successfully as ${result.filename}`,
        filename: result.filename
      });

      // Auto-close after 3 seconds
      setTimeout(() => {
        onClose();
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to export report');
      setExportStatus({
        success: false,
        message: 'Export failed'
      });
    } finally {
      setIsExporting(false);
    }
  };

  const getReportTypeDisplayName = (type) => {
    const typeMap = {
      'lead-performance': 'Lead Performance',
      'conversion-funnel': 'Conversion Funnel',
      'activity-summary': 'Activity Summary',
      'team-performance': 'Team Performance',
      'pipeline-health': 'Pipeline Health'
    };
    return typeMap[type] || type;
  };

  const getDataPreview = () => {
    if (!data) return null;

    switch (reportType) {
      case 'lead-performance':
        return {
          rows: data.conversionData?.length || 0,
          columns: ['Stage Name', 'Lead Count', 'Average Probability', 'Total Value']
        };
      case 'conversion-funnel':
        return {
          rows: data.funnelData?.length || 0,
          columns: ['Stage Name', 'Lead Count', 'Conversion Rate']
        };
      case 'activity-summary':
        return {
          rows: data.activitySummary?.length || 0,
          columns: ['Activity Type', 'Total Activities', 'Completed Activities', 'Completion Rate']
        };
      case 'team-performance':
        return {
          rows: data.userPerformance?.length || 0,
          columns: ['User', 'Total Leads', 'Won Leads', 'Win Rate', 'Total Value']
        };
      case 'pipeline-health':
        return {
          rows: data.stageHealth?.length || 0,
          columns: ['Stage Name', 'Lead Count', 'Avg Days in Stage', 'Stale Leads', 'Health Status']
        };
      default:
        return {
          rows: 0,
          columns: []
        };
    }
  };

  const preview = getDataPreview();

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <DocumentArrowDownIcon className="h-6 w-6 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Export Report</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Report Info */}
        <div className="mb-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              {getReportTypeDisplayName(reportType)} Report
            </h4>
            <div className="text-sm text-gray-600">
              <p>Data preview: {preview.rows} rows, {preview.columns.length} columns</p>
              <p className="mt-1">Columns: {preview.columns.join(', ')}</p>
            </div>
          </div>
        </div>

        {/* Export Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Export Format
          </label>
          <div className="space-y-2">
            {exportFormats.map((format) => (
              <label key={format.id} className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="exportFormat"
                  value={format.id}
                  checked={exportFormat === format.id}
                  onChange={(e) => setExportFormat(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <div className="ml-3 flex-1">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{format.icon}</span>
                    <span className="text-sm font-medium text-gray-900">{format.name}</span>
                  </div>
                  <p className="text-xs text-gray-500">{format.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Filename Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <div className="flex">
            <input
              type="text"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter filename"
            />
            <span className="inline-flex items-center px-3 py-2 border border-l-0 border-gray-300 rounded-r-md bg-gray-50 text-gray-500 text-sm">
              {exportFormats.find(f => f.id === exportFormat)?.extension}
            </span>
          </div>
        </div>

        {/* Export Status */}
        {exportStatus && (
          <div className={`mb-4 p-4 rounded-lg ${
            exportStatus.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center">
              {exportStatus.success ? (
                <CheckCircleIcon className="h-5 w-5 text-green-600 mr-2" />
              ) : (
                <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              )}
              <p className={`text-sm font-medium ${
                exportStatus.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {exportStatus.message}
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-600 mr-2" />
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isExporting}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting || !data}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Exporting...
              </>
            ) : (
              <>
                <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
                Export Report
              </>
            )}
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-4 text-xs text-gray-500">
          <p>• CSV files can be opened in Excel, Google Sheets, or any text editor</p>
          <p>• Excel files preserve formatting and can include multiple sheets</p>
          <p>• PDF files are optimized for printing and sharing</p>
        </div>
      </div>
    </div>
  );
};

export default ReportExport;
