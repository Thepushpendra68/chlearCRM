import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import platformService from '../../services/platformService';
import api from '../../services/api';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  UserIcon
} from '@heroicons/react/24/outline';

const CompanyDetails = () => {
  const { companyId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    fetchCompanyDetails();
  }, [companyId]);

  const fetchCompanyDetails = async () => {
    try {
      const response = await platformService.getCompanyDetails(companyId);
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch company details:', error);
      toast.error('Failed to load company details');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      await platformService.updateCompanyStatus(companyId, newStatus);
      toast.success(`Company status updated to ${newStatus}`);
      fetchCompanyDetails();
    } catch (error) {
      console.error('Failed to update status:', error);
      toast.error('Failed to update company status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleImpersonateUser = (userId) => {
    // Set impersonation header
    api.defaults.headers.common['x-impersonate-user-id'] = userId;

    toast.success('Impersonation started');

    // Redirect to main app
    window.location.href = '/app/dashboard';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Company not found</p>
      </div>
    );
  }

  const { company, users, stats } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link to="/platform/companies" className="text-gray-400 hover:text-gray-600">
            <ArrowLeftIcon className="h-6 w-6" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{company.name}</h2>
            <p className="text-gray-600">{company.company_slug}</p>
          </div>
        </div>

        {/* Status Dropdown */}
        <select
          value={company.status}
          onChange={(e) => handleUpdateStatus(e.target.value)}
          disabled={updatingStatus}
          className="input"
        >
          <option value="active">Active</option>
          <option value="trial">Trial</option>
          <option value="suspended">Suspended</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </div>

      {/* Company Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Users</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_users || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Total Leads</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.total_leads || 0}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-600">Activities (30d)</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{stats.activities_30d || 0}</p>
        </div>
      </div>

      {/* Users List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {users.map((user) => (
            <div key={user.id} className="p-4 hover:bg-gray-50 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <UserIcon className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {user.first_name} {user.last_name}
                  </p>
                  <p className="text-xs text-gray-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                onClick={() => handleImpersonateUser(user.id)}
                className="btn-secondary text-sm"
              >
                Impersonate
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;
