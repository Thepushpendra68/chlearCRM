import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import Modal from '../Modal';
import contactService from '../../services/contactService';
import accountService from '../../services/accountService';
import userService from '../../services/userService';

const CONTACT_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'unsubscribed', label: 'Unsubscribed' },
  { value: 'archived', label: 'Archived' }
];

const CONTACT_LIFECYCLE_STAGES = [
  { value: 'lead', label: 'Lead' },
  { value: 'marketing_qualified', label: 'Marketing Qualified' },
  { value: 'sales_qualified', label: 'Sales Qualified' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'customer', label: 'Customer' },
  { value: 'evangelist', label: 'Evangelist' }
];

const CONTACT_METHODS = [
  { value: '', label: 'No Preference' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'mobile', label: 'Mobile' },
  { value: 'linkedin', label: 'LinkedIn' }
];
const DEFAULT_VALUES = {
  first_name: '',
  last_name: '',
  email: '',
  phone: '',
  mobile_phone: '',
  title: '',
  department: '',
  account_id: '',
  assigned_to: '',
  status: 'active',
  lifecycle_stage: '',
  preferred_contact_method: '',
  do_not_call: false,
  do_not_email: false,
  is_primary: false,
  is_decision_maker: false,
  linkedin_url: '',
  twitter_handle: '',
  notes: '',
  description: ''
};

const ContactForm = ({
  isOpen,
  onClose,
  contact = null,
  onSuccess,
  defaultAccountId = '',
  lockAccountSelection = false
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [users, setUsers] = useState([]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting }
  } = useForm({
    mode: 'onBlur',
    defaultValues: DEFAULT_VALUES
  });
  const emailValue = watch('email');
  const phoneValue = watch('phone');
  const mobilePhoneValue = watch('mobile_phone');

  const showContactMethodWarning = useMemo(() => {
    return !emailValue && !phoneValue && !mobilePhoneValue;
  }, [emailValue, phoneValue, mobilePhoneValue]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const loadOptions = async () => {
      setLoadingOptions(true);
      try {
        const [accountsResponse, usersResponse] = await Promise.all([
          accountService.getAccounts({ limit: 1000, status: 'active', sort_by: 'name', sort_order: 'asc' }),
          userService.getActiveUsers()
        ]);

        let normalizedAccounts = accountsResponse?.data ?? accountsResponse?.accounts ?? [];
        const usersData = usersResponse?.data ?? usersResponse ?? [];

        if (!Array.isArray(normalizedAccounts)) {
          normalizedAccounts = [];
        }

        if (defaultAccountId && !normalizedAccounts.some(account => account.id === defaultAccountId)) {
          try {
            const defaultAccountResponse = await accountService.getAccountById(defaultAccountId);
            const defaultAccount = defaultAccountResponse?.data ?? defaultAccountResponse;
            if (defaultAccount?.id) {
              normalizedAccounts = [defaultAccount, ...normalizedAccounts];
            }
          } catch (defaultAccountError) {
            console.error('Failed to fetch default account:', defaultAccountError);
          }
        }

        setAccounts(normalizedAccounts);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } catch (error) {
        console.error('Failed to load contact options:', error);
        toast.error('Failed to load accounts or users');
      } finally {
        setLoadingOptions(false);
      }
    };

    loadOptions();
  }, [isOpen, defaultAccountId]);
  const mapContactToForm = (contactData = {}) => ({
    first_name: contactData.first_name || '',
    last_name: contactData.last_name || '',
    email: contactData.email || '',
    phone: contactData.phone || '',
    mobile_phone: contactData.mobile_phone || '',
    title: contactData.title || '',
    department: contactData.department || '',
    account_id: contactData.account_id || '',
    assigned_to: contactData.assigned_to || '',
    status: contactData.status || 'active',
    lifecycle_stage: contactData.lifecycle_stage || '',
    preferred_contact_method: contactData.preferred_contact_method || '',
    do_not_call: Boolean(contactData.do_not_call),
    do_not_email: Boolean(contactData.do_not_email),
    is_primary: Boolean(contactData.is_primary),
    is_decision_maker: Boolean(contactData.is_decision_maker),
    linkedin_url: contactData.linkedin_url || '',
    twitter_handle: contactData.twitter_handle || '',
    notes: contactData.notes || '',
    description: contactData.description || ''
  });

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    if (contact) {
      reset(mapContactToForm(contact));
    } else {
      reset({
        ...DEFAULT_VALUES,
        account_id: defaultAccountId || ''
      });
    }
  }, [contact, isOpen, reset, defaultAccountId]);
  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose?.();
  };

  const onSubmit = async (values) => {
    if (!values.email && !values.phone && !values.mobile_phone) {
      toast.error('At least one contact method (email, phone, or mobile) is required.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        ...values,
        first_name: values.first_name?.trim(),
        last_name: values.last_name?.trim(),
        email: values.email ? values.email.trim().toLowerCase() : null,
        phone: values.phone?.trim() || null,
        mobile_phone: values.mobile_phone?.trim() || null,
        title: values.title?.trim() || null,
        department: values.department?.trim() || null,
        linkedin_url: values.linkedin_url?.trim() || null,
        twitter_handle: values.twitter_handle?.trim() || null,
        notes: values.notes?.trim() || null,
        description: values.description?.trim() || null,
        account_id: values.account_id || null,
        assigned_to: values.assigned_to || null,
        lifecycle_stage: values.lifecycle_stage || null,
        preferred_contact_method: values.preferred_contact_method || null
      };

      const apiResponse = contact
        ? await contactService.updateContact(contact.id, payload)
        : await contactService.createContact(payload);

      const savedContact = apiResponse?.data ?? apiResponse;

      toast.success(contact ? 'Contact updated successfully' : 'Contact created successfully');
      onSuccess?.(savedContact);
      onClose?.();

      if (!contact) {
        reset({
          ...DEFAULT_VALUES,
          account_id: defaultAccountId || ''
        });
      }
    } catch (error) {
      const message = error?.response?.data?.error?.message || error?.message || 'Failed to save contact';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={contact ? 'Edit Contact' : 'New Contact'}
      size="xl"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {showContactMethodWarning && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Provide at least one contact method (email, phone, or mobile phone).
          </div>
        )}

        {loadingOptions && (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-500">
            Loading accounts and users...
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">First Name *</label>
            <input
              type="text"
              {...register('first_name', { required: 'First name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Jane"
            />
            {errors.first_name && (
              <p className="mt-1 text-xs text-red-600">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Last Name *</label>
            <input
              type="text"
              {...register('last_name', { required: 'Last name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Doe"
            />
            {errors.last_name && (
              <p className="mt-1 text-xs text-red-600">{errors.last_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              {...register('email', {
                pattern: {
                  value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                  message: 'Enter a valid email address'
                }
              })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <input
              type="tel"
              {...register('phone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="(555) 123-4567"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mobile Phone</label>
            <input
              type="tel"
              {...register('mobile_phone')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="(555) 987-6543"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Job Title</label>
            <input
              type="text"
              {...register('title')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Director of Operations"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              {...register('department')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="Operations"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Account</label>
            <select
              {...register('account_id')}
              className={`mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 ${lockAccountSelection ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              disabled={loadingOptions}
            >
              <option value="">No account</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
            {lockAccountSelection && (
              <p className="mt-1 text-xs text-gray-500">Contact will be saved under the selected account.</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Assigned To</label>
            <select
              {...register('assigned_to')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
              disabled={loadingOptions}
            >
              <option value="">Unassigned</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.first_name} {user.last_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              {...register('status', { required: 'Status is required' })}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              {CONTACT_STATUSES.map(status => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Lifecycle Stage</label>
            <select
              {...register('lifecycle_stage')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              <option value="">None</option>
              {CONTACT_LIFECYCLE_STAGES.map(stage => (
                <option key={stage.value} value={stage.value}>
                  {stage.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
            <select
              {...register('preferred_contact_method')}
              className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm shadow-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500"
            >
              {CONTACT_METHODS.map(method => (
                <option key={method.value} value={method.value}>
                  {method.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register('is_decision_maker')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Decision Maker
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register('is_primary')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Primary Contact
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register('do_not_call')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Do Not Call
          </label>

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              {...register('do_not_email')}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            Do Not Email
          </label>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
            <input
              type="url"
              {...register('linkedin_url')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="https://linkedin.com/in/..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Twitter Handle</label>
            <input
              type="text"
              {...register('twitter_handle')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              placeholder="@username"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Notes</label>
          <textarea
            rows={3}
            {...register('notes')}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Internal notes about this contact"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            rows={3}
            {...register('description')}
            className="mt-1 block w-full rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
            placeholder="Public description or summary"
          />
        </div>

        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || isSubmitting}
            className="inline-flex items-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading || isSubmitting ? 'Saving...' : contact ? 'Save Changes' : 'Create Contact'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default ContactForm;
