/**
 * Voice Service - Speech-to-Text and Text-to-Speech integration
 * Integrates with Web Speech API for voice functionality
 */

class VoiceService {
  constructor() {
    this.recognition = null
    this.synthesis = window.speechSynthesis
    this.isListening = false
    this.isSpeaking = false
    this.audioLevel = 0
    this.silenceTimeout = null
    this.silenceDelay = 5000 // 5 seconds
    this.currentUtterance = null
    this.transcriptCallbacks = []
    this.errorCallbacks = []
    this.audioLevelCallbacks = []

    // Web Audio API properties
    this.audioContext = null
    this.analyser = null
    this.microphone = null
    this.audioData = null
    this.animationFrame = null

    // Initialize speech recognition
    this.initSpeechRecognition()
  }

  /**
   * Initialize Speech Recognition
   */
  initSpeechRecognition() {
    if (!this.isRecognitionSupported()) {
      console.warn('Speech recognition not supported in this browser')
      return
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    this.recognition = new SpeechRecognition()

    // Configure recognition settings
    this.recognition.continuous = false
    this.recognition.interimResults = true
    this.recognition.lang = 'en-US'
    this.recognition.maxAlternatives = 1

    // Event handlers
    this.recognition.onstart = () => {
      this.isListening = true
      console.log('Speech recognition started')
    }

    this.recognition.onend = () => {
      this.isListening = false
      console.log('Speech recognition ended')
      this.clearSilenceTimeout()
    }

    this.recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      this.isListening = false
      this.errorCallbacks.forEach(callback => callback(event.error))
    }

    this.recognition.onresult = (event) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalTranscript += transcript
        } else {
          interimTranscript += transcript
        }
      }

      const result = {
        final: finalTranscript,
        interim: interimTranscript,
        isFinal: !!finalTranscript
      }

      // Reset silence timeout
      this.resetSilenceTimeout()

      // Notify callbacks
      this.transcriptCallbacks.forEach(callback => callback(result))
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isRecognitionSupported() {
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition)
  }

  /**
   * Check if text-to-speech is supported
   */
  isTTSupported() {
    return 'speechSynthesis' in window
  }

  /**
   * Start listening for speech
   */
  async startListening(options = {}) {
    if (!this.recognition) {
      throw new Error('Speech recognition not initialized')
    }

    if (this.isListening) {
      console.warn('Already listening')
      return
    }

    // Apply options
    if (options.language) {
      this.recognition.lang = options.language
    }

    try {
      // Initialize Web Audio API if not already done
      if (this.isAudioContextSupported()) {
        if (!this.audioContext) {
          const audioInitialized = await this.initAudioContext()
          if (audioInitialized) {
            this.startAudioLevelMonitoring()
          }
        } else if (this.audioContext.state === 'suspended') {
          await this.audioContext.resume()
          this.startAudioLevelMonitoring()
        }
      }

      this.recognition.start()
      console.log('Started listening...')
    } catch (error) {
      console.error('Error starting recognition:', error)
      throw error
    }
  }

  /**
   * Stop listening
   */
  stopListening() {
    if (this.recognition && this.isListening) {
      try {
        this.recognition.stop()
        console.log('Stopped listening')
      } catch (error) {
        console.warn('Error stopping recognition:', error)
      }
    }

    // Stop audio level monitoring
    this.stopAudioLevelMonitoring()

    // Reset listening state
    this.isListening = false
  }

  /**
   * Speak text using TTS
   */
  speak(text, options = {}) {
    if (!this.isTTSupported()) {
      console.warn('Text-to-speech not supported')
      return
    }

    // Cancel any ongoing speech
    this.stopSpeaking()

    const utterance = new SpeechSynthesisUtterance(text)

    // Apply options
    utterance.rate = options.rate || 1.0 // 0.1 to 10
    utterance.pitch = options.pitch || 1.0 // 0 to 2
    utterance.volume = options.volume || 1.0 // 0 to 1
    utterance.lang = options.language || 'en-US'

    // Select voice if specified
    if (options.voice) {
      utterance.voice = options.voice
    }

    // Event handlers
    utterance.onstart = () => {
      this.isSpeaking = true
      console.log('Started speaking:', text)
    }

    utterance.onend = () => {
      this.isSpeaking = false
      this.currentUtterance = null
      console.log('Finished speaking')
    }

    utterance.onerror = (event) => {
      this.isSpeaking = false
      this.currentUtterance = null
      console.error('TTS error:', event.error)
    }

    this.currentUtterance = utterance
    this.synthesis.speak(utterance)
  }

  /**
   * Stop speaking
   */
  stopSpeaking() {
    if (this.synthesis && this.isSpeaking) {
      try {
        this.synthesis.cancel()
      } catch (error) {
        console.warn('Error stopping speech synthesis:', error)
      }
    }

    // Reset speaking state
    this.isSpeaking = false
    this.currentUtterance = null
  }

  /**
   * Get available voices
   */
  getVoices() {
    if (!this.isTTSupported()) {
      return []
    }

    const voices = this.synthesis.getVoices()
    return voices.filter(voice => voice.lang.startsWith('en') || voice.lang.startsWith('hi'))
  }

  /**
   * Register callback for transcript updates
   */
  onTranscript(callback) {
    if (typeof callback === 'function') {
      this.transcriptCallbacks.push(callback)
    }
  }

  /**
   * Register callback for errors
   */
  onError(callback) {
    if (typeof callback === 'function') {
      this.errorCallbacks.push(callback)
    }
  }

  /**
   * Register callback for audio level updates
   */
  onAudioLevel(callback) {
    if (typeof callback === 'function') {
      this.audioLevelCallbacks.push(callback)
    }
  }

  /**
   * Remove transcript callback
   */
  removeTranscriptCallback(callback) {
    const index = this.transcriptCallbacks.indexOf(callback)
    if (index > -1) {
      this.transcriptCallbacks.splice(index, 1)
    }
  }

  /**
   * Remove error callback
   */
  removeErrorCallback(callback) {
    const index = this.errorCallbacks.indexOf(callback)
    if (index > -1) {
      this.errorCallbacks.splice(index, 1)
    }
  }

  /**
   * Reset silence timeout
   */
  resetSilenceTimeout() {
    this.clearSilenceTimeout()

    this.silenceTimeout = setTimeout(() => {
      if (this.isListening) {
        console.log('Silence detected, stopping recognition')
        this.stopListening()
      }
    }, this.silenceDelay)
  }

  /**
   * Clear silence timeout
   */
  clearSilenceTimeout() {
    if (this.silenceTimeout) {
      clearTimeout(this.silenceTimeout)
      this.silenceTimeout = null
    }
  }

  /**
   * Get list of supported languages
   */
  getSupportedLanguages() {
    return [
      { code: 'en-US', name: 'English (US)' },
      { code: 'en-GB', name: 'English (UK)' },
      { code: 'hi-IN', name: 'Hindi (India)' },
      { code: 'es-ES', name: 'Spanish' },
      { code: 'fr-FR', name: 'French' },
      { code: 'de-DE', name: 'German' },
      { code: 'zh-CN', name: 'Chinese (Simplified)' }
    ]
  }

  /**
   * Set voice settings
   */
  setVoiceSettings(settings) {
    if (settings.silenceDelay !== undefined) {
      this.silenceDelay = settings.silenceDelay
    }
  }

  /**
   * Pre-process transcript for better AI processing
   */
  preprocessTranscript(transcript) {
    if (!transcript) return ''

    return transcript
      // Remove filler words
      .replace(/\b(um|uh|like|you know|sort of|kind of)\b/gi, '')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Trim
      .trim()
      // Capitalize first letter
      .replace(/^([a-z])/, (match) => match.toUpperCase())
  }

  /**
   * Format text for speech (remove markdown, simplify)
   */
  formatForSpeech(text) {
    if (!text) return ''

    return text
      // Remove markdown bold/italic
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      // Remove markdown code
      .replace(/`(.*?)`/g, '$1')
      // Remove markdown links
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Remove extra punctuation
      .replace(/([.!?])\1+/g, '$1')
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Initialize Web Audio API for real-time audio analysis
   */
  async initAudioContext() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('Web Audio API not supported')
      return false
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Create analyser
      this.analyser = this.audioContext.createAnalyser()
      this.analyser.fftSize = 256
      this.analyser.smoothingTimeConstant = 0.8

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.microphone = this.audioContext.createMediaStreamSource(stream)
      this.microphone.connect(this.analyser)

      // Create data array for audio frequencies
      this.audioData = new Uint8Array(this.analyser.frequencyBinCount)

      console.log('Web Audio API initialized successfully')
      return true
    } catch (error) {
      console.error('Failed to initialize Web Audio API:', error)
      return false
    }
  }

  /**
   * Start monitoring audio levels
   */
  startAudioLevelMonitoring() {
    if (!this.analyser || !this.audioData) {
      console.warn('Audio context not initialized')
      return
    }

    const updateAudioLevel = () => {
      if (!this.isListening) {
        this.animationFrame = null
        return
      }

      // Get frequency data
      this.analyser.getByteFrequencyData(this.audioData)

      // Calculate average volume
      let sum = 0
      for (let i = 0; i < this.audioData.length; i++) {
        sum += this.audioData[i]
      }
      const average = sum / this.audioData.length
      const normalizedLevel = average / 255 // Normalize to 0-1

      // Update audio level
      this.audioLevel = normalizedLevel

      // Notify callbacks
      this.audioLevelCallbacks.forEach(callback => callback(normalizedLevel))

      // Continue monitoring
      this.animationFrame = requestAnimationFrame(updateAudioLevel)
    }

    // Start monitoring
    this.animationFrame = requestAnimationFrame(updateAudioLevel)
  }

  /**
   * Stop monitoring audio levels
   */
  stopAudioLevelMonitoring() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
    this.audioLevel = 0
  }

  /**
   * Check if Web Audio API is supported
   */
  isAudioContextSupported() {
    return !!(window.AudioContext || window.webkitAudioContext)
  }

  /**
   * Check if microphone access is available
   */
  async isMicrophoneSupported() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return false
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.some(device => device.kind === 'audioinput')
    } catch (error) {
      console.error('Error checking microphone support:', error)
      return false
    }
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Stop all active operations
    this.stopListening()
    this.stopSpeaking()
    this.clearSilenceTimeout()
    this.stopAudioLevelMonitoring()

    // Cleanup SpeechRecognition
    if (this.recognition) {
      // Remove all event listeners to prevent memory leaks
      this.recognition.onstart = null
      this.recognition.onend = null
      this.recognition.onerror = null
      this.recognition.onresult = null

      // Stop recognition if active
      if (this.isListening) {
        try {
          this.recognition.stop()
        } catch (error) {
          // Ignore errors during cleanup
          console.warn('Error stopping recognition during cleanup:', error)
        }
      }

      this.recognition = null
    }

    // Cleanup SpeechSynthesis
    if (this.synthesis) {
      this.synthesis.cancel()
      this.synthesis = null
    }

    this.currentUtterance = null

    // Cleanup Web Audio API and MediaStream
    this.cleanupAudioContext()

    // Clear all callback arrays
    this.transcriptCallbacks = []
    this.errorCallbacks = []
    this.audioLevelCallbacks = []

    // Reset all state
    this.isListening = false
    this.isSpeaking = false
    this.audioLevel = 0
  }

  /**
   * Cleanup Web Audio API resources
   */
  cleanupAudioContext() {
    // Stop audio level monitoring
    this.stopAudioLevelMonitoring()

    // Cleanup MediaStream
    if (this.microphone) {
      try {
        // Disconnect the microphone source
        this.microphone.disconnect()

        // Stop all tracks from the media stream
        const stream = this.microphone.mediaStream
        if (stream) {
          stream.getTracks().forEach(track => {
            track.stop()
          })
        }
      } catch (error) {
        console.warn('Error cleaning up microphone:', error)
      }
      this.microphone = null
    }

    // Cleanup analyser
    if (this.analyser) {
      try {
        this.analyser.disconnect()
      } catch (error) {
        console.warn('Error cleaning up analyser:', error)
      }
      this.analyser = null
      this.audioData = null
    }

    // Cleanup AudioContext
    if (this.audioContext) {
      try {
        // Check if context is in a valid state before closing
        if (this.audioContext.state !== 'closed') {
          this.audioContext.close()
        }
      } catch (error) {
        console.warn('Error closing audio context:', error)
      }
      this.audioContext = null
    }
  }
}

// Create singleton instance
const voiceService = new VoiceService()

export default voiceService
