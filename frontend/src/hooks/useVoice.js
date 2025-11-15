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
  const [audioLevel, setAudioLevel] = useState(0)

  const transcriptRef = useRef('')
  const interimRef = useRef('')

  // Initialize on mount
  useEffect(() => {
    // Check browser compatibility
    const recognitionSupported = voiceService.isRecognitionSupported()
    const ttsSupported = voiceService.isTTSupported()
    const audioContextSupported = voiceService.isAudioContextSupported()

    // Check for specific browser features
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const hasWebKitGetUserMedia = !!(navigator.webkitGetUserMedia)

    // Determine support level
    const allSupported = recognitionSupported && ttsSupported && audioContextSupported && (hasGetUserMedia || hasWebKitGetUserMedia)

    setIsSupported(allSupported)

    // Provide specific error messages
    if (!recognitionSupported) {
      const browserInfo = getBrowserInfo()
      setError(`Speech recognition is not supported in ${browserInfo.name}. Please use Chrome, Edge, or Safari.`)
      console.warn('Speech recognition not supported in this browser')
    } else if (!ttsSupported) {
      setError('Text-to-speech is not supported in this browser')
      console.warn('Text-to-speech not supported')
    } else if (!audioContextSupported) {
      setError('Web Audio API is not supported in this browser')
      console.warn('Web Audio API not supported')
    } else if (!hasGetUserMedia && !hasWebKitGetUserMedia) {
      setError('Microphone access is not supported in this browser')
      console.warn('getUserMedia not supported')
    }

    return () => {
      voiceService.destroy()
    }
  }, [])

  // Get browser information
  const getBrowserInfo = () => {
    const ua = navigator.userAgent
    let name = 'Unknown Browser'

    if (ua.indexOf('Chrome') > -1) {
      name = 'Chrome'
    } else if (ua.indexOf('Safari') > -1) {
      name = 'Safari'
    } else if (ua.indexOf('Firefox') > -1) {
      name = 'Firefox'
    } else if (ua.indexOf('Edge') > -1) {
      name = 'Edge'
    }

    return { name }
  }

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

  // Handle audio level updates
  const handleAudioLevel = useCallback((level) => {
    setAudioLevel(level)
  }, [])

  // Register callbacks
  useEffect(() => {
    if (isSupported) {
      voiceService.onTranscript(handleTranscript)
      voiceService.onError(handleError)
      voiceService.onAudioLevel(handleAudioLevel)

      return () => {
        voiceService.removeTranscriptCallback(handleTranscript)
        voiceService.removeErrorCallback(handleError)
      }
    }
  }, [isSupported, handleTranscript, handleError, handleAudioLevel])

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

  // Get detailed compatibility information
  const getCompatibilityInfo = useCallback(() => {
    const recognitionSupported = voiceService.isRecognitionSupported()
    const ttsSupported = voiceService.isTTSupported()
    const audioContextSupported = voiceService.isAudioContextSupported()
    const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
    const browserInfo = getBrowserInfo()

    return {
      browser: browserInfo.name,
      speechRecognition: recognitionSupported,
      textToSpeech: ttsSupported,
      webAudioAPI: audioContextSupported,
      microphoneAccess: hasGetUserMedia,
      fullySupported: recognitionSupported && ttsSupported && audioContextSupported && hasGetUserMedia,
      recommendations: getRecommendations(browserInfo.name, {
        recognitionSupported,
        ttsSupported,
        audioContextSupported,
        hasGetUserMedia
      })
    }
  }, [])

  // Get recommendations based on browser and feature support
  const getRecommendations = (browserName, features) => {
    const recommendations = []

    if (!features.recognitionSupported) {
      if (browserName === 'Firefox') {
        recommendations.push('Firefox does not support speech recognition. Please use Chrome, Edge, or Safari.')
      } else if (browserName === 'Unknown Browser') {
        recommendations.push('Your browser may not support voice features. Please use Chrome, Edge, or Safari for the best experience.')
      }
    }

    if (!features.audioContextSupported) {
      recommendations.push('Your browser does not support Web Audio API. Visual waveform may not work.')
    }

    if (!features.hasGetUserMedia) {
      recommendations.push('Microphone access is not available. Please grant microphone permissions.')
    }

    if (features.recognitionSupported && !features.ttsSupported) {
      recommendations.push('Speech recognition works but text-to-speech is not available.')
    }

    return recommendations
  }

  // Check specific feature support
  const checkFeatureSupport = useCallback(async (feature) => {
    switch (feature) {
      case 'microphone':
        try {
          const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
          stream.getTracks().forEach(track => track.stop())
          return true
        } catch (error) {
          return false
        }
      case 'speechRecognition':
        return voiceService.isRecognitionSupported()
      case 'textToSpeech':
        return voiceService.isTTSupported()
      case 'webAudio':
        return voiceService.isAudioContextSupported()
      default:
        return false
    }
  }, [])

  return {
    // State
    isListening,
    isSpeaking,
    transcript,
    interimTranscript,
    isSupported,
    error,
    audioLevel,

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
    getVoices,
    getCompatibilityInfo,
    checkFeatureSupport
  }
}

export default useVoice
