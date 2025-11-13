/**
 * Voice Controller
 * Handles voice-to-text and text-to-speech requests
 * Integrates with chatbot service for natural language processing
 */

const ApiError = require('../utils/ApiError')
const voiceService = require('../services/voiceService')
const chatbotService = require('../services/chatbotService')

const voiceController = {
  /**
   * Process voice transcript through chatbot
   * POST /api/voice/transcript
   */
  processVoiceMessage: async (req, res, next) => {
    try {
      const { transcript } = req.body

      if (!transcript || transcript.trim().length === 0) {
        throw new ApiError('Transcript is required', 400)
      }

      // Get user context
      const userId = req.user.id
      const user = req.user

      // Process voice input through chatbot service
      const result = await voiceService.processVoiceInput(
        userId,
        transcript,
        user
      )

      res.json({
        success: true,
        data: {
          transcript,
          response: result.response,
          action: result.action,
          requiresConfirmation: result.requiresConfirmation || false,
          actionData: result.actionData || null
        }
      })
    } catch (error) {
      console.error('Voice transcript processing error:', error)
      next(error)
    }
  },

  /**
   * Get voice settings for user
   * GET /api/voice/settings
   */
  getVoiceSettings: async (req, res, next) => {
    try {
      const userId = req.user.id
      const settings = await voiceService.getUserVoiceSettings(userId)

      res.json({
        success: true,
        data: settings
      })
    } catch (error) {
      console.error('Get voice settings error:', error)
      next(error)
    }
  },

  /**
   * Update voice settings
   * PUT /api/voice/settings
   */
  updateVoiceSettings: async (req, res, next) => {
    try {
      const userId = req.user.id
      const settings = req.body

      // Validate settings
      const validatedSettings = await voiceService.validateVoiceSettings(settings)

      // Update settings
      const updatedSettings = await voiceService.updateUserVoiceSettings(
        userId,
        validatedSettings
      )

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Voice settings updated successfully'
      })
    } catch (error) {
      console.error('Update voice settings error:', error)
      next(error)
    }
  },

  /**
   * Convert text to speech
   * POST /api/voice/tts
   */
  getTextToSpeech: async (req, res, next) => {
    try {
      const { text, options = {} } = req.body

      if (!text || text.trim().length === 0) {
        throw new ApiError('Text is required', 400)
      }

      // Format text for speech
      const formattedText = voiceService.formatForSpeech(text)

      // In a real implementation, you might:
      // 1. Use cloud TTS services (Azure, AWS, Google)
      // 2. Return audio data as base64
      // 3. Return SSML for advanced TTS

      res.json({
        success: true,
        data: {
          text: formattedText,
          audioUrl: null, // Placeholder
          options: {
            language: options.language || 'en-US',
            rate: options.rate || 1.0,
            pitch: options.pitch || 1.0,
            volume: options.volume || 1.0
          }
        },
        message: 'Text formatted for speech synthesis'
      })
    } catch (error) {
      console.error('TTS error:', error)
      next(error)
    }
  },

  /**
   * Log voice command analytics
   * POST /api/voice/analytics
   */
  logVoiceAnalytics: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { event, data } = req.body

      if (!event) {
        throw new ApiError('Event type is required', 400)
      }

      await voiceService.logVoiceEvent(userId, event, data)

      res.json({
        success: true,
        message: 'Analytics logged successfully'
      })
    } catch (error) {
      console.error('Voice analytics error:', error)
      next(error)
    }
  },

  /**
   * Get voice usage statistics
   * GET /api/voice/analytics
   */
  getVoiceAnalytics: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { period = '7d' } = req.query

      const analytics = await voiceService.getVoiceAnalytics(userId, period)

      res.json({
        success: true,
        data: analytics
      })
    } catch (error) {
      console.error('Get voice analytics error:', error)
      next(error)
    }
  },

  /**
   * Create voice note
   * POST /api/voice/notes
   */
  createVoiceNote: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { audioData, transcription, context } = req.body

      if (!audioData && !transcription) {
        throw new ApiError('Audio data or transcription is required', 400)
      }

      const voiceNote = await voiceService.createVoiceNote(userId, {
        audioData,
        transcription,
        context
      })

      res.json({
        success: true,
        data: voiceNote,
        message: 'Voice note created successfully'
      })
    } catch (error) {
      console.error('Create voice note error:', error)
      next(error)
    }
  },

  /**
   * Get voice notes
   * GET /api/voice/notes
   */
  getVoiceNotes: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { limit = 50, offset = 0 } = req.query

      const voiceNotes = await voiceService.getUserVoiceNotes(userId, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      })

      res.json({
        success: true,
        data: voiceNotes
      })
    } catch (error) {
      console.error('Get voice notes error:', error)
      next(error)
    }
  },

  /**
   * Delete voice note
   * DELETE /api/voice/notes/:id
   */
  deleteVoiceNote: async (req, res, next) => {
    try {
      const userId = req.user.id
      const { id } = req.params

      await voiceService.deleteVoiceNote(userId, id)

      res.json({
        success: true,
        message: 'Voice note deleted successfully'
      })
    } catch (error) {
      console.error('Delete voice note error:', error)
      next(error)
    }
  },

  /**
   * Process voice command (for navigation and quick actions)
   * POST /api/voice/command
   */
  processVoiceCommand: async (req, res, next) => {
    try {
      const { transcript } = req.body

      if (!transcript || transcript.trim().length === 0) {
        throw new ApiError('Transcript is required', 400)
      }

      const userId = req.user.id
      const user = req.user

      // Process command through voice service
      const result = await voiceService.processVoiceCommand(
        userId,
        transcript,
        user
      )

      res.json({
        success: true,
        data: result
      })
    } catch (error) {
      console.error('Voice command processing error:', error)
      next(error)
    }
  }
}

module.exports = voiceController
