import { useState, useEffect } from 'react';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Eye, 
  X, 
  Save, 
  AlertCircle,
  CheckCircle,
  GripVertical,
  BarChart3,
  Filter
} from 'lucide-react';
import customFieldService from '../services/customFieldService';

const CustomFields = () => {
  const [customFields, setCustomFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Filters
  const [entityFilter, setEntityFilter] = useState('lead');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  
  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUsageModal, setShowUsageModal] = useState(false);
  const [selectedField, setSelectedField] = useState(null);
  const [usageStats, setUsageStats] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    field_name: '',
    field_label: '',
    field_description: '',
    entity_type: 'lead',
    data_type: 'text',
    is_required: false,
    is_unique: false,
    is_searchable: true,
    field_options: [],
    validation_rules: {},
    placeholder: '',
    help_text: '',
    default_value: '',
    is_active: true
  });
  
  const [optionInput, setOptionInput] = useState('');

  useEffect(() => {
    fetchCustomFields();
  }, [entityFilter, activeFilter]);

  const fetchCustomFields = async () => {
    setLoading(true);
    setError('');
    
    try {
      const filters = {
        entity_type: entityFilter
      };
      
      if (activeFilter !== 'all') {
        filters.is_active = activeFilter === 'active';
      }

      const response = await customFieldService.getCustomFields(filters);
      setCustomFields(response.data || []);
    } catch (err) {
      console.error('Error fetching custom fields:', err);
      setError('Failed to load custom fields');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateField = async () => {
    setError('');
    setSuccess('');
    
    try {
      // Validate
      if (!formData.field_name || !formData.field_label) {
        setError('Field name and label are required');
        return;
      }

      if (['select', 'multiselect'].includes(formData.data_type) && formData.field_options.length === 0) {
        setError('At least one option is required for dropdown fields');
        return;
      }

      await customFieldService.createCustomField(formData);
      setSuccess('Custom field created successfully!');
      setShowCreateModal(false);
      resetForm();
      fetchCustomFields();
    } catch (err) {
      console.error('Error creating custom field:', err);
      setError(err.response?.data?.error?.message || 'Failed to create custom field');
    }
  };

  const handleUpdateField = async () => {
    setError('');
    setSuccess('');
    
    try {
      if (!formData.field_label) {
        setError('Field label is required');
        return;
      }

      if (['select', 'multiselect'].includes(formData.data_type) && formData.field_options.length === 0) {
        setError('At least one option is required for dropdown fields');
        return;
      }

      await customFieldService.updateCustomField(selectedField.id, formData);
      setSuccess('Custom field updated successfully!');
      setShowEditModal(false);
      resetForm();
      fetchCustomFields();
    } catch (err) {
      console.error('Error updating custom field:', err);
      setError(err.response?.data?.error?.message || 'Failed to update custom field');
    }
  };

  const handleDeleteField = async () => {
    setError('');
    setSuccess('');
    
    try {
      await customFieldService.deleteCustomField(selectedField.id);
      setSuccess('Custom field deleted successfully!');
      setShowDeleteModal(false);
      setSelectedField(null);
      fetchCustomFields();
    } catch (err) {
      console.error('Error deleting custom field:', err);
      setError(err.response?.data?.error?.message || 'Failed to delete custom field');
    }
  };

  const handleViewUsage = async (field) => {
    setError('');
    setUsageStats(null);
    
    try {
      setSelectedField(field);
      const response = await customFieldService.getCustomFieldUsage(field.id);
      setUsageStats(response.data);
      setShowUsageModal(true);
    } catch (err) {
      console.error('Error fetching usage:', err);
      setError('Failed to fetch usage statistics');
    }
  };

  const openEditModal = (field) => {
    setSelectedField(field);
    setFormData({
      field_name: field.field_name,
      field_label: field.field_label,
      field_description: field.field_description || '',
      entity_type: field.entity_type,
      data_type: field.data_type,
      is_required: field.is_required,
      is_unique: field.is_unique,
      is_searchable: field.is_searchable,
      field_options: field.field_options || [],
      validation_rules: field.validation_rules || {},
      placeholder: field.placeholder || '',
      help_text: field.help_text || '',
      default_value: field.default_value || '',
      is_active: field.is_active
    });
    setShowEditModal(true);
  };

  const resetForm = () => {
    setFormData({
      field_name: '',
      field_label: '',
      field_description: '',
      entity_type: entityFilter,
      data_type: 'text',
      is_required: false,
      is_unique: false,
      is_searchable: true,
      field_options: [],
      validation_rules: {},
      placeholder: '',
      help_text: '',
      default_value: '',
      is_active: true
    });
    setOptionInput('');
  };

  const addOption = () => {
    if (optionInput.trim()) {
      setFormData({
        ...formData,
        field_options: [...formData.field_options, optionInput.trim()]
      });
      setOptionInput('');
    }
  };

  const removeOption = (index) => {
    setFormData({
      ...formData,
      field_options: formData.field_options.filter((_, i) => i !== index)
    });
  };

  const getDataTypeIcon = (dataType) => {
    const typeMap = {
      text: '📝',
      textarea: '📄',
      number: '🔢',
      decimal: '💰',
      boolean: '✅',
      date: '📅',
      datetime: '🕐',
      select: '📋',
      multiselect: '☑️',
      email: '📧',
      phone: '📞',
      url: '🔗',
      currency: '💵'
    };
    return typeMap[dataType] || '📝';
  };

  const filteredFields = customFields.filter(field => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        field.field_name.toLowerCase().includes(query) ||
        field.field_label.toLowerCase().includes(query) ||
        (field.field_description && field.field_description.toLowerCase().includes(query))
      );
    }
    return true;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Fields</h1>
          <p className="text-gray-600 mt-1">
            Manage custom fields for your CRM entities
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowCreateModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Custom Field
        </button>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle size={20} />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={20} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Entity Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Entity Type
            </label>
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {customFieldService.ENTITY_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              value={activeFilter}
              onChange={(e) => setActiveFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Fields</option>
              <option value="active">Active Only</option>
              <option value="inactive">Inactive Only</option>
            </select>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search fields..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Custom Fields List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading custom fields...</p>
          </div>
        ) : filteredFields.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-gray-400 text-5xl mb-4">📋</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Custom Fields</h3>
            <p className="text-gray-600 mb-6">
              {searchQuery ? 'No fields match your search criteria' : 'Get started by creating your first custom field'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => {
                  resetForm();
                  setShowCreateModal(true);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus size={20} />
                Create Custom Field
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Field
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFields.map((field) => (
                  <tr key={field.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{getDataTypeIcon(field.data_type)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {field.field_label}
                          </div>
                          <div className="text-xs text-gray-500 font-mono">
                            {field.field_name}
                          </div>
                          {field.field_description && (
                            <div className="text-xs text-gray-600 mt-1">
                              {field.field_description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {field.data_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {field.is_required && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                            Required
                          </span>
                        )}
                        {field.is_unique && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                            Unique
                          </span>
                        )}
                        {field.is_searchable && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Searchable
                          </span>
                        )}
                        {field.is_system_field && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            System
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        field.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {field.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleViewUsage(field)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Usage"
                        >
                          <BarChart3 size={18} />
                        </button>
                        <button
                          onClick={() => openEditModal(field)}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Edit"
                        >
                          <Edit size={18} />
                        </button>
                        {!field.is_system_field && (
                          <button
                            onClick={() => {
                              setSelectedField(field);
                              setShowDeleteModal(true);
                            }}
                            className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <CustomFieldModal
          isEdit={showEditModal}
          formData={formData}
          setFormData={setFormData}
          optionInput={optionInput}
          setOptionInput={setOptionInput}
          addOption={addOption}
          removeOption={removeOption}
          onSave={showEditModal ? handleUpdateField : handleCreateField}
          onClose={() => {
            showCreateModal ? setShowCreateModal(false) : setShowEditModal(false);
            resetForm();
            setSelectedField(null);
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedField && (
        <DeleteConfirmModal
          field={selectedField}
          onConfirm={handleDeleteField}
          onClose={() => {
            setShowDeleteModal(false);
            setSelectedField(null);
          }}
        />
      )}

      {/* Usage Statistics Modal */}
      {showUsageModal && selectedField && usageStats && (
        <UsageStatsModal
          field={selectedField}
          stats={usageStats}
          onClose={() => {
            setShowUsageModal(false);
            setSelectedField(null);
            setUsageStats(null);
          }}
        />
      )}
    </div>
  );
};

// Custom Field Create/Edit Modal Component
const CustomFieldModal = ({
  isEdit,
  formData,
  setFormData,
  optionInput,
  setOptionInput,
  addOption,
  removeOption,
  onSave,
  onClose
}) => {
  const needsOptions = ['select', 'multiselect'].includes(formData.data_type);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white">
          <h2 className="text-xl font-semibold">
            {isEdit ? 'Edit Custom Field' : 'Create Custom Field'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Field Name (disabled for edit) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Name *
              <span className="text-xs text-gray-500 ml-2">(lowercase, underscores only)</span>
            </label>
            <input
              type="text"
              value={formData.field_name}
              onChange={(e) => setFormData({ ...formData, field_name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
              disabled={isEdit}
              placeholder="e.g., budget_range"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              required
            />
          </div>

          {/* Field Label */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Field Label *
            </label>
            <input
              type="text"
              value={formData.field_label}
              onChange={(e) => setFormData({ ...formData, field_label: e.target.value })}
              placeholder="e.g., Budget Range"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Field Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.field_description}
              onChange={(e) => setFormData({ ...formData, field_description: e.target.value })}
              placeholder="Optional description for this field"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Entity Type and Data Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Entity Type *
              </label>
              <select
                value={formData.entity_type}
                onChange={(e) => setFormData({ ...formData, entity_type: e.target.value })}
                disabled={isEdit}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                required
              >
                {customFieldService.ENTITY_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Type *
              </label>
              <select
                value={formData.data_type}
                onChange={(e) => setFormData({ ...formData, data_type: e.target.value, field_options: [] })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {customFieldService.DATA_TYPES.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Options for Select/Multiselect */}
          {needsOptions && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Options *
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={optionInput}
                    onChange={(e) => setOptionInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOption())}
                    placeholder="Type an option and press Enter"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={addOption}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Add
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.field_options.map((option, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {option}
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="hover:text-blue-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Placeholder and Help Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Placeholder
              </label>
              <input
                type="text"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                placeholder="e.g., Enter amount"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Help Text
              </label>
              <input
                type="text"
                value={formData.help_text}
                onChange={(e) => setFormData({ ...formData, help_text: e.target.value })}
                placeholder="e.g., Select your budget range"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_required}
                onChange={(e) => setFormData({ ...formData, is_required: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Required field</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_unique}
                onChange={(e) => setFormData({ ...formData, is_unique: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Unique values only</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_searchable}
                onChange={(e) => setFormData({ ...formData, is_searchable: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Searchable</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">Active</span>
            </label>
          </div>
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Save size={18} />
            {isEdit ? 'Update Field' : 'Create Field'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Delete Confirmation Modal
const DeleteConfirmModal = ({ field, onConfirm, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-red-100 rounded-full">
              <AlertCircle className="text-red-600" size={24} />
            </div>
            <h2 className="text-xl font-semibold">Delete Custom Field?</h2>
          </div>

          <p className="text-gray-600 mb-4">
            Are you sure you want to delete the custom field <strong>{field.field_label}</strong>?
            This action cannot be undone.
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>Warning:</strong> This field can only be deleted if it's not being used in any records.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              Delete Field
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Usage Statistics Modal
const UsageStatsModal = ({ field, stats, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-semibold">Usage Statistics</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">{field.field_label}</h3>
            <p className="text-sm text-gray-500 font-mono">{field.field_name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="text-sm text-blue-600 font-medium mb-1">Total Usage</div>
              <div className="text-3xl font-bold text-blue-900">{stats.usage_count || 0}</div>
              <div className="text-xs text-blue-600 mt-1">records</div>
            </div>

            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm text-purple-600 font-medium mb-1">Unique Values</div>
              <div className="text-3xl font-bold text-purple-900">{stats.unique_values_count || 0}</div>
              <div className="text-xs text-purple-600 mt-1">distinct values</div>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-sm text-green-600 font-medium mb-1">Last Used</div>
              <div className="text-sm font-medium text-green-900">
                {stats.last_used_at ? new Date(stats.last_used_at).toLocaleDateString() : 'Never'}
              </div>
              <div className="text-xs text-green-600 mt-1">
                {stats.last_used_at ? new Date(stats.last_used_at).toLocaleTimeString() : '-'}
              </div>
            </div>
          </div>

          {stats.usage_count === 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
              <p className="text-gray-600">
                This field is not currently being used in any records.
              </p>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomFields;

