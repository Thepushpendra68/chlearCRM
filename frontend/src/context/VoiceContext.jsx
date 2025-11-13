import React, { createContext, useContext, useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

const VoiceContext = createContext()

/**
 * Voice Settings Default Values
 */
const DEFAULT_VOICE_SETTINGS = {
  enabled: true,
  language: 'en-US',
  autoSpeak: true,
  voiceActivation: false,
  wakeWord: 'Hey Sakha',
  rate: 1.0,
  pitch: 1.0,
  volume: 1.0,
  silenceDelay: 5000,
  privacy: {
    storeVoiceNotes: true,
    allowVoiceAnalytics: true,
    dataRetentionDays: 30
  }
}

/**
 * Voice Context Provider
 * Manages global voice settings and state
 */
export const VoiceProvider = ({ children }) => {
  const [settings, setSettings] = useState(DEFAULT_VOICE_SETTINGS)
  const [loading, setLoading] = useState(false)
  const [initialized, setInitialized] = useState(false)

  // Load voice settings on mount
  useEffect(() => {
    loadVoiceSettings()
  }, [])

  /**
   * Load voice settings from API
   */
  const loadVoiceSettings = async () => {
    try {
      setLoading(true)
      const response = await api.get('/voice/settings')

      if (response.data && response.data.success) {
        const apiSettings = response.data.data

        // Merge with defaults
        setSettings({
          ...DEFAULT_VOICE_SETTINGS,
          ...apiSettings,
          privacy: {
            ...DEFAULT_VOICE_SETTINGS.privacy,
            ...apiSettings.privacy
          }
        })
      }
    } catch (error) {
      console.error('Error loading voice settings:', error)
      // Use defaults on error
    } finally {
      setLoading(false)
      setInitialized(true)
    }
  }

  /**
   * Update voice settings
   */
  const updateSettings = async (newSettings) => {
    try {
      setLoading(true)

      const updatedSettings = {
        ...settings,
        ...newSettings,
        privacy: {
          ...settings.privacy,
          ...(newSettings.privacy || {})
        }
      }

      const response = await api.put('/voice/settings', updatedSettings)

      if (response.data && response.data.success) {
        setSettings(updatedSettings)
        toast.success('Voice settings updated')
        return true
      }

      throw new Error('Failed to update settings')
    } catch (error) {
      console.error('Error updating voice settings:', error)
      toast.error('Failed to update voice settings')
      return false
    } finally {
      setLoading(false)
    }
  }

  /**
   * Update a single setting
   */
  const updateSetting = async (key, value) => {
    return await updateSettings({ [key]: value })
  }

  /**
   * Reset to defaults
   */
  const resetToDefaults = async () => {
    return await updateSettings(DEFAULT_VOICE_SETTINGS)
  }

  /**
   * Toggle voice feature
   */
  const toggleVoiceFeature = async () => {
    return await updateSetting('enabled', !settings.enabled)
  }

  /**
   * Toggle auto-speak
   */
  const toggleAutoSpeak = async () => {
    return await updateSetting('autoSpeak', !settings.autoSpeak)
  }

  /**
   * Toggle voice activation
   */
  const toggleVoiceActivation = async () => {
    return await updateSetting('voiceActivation', !settings.voiceActivation)
  }

  /**
   * Update language
   */
  const updateLanguage = async (language) => {
    return await updateSetting('language', language)
  }

  /**
   * Update speech rate
   */
  const updateRate = async (rate) => {
    return await updateSetting('rate', rate)
  }

  /**
   * Update speech pitch
   */
  const updatePitch = async (pitch) => {
    return await updateSetting('pitch', pitch)
  }

  /**
   * Update volume
   */
  const updateVolume = async (volume) => {
    return await updateSetting('volume', volume)
  }

  /**
   * Update silence delay
   */
  const updateSilenceDelay = async (delay) => {
    return await updateSetting('silenceDelay', delay)
  }

  /**
   * Update privacy settings
   */
  const updatePrivacySettings = async (privacySettings) => {
    return await updateSettings({ privacy: privacySettings })
  }

  /**
   * Toggle voice note storage
   */
  const toggleVoiceNoteStorage = async () => {
    const newValue = !settings.privacy.storeVoiceNotes
    return await updatePrivacySettings({ storeVoiceNotes: newValue })
  }

  /**
   * Toggle voice analytics
   */
  const toggleVoiceAnalytics = async () => {
    const newValue = !settings.privacy.allowVoiceAnalytics
    return await updatePrivacySettings({ allowVoiceAnalytics: newValue })
  }

  /**
   * Update data retention period
   */
  const updateDataRetention = async (days) => {
    return await updatePrivacySettings({ dataRetentionDays: days })
  }

  /**
   * Check if voice is enabled
   */
  const isEnabled = () => {
    return settings.enabled
  }

  /**
   * Get language display name
   */
  const getLanguageName = () => {
    const languages = {
      'en-US': 'English (US)',
      'en-GB': 'English (UK)',
      'hi-IN': 'Hindi (India)',
      'es-ES': 'Spanish',
      'fr-FR': 'French',
      'de-DE': 'German',
      'zh-CN': 'Chinese (Simplified)'
    }
    return languages[settings.language] || settings.language
  }

  /**
   * Get privacy settings summary
   */
  const getPrivacySummary = () => {
    return {
      storageEnabled: settings.privacy.storeVoiceNotes,
      analyticsEnabled: settings.privacy.allowVoiceAnalytics,
      retentionDays: settings.privacy.dataRetentionDays
    }
  }

  const value = {
    // Settings
    settings,
    loading,
    initialized,

    // Actions
    updateSettings,
    updateSetting,
    resetToDefaults,

    // Convenience methods
    toggleVoiceFeature,
    toggleAutoSpeak,
    toggleVoiceActivation,
    updateLanguage,
    updateRate,
    updatePitch,
    updateVolume,
    updateSilenceDelay,
    updatePrivacySettings,
    toggleVoiceNoteStorage,
    toggleVoiceAnalytics,
    updateDataRetention,

    // Utilities
    isEnabled,
    getLanguageName,
    getPrivacySummary
  }

  return (
    <VoiceContext.Provider value={value}>
      {children}
    </VoiceContext.Provider>
  )
}

/**
 * Custom hook to use voice context
 */
export const useVoiceContext = () => {
  const context = useContext(VoiceContext)

  if (!context) {
    throw new Error('useVoiceContext must be used within VoiceProvider')
  }

  return context
}

export default VoiceContext
