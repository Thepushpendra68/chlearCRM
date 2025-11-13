import React, { useState, useRef, useEffect } from 'react'
import useVoice from '../../hooks/useVoice'
import VoiceToggle from './VoiceToggle'
import WaveformVisualizer from './WaveformVisualizer'
import { useVoiceContext } from '../../context/VoiceContext'

/**
 * Voice Input Component
 * Combines text input with voice capabilities
 */
const VoiceInput = ({
  value = '',
  onChange,
  onVoiceTranscript,
  placeholder = 'Type or speak...',
  disabled = false,
  className = '',
  showWaveform = true,
  autoSpeak = true,
  ...props
}) => {
  const [localValue, setLocalValue] = useState(value)
  const [audioLevel, setAudioLevel] = useState(0)
  const inputRef = useRef(null)
  const waveformRef = useRef(null)

  const { settings: voiceSettings } = useVoiceContext()
  const {
    isListening,
    isSpeaking,
    isSupported,
    error,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    clearTranscript
  } = useVoice({
    language: voiceSettings.language,
    rate: voiceSettings.rate,
    pitch: voiceSettings.pitch,
    volume: voiceSettings.volume
  })

  // Update local value when prop changes
  useEffect(() => {
    setLocalValue(value)
  }, [value])

  // Handle transcript updates
  useEffect(() => {
    if (transcript) {
      const newValue = transcript
      setLocalValue(newValue)

      if (onChange) {
        onChange(newValue)
      }

      if (onVoiceTranscript) {
        onVoiceTranscript(newValue)
      }
    }
  }, [transcript, onChange, onVoiceTranscript])

  // Auto-speak responses if enabled
  useEffect(() => {
    if (autoSpeak && voiceSettings.autoSpeak && transcript && !isListening) {
      // Simulate TTS for transcript confirmation
      // In real implementation, this would come from backend
      const confirmation = 'Voice input received'
      speak(confirmation)
    }
  }, [transcript, isListening, autoSpeak, voiceSettings.autoSpeak, speak])

  // Handle text input change
  const handleTextChange = (e) => {
    const newValue = e.target.value
    setLocalValue(newValue)

    if (onChange) {
      onChange(newValue)
    }
  }

  // Handle voice toggle
  const handleVoiceToggle = () => {
    if (!isSupported) {
      return
    }

    if (isListening) {
      stopListening()
    } else {
      clearTranscript()
      startListening()
    }
  }

  // Handle keyboard shortcuts
  const handleKeyDown = (e) => {
    // Voice shortcut: Ctrl+Shift+V
    if (e.ctrlKey && e.shiftKey && e.key === 'V') {
      e.preventDefault()
      handleVoiceToggle()
    }
  }

  // Simulate audio level (in real implementation, this would come from Web Audio API)
  useEffect(() => {
    if (isListening) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random() * 100)
      }, 100)

      return () => clearInterval(interval)
    } else {
      setAudioLevel(0)
    }
  }, [isListening])

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <span className="text-sm text-gray-500">
          Voice features not supported in this browser
        </span>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`} onKeyDown={handleKeyDown}>
      {/* Main Input Container */}
      <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-300 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition-all">
        {/* Text Input */}
        <input
          ref={inputRef}
          type="text"
          value={localValue}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled || isListening}
          className="flex-1 outline-none text-sm placeholder-gray-400"
          {...props}
        />

        {/* Interim Transcript Display */}
        {interimTranscript && (
          <span className="text-sm text-blue-500 italic">
            {interimTranscript}
          </span>
        )}

        {/* Voice Toggle Button */}
        <VoiceToggle
          isListening={isListening}
          isSpeaking={isSpeaking}
          onToggle={handleVoiceToggle}
          disabled={disabled}
          size="sm"
          variant="primary"
          showLabel={false}
        />
      </div>

      {/* Waveform Visualizer */}
      {showWaveform && isListening && (
        <div className="mt-2 px-2">
          <WaveformVisualizer
            ref={waveformRef}
            isListening={isListening}
            audioLevel={audioLevel}
            height={40}
            barCount={20}
            color="rgb(59, 130, 246)"
          />
        </div>
      )}

      {/* Status Messages */}
      {error && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {error}
        </div>
      )}

      {isListening && (
        <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
          <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
          <span>Listening... Speak now</span>
          <button
            onClick={stopListening}
            className="ml-2 text-blue-700 underline hover:text-blue-800"
          >
            Stop
          </button>
        </div>
      )}

      {isSpeaking && (
        <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
          <span className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
          <span>Speaking...</span>
          <button
            onClick={stopSpeaking}
            className="ml-2 text-green-700 underline hover:text-green-800"
          >
            Stop
          </button>
        </div>
      )}

      {/* Help Text */}
      {!isListening && !isSpeaking && (
        <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
          <span>Press Ctrl+Shift+V for voice input</span>
          {voiceSettings.language && (
            <span>Language: {voiceSettings.language}</span>
          )}
        </div>
      )}
    </div>
  )
}

export default VoiceInput
