import React, { useState, useEffect } from 'react'
import { useVoiceContext } from '../../context/VoiceContext'
import { XMarkIcon, SpeakerWaveIcon, MicrophoneIcon } from '@heroicons/react/24/outline'

/**
 * Voice Settings Modal Component
 * Allows users to configure voice preferences
 */
const VoiceSettings = ({ onClose }) => {
  const {
    settings,
    loading,
    updateSettings,
    updateLanguage,
    updateRate,
    updatePitch,
    updateVolume,
    updateSilenceDelay,
    toggleAutoSpeak,
    toggleVoiceActivation,
    toggleVoiceNoteStorage,
    toggleVoiceAnalytics,
    getSupportedLanguages,
    isEnabled
  } = useVoiceContext()

  const [localSettings, setLocalSettings] = useState(settings)
  const [hasChanges, setHasChanges] = useState(false)

  useEffect(() => {
    setLocalSettings(settings)
  }, [settings])

  // Check for changes
  useEffect(() => {
    const changed = JSON.stringify(localSettings) !== JSON.stringify(settings)
    setHasChanges(changed)
  }, [localSettings, settings])

  const handleSettingChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const handlePrivacyChange = (key, value) => {
    setLocalSettings(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [key]: value
      }
    }))
  }

  const handleSave = async () => {
    const success = await updateSettings(localSettings)
    if (success) {
      onClose?.()
    }
  }

  const handleReset = async () => {
    if (window.confirm('Reset all voice settings to defaults?')) {
      // Reset logic would be in context
      setLocalSettings(settings)
    }
  }

  const languages = getSupportedLanguages()

  if (!isEnabled()) {
    return (
      <div className="p-6">
        <div className="text-center">
          <MicrophoneIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Voice Features Disabled
          </h3>
          <p className="text-gray-500 mb-4">
            Enable voice features in your settings to use voice input and commands.
          </p>
          <button
            onClick={() => updateSettings({ enabled: true })}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Enable Voice Features
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <SpeakerWaveIcon className="w-6 h-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">
            Voice Settings
          </h2>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Language Settings */}
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Language & Recognition
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speech Recognition Language
              </label>
              <select
                value={localSettings.language}
                onChange={(e) => updateLanguage(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {languages.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        {/* Voice Output Settings */}
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Voice Output
          </h3>
          <div className="space-y-4">
            {/* Auto Speak */}
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Auto-speak Responses
                </label>
                <p className="text-xs text-gray-500">
                  Automatically speak chatbot responses
                </p>
              </div>
              <button
                onClick={toggleAutoSpeak}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.autoSpeak ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.autoSpeak ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Speech Rate */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speech Rate: {localSettings.rate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localSettings.rate}
                onChange={(e) => handleSettingChange('rate', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Slow (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Fast (2.0x)</span>
              </div>
            </div>

            {/* Speech Pitch */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Speech Pitch: {localSettings.pitch.toFixed(1)}
              </label>
              <input
                type="range"
                min="0.5"
                max="2"
                step="0.1"
                value={localSettings.pitch}
                onChange={(e) => handleSettingChange('pitch', parseFloat(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low (0.5)</span>
                <span>Normal (1.0)</span>
                <span>High (2.0)</span>
              </div>
            </div>

            {/* Speech Volume */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Volume: {Math.round(localSettings.volume * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localSettings.volume}
                onChange={(e) => handleSettingChange('volume', parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
          </div>
        </section>

        {/* Voice Activation */}
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Voice Activation
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Continuous Listening
                </label>
                <p className="text-xs text-gray-500">
                  Listen for wake word "{localSettings.wakeWord}"
                </p>
              </div>
              <button
                onClick={toggleVoiceActivation}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.voiceActivation ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.voiceActivation ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Silence Delay */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Silence Timeout: {localSettings.silenceDelay / 1000}s
              </label>
              <input
                type="range"
                min="2000"
                max="15000"
                step="1000"
                value={localSettings.silenceDelay}
                onChange={(e) => updateSilenceDelay(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>2s</span>
                <span>5s</span>
                <span>15s</span>
              </div>
            </div>
          </div>
        </section>

        {/* Privacy Settings */}
        <section>
          <h3 className="text-lg font-medium text-gray-900 mb-3">
            Privacy & Data
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Store Voice Notes
                </label>
                <p className="text-xs text-gray-500">
                  Allow saving voice recordings
                </p>
              </div>
              <button
                onClick={toggleVoiceNoteStorage}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.privacy.storeVoiceNotes ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.privacy.storeVoiceNotes ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Voice Analytics
                </label>
                <p className="text-xs text-gray-500">
                  Help improve voice features
                </p>
              </div>
              <button
                onClick={toggleVoiceAnalytics}
                disabled={loading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  localSettings.privacy.allowVoiceAnalytics ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    localSettings.privacy.allowVoiceAnalytics ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Retention: {localSettings.privacy.dataRetentionDays} days
              </label>
              <input
                type="range"
                min="7"
                max="365"
                step="1"
                value={localSettings.privacy.dataRetentionDays}
                onChange={(e) => handlePrivacyChange('dataRetentionDays', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>7 days</span>
                <span>30 days</span>
                <span>365 days</span>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
        <button
          onClick={handleReset}
          className="text-sm text-gray-600 hover:text-gray-800"
        >
          Reset to Defaults
        </button>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading || !hasChanges}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default VoiceSettings
