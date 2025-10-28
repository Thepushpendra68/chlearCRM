import { createContext, useContext, useReducer, useEffect, useRef } from 'react'
import supabase, { signIn, signOut, updateUserProfile, getCurrentUserProfile } from '../config/supabase'
import authService from '../services/authService'
import toast from 'react-hot-toast'
import { subscribeForcedLogout } from '../utils/authEvents'

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
        loading: false,
        impersonatedUser: null,
        originalUser: null,
        isImpersonating: false
      }
    case 'UPDATE_SESSION':
      return {
        ...state,
        session: action.payload,
        loading: false
      }
    case 'UPDATE_USER':
      return {
        ...state,
        user: { ...state.user, ...action.payload }
      }
    case 'START_IMPERSONATION':
      return {
        ...state,
        originalUser: state.user,
        impersonatedUser: action.payload,
        isImpersonating: true
      }
    case 'END_IMPERSONATION':
      return {
        ...state,
        impersonatedUser: null,
        originalUser: null,
        isImpersonating: false
      }
    case 'TOGGLE_CHAT_PANEL':
      return {
        ...state,
        chatPanelOpen: !state.chatPanelOpen
      }
    case 'SET_CHAT_MESSAGES':
      return {
        ...state,
        chatMessages: action.payload
      }
    case 'ADD_CHAT_MESSAGE':
      return {
        ...state,
        chatMessages: [...(state.chatMessages || []), action.payload]
      }
    case 'CLEAR_CHAT_MESSAGES':
      return {
        ...state,
        chatMessages: []
      }
    case 'SET_CHAT_PANEL_SIZE':
      return {
        ...state,
        chatPanelSize: action.payload
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

const getInitialState = () => ({
  isAuthenticated: false,
  user: null,
  session: null,
  loading: true,
  error: null,
  impersonatedUser: null,
  originalUser: null,
  isImpersonating: false,
  chatPanelOpen: false,
  chatMessages: [],
  chatPanelSize: { width: 400 }
})

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, null, getInitialState)
  const initializedRef = useRef(false)

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      console.log('[AUTH] Initializing auth...')

      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AUTH] Session error:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
          return;
        }

        if (session?.user) {
          console.log('[AUTH] Existing session found, fetching profile...');

          const { profile, error: profileError } = await getCurrentUserProfile();

          if (profileError || !profile) {
            console.error('[AUTH] Profile fetch error:', profileError);
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
          console.log('[AUTH] Auth initialized successfully');
        } else {
          console.log('[AUTH] No existing session found');
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } catch (error) {
        console.error('[AUTH] Initialization error:', error);
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
        console.log('[AUTH] Skipping auth event during initialization:', event);
        return;
      }

      console.log('[AUTH] Auth state change:', event);

      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[AUTH] New sign in, fetching profile...');

        try {
          const { profile, error } = await getCurrentUserProfile();

          if (error || !profile) {
            console.error('[AUTH] Failed to fetch user profile:', error);
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
          console.log('[AUTH] Sign in successful');
        } catch (error) {
          console.error('[AUTH] Error during sign in:', error);
          dispatch({ type: 'AUTH_LOGOUT' });
        }
      } else if (event === 'TOKEN_REFRESHED' && session?.user) {
        console.log('[AUTH] Token refreshed; updating session cache');
        dispatch({
          type: 'UPDATE_SESSION',
          payload: session
        });
      } else if (event === 'USER_UPDATED' && session?.user) {
        console.log('[AUTH] Supabase user metadata updated; syncing session');
        dispatch({
          type: 'UPDATE_SESSION',
          payload: session
        });
      } else if (event === 'SIGNED_OUT') {
        console.log('[AUTH] Sign out event');
        dispatch({ type: 'AUTH_LOGOUT' });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribeForcedLogout = subscribeForcedLogout(() => {
      console.log('[AUTH] Forced logout signal received');
      dispatch({ type: 'AUTH_LOGOUT' });
      localStorage.removeItem('impersonating');
    });

    return unsubscribeForcedLogout;
  }, []);

  // Logout function
  const logout = async () => {
    try {
      // Add a timeout to prevent hanging on expired sessions
      const signOutPromise = signOut();
      const timeoutPromise = new Promise((resolve) =>
        setTimeout(() => resolve({ error: null }), 3000)
      );

      await Promise.race([signOutPromise, timeoutPromise]);
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
    console.log('[AUTH] Starting login for:', email)
    dispatch({ type: 'AUTH_START' })

    try {
      const { data, error } = await signIn(email, password)

      if (error) {
        console.log('[AUTH] Login error:', error.message)
        throw error
      }

      console.log('[AUTH] Supabase sign in successful, waiting for state change...')
      // Profile will be loaded automatically by the auth state change listener
      toast.success('Login successful!')
      return { success: true }
    } catch (error) {
      const errorMessage = error.message || 'Login failed'
      console.log('[AUTH] Login failed:', errorMessage)
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
        companySlug: companyData.companySlug,
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

      // Use the API service for profile updates
      const { default: api } = await import('../services/api')
      const response = await api.put('/users/profile/me', profileData)

      if (response.data.success) {
        dispatch({
          type: 'UPDATE_USER',
          payload: response.data.data
        })
        toast.success('Profile updated successfully!')
        return { success: true, data: response.data.data }
      } else {
        throw new Error('Profile update failed')
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Profile update failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  const applyUserPatch = (updates) => {
    if (!updates || typeof updates !== 'object') {
      return
    }
    dispatch({
      type: 'UPDATE_USER',
      payload: updates
    })
  }

  // Upload avatar (placeholder for future Supabase Storage implementation)
  const uploadAvatar = async (file) => {
    try {
      if (!state.user?.id) {
        throw new Error('User not authenticated')
      }

      // TODO: Implement Supabase Storage upload
      // For now, return a placeholder message
      console.log('Avatar upload not yet implemented:', file.name)
      toast.info('Avatar upload feature coming soon')
      return { success: false, message: 'Avatar upload coming soon' }
    } catch (error) {
      const errorMessage = error.message || 'Avatar upload failed'
      toast.error(errorMessage)
      return { success: false, error: errorMessage }
    }
  }

  // Clear error
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' })
  }

  // Toggle chat panel
  const toggleChatPanel = () => {
    dispatch({ type: 'TOGGLE_CHAT_PANEL' })
  }

  // Start impersonation
  const startImpersonation = async (userId, targetUser) => {
    try {
      // Store impersonation in state
      dispatch({
        type: 'START_IMPERSONATION',
        payload: targetUser
      })

      // Store in localStorage for persistence
      localStorage.setItem('impersonating', JSON.stringify({
        userId: userId,
        user: targetUser
      }))

      // Import api here to avoid circular dependency
      const api = (await import('../services/api')).default

      // Set impersonation header
      api.defaults.headers.common['x-impersonate-user-id'] = userId

      toast.success(`Now impersonating ${targetUser.first_name} ${targetUser.last_name}`)

      // Redirect to dashboard to see impersonated user's view
      window.location.href = '/app/dashboard'

      return { success: true }
    } catch (error) {
      console.error('Failed to start impersonation:', error)
      toast.error('Failed to start impersonation')
      dispatch({ type: 'END_IMPERSONATION' })
      localStorage.removeItem('impersonating')
      return { success: false, error: error.message }
    }
  }

  // End impersonation
  const endImpersonation = async () => {
    try {
      // Import api here to avoid circular dependency
      const api = (await import('../services/api')).default

      // Remove impersonation header
      delete api.defaults.headers.common['x-impersonate-user-id']

      // Clear state
      dispatch({ type: 'END_IMPERSONATION' })

      // Clear localStorage
      localStorage.removeItem('impersonating')

      // Call backend to log end of impersonation
      try {
        await api.post('/platform/impersonate/end')
      } catch (error) {
        console.error('Failed to log end of impersonation:', error)
        // Don't fail the whole operation if logging fails
      }

      toast.success('Impersonation ended')

      // Reload to restore original user view
      window.location.href = '/platform'

      return { success: true }
    } catch (error) {
      console.error('Failed to end impersonation:', error)
      toast.error('Failed to end impersonation')
      return { success: false, error: error.message }
    }
  }

  // Restore impersonation on page load
  useEffect(() => {
    const restoreImpersonation = async () => {
      const impersonating = localStorage.getItem('impersonating')
      if (impersonating && state.isAuthenticated && state.user?.role === 'super_admin') {
        try {
          const { userId, user } = JSON.parse(impersonating)

          // Restore state
          dispatch({
            type: 'START_IMPERSONATION',
            payload: user
          })

          // Import api here to avoid circular dependency
          const api = (await import('../services/api')).default

          // Restore header
          api.defaults.headers.common['x-impersonate-user-id'] = userId
        } catch (error) {
          console.error('Failed to restore impersonation:', error)
          localStorage.removeItem('impersonating')
        }
      }
    }

    restoreImpersonation()
  }, [state.isAuthenticated, state.user])

  // Load chat messages from localStorage
  const loadChatMessages = (userId) => {
    try {
      const key = `sakha_chatMessages_${userId}`
      const messages = localStorage.getItem(key)
      if (messages) {
        dispatch({ type: 'SET_CHAT_MESSAGES', payload: JSON.parse(messages) })
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error)
    }
  }

  // Save chat messages to localStorage
  const saveChatMessages = (userId, messages) => {
    try {
      const key = `sakha_chatMessages_${userId}`
      localStorage.setItem(key, JSON.stringify(messages))
    } catch (error) {
      console.error('Failed to save chat messages:', error)
    }
  }

  // Add a message to chat
  const addChatMessage = (message) => {
    dispatch({ type: 'ADD_CHAT_MESSAGE', payload: message })
    if (state.user?.id) {
      saveChatMessages(state.user.id, [...state.chatMessages, message])
    }
  }

  // Clear all chat messages
  const clearChatMessages = () => {
    dispatch({ type: 'CLEAR_CHAT_MESSAGES' })
    if (state.user?.id) {
      const key = `sakha_chatMessages_${state.user.id}`
      localStorage.removeItem(key)
    }
  }

  // Set chat panel size
  const setChatPanelSize = (size) => {
    dispatch({ type: 'SET_CHAT_PANEL_SIZE', payload: size })
    try {
      const key = `sakha_chatPanelSize_${state.user?.id}`
      localStorage.setItem(key, JSON.stringify(size))
    } catch (error) {
      console.error('Failed to save chat panel size:', error)
    }
  }

  // Load chat panel size from localStorage
  const loadChatPanelSize = (userId) => {
    try {
      const key = `sakha_chatPanelSize_${userId}`
      const size = localStorage.getItem(key)
      if (size) {
        dispatch({ type: 'SET_CHAT_PANEL_SIZE', payload: JSON.parse(size) })
      }
    } catch (error) {
      console.error('Failed to load chat panel size:', error)
    }
  }

  // Load chat data when user logs in
  useEffect(() => {
    if (state.user?.id) {
      loadChatMessages(state.user.id)
      loadChatPanelSize(state.user.id)
    }
  }, [state.user?.id])

  const value = {
    ...state,
    login,
    register,
    registerCompany,
    logout,
    updateProfile,
    applyUserPatch,
    uploadAvatar,
    clearError,
    toggleChatPanel,
    startImpersonation,
    endImpersonation,
    addChatMessage,
    clearChatMessages,
    setChatPanelSize,
    loadChatMessages,
    loadChatPanelSize
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
