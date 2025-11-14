/**
 * Voice Service
 * Business logic for voice functionality
 * Integrates with chatbot service and database
 */

const ApiError = require('../utils/ApiError')
const chatbotService = require('./chatbotService')

class VoiceService {
  /**
   * Process voice input through chatbot
   */
  async processVoiceInput(userId, transcript, user) {
    try {
      // Pre-process transcript
      const processedTranscript = this.preprocessTranscript(transcript)

      // Send to chatbot service for natural language processing
      const result = await chatbotService.processMessage(
        userId,
        processedTranscript,
        user
      )

      return {
        transcript: processedTranscript,
        response: result.response,
        action: result.action,
        requiresConfirmation: result.requiresConfirmation || false,
        actionData: result.actionData || null
      }
    } catch (error) {
      console.error('Voice input processing error:', error)
      throw new ApiError('Failed to process voice input', 500)
    }
  }

  /**
   * Process voice command for navigation/quick actions
   */
  async processVoiceCommand(userId, transcript, user) {
    try {
      const command = this.parseCommand(transcript.toLowerCase())

      if (command.type === 'NAVIGATION') {
        return {
          action: 'NAVIGATE',
          path: command.path,
          message: `Navigating to ${command.path}`
        }
      } else if (command.type === 'ACTION') {
        return {
          action: 'EXECUTE',
          actionType: command.actionType,
          params: command.params,
          message: `Executing ${command.actionType}`
        }
      } else {
        // Fall back to chatbot for complex queries
        const result = await chatbotService.processMessage(
          userId,
          transcript,
          user
        )
        return {
          action: 'CHATBOT',
          response: result.response,
          requiresConfirmation: result.requiresConfirmation || false
        }
      }
    } catch (error) {
      console.error('Voice command processing error:', error)
      throw new ApiError('Failed to process voice command', 500)
    }
  }

  /**
   * Parse voice command
   */
  parseCommand(transcript) {
    // Navigation commands
    const navigationPatterns = [
      { pattern: /go to (dashboard|leads|pipeline|tasks|activities|users|reports)/, type: 'NAVIGATION' },
      { pattern: /open (dashboard|leads|pipeline|tasks|activities|users|reports)/, type: 'NAVIGATION' },
      { pattern: /show (dashboard|leads|pipeline|tasks|activities|users|reports)/, type: 'NAVIGATION' },
      { pattern: /navigate to (dashboard|leads|pipeline|tasks|activities|users|reports)/, type: 'NAVIGATION' }
    ]

    // Quick action commands
    const actionPatterns = [
      { pattern: /create (new )?lead/, type: 'ACTION', actionType: 'CREATE_LEAD' },
      { pattern: /add (new )?task/, type: 'ACTION', actionType: 'CREATE_TASK' },
      { pattern: /new activity/, type: 'ACTION', actionType: 'CREATE_ACTIVITY' },
      { pattern: /create (new )?email/, type: 'ACTION', actionType: 'CREATE_EMAIL' },
      { pattern: /search for (.+)/, type: 'ACTION', actionType: 'SEARCH' },
      { pattern: /find (.+)/, type: 'ACTION', actionType: 'SEARCH' }
    ]

    // Check navigation patterns
    for (const { pattern, type } of navigationPatterns) {
      const match = transcript.match(pattern)
      if (match) {
        return {
          type,
          path: match[1]
        }
      }
    }

    // Check action patterns
    for (const { pattern, type, actionType } of actionPatterns) {
      const match = transcript.match(pattern)
      if (match) {
        return {
          type,
          actionType,
          params: match.slice(1)
        }
      }
    }

    return { type: 'UNKNOWN' }
  }

  /**
   * Pre-process transcript for better processing
   */
  preprocessTranscript(transcript) {
    if (!transcript) return ''

    return transcript
      // Remove filler words
      .replace(/\b(um|uh|like|you know|sort of|kind of|okay|so)\b/gi, '')
      // Remove extra spaces
      .replace(/\s+/g, ' ')
      // Trim
      .trim()
      // Capitalize first letter
      .replace(/^([a-z])/, (match) => match.toUpperCase())
  }

