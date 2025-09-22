import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { useState } from 'react'

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const location = useLocation()

  return (
    <div className="h-screen flex overflow-hidden bg-gray-50">
      {/* Sidebar - Fixed width, full height */}
      <Sidebar 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />
      
      {/* Main content area - Flexible width, no overlap with sidebar */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header - Only spans content area, never overlaps sidebar */}
        <Header 
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
          currentPath={location.pathname}
        />
        
        {/* Page content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none bg-white">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default Layout