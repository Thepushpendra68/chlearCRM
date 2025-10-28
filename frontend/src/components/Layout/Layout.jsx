import { Outlet, useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import { Suspense, lazy } from 'react'
import ImpersonationBanner from '../Platform/ImpersonationBanner'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const ChatPanel = lazy(() => import('../Chatbot/ChatPanel'))

const Layout = () => {
  const { isImpersonating, impersonatedUser, endImpersonation, chatPanelOpen } = useAuth()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(true)
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

      {/* Main content area with optional chat panel - Split layout */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        <Header
          setSidebarOpen={setSidebarOpen}
          isCollapsed={isCollapsed}
          currentPath={location.pathname}
        />

        {/* Impersonation Banner */}
        {isImpersonating && impersonatedUser && (
          <ImpersonationBanner
            impersonatedUser={impersonatedUser}
            onEnd={endImpersonation}
          />
        )}

        {/* Content and Chat Panel Container */}
        <div className="flex flex-1 overflow-hidden">
          {/* Page content - Takes remaining space, allows shrinking */}
          <main className="flex-1 min-w-0 overflow-y-auto focus:outline-none bg-white">
            <Outlet />
          </main>

          {/* Chat Panel - Appears on right side on desktop */}
          <Suspense fallback={null}>
            {chatPanelOpen && (
              <ChatPanel />
            )}
          </Suspense>
        </div>
      </div>
    </div>
  )
}

export default Layout