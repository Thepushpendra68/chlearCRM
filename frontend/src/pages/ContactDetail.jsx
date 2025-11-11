import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeftIcon,
  PencilIcon,
  TrashIcon,
  EnvelopeIcon,
  PhoneIcon,
  DevicePhoneMobileIcon,
  BuildingOfficeIcon,
  UserIcon,
  TagIcon,
  LinkIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import contactService from '../services/contactService';
import ContactForm from '../components/Contacts/ContactForm';

const ContactDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [unlinkingLeadId, setUnlinkingLeadId] = useState(null);

  const fetchContact = async () => {
    try {
      setLoading(true);
      const response = await contactService.getContactById(id);
      const contactData = response?.data ?? response;
      setContact(contactData);
    } catch (error) {
      console.error('Failed to load contact:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to load contact');
      navigate('/app/contacts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContact();
  }, [id]);

  const handleDelete = async () => {
    if (!contact) return;
    if (!window.confirm('Are you sure you want to delete this contact?')) {
      return;
    }

    try {
      await contactService.deleteContact(contact.id);
      toast.success('Contact deleted successfully');
      navigate('/app/contacts');
    } catch (error) {
      console.error('Failed to delete contact:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to delete contact');
    }
  };

  const handleUnlinkLead = async (leadId) => {
    if (!contact) return;
    setUnlinkingLeadId(leadId);
    try {
      await contactService.unlinkFromLead(contact.id, leadId);
      toast.success('Lead unlinked successfully');
      fetchContact();
    } catch (error) {
      console.error('Failed to unlink lead:', error);
      toast.error(error?.response?.data?.error?.message || 'Failed to unlink lead');
    } finally {
      setUnlinkingLeadId(null);
    }
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return '—';
    try {
      return format(new Date(dateString), 'PP p');
    } catch (error) {
      return '—';
    }
  };

  const formatAddress = (address) => {
    if (!address || typeof address !== 'object') return null;
    const parts = [
      address.street || address.line1,
      address.line2,
      address.city,
      address.state,
      address.postal_code || address.zip,
      address.country
    ].filter(Boolean);
    return parts.length ? parts.join(', ') : null;
  };

  const customFields = useMemo(() => {
    if (!contact?.custom_fields || typeof contact.custom_fields !== 'object') {
      return [];
    }
    return Object.entries(contact.custom_fields).filter(([_, value]) => value !== null && value !== '');
  }, [contact?.custom_fields]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto flex min-h-screen max-w-7xl items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="mt-4 text-sm font-medium text-gray-900">Loading contact...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 lg:px-8">
          <h2 className="text-lg font-semibold text-gray-900">Contact not found</h2>
          <p className="mt-2 text-sm text-gray-600">The contact you are looking for does not exist or has been removed.</p>
          <button
            onClick={() => navigate('/app/contacts')}
            className="mt-6 inline-flex items-center rounded-lg border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700"
          >
            Back to Contacts
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-6 sm:px-6 lg:px-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/app/contacts')}
              className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">
                  {contact.first_name} {contact.last_name}
                </h1>
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${contact.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                  Status: {contact.status}
                </span>
                {contact.lifecycle_stage && (
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${contact.lifecycle_stage === 'customer' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>
                    Lifecycle: {contact.lifecycle_stage.replace(/_/g, ' ')}
                  </span>
                )}
                {contact.is_decision_maker && (
                  <span className="inline-flex items-center rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-800">
                    Decision Maker
                  </span>
                )}
              </div>
              {contact.title && (
                <p className="mt-1 text-sm text-gray-600">{contact.title}{contact.company ? ` • ${contact.company}` : ''}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <PencilIcon className="mr-2 h-4 w-4" />
              Edit
            </button>
            <button
              onClick={handleDelete}
              className="inline-flex items-center rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              <TrashIcon className="mr-2 h-4 w-4" />
              Delete
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-4">
          <div className="space-y-6 lg:col-span-3">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Contact Information</h2>
              </div>
              <div className="grid gap-6 px-6 py-6 sm:grid-cols-2">
                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <EnvelopeIcon className="mr-3 h-5 w-5 text-gray-400" />
                    {contact.email ? (
                      <a href={`mailto:${contact.email}`} className="text-primary-600 hover:text-primary-800">
                        {contact.email}
                      </a>
                    ) : (
                      <span className="text-gray-400">No email provided</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <PhoneIcon className="mr-3 h-5 w-5 text-gray-400" />
                    {contact.phone ? contact.phone : <span className="text-gray-400">No phone number</span>}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <DevicePhoneMobileIcon className="mr-3 h-5 w-5 text-gray-400" />
                    {contact.mobile_phone ? contact.mobile_phone : <span className="text-gray-400">No mobile number</span>}
                  </div>
                  {contact.preferred_contact_method && (
                    <div className="flex items-center text-sm text-gray-700">
                      <TagIcon className="mr-3 h-5 w-5 text-gray-400" />
                      Preferred Method: {contact.preferred_contact_method.replace(/_/g, ' ')}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-sm text-gray-700">
                    <BuildingOfficeIcon className="mr-3 h-5 w-5 text-gray-400" />
                    {contact.account_name ? (
                      <button
                        onClick={() => navigate(`/app/accounts/${contact.account_id}`)}
                        className="text-primary-600 hover:text-primary-800"
                      >
                        {contact.account_name}
                      </button>
                    ) : (
                      <span className="text-gray-400">No account linked</span>
                    )}
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <UserIcon className="mr-3 h-5 w-5 text-gray-400" />
                    {contact.assigned_user_first_name ? (
                      <span>
                        {contact.assigned_user_first_name} {contact.assigned_user_last_name}
                      </span>
                    ) : (
                      <span className="text-gray-400">Unassigned</span>
                    )}
                  </div>
                  {formatAddress(contact.address) && (
                    <div className="text-sm text-gray-700">
                      <span className="font-medium text-gray-600">Address:</span>
                      <p className="mt-0.5 text-gray-600">{formatAddress(contact.address)}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Associated Leads</h2>
              </div>
              <div className="px-6 py-6">
                {contact.leads && contact.leads.length > 0 ? (
                  <div className="space-y-4">
                    {contact.leads.map((lead) => (
                      <div key={lead.id} className="flex flex-col gap-3 rounded-lg border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </p>
                          <p className="text-sm text-gray-600">{lead.email || 'No email'}{lead.company ? ` • ${lead.company}` : ''}</p>
                          <div className="mt-1 flex flex-wrap gap-2 text-xs">
                            <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">
                              Status: {lead.status}
                            </span>
                            {lead.is_primary && (
                              <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                                Primary Contact
                              </span>
                            )}
                            {lead.role && (
                              <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-purple-700">
                                Role: {lead.role}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => navigate(`/app/leads/${lead.id}`)}
                            className="text-sm font-medium text-primary-600 hover:text-primary-800"
                          >
                            View Lead
                          </button>
                          <button
                            onClick={() => handleUnlinkLead(lead.id)}
                            disabled={unlinkingLeadId === lead.id}
                            className="text-sm font-medium text-red-600 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {unlinkingLeadId === lead.id ? 'Unlinking...' : 'Unlink'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">This contact is not linked to any leads yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Activities</h2>
              </div>
              <div className="px-6 py-6">
                {contact.recent_activities && contact.recent_activities.length > 0 ? (
                  <div className="space-y-4">
                    {contact.recent_activities.map((activity) => (
                      <div key={activity.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-900">{activity.type}</span>
                          <span className="text-gray-500">{formatDateTime(activity.created_at)}</span>
                        </div>
                        <p className="mt-2 text-sm text-gray-700">{activity.description || 'No description provided.'}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent activities recorded for this contact.</p>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              </div>
              <div className="px-6 py-6">
                {contact.tasks && contact.tasks.length > 0 ? (
                  <div className="space-y-4">
                    {contact.tasks.map((task) => (
                      <div key={task.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-sm font-semibold text-gray-900">{task.title}</h3>
                          <span className="text-xs uppercase tracking-wide text-gray-500">{task.status}</span>
                        </div>
                        {task.due_date && (
                          <div className="mt-2 flex items-center text-xs text-gray-500">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            Due {formatDateTime(task.due_date)}
                          </div>
                        )}
                        {task.description && (
                          <p className="mt-2 text-sm text-gray-700">{task.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No tasks associated with this contact.</p>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-lg font-semibold text-gray-900">Notes & Preferences</h2>
              </div>
              <div className="space-y-4 px-6 py-6 text-sm text-gray-700">
                <div>
                  <h3 className="font-medium text-gray-900">Notes</h3>
                  <p className="mt-1 text-gray-600">{contact.notes || 'No notes provided.'}</p>
                </div>
                <div>
                  <h3 className="font-medium text-gray-900">Description</h3>
                  <p className="mt-1 text-gray-600">{contact.description || 'No public description provided.'}</p>
                </div>
                <div className="space-y-2">
                  <h3 className="font-medium text-gray-900">Communication Preferences</h3>
                  <ul className="space-y-1 text-gray-600">
                    <li>{contact.do_not_call ? '🚫 Do not call' : '✅ Calls allowed'}</li>
                    <li>{contact.do_not_email ? '🚫 Do not email' : '✅ Emails allowed'}</li>
                  </ul>
                </div>
                {(contact.linkedin_url || contact.twitter_handle) && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Social Profiles</h3>
                    <div className="space-y-1">
                      {contact.linkedin_url && (
                        <a
                          href={contact.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          LinkedIn
                        </a>
                      )}
                      {contact.twitter_handle && (
                        <a
                          href={`https://twitter.com/${contact.twitter_handle.replace('@', '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-primary-600 hover:text-primary-800"
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          Twitter
                        </a>
                      )}
                    </div>
                  </div>
                )}
                {customFields.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-medium text-gray-900">Custom Fields</h3>
                    <dl className="space-y-1 text-gray-600">
                      {customFields.map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <dt className="font-medium capitalize">{key.replace(/_/g, ' ')}</dt>
                          <dd className="text-gray-700">{String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                )}
                <div className="space-y-1 text-xs text-gray-500">
                  <div>Created: {formatDateTime(contact.created_at)}</div>
                  <div>Updated: {formatDateTime(contact.updated_at)}</div>
                  <div>Last Activity: {formatDateTime(contact.last_activity_at)}</div>
                  <div>Last Contacted: {formatDateTime(contact.last_contacted_at)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ContactForm
        isOpen={showEditModal}
        contact={contact}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => fetchContact()}
      />
    </div>
  );
};

export default ContactDetail;
