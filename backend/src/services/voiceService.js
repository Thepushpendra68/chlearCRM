/**
 * Voice Service
 * Business logic for voice functionality
 * Integrates with chatbot service and database
 * Refactored to use commonService for DRY principle
 */

const chatbotService = require('./chatbotService')
const { withErrorHandling, DatabaseService, ValidationService, LoggingService } = require('./commonService')

class VoiceService {
  /**
   * Process voice input through chatbot
   */
  processVoiceInput = withErrorHandling(
    async (userId, transcript, user) => {
      LoggingService.logOperationStart('processVoiceInput', { userId })

      // Pre-process transcript
      const processedTranscript = this.preprocessTranscript(transcript)

      // Send to chatbot service for natural language processing
      const result = await chatbotService.processMessage(
        userId,
        processedTranscript,
        user
      )

      LoggingService.logOperationSuccess('processVoiceInput')

      return {
        transcript: processedTranscript,
        response: result.response,
        action: result.action,
        requiresConfirmation: result.requiresConfirmation || false,
        actionData: result.actionData || null
      }
    },
    'Failed to process voice input'
  )

  /**
   * Process voice command for navigation/quick actions
   */
  processVoiceCommand = withErrorHandling(
    async (userId, transcript, user) => {
      LoggingService.logOperationStart('processVoiceCommand', { userId })

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
    },
    'Failed to process voice command'
  )

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
  getUserVoiceSettings = withErrorHandling(
    async (userId) => {
      LoggingService.logOperationStart('getUserVoiceSettings', { userId })
      LoggingService.logDatabaseOperation('getUserVoiceSettings', 'user_voice_settings', 'select')

      // Query user voice settings from Supabase
      const data = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .from('user_voice_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle(), // maybeSingle doesn't throw on "not found"
        'Failed to retrieve voice settings'
      )

      // Return settings if found, otherwise return defaults
      if (data) {
        LoggingService.logOperationSuccess('getUserVoiceSettings')
        return {
          enabled: data.enabled,
          language: data.language,
          autoSpeak: data.auto_speak,
          voiceActivation: data.voice_activation,
          wakeWord: data.wake_word,
          rate: parseFloat(data.rate),
          pitch: parseFloat(data.pitch),
          volume: parseFloat(data.volume),
          silenceDelay: data.silence_delay,
          privacy: {
            storeVoiceNotes: data.store_voice_notes,
            allowVoiceAnalytics: data.allow_voice_analytics,
            dataRetentionDays: data.data_retention_days
          }
        }
      }

      // Return default settings if not configured
      LoggingService.logOperationSuccess('getUserVoiceSettings', { usingDefaults: true })
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
    },
    'Failed to retrieve voice settings'
  )

  /**
   * Validate voice settings
   * Uses ValidationService from commonService
   */
  validateVoiceSettings(settings) {
    return ValidationService.validateVoiceSettings(settings)
  }

