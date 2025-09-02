import { createContext, useContext, useReducer, useEffect } from 'react'
import authService from '../services/authService'
import toast from 'react-hot-toast'

const AuthContext = createContext()

// Auth reducer for state management
const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        loading: true,
        error: null
      }
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        loading: false,
        isAuthenticated: true,
        user: action.payload.user,
        token: action.payload.accessToken,
        error: null
      }
    case 'LOGIN_FAILURE':
      return {
        ...state,
        loading: false,
        isAuthenticated: false,
        user: null,
        token: null,
        error: action.payload
      }
    case 'LOGOUT':
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        token: null,
        error: null
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
    default:
      return state
  }
}

// Initial state
const initialState = {
  isAuthenticated: false,
  user: null,
  token: localStorage.getItem('token'),
  loading: false,
  error: null
}

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  // Check for existing token on app load
  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user data
      authService.getProfile()
        .then(response => {
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: response.data.data.user,
              accessToken: token
            }
          })
        })
        .catch((error) => {
          console.error('Token validation failed:', error)
          // Token is invalid, remove it
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          dispatch({ type: 'LOGOUT' })
        })
    }
  }, [])

  // Logout function
  const logout = async () => {
    try {
      await authService.logout()
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      dispatch({ type: 'LOGOUT' })
      toast.success('Logged out successfully')
    }
  }

  // Set up periodic token validation
  useEffect(() => {
    if (state.isAuthenticated && state.token) {
      const interval = setInterval(() => {
        authService.getProfile()
          .catch((error) => {
            if (error.response?.status === 401) {
              console.log('Token expired, logging out...')
              logout()
            }
          })
      }, 5 * 60 * 1000) // Check every 5 minutes

      return () => clearInterval(interval)
    }
  }, [state.isAuthenticated, state.token, logout])

  // Login function
  const login = async (email, password) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await authService.login(email, password)
      const { user, accessToken } = response.data.data
      
      // Store token in localStorage
      localStorage.setItem('token', accessToken)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken }
      })
      
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Login failed'
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Register function
  const register = async (userData) => {
    dispatch({ type: 'LOGIN_START' })
    
    try {
      const response = await authService.register(userData)
      const { user, accessToken } = response.data.data
      
      // Store token in localStorage
      localStorage.setItem('token', accessToken)
      
      dispatch({
        type: 'LOGIN_SUCCESS',
        payload: { user, accessToken }
      })
      
      toast.success('Registration successful!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Registration failed'
      dispatch({
        type: 'LOGIN_FAILURE',
        payload: errorMessage
      })
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Update user profile
  const updateProfile = async (profileData) => {
    try {
      const response = await authService.updateProfile(profileData)
      dispatch({
        type: 'UPDATE_USER',
        payload: response.data.data.user
      })
      toast.success('Profile updated successfully!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.response?.data?.error?.message || 'Profile update failed'
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