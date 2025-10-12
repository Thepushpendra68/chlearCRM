import { useState } from 'react';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ImpersonationBanner = ({ impersonatedUser, onEnd }) => {
  const [ending, setEnding] = useState(false);

  const handleEndImpersonation = async () => {
    try {
      setEnding(true);

      // Remove impersonation header
      delete api.defaults.headers.common['x-impersonate-user-id'];

      // Call end impersonation endpoint
      await api.post('/platform/impersonate/end');

      toast.success('Impersonation ended');
      onEnd();

      // Reload page to reset state
      window.location.reload();
    } catch (error) {
      console.error('Failed to end impersonation:', error);
      toast.error('Failed to end impersonation');
    } finally {
      setEnding(false);
    }
  };

  if (!impersonatedUser) return null;

  return (
    <div className="bg-amber-500 text-white px-6 py-3 flex items-center justify-between shadow-lg">
      <div className="flex items-center space-x-3">
        <ExclamationTriangleIcon className="h-6 w-6" />
        <div>
          <p className="font-semibold">Impersonation Mode Active</p>
          <p className="text-sm text-amber-100">
            Viewing as: {impersonatedUser.first_name} {impersonatedUser.last_name} ({impersonatedUser.email})
          </p>
        </div>
      </div>
      <button
        onClick={handleEndImpersonation}
        disabled={ending}
        className="flex items-center space-x-2 bg-white bg-opacity-20 hover:bg-opacity-30 px-4 py-2 rounded-lg transition-colors"
      >
        <XMarkIcon className="h-5 w-5" />
        <span>{ending ? 'Ending...' : 'End Impersonation'}</span>
      </button>
    </div>
  );
};

export default ImpersonationBanner;