  /**
   * Update user voice settings
   */
  updateUserVoiceSettings = withErrorHandling(
    async (userId, settings) => {
      LoggingService.logOperationStart('updateUserVoiceSettings', { userId })
      LoggingService.logDatabaseOperation('updateUserVoiceSettings', 'user_voice_settings', 'upsert')

      // Validate settings first
      const validatedSettings = this.validateVoiceSettings(settings)

      // Get company_id from user metadata
      const userProfile = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .from('user_profiles')
          .select('company_id')
          .eq('id', userId)
          .single(),
        'Failed to fetch user profile'
      )

      const companyId = userProfile?.company_id || null

      // Prepare data for Supabase (using column names)
      const supabaseData = {
        user_id: userId,
        company_id: companyId,
        enabled: validatedSettings.enabled,
        language: validatedSettings.language,
        auto_speak: validatedSettings.autoSpeak,
        voice_activation: validatedSettings.voiceActivation,
        wake_word: validatedSettings.wakeWord,
        rate: validatedSettings.rate,
        pitch: validatedSettings.pitch,
        volume: validatedSettings.volume,
        silence_delay: validatedSettings.silenceDelay,
        store_voice_notes: validatedSettings.privacy.storeVoiceNotes,
        allow_voice_analytics: validatedSettings.privacy.allowVoiceAnalytics,
        data_retention_days: validatedSettings.privacy.dataRetentionDays,
        updated_at: new Date().toISOString()
      }

      // Upsert using DatabaseService
      const updatedSettings = await DatabaseService.upsert(
        'user_voice_settings',
        supabaseData,
        { onConflict: 'user_id', errorMessage: 'Failed to update voice settings' }
      )

      LoggingService.logOperationSuccess('updateUserVoiceSettings')

      // Return the updated settings in the expected format
      return {
        enabled: updatedSettings.enabled,
        language: updatedSettings.language,
        autoSpeak: updatedSettings.auto_speak,
        voiceActivation: updatedSettings.voice_activation,
        wakeWord: updatedSettings.wake_word,
        rate: parseFloat(updatedSettings.rate),
        pitch: parseFloat(updatedSettings.pitch),
        volume: parseFloat(updatedSettings.volume),
        silenceDelay: updatedSettings.silence_delay,
        privacy: {
          storeVoiceNotes: updatedSettings.store_voice_notes,
          allowVoiceAnalytics: updatedSettings.allow_voice_analytics,
          dataRetentionDays: updatedSettings.data_retention_days
        }
      }
    },
    'Failed to update voice settings'
  )

  /**
   * Log voice event for analytics
   */
  async logVoiceEvent(userId, event, data) {
    try {
      // Get company_id from user metadata
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single()

      const companyId = userProfile?.company_id || null

      // Prepare analytics data
      const analyticsData = {
        user_id: userId,
        company_id: companyId,
        event_type: event.type || 'unknown',
        event_data: data || {},
        accuracy_score: data?.accuracy || null,
        duration_ms: data?.duration || null,
        transcript_length: data?.transcriptLength || null,
        command_type: data?.commandType || null,
        success: data?.success !== false, // Default to true if not specified
        created_at: new Date().toISOString()
      }

      // Insert analytics record
      const { error } = await supabaseAdmin
        .from('voice_analytics')
        .insert(analyticsData)

      if (error) {
        console.error('Error logging voice event:', error)
        // Don't throw - analytics failure shouldn't break the app
      }

      console.log('Voice event logged:', { userId, event: event.type, success: analyticsData.success })
    } catch (error) {
      console.error('Log voice event error:', error)
      // Don't throw - analytics failure shouldn't break the app
    }
  }

  /**
   * Get voice analytics
   */
  async getVoiceAnalytics(userId, period = '7d') {
    try {
      // Calculate date range based on period
      const now = new Date()
      let startDate = new Date()

      switch (period) {
        case '24h':
          startDate.setHours(now.getHours() - 24)
          break
        case '7d':
          startDate.setDate(now.getDate() - 7)
          break
        case '30d':
          startDate.setDate(now.getDate() - 30)
          break
        default:
          startDate.setDate(now.getDate() - 7)
      }

      // Get analytics data from Supabase
      const { data: analytics, error } = await supabaseAdmin
        .from('voice_analytics')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching voice analytics:', error)
        throw new ApiError('Failed to retrieve voice analytics', 500)
      }

      // Get command history for top commands
      const { data: commands } = await supabaseAdmin
        .from('voice_commands')
        .select('command_type, command_text, success')
        .eq('user_id', userId)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', now.toISOString())
        .order('created_at', { ascending: false })

      // Calculate statistics
      const totalCommands = analytics?.length || 0
      const successfulCommands = analytics?.filter(a => a.success).length || 0
      const averageAccuracy = analytics?.length > 0
        ? analytics.reduce((sum, a) => sum + (a.accuracy_score || 0), 0) / analytics.length
        : 0

      // Get top commands
      const commandCounts = {}
      commands?.forEach(cmd => {
        const key = `${cmd.command_type}:${cmd.command_text}`
        if (!commandCounts[key]) {
          commandCounts[key] = {
            type: cmd.command_type,
            text: cmd.command_text,
            count: 0,
            success: 0
          }
        }
        commandCounts[key].count++
        if (cmd.success) commandCounts[key].success++
      })

      const topCommands = Object.values(commandCounts)
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(cmd => ({
          ...cmd,
          successRate: cmd.count > 0 ? (cmd.success / cmd.count * 100).toFixed(1) : 0
        }))

      // Calculate daily usage
      const dailyUsage = {}
      analytics?.forEach(a => {
        const date = new Date(a.created_at).toISOString().split('T')[0]
        if (!dailyUsage[date]) {
          dailyUsage[date] = { date, count: 0, successful: 0 }
        }
        dailyUsage[date].count++
        if (a.success) dailyUsage[date].successful++
      })

      return {
        period,
        totalCommands,
        successfulCommands,
        averageAccuracy: averageAccuracy.toFixed(1),
        successRate: totalCommands > 0 ? (successfulCommands / totalCommands * 100).toFixed(1) : 0,
        topCommands,
        dailyUsage: Object.values(dailyUsage).sort((a, b) => a.date.localeCompare(b.date))
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
      // Get company_id from user metadata
      const { data: userProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('company_id')
        .eq('id', userId)
        .single()

      const companyId = userProfile?.company_id || null

      // Prepare note data
      const supabaseData = {
        user_id: userId,
        company_id: companyId,
        transcription: noteData.transcription,
        audio_url: noteData.audioData ? 'stored_audio_url' : null,
        audio_size_bytes: noteData.audioSize || null,
        context: noteData.context || null,
        duration_ms: noteData.duration || null,
        created_at: new Date().toISOString(),
        expires_at: noteData.expiresAt || null
      }

      // Insert note
      const { data: note, error } = await supabaseAdmin
        .from('voice_notes')
        .insert(supabaseData)
        .select()
        .single()

      if (error) {
        console.error('Error creating voice note:', error)
        throw new ApiError('Failed to create voice note', 500)
      }

      return {
        id: note.id,
        userId: note.user_id,
        transcription: note.transcription,
        audioUrl: note.audio_url,
        context: note.context,
        duration: note.duration_ms,
        createdAt: note.created_at,
        expiresAt: note.expires_at
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
      const { limit = 50, offset = 0 } = options

      // Query notes from Supabase
      const { data: notes, error } = await supabaseAdmin
        .from('voice_notes')
        .select('*')
        .eq('user_id', userId)
        .is('expires_at', null) // Only get non-expired notes
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (error) {
        console.error('Error fetching voice notes:', error)
        throw new ApiError('Failed to retrieve voice notes', 500)
      }

      return notes?.map(note => ({
        id: note.id,
        userId: note.user_id,
        transcription: note.transcription,
        audioUrl: note.audio_url,
        context: note.context,
        duration: note.duration_ms,
        createdAt: note.created_at,
        expiresAt: note.expires_at
      })) || []
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
      // Delete note from Supabase
      const { error } = await supabaseAdmin
        .from('voice_notes')
        .delete()
        .eq('id', noteId)
        .eq('user_id', userId) // Ensure user can only delete their own notes

      if (error) {
        console.error('Error deleting voice note:', error)
        throw new ApiError('Failed to delete voice note', 500)
      }

      return true
    } catch (error) {
      console.error('Delete voice note error:', error)
      throw new ApiError('Failed to delete voice note', 500)
    }
  }
}

module.exports = new VoiceService()
