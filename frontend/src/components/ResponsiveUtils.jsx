/**
 * Responsive wrapper components for mobile, tablet, and desktop views
 */

export const MobileOnly = ({ children, className = "" }) => (
  <div className={`md:hidden ${className}`}>
    {children}
  </div>
);

export const TabletOnly = ({ children, className = "" }) => (
  <div className={`hidden md:block lg:hidden ${className}`}>
    {children}
  </div>
);

export const DesktopOnly = ({ children, className = "" }) => (
  <div className={`hidden lg:block ${className}`}>
    {children}
  </div>
);

export const MobileAndTablet = ({ children, className = "" }) => (
  <div className={`lg:hidden ${className}`}>
    {children}
  </div>
);

export const TabletAndDesktop = ({ children, className = "" }) => (
  <div className={`hidden md:block ${className}`}>
    {children}
  </div>
);

/**
 * Responsive table wrapper with proper horizontal scroll on mobile
 */
export const ResponsiveTableWrapper = ({ children, className = "" }) => (
  <div className={`overflow-x-auto -mx-4 sm:-mx-6 lg:mx-0 ${className}`}>
    <div className="inline-block min-w-full px-4 sm:px-6 lg:px-0">
      {children}
    </div>
  </div>
);

/**
 * Mobile card layout for table rows - use as alternative to tables on mobile
 */
export const TableCard = ({ children, className = "" }) => (
  <div className={`bg-white border border-gray-200 rounded-lg p-4 mb-3 hover:shadow-md transition-shadow ${className}`}>
    {children}
  </div>
);

export const TableCardRow = ({ label, value, className = "" }) => (
  <div className={`flex justify-between items-start py-2 ${className}`}>
    <span className="text-sm font-medium text-gray-600">{label}</span>
    <span className="text-sm text-gray-900 font-medium text-right">{value}</span>
  </div>
);

/**
 * Container with standardized responsive padding
 */
export const ResponsiveContainer = ({ children, className = "" }) => (
  <div className={`px-4 sm:px-6 lg:px-8 ${className}`}>
    {children}
  </div>
);

/**
 * Content wrapper with max-width constraint
 */
export const ContentWrapper = ({ children, className = "", maxWidth = "max-w-7xl" }) => (
  <div className={`${maxWidth} mx-auto ${className}`}>
    {children}
  </div>
);
