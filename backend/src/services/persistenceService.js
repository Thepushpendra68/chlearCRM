/**
 * Persistence Service
 * Handles conversation history, voice settings persistence, and data archival
 * Uses commonService for DRY patterns
 */

const { withErrorHandling, DatabaseService, ValidationService, LoggingService } = require('./commonService')

class PersistenceService {
  /**
   * Save conversation message
   */
  saveMessage = withErrorHandling(
    async (userId, messageData) => {
      LoggingService.logOperationStart('saveMessage', { userId, type: messageData.type })

      // Validate message data
      this.validateMessageData(messageData)

      // Get company_id from user
      const userProfile = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .from('user_profiles')
          .select('company_id')
          .eq('id', userId)
          .single(),
        'Failed to fetch user profile'
      )

      const companyId = userProfile?.company_id || null

      // Prepare message data
      const messageRecord = {
        user_id: userId,
        company_id: companyId,
        session_id: messageData.sessionId,
        message_type: messageData.type, // 'user' or 'assistant'
        content: messageData.content,
        metadata: messageData.metadata || null,
        tokens_used: messageData.tokensUsed || null,
        model_used: messageData.modelUsed || null,
        created_at: new Date().toISOString()
      }

      // Save message
      const savedMessage = await DatabaseService.insert(
        'conversation_messages',
        messageRecord,
        'Failed to save message'
      )

      LoggingService.logOperationSuccess('saveMessage', { messageId: savedMessage.id })
      return savedMessage
    },
    'Failed to save message'
  )

  /**
   * Get conversation history
   */
  getConversationHistory = withErrorHandling(
    async (userId, sessionId, options = {}) => {
      LoggingService.logOperationStart('getConversationHistory', { userId, sessionId })

      const {
        limit = 50,
        offset = 0,
        includeMetadata = false
      } = options

      // Build query
      const columns = includeMetadata ? '*' : 'id, session_id, message_type, content, created_at'
      const filters = { user_id: userId }

      if (sessionId) {
        filters.session_id = sessionId
      }

      // Get messages
      const messages = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .from('conversation_messages')
          .select(columns)
          .eq('user_id', userId)
          .or(sessionId ? `session_id.eq.${sessionId}` : 'session_id.not.is.null')
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1),
        'Failed to fetch conversation history'
      )

      LoggingService.logOperationSuccess('getConversationHistory', { messageCount: messages?.length || 0 })
      return messages || []
    },
    'Failed to get conversation history'
  )

  /**
   * Delete conversation history
   */
  deleteConversationHistory = withErrorHandling(
    async (userId, sessionId, options = {}) => {
      LoggingService.logOperationStart('deleteConversationHistory', { userId, sessionId })

      const { beforeDate = null } = options

      // Build filters
      const filters = { user_id: userId }

      if (sessionId) {
        filters.session_id = sessionId
      }

      if (beforeDate) {
        filters.created_at = beforeDate
      }

      // Delete messages
      await DatabaseService.delete(
        'conversation_messages',
        filters,
        'Failed to delete conversation history'
      )

      LoggingService.logOperationSuccess('deleteConversationHistory')
      return true
    },
    'Failed to delete conversation history'
  )

  /**
   * Save user preferences
   */
  saveUserPreferences = withErrorHandling(
    async (userId, preferences) => {
      LoggingService.logOperationStart('saveUserPreferences', { userId })

      // Validate preferences
      this.validatePreferences(preferences)

      // Get company_id
      const userProfile = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .from('user_profiles')
          .select('company_id')
          .eq('id', userId)
          .single(),
        'Failed to fetch user profile'
      )

      const companyId = userProfile?.company_id || null

      // Prepare data
      const preferenceRecord = {
        user_id: userId,
        company_id: companyId,
        preference_type: preferences.type,
        preference_key: preferences.key,
        preference_value: JSON.stringify(preferences.value),
        updated_at: new Date().toISOString()
      }

      // Upsert preference
      const savedPreference = await DatabaseService.upsert(
        'user_preferences',
        preferenceRecord,
        { onConflict: 'user_id,preference_type,preference_key', errorMessage: 'Failed to save preference' }
      )

      LoggingService.logOperationSuccess('saveUserPreferences')
      return savedPreference
    },
    'Failed to save user preferences'
  )

  /**
   * Get user preferences
   */
  getUserPreferences = withErrorHandling(
    async (userId, type = null) => {
      LoggingService.logOperationStart('getUserPreferences', { userId, type })

      // Build query
      let query = DatabaseService.getSupabaseAdmin()
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)

      if (type) {
        query = query.eq('preference_type', type)
      }

      const preferences = await DatabaseService.safeQuery(
        () => query.order('preference_type').order('preference_key'),
        'Failed to fetch user preferences'
      )

      // Parse JSON values
      const parsedPreferences = {}
      preferences?.forEach(pref => {
        if (!parsedPreferences[pref.preference_type]) {
          parsedPreferences[pref.preference_type] = {}
        }
        try {
          parsedPreferences[pref.preference_type][pref.preference_key] =
            JSON.parse(pref.preference_value)
        } catch (error) {
          parsedPreferences[pref.preference_type][pref.preference_key] = pref.preference_value
        }
      })

      LoggingService.logOperationSuccess('getUserPreferences', { typeCount: Object.keys(parsedPreferences).length })
      return parsedPreferences
    },
    'Failed to get user preferences'
  )

  /**
   * Archive old data based on retention policy
   */
  archiveOldData = withErrorHandling(
    async (userId, retentionDays = 30) => {
      LoggingService.logOperationStart('archiveOldData', { userId, retentionDays })

      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays)
      const cutoffISOString = cutoffDate.toISOString()

      // Archive conversation messages
      const archivedCount = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .rpc('archive_conversation_messages', {
            p_user_id: userId,
            p_cutoff_date: cutoffISOString
          }),
        'Failed to archive old data'
      )

      LoggingService.logOperationSuccess('archiveOldData', { archivedCount })
      return { archivedCount }
    },
    'Failed to archive old data'
  )

  /**
   * GDPR Compliance - Delete all user data
   */
  deleteAllUserData = withErrorHandling(
    async (userId) => {
      LoggingService.logOperationStart('deleteAllUserData', { userId })

      const operations = []

      // Delete conversation messages
      operations.push(
        DatabaseService.delete('conversation_messages', { user_id: userId }, 'Failed to delete conversation messages')
      )

      // Delete user preferences
      operations.push(
        DatabaseService.delete('user_preferences', { user_id: userId }, 'Failed to delete user preferences')
      )

      // Execute all deletions
      await Promise.all(operations)

      LoggingService.logOperationSuccess('deleteAllUserData')
      return { success: true }
    },
    'Failed to delete user data'
  )

  /**
   * Export user data (GDPR compliance)
   */
  exportUserData = withErrorHandling(
    async (userId) => {
      LoggingService.logOperationStart('exportUserData', { userId })

      // Get all user data
      const [messages, preferences] = await Promise.all([
        DatabaseService.safeQuery(
          () => DatabaseService.getSupabaseAdmin()
            .from('conversation_messages')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: true }),
          'Failed to fetch messages for export'
        ),
        DatabaseService.safeQuery(
          () => DatabaseService.getSupabaseAdmin()
            .from('user_preferences')
            .select('*')
            .eq('user_id', userId)
            .order('preference_type'),
          'Failed to fetch preferences for export'
        )
      ])

      const exportData = {
        exportDate: new Date().toISOString(),
        userId,
        conversationMessages: messages || [],
        userPreferences: preferences || []
      }

      LoggingService.logOperationSuccess('exportUserData', { messageCount: messages?.length || 0 })
      return exportData
    },
    'Failed to export user data'
  )

  /**
   * Get storage usage statistics
   */
  getStorageStats = withErrorHandling(
    async (userId) => {
      LoggingService.logOperationStart('getStorageStats', { userId })

      const stats = await DatabaseService.safeQuery(
        () => DatabaseService.getSupabaseAdmin()
          .rpc('get_user_storage_stats', { p_user_id: userId }),
        'Failed to get storage stats'
      )

      LoggingService.logOperationSuccess('getStorageStats')
      return stats || {
        messageCount: 0,
        totalSizeBytes: 0,
        oldestMessage: null,
        newestMessage: null
      }
    },
    'Failed to get storage statistics'
  )

  // =============== VALIDATION METHODS ===============

  /**
   * Validate message data
   */
  validateMessageData(messageData) {
    if (!messageData) {
      throw new Error('Message data is required')
    }

    ValidationService.validateString(messageData.content, { required: true, maxLength: 10000 })
    ValidationService.validateString(messageData.type, { required: true })

    if (!['user', 'assistant'].includes(messageData.type)) {
      throw new Error('Message type must be "user" or "assistant"')
    }

    if (messageData.sessionId) {
      ValidationService.validateUUID(messageData.sessionId, false)
    }

    return true
  }

  /**
   * Validate preferences
   */
  validatePreferences(preferences) {
    if (!preferences) {
      throw new Error('Preferences data is required')
    }

    ValidationService.validateString(preferences.type, { required: true, maxLength: 50 })
    ValidationService.validateString(preferences.key, { required: true, maxLength: 100 })

    // Value can be any JSON-serializable type
    if (preferences.value === undefined) {
      throw new Error('Preference value is required')
    }

    // Verify it can be JSON stringified
    try {
      JSON.stringify(preferences.value)
    } catch (error) {
      throw new Error('Preference value must be JSON-serializable')
    }

    return true
  }
}

module.exports = new PersistenceService()
