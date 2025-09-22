import React from 'react';
import { 
  ChartBarIcon, 
  FunnelIcon, 
  ClockIcon, 
  UserGroupIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';

const Chart = ({ data, type }) => {
  if (!data) {
    return (
      <div className="p-8 text-center">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No data available</h3>
        <p className="mt-1 text-sm text-gray-500">No data found for this report</p>
      </div>
    );
  }

  const renderLeadPerformance = () => (
    <div className="p-6 space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-blue-600">Total Leads</p>
              <p className="text-2xl font-bold text-blue-900">{data.leadMetrics?.total_leads || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ArrowTrendingUpIcon className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-green-600">Won Leads</p>
              <p className="text-2xl font-bold text-green-900">{data.leadMetrics?.won_leads || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ClockIcon className="h-8 w-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-purple-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-purple-900">
                {typeof data.responseTime?.avg_response_time_hours === 'number' 
                  ? data.responseTime.avg_response_time_hours.toFixed(1) 
                  : 0}h
              </p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center">
            <ChartBarIcon className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-orange-600">Avg Deal Value</p>
              <p className="text-2xl font-bold text-orange-900">
                ${data.leadMetrics?.avg_deal_value?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Data Table */}
      {data.conversionData && data.conversionData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pipeline Stage Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Probability
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.conversionData.map((stage, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stage.stage_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {stage.lead_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(stage.avg_probability || 0)}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${parseFloat(stage.total_value || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderConversionFunnel = () => (
    <div className="p-6 space-y-6">
      {/* Funnel Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Conversion Funnel</h3>
        <div className="space-y-4">
          {data.funnelData && data.funnelData.map((stage, index) => (
            <div key={index} className="flex items-center">
              <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-900">{stage.stage_name}</span>
                  <span className="text-sm text-gray-500">{stage.lead_count} leads</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min((stage.lead_count / Math.max(...data.funnelData.map(s => s.lead_count))) * 100, 100)}%` }}
                  ></div>
                </div>
                {index > 0 && (
                  <div className="mt-1 text-xs text-gray-500">
                    Conversion rate: {stage.conversion_rate}%
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-blue-600">Total Leads</p>
          <p className="text-2xl font-bold text-blue-900">{data.totalLeads || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-green-600">Won Leads</p>
          <p className="text-2xl font-bold text-green-900">{data.wonLeads || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-purple-600">Overall Conversion</p>
          <p className="text-2xl font-bold text-purple-900">{data.overallConversionRate || 0}%</p>
        </div>
      </div>
    </div>
  );

  const renderActivitySummary = () => (
    <div className="p-6 space-y-6">
      {/* Activity Summary Table */}
      {data.activitySummary && data.activitySummary.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Activity Summary</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completion Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.activitySummary.map((activity, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 capitalize">
                      {activity.activity_type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.total_activities}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.completed_activities}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {activity.total_activities > 0 ? Math.round((activity.completed_activities / activity.total_activities) * 100) : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Math.round(activity.avg_duration_minutes || 0)} min
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Trends */}
      {data.dailyTrends && data.dailyTrends.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Activity Trends</h3>
          <div className="space-y-2">
            {data.dailyTrends.slice(0, 10).map((trend, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                <span className="text-sm text-gray-900">{trend.activity_date}</span>
                <span className="text-sm text-gray-500 capitalize">{trend.activity_type}</span>
                <span className="text-sm font-medium text-gray-900">{trend.activity_count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderTeamPerformance = () => (
    <div className="p-6 space-y-6">
      {/* Team Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-blue-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-blue-600">Team Size</p>
          <p className="text-2xl font-bold text-blue-900">{data.teamSize || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-green-600">Total Leads</p>
          <p className="text-2xl font-bold text-green-900">{data.teamTotals?.totalLeads || 0}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-purple-600">Total Value</p>
          <p className="text-2xl font-bold text-purple-900">
            ${data.teamTotals?.totalDealValue?.toLocaleString() || 0}
          </p>
        </div>
        <div className="bg-orange-50 p-4 rounded-lg text-center">
          <p className="text-sm font-medium text-orange-600">Win Rate</p>
          <p className="text-2xl font-bold text-orange-900">{data.teamAverages?.winRate || 0}%</p>
        </div>
      </div>

      {/* Individual Performance */}
      {data.userPerformance && data.userPerformance.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Individual Performance</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Won Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Win Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.userPerformance.map((user, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {user.first_name} {user.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.total_leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.won_leads}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(user.won_leads + user.lost_leads) > 0 ? Math.round((user.won_leads / (user.won_leads + user.lost_leads)) * 100) : 0}%
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${parseFloat(user.total_deal_value || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderPipelineHealth = () => (
    <div className="p-6 space-y-6">
      {/* Stage Health */}
      {data.stageHealth && data.stageHealth.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Pipeline Stage Health</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lead Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Days in Stage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stale Leads
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Health Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.stageHealth.map((stage, index) => {
                  const isHealthy = stage.avg_days_in_stage < 30 && stage.stale_leads < stage.lead_count * 0.3;
                  const isWarning = stage.avg_days_in_stage < 60 && stage.stale_leads < stage.lead_count * 0.5;
                  
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {stage.stage_name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stage.lead_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {Math.round(stage.avg_days_in_stage || 0)} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stage.stale_leads}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          isHealthy 
                            ? 'bg-green-100 text-green-800' 
                            : isWarning 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {isHealthy ? 'Healthy' : isWarning ? 'Warning' : 'Needs Attention'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bottleneck Analysis */}
      {data.bottleneckData && data.bottleneckData.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Bottleneck Analysis</h3>
          <div className="space-y-3">
            {data.bottleneckData.map((bottleneck, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="text-sm font-medium text-gray-900">{bottleneck.stage_name}</span>
                <div className="flex items-center space-x-4">
                  <span className="text-sm text-gray-500">{bottleneck.lead_count} leads</span>
                  <span className="text-sm text-gray-500">{bottleneck.percentage_of_total}% of total</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderChart = () => {
    switch (type) {
      case 'lead-performance':
        return renderLeadPerformance();
      case 'conversion-funnel':
        return renderConversionFunnel();
      case 'activity-summary':
        return renderActivitySummary();
      case 'team-performance':
        return renderTeamPerformance();
      case 'pipeline-health':
        return renderPipelineHealth();
      default:
        return (
          <div className="p-8 text-center">
            <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Unsupported chart type</h3>
            <p className="mt-1 text-sm text-gray-500">Chart type "{type}" is not supported</p>
          </div>
        );
    }
  };

  return renderChart();
};

export default Chart;
