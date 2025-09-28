import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { LeadProvider } from './context/LeadContext'
import ProtectedRoute from './components/ProtectedRoute'
import RoleProtectedRoute from './components/RoleProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import Login from './pages/Login'
import RegisterCompany from './pages/RegisterCompany'
import Homepage from './pages/Homepage'
import Dashboard from './pages/Dashboard'
import Leads from './pages/Leads'
import LeadDetail from './pages/LeadDetail'
import Pipeline from './pages/Pipeline'
import Activities from './pages/Activities'
import Assignments from './pages/Assignments'
import Users from './pages/Users'
import Reports from './pages/Reports'
import Tasks from './pages/Tasks'
import SearchResults from './pages/SearchResults'
import Layout from './components/Layout/Layout'

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <LeadProvider>
          <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Homepage />} />
            <Route path="/login" element={<Login />} />
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
            </Route>
            
            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          
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