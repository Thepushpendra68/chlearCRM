import { useState, useEffect } from 'react';
import { XMarkIcon, EnvelopeIcon, EyeIcon } from '@heroicons/react/24/outline';
import emailService from '../services/emailService';
import toast from 'react-hot-toast';

const SendEmailModal = ({ isOpen, onClose, lead }) => {
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [customData, setCustomData] = useState({});

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await emailService.getTemplates({ is_active: true });
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates');
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (templateId) => {
    const template = templates.find(t => t.id === templateId);
    setSelectedTemplate(template);
  };

  const handlePreview = async () => {
    if (!selectedTemplate || !selectedTemplate.published_version_id) {
      toast.error('Please select a template with a published version');
      return;
    }

    try {
      const response = await emailService.previewTemplate(
        selectedTemplate.published_version_id,
        {
          lead: {
            name: lead.name,
            email: lead.email,
            company: lead.company,
            phone: lead.phone,
            title: lead.title
          },
          ...customData
        }
      );
      setPreviewHtml(response.html);
      setShowPreview(true);
    } catch (error) {
      console.error('Error previewing email:', error);
      toast.error('Failed to preview email');
    }
  };

  const handleSend = async () => {
    if (!selectedTemplate || !selectedTemplate.published_version_id) {
      toast.error('Please select a template');
      return;
    }

    if (!lead.email) {
      toast.error('Lead does not have an email address');
      return;
    }

    try {
      setSending(true);
      await emailService.sendToLead(
        lead.id,
        selectedTemplate.published_version_id,
        customData
      );
      toast.success('Email sent successfully!');
      onClose();
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error(error.response?.data?.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-6">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <EnvelopeIcon className="h-6 w-6 mr-2 text-primary-600" />
                Send Email to {lead.name}
              </h2>
              {lead.email && (
                <p className="text-sm text-gray-600 mt-1">{lead.email}</p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-auto p-6">
            {!lead.email ? (
              <div className="text-center py-8">
                <p className="text-gray-600">
                  This lead does not have an email address.
                </p>
              </div>
            ) : loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Template Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Email Template *
                  </label>
                  <select
                    value={selectedTemplate?.id || ''}
                    onChange={(e) => handleTemplateChange(e.target.value)}
                    className="input"
                  >
                    <option value="">Choose a template</option>
                    {templates.map(template => (
                      <option 
                        key={template.id} 
                        value={template.id}
                        disabled={!template.published_version_id}
                      >
                        {template.name} {!template.published_version_id && '(No published version)'}
                      </option>
                    ))}
                  </select>
                  {templates.length === 0 && (
                    <p className="mt-2 text-sm text-gray-500">
                      No active email templates found. Please create one first.
                    </p>
                  )}
                </div>

                {/* Template Info */}
                {selectedTemplate && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {selectedTemplate.name}
                    </h3>
                    {selectedTemplate.subject && (
                      <div className="text-sm mb-2">
                        <span className="font-medium text-gray-700">Subject: </span>
                        <span className="text-gray-600">{selectedTemplate.subject}</span>
                      </div>
                    )}
                    {selectedTemplate.description && (
                      <p className="text-sm text-gray-600">
                        {selectedTemplate.description}
                      </p>
                    )}
                  </div>
                )}

                {/* Custom Data (optional) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Custom Variables (Optional)
                  </label>
                  <textarea
                    placeholder='{"custom_field": "value"}'
                    value={JSON.stringify(customData, null, 2)}
                    onChange={(e) => {
                      try {
                        setCustomData(JSON.parse(e.target.value));
                      } catch (err) {
                        // Invalid JSON, ignore
                      }
                    }}
                    className="input font-mono text-sm"
                    rows={3}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Add custom merge variables as JSON
                  </p>
                </div>

                {/* Lead Data Preview */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Lead Variables
                  </label>
                  <div className="bg-gray-50 rounded-lg p-3 text-sm font-mono">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-600">{'{{lead.name}}'}</span>
                        <span className="text-gray-900 ml-2">{lead.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{'{{lead.email}}'}</span>
                        <span className="text-gray-900 ml-2">{lead.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{'{{lead.company}}'}</span>
                        <span className="text-gray-900 ml-2">{lead.company || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">{'{{lead.phone}}'}</span>
                        <span className="text-gray-900 ml-2">{lead.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t bg-gray-50">
            <button
              onClick={handlePreview}
              disabled={!selectedTemplate || !selectedTemplate.published_version_id}
              className="btn-secondary"
            >
              <EyeIcon className="h-5 w-5 mr-2" />
              Preview
            </button>
            <div className="flex items-center space-x-3">
              <button
                onClick={onClose}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSend}
                disabled={sending || !selectedTemplate || !selectedTemplate.published_version_id || !lead.email}
                className="btn-primary"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-6">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-xl font-bold text-gray-900">Email Preview</h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6 bg-gray-50">
              <div className="bg-white max-w-2xl mx-auto shadow-lg">
                <div
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                  className="email-preview"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SendEmailModal;

