/**
 * Role-based Protected Route Component
 * Provides fine-grained access control based on user roles and permissions
 * Supports hierarchical role checking and fallback routes
 */

import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline'

/**
 * Role hierarchy levels for permission checking
 */
const ROLE_LEVELS = {
  'sales_rep': 1,
  'manager': 2,
  'company_admin': 3,
  'super_admin': 4
}

/**
 * Default permission map for routes
 */
const ROUTE_PERMISSIONS = {
  '/app/dashboard': ['sales_rep', 'manager', 'company_admin', 'super_admin'],
  '/app/leads': ['sales_rep', 'manager', 'company_admin', 'super_admin'],
  '/app/pipeline': ['sales_rep', 'manager', 'company_admin', 'super_admin'],
  '/app/activities': ['sales_rep', 'manager', 'company_admin', 'super_admin'],
  '/app/tasks': ['sales_rep', 'manager', 'company_admin', 'super_admin'],
  '/app/assignments': ['manager', 'company_admin', 'super_admin'],
  '/app/reports': ['manager', 'company_admin', 'super_admin'],
  '/app/users': ['company_admin', 'super_admin'],
  '/app/search': ['sales_rep', 'manager', 'company_admin', 'super_admin']
}

/**
 * Check if user has required role level
 */
const hasRequiredRole = (userRole, requiredRoles) => {
  if (!userRole || !requiredRoles) return false

  const userLevel = ROLE_LEVELS[userRole] || 0
  return requiredRoles.some(role => {
    const requiredLevel = ROLE_LEVELS[role] || 0
    return userLevel >= requiredLevel
  })
}

/**
 * Role-based protected route component
 */
const RoleProtectedRoute = ({
  children,
  allowedRoles = null,
  fallbackRoute = '/app/dashboard',
  showAccessDenied = true
}) => {
  const { isAuthenticated, loading, user } = useAuth()
  const location = useLocation()

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Determine required roles for current route
  const currentPath = location.pathname
  const requiredRoles = allowedRoles || ROUTE_PERMISSIONS[currentPath]

  // If no role restrictions, allow access
  if (!requiredRoles) {
    return children
  }

  // Check if user has required role
  const hasAccess = hasRequiredRole(user?.role, requiredRoles)

  if (!hasAccess) {
    if (showAccessDenied) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full">
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500" />
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    Access Denied
                  </h3>
                  <div className="mt-2 text-sm text-gray-500">
                    <p>
                      You don't have permission to access this page.
                      Required role: {requiredRoles.join(' or ')}.
                      Your role: {user?.role || 'unknown'}.
                    </p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => window.history.back()}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                    >
                      Go Back
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    } else {
      // Redirect to fallback route silently
      return <Navigate to={fallbackRoute} replace />
    }
  }

  return children
}

/**
 * Higher-order component for specific role requirements
 */
export const withRoleProtection = (allowedRoles) => (Component) => {
  return function ProtectedComponent(props) {
    return (
      <RoleProtectedRoute allowedRoles={allowedRoles}>
        <Component {...props} />
      </RoleProtectedRoute>
    )
  }
}

/**
 * Hook for checking permissions in components
 */
export const usePermissions = () => {
  const { user } = useAuth()

  return {
    hasRole: (roles) => hasRequiredRole(user?.role, Array.isArray(roles) ? roles : [roles]),
    hasMinRole: (minRole) => {
      const userLevel = ROLE_LEVELS[user?.role] || 0
      const minLevel = ROLE_LEVELS[minRole] || 0
      return userLevel >= minLevel
    },
    canAccess: (route) => {
      const requiredRoles = ROUTE_PERMISSIONS[route]
      return !requiredRoles || hasRequiredRole(user?.role, requiredRoles)
    },
    userRole: user?.role,
    userLevel: ROLE_LEVELS[user?.role] || 0
  }
}

export default RoleProtectedRoute