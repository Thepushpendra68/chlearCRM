import { createContext, useContext, useReducer, useEffect } from 'react'
import supabase, { signIn, signUpWithCompany, signOut, getCurrentSession, getCurrentUserProfile, updateUserProfile } from '../config/supabase'
import toast from 'react-hot-toast'

const AuthContext = createContext()

// Auth reducer for state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'AUTH_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'AUTH_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        session: action.payload.session,
        error: null
      }
    case 'AUTH_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        session: null,
        error: action.payload
      }
    case 'AUTH_LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        session: null,
        error: null,
        loading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null
      }
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload
      }
    default:
      return state
  }
}

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  session: null,
  loading: true, // Start with loading true
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Initialize Supabase auth state on app load
  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        console.log('🔍 [AUTH] Initializing auth...')

        // Get current session (skip refresh for now to avoid hanging)
        const { session } = await getCurrentSession()
        console.log('🔍 [AUTH] Session check:', session?.session ? 'Found' : 'None')

        if (session?.session?.user) {
          console.log('🔍 [AUTH] Found user ID:', session.session.user.id)
          console.log('🔍 [AUTH] User email:', session.session.user.email)
        }

        if (session?.session && isMounted) {
          // Get user profile data
          console.log('🔍 [AUTH] Getting user profile for:', session.session.user.id)
          const { profile } = await getCurrentUserProfile()
          console.log('🔍 [AUTH] Profile result:', profile ? 'Found' : 'Not found')

          if (profile && isMounted) {
            console.log('✅ [AUTH] Login successful, profile:', profile.first_name, profile.last_name)
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: profile,
                session: session.session
              }
            })
          } else {
            // Profile not found, but don't logout immediately - might be RLS issue
            console.log('❌ [AUTH] Profile not found, using fallback auth data')
            const fallbackUser = {
              id: session.session.user.id,
              email: session.session.user.email,
              first_name: session.session.user.user_metadata?.first_name || 'User',
              last_name: session.session.user.user_metadata?.last_name || '',
              role: 'company_admin', // Assume company admin if no profile
              company_id: session.session.user.app_metadata?.company_id,
              company_name: 'Your Company'
            };
            dispatch({
              type: 'AUTH_SUCCESS',
              payload: {
                user: fallbackUser,
                session: session.session
              }
            })
          }
        } else {
          // No session
          console.log('🔍 [AUTH] No session found')
          if (isMounted) {
            dispatch({ type: 'AUTH_LOGOUT' })
          }
        }
      } catch (error) {
        console.error('❌ [AUTH] Auth initialization error:', error)
        if (isMounted) {
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      }
    }

    initializeAuth()

    return () => {
      isMounted = false
    }
  }, [])

  // Set up auth state change listener
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AUTH] Auth state change:', event, session ? 'with session' : 'no session')

      if (event === 'SIGNED_IN' && session) {
        console.log('🔍 [AUTH] SIGNED_IN event, getting profile...')
        // Get user profile
        const { profile } = await getCurrentUserProfile()
        console.log('🔍 [AUTH] Profile from state change:', profile ? 'Found' : 'Not found')

        if (profile) {
          console.log('✅ [AUTH] State change login successful')
          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: profile,
              session
            }
          })
        } else {
          console.log('❌ [AUTH] No profile in state change, logging out')
          dispatch({ type: 'AUTH_LOGOUT' })
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 [AUTH] SIGNED_OUT event')
        dispatch({ type: 'AUTH_LOGOUT' })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Logout function
  const logout = async () => {
    try {
      await signOut()
      dispatch({ type: 'AUTH_LOGOUT' })
      toast.success('Logged out successfully')
    } catch (error) {
      console.error('Logout error:', error)
      // Force logout even if there's an error
      dispatch({ type: 'AUTH_LOGOUT' })
      toast.success('Logged out successfully')
    }
  }

  // Login function
  const login = async (email, password) => {
    console.log('🔑 [AUTH] Starting login for:', email)
    dispatch({ type: 'AUTH_START' })

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        console.log('❌ [AUTH] Login error:', error.message)
        throw error
      }

      console.log('✅ [AUTH] Supabase sign in successful, waiting for state change...')
      // Profile will be loaded automatically by the auth state change listener
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || 'Login failed'
      console.log('❌ [AUTH] Login failed:', errorMessage)
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Register company with admin user
  const registerCompany = async (companyData, userData) => {
    dispatch({ type: 'AUTH_START' })

    try {
      const { data, error } = await signUpWithCompany(userData, companyData)

      if (error) {
        throw error
      }

      // User will be automatically signed in after email confirmation
      toast.success('Company registered successfully! Please check your email to verify your account.')
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || 'Registration failed'
      dispatch({
        type: 'AUTH_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Legacy register function for backward compatibility
  const register = async (userData) => {
    // For backward compatibility, treat as company registration
    return registerCompany(
      { name: userData.company || 'My Company' },
      userData
    )
  }

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      if (!state.user?.id) {
        throw new Error('User not authenticated')
      }

      const { data, error } = await updateUserProfile(state.user.id, profileData)

      if (error) {
        throw error
      }

      dispatch({
        type: 'UPDATE_USER',
        payload: data
      })
      toast.success('Profile updated successfully!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || 'Profile update failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  const value = {
    ...state,
    login,
    register,
    registerCompany,
    logout,
    updateProfile,
    clearError
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export default AuthContext