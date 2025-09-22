import { Link, useLocation } from 'react-router-dom'
import { ChevronRightIcon, HomeIcon } from '@heroicons/react/24/outline'

const Breadcrumbs = ({ currentPath }) => {
  const location = useLocation()
  
  // Generate breadcrumb items from current path
  const generateBreadcrumbs = (pathname) => {
    const pathSegments = pathname.split('/').filter(segment => segment !== '')
    const breadcrumbs = []
    
    // Always start with Dashboard
    breadcrumbs.push({
      name: 'Dashboard',
      href: '/dashboard',
      current: pathname === '/dashboard' || pathname === '/'
    })
    
    // Add other segments
    pathSegments.forEach((segment, index) => {
      const href = '/' + pathSegments.slice(0, index + 1).join('/')
      const name = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ')
      const isLast = index === pathSegments.length - 1
      
      breadcrumbs.push({
        name,
        href,
        current: isLast
      })
    })
    
    return breadcrumbs
  }
  
  const breadcrumbs = generateBreadcrumbs(location.pathname)
  
  // Don't show breadcrumbs on dashboard
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    return null
  }
  
  return (
    <nav className="flex items-center space-x-1 text-sm text-gray-500">
      <Link
        to="/dashboard"
        className="text-gray-400 hover:text-gray-500 transition-colors"
      >
        <HomeIcon className="h-4 w-4" />
        <span className="sr-only">Dashboard</span>
      </Link>
      
      {breadcrumbs.map((breadcrumb, index) => (
        <div key={breadcrumb.href} className="flex items-center">
          <ChevronRightIcon className="h-4 w-4 text-gray-400 mx-1" />
          {breadcrumb.current ? (
            <span className="text-gray-900 font-medium">
              {breadcrumb.name}
            </span>
          ) : (
            <Link
              to={breadcrumb.href}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              {breadcrumb.name}
            </Link>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumbs
