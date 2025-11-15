/**
 * Voice Controller
 * Handles voice-to-text and text-to-speech requests
 * Integrates with chatbot service for natural language processing
 */

const ApiError = require('../utils/ApiError')
const voiceService = require('../services/voiceService')
const chatbotService = require('../services/chatbotService')
const { BaseController, asyncHandler } = require('./baseController')

/**
 * Voice Controller
 * Handles voice interface operations
 * Extends BaseController for standardized patterns
 */
class VoiceController extends BaseController {
  /**
   * Process voice transcript through chatbot
   */
  processVoiceMessage = asyncHandler(async (req, res) => {
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

    this.success(res, {
      transcript,
      response: result.response,
      action: result.action,
      requiresConfirmation: result.requiresConfirmation || false,
      actionData: result.actionData || null
    }, 200, 'Voice message processed successfully')
  })

  /**
   * Get voice settings for user
   */
  getVoiceSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const settings = await voiceService.getUserVoiceSettings(userId)

    this.success(res, settings, 200, 'Voice settings retrieved successfully')
  })

  /**
   * Update voice settings
   */
  updateVoiceSettings = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const settings = req.body

    // Validate settings
    const validatedSettings = await voiceService.validateVoiceSettings(settings)

    // Update settings
    const updatedSettings = await voiceService.updateUserVoiceSettings(
      userId,
      validatedSettings
    )

    this.updated(res, updatedSettings, 'Voice settings updated successfully')
  })

  /**
   * Convert text to speech
   */
  getTextToSpeech = asyncHandler(async (req, res) => {
    const { text, options = {} } = req.body

    if (!text || text.trim().length === 0) {
      throw new ApiError('Text is required', 400)
    }

    // Format text for speech
    const formattedText = voiceService.formatForSpeech(text)

    this.success(res, {
      text: formattedText,
      audioUrl: null, // Placeholder
      options: {
        language: options.language || 'en-US',
        rate: options.rate || 1.0,
        pitch: options.pitch || 1.0,
        volume: options.volume || 1.0
      }
    }, 200, 'Text formatted for speech synthesis')
  })

  /**
   * Log voice command analytics
   */
  logVoiceAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const { event, data } = req.body

    if (!event) {
      throw new ApiError('Event type is required', 400)
    }

    await voiceService.logVoiceEvent(userId, event, data)

    this.success(res, null, 200, 'Analytics logged successfully')
  })

  /**
   * Get voice usage statistics
   */
  getVoiceAnalytics = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const { period = '7d' } = req.query

    const analytics = await voiceService.getVoiceAnalytics(userId, period)

    this.success(res, analytics, 200, 'Voice analytics retrieved successfully')
  })

  /**
   * Create voice note
   */
  createVoiceNote = asyncHandler(async (req, res) => {
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

    this.created(res, voiceNote, 'Voice note created successfully')
  })

  /**
   * Get voice notes
   */
  getVoiceNotes = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const { limit = 50, offset = 0 } = req.query

    const voiceNotes = await voiceService.getUserVoiceNotes(userId, {
      limit: parseInt(limit),
      offset: parseInt(offset)
    })

    this.success(res, voiceNotes, 200, 'Voice notes retrieved successfully')
  })

  /**
   * Delete voice note
   */
  deleteVoiceNote = asyncHandler(async (req, res) => {
    const userId = req.user.id
    const { id } = req.params

    await voiceService.deleteVoiceNote(userId, id)

    this.deleted(res, 'Voice note deleted successfully')
  })

  /**
   * Process voice command (for navigation and quick actions)
   */
  processVoiceCommand = asyncHandler(async (req, res) => {
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

    this.success(res, result, 200, 'Voice command processed successfully')
  })
}

module.exports = new VoiceController()
