import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { EyeIcon, EyeSlashIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Modal from './Modal';
import userService from '../services/userService';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FORM_VALUES = {
  first_name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'sales_rep',
  is_active: 'true'
};

const pickRandomChar = (charset) => charset.charAt(Math.floor(Math.random() * charset.length));

const generateSecurePassword = (length = 12) => {
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const numbers = '0123456789';
  const symbols = '!@#$%^&*()-_=+[]{}|;:,.<>?';
  const combined = lowercase + uppercase + numbers + symbols;

  const passwordChars = [
    pickRandomChar(lowercase),
    pickRandomChar(uppercase),
    pickRandomChar(numbers),
    pickRandomChar(symbols)
  ];

  for (let i = passwordChars.length; i < length; i += 1) {
    passwordChars.push(pickRandomChar(combined));
  }

  for (let i = passwordChars.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
  }

  return passwordChars.join('');
};

const UserForm = ({ user = null, onClose, onSuccess }) => {
  const { user: currentUser } = useAuth();
  const isEditMode = Boolean(user);
  const isSelfEdit = isEditMode && currentUser?.id === user?.id;

  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue
  } = useForm({
    defaultValues: { ...DEFAULT_FORM_VALUES }
  });

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        password: '',
        role: user.role || 'sales_rep',
        is_active: user.is_active ? 'true' : 'false'
      });
    } else {
      reset({ ...DEFAULT_FORM_VALUES });
    }
    setShowPassword(false);
  }, [user, reset]);

  const roleOptions = useMemo(() => {
    const options = [
      { label: 'Sales Rep', value: 'sales_rep' },
      { label: 'Manager', value: 'manager' },
      { label: 'Company Admin', value: 'company_admin' }
    ];

    if (currentUser?.role === 'super_admin') {
      options.push({ label: 'Super Admin', value: 'super_admin' });
    }

    return options;
  }, [currentUser?.role]);

  const roleFieldDisabled =
    (isEditMode && user?.role === 'super_admin' && currentUser?.role !== 'super_admin') ||
    isSelfEdit;

  const statusFieldDisabled = isSelfEdit;

  const handleGeneratePassword = () => {
    const password = generateSecurePassword();
    setValue('password', password, { shouldDirty: true, shouldTouch: true });
    setShowPassword(true);
    toast.success('Secure password generated');
  };

  const togglePasswordVisibility = () => {
    setShowPassword((prev) => !prev);
  };

  const handleClose = () => {
    reset({ ...DEFAULT_FORM_VALUES });
    setShowPassword(false);
    onClose?.();
  };

  const onSubmit = async (formData) => {
    const payload = {
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      role: formData.role,
      is_active: formData.is_active === 'true'
    };

    if (isEditMode) {
      if (formData.password) {
        payload.password = formData.password;
      }
    } else {
      payload.password = formData.password;
    }

    try {
      setSubmitting(true);

      if (isEditMode) {
        await userService.updateUser(user.id, payload);
        toast.success('User updated successfully');
      } else {
        await userService.createUser(payload);
        toast.success('User created successfully');
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error('Failed to save user:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const modalTitle = isEditMode ? 'Edit User' : 'Add New User';

  return (
    <Modal
      isOpen
      onClose={handleClose}
      title={modalTitle}
      size="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              {...register('first_name', {
                required: 'First name is required',
                minLength: {
                  value: 2,
                  message: 'First name must be at least 2 characters'
                },
                maxLength: {
                  value: 50,
                  message: 'First name must not exceed 50 characters'
                },
                pattern: {
                  value: /^[a-zA-Z\s'-]+$/,
                  message: 'First name can only contain letters, spaces, apostrophes, or hyphens'
                }
              })}
              className={`input ${errors.first_name ? 'border-red-500' : ''}`}
              placeholder="Enter first name"
            />
            {errors.first_name && (
              <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              {...register('last_name', {
                required: 'Last name is required',
                minLength: {
                  value: 2,
                  message: 'Last name must be at least 2 characters'
                },
                maxLength: {
                  value: 50,
                  message: 'Last name must not exceed 50 characters'
                },
                pattern: {
                  value: /^[a-zA-Z\s'-]+$/,
                  message: 'Last name can only contain letters, spaces, apostrophes, or hyphens'
                }
              })}
              className={`input ${errors.last_name ? 'border-red-500' : ''}`}
              placeholder="Enter last name"
            />
            {errors.last_name && (
              <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              className={`input ${errors.email ? 'border-red-500' : ''}`}
              placeholder="Enter email address"
            />
            {errors.email && (
              <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              {...register('role', {
                required: 'Role is required'
              })}
              className={`input ${errors.role ? 'border-red-500' : ''}`}
              disabled={roleFieldDisabled}
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {errors.role && (
              <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
            )}
            {roleFieldDisabled && (
              <p className="text-xs text-gray-500 mt-1">
                You cannot modify this user&apos;s role.
              </p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password{!isEditMode && ' *'}
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                validate: (value) => {
                  if (isEditMode && !value) {
                    return true;
                  }
                  if (!value) {
                    return 'Password is required';
                  }
                  if (value.length < 8) {
                    return 'Password must be at least 8 characters long';
                  }
                  if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/.test(value)) {
                    return 'Password must include uppercase, lowercase, number, and special character';
                  }
                  return true;
                }
              })}
              className={`input pr-28 ${errors.password ? 'border-red-500' : ''}`}
              placeholder={isEditMode ? 'Leave blank to keep current password' : 'Enter password'}
            />
            <div className="absolute inset-y-1 right-1 flex items-center space-x-2 pl-2">
              <button
                type="button"
                onClick={togglePasswordVisibility}
                className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-4 w-4 mr-1" />
                ) : (
                  <EyeIcon className="h-4 w-4 mr-1" />
                )}
                {showPassword ? 'Hide' : 'Show'}
              </button>
              <button
                type="button"
                onClick={handleGeneratePassword}
                className="inline-flex items-center rounded-md px-2 py-1 text-sm font-medium text-primary-700 bg-primary-50 hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <SparklesIcon className="h-4 w-4 mr-1" />
                Generate
              </button>
            </div>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
          {isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              Leave blank to keep the current password unchanged.
            </p>
          )}
          {!isEditMode && (
            <p className="text-xs text-gray-500 mt-1">
              Share this password with the user securely or ask them to change it after first login.
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Status
            </label>
            <select
              {...register('is_active')}
              className="input"
              disabled={statusFieldDisabled}
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            {statusFieldDisabled && (
              <p className="text-xs text-gray-500 mt-1">
                You cannot change your own status.
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-2">
          <button
            type="button"
            onClick={handleClose}
            className="btn-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn-primary"
            disabled={submitting}
          >
            {submitting ? 'Saving...' : (isEditMode ? 'Update User' : 'Create User')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default UserForm;
