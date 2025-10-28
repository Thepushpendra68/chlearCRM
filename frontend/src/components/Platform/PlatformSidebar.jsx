import { NavLink } from 'react-router-dom';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UsersIcon,
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Overview', href: '/platform', icon: HomeIcon, exact: true },
  { name: 'Companies', href: '/platform/companies', icon: BuildingOfficeIcon },
  { name: 'Users', href: '/platform/users', icon: UsersIcon },
  { name: 'Analytics', href: '/platform/analytics', icon: ChartBarIcon },
  { name: 'Audit Logs', href: '/platform/audit-logs', icon: ShieldCheckIcon },
  { name: 'Activity', href: '/platform/activity', icon: ClockIcon },
];

const PlatformSidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen">
      <nav className="p-4 space-y-2">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            end={item.exact}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-purple-50 text-purple-700 font-medium'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default PlatformSidebar;
