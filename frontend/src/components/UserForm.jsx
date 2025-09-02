import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './Modal';
import userService from '../services/userService';
import toast from 'react-hot-toast';

const UserForm = ({ user = null, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm({
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role: 'sales_rep',
      is_active: true
    }
  });

  const isEditMode = !!user;
  const isAdmin = user?.role === 'admin';

  // Populate form when editing
  useEffect(() => {
    if (user) {
      setValue('first_name', user.first_name || '');
      setValue('last_name', user.last_name || '');
      setValue('email', user.email || '');
      setValue('role', user.role || 'sales_rep');
      setValue('is_active', user.is_active !== undefined ? user.is_active : true);
      // Don't set password for edit mode
    }
  }, [user, setValue]);

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      
      // Remove password field if it's empty in edit mode
      if (isEditMode && !data.password) {
        delete data.password;
      }

      if (user) {
        // Update existing user
        await userService.updateUser(user.id, data);
        toast.success('User updated successfully');
      } else {
        // Create new user
        await userService.createUser(data);
        toast.success('User created successfully');
      }
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to save user:', error);
      // Error handling is done in the API interceptor
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={true}
      onClose={handleClose}
      title={user ? 'Edit User' : 'Add New User'}
      size="lg"
    >

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* First Name */}
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
                    value: /^[a-zA-Z\s]+$/,
                    message: 'First name can only contain letters and spaces'
                  }
                })}
                className={`input ${errors.first_name ? 'border-red-500' : ''}`}
                placeholder="Enter first name"
              />
              {errors.first_name && (
                <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
              )}
            </div>

            {/* Last Name */}
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
                    value: /^[a-zA-Z\s]+$/,
                    message: 'Last name can only contain letters and spaces'
                  }
                })}
                className={`input ${errors.last_name ? 'border-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.last_name && (
                <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
              )}
            </div>

            {/* Email */}
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

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password {!isEditMode && '*'}
              </label>
              <input
                type="password"
                {...register('password', {
                  required: !isEditMode ? 'Password is required' : false,
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters long'
                  },
                  pattern: {
                    value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
                    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
                  }
                })}
                className={`input ${errors.password ? 'border-red-500' : ''}`}
                placeholder={isEditMode ? "Leave blank to keep current password" : "Enter password"}
              />
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
              {isEditMode && (
                <p className="text-gray-500 text-xs mt-1">
                  Leave blank to keep current password
                </p>
              )}
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role *
              </label>
              <select
                {...register('role', {
                  required: 'Role is required'
                })}
                className={`input ${errors.role ? 'border-red-500' : ''}`}
              >
                <option value="sales_rep">Sales Rep</option>
                <option value="manager">Manager</option>
                <option value="admin">Admin</option>
              </select>
              {errors.role && (
                <p className="text-red-500 text-xs mt-1">{errors.role.message}</p>
              )}
            </div>

            {/* Active Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                {...register('is_active')}
                className="input"
              >
                <option value={true}>Active</option>
                <option value={false}>Inactive</option>
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : (user ? 'Update User' : 'Create User')}
            </button>
          </div>
        </form>
    </Modal>
  );
};

export default UserForm;
