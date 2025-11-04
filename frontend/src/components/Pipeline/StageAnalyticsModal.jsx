import React, { useState, useEffect } from 'react';
import pipelineService from '../../services/pipelineService';

const StageAnalyticsModal = ({ isOpen, onClose, stageId, leads, stage }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && stageId) {
      fetchStageAnalytics();
    }
  }, [isOpen, stageId]);

  const fetchStageAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // For now, we'll calculate basic analytics from the leads data
      // In a real implementation, you might want to call an API endpoint
      const stageLeads = leads || [];
      
      const analyticsData = {
        totalLeads: stageLeads.length,
        averageValue: stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0) / stageLeads.length || 0,
        totalValue: stageLeads.reduce((sum, lead) => sum + (lead.estimated_value || 0), 0),
        conversionRate: stage?.is_won ? 100 : 0,
        avgDaysInStage: calculateAvgDaysInStage(stageLeads),
        leadSources: getLeadSources(stageLeads),
        recentActivity: getRecentActivity(stageLeads)
      };
      
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Error fetching stage analytics:', err);
      setError('Failed to load stage analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgDaysInStage = (leads) => {
    if (!leads.length) return 0;
    
    const now = new Date();
    const totalDays = leads.reduce((sum, lead) => {
      const stageDate = new Date(lead.updated_at || lead.created_at);
      const daysDiff = Math.floor((now - stageDate) / (1000 * 60 * 60 * 24));
      return sum + daysDiff;
    }, 0);
    
    return Math.round(totalDays / leads.length);
  };

  const getLeadSources = (leads) => {
    const sources = {};
    leads.forEach(lead => {
      const source = lead.source || 'Unknown';
      sources[source] = (sources[source] || 0) + 1;
    });
    
    return Object.entries(sources)
      .map(([source, count]) => ({ source, count }))
      .sort((a, b) => b.count - a.count);
  };

  const getRecentActivity = (leads) => {
    return leads
      .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
      .slice(0, 5)
      .map(lead => ({
        id: lead.id,
        name: lead.name || lead.company_name || 'Unknown Lead',
        action: 'Updated',
        date: new Date(lead.updated_at).toLocaleDateString()
      }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Stage Analytics - {stage?.name || 'Unknown Stage'}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Performance metrics and insights for this pipeline stage
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{error}</p>
            </div>
          ) : analytics ? (
            <div className="space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-blue-600">{analytics.totalLeads}</div>
                  <div className="text-sm text-blue-800">Total Leads</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-green-600">
                    ${analytics.totalValue.toLocaleString()}
                  </div>
                  <div className="text-sm text-green-800">Total Value</div>
                </div>
                <div className="bg-purple-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-purple-600">
                    ${Math.round(analytics.averageValue).toLocaleString()}
                  </div>
                  <div className="text-sm text-purple-800">Avg. Value</div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4">
                  <div className="text-2xl font-bold text-orange-600">{analytics.avgDaysInStage}</div>
                  <div className="text-sm text-orange-800">Avg. Days</div>
                </div>
              </div>

              {/* Lead Sources */}
              {analytics.leadSources.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Lead Sources</h3>
                  <div className="space-y-2">
                    {analytics.leadSources.map((source, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm text-gray-700">{source.source}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(source.count / analytics.totalLeads) * 100}%` }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8">{source.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Activity */}
              {analytics.recentActivity.length > 0 && (
                <div className="bg-white border border-gray-200 rounded-lg p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h3>
                  <div className="space-y-2">
                    {analytics.recentActivity.map((activity) => (
                      <div key={activity.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                        <div>
                          <span className="text-sm font-medium text-gray-900">{activity.name}</span>
                          <span className="text-sm text-gray-500 ml-2">{activity.action}</span>
                        </div>
                        <span className="text-xs text-gray-500">{activity.date}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Stage Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">Stage Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Stage Name:</span>
                    <span className="ml-2 font-medium">{stage?.name || 'Unknown'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Position:</span>
                    <span className="ml-2 font-medium">{stage?.order_position || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Type:</span>
                    <span className="ml-2 font-medium">
                      {stage?.is_won ? 'Won Stage' : stage?.is_lost ? 'Lost Stage' : 'Active Stage'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Color:</span>
                    <div className="inline-flex items-center ml-2">
                      <div 
                        className="w-4 h-4 rounded-full mr-2" 
                        style={{ backgroundColor: stage?.color || '#3B82F6' }}
                      ></div>
                      <span className="font-medium">{stage?.color || '#3B82F6'}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <p>No analytics data available</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default StageAnalyticsModal;
