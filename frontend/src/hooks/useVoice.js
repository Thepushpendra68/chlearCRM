import { useState, useEffect, useCallback, useRef } from 'react'
import voiceService from '../services/voiceService'
import toast from 'react-hot-toast'

/**
 * Custom hook for voice functionality
 * Provides speech-to-text and text-to-speech capabilities
 */
export const useVoice = (options = {}) => {
  const [isListening, setIsListening] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [isSupported, setIsSupported] = useState(false)
  const [error, setError] = useState(null)

  const transcriptRef = useRef('')
  const interimRef = useRef('')

  // Initialize on mount
  useEffect(() => {
    const recognitionSupported = voiceService.isRecognitionSupported()
    const ttsSupported = voiceService.isTTSupported()
    setIsSupported(recognitionSupported && ttsSupported)

    if (!recognitionSupported) {
      setError('Speech recognition is not supported in this browser')
      console.warn('Speech recognition not supported')
    } else if (!ttsSupported) {
      setError('Text-to-speech is not supported in this browser')
      console.warn('Text-to-speech not supported')
    }

    return () => {
      voiceService.destroy()
    }
  }, [])

  // Handle transcript updates
  const handleTranscript = useCallback((result) => {
    if (result.final) {
      transcriptRef.current = result.final
      setTranscript(result.final)
      setInterimTranscript('')
      interimRef.current = ''
    } else if (result.interim) {
      interimRef.current = result.interim
      setInterimTranscript(result.interim)
    }
  }, [])

  // Handle errors
  const handleError = useCallback((errorType) => {
    let message = 'Voice recognition error'

    switch (errorType) {
      case 'no-speech':
        message = 'No speech detected. Please try again.'
        break
      case 'audio-capture':
        message = 'Microphone not accessible. Please check permissions.'
        break
      case 'not-allowed':
        message = 'Microphone access denied. Please enable in browser settings.'
        break
      case 'network':
        message = 'Network error occurred. Please check your connection.'
        break
      default:
        message = `Voice error: ${errorType}`
    }

    setError(message)
    setIsListening(false)

    // Show toast notification for user-facing errors
    if (errorType === 'not-allowed' || errorType === 'audio-capture') {
      toast.error(message)
    }
  }, [])

  // Register callbacks
  useEffect(() => {
    if (isSupported) {
      voiceService.onTranscript(handleTranscript)
      voiceService.onError(handleError)

      return () => {
        voiceService.removeTranscriptCallback(handleTranscript)
        voiceService.removeErrorCallback(handleError)
      }
    }
  }, [isSupported, handleTranscript, handleError])

  // Start listening
  const startListening = useCallback((customOptions = {}) => {
    if (!isSupported) {
      toast.error('Voice features not supported in this browser')
      return
    }

    if (isListening) {
      console.warn('Already listening')
      return
    }

    try {
      setError(null)
      transcriptRef.current = ''
      interimRef.current = ''
      setTranscript('')
      setInterimTranscript('')

      voiceService.startListening({
        ...options,
        ...customOptions
      })

      setIsListening(true)
    } catch (err) {
      console.error('Error starting voice recognition:', err)
      setError(err.message)
      toast.error('Failed to start voice recognition')
    }
  }, [isSupported, isListening, options])

  // Stop listening
  const stopListening = useCallback(() => {
    if (isListening) {
      voiceService.stopListening()
      setIsListening(false)
    }
  }, [isListening])

  // Speak text
  const speak = useCallback((text, customOptions = {}) => {
    if (!isSupported) {
      console.warn('TTS not supported')
      return
    }

    if (isSpeaking) {
      voiceService.stopSpeaking()
    }

    try {
      setIsSpeaking(true)

      // Format text for speech
      const formattedText = voiceService.formatForSpeech(text)

      voiceService.speak(formattedText, {
        rate: options.rate || 1.0,
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0,
        language: options.language || 'en-US',
        ...customOptions
      })
    } catch (err) {
      console.error('Error speaking:', err)
      setIsSpeaking(false)
      setError(err.message)
    }
  }, [isSupported, isSpeaking, options])

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    if (isSpeaking) {
      voiceService.stopSpeaking()
      setIsSpeaking(false)
    }
  }, [isSpeaking])

  // Toggle listening
  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }, [isListening, startListening, stopListening])

  // Get current transcript (final + interim)
  const getCurrentTranscript = useCallback(() => {
    return (transcriptRef.current + ' ' + interimRef.current).trim()
  }, [])

  // Clear transcript
  const clearTranscript = useCallback(() => {
    transcriptRef.current = ''
    interimRef.current = ''
    setTranscript('')
    setInterimTranscript('')
    setError(null)
  }, [])

  // Get supported languages
  const getSupportedLanguages = useCallback(() => {
    return voiceService.getSupportedLanguages()
  }, [])

  // Set voice settings
  const setVoiceSettings = useCallback((settings) => {
    voiceService.setVoiceSettings(settings)
  }, [])

  // Pre-process transcript
  const preprocessTranscript = useCallback((text) => {
    return voiceService.preprocessTranscript(text)
  }, [])

  // Get available voices
  const getVoices = useCallback(() => {
    return voiceService.getVoices()
  }, [])

  return {
    // State
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    isSupported,
    error,

    // Actions
    startListening,
    stopListening,
    toggleListening,
    speak,
    stopSpeaking,
    clearTranscript,

    // Utilities
    getCurrentTranscript,
    getSupportedLanguages,
    setVoiceSettings,
    preprocessTranscript,
    getVoices
  }
}

export default useVoice
