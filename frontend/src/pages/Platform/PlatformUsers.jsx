import { useState, useEffect } from 'react';
import {
  MagnifyingGlassIcon,
  UserCircleIcon,
  BuildingOfficeIcon,
  ArrowRightOnRectangleIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import platformService from '../../services/platformService';
import { useAuth } from '../../context/AuthContext';

const PlatformUsers = () => {
  const { startImpersonation } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [companies, setCompanies] = useState([]);
  const [impersonating, setImpersonating] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createForm, setCreateForm] = useState({
    company_id: '',
    first_name: '',
    last_name: '',
    email: '',
    password: '',
    role: 'sales_rep'
  });

  // Fetch companies for filter
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const response = await platformService.getCompanies({ limit: 100 });
        if (response.success) {
          setCompanies(response.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };
    fetchCompanies();
  }, []);

  // Fetch users
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = {
        limit: 100
      };

      if (searchTerm) params.search = searchTerm;
      if (roleFilter) params.role = roleFilter;
      if (companyFilter) params.company_id = companyFilter;

      const response = await platformService.searchUsers(params);

      if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [searchTerm, roleFilter, companyFilter]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchUsers();
  };

  const resetCreateForm = () => {
    setCreateForm({
      company_id: '',
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'sales_rep'
    });
  };

  const handleCreateUser = async (event) => {
    event.preventDefault();

    if (!createForm.company_id) {
      toast.error('Please select a company');
      return;
    }

    if (!createForm.first_name || !createForm.last_name || !createForm.email || !createForm.password) {
      toast.error('Fill in all required fields');
      return;
    }

    try {
      setCreatingUser(true);
      const payload = {
        company_id: createForm.company_id,
        first_name: createForm.first_name.trim(),
        last_name: createForm.last_name.trim(),
        email: createForm.email.trim(),
        password: createForm.password,
        role: createForm.role
      };

      const response = await platformService.createUser(payload);

      if (response?.success) {
        toast.success('User created successfully');
        setShowCreateModal(false);
        resetCreateForm();
        fetchUsers();
      }
    } catch (error) {
      const message = error?.response?.data?.message || error?.message || 'Failed to create user';
      toast.error(message);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleImpersonate = async (user) => {
    if (user.role === 'super_admin') {
      toast.error('Cannot impersonate another super admin');
      return;
    }

    setImpersonating(user.id);
    try {
      // Call backend to start impersonation
      const response = await platformService.startImpersonation(user.id);

      if (response.success) {
        // Call auth context to set header and state
        await startImpersonation(user.id, response.data.user);
      } else {
        toast.error('Failed to start impersonation');
      }
    } catch (error) {
      console.error('Impersonation error:', error);
      toast.error('Failed to start impersonation');
      setImpersonating(null);
    }
  };

  const formatRole = (role) => {
    const roleMap = {
      'super_admin': 'Super Admin',
      'company_admin': 'Company Admin',
      'manager': 'Manager',
      'sales_rep': 'Sales Rep'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      'super_admin': 'bg-purple-100 text-purple-800',
      'company_admin': 'bg-blue-100 text-blue-800',
      'manager': 'bg-green-100 text-green-800',
      'sales_rep': 'bg-gray-100 text-gray-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Platform Users</h1>
        <p className="mt-2 text-gray-600">Manage users across all companies</p>
        <div className="mt-4">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-md shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Users
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Name or email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>

            {/* Role Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Roles</option>
                <option value="super_admin">Super Admin</option>
                <option value="company_admin">Company Admin</option>
                <option value="manager">Manager</option>
                <option value="sales_rep">Sales Rep</option>
              </select>
            </div>

            {/* Company Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Company
              </label>
              <select
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">All Companies</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>
      </div>

      {/* Results Count */}
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {loading ? 'Loading...' : `${users.length} user${users.length !== 1 ? 's' : ''} found`}
        </p>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-purple-600 border-r-transparent"></div>
            <p className="mt-4 text-gray-600">Loading users...</p>
          </div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center">
            <UserCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No users found</p>
            <p className="text-sm text-gray-500 mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                            <span className="text-purple-600 font-medium text-sm">
                              {user.first_name?.[0]}{user.last_name?.[0]}
                            </span>
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.first_name} {user.last_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {user.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-900">
                        <BuildingOfficeIcon className="h-4 w-4 text-gray-400 mr-2" />
                        {user.company_name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {user.role !== 'super_admin' && (
                        <button
                          onClick={() => handleImpersonate(user)}
                          disabled={impersonating === user.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                        >
                          {impersonating === user.id ? (
                            <>
                              <div className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-solid border-current border-r-transparent mr-2"></div>
                              Impersonating...
                            </>
                          ) : (
                            <>
                              <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                              Impersonate
                            </>
                          )}
                        </button>
                      )}
                      {user.role === 'super_admin' && (
                        <span className="text-xs text-gray-400 italic">Not available</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Add User to Company</h2>
              <p className="mt-1 text-sm text-gray-600">
                Create a user for any tenant. The new user will receive immediate access.
              </p>
            </div>
            <form onSubmit={handleCreateUser} className="px-6 py-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Company *</label>
                  <select
                    value={createForm.company_id}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, company_id: e.target.value }))}
                    className="mt-1 input"
                    required
                  >
                    <option value="">Select company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, role: e.target.value }))}
                    className="mt-1 input"
                  >
                    <option value="sales_rep">Sales Rep</option>
                    <option value="manager">Manager</option>
                    <option value="company_admin">Company Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">First Name *</label>
                  <input
                    type="text"
                    value={createForm.first_name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, first_name: e.target.value }))}
                    className="mt-1 input"
                    placeholder="First name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Last Name *</label>
                  <input
                    type="text"
                    value={createForm.last_name}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, last_name: e.target.value }))}
                    className="mt-1 input"
                    placeholder="Last name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="mt-1 input"
                    placeholder="Email address"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Temporary Password *</label>
                  <input
                    type="password"
                    value={createForm.password}
                    onChange={(e) => setCreateForm((prev) => ({ ...prev, password: e.target.value }))}
                    className="mt-1 input"
                    placeholder="Provide a secure password"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Share this password securely with the user—they should change it after first login.
                  </p>
                </div>
              </div>

              <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    resetCreateForm();
                  }}
                  className="btn-secondary"
                  disabled={creatingUser}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={creatingUser}
                >
                  {creatingUser ? 'Creating...' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default PlatformUsers;
