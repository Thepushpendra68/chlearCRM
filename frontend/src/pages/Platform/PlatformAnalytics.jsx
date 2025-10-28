import { useState, useEffect, useCallback } from 'react';
import {
  ChartBarIcon,
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import platformService from '../../services/platformService';

const PlatformAnalytics = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');

  const fetchStats = useCallback(async (rangeKey) => {
    setLoading(true);
    try {
      const response = await platformService.getPlatformStats(rangeKey);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats(timeRange);
  }, [timeRange, fetchStats]);

  const StatCard = ({ title, value, icon: Icon, color, trend, trendValue }) => (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {trend && (
            <div className="mt-2 flex items-center">
              {trend === 'up' ? (
                <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
              ) : (
                <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
              )}
              <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                {trendValue}
              </span>
              <span className="text-sm text-gray-500 ml-1">from last period</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-full ${color}`}>
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>
    </div>
  );

  const MetricRow = ({ label, value, total, percentage }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-900">{value}</span>
        {total && (
          <>
            <div className="w-32 bg-gray-200 rounded-full h-2">
              <div
                className="bg-purple-600 h-2 rounded-full"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-12 text-right">{percentage}%</span>
          </>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
          <p className="ml-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-8">
        <div className="text-center py-12">
          <ChartBarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No analytics data available</p>
        </div>
      </div>
    );
  }

  const periodLabel = stats?.periodLabel || 'Last 30 days';

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Platform Analytics</h1>
          <p className="mt-2 text-gray-600">Comprehensive platform insights and metrics</p>
        </div>

        {/* Time Range Selector */}
        <div>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Companies"
          value={stats.totalCompanies || 0}
          icon={BuildingOfficeIcon}
          color="bg-blue-500"
          trend="up"
          trendValue={`+${stats.newCompaniesPeriod || 0}`}
        />
        <StatCard
          title="Active Users"
          value={stats.activeUsers || 0}
          icon={UsersIcon}
          color="bg-green-500"
          trend="up"
          trendValue={`+${stats.newUsersPeriod || 0}`}
        />
        <StatCard
          title="Total Leads"
          value={stats.totalLeads || 0}
          icon={DocumentTextIcon}
          color="bg-purple-500"
          trend="up"
          trendValue={`+${stats.leadsCreatedPeriod || 0}`}
        />
        <StatCard
          title={`Platform Activity (${periodLabel})`}
          value={stats.activeUsersPeriod || 0}
          icon={ChartBarIcon}
          color="bg-orange-500"
        />
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Metrics</h3>
          <div className="space-y-1">
            <MetricRow
              label="Active Companies"
              value={stats.activeCompanies || 0}
              total={stats.totalCompanies}
              percentage={100}
            />
            <MetricRow
              label={`New Companies (${periodLabel})`}
              value={stats.newCompaniesPeriod || 0}
              total={stats.totalCompanies}
              percentage={stats.totalCompanies > 0 ? Math.round((stats.newCompaniesPeriod / stats.totalCompanies) * 100) : 0}
            />
            <MetricRow
              label="Average Users per Company"
              value={stats.totalCompanies > 0 ? Math.round(stats.activeUsers / stats.totalCompanies) : 0}
            />
            <MetricRow
              label="Average Leads per Company"
              value={stats.totalCompanies > 0 ? Math.round(stats.totalLeads / stats.totalCompanies) : 0}
            />
          </div>
        </div>

        {/* User Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Metrics</h3>
          <div className="space-y-1">
            <MetricRow
              label="Total Users"
              value={stats.totalUsers || 0}
              total={stats.totalUsers}
              percentage={100}
            />
            <MetricRow
              label={`New Users (${periodLabel})`}
              value={stats.newUsersPeriod || 0}
              total={stats.activeUsers}
              percentage={stats.activeUsers > 0 ? Math.round((stats.newUsersPeriod / stats.activeUsers) * 100) : 0}
            />
            <MetricRow
              label={`Active Users (${periodLabel})`}
              value={stats.activeUsersPeriod || 0}
              total={stats.activeUsers}
              percentage={stats.activeUsers > 0 ? Math.round((stats.activeUsersPeriod / stats.activeUsers) * 100) : 0}
            />
            <MetricRow
              label="User Growth Rate"
              value={`${stats.activeUsers > 0 ? Math.round((stats.newUsersPeriod / stats.activeUsers) * 100) : 0}%`}
            />
          </div>
        </div>

        {/* Lead Metrics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Lead Metrics</h3>
          <div className="space-y-1">
            <MetricRow
              label="Total Leads"
              value={stats.totalLeads || 0}
              total={stats.totalLeads}
              percentage={100}
            />
            <MetricRow
              label={`Leads Created (${periodLabel})`}
              value={stats.leadsCreatedPeriod || 0}
              total={stats.totalLeads}
              percentage={stats.totalLeads > 0 ? Math.round((stats.leadsCreatedPeriod / stats.totalLeads) * 100) : 0}
            />
            <MetricRow
              label="Average Leads per User"
              value={stats.activeUsers > 0 ? Math.round(stats.totalLeads / stats.activeUsers) : 0}
            />
            <MetricRow
              label="Lead Creation Rate"
              value={`${stats.totalLeads > 0 ? Math.round((stats.leadsCreatedPeriod / stats.totalLeads) * 100) : 0}%`}
            />
          </div>
        </div>

        {/* Platform Health */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platform Health</h3>
          <div className="space-y-1">
            <MetricRow
              label="User Engagement Rate"
              value={`${stats.activeUsers > 0 ? Math.round((stats.activeUsersPeriod / stats.activeUsers) * 100) : 0}%`}
            />
            <MetricRow
              label="Company Growth Rate"
              value={`${stats.totalCompanies > 0 ? Math.round((stats.newCompaniesPeriod / stats.totalCompanies) * 100) : 0}%`}
            />
            <MetricRow
              label="Lead Activity Score"
              value={`${stats.totalLeads > 0 && stats.activeUsersPeriod > 0 ? Math.round((stats.leadsCreatedPeriod / stats.activeUsersPeriod) * 10) : 0}/10`}
            />
            <MetricRow
              label="Platform Utilization"
              value={`${stats.totalCompanies > 0 ? Math.round((stats.activeUsers / (stats.totalCompanies * 10)) * 100) : 0}%`}
            />
          </div>
        </div>
      </div>

      {/* Growth Summary */}
      <div className="mt-6 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{periodLabel} Growth Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">+{stats.newCompaniesPeriod || 0}</div>
            <div className="text-sm text-gray-600 mt-1">New Companies</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">+{stats.newUsersPeriod || 0}</div>
            <div className="text-sm text-gray-600 mt-1">New Users</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-600">+{stats.leadsCreatedPeriod || 0}</div>
            <div className="text-sm text-gray-600 mt-1">Leads Created</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
