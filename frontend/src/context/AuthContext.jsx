import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import supabase, { signIn, signOut, updateUserProfile, getCurrentUserProfile } from '../config/supabase'
import authService from '../services/authService'
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
  const initializedRef = useRef(false)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('🔍 [AUTH] Initializing auth...')

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('❌ [AUTH] Session error:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
          return;
        }

        if (session?.user) {
          console.log('🔍 [AUTH] Existing session found, fetching profile...');

          const { profile, error: profileError } = await getCurrentUserProfile();

          if (profileError || !profile) {
            console.error('❌ [AUTH] Profile fetch error:', profileError);
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
          }

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: profile,
              session
            }
          });
          console.log('✅ [AUTH] Auth initialized successfully');
        } else {
          console.log('ℹ️ [AUTH] No existing session found');
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('❌ [AUTH] Initialization error:', error);
        dispatch({ type: 'AUTH_LOGOUT' });
      } finally {
        initializedRef.current = true;
      }
    };

    initializeAuth();
  }, []);

  // Handle auth state changes (only for actual sign in/out events)
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Skip the initial SIGNED_IN event that fires during initialization
      if (!initializedRef.current) {
        console.log('🔄 [AUTH] Skipping auth event during initialization:', event);
        return;
      }

      console.log('🔄 [AUTH] Auth state change:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('🔍 [AUTH] New sign in, fetching profile...');

        try {
          const { profile, error } = await getCurrentUserProfile();

          if (error || !profile) {
            console.error('❌ [AUTH] Failed to fetch user profile:', error);
            dispatch({ type: 'AUTH_LOGOUT' });
            return;
          }

          dispatch({
            type: 'AUTH_SUCCESS',
            payload: {
              user: profile,
              session
            }
          });
          console.log('✅ [AUTH] Sign in successful');
        } catch (error) {
          console.error('❌ [AUTH] Error during sign in:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('🚪 [AUTH] Sign out event');
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

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
      const payload = {
        companyName: companyData.name,
        subdomain: companyData.subdomain,
        industry: companyData.industry,
        size: companyData.size,
        country: companyData.country,
        email: userData.email,
        password: userData.password,
        firstName: userData.first_name,
        lastName: userData.last_name
      }

      const response = await authService.registerCompany(payload)

      dispatch({ type: 'SET_LOADING', payload: false })
      dispatch({ type: 'CLEAR_ERROR' })

      const successMessage = response?.data?.message || 'Company registered successfully! Please check your email to verify your account.'
      toast.success(successMessage)
      return { success: true }
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error.message || 'Registration failed'
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