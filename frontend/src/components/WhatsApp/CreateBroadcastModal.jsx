/**
 * Create Broadcast Modal
 * Modal for creating new WhatsApp broadcasts
 */

import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createBroadcast, getTemplates } from '../../services/whatsappService';

const CreateBroadcastModal = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    message_type: 'text',
    content: '',
    template_name: '',
    template_language: 'en',
    template_params: [],
    media_type: 'image',
    media_url: '',
    media_caption: '',
    recipient_type: 'leads',
    recipient_ids: [],
    recipient_filters: {
      status: '',
      source: '',
      assigned_to: ''
    },
    scheduled_at: '',
    messages_per_minute: 10,
    batch_size: 10
  });

  const [templates, setTemplates] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1); // 1: Basic, 2: Message, 3: Recipients, 4: Settings

  useEffect(() => {
    if (isOpen && formData.message_type === 'template') {
      loadTemplates();
    }
  }, [isOpen, formData.message_type]);

  const loadTemplates = async () => {
    try {
      setLoadingTemplates(true);
      const result = await getTemplates();
      if (result.success) {
        setTemplates(result.data || []);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoadingTemplates(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleTemplateParamChange = (index, value) => {
    const newParams = [...formData.template_params];
    newParams[index] = value;
    setFormData(prev => ({
      ...prev,
      template_params: newParams
    }));
  };

  const handleAddTemplateParam = () => {
    setFormData(prev => ({
      ...prev,
      template_params: [...prev.template_params, '']
    }));
  };

  const handleRemoveTemplateParam = (index) => {
    setFormData(prev => ({
      ...prev,
      template_params: prev.template_params.filter((_, i) => i !== index)
    }));
  };

  const handleFilterChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      recipient_filters: {
        ...prev.recipient_filters,
        [field]: value
      }
    }));
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.name) {
        toast.error('Please enter a broadcast name');
        return false;
      }
    }
    if (step === 2) {
      if (formData.message_type === 'text' && !formData.content) {
        toast.error('Please enter message content');
        return false;
      }
      if (formData.message_type === 'template' && !formData.template_name) {
        toast.error('Please select a template');
        return false;
      }
      if (formData.message_type === 'media' && !formData.media_url) {
        toast.error('Please enter media URL');
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(prev => Math.min(prev + 1, 4));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;

    try {
      setSaving(true);

      // Clean up data
      const submitData = {
        ...formData,
        template_params: formData.template_params.filter(p => p.trim() !== ''),
        recipient_ids: formData.recipient_type === 'custom' ? formData.recipient_ids : undefined,
        recipient_filters: formData.recipient_type === 'filter' ? formData.recipient_filters : undefined,
        scheduled_at: formData.scheduled_at || undefined
      };

      // Remove empty filter fields
      if (submitData.recipient_filters) {
        Object.keys(submitData.recipient_filters).forEach(key => {
          if (!submitData.recipient_filters[key]) {
            delete submitData.recipient_filters[key];
          }
        });
      }

      const result = await createBroadcast(submitData);
      
      if (result.success) {
        toast.success('Broadcast created successfully!');
        onClose();
      } else {
        toast.error(result.error || 'Failed to create broadcast');
      }
    } catch (error) {
      console.error('Error creating broadcast:', error);
      toast.error('Failed to create broadcast');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose}></div>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Create Broadcast</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4].map((s) => (
                <React.Fragment key={s}>
                  <div className="flex items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step >= s
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {s}
                    </div>
                    <span className={`ml-2 text-sm ${step >= s ? 'text-gray-900' : 'text-gray-500'}`}>
                      {s === 1 && 'Basic Info'}
                      {s === 2 && 'Message'}
                      {s === 3 && 'Recipients'}
                      {s === 4 && 'Settings'}
                    </span>
                  </div>
                  {s < 4 && <div className="flex-1 h-0.5 bg-gray-200 mx-4"></div>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Broadcast Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="e.g., New Product Launch"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Optional description"
                  />
                </div>
              </div>
            )}

            {/* Step 2: Message */}
            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type *
                  </label>
                  <select
                    name="message_type"
                    value={formData.message_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="text">Text Message</option>
                    <option value="template">Template Message</option>
                    <option value="media">Media Message</option>
                  </select>
                </div>

                {formData.message_type === 'text' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message Content *
                    </label>
                    <textarea
                      name="content"
                      value={formData.content}
                      onChange={handleChange}
                      rows={6}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      placeholder="Enter your message..."
                    />
                  </div>
                )}

                {formData.message_type === 'template' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template *
                      </label>
                      <select
                        name="template_name"
                        value={formData.template_name}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        disabled={loadingTemplates}
                      >
                        <option value="">Select template...</option>
                        {templates.map(template => (
                          <option key={template.name} value={template.name}>
                            {template.name} ({template.language})
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Parameters
                      </label>
                      {formData.template_params.map((param, index) => (
                        <div key={index} className="flex items-center gap-2 mb-2">
                          <input
                            type="text"
                            value={param}
                            onChange={(e) => handleTemplateParamChange(index, e.target.value)}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            placeholder={`Parameter ${index + 1}`}
                          />
                          <button
                            onClick={() => handleRemoveTemplateParam(index)}
                            className="px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={handleAddTemplateParam}
                        className="text-sm text-green-600 hover:text-green-700"
                      >
                        + Add Parameter
                      </button>
                    </div>
                  </>
                )}

                {formData.message_type === 'media' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Media Type *
                      </label>
                      <select
                        name="media_type"
                        value={formData.media_type}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="image">Image</option>
                        <option value="video">Video</option>
                        <option value="audio">Audio</option>
                        <option value="document">Document</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Media URL *
                      </label>
                      <input
                        type="url"
                        name="media_url"
                        value={formData.media_url}
                        onChange={handleChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="https://example.com/image.jpg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Caption
                      </label>
                      <textarea
                        name="media_caption"
                        value={formData.media_caption}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="Optional caption"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 3: Recipients */}
            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Recipient Type *
                  </label>
                  <select
                    name="recipient_type"
                    value={formData.recipient_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  >
                    <option value="leads">All Leads</option>
                    <option value="contacts">All Contacts</option>
                    <option value="filter">Filtered Leads</option>
                    <option value="custom">Custom List</option>
                  </select>
                </div>

                {formData.recipient_type === 'filter' && (
                  <div className="space-y-3 p-4 bg-gray-50 rounded-lg">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lead Status
                      </label>
                      <select
                        value={formData.recipient_filters.status}
                        onChange={(e) => handleFilterChange('status', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                      >
                        <option value="">All Statuses</option>
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="converted">Converted</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Source
                      </label>
                      <input
                        type="text"
                        value={formData.recipient_filters.source}
                        onChange={(e) => handleFilterChange('source', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                        placeholder="e.g., website, referral"
                      />
                    </div>
                  </div>
                )}

                {formData.recipient_type === 'custom' && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      Custom list selection will be available in a future update. For now, please use "Filtered Leads" or "All Leads/Contacts".
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Settings */}
            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Messages Per Minute
                  </label>
                  <input
                    type="number"
                    name="messages_per_minute"
                    value={formData.messages_per_minute}
                    onChange={handleChange}
                    min="1"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Rate limit to comply with WhatsApp restrictions</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    name="batch_size"
                    value={formData.batch_size}
                    onChange={handleChange}
                    min="1"
                    max="50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Number of messages to send per batch</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Schedule (Optional)
                  </label>
                  <input
                    type="datetime-local"
                    name="scheduled_at"
                    value={formData.scheduled_at}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to send immediately</p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              {step < 4 ? (
                <button
                  onClick={handleNext}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Creating...' : 'Create Broadcast'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateBroadcastModal;

