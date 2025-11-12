import { Fragment, useState, useRef, useEffect } from "react";
import { Dialog, Transition, Menu } from "@headlessui/react";
import {
  XMarkIcon,
  Cog6ToothIcon,
  UserCircleIcon,
  SunIcon,
  MoonIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ChartBarIcon,
  Squares2X2Icon,
  ClockIcon,
  UserPlusIcon,
  DocumentChartBarIcon,
  ClipboardDocumentListIcon,
  CommandLineIcon,
  KeyIcon,
  Squares2X2Icon as CustomFieldsIcon,
  RectangleGroupIcon,
  EnvelopeIcon,
  BoltIcon,
  BuildingOfficeIcon,
  TrophyIcon,
  IdentificationIcon,
  BookOpenIcon,
} from "@heroicons/react/24/outline";
import api from "../../services/api";

const Sidebar = ({
  sidebarOpen,
  setSidebarOpen,
  isCollapsed,
  setIsCollapsed,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(["navigation", "common"]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [emailSectionExpanded, setEmailSectionExpanded] = useState(false);
  const [badgeCounts, setBadgeCounts] = useState({
    leads: 0,
    activities: 0,
    tasks: 0,
  });

  // Fetch badge counts
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      try {
        const response = await api.get("/dashboard/badge-counts");
        if (response.data.success) {
          setBadgeCounts(response.data.data);
        }
      } catch (error) {
        console.error("Failed to fetch badge counts:", error);
      }
    };

    fetchBadgeCounts();
    // Refresh counts every 5 minutes
    const interval = setInterval(fetchBadgeCounts, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-expand email section when navigating to email pages
  useEffect(() => {
    const currentPath = window.location.pathname;
    if (currentPath.startsWith("/app/email/")) {
      setEmailSectionExpanded(true);
    }
  }, []);

  // Email sub-navigation items
  const emailSubItems = [
    { name: "Templates", href: "/app/email/templates", icon: EnvelopeIcon },
    { name: "Sequences", href: "/app/email/sequences", icon: BoltIcon },
    {
      name: "Workflow Library",
      href: "/app/email/workflow-library",
      icon: BookOpenIcon,
    },
    { name: "Analytics", href: "/app/email/analytics", icon: ChartBarIcon },
    // Email Settings - only for company_admin and super_admin
    ...(user?.role === "company_admin" || user?.role === "super_admin"
      ? [
          {
            name: "Settings",
            href: "/app/email/settings",
            icon: Cog6ToothIcon,
          },
        ]
      : []),
  ];

  // Main navigation items (top section)
  const mainNavigation = [
    { name: "Dashboard", href: "/app/dashboard", icon: HomeIcon, badge: null },
    {
      name: "Leads",
      href: "/app/leads",
      icon: UsersIcon,
      badge: badgeCounts.leads || null,
    },
    {
      name: "Contacts",
      href: "/app/contacts",
      icon: IdentificationIcon,
      badge: null,
    },
    {
      name: "Accounts",
      href: "/app/accounts",
      icon: BuildingOfficeIcon,
      badge: null,
    },
    {
      name: "Pipeline",
      href: "/app/pipeline",
      icon: Squares2X2Icon,
      badge: null,
    },
    {
      name: "Activities",
      href: "/app/activities",
      icon: ClockIcon,
      badge: badgeCounts.activities || null,
    },
  ];

  // Utility/admin navigation items (bottom section)
  const utilityNavigation = [
    {
      name: "Assignments",
      href: "/app/assignments",
      icon: UserPlusIcon,
      badge: null,
    },
    {
      name: "Tasks",
      href: "/app/tasks",
      icon: ClipboardDocumentListIcon,
      badge: badgeCounts.tasks || null,
    },
    { name: "Users", href: "/app/users", icon: UserGroupIcon, badge: null },
    {
      name: "Reports",
      href: "/app/reports",
      icon: DocumentChartBarIcon,
      badge: null,
    },
    // Custom Fields - for managers and admins
    ...(user?.role === "manager" ||
    user?.role === "company_admin" ||
    user?.role === "super_admin"
      ? [
          {
            name: "Custom Fields",
            href: "/app/custom-fields",
            icon: RectangleGroupIcon,
            badge: null,
          },
        ]
      : []),
    // Scoring Rules - for managers and admins
    ...(user?.role === "manager" ||
    user?.role === "company_admin" ||
    user?.role === "super_admin"
      ? [
          {
            name: "Scoring Rules",
            href: "/app/scoring",
            icon: TrophyIcon,
            badge: null,
          },
        ]
      : []),
    // API Clients - only for company_admin and super_admin
    ...(user?.role === "company_admin" || user?.role === "super_admin"
      ? [
          {
            name: "API Clients",
            href: "/app/api-clients",
            icon: KeyIcon,
            badge: null,
          },
        ]
      : []),
    // Platform Admin link - only for super_admin
    ...(user?.role === "super_admin"
      ? [
          {
            name: "Platform Admin",
            href: "/platform",
            icon: CommandLineIcon,
            badge: null,
            className: "border-t border-gray-200 pt-2 mt-2",
          },
        ]
      : []),
  ];

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.key === "b") {
        e.preventDefault();
        setIsCollapsed(!isCollapsed);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isCollapsed, setIsCollapsed]);

  // Check if any email sub-item is active
  const isEmailSectionActive = () => {
    const currentPath = window.location.pathname;
    return emailSubItems.some((item) => currentPath === item.href);
  };

  // Navigation item component
  const NavItem = ({ item, isCollapsed, onClick }) => (
    <NavLink
      to={item.href}
      onClick={onClick}
      className={({ isActive }) =>
        `group relative flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-primary-500 text-white shadow-sm"
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        } ${isCollapsed ? "justify-center" : ""}`
      }
      title={isCollapsed ? item.name : undefined}
    >
      <item.icon
        className={`h-5 w-5 flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`}
        aria-hidden="true"
      />
      {!isCollapsed && (
        <>
          <span className="truncate">{item.name}</span>
          {item.badge && (
            <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
              {item.badge}
            </span>
          )}
        </>
      )}
      {isCollapsed && item.badge && (
        <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
          {item.badge}
        </span>
      )}
    </NavLink>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={sidebarOpen} as={Fragment}>
        <Dialog
          as="div"
          className="relative z-40 md:hidden"
          onClose={setSidebarOpen}
        >
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
          </Transition.Child>

          <div className="fixed inset-0 flex z-40">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative flex-1 flex flex-col w-60 bg-gray-50">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute top-0 right-0 -mr-12 pt-2">
                    <button
                      type="button"
                      className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                      onClick={() => setSidebarOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>
                <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
                  {/* Logo */}
                  <div className="flex items-center px-4 mb-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">S</span>
                      </div>
                      <span className="ml-3 text-xl font-bold text-gray-900">
                        Sakha
                      </span>
                    </div>
                  </div>

                  {/* Main Navigation */}
                  <nav className="px-2 space-y-1 mb-6">
                    {mainNavigation.map((item) => (
                      <NavItem
                        key={item.name}
                        item={item}
                        isCollapsed={false}
                        onClick={() => setSidebarOpen(false)}
                      />
                    ))}
                  </nav>

                  {/* Email Section */}
                  <nav className="px-2 space-y-1 mb-6">
                    {/* Email Parent Item */}
                    <div className="mb-1">
                      <button
                        onClick={() =>
                          setEmailSectionExpanded(!emailSectionExpanded)
                        }
                        className={`group relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                          isEmailSectionActive()
                            ? "bg-primary-500 text-white shadow-sm"
                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        }`}
                      >
                        <EnvelopeIcon
                          className="h-5 w-5 flex-shrink-0 mr-3"
                          aria-hidden="true"
                        />
                        <span className="truncate">Email</span>
                        {emailSectionExpanded ? (
                          <ChevronDownIcon
                            className="h-4 w-4 ml-auto"
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronRightIcon
                            className="h-4 w-4 ml-auto"
                            aria-hidden="true"
                          />
                        )}
                      </button>

                      {/* Email Sub-items */}
                      {emailSectionExpanded && (
                        <div className="ml-6 mt-1 space-y-1">
                          {emailSubItems.map((subItem) => (
                            <NavLink
                              key={subItem.name}
                              to={subItem.href}
                              onClick={() => setSidebarOpen(false)}
                              className={({ isActive }) =>
                                `group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                                  isActive
                                    ? "bg-primary-100 text-primary-700"
                                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                }`
                              }
                            >
                              <subItem.icon
                                className="h-4 w-4 flex-shrink-0 mr-3"
                                aria-hidden="true"
                              />
                              <span className="truncate">{subItem.name}</span>
                            </NavLink>
                          ))}
                        </div>
                      )}
                    </div>
                  </nav>

                  {/* Divider */}
                  <div className="px-4 mb-4">
                    <div className="border-t border-gray-200"></div>
                  </div>

                  {/* Utility Navigation */}
                  <nav className="px-2 space-y-1">
                    {utilityNavigation.map((item) => (
                      <NavItem
                        key={item.name}
                        item={item}
                        isCollapsed={false}
                        onClick={() => setSidebarOpen(false)}
                      />
                    ))}
                  </nav>
                </div>

                {/* User Profile */}
                <div className="flex-shrink-0 border-t border-gray-200 p-4">
                  <Menu as="div" className="relative">
                    <Menu.Button className="flex items-center w-full text-left">
                      <div className="flex-shrink-0">
                        <UserCircleIcon className="h-8 w-8 text-gray-400" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-800">
                          {user?.first_name} {user?.last_name}
                        </div>
                        <div className="text-xs text-gray-500 capitalize">
                          {user?.role?.replace("_", " ")}
                        </div>
                      </div>
                    </Menu.Button>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-100"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                        <div className="py-1">
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => navigate("/app/profile")}
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <UserCircleIcon className="h-4 w-4 mr-3" />
                                My Profile
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={() => navigate("/app/settings")}
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                <Cog6ToothIcon className="h-4 w-4 mr-3" />
                                Settings
                              </button>
                            )}
                          </Menu.Item>
                          <Menu.Item>
                            {({ active }) => (
                              <button
                                onClick={logout}
                                className={`${
                                  active ? "bg-gray-100" : ""
                                } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                              >
                                Sign out
                              </button>
                            )}
                          </Menu.Item>
                        </div>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                </div>
              </Dialog.Panel>
            </Transition.Child>
            <div className="flex-shrink-0 w-14">
              {/* Force sidebar to shrink to fit close icon */}
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      {/* Desktop sidebar - always w-60 container, but nav inside can hide/show text */}
      <div
        className={`hidden md:flex md:flex-shrink-0 transition-all duration-300 ${
          isCollapsed && !isHovered ? "md:w-16" : "md:w-60"
        }`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex flex-col w-full bg-gray-50 border-r border-gray-200">
          {/* Header - Always shows full logo and text */}
          <div className="flex-shrink-0 flex items-center px-4 py-4 border-b border-gray-200 min-w-0">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">S</span>
            </div>
            <span
              className={`ml-3 text-lg font-bold text-gray-900 transition-opacity duration-300 ${
                isCollapsed && !isHovered ? "opacity-0 w-0" : "opacity-100"
              }`}
            >
              Sakha
            </span>
          </div>

          {/* Scrollable Content */}
          <div className="flex flex-col h-0 flex-1">
            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-4">
              {/* Main Navigation */}
              <nav className="px-2 space-y-1 mb-6">
                {mainNavigation.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isCollapsed={isCollapsed && !isHovered}
                  />
                ))}
              </nav>

              {/* Email Section */}
              <nav className="px-2 space-y-1 mb-6">
                {/* Email Parent Item */}
                <div className="mb-1">
                  <button
                    onClick={() =>
                      setEmailSectionExpanded(!emailSectionExpanded)
                    }
                    className={`group relative w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isEmailSectionActive()
                        ? "bg-primary-500 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    } ${isCollapsed && !isHovered ? "justify-center" : ""}`}
                    title={isCollapsed && !isHovered ? "Email" : undefined}
                  >
                    <EnvelopeIcon
                      className={`h-5 w-5 flex-shrink-0 ${
                        isCollapsed && !isHovered ? "" : "mr-3"
                      }`}
                      aria-hidden="true"
                    />
                    {(!isCollapsed || isHovered) && (
                      <>
                        <span className="truncate">Email</span>
                        {emailSectionExpanded ? (
                          <ChevronDownIcon
                            className="h-4 w-4 ml-auto"
                            aria-hidden="true"
                          />
                        ) : (
                          <ChevronRightIcon
                            className="h-4 w-4 ml-auto"
                            aria-hidden="true"
                          />
                        )}
                      </>
                    )}
                  </button>

                  {/* Email Sub-items */}
                  {emailSectionExpanded && (!isCollapsed || isHovered) && (
                    <div className="ml-6 mt-1 space-y-1">
                      {emailSubItems.map((subItem) => (
                        <NavLink
                          key={subItem.name}
                          to={subItem.href}
                          className={({ isActive }) =>
                            `group relative flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                              isActive
                                ? "bg-primary-100 text-primary-700"
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            }`
                          }
                        >
                          <subItem.icon
                            className="h-4 w-4 flex-shrink-0 mr-3"
                            aria-hidden="true"
                          />
                          <span className="truncate">{subItem.name}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              </nav>

              {/* Divider */}
              <div className="px-4 mb-4">
                <div className="border-t border-gray-200"></div>
              </div>

              {/* Utility Navigation */}
              <nav className="px-2 space-y-1">
                {utilityNavigation.map((item) => (
                  <NavItem
                    key={item.name}
                    item={item}
                    isCollapsed={isCollapsed && !isHovered}
                  />
                ))}
              </nav>
            </div>

            {/* User Profile */}
            <div className="flex-shrink-0 border-t border-gray-200 p-4">
              <Menu as="div" className="relative">
                <Menu.Button className="flex items-center w-full text-left">
                  <div className="flex-shrink-0">
                    <UserCircleIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  {(!isCollapsed || isHovered) && (
                    <div className="ml-3 flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-800 truncate">
                        {user?.first_name} {user?.last_name}
                      </div>
                      <div className="text-xs text-gray-500 capitalize truncate">
                        {user?.role?.replace("_", " ")}
                      </div>
                    </div>
                  )}
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
                    <div className="py-1">
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => navigate("/app/profile")}
                            className={`${
                              active ? "bg-gray-100" : ""
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            <UserCircleIcon className="h-4 w-4 mr-3" />
                            My Profile
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => navigate("/app/settings")}
                            className={`${
                              active ? "bg-gray-100" : ""
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            <Cog6ToothIcon className="h-4 w-4 mr-3" />
                            Settings
                          </button>
                        )}
                      </Menu.Item>
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`${
                              active ? "bg-gray-100" : ""
                            } flex items-center w-full px-4 py-2 text-sm text-gray-700`}
                          >
                            Sign out
                          </button>
                        )}
                      </Menu.Item>
                    </div>
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
