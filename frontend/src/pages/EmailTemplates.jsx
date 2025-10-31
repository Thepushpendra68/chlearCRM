import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import {
  EnvelopeIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FolderIcon,
  TrashIcon,
  PencilIcon,
  DocumentDuplicateIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';

const EmailTemplates = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterActive, setFilterActive] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [templatesRes, foldersRes] = await Promise.all([
        emailService.getTemplates(),
        emailService.getFolders()
      ]);
      setTemplates(templatesRes.data || []);
      setFolders(foldersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (templateId, templateName) => {
    if (!window.confirm(`Are you sure you want to delete "${templateName}"?`)) {
      return;
    }

    try {
      await emailService.deleteTemplate(templateId);
      toast.success('Template deleted successfully');
      fetchData();
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleDuplicate = async (template) => {
    try {
      const newTemplate = {
        name: `${template.name} (Copy)`,
        subject: template.subject,
        category: template.category,
        folder: template.folder,
        description: template.description
      };
      
      const response = await emailService.createTemplate(newTemplate);
      
      // If original has a published version, duplicate it
      if (template.published_version_id) {
        const originalTemplate = await emailService.getTemplate(template.id);
        const publishedVersion = originalTemplate.data.versions?.find(
          v => v.id === template.published_version_id
        );
        
        if (publishedVersion) {
          await emailService.createVersion(response.data.id, {
            mjml_content: publishedVersion.mjml_content,
            html_content: publishedVersion.html_content,
            design_json: publishedVersion.design_json
          });
        }
      }
      
      toast.success('Template duplicated successfully');
      fetchData();
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  // Filter templates
  const filteredTemplates = templates.filter(template => {
    // Folder filter
    if (selectedFolder !== 'all' && template.folder !== selectedFolder) {
      return false;
    }

    // Active filter
    if (filterActive !== 'all') {
      if (filterActive === 'active' && !template.is_active) return false;
      if (filterActive === 'inactive' && template.is_active) return false;
    }

    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        template.name.toLowerCase().includes(search) ||
        template.subject?.toLowerCase().includes(search) ||
        template.description?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  // Group templates by folder
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    const folder = template.folder || 'Uncategorized';
    if (!acc[folder]) acc[folder] = [];
    acc[folder].push(template);
    return acc;
  }, {});

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
            <EnvelopeIcon className="h-8 w-8 mr-3 text-primary-600" />
            Email Templates
          </h1>
          <p className="text-gray-600 mt-1">
            Create and manage email templates for your campaigns
          </p>
        </div>
        <Link to="/app/email/templates/new" className="btn-primary">
          <PlusIcon className="h-5 w-5 mr-2" />
          New Template
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>

          {/* Folder Filter */}
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="input"
          >
            <option value="all">All Folders</option>
            {folders.map(folder => (
              <option key={folder} value={folder}>{folder}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filterActive}
            onChange={(e) => setFilterActive(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* Templates Grid */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-sm border">
          <EnvelopeIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedFolder !== 'all' || filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first email template'}
          </p>
          <Link to="/app/email/templates/new" className="btn-primary inline-flex">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Template
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTemplates).map(([folder, folderTemplates]) => (
            <div key={folder}>
              {/* Folder Header */}
              <div className="flex items-center space-x-2 mb-3">
                <FolderIcon className="h-5 w-5 text-gray-500" />
                <h2 className="text-lg font-semibold text-gray-900">{folder}</h2>
                <span className="text-sm text-gray-500">({folderTemplates.length})</span>
              </div>

              {/* Templates in this folder */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {folderTemplates.map(template => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow"
                  >
                    {/* Template Preview */}
                    <div className="h-32 bg-gradient-to-br from-primary-50 to-primary-100 rounded-t-lg flex items-center justify-center">
                      <EnvelopeIcon className="h-12 w-12 text-primary-400" />
                    </div>

                    {/* Template Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900 line-clamp-1">
                          {template.name}
                        </h3>
                        {template.is_active ? (
                          <CheckCircleIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <XCircleIcon className="h-5 w-5 text-gray-400 flex-shrink-0" />
                        )}
                      </div>

                      {template.subject && (
                        <p className="text-sm text-gray-600 line-clamp-2 mb-3">
                          {template.subject}
                        </p>
                      )}

                      {template.category && (
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded mb-3">
                          {template.category}
                        </span>
                      )}

                      <div className="text-xs text-gray-500 mb-4">
                        Updated {format(new Date(template.updated_at), 'MMM d, yyyy')}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => navigate(`/app/email/templates/${template.id}`)}
                          className="flex-1 btn-secondary text-sm py-2"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        
                        <button
                          onClick={() => handleDuplicate(template)}
                          className="btn-secondary p-2"
                          title="Duplicate"
                        >
                          <DocumentDuplicateIcon className="h-4 w-4" />
                        </button>
                        
                        <button
                          onClick={() => handleDelete(template.id, template.name)}
                          className="btn-secondary p-2 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;

