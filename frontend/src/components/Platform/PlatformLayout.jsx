import { Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
import PlatformSidebar from './PlatformSidebar';
import PlatformHeader from './PlatformHeader';

const PlatformLayout = () => {
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Only super admins can access platform
  if (user?.role !== 'super_admin') {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Platform Header */}
      <PlatformHeader />

      <div className="flex">
        {/* Platform Sidebar */}
        <PlatformSidebar />

        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default PlatformLayout;
