import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getSequenceById, createSequence, updateSequence, getTemplates } from '../services/whatsappService';
import toast from 'react-hot-toast';
import {
  ArrowLeftIcon,
  PlusIcon,
  TrashIcon,
  SaveIcon,
  ClockIcon,
  DocumentTextIcon,
  TemplateIcon
} from '@heroicons/react/24/outline';

const WhatsAppSequenceBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isNew = id === 'new';

  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    is_active: false,
    json_definition: {
      steps: []
    },
    entry_conditions: {},
    exit_on_reply: true,
    max_messages_per_day: 5,
    send_time_window: {
      start: '09:00',
      end: '17:00',
      timezone: 'Asia/Kolkata'
    }
  });

  useEffect(() => {
    if (!isNew) {
      fetchSequence();
    }
    fetchTemplates();
  }, [id]);

  const fetchSequence = async () => {
    try {
      setLoading(true);
      const result = await getSequenceById(id);
      
      if (result.success && result.data?.data) {
        const sequence = result.data.data;
        setFormData({
          name: sequence.name || '',
          description: sequence.description || '',
          is_active: sequence.is_active || false,
          json_definition: sequence.json_definition || { steps: [] },
          entry_conditions: sequence.entry_conditions || {},
          exit_on_reply: sequence.exit_on_reply !== false,
          max_messages_per_day: sequence.max_messages_per_day || 5,
          send_time_window: sequence.send_time_window || {
            start: '09:00',
            end: '17:00',
            timezone: 'Asia/Kolkata'
          }
        });
      } else {
        toast.error(result.error || 'Failed to load sequence');
        navigate('/app/whatsapp/sequences');
      }
    } catch (error) {
      console.error('Error fetching sequence:', error);
      toast.error('Failed to load sequence');
      navigate('/app/whatsapp/sequences');
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const result = await getTemplates();
      if (result.success) {
        setTemplates(result.data?.data || []);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleAddStep = () => {
    const newStep = {
      type: 'text',
      message_text: '',
      delay: 24, // hours
      template_name: '',
      language: 'en',
      parameters: []
    };

    setFormData({
      ...formData,
      json_definition: {
        ...formData.json_definition,
        steps: [...(formData.json_definition.steps || []), newStep]
      }
    });
  };

  const handleRemoveStep = (index) => {
    const newSteps = [...(formData.json_definition.steps || [])];
    newSteps.splice(index, 1);
    setFormData({
      ...formData,
      json_definition: {
        ...formData.json_definition,
        steps: newSteps
      }
    });
  };

  const handleStepChange = (index, field, value) => {
    const newSteps = [...(formData.json_definition.steps || [])];
    newSteps[index] = {
      ...newSteps[index],
      [field]: value
    };
    setFormData({
      ...formData,
      json_definition: {
        ...formData.json_definition,
        steps: newSteps
      }
    });
  };

  const handleSave = async () => {
    // Validation
    if (!formData.name.trim()) {
      toast.error('Please enter a sequence name');
      return;
    }

    if (!formData.json_definition.steps || formData.json_definition.steps.length === 0) {
      toast.error('Please add at least one step to the sequence');
      return;
    }

    // Validate steps
    for (let i = 0; i < formData.json_definition.steps.length; i++) {
      const step = formData.json_definition.steps[i];
      if (step.type === 'text' && !step.message_text?.trim()) {
        toast.error(`Step ${i + 1}: Please enter a message`);
        return;
      }
      if (step.type === 'template' && !step.template_name) {
        toast.error(`Step ${i + 1}: Please select a template`);
        return;
      }
    }

    setSaving(true);
    try {
      const result = isNew
        ? await createSequence(formData)
        : await updateSequence(id, formData);

      if (result.success) {
        toast.success(`Sequence ${isNew ? 'created' : 'updated'} successfully`);
        navigate('/app/whatsapp/sequences');
      } else {
        toast.error(result.error || `Failed to ${isNew ? 'create' : 'update'} sequence`);
      }
    } catch (error) {
      console.error('Error saving sequence:', error);
      toast.error(`Failed to ${isNew ? 'create' : 'update'} sequence`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/app/whatsapp/sequences')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isNew ? 'Create WhatsApp Campaign' : 'Edit Campaign'}
            </h1>
            <p className="text-gray-600 mt-1">
              Build automated WhatsApp message sequences
            </p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
        >
          <SaveIcon className="h-5 w-5" />
          {saving ? 'Saving...' : 'Save Campaign'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Campaign Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="e.g., Welcome Sequence"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="Describe what this campaign does..."
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Activate campaign</span>
                </label>
              </div>
            </div>
          </div>

          {/* Steps */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Message Steps</h2>
              <button
                onClick={handleAddStep}
                className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
              >
                <PlusIcon className="h-4 w-4" />
                Add Step
              </button>
            </div>

            {formData.json_definition.steps.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <DocumentTextIcon className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>No steps added yet. Click "Add Step" to get started.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {formData.json_definition.steps.map((step, index) => (
                  <div key={index} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-medium text-gray-900">Step {index + 1}</h3>
                      <button
                        onClick={() => handleRemoveStep(index)}
                        className="p-1 text-red-600 hover:bg-red-50 rounded"
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      {/* Step Type */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Message Type
                        </label>
                        <select
                          value={step.type || 'text'}
                          onChange={(e) => handleStepChange(index, 'type', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="text">Text Message</option>
                          <option value="template">Template Message</option>
                        </select>
                      </div>

                      {/* Text Message */}
                      {step.type === 'text' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Message Text <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={step.message_text || ''}
                            onChange={(e) => handleStepChange(index, 'message_text', e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="Enter your message..."
                          />
                        </div>
                      )}

                      {/* Template Message */}
                      {step.type === 'template' && (
                        <>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Template <span className="text-red-500">*</span>
                            </label>
                            <select
                              value={step.template_name || ''}
                              onChange={(e) => handleStepChange(index, 'template_name', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value="">Select a template</option>
                              {templates.map((template) => (
                                <option key={template.id} value={template.name}>
                                  {template.name} ({template.language})
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Language
                            </label>
                            <select
                              value={step.language || 'en'}
                              onChange={(e) => handleStepChange(index, 'language', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            >
                              <option value="en">English</option>
                              <option value="hi">Hindi</option>
                              <option value="ta">Tamil</option>
                              <option value="te">Telugu</option>
                              <option value="bn">Bengali</option>
                              <option value="mr">Marathi</option>
                              <option value="gu">Gujarati</option>
                              <option value="kn">Kannada</option>
                              <option value="ml">Malayalam</option>
                            </select>
                          </div>
                        </>
                      )}

                      {/* Delay */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delay (hours) <span className="text-red-500">*</span>
                        </label>
                        <div className="flex items-center gap-2">
                          <ClockIcon className="h-5 w-5 text-gray-400" />
                          <input
                            type="number"
                            min="0"
                            value={step.delay || 0}
                            onChange={(e) => handleStepChange(index, 'delay', parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                            placeholder="24"
                          />
                          <span className="text-sm text-gray-500">hours after previous step</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {step.delay === 0 ? 'Sends immediately' : `Sends ${step.delay} hour${step.delay !== 1 ? 's' : ''} after previous step`}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          {/* Entry Conditions */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Entry Conditions</h2>
            <p className="text-sm text-gray-600 mb-4">
              Automatically enroll leads that match these conditions
            </p>
            
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Source
                </label>
                <select
                  value={formData.entry_conditions?.source || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    entry_conditions: {
                      ...formData.entry_conditions,
                      source: e.target.value || undefined
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any source</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="website">Website</option>
                  <option value="referral">Referral</option>
                  <option value="social_media">Social Media</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lead Status
                </label>
                <select
                  value={formData.entry_conditions?.status || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    entry_conditions: {
                      ...formData.entry_conditions,
                      status: e.target.value || undefined
                    }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="">Any status</option>
                  <option value="new">New</option>
                  <option value="contacted">Contacted</option>
                  <option value="qualified">Qualified</option>
                </select>
              </div>
            </div>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.exit_on_reply}
                    onChange={(e) => setFormData({ ...formData, exit_on_reply: e.target.checked })}
                    className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span className="text-sm text-gray-700">Exit on reply</span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  Stop sequence if lead replies to any message
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Messages Per Day
                </label>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={formData.max_messages_per_day}
                  onChange={(e) => setFormData({ ...formData, max_messages_per_day: parseInt(e.target.value) || 5 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  WhatsApp has stricter rate limits than email
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Send Time Window
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    value={formData.send_time_window.start}
                    onChange={(e) => setFormData({
                      ...formData,
                      send_time_window: {
                        ...formData.send_time_window,
                        start: e.target.value
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                  <input
                    type="time"
                    value={formData.send_time_window.end}
                    onChange={(e) => setFormData({
                      ...formData,
                      send_time_window: {
                        ...formData.send_time_window,
                        end: e.target.value
                      }
                    })}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only send messages during these hours
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSequenceBuilder;

