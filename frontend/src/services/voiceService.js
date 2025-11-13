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
  startListening(options = {}) {
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
      this.recognition.stop()
      console.log('Stopped listening')
    }
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
      this.synthesis.cancel()
      this.isSpeaking = false
      this.currentUtterance = null
    }
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
   * Cleanup resources
   */
  destroy() {
    this.stopListening()
    this.stopSpeaking()
    this.clearSilenceTimeout()
    this.transcriptCallbacks = []
    this.errorCallbacks = []
    this.audioLevelCallbacks = []
  }
}

// Create singleton instance
const voiceService = new VoiceService()

export default voiceService
