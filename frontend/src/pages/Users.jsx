import { Fragment, useEffect, useMemo, useState } from 'react';
import { Menu, Transition } from '@headlessui/react';
import {
  PlusIcon,
  MagnifyingGlassIcon,
  ChevronUpDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EllipsisVerticalIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import userService from '../services/userService';
import useDebounce from '../hooks/useDebounce';
import Modal from '../components/Modal';
import UserForm from '../components/UserForm';
import { MobileOnly, TabletAndDesktop, ContentWrapper, ResponsiveTableWrapper } from '../components/ResponsiveUtils';
import UsersTableMobile from '../components/Users/UsersTableMobile';

const ROLE_LABELS = {
  super_admin: 'Super Admin',
  company_admin: 'Company Admin',
  manager: 'Manager',
  sales_rep: 'Sales Rep'
};

const ROLE_FILTER_OPTIONS = [
  { label: 'All roles', value: 'all' },
  { label: 'Company Admin', value: 'company_admin' },
  { label: 'Manager', value: 'manager' },
  { label: 'Sales Rep', value: 'sales_rep' },
  { label: 'Super Admin', value: 'super_admin' }
];

const STATUS_FILTER_OPTIONS = [
  { label: 'All statuses', value: 'all' },
  { label: 'Active', value: 'active' },
  { label: 'Inactive', value: 'inactive' }
];

const INITIAL_TABLE_STATE = {
  page: 1,
  pageSize: 20,
  search: '',
  role: 'all',
  status: 'all',
  sortBy: 'created_at',
  sortDirection: 'desc'
};

const STATUS_BADGE_CLASSES = {
  active: 'bg-green-100 text-green-700 ring-green-600/20',
  inactive: 'bg-rose-100 text-rose-700 ring-rose-600/20'
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const getStatusMeta = (isActive) => {
  if (isActive) {
    return {
      label: 'Active',
      classes: STATUS_BADGE_CLASSES.active,
      Icon: CheckCircleIcon
    };
  }

  return {
    label: 'Inactive',
    classes: STATUS_BADGE_CLASSES.inactive,
    Icon: XCircleIcon
  };
};

const ConfirmActionModal = ({
  open,
  title,
  description,
  confirmLabel,
  confirmTone = 'danger',
  confirmLoading = false,
  onConfirm,
  onCancel
}) => {
  if (!open) return null;

  return (
    <Modal isOpen={open} onClose={confirmLoading ? () => {} : onCancel} title={title} size="sm">
      <p className="text-sm text-gray-600">{description}</p>
      <div className="mt-6 flex justify-end space-x-3">
        <button
          type="button"
          className="btn-secondary"
          onClick={onCancel}
          disabled={confirmLoading}
        >
          Cancel
        </button>
        <button
          type="button"
          className={confirmTone === 'danger' ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={confirmLoading}
        >
          {confirmLoading ? 'Processing...' : confirmLabel}
        </button>
      </div>
    </Modal>
  );
};

const Users = () => {
  const { user } = useAuth();
  const hasAccess = ['company_admin', 'super_admin'].includes(user?.role);

  const [tableState, setTableState] = useState(INITIAL_TABLE_STATE);
  const [users, setUsers] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [formModal, setFormModal] = useState({ mode: null, user: null });
  const [confirmState, setConfirmState] = useState({ open: false, user: null, intent: null });
  const [actionState, setActionState] = useState({ id: null, type: null });

  const debouncedSearch = useDebounce(tableState.search, 400);
  const normalizedSearch = debouncedSearch.trim();

  const queryParams = useMemo(() => {
    if (!hasAccess) {
      return null;
    }

    const params = {
      page: tableState.page,
      limit: tableState.pageSize,
      sort_by: tableState.sortBy,
      sort_order: tableState.sortDirection
    };

    if (normalizedSearch) {
      params.search = normalizedSearch;
    }

    if (tableState.role !== 'all') {
      params.role = tableState.role;
    }

    if (tableState.status !== 'all') {
      params.is_active = tableState.status === 'active' ? 'true' : 'false';
    }

    return params;
  }, [
    hasAccess,
    tableState.page,
    tableState.pageSize,
    tableState.role,
    tableState.status,
    tableState.sortBy,
    tableState.sortDirection,
    normalizedSearch
  ]);

  useEffect(() => {
    let cancelled = false;

    if (!hasAccess || !queryParams) {
      setLoading(false);
      return () => {};
    }

    const fetchUsers = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await userService.getUsers(queryParams);
        if (cancelled) return;

        const { data: fetchedUsers = [], pagination: meta } = response || {};

        setUsers(fetchedUsers);
        setPagination(meta ?? null);
      } catch (err) {
        if (cancelled) return;
        const message =
          err?.message ||
          err?.error ||
          err?.details ||
          'Failed to load users.';
        setError(typeof message === 'string' ? message : 'Failed to load users.');
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [hasAccess, queryParams, refreshKey, user]);

  if (!hasAccess) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900">Access Denied</h3>
        <p className="mt-2 text-sm text-gray-500">
          You don&apos;t have permission to view this page.
        </p>
      </div>
    );
  }

  const currentPage = pagination?.current_page ?? tableState.page;
  const totalPages = Math.max(pagination?.total_pages ?? 1, 1);
  const totalItems = pagination?.total_items ?? users.length;
  const pageSize = pagination?.items_per_page ?? tableState.pageSize;
  const hasPreviousPage = pagination?.has_prev ?? currentPage > 1;
  const hasNextPage = pagination?.has_next ?? currentPage < totalPages;

  const isFiltered =
    tableState.role !== 'all' ||
    tableState.status !== 'all' ||
    Boolean(normalizedSearch);

  const handleSearchChange = (event) => {
    const { value } = event.target;
    setTableState((prev) => ({
      ...prev,
      search: value,
      page: 1
    }));
  };

  const handleRoleFilterChange = (event) => {
    const { value } = event.target;
    setTableState((prev) => ({
      ...prev,
      role: value,
      page: 1
    }));
  };

  const handleStatusFilterChange = (event) => {
    const { value } = event.target;
    setTableState((prev) => ({
      ...prev,
      status: value,
      page: 1
    }));
  };

  const handleSortChange = (field) => {
    setTableState((prev) => {
      const isSameField = prev.sortBy === field;
      const nextDirection = isSameField
        ? prev.sortDirection === 'asc'
          ? 'desc'
          : 'asc'
        : 'asc';

      return {
        ...prev,
        sortBy: field,
        sortDirection: nextDirection,
        page: 1
      };
    });
  };

  const handlePageChange = (page) => {
    if (page < 1 || page > totalPages) return;

    setTableState((prev) => ({
      ...prev,
      page
    }));
  };

  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value) || INITIAL_TABLE_STATE.pageSize;

    setTableState((prev) => ({
      ...prev,
      page: 1,
      pageSize: nextSize
    }));
  };

  const handleResetFilters = () => {
    setTableState((prev) => ({
      ...INITIAL_TABLE_STATE,
      pageSize: prev.pageSize
    }));
  };

  const triggerRefresh = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const openCreateModal = () => {
    setFormModal({ mode: 'create', user: null });
  };

  const openEditModal = (userRecord) => {
    setFormModal({ mode: 'edit', user: userRecord });
  };

  const closeFormModal = () => {
    setFormModal({ mode: null, user: null });
  };

  const openConfirmModal = (userRecord, intent) => {
    if (userRecord.id === user.id && intent === 'deactivate') {
      toast.error('You cannot deactivate your own account.');
      return;
    }

    setActionState({ id: null, type: null });
    setConfirmState({
      open: true,
      user: userRecord,
      intent
    });
  };

  const closeConfirmModal = () => {
    setConfirmState({ open: false, user: null, intent: null });
  };

  const handleDeactivate = async (userRecord) => {
    setActionState({ id: userRecord.id, type: 'deactivate' });
    try {
      await userService.deactivateUser(userRecord.id);
      toast.success(`${userRecord.first_name} ${userRecord.last_name} deactivated.`);
      triggerRefresh();
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        'Failed to deactivate user.';
      toast.error(message);
    } finally {
      setActionState({ id: null, type: null });
      closeConfirmModal();
    }
  };

  const handleReactivate = async (userRecord) => {
    setActionState({ id: userRecord.id, type: 'reactivate' });
    try {
      await userService.updateUser(userRecord.id, { is_active: true });
      toast.success(`${userRecord.first_name} ${userRecord.last_name} reactivated.`);
      triggerRefresh();
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        'Failed to reactivate user.';
      toast.error(message);
    } finally {
      setActionState({ id: null, type: null });
      closeConfirmModal();
    }
  };

  const handleResendInvite = async (userRecord) => {
    setActionState({ id: userRecord.id, type: 'resend-invite' });
    try {
      await userService.resendInvite(userRecord.id);
      toast.success(`Invitation email sent to ${userRecord.email}.`);
    } catch (err) {
      const message =
        err?.message ||
        err?.error ||
        'Failed to resend invite.';
      toast.error(message);
    } finally {
      setActionState({ id: null, type: null });
    }
  };

  const handleConfirmSubmit = () => {
    if (!confirmState.user) return;

    if (confirmState.intent === 'deactivate') {
      handleDeactivate(confirmState.user);
    } else if (confirmState.intent === 'reactivate') {
      handleReactivate(confirmState.user);
    }
  };

  const renderSortIcon = (field) => {
    const active = tableState.sortBy === field;

    return (
      <ChevronUpDownIcon
        className={clsx('ml-1 h-4 w-4 transition-colors', {
          'text-primary-600': active,
          'text-gray-400': !active
        })}
      />
    );
  };

  const emptyStateMessage = isFiltered
    ? 'No users match your filters.'
    : user?.company_name
      ? `No users found in ${user.company_name} yet. Start by inviting your team.`
      : 'No users found yet. Start by inviting your team.';

  return (
    <div>
      {/* DEBUG INFO BANNER - Remove after diagnosis */}
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user accounts, permissions, and status for your organisation.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 flex items-center space-x-3 sm:flex-none">
          <button
            type="button"
            className="btn-secondary inline-flex items-center"
            onClick={() => triggerRefresh()}
            disabled={loading}
          >
            <ArrowPathIcon className={clsx('h-4 w-4 mr-2', { 'animate-spin': loading })} />
            Refresh
          </button>
          <button
            type="button"
            className="btn-primary inline-flex items-center"
            onClick={openCreateModal}
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            Add User
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <div className="sm:col-span-2">
          <label htmlFor="user-search" className="sr-only">
            Search users
          </label>
          <div className="relative">
            <MagnifyingGlassIcon className="pointer-events-none absolute inset-y-0 left-3 my-auto h-5 w-5 text-gray-400" />
            <input
              id="user-search"
              type="search"
              value={tableState.search}
              onChange={handleSearchChange}
              placeholder="Search by name or email"
              className="input pl-10"
            />
          </div>
        </div>

        <div>
          <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            id="role-filter"
            value={tableState.role}
            onChange={handleRoleFilterChange}
            className="input"
          >
            {ROLE_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
            Status
          </label>
          <select
            id="status-filter"
            value={tableState.status}
            onChange={handleStatusFilterChange}
            className="input"
          >
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="card bg-rose-50 border border-rose-200 text-rose-700 mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-semibold">Unable to load users</h3>
              <p className="mt-1 text-sm">{error}</p>
            </div>
            <button
              type="button"
              className="btn-secondary"
              onClick={triggerRefresh}
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Mobile View */}
      <MobileOnly className="mb-8">
        <UsersTableMobile
          users={users}
          loading={loading}
          onEdit={openEditModal}
          onReactivate={handleReactivate}
          onDeactivate={handleDeactivate}
          roleLabels={ROLE_LABELS}
        />
      </MobileOnly>

      {/* Desktop View */}
      <TabletAndDesktop className="card overflow-hidden">
        <ResponsiveTableWrapper>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                User
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSortChange('role')}
              >
                <span className="inline-flex items-center">
                  Role
                  {renderSortIcon('role')}
                </span>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSortChange('is_active')}
              >
                <span className="inline-flex items-center">
                  Status
                  {renderSortIcon('is_active')}
                </span>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSortChange('last_sign_in_at')}
              >
                <span className="inline-flex items-center">
                  Last Active
                  {renderSortIcon('last_sign_in_at')}
                </span>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer select-none"
                onClick={() => handleSortChange('created_at')}
              >
                <span className="inline-flex items-center">
                  Created
                  {renderSortIcon('created_at')}
                </span>
              </th>
              <th scope="col" className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading && (
              <tr>
                <td colSpan={6} className="px-6 py-10">
                  <div className="flex flex-col space-y-3">
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
                    <div className="h-4 bg-gray-200 rounded animate-pulse w-2/3" />
                  </div>
                </td>
              </tr>
            )}

            {!loading && users.map((userItem) => {
              const { label, classes, Icon } = getStatusMeta(userItem.is_active);

              return (
                <tr key={userItem.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-700">
                            {userItem.first_name?.[0]?.toUpperCase()}{userItem.last_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {userItem.first_name} {userItem.last_name}
                        </div>
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-medium text-gray-900">
                      {ROLE_LABELS[userItem.role] ?? userItem.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={clsx('inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset', classes)}>
                      <Icon className="h-4 w-4 mr-1" />
                      {label}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(userItem.last_sign_in_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDateTime(userItem.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Menu as="div" className="relative inline-block text-left">
                      <div>
                        <Menu.Button className="inline-flex justify-center w-full rounded-full p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                          <EllipsisVerticalIcon className="h-5 w-5" aria-hidden="true" />
                        </Menu.Button>
                      </div>
                      <Transition
                        as={Fragment}
                        enter="transition ease-out duration-100"
                        enterFrom="transform opacity-0 scale-95"
                        enterTo="transform opacity-100 scale-100"
                        leave="transition ease-in duration-75"
                        leaveFrom="transform opacity-100 scale-100"
                        leaveTo="transform opacity-0 scale-95"
                      >
                        <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                          <div className="py-1">
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => openEditModal(userItem)}
                                  className={clsx(
                                    'w-full px-4 py-2 text-left text-sm',
                                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                                  )}
                                >
                                  Edit details
                                </button>
                              )}
                            </Menu.Item>
                            <Menu.Item>
                              {({ active }) => (
                                <button
                                  type="button"
                                  onClick={() => handleResendInvite(userItem)}
                                  className={clsx(
                                    'w-full px-4 py-2 text-left text-sm',
                                    active ? 'bg-blue-100 text-blue-700' : 'text-blue-600'
                                  )}
                                  disabled={actionState.id === userItem.id && actionState.type === 'resend-invite'}
                                >
                                  {actionState.id === userItem.id && actionState.type === 'resend-invite'
                                    ? 'Sending invitation...'
                                    : 'Resend invite'}
                                </button>
                              )}
                            </Menu.Item>
                            {userItem.is_active ? (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    type="button"
                                    onClick={() => openConfirmModal(userItem, 'deactivate')}
                                    className={clsx(
                                      'w-full px-4 py-2 text-left text-sm',
                                      active ? 'bg-rose-100 text-rose-700' : 'text-rose-600'
                                    )}
                                    disabled={actionState.id === userItem.id && actionState.type === 'deactivate'}
                                  >
                                    {actionState.id === userItem.id && actionState.type === 'deactivate'
                                      ? 'Deactivating...'
                                      : 'Deactivate'}
                                  </button>
                                )}
                              </Menu.Item>
                            ) : (
                              <Menu.Item>
                                {({ active }) => (
                                  <button
                                    type="button"
                                    onClick={() => openConfirmModal(userItem, 'reactivate')}
                                    className={clsx(
                                      'w-full px-4 py-2 text-left text-sm',
                                      active ? 'bg-green-100 text-green-700' : 'text-green-600'
                                    )}
                                    disabled={actionState.id === userItem.id && actionState.type === 'reactivate'}
                                  >
                                    {actionState.id === userItem.id && actionState.type === 'reactivate'
                                      ? 'Reactivating...'
                                      : 'Reactivate'}
                                  </button>
                                )}
                              </Menu.Item>
                            )}
                          </div>
                        </Menu.Items>
                      </Transition>
                    </Menu>
                  </td>
                </tr>
              );
            })}

            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-16 text-center">
                  <p className="text-sm font-medium text-gray-900">{emptyStateMessage}</p>
                  <div className="mt-4 flex justify-center space-x-3">
                    {isFiltered && (
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={handleResetFilters}
                      >
                        Reset filters
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={openCreateModal}
                    >
                      Add your first user
                    </button>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
          </table>
        </ResponsiveTableWrapper>
      </TabletAndDesktop>

      <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="text-sm text-gray-600">
          Showing{' '}
          <span className="font-semibold text-gray-900">
            {users.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}
          </span>
          {' '}to{' '}
          <span className="font-semibold text-gray-900">
            {users.length > 0 ? (currentPage - 1) * pageSize + users.length : 0}
          </span>
          {' '}of{' '}
          <span className="font-semibold text-gray-900">{totalItems}</span> users
        </div>
        <div className="flex items-center space-x-3">
          <label htmlFor="page-size" className="text-sm text-gray-600">
            Rows per page
          </label>
          <select
            id="page-size"
            className="input w-24"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            {[10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <div className="flex items-center space-x-2">
            <button
              type="button"
              className="btn-secondary px-2.5 py-1.5"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={!hasPreviousPage}
            >
              <ChevronLeftIcon className="h-4 w-4" />
            </button>
            <span className="text-sm text-gray-700">
              Page <span className="font-semibold text-gray-900">{currentPage}</span> of{' '}
              <span className="font-semibold text-gray-900">{totalPages}</span>
            </span>
            <button
              type="button"
              className="btn-secondary px-2.5 py-1.5"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={!hasNextPage}
            >
              <ChevronRightIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {formModal.mode && (
        <UserForm
          user={formModal.mode === 'edit' ? formModal.user : null}
          onClose={closeFormModal}
          onSuccess={triggerRefresh}
        />
      )}

      <ConfirmActionModal
        open={confirmState.open}
        title={
          confirmState.intent === 'deactivate'
            ? 'Deactivate user'
            : 'Reactivate user'
        }
        description={
          confirmState.intent === 'deactivate'
            ? 'They will immediately lose access to the platform. You can reactivate them at any time.'
            : 'They will regain access to the platform immediately.'
        }
        confirmLabel={
          confirmState.intent === 'deactivate' ? 'Deactivate user' : 'Reactivate user'
        }
        confirmTone={confirmState.intent === 'deactivate' ? 'danger' : 'primary'}
        confirmLoading={
          confirmState.user
            ? actionState.id === confirmState.user.id && actionState.type === confirmState.intent
            : false
        }
        onConfirm={handleConfirmSubmit}
        onCancel={closeConfirmModal}
      />
    </div>
  );
};

export default Users;
