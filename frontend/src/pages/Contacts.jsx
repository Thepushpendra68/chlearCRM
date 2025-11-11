import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  IdentificationIcon,
  UserIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import contactService from '../services/contactService';
import { useAuth } from '../context/AuthContext';
import ContactForm from '../components/Contacts/ContactForm';

const Contacts = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({});

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [lifecycleFilter, setLifecycleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const [showFormModal, setShowFormModal] = useState(false);
  const [activeContact, setActiveContact] = useState(null);

  const canManageContacts = useMemo(() => {
    return ['company_admin', 'super_admin', 'manager'].includes(user?.role);
  }, [user?.role]);

  useEffect(() => {
    fetchContacts();
  }, [currentPage, search, statusFilter, lifecycleFilter]);

  const fetchContacts = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: itemsPerPage,
        search,
        status: statusFilter,
        lifecycle_stage: lifecycleFilter
      };

      const response = await contactService.getContacts(params);
      const contactData = response?.data ?? [];
      setContacts(Array.isArray(contactData) ? contactData : []);
      setPagination(response?.pagination ?? {});
    } catch (error) {
      console.error('Failed to fetch contacts:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (event) => {
    setSearch(event.target.value);
    setCurrentPage(1);
  };

  const openCreateModal = () => {
    setActiveContact(null);
    setShowFormModal(true);
  };

  const openEditModal = (contact) => {
    setActiveContact(contact);
    setShowFormModal(true);
  };

  const closeFormModal = () => {
    setShowFormModal(false);
    setActiveContact(null);
  };

  const handleFormSuccess = () => {
    fetchContacts();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await contactService.deleteContact(id);
      toast.success('Contact deleted successfully');
      fetchContacts();
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to delete contact');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'bounced':
        return 'bg-red-100 text-red-800';
      case 'unsubscribed':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-slate-100 text-slate-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getLifecycleColor = (stage) => {
    switch (stage) {
      case 'lead':
        return 'bg-blue-100 text-blue-800';
      case 'marketing_qualified':
        return 'bg-indigo-100 text-indigo-800';
      case 'sales_qualified':
        return 'bg-purple-100 text-purple-800';
      case 'opportunity':
        return 'bg-amber-100 text-amber-800';
      case 'customer':
        return 'bg-emerald-100 text-emerald-800';
      case 'evangelist':
        return 'bg-pink-100 text-pink-800';
      default:
        return '';
    }
  };

  const formatLifecycleStage = (stage) => {
    if (!stage) return '';
    return stage
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const hasActiveFilters = Boolean(statusFilter || lifecycleFilter);
  const totalPages = pagination?.total_pages ?? 0;
  const hasPagination = totalPages > 1;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200">
        <div className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-100">
                <IdentificationIcon className="h-6 w-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Contacts</h1>
                <p className="mt-0.5 text-sm text-gray-600">Manage your contact relationships</p>
              </div>
            </div>
            <button
              onClick={openCreateModal}
              className="inline-flex items-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <PlusIcon className="mr-2 h-5 w-5" />
              New Contact
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={search}
                  onChange={handleSearchChange}
                  placeholder="Search contacts by name, email, phone..."
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-10 pr-3 text-sm leading-5 placeholder-gray-500 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters((prev) => !prev)}
              className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
            >
              <FunnelIcon className="mr-2 h-5 w-5" />
              Filters
              {hasActiveFilters && (
                <span className="ml-2 inline-flex items-center rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-800">
                  Active
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="mt-4 grid grid-cols-1 gap-4 border-t border-gray-200 pt-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Status</label>
                <select
                  value={statusFilter}
                  onChange={(event) => {
                    setStatusFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="bounced">Bounced</option>
                  <option value="unsubscribed">Unsubscribed</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Lifecycle Stage</label>
                <select
                  value={lifecycleFilter}
                  onChange={(event) => {
                    setLifecycleFilter(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="block w-full rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
                >
                  <option value="">All Stages</option>
                  <option value="lead">Lead</option>
                  <option value="marketing_qualified">Marketing Qualified</option>
                  <option value="sales_qualified">Sales Qualified</option>
                  <option value="opportunity">Opportunity</option>
                  <option value="customer">Customer</option>
                  <option value="evangelist">Evangelist</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setStatusFilter('');
                    setLifecycleFilter('');
                    setCurrentPage(1);
                  }}
                  className="text-sm font-medium text-primary-600 hover:text-primary-800"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-4 border-primary-200 border-t-primary-600 animate-spin" />
            <p className="mt-4 text-sm font-medium text-gray-900">Loading contacts...</p>
          </div>
        ) : contacts.length === 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white p-8 text-center shadow-sm">
            <IdentificationIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-semibold text-gray-900">No contacts found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {hasActiveFilters || search
                ? 'Try adjusting your search or filters'
                : 'Get started by creating your first contact'}
            </p>
            {!hasActiveFilters && !search && (
              <div className="mt-6">
                <button
                  onClick={openCreateModal}
                  className="inline-flex items-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
                >
                  <PlusIcon className="mr-2 h-5 w-5" />
                  New Contact
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Contact Info</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Account</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Owner</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Lifecycle</th>
                    <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {contacts.map((contact) => (
                    <tr
                      key={contact.id}
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => navigate(`/app/contacts/${contact.id}`)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100">
                            <span className="text-sm font-medium text-primary-700">
                              {contact.first_name?.[0]}
                              {contact.last_name?.[0]}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {contact.first_name} {contact.last_name}
                            </div>
                            {contact.title && (
                              <div className="text-sm text-gray-500">{contact.title}</div>
                            )}
                            {(contact.is_decision_maker || contact.is_primary) && (
                              <div className="mt-1 flex flex-wrap gap-2">
                                {contact.is_decision_maker && (
                                  <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                                    Decision Maker
                                  </span>
                                )}
                                {contact.is_primary && (
                                  <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                                    Primary Contact
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1 text-sm">
                          {contact.email && (
                            <div className="flex items-center text-gray-900">
                              <EnvelopeIcon className="mr-2 h-4 w-4 text-gray-400" />
                              {contact.email}
                            </div>
                          )}
                          {contact.phone && (
                            <div className="flex items-center text-gray-500">
                              <PhoneIcon className="mr-2 h-4 w-4 text-gray-400" />
                              {contact.phone}
                            </div>
                          )}
                          {contact.mobile_phone && (
                            <div className="flex items-center text-gray-500">
                              <PhoneIcon className="mr-2 h-4 w-4 text-gray-400" />
                              {contact.mobile_phone}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {contact.account_name ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <BuildingOfficeIcon className="mr-2 h-4 w-4 text-gray-400" />
                            {contact.account_name}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {contact.assigned_user_first_name ? (
                          <div className="flex items-center text-sm text-gray-900">
                            <UserIcon className="mr-2 h-4 w-4 text-gray-400" />
                            {contact.assigned_user_first_name} {contact.assigned_user_last_name}
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(contact.status)}`}>
                          {contact.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        {contact.lifecycle_stage ? (
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getLifecycleColor(contact.lifecycle_stage)}`}>
                            {formatLifecycleStage(contact.lifecycle_stage)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right text-sm font-medium">
                        <button
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/app/contacts/${contact.id}`);
                          }}
                          className="mr-4 text-primary-600 hover:text-primary-900"
                        >
                          View
                        </button>
                        {canManageContacts && (
                          <>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                openEditModal(contact);
                              }}
                              className="mr-4 inline-flex items-center text-gray-600 hover:text-gray-900"
                            >
                              <PencilIcon className="mr-1 h-4 w-4" />
                              Edit
                            </button>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                handleDelete(contact.id);
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {hasPagination && (
              <div className="mt-4 flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm sm:px-6">
                <div className="flex flex-1 justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage((page) => page - 1)}
                    disabled={!pagination?.has_prev}
                    className="relative inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage((page) => page + 1)}
                    disabled={!pagination?.has_next}
                    className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden flex-1 items-center justify-between sm:flex">
                  <p className="text-sm text-gray-700">
                    Showing page <span className="font-medium">{pagination?.current_page ?? 1}</span> of{' '}
                    <span className="font-medium">{totalPages}</span>{' '}
                    ({pagination?.total_items ?? contacts.length} total contacts)
                  </p>
                  <div className="inline-flex -space-x-px rounded-md shadow-sm">
                    <button
                      onClick={() => setCurrentPage((page) => page - 1)}
                      disabled={!pagination?.has_prev}
                      className="relative inline-flex items-center rounded-l-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage((page) => page + 1)}
                      disabled={!pagination?.has_next}
                      className="relative inline-flex items-center rounded-r-md border border-gray-300 bg-white px-2 py-2 text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <ContactForm
        isOpen={showFormModal}
        contact={activeContact}
        onClose={closeFormModal}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default Contacts;
