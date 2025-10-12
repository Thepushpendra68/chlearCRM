import { useEffect, useState } from 'react';
import platformService from '../../services/platformService';
import toast from 'react-hot-toast';
import {
  BuildingOfficeIcon,
  UsersIcon,
  DocumentTextIcon,
  ChartBarIcon
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

const PlatformDashboard = () => {
  const [stats, setStats] = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsResponse, activityResponse] = await Promise.all([
        platformService.getPlatformStats(),
        platformService.getRecentActivity(10)
      ]);

      setStats(statsResponse.data);
      setActivity(activityResponse.data);
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
          value={stats?.total_companies || 0}
          icon={BuildingOfficeIcon}
          color="blue"
        />
        <StatCard
          title="Active Users"
          value={stats?.active_users || 0}
          icon={UsersIcon}
          color="green"
        />
        <StatCard
          title="Total Leads"
          value={stats?.total_leads || 0}
          icon={DocumentTextIcon}
          color="purple"
        />
        <StatCard
          title="Active (30d)"
          value={stats?.active_users_30d || 0}
          icon={ChartBarIcon}
          color="orange"
        />
      </div>

      {/* Growth Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">New Companies (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.new_companies_30d || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">New Users (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.new_users_30d || 0}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Leads Created (30d)</h3>
          <p className="text-2xl font-bold text-gray-900 mt-2">
            {stats?.leads_created_30d || 0}
          </p>
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
                      {item.resource_name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.activity_type.replace('_', ' ')}
                    </p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleString()}
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