  /**
   * Format text for speech synthesis
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
      // Replace common abbreviations
      .replace(/\betc\./g, 'etcetera')
      .replace(/\bDr\./g, 'Doctor')
      .replace(/\bMr\./g, 'Mister')
      .replace(/\bMrs\./g, 'Missus')
      .replace(/\bMs\./g, 'Miss')
      // Clean up punctuation
      .replace(/([.!?])\1+/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
  }

  /**
   * Get user voice settings from database
   */
  async getUserVoiceSettings(userId) {
    try {
      // In a real implementation, query from Supabase
      // For now, return default settings
      return {
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
    } catch (error) {
      console.error('Get voice settings error:', error)
      throw new ApiError('Failed to retrieve voice settings', 500)
    }
  }

  /**
   * Validate voice settings
   */
  async validateVoiceSettings(settings) {
    const validated = {}

    // Validate language
    const supportedLanguages = ['en-US', 'en-GB', 'hi-IN', 'es-ES', 'fr-FR', 'de-DE', 'zh-CN']
    if (settings.language && !supportedLanguages.includes(settings.language)) {
      throw new ApiError('Unsupported language', 400)
    }
    validated.language = settings.language || 'en-US'

    // Validate rate
    if (settings.rate !== undefined) {
      const rate = parseFloat(settings.rate)
      if (rate < 0.5 || rate > 2) {
        throw new ApiError('Speech rate must be between 0.5 and 2', 400)
      }
      validated.rate = rate
    }

    // Validate pitch
    if (settings.pitch !== undefined) {
      const pitch = parseFloat(settings.pitch)
      if (pitch < 0.5 || pitch > 2) {
        throw new ApiError('Speech pitch must be between 0.5 and 2', 400)
      }
      validated.pitch = pitch
    }

    // Validate volume
    if (settings.volume !== undefined) {
      const volume = parseFloat(settings.volume)
      if (volume < 0 || volume > 1) {
        throw new ApiError('Volume must be between 0 and 1', 400)
      }
      validated.volume = volume
    }

    // Validate silence delay
    if (settings.silenceDelay !== undefined) {
      const delay = parseInt(settings.silenceDelay)
      if (delay < 1000 || delay > 30000) {
        throw new ApiError('Silence delay must be between 1 and 30 seconds', 400)
      }
      validated.silenceDelay = delay
    }

    // Validate privacy settings
    if (settings.privacy) {
      validated.privacy = {}

      if (settings.privacy.dataRetentionDays !== undefined) {
        const days = parseInt(settings.privacy.dataRetentionDays)
        if (days < 1 || days > 365) {
          throw new ApiError('Data retention must be between 1 and 365 days', 400)
        }
        validated.privacy.dataRetentionDays = days
      }

      if (settings.privacy.storeVoiceNotes !== undefined) {
        validated.privacy.storeVoiceNotes = !!settings.privacy.storeVoiceNotes
      }

      if (settings.privacy.allowVoiceAnalytics !== undefined) {
        validated.privacy.allowVoiceAnalytics = !!settings.privacy.allowVoiceAnalytics
      }
    }

    // Validate booleans
    validated.enabled = settings.enabled !== undefined ? !!settings.enabled : true
    validated.autoSpeak = settings.autoSpeak !== undefined ? !!settings.autoSpeak : true
    validated.voiceActivation = settings.voiceActivation !== undefined ? !!settings.voiceActivation : false

    if (settings.wakeWord) {
      validated.wakeWord = settings.wakeWord.slice(0, 50) // Limit length
    }

    return validated
  }

  /**
   * Update user voice settings
   */
  async updateUserVoiceSettings(userId, settings) {
    try {
      // In a real implementation, save to Supabase
      // user_voice_settings table

      // For now, return the settings
      return {
        ...await this.getUserVoiceSettings(userId),
        ...settings
      }
    } catch (error) {
      console.error('Update voice settings error:', error)
      throw new ApiError('Failed to update voice settings', 500)
    }
  }

  /**
   * Log voice event for analytics
   */
  async logVoiceEvent(userId, event, data) {
    try {
      // In a real implementation, save to Supabase
      // voice_analytics table

      console.log('Voice event:', { userId, event, data, timestamp: new Date() })
    } catch (error) {
      console.error('Log voice event error:', error)
      // Don't throw - analytics failure shouldn't break the app
    }
  }

  /**
   * Get voice analytics
   */
  async getVoiceAnalytics(userId, period) {
    try {
      // In a real implementation, query from Supabase
      // Return mock analytics for now
      return {
        period,
        totalCommands: 0,
        successfulCommands: 0,
        averageAccuracy: 0,
        topCommands: [],
        dailyUsage: []
      }
    } catch (error) {
      console.error('Get voice analytics error:', error)
      throw new ApiError('Failed to retrieve voice analytics', 500)
    }
  }

  /**
   * Create voice note
   */
  async createVoiceNote(userId, noteData) {
    try {
      // In a real implementation, save to Supabase
      // voice_notes table

      return {
        id: `note_${Date.now()}`,
        userId,
        transcription: noteData.transcription,
        audioUrl: noteData.audioData ? 'stored_audio_url' : null,
        context: noteData.context,
        createdAt: new Date()
      }
    } catch (error) {
      console.error('Create voice note error:', error)
      throw new ApiError('Failed to create voice note', 500)
    }
  }

  /**
   * Get user voice notes
   */
  async getUserVoiceNotes(userId, options = {}) {
    try {
      // In a real implementation, query from Supabase
      // voice_notes table

      return []
    } catch (error) {
      console.error('Get voice notes error:', error)
      throw new ApiError('Failed to retrieve voice notes', 500)
    }
  }

  /**
   * Delete voice note
   */
  async deleteVoiceNote(userId, noteId) {
    try {
      // In a real implementation, delete from Supabase
      // voice_notes table

      return true
    } catch (error) {
      console.error('Delete voice note error:', error)
      throw new ApiError('Failed to delete voice note', 500)
    }
  }
}

module.exports = new VoiceService()
