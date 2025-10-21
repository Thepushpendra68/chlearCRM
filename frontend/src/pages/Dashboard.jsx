import { useState, useEffect, useMemo, useCallback } from 'react';
import { ChartBarIcon, UsersIcon, UserGroupIcon, CurrencyDollarIcon } from '@heroicons/react/24/outline';
import dashboardService from '../services/dashboardService';
import toast from 'react-hot-toast';
import { usePicklists } from '../context/PicklistContext';

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_leads: 0,
    new_leads: 0,
    converted_leads: 0,
    conversion_rate: '0.0%',
    total_leads_change: '+0%',
    new_leads_change: '+0%',
    converted_leads_change: '+0%',
    conversion_rate_change: '+0%'
  });
  const [recentLeads, setRecentLeads] = useState([]);
  const [leadSourceStats, setLeadSourceStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const { leadStatuses, leadSources: picklistSources } = usePicklists();

  const formatValue = useCallback((value, fallback = '-') => {
    if (!value) return fallback;
    return value.replace(/_/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
  }, []);

  const wonStatusTitle = useMemo(() => {
    const wonStatuses = leadStatuses.filter(option => option.metadata?.is_won);
    if (wonStatuses.length === 1) {
      return `${wonStatuses[0].label} Leads`;
    }
    if (wonStatuses.length > 1) {
      return 'Won Leads';
    }
    return 'Won Leads';
  }, [leadStatuses]);

  const getStatusOption = useCallback(
    (status) => leadStatuses.find(option => option.value === status),
    [leadStatuses]
  );

  const getStatusLabel = useCallback(
    (status) => getStatusOption(status)?.label || formatValue(status, 'Unknown'),
    [getStatusOption, formatValue]
  );

  const getStatusBadge = useCallback((status) => {
    const option = getStatusOption(status);

    if (option?.metadata?.is_won) {
      return 'bg-emerald-100 text-emerald-800';
    }

    if (option?.metadata?.is_lost) {
      return 'bg-red-100 text-red-800';
    }

    switch (status) {
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'contacted':
        return 'bg-blue-100 text-blue-800';
      case 'qualified':
        return 'bg-yellow-100 text-yellow-800';
      case 'proposal':
        return 'bg-amber-100 text-amber-800';
      case 'negotiation':
        return 'bg-purple-100 text-purple-800';
      case 'nurture':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }, [getStatusOption]);

  const getStatusIndicator = useCallback((status) => {
    const option = getStatusOption(status);

    if (option?.metadata?.is_won) {
      return 'bg-emerald-500';
    }

    if (option?.metadata?.is_lost) {
      return 'bg-red-500';
    }

    switch (status) {
      case 'new':
        return 'bg-green-400';
      case 'contacted':
        return 'bg-blue-400';
      case 'qualified':
        return 'bg-yellow-400';
      case 'proposal':
        return 'bg-amber-400';
      case 'negotiation':
        return 'bg-purple-400';
      case 'nurture':
        return 'bg-slate-400';
      default:
        return 'bg-gray-400';
    }
  }, [getStatusOption]);

  const getSourceLabel = useCallback(
    (source) => {
      const option = picklistSources.find(item => item.value === source);
      return option?.label || formatValue(source, 'Unknown');
    },
    [picklistSources, formatValue]
  );

  // Memoize stats data to prevent unnecessary recalculations
  const statsData = useMemo(() => [
    {
      name: 'Total Leads',
      value: stats.total_leads.toLocaleString(),
      icon: UsersIcon,
      change: stats.total_leads_change || '+0%',
      changeType: stats.total_leads_change?.startsWith('+') ? 'increase' : 'decrease'
    },
    {
      name: 'New Leads',
      value: stats.new_leads.toLocaleString(),
      icon: UserGroupIcon,
      change: stats.new_leads_change || '+0%',
      changeType: stats.new_leads_change?.startsWith('+') ? 'increase' : 'decrease'
    },
    {
      name: wonStatusTitle,
      value: stats.converted_leads.toLocaleString(),
      icon: CurrencyDollarIcon,
      change: stats.converted_leads_change || '+0%',
      changeType: stats.converted_leads_change?.startsWith('+') ? 'increase' : 'decrease'
    },
    {
      name: 'Conversion Rate',
      value: stats.conversion_rate,
      icon: ChartBarIcon,
      change: stats.conversion_rate_change || '+0%',
      changeType: stats.conversion_rate_change?.startsWith('+') ? 'increase' : 'decrease'
    },
  ], [stats, wonStatusTitle]);

  // Memoize the data loading function to prevent recreation on every render
  const loadDashboardData = useCallback(async () => {
    try {
      console.log('🔍 [DASHBOARD] Loading dashboard data...');
      setLoading(true);

      // Use Promise.allSettled to handle partial failures gracefully
      const results = await Promise.allSettled([
        dashboardService.getDashboardStats(),
        dashboardService.getRecentLeads(5),
        dashboardService.getLeadSources()
      ]);

      console.log('📊 [DASHBOARD] Results:', results);

      // Process results, using fallbacks for failed requests
      const statsResult = results[0].status === 'fulfilled' ? results[0].value : { data: {
        total_leads: 0,
        new_leads: 0,
        converted_leads: 0,
        conversion_rate: '0.0%',
        total_leads_change: '+0%',
        new_leads_change: '+0%',
        converted_leads_change: '+0%',
        conversion_rate_change: '+0%'
      }};
      const recentLeadsResult = results[1].status === 'fulfilled' ? results[1].value : { data: [] };
      const sourcesResult = results[2].status === 'fulfilled' ? results[2].value : { data: [] };

      const finalStats = statsResult.data || {
        total_leads: 0,
        new_leads: 0,
        converted_leads: 0,
        conversion_rate: '0.0%',
        total_leads_change: '+0%',
        new_leads_change: '+0%',
        converted_leads_change: '+0%',
        conversion_rate_change: '+0%'
      };

      console.log('📈 [DASHBOARD] Final stats to set:', finalStats);

      setStats(finalStats);
      setRecentLeads(recentLeadsResult.data || []);
      setLeadSourceStats(sourcesResult.data || []);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []); // Remove stats dependency to prevent infinite loop

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);


  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Welcome back! Here's what's happening with your leads today.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 md:gap-4 lg:gap-5 mb-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        {loading ? (
          // Loading skeleton
          Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="card animate-pulse">
              <div className="card-body">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex-shrink-0">
                    <div className="h-6 w-6 md:h-8 md:w-8 bg-gray-300 rounded"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="h-3 md:h-4 bg-gray-300 rounded mb-2"></div>
                    <div className="h-5 md:h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          statsData.map((item) => (
            <div key={item.name} className="card">
              <div className="card-body">
                <div className="flex items-center gap-3 md:gap-4">
                  <div className="flex-shrink-0">
                    <item.icon className="h-6 w-6 md:h-8 md:w-8 text-primary-600 flex-shrink-0" aria-hidden="true" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <dl>
                      <dt className="text-xs md:text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                      <dd>
                        <div className="text-base md:text-lg font-semibold text-gray-900 mt-1">{item.value}</div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
              <div className="card-footer">
                <div className="flex flex-col sm:flex-row gap-1 sm:gap-2 text-xs md:text-sm">
                  <span className={`font-medium whitespace-nowrap ${
                    item.changeType === 'increase' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {item.change}
                  </span>
                  <span className="text-gray-500 whitespace-nowrap">from last month</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent Activity */}
      <div className="grid gap-8" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))' }}>
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Recent Leads</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="flex items-center animate-pulse">
                    <div className="h-8 w-8 bg-gray-300 rounded-full"></div>
                    <div className="ml-4 flex-1">
                      <div className="h-4 bg-gray-300 rounded w-24 mb-1"></div>
                      <div className="h-3 bg-gray-300 rounded w-32"></div>
                    </div>
                    <div className="h-6 bg-gray-300 rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : recentLeads.length > 0 ? (
              <div className="space-y-4">
                {recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary-600">
                          {lead.first_name?.[0]}{lead.last_name?.[0]}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">
                        {lead.first_name} {lead.last_name}
                      </div>
                      <div className="text-sm text-gray-500 truncate" title={lead.email}>{lead.email}</div>
                    </div>
                    <div className="flex-shrink-0">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                        lead.status === 'new' ? 'bg-green-100 text-green-800' :
                        lead.status === 'contacted' ? 'bg-blue-100 text-blue-800' :
                        lead.status === 'qualified' ? 'bg-yellow-100 text-yellow-800' :
                        lead.status === 'converted' ? 'bg-purple-100 text-purple-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No recent leads</p>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-medium text-gray-900">Lead Sources</h3>
          </div>
          <div className="card-body">
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div key={index} className="flex items-center justify-between animate-pulse">
                    <div className="flex items-center">
                      <div className="h-3 w-3 bg-gray-300 rounded-full mr-3"></div>
                      <div className="h-4 bg-gray-300 rounded w-20"></div>
                    </div>
                    <div className="h-4 bg-gray-300 rounded w-8"></div>
                  </div>
                ))}
              </div>
            ) : leadSourceStats.length > 0 ? (
              <div className="space-y-4">
                {leadSourceStats.map((source, index) => {
                  const colors = ['bg-primary-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500', 'bg-blue-500'];
                  const color = colors[index % colors.length];
                  
                  return (
                    <div key={source.source} className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className={`h-3 w-3 rounded-full ${color} mr-3`}></div>
                        <span className="text-sm text-gray-900 capitalize">
                          {getSourceLabel(source.source)}
                        </span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">
                        {source.percentage}%
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-gray-500">No lead source data</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard




