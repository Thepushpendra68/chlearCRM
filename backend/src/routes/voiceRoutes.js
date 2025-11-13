/**
 * Voice Routes
 * Defines API endpoints for voice functionality
 */

const express = require('express')
const router = express.Router()
const voiceController = require('../controllers/voiceController')
const { authenticate } = require('../middleware/authMiddleware')
const rateLimit = require('express-rate-limit')

// Rate limiting for voice endpoints
const voiceRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
  message: {
    success: false,
    error: 'Too many voice requests, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
})

// Apply authentication to all voice routes
router.use(authenticate)

// Voice transcript processing
router.post('/transcript', voiceRateLimit, voiceController.processVoiceMessage)

// Voice settings management
router.get('/settings', voiceController.getVoiceSettings)
router.put('/settings', voiceRateLimit, voiceController.updateVoiceSettings)

// Text-to-speech
router.post('/tts', voiceRateLimit, voiceController.getTextToSpeech)

// Voice commands
router.post('/command', voiceRateLimit, voiceController.processVoiceCommand)

// Analytics
router.post('/analytics', voiceController.logVoiceAnalytics)
router.get('/analytics', voiceController.getVoiceAnalytics)

// Voice notes
router.post('/notes', voiceRateLimit, voiceController.createVoiceNote)
router.get('/notes', voiceController.getVoiceNotes)
router.delete('/notes/:id', voiceRateLimit, voiceController.deleteVoiceNote)

module.exports = router
