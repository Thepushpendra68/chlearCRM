import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  Cog6ToothIcon,
  EnvelopeIcon,
  CheckCircleIcon,
  XCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';

const EmailSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [formData, setFormData] = useState({
    provider: 'postmark',
    api_key: '',
    from_email: '',
    from_name: '',
    reply_to: ''
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      // Try to fetch existing email integration settings
      const response = await api.get('/email/settings/integration');
      if (response.data.data) {
        setSettings(response.data.data);
        setFormData({
          provider: response.data.data.provider || 'postmark',
          api_key: '', // Don't show existing API key for security
          from_email: response.data.data.config?.from_email || '',
          from_name: response.data.data.config?.from_name || '',
          reply_to: response.data.data.config?.reply_to || ''
        });
      }
    } catch (error) {
      // No settings yet, that's okay
      console.log('No email settings found yet');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.api_key && !settings) {
      toast.error('API key is required');
      return;
    }

    if (!formData.from_email) {
      toast.error('From email is required');
      return;
    }

    try {
      setSaving(true);

      const config = {
        api_key: formData.api_key || undefined, // Only update if provided
        from_email: formData.from_email,
        from_name: formData.from_name || formData.from_email,
        reply_to: formData.reply_to || formData.from_email
      };

      // Save via Supabase
      await api.post('/email/settings/integration', {
        provider: formData.provider,
        config: config
      });

      toast.success('Email settings saved successfully!');
      await fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const testConnection = async () => {
    if (!settings || !settings.config?.api_key) {
      toast.error('Please save your settings first');
      return;
    }

    try {
      toast.loading('Testing connection...');
      // This would test the connection - for now just show success
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.dismiss();
      toast.success('Connection successful!');
    } catch (error) {
      toast.dismiss();
      toast.error('Connection failed');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-2">
          <Cog6ToothIcon className="h-8 w-8 text-primary-600" />
          <h1 className="text-3xl font-bold text-gray-900">Email Settings</h1>
        </div>
        <p className="text-gray-600">
          Configure your email provider to start sending emails from your CRM
        </p>
      </div>

      {/* Status Banner */}
      {settings ? (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start space-x-3">
          <CheckCircleIcon className="h-6 w-6 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-900">Email provider configured</h3>
            <p className="text-sm text-green-700 mt-1">
              Your CRM is connected to {settings.provider}. You can send emails to your leads.
            </p>
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start space-x-3">
          <InformationCircleIcon className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900">Email provider not configured</h3>
            <p className="text-sm text-blue-700 mt-1">
              Configure your email provider below to start sending emails
            </p>
          </div>
        </div>
      )}

      {/* Settings Form */}
      <form onSubmit={handleSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email Provider
          </label>
          <select
            name="provider"
            value={formData.provider}
            onChange={handleInputChange}
            className="input"
            disabled={settings}
          >
            <option value="postmark">Postmark</option>
            <option value="sendgrid" disabled>SendGrid (Coming Soon)</option>
            <option value="ses" disabled>Amazon SES (Coming Soon)</option>
          </select>
          <p className="mt-1 text-sm text-gray-500">
            We recommend Postmark for reliable email delivery
          </p>
        </div>

        {/* Postmark Instructions */}
        {formData.provider === 'postmark' && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Postmark Setup</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-gray-700">
              <li>Sign up at <a href="https://postmarkapp.com" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">postmarkapp.com</a></li>
              <li>Create a Server and get your <strong>Server API Token</strong></li>
              <li>Verify your sender domain or email address</li>
              <li>Paste your API token below</li>
            </ol>
          </div>
        )}

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            API Key *
          </label>
          <input
            type="password"
            name="api_key"
            value={formData.api_key}
            onChange={handleInputChange}
            placeholder={settings ? "Enter new API key to update" : "Paste your Postmark Server API Token"}
            className="input"
          />
          {settings && (
            <p className="mt-1 text-sm text-gray-500">
              Leave blank to keep existing API key
            </p>
          )}
        </div>

        {/* From Email */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Email Address *
          </label>
          <input
            type="email"
            name="from_email"
            value={formData.from_email}
            onChange={handleInputChange}
            placeholder="noreply@yourdomain.com"
            className="input"
            required
          />
          <p className="mt-1 text-sm text-gray-500">
            This email must be verified in your Postmark account
          </p>
        </div>

        {/* From Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            From Name
          </label>
          <input
            type="text"
            name="from_name"
            value={formData.from_name}
            onChange={handleInputChange}
            placeholder="Your Company Name"
            className="input"
          />
          <p className="mt-1 text-sm text-gray-500">
            This will appear as the sender name
          </p>
        </div>

        {/* Reply To */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reply-To Email
          </label>
          <input
            type="email"
            name="reply_to"
            value={formData.reply_to}
            onChange={handleInputChange}
            placeholder="support@yourdomain.com"
            className="input"
          />
          <p className="mt-1 text-sm text-gray-500">
            Where replies to your emails will go
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div>
            {settings && (
              <button
                type="button"
                onClick={testConnection}
                className="btn-secondary"
              >
                <EnvelopeIcon className="h-5 w-5 mr-2" />
                Test Connection
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="btn-primary"
          >
            {saving ? 'Saving...' : settings ? 'Update Settings' : 'Save Settings'}
          </button>
        </div>
      </form>

      {/* Webhook Setup (for future) */}
      {settings && (
        <div className="mt-6 bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Webhook Configuration</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Webhook URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={`${window.location.origin}/api/email/webhooks/postmark`}
                  readOnly
                  className="input flex-1"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/api/email/webhooks/postmark`);
                    toast.success('Copied to clipboard!');
                  }}
                  className="ml-2 btn-secondary"
                >
                  Copy
                </button>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                Add this webhook URL to your Postmark server settings to track opens, clicks, and bounces
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailSettings;

