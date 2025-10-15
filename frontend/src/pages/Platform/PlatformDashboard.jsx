import { useEffect, useState } from 'react';
import platformService from '../../services/platformService';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const StatCard = ({ title, value, icon: Icon, color = 'blue' }) => {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500'
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
        </div>
        <div className={`${colorClasses[color]} p-3 rounded-lg`}>
          <Icon className="h-6 w-6 text-white" />
        </div>
      </div>
    </div>
  );
};

const TelemetryCard = ({ label, value, icon: Icon, tone = 'indigo' }) => {
  const toneClasses = {
    indigo: 'bg-indigo-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500'
  };

  return (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <p className="mt-1 text-xl font-semibold text-gray-900">{value}</p>
      </div>
      <div className={`${toneClasses[tone]} rounded-md p-2`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </div>
  );
};

const PlatformDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [telemetry, setTelemetry] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, activityResponse, telemetryResponse] = await Promise.all([
        platformService.getPlatformStats(),
        platformService.getRecentActivity(10),
        platformService.getImportTelemetry(undefined, 10)
      ]);

      setStats(statsResponse.data);
      setActivity(activityResponse.data);
      setTelemetry(telemetryResponse.data);
    } catch (error) {
      console.error('Failed to fetch platform data:', error);
      toast.error('Failed to load platform data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const formatNumber = (value, fallback = '0') => {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) {
      return fallback;
    }
    return numeric.toLocaleString();
  };

  const formatDuration = (ms) => {
    const numeric = Number(ms);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return '—';
    }
    if (numeric >= 1000) {
      return `${(numeric / 1000).toFixed(numeric >= 10000 ? 0 : 1)} s`;
    }
    return `${Math.round(numeric)} ms`;
  };

  const telemetrySummary = telemetry?.summary;
  const telemetryRecent = telemetry?.recent || [];
  const telemetryTopCompanies = telemetry?.topCompanies || [];
  const telemetryRangeLabel = telemetry?.range?.label || 'Last 30 days';

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Platform Overview</h2>
        <p className="text-gray-600 mt-1">Monitor your entire CRM platform at a glance</p>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Companies"
          value={stats?.totalCompanies || 0}
          icon={BuildingOfficeIcon}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats?.activeUsers || 0}
          icon={UsersIcon}
          color="green"
        />
        <StatCard
          title="Total Leads"
          value={stats?.totalLeads || 0}
          icon={DocumentTextIcon}
          color="purple"
        />
        <StatCard
          title="Active (30d)"
          value={stats?.activeUsersPeriod ?? stats?.activeUsers30d ?? 0}
          icon={ChartBarIcon}
          color="orange"
        />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">New Companies (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.newCompaniesPeriod ?? stats?.newCompanies30d ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">New Users (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.newUsersPeriod ?? stats?.newUsers30d ?? 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Leads Created (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.leadsCreatedPeriod ?? stats?.leadsCreated30d ?? 0}
          </p>
        </div>
      </div>

      {/* Lead Import Telemetry */}
      <div className="bg-white rounded-lg shadow">
        <div className="flex flex-col gap-2 p-6 border-b border-gray-200 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Lead Import Health</h3>
            <p className="text-sm text-gray-500">
              Dry-run and import activity across all tenants
            </p>
          </div>
          <span className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Window: {telemetryRangeLabel}
          </span>
        </div>
        <div className="p-6 space-y-6">
          {!telemetrySummary || telemetrySummary.totalRuns === 0 ? (
            <p className="text-sm text-gray-500">
              No lead imports recorded in this window. Run a bulk import to see telemetry here.
            </p>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <TelemetryCard
                  label="Total Runs"
                  value={formatNumber(telemetrySummary.totalRuns)}
                  icon={ArrowPathIcon}
                  tone="indigo"
                />
                <TelemetryCard
                  label="Success Rate"
                  value={`${Number(telemetrySummary.successRate || 0).toFixed(1)}%`}
                  icon={CheckCircleIcon}
                  tone="emerald"
                />
                <TelemetryCard
                  label="Warnings"
                  value={formatNumber(telemetrySummary.totalWarnings)}
                  icon={ExclamationTriangleIcon}
                  tone="amber"
                />
                <TelemetryCard
                  label="Avg. Duration"
                  value={formatDuration(telemetrySummary.avgDurationMs)}
                  icon={ClockIcon}
                  tone="rose"
                />
              </div>

              {Array.isArray(telemetry?.duplicatePolicies) && telemetry.duplicatePolicies.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {telemetry.duplicatePolicies.map(({ policy, count }) => (
                    <span
                      key={policy || 'unspecified'}
                      className="inline-flex items-center rounded-full bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700"
                    >
                      {policy || 'unspecified'} · {formatNumber(count)}
                    </span>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Recent Runs</h4>
                  <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Time</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Company</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-500">Phase</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Rows</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Errors</th>
                          <th className="px-4 py-2 text-right font-medium text-gray-500">Warnings</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {telemetryRecent.map((event) => (
                          <tr key={event.id}>
                            <td className="px-4 py-2 text-gray-600">
                              {event.createdAt ? new Date(event.createdAt).toLocaleString() : '—'}
                            </td>
                            <td className="px-4 py-2 text-gray-700">
                              {event.companyName || 'Unknown company'}
                              {event.fileName && (
                                <span className="block text-xs text-gray-400 truncate">
                                  {event.fileName}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-gray-600 capitalize">
                              {event.phase?.replace('_', ' ') || '—'}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {formatNumber(event.stats?.total || event.insertedCount || 0)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {formatNumber(event.errorCount)}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-700">
                              {formatNumber(event.warningCount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Top Companies (issues)</h4>
                  {telemetryTopCompanies.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No import warnings detected for this period.
                    </p>
                  ) : (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-medium text-gray-500">Company</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500">Runs</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500">Errors</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500">Warnings</th>
                            <th className="px-4 py-2 text-right font-medium text-gray-500">Rows Imported</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {telemetryTopCompanies.map((company) => (
                            <tr key={company.companyId}>
                              <td className="px-4 py-2 text-gray-700">
                                {company.companyName}
                                <span className="block text-xs text-gray-400">
                                  Last run:{' '}
                                  {company.lastSeen
                                    ? new Date(company.lastSeen).toLocaleDateString()
                                    : '—'}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">
                                {formatNumber(company.runs)}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">
                                {formatNumber(company.errors)}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">
                                {formatNumber(company.warnings)}
                              </td>
                              <td className="px-4 py-2 text-right text-gray-700">
                                {formatNumber(company.rowsImported)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {activity.length === 0 ? (
            <p className="p-6 text-gray-500 text-center">No recent activity</p>
          ) : (
            activity.map((item, index) => (
              <div key={index} className="p-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.resource_name || item.activity_label || item.activity_type || 'Platform activity'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {(item.activity_label || item.activity_type || 'unknown activity').replace(/_/g, ' ')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : ''}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
