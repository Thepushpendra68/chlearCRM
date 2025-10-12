import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeftIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';

const PlatformHeader = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg">
      <div className="px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                <span className="text-2xl font-bold">🚀</span>
              </div>
              <div>
                <h1 className="text-xl font-bold">Platform Admin</h1>
                <p className="text-xs text-purple-200">Sakha CRM</p>
              </div>
            </div>

            <div className="h-8 w-px bg-white bg-opacity-30"></div>

            <Link
              to="/app/dashboard"
              className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span className="text-sm">Back to App</span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm font-medium">{user?.first_name} {user?.last_name}</p>
              <p className="text-xs text-purple-200">{user?.email}</p>
            </div>
            <UserCircleIcon className="h-8 w-8" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default PlatformHeader;
