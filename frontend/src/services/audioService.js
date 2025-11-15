/**
 * Audio Service
 * Provides audio feedback for voice interactions
 * Plays sounds for start/stop recording, success/error states
 */

class AudioService {
  constructor() {
    this.audioContext = null
    this.isEnabled = true
    this.volume = 0.3
    this.frequency = 440
    this.sounds = new Map()
    this.currentOscillator = null
    this.currentGainNode = null

    // Initialize on first use
    this.init()
  }

  /**
   * Initialize AudioContext
   */
  async init() {
    if (!window.AudioContext && !window.webkitAudioContext) {
      console.warn('Web Audio API not supported')
      return false
    }

    try {
      // Create audio context
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)()

      // Resume context if suspended (required by some browsers)
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume()
      }

      console.log('AudioService initialized')
      return true
    } catch (error) {
      console.error('Failed to initialize AudioService:', error)
      return false
    }
  }

  /**
   * Create a tone with specified frequency and duration
   */
  async createTone(frequency = 440, duration = 200, type = 'sine', volume = null) {
    if (!this.isEnabled || !this.audioContext) {
      return
    }

    try {
      // Create oscillator
      const oscillator = this.audioContext.createOscillator()
      oscillator.type = type
      oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime)

      // Create gain node for volume control
      const gainNode = this.audioContext.createGain()
      const actualVolume = volume !== null ? volume : this.volume
      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime)

      // Connect nodes
      oscillator.connect(gainNode)
      gainNode.connect(this.audioContext.destination)

      // Fade in
      gainNode.gain.linearRampToValueAtTime(
        actualVolume,
        this.audioContext.currentTime + 0.01
      )

      // Fade out before stopping
      gainNode.gain.linearRampToValueAtTime(
        0,
        this.audioContext.currentTime + duration / 1000 - 0.01
      )

      // Start and stop
      oscillator.start(this.audioContext.currentTime)
      oscillator.stop(this.audioContext.currentTime + duration / 1000)

      return new Promise(resolve => {
        oscillator.onended = resolve
      })
    } catch (error) {
      console.error('Error creating tone:', error)
    }
  }

  /**
   * Play start recording sound (ascending tone)
   */
  async playStartRecording() {
    if (!this.isEnabled) return

    // Ascending tone sequence
    await this.createTone(440, 100, 'sine', this.volume * 0.7) // A4
    await this.sleep(50)
    await this.createTone(554.37, 100, 'sine', this.volume * 0.7) // C#5
  }

  /**
   * Play stop recording sound (descending tone)
   */
  async playStopRecording() {
    if (!this.isEnabled) return

    // Descending tone sequence
    await this.createTone(554.37, 100, 'sine', this.volume * 0.7) // C#5
    await this.sleep(50)
    await this.createTone(440, 100, 'sine', this.volume * 0.7) // A4
  }

  /**
   * Play success sound (major chord)
   */
  async playSuccess() {
    if (!this.isEnabled) return

    // Major chord: C-E-G
    await this.createTone(523.25, 150, 'sine', this.volume * 0.8) // C5
    await this.createTone(659.25, 150, 'sine', this.volume * 0.8) // E5
    await this.createTone(783.99, 150, 'sine', this.volume * 0.8) // G5
  }

  /**
   * Play error sound (minor chord)
   */
  async playError() {
    if (!this.isEnabled) return

    // Minor chord: C-D#-G
    await this.createTone(523.25, 200, 'square', this.volume * 0.8) // C5
    await this.createTone(622.25, 200, 'square', this.volume * 0.8) // D#5
    await this.createTone(783.99, 200, 'square', this.volume * 0.8) // G5
  }

  /**
   * Play notification sound (gentle chime)
   */
  async playNotification() {
    if (!this.isEnabled) return

    // Gentle chime sequence
    await this.createTone(880, 100, 'sine', this.volume * 0.5) // A5
    await this.sleep(30)
    await this.createTone(1046.5, 100, 'sine', this.volume * 0.5) // C6
  }

  /**
   * Play typing sound (subtle click)
   */
  async playTyping() {
    if (!this.isEnabled) return

    await this.createTone(800, 30, 'sine', this.volume * 0.3)
  }

  /**
   * Play connection sound (rising tone)
   */
  async playConnection() {
    if (!this.isEnabled) return

    // Rising tone
    await this.createTone(440, 100, 'sine', this.volume * 0.6) // A4
    await this.sleep(30)
    await this.createTone(554.37, 100, 'sine', this.volume * 0.6) // C#5
    await this.sleep(30)
    await this.createTone(659.25, 100, 'sine', this.volume * 0.6) // E5
    await this.sleep(30)
    await this.createTone(880, 150, 'sine', this.volume * 0.6) // A5
  }

  /**
   * Play disconnection sound (falling tone)
   */
  async playDisconnection() {
    if (!this.isEnabled) return

    // Falling tone
    await this.createTone(880, 100, 'sine', this.volume * 0.6) // A5
    await this.sleep(30)
    await this.createTone(659.25, 100, 'sine', this.volume * 0.6) // E5
    await this.sleep(30)
    await this.createTone(554.37, 100, 'sine', this.volume * 0.6) // C#5
    await this.sleep(30)
    await this.createTone(440, 150, 'sine', this.volume * 0.6) // A4
  }

  /**
   * Play custom sequence of tones
   */
  async playSequence(notes) {
    if (!this.isEnabled || !Array.isArray(notes)) return

    for (const note of notes) {
      const { frequency, duration, type, volume } = note
      await this.createTone(frequency, duration, type || 'sine', volume)
      await this.sleep(note.gap || 50)
    }
  }

  /**
   * Play a specific pattern
   */
  async playPattern(patternName) {
    if (!this.isEnabled) return

    const patterns = {
      'message-received': () => this.playNotification(),
      'action-success': () => this.playSuccess(),
      'action-error': () => this.playError(),
      'voice-start': () => this.playStartRecording(),
      'voice-stop': () => this.playStopRecording(),
      'connect': () => this.playConnection(),
      'disconnect': () => this.playDisconnection()
    }

    const pattern = patterns[patternName]
    if (pattern) {
      await pattern()
    }
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
  }

  /**
   * Enable/disable audio feedback
   */
  setEnabled(enabled) {
    this.isEnabled = enabled
  }

  /**
   * Check if audio is supported
   */
  isAudioSupported() {
    return !!this.audioContext || this.canCreateAudioContext()
  }

  /**
   * Check if we can create audio context
   */
  canCreateAudioContext() {
    return !!(window.AudioContext || window.webkitAudioContext)
  }

  /**
   * Get volume level
   */
  getVolume() {
    return this.volume
  }

  /**
   * Check if audio is enabled
   */
  getEnabled() {
    return this.isEnabled
  }

  /**
   * Sleep helper
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup resources
   */
  destroy() {
    // Stop any playing sounds
    if (this.currentOscillator) {
      try {
        this.currentOscillator.stop()
      } catch (error) {
        // Oscillator may already be stopped
      }
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close()
    }

    this.audioContext = null
    this.sounds.clear()
  }
}

// Create singleton instance
const audioService = new AudioService()

export default audioService
