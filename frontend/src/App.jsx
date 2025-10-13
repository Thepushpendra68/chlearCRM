import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { LeadProvider } from './context/LeadContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
const Homepage = lazy(() => import('./pages/Homepage'))
const Login = lazy(() => import('./pages/Login'))
const RegisterCompany = lazy(() => import('./pages/RegisterCompany'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Leads = lazy(() => import('./pages/Leads'))
const LeadDetail = lazy(() => import('./pages/LeadDetail'))
const Pipeline = lazy(() => import('./pages/Pipeline'))
const Activities = lazy(() => import('./pages/Activities'))
const Assignments = lazy(() => import('./pages/Assignments'))
const Users = lazy(() => import('./pages/Users'))
const Reports = lazy(() => import('./pages/Reports'))
const Tasks = lazy(() => import('./pages/Tasks'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const Profile = lazy(() => import('./pages/Profile'))
const Settings = lazy(() => import('./pages/Settings'))
const Layout = lazy(() => import('./components/Layout/Layout'))
const PlatformLayout = lazy(() => import('./components/Platform/PlatformLayout'))
const PlatformDashboard = lazy(() => import('./pages/Platform/PlatformDashboard'))
const Companies = lazy(() => import('./pages/Platform/Companies'))
const CompanyDetails = lazy(() => import('./pages/Platform/CompanyDetails'))
const AuditLogs = lazy(() => import('./pages/Platform/AuditLogs'))
const PlatformUsers = lazy(() => import('./pages/Platform/PlatformUsers'))
const PlatformAnalytics = lazy(() => import('./pages/Platform/PlatformAnalytics'))
const PlatformActivity = lazy(() => import('./pages/Platform/PlatformActivity'))

const RouteLoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="h-12 w-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
  </div>
)

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LeadProvider>
          <div className="min-h-screen bg-gray-50">
          <Suspense fallback={<RouteLoadingFallback />}><Routes>
            {/* Public routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Navigate to="/register-company" replace />} />
            <Route path="/register-company" element={<RegisterCompany />} />
            <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
            
            {/* Protected routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="/app/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="leads" element={<Leads />} />
              <Route path="leads/:id" element={<LeadDetail />} />
              <Route path="pipeline" element={<Pipeline />} />
              <Route path="activities" element={<Activities />} />
              <Route path="assignments" element={
                <RoleProtectedRoute allowedRoles={['manager', 'company_admin', 'super_admin']}>
                  <Assignments />
                </RoleProtectedRoute>
              } />
              <Route path="users" element={
                <RoleProtectedRoute allowedRoles={['company_admin', 'super_admin']}>
                  <Users />
                </RoleProtectedRoute>
              } />
              <Route path="reports" element={
                <RoleProtectedRoute allowedRoles={['manager', 'company_admin', 'super_admin']}>
                  <Reports />
                </RoleProtectedRoute>
              } />
              <Route path="tasks" element={<Tasks />} />
              <Route path="search" element={<SearchResults />} />
              <Route path="profile" element={<Profile />} />
              <Route path="settings" element={<Settings />} />
            </Route>

            {/* Platform routes - Super Admin only */}
            <Route path="/platform" element={
              <ProtectedRoute>
                <PlatformLayout />
              </ProtectedRoute>
            }>
              <Route index element={<PlatformDashboard />} />
              <Route path="companies" element={<Companies />} />
              <Route path="companies/:companyId" element={<CompanyDetails />} />
              <Route path="users" element={<PlatformUsers />} />
              <Route path="analytics" element={<PlatformAnalytics />} />
              <Route path="audit-logs" element={<AuditLogs />} />
              <Route path="activity" element={<PlatformActivity />} />
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes></Suspense>
          
          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#10B981',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#EF4444',
                  secondary: '#fff',
                },
              },
            }}
          />
          </div>
        </LeadProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App