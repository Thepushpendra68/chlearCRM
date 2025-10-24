import { forwardRef, useState, useEffect } from 'react';
import userService from '../../../services/userService';

/**
 * UserSelectInput - User assignment field component
 * Fetches and displays available users for assignment
 */
const UserSelectInput = forwardRef(({
  field,
  value,
  onChange,
  error,
  disabled = false,
  ...rest
}, ref) => {
  const hasError = !!error;
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoading(true);
        const response = await userService.getUsers();
        const userData = response.data || response;
        setUsers(Array.isArray(userData) ? userData : []);
      } catch (err) {
        console.error('Failed to load users:', err);
        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, []);

  return (
    <div className={field.gridColumn || 'col-span-12'}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={field.id}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || loading}
        className={`
          mt-1 block w-full rounded-md shadow-sm
          ${hasError
            ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
          }
          ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          sm:text-sm
        `}
        ref={ref}
        {...rest}
      >
        <option value="">{loading ? 'Loading users...' : (field.placeholder || 'Select a user')}</option>
        {users.map(user => (
          <option key={user.id} value={user.id}>
            {user.full_name || user.name || `${user.first_name} ${user.last_name}`.trim() || user.email}
          </option>
        ))}
      </select>
      {field.helpText && !hasError && (
        <p className="mt-1 text-xs text-gray-500">{field.helpText}</p>
      )}
      {hasError && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
});

UserSelectInput.displayName = 'UserSelectInput';

export default UserSelectInput;
