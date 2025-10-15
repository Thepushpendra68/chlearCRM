import { useCallback, useEffect, useMemo, useState } from 'react';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, XMarkIcon } from '@heroicons/react/24/outline';
import picklistService from '../../services/picklistService';
import { usePicklists } from '../../context/PicklistContext';
import toast from 'react-hot-toast';

const normalizeValue = (value = '') => {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
};

const EMPTY_FORM = {
  label: '',
  value: '',
  type: 'source'
};

const typeConfig = {
  source: {
    title: 'Lead Sources',
    description: 'Manage the list of sources available when creating or importing leads.'
  },
  status: {
    title: 'Lead Statuses',
    description: 'Update the workflow statuses used across the CRM and analytics dashboards.'
  }
};

const actionButtonStyles =
  'inline-flex items-center px-2 py-1 border border-gray-200 rounded-md text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed';

const LeadPicklistSettings = () => {
  const { fetchLeadPicklists, refreshLeadPicklists } = usePicklists();
  const [form, setForm] = useState(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState({ sources: [], statuses: [] });
  const [error, setError] = useState(null);

  const sortedPicklists = useMemo(() => ({
    sources: [...(data.sources || [])].sort((a, b) => a.sort_order - b.sort_order),
    statuses: [...(data.statuses || [])].sort((a, b) => a.sort_order - b.sort_order)
  }), [data]);

  const loadPicklists = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await picklistService.getLeadPicklists({ includeInactive: true });
      setData({
        sources: result?.sources || [],
        statuses: result?.statuses || []
      });
    } catch (err) {
      console.error('Failed to load picklists', err);
      setError(err?.message || 'Failed to load picklists');
      toast.error('Failed to load picklists');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPicklists();
  }, [loadPicklists]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'label' && !prev.value
        ? { value: normalizeValue(value) }
        : {})
    }));
  };

  const resetForm = () => setForm(EMPTY_FORM);

  const syncPicklists = async () => {
    await loadPicklists();
    await fetchLeadPicklists({ includeInactive: false, silent: true }).catch(() => null);
    refreshLeadPicklists?.();
  };

  const handleCreate = async (event) => {
    event.preventDefault();
    if (!form.label.trim()) {
      toast.error('Label is required');
      return;
    }

    const payload = {
      type: form.type,
      label: form.label.trim(),
      sortOrder: (sortedPicklists[`${form.type}s`]?.length || 0) + 1
    };

    if (form.value.trim()) {
      payload.value = normalizeValue(form.value);
    }

    try {
      setSaving(true);
      await picklistService.createLeadOption(payload);
      toast.success('Picklist option created');
      resetForm();
      await syncPicklists();
    } catch (err) {
      console.error('Failed to create picklist option', err);
      const message = err?.error?.message || err?.message || 'Failed to create picklist option';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (option) => {
    try {
      setSaving(true);
      await picklistService.updateLeadOption(option.id, { isActive: !option.is_active });
      toast.success(`Option ${option.is_active ? 'disabled' : 'enabled'}`);
      await syncPicklists();
    } catch (err) {
      console.error('Failed to update option state', err);
      toast.error(err?.message || 'Failed to update option');
    } finally {
      setSaving(false);
    }
  };

  const handleRename = async (option) => {
    const nextLabel = window.prompt('Update label', option.label);
    if (!nextLabel || nextLabel.trim() === option.label) {
      return;
    }

    try {
      setSaving(true);
      await picklistService.updateLeadOption(option.id, { label: nextLabel.trim() });
      toast.success('Option updated');
      await syncPicklists();
    } catch (err) {
      console.error('Failed to rename option', err);
      toast.error(err?.message || 'Failed to rename option');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (option) => {
    if (!window.confirm(`Delete "${option.label}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setSaving(true);
      await picklistService.deleteLeadOption(option.id);
      toast.success('Option deleted');
      await syncPicklists();
    } catch (err) {
      console.error('Failed to delete option', err);
      toast.error(err?.message || 'Failed to delete option');
    } finally {
      setSaving(false);
    }
  };

  const handleMove = async (type, optionId, direction) => {
    const key = type === 'source' ? 'sources' : 'statuses';
    const options = [...sortedPicklists[key]];
    const index = options.findIndex((item) => item.id === optionId);

    if (index === -1) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= options.length) return;

    const reordered = [...options];
    const [target] = reordered.splice(index, 1);
    reordered.splice(nextIndex, 0, target);

    try {
      setSaving(true);
      await picklistService.reorderLeadOptions({
        type,
        orderedIds: reordered.map((item) => item.id)
      });
      await syncPicklists();
    } catch (err) {
      console.error('Failed to reorder picklist', err);
      toast.error(err?.message || 'Failed to reorder options');
    } finally {
      setSaving(false);
    }
  };

  const renderSection = (type) => {
    const list = sortedPicklists[`${type}s`] || [];
    const config = typeConfig[type];

    return (
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{config.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{config.description}</p>
          </div>
        </header>

        <div className="overflow-hidden border border-gray-200 rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Label
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {list.map((option, index) => (
                <tr key={option.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-3">
                    <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-gray-600 text-xs">
                      {option.sort_order}
                    </span>
                    {option.label}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    <code className="px-2 py-1 bg-gray-100 rounded-md text-xs">
                      {option.value}
                    </code>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {option.is_active ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        className={actionButtonStyles}
                        onClick={() => handleMove(type, option.id, -1)}
                        disabled={index === 0 || saving}
                        title="Move up"
                      >
                        <ArrowUpIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={actionButtonStyles}
                        onClick={() => handleMove(type, option.id, 1)}
                        disabled={index === list.length - 1 || saving}
                        title="Move down"
                      >
                        <ArrowDownIcon className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        className={actionButtonStyles}
                        onClick={() => handleRename(option)}
                        disabled={saving}
                      >
                        Rename
                      </button>
                      <button
                        type="button"
                        className={actionButtonStyles}
                        onClick={() => handleToggleActive(option)}
                        disabled={saving}
                      >
                        {option.is_active ? 'Disable' : 'Enable'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(option)}
                        className="inline-flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs font-medium hover:bg-red-100 transition-colors disabled:opacity-40"
                        disabled={saving}
                      >
                        <XMarkIcon className="h-4 w-4 mr-1" />
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-6 text-center text-sm text-gray-500">
                    No options configured yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-start sm:items-center sm:justify-between flex-col sm:flex-row gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Lead Picklists</h2>
            <p className="text-sm text-gray-500 mt-1">
              Configure the selectable values for lead sources and statuses used across the CRM.
            </p>
          </div>
          <button
            type="button"
            onClick={loadPicklists}
            className="inline-flex items-center px-4 py-2 border border-gray-200 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            disabled={loading}
          >
            Refresh
          </button>
        </div>

        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-5 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Label
            </label>
            <input
              type="text"
              name="label"
              value={form.label}
              onChange={handleInputChange}
              placeholder="e.g. Paid Campaign"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custom Value (optional)
            </label>
            <input
              type="text"
              name="value"
              value={form.value}
              onChange={handleInputChange}
              placeholder="Auto-generated from label if empty"
              className="w-full rounded-md border-gray-300 focus:border-primary-500 focus:ring-primary-500 text-sm"
            />
          </div>
          <div className="sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type
            </label>
            <div className="flex gap-2">
              <label className="flex items-center text-sm text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="source"
                  checked={form.type === 'source'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-1">Source</span>
              </label>
              <label className="flex items-center text-sm text-gray-700">
                <input
                  type="radio"
                  name="type"
                  value="status"
                  checked={form.type === 'status'}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-1">Status</span>
              </label>
            </div>
          </div>
          <div className="sm:col-span-5 flex justify-end">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={saving}
            >
              <PlusIcon className="h-4 w-4 mr-1" />
              Add Option
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 border border-red-100 p-4 text-sm text-red-700">
            {error}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {renderSection('source')}
        {renderSection('status')}
      </div>
    </div>
  );
};

export default LeadPicklistSettings;
