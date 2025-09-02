import React, { useState, useEffect } from 'react';
import { 
  ChartBarIcon, 
  DocumentArrowDownIcon, 
  CalendarIcon,
  UserGroupIcon,
  FunnelIcon,
  ClockIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import Chart from '../components/Reports/Chart';
import ReportBuilder from '../components/Reports/ReportBuilder';
import ReportExport from '../components/Reports/ReportExport';
import { reportService } from '../services/reportService';

const Reports = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reportData, setReportData] = useState({});
  const [showReportBuilder, setShowReportBuilder] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  // Report templates
  const reportTemplates = [
    {
      id: 'lead-performance',
      name: 'Lead Performance',
      description: 'Conversion rates, response times, and lead metrics',
      icon: ChartBarIcon,
      color: 'bg-blue-500',
      endpoint: 'lead-performance'
    },
    {
      id: 'conversion-funnel',
      name: 'Conversion Funnel',
      description: 'Pipeline stage progression and conversion rates',
      icon: FunnelIcon,
      color: 'bg-green-500',
      endpoint: 'conversion-funnel'
    },
    {
      id: 'activity-summary',
      name: 'Activity Summary',
      description: 'Communication tracking and activity analysis',
      icon: ClockIcon,
      color: 'bg-purple-500',
      endpoint: 'activity-summary'
    },
    {
      id: 'team-performance',
      name: 'Team Performance',
      description: 'Individual and team performance metrics',
      icon: UserGroupIcon,
      color: 'bg-orange-500',
      endpoint: 'team-performance'
    },
    {
      id: 'pipeline-health',
      name: 'Pipeline Health',
      description: 'Pipeline analysis with bottlenecks and velocity',
      icon: ChartBarIcon,
      color: 'bg-red-500',
      endpoint: 'pipeline-health'
    }
  ];

  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverviewData();
    }
  }, [activeTab]);

  const loadOverviewData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const [leadPerformance, conversionFunnel, activitySummary] = await Promise.all([
        reportService.getLeadPerformance(),
        reportService.getConversionFunnel(),
        reportService.getActivitySummary()
      ]);

      setReportData({
        leadPerformance: leadPerformance.data,
        conversionFunnel: conversionFunnel.data,
        activitySummary: activitySummary.data
      });
    } catch (err) {
      setError('Failed to load report data');
      console.error('Error loading reports:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadReport = async (reportType) => {
    setLoading(true);
    setError(null);
    
    try {
      let data;
      switch (reportType) {
        case 'lead-performance':
          data = await reportService.getLeadPerformance();
          break;
        case 'conversion-funnel':
          data = await reportService.getConversionFunnel();
          break;
        case 'activity-summary':
          data = await reportService.getActivitySummary();
          break;
        case 'team-performance':
          data = await reportService.getTeamPerformance();
          break;
        case 'pipeline-health':
          data = await reportService.getPipelineHealth();
          break;
        default:
          throw new Error('Unknown report type');
      }
      
      setReportData(prev => ({
        ...prev,
        [reportType]: data.data
      }));
    } catch (err) {
      setError(`Failed to load ${reportType} report`);
      console.error('Error loading report:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = (reportType) => {
    setSelectedReport(reportType);
    setShowExportModal(true);
  };

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <ChartBarIcon className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Leads</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.leadPerformance?.leadMetrics?.total_leads || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FunnelIcon className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.conversionFunnel?.overallConversionRate || 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <ClockIcon className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.leadPerformance?.responseTime?.avg_response_time_hours?.toFixed(1) || 0}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <UserGroupIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Activities</p>
              <p className="text-2xl font-semibold text-gray-900">
                {reportData.activitySummary?.activitySummary?.reduce((sum, activity) => sum + activity.total_activities, 0) || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Report Templates */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Standard Reports</h3>
          <p className="text-sm text-gray-600">Choose from our pre-built report templates</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {reportTemplates.map((template) => {
              const IconComponent = template.icon;
              return (
                <div
                  key={template.id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    setActiveTab(template.id);
                    loadReport(template.id);
                  }}
                >
                  <div className="flex items-center mb-4">
                    <div className={`p-3 ${template.color} rounded-lg`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <div className="ml-4">
                      <h4 className="text-lg font-medium text-gray-900">{template.name}</h4>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                  <div className="flex justify-between items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveTab(template.id);
                        loadReport(template.id);
                      }}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Report
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportReport(template.id);
                      }}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <DocumentArrowDownIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );

  const renderReportContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{error}</p>
            </div>
          </div>
        </div>
      );
    }

    const currentData = reportData[activeTab];
    if (!currentData) {
      return (
        <div className="text-center py-12">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
          <p className="mt-1 text-sm text-gray-500">Select a report to view data</p>
        </div>
      );
    }

    return <Chart data={currentData} type={activeTab} />;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
              <p className="text-gray-600 mt-2">Comprehensive insights into your CRM performance</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowReportBuilder(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Custom Report
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            {reportTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setActiveTab(template.id);
                  loadReport(template.id);
                }}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === template.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {template.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'overview' ? renderOverview() : renderReportContent()}
        </div>

        {/* Modals */}
        {showReportBuilder && (
          <ReportBuilder
            onClose={() => setShowReportBuilder(false)}
            onSave={(report) => {
              console.log('Custom report saved:', report);
              setShowReportBuilder(false);
            }}
          />
        )}

        {showExportModal && (
          <ReportExport
            reportType={selectedReport}
            data={reportData[selectedReport]}
            onClose={() => {
              setShowExportModal(false);
              setSelectedReport(null);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Reports;
