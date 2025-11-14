import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';
import {
  BookOpenIcon,
  SparklesIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  DocumentDuplicateIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const WorkflowLibrary = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [packs, setPacks] = useState([]);
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'packs'
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [industryFilter, setIndustryFilter] = useState('all');
  const [showImportModal, setShowImportModal] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Pack details modal state
  const [selectedPack, setSelectedPack] = useState(null);
  const [packLoading, setPackLoading] = useState(false);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'welcome', label: 'Welcome' },
    { value: 'nurture', label: 'Nurture' },
    { value: 'demo', label: 'Demo Booking' },
    { value: 'recovery', label: 'Recovery' },
    { value: 'onboarding', label: 'Onboarding' },
    { value: 're-engagement', label: 'Re-engagement' }
  ];

  const industries = [
    { value: 'all', label: 'All Industries' },
    { value: 'general', label: 'General' },
    { value: 'real_estate', label: 'Real Estate' },
    { value: 'education', label: 'Education' },
    { value: 'healthcare', label: 'Healthcare' },
    { value: 'saas', label: 'SaaS' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, packsRes] = await Promise.all([
        emailService.getWorkflowTemplates({ include_public: true }),
        emailService.getWorkflowTemplatePacks()
      ]);
      setTemplates(templatesRes.data || []);
      setPacks(packsRes.data || []);
    } catch (error) {
      console.error('Error fetching workflow library:', error);
      toast.error('Failed to load workflow library');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFromTemplate = async (template) => {
    try {
      const sequenceName = prompt('Enter a name for your new sequence:', template.name);
      if (!sequenceName) return;

      toast.loading('Creating sequence...', { id: 'create-sequence' });
      const response = await emailService.createSequenceFromTemplate(template.id, {
        name: sequenceName
      });

      toast.success('Sequence created successfully!', { id: 'create-sequence' });
      navigate(`/app/email/sequences/${response.data.id}`);
    } catch (error) {
      console.error('Error creating sequence from template:', error);
      toast.error(error.response?.data?.message || 'Failed to create sequence', { id: 'create-sequence' });
    }
  };

  const handleExport = async (template) => {
    try {
      toast.loading('Exporting template...', { id: 'export' });
      await emailService.exportWorkflowTemplate(template.id);
      toast.success('Template exported successfully!', { id: 'export' });
    } catch (error) {
      console.error('Error exporting template:', error);
      toast.error('Failed to export template', { id: 'export' });
    }
  };

  const handleImport = async () => {
    if (!importFile) {
      toast.error('Please select a file to import');
      return;
    }

    try {
      toast.loading('Importing template...', { id: 'import' });
      const text = await importFile.text();
      const importData = JSON.parse(text);
      
      await emailService.importWorkflowTemplate(importData);
      toast.success('Template imported successfully!', { id: 'import' });
      setShowImportModal(false);
      setImportFile(null);
      fetchData();
    } catch (error) {
      console.error('Error importing template:', error);
      toast.error(error.response?.data?.message || 'Failed to import template', { id: 'import' });
    }
  };

  const handleDelete = async (template) => {
    if (!window.confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await emailService.deleteWorkflowTemplate(template.id);
      toast.success('Template deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleSaveAsTemplate = () => {
    // This will be called from EmailSequences page
    navigate('/app/email/sequences');
  };

  const filteredTemplates = templates.filter(template => {
    if (searchQuery && !template.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !template.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (categoryFilter !== 'all' && template.category !== categoryFilter) {
      return false;
    }
    if (industryFilter !== 'all' && template.industry !== industryFilter) {
      return false;
    }
    return true;
  });

  const filteredPacks = packs.filter(pack => {
    if (searchQuery && !pack.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !pack.description?.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    if (industryFilter !== 'all' && pack.industry !== industryFilter) {
      return false;
    }
    return true;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <BookOpenIcon className="h-8 w-8 mr-3 text-primary-600" />
            Workflow Library
          </h1>
          <p className="text-gray-600 mt-1">
            Browse pre-built automation templates and industry-specific packs
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImportModal(true)}
            className="btn-secondary"
          >
            <ArrowUpTrayIcon className="h-5 w-5 mr-2" />
            Import
          </button>
          <button
            onClick={handleSaveAsTemplate}
            className="btn-primary"
          >
            Save Current Sequence as Template
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'templates'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Templates ({filteredTemplates.length})
          </button>
          <button
            onClick={() => setActiveTab('packs')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'packs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Industry Packs ({filteredPacks.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="flex-1 min-w-[300px]">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          disabled={activeTab === 'packs'}
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        <select
          value={industryFilter}
          onChange={(e) => setIndustryFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        >
          {industries.map(ind => (
            <option key={ind.value} value={ind.value}>{ind.label}</option>
          ))}
        </select>
      </div>

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <SparklesIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No templates found</p>
            </div>
          ) : (
            filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {template.name}
                    </h3>
                    {template.is_public && (
                      <span className="inline-block px-2 py-1 text-xs bg-primary-100 text-primary-700 rounded">
                        Public
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                  {template.description || 'No description'}
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  {template.category && (
                    <span className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded">
                      {template.category}
                    </span>
                  )}
                  {template.industry && (
                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {template.industry}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{template.usage_count || 0} uses</span>
                  <span>{template.json_definition?.steps?.length || 0} steps</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCreateFromTemplate(template)}
                    className="flex-1 btn-primary text-sm py-2"
                  >
                    <DocumentDuplicateIcon className="h-4 w-4 mr-1 inline" />
                    Use Template
                  </button>
                  <button
                    onClick={() => handleExport(template)}
                    className="btn-secondary text-sm py-2 px-3"
                    title="Export"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                  </button>
                  {!template.is_public && (
                    <button
                      onClick={() => handleDelete(template)}
                      className="btn-secondary text-sm py-2 px-3 text-red-600 hover:bg-red-50"
                      title="Delete"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Packs Tab */}
      {activeTab === 'packs' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPacks.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <FolderIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No packs found</p>
            </div>
          ) : (
            filteredPacks.map(pack => (
              <div
                key={pack.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {pack.name}
                    </h3>
                    <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                      {pack.industry}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  {pack.description || 'No description'}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>{pack.templates?.length || 0} templates</span>
                  <span>{pack.download_count || 0} downloads</span>
                </div>
                <button
                  onClick={async () => {
                    try {
                      setPackLoading(true);
                      const res = await emailService.getWorkflowTemplatePack(pack.id);
                      setSelectedPack(res.data || res);
                    } catch (e) {
                      console.error('Failed to load pack', e);
                      toast.error('Failed to load pack');
                    } finally {
                      setPackLoading(false);
                    }
                  }}
                  className="w-full btn-primary text-sm py-2"
                >
                  {packLoading ? 'Loading...' : 'View Pack'}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Pack Details Modal */}
      {selectedPack && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-xl font-semibold">{selectedPack.name}</h2>
                <p className="text-gray-600 text-sm">{selectedPack.description}</p>
              </div>
              <button onClick={() => setSelectedPack(null)} className="text-gray-400 hover:text-gray-600">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <div className="mb-4">
              <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded">
                {selectedPack.industry}
              </span>
            </div>

            <div className="border rounded-md">
              <div className="px-4 py-2 border-b font-medium">Templates in this pack</div>
              <div className="max-h-80 overflow-y-auto">
                {(selectedPack.templates || []).length === 0 ? (
                  <div className="p-4 text-gray-600">No templates in this pack.</div>
                ) : (
                  selectedPack.templates.map((t) => (
                    <div key={t.id} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                      <div>
                        <div className="font-semibold text-gray-900">{t.name}</div>
                        {t.category && (
                          <div className="text-xs text-gray-500">{t.category}</div>
                        )}
                      </div>
                      <button
                        onClick={() => handleCreateFromTemplate(t)}
                        className="btn-primary text-sm"
                      >
                        <DocumentDuplicateIcon className="h-4 w-4 mr-1 inline" />
                        Use Template
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Import Template</h2>
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select JSON file
              </label>
              <input
                type="file"
                accept=".json"
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => {
                  setShowImportModal(false);
                  setImportFile(null);
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile}
                className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkflowLibrary;

