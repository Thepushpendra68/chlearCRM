const { GoogleGenerativeAI } = require('@google/generative-ai');
const leadService = require('./leadService');
const ApiError = require('../utils/ApiError');
const chatbotFallback = require('./chatbotFallback');

const VALID_ACTIONS = new Set([
  'CHAT',
  'CREATE_LEAD',
  'UPDATE_LEAD',
  'GET_LEAD',
  'SEARCH_LEADS',
  'LIST_LEADS',
  'GET_STATS',
  'DELETE_LEAD',
  'ADD_LEAD_NOTE',
  'VIEW_LEAD_NOTES',
  'MOVE_LEAD_STAGE',
  'ASSIGN_LEAD',
  'UNASSIGN_LEAD',
  'DETECT_DUPLICATES',
  'EXPORT_LEADS',
  'SUGGEST_ASSIGNMENT',
  'LEAD_SCORING'
]);

const DEFAULT_GEMINI_MODELS = [
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-pro-latest'
];

/**
 * Chatbot Service for Lead Management
 * Uses Google Gemini AI to process natural language queries
 */
class ChatbotService {
  constructor() {
    this.conversationHistory = new Map(); // Store conversation context per user
    this.useFallbackOnly = process.env.CHATBOT_FALLBACK_ONLY === 'true';
    this.modelCache = new Map();
    this.geminiModels = [];

    // If fallback-only mode, skip AI initialization
    if (this.useFallbackOnly) {
      console.log('[CHATBOT] Running in FALLBACK-ONLY mode (AI disabled)');
      console.log('[CHATBOT] Pattern matching chatbot initialized');
      return;
    }

    const apiKey = process.env.GEMINI_API_KEY;

    // Validate API key
    if (!apiKey) {
      console.warn('[CHATBOT] GEMINI_API_KEY is not set - will use fallback pattern matching');
      this.useFallbackOnly = true;
      return;
    }

    try {
      console.log('[CHATBOT] Initializing Gemini AI with API key:', apiKey.substring(0, 10) + '...');

      // Initialize Gemini AI
      this.genAI = new GoogleGenerativeAI(apiKey);

      const configuredModels = process.env.CHATBOT_GEMINI_MODELS
        ? process.env.CHATBOT_GEMINI_MODELS.split(',').map(model => model.trim()).filter(Boolean)
        : DEFAULT_GEMINI_MODELS;

      this.geminiModels = configuredModels.length > 0 ? configuredModels : DEFAULT_GEMINI_MODELS;

      console.log('[CHATBOT] Gemini AI chatbot service initialized with model order:', this.geminiModels.join(', '));
    } catch (error) {
      console.error('[CHATBOT] Failed to initialize Gemini AI:', error.message);
      console.log('[CHATBOT] Falling back to pattern matching mode');
      this.useFallbackOnly = true;
    }
  }

  /**
   * Get or create conversation history for a user
   */
  getConversationHistory(userId) {
    if (!this.conversationHistory.has(userId)) {
      this.conversationHistory.set(userId, []);
    }
    return this.conversationHistory.get(userId);
  }

  /**
   * Add message to conversation history
   */
  addToHistory(userId, role, content) {
    const history = this.getConversationHistory(userId);
    history.push({ role, content, timestamp: new Date() });

    // Keep only last 10 messages to avoid context overflow
    if (history.length > 10) {
      history.shift();
    }
  }

  /**
   * Clear conversation history for a user
   */
  clearHistory(userId) {
    this.conversationHistory.delete(userId);
  }

  /**
   * Build system prompt with lead management context
   */
  getSystemPrompt() {
    return `You are an AI assistant for a CRM system. Your role is to help users manage leads through natural conversation.

**Available Actions:**
1. CREATE_LEAD - Create a new lead with details
2. UPDATE_LEAD - Update an existing lead
3. GET_LEAD - Get details of a specific lead
4. SEARCH_LEADS - Search for leads by name, email, company
5. LIST_LEADS - List leads with filters (status, source)
6. GET_STATS - Show lead statistics
7. DELETE_LEAD - Delete a lead (requires confirmation)
8. ADD_LEAD_NOTE - Add or update notes for a lead
9. VIEW_LEAD_NOTES - Get notes/activities for a lead
10. MOVE_LEAD_STAGE - Move lead to different pipeline stage
11. ASSIGN_LEAD - Assign lead to a team member
12. UNASSIGN_LEAD - Remove assignment from a lead
13. DETECT_DUPLICATES - Find duplicate leads by email, phone, or company
14. EXPORT_LEADS - Export leads to CSV file
15. SUGGEST_ASSIGNMENT - Get assignment suggestions for a lead
16. LEAD_SCORING - Score leads by engagement and potential

**Lead Fields:**
- first_name, last_name (required for creation)
- email (required, unique)
- phone
- company
- job_title (title)
- lead_source (source): website, referral, social_media, cold_call, event, other
- status: active, inactive, new, contacted, qualified, proposal, negotiation, won, lost
- deal_value (number)
- expected_close_date (YYYY-MM-DD)
- priority: low, medium, high
- notes

**Date/Value Range Filtering:**
- Natural language dates: "last week", "last 30 days", "this month", "last quarter", "since [date]", "between [date1] and [date2]"
- Value ranges: "over $50k", "between $10k and $100k", "under $25k", "above $5000"
- Examples: "Show leads created last week", "Leads with deal value over $50000", "Leads from website created this month"

**IMPORTANT: When user asks for leads with a specific status:**
- If they ask for "qualified leads" but no qualified leads exist, suggest checking "active" leads instead
- Always execute the query first, then provide helpful suggestions if no results found

**Response Format:**
You must respond in JSON format with this structure:
{
  "action": "ACTION_TYPE" or "CHAT",
  "intent": "brief description of what user wants",
  "parameters": {
    // extracted parameters based on action
  },
  "response": "conversational response to user",
  "needsConfirmation": true/false,
  "missingFields": ["field1", "field2"] // if any required fields are missing
}

**Examples:**

User: "Create a new lead named John Doe from Acme Corp, email john@acme.com"
Response:
{
  "action": "CREATE_LEAD",
  "intent": "Create new lead",
  "parameters": {
    "first_name": "John",
    "last_name": "Doe",
    "company": "Acme Corp",
    "email": "john@acme.com"
  },
  "response": "I'll create a new lead for John Doe from Acme Corp with email john@acme.com. Would you like to add any additional details like phone number or job title?",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Show me all qualified leads"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List leads with status filter",
  "parameters": {
    "status": "qualified",
    "limit": 50
  },
  "response": "Let me fetch all qualified leads for you.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show me all leads"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List all leads",
  "parameters": {
    "limit": 50
  },
  "response": "Here are all your leads:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show leads created last week"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List leads created in date range",
  "parameters": {
    "limit": 50,
    "created_after": "2024-12-16",
    "created_before": "2024-12-23"
  },
  "response": "Here are leads created last week:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Show leads with deal value over 50000"
Response:
{
  "action": "LIST_LEADS",
  "intent": "List leads filtered by deal value",
  "parameters": {
    "limit": 50,
    "deal_value_min": 50000
  },
  "response": "Here are leads with deal value over $50,000:",
  "needsConfirmation": false,
  "missingFields": []
}

User: "What's the email of John Doe?"
Response:
{
  "action": "SEARCH_LEADS",
  "intent": "Find lead by name",
  "parameters": {
    "search": "John Doe"
  },
  "response": "Let me search for John Doe in the system.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Delete lead john@acme.com"
Response:
{
  "action": "DELETE_LEAD",
  "intent": "Delete lead",
  "parameters": {
    "email": "john@acme.com"
  },
  "response": "I'll delete the lead for john@acme.com. This action cannot be undone. Are you sure?",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Add note to John Doe: Called today, very interested"
Response:
{
  "action": "ADD_LEAD_NOTE",
  "intent": "Add note to lead",
  "parameters": {
    "search": "John Doe",
    "note_content": "Called today, very interested"
  },
  "response": "I'll add that note to John Doe's lead. Let me save that for you.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Move John Doe to proposal stage"
Response:
{
  "action": "MOVE_LEAD_STAGE",
  "intent": "Move lead to pipeline stage",
  "parameters": {
    "search": "John Doe",
    "stage_name": "proposal"
  },
  "response": "I'll move John Doe to the proposal stage.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Assign john@acme.com to Sarah"
Response:
{
  "action": "ASSIGN_LEAD",
  "intent": "Assign lead to user",
  "parameters": {
    "email": "john@acme.com",
    "assigned_to": "Sarah"
  },
  "response": "I'll assign john@acme.com to Sarah.",
  "needsConfirmation": true,
  "missingFields": []
}

User: "Check for duplicate john@acme.com"
Response:
{
  "action": "DETECT_DUPLICATES",
  "intent": "Detect duplicate leads",
  "parameters": {
    "email": "john@acme.com"
  },
  "response": "I'll check for duplicates matching john@acme.com.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Export all qualified leads to CSV"
Response:
{
  "action": "EXPORT_LEADS",
  "intent": "Export leads to CSV",
  "parameters": {
    "status": "qualified",
    "format": "csv"
  },
  "response": "I'll export all qualified leads to CSV for you.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Who should I assign john@acme.com to?"
Response:
{
  "action": "SUGGEST_ASSIGNMENT",
  "intent": "Suggest assignment",
  "parameters": {
    "email": "john@acme.com"
  },
  "response": "Let me check assignment rules and team capacity to suggest the best person for this lead.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Score all qualified leads"
Response:
{
  "action": "LEAD_SCORING",
  "intent": "Score leads",
  "parameters": {
    "status": "qualified"
  },
  "response": "I'll score qualified leads based on engagement and potential.",
  "needsConfirmation": false,
  "missingFields": []
}

User: "Hello"
Response:
{
  "action": "CHAT",
  "intent": "Greeting",
  "parameters": {},
  "response": "Hello! I'm your CRM assistant. I can help you create, update, and manage leads, assign them to team members, move them through stages, and more. What would you like to do?",
  "needsConfirmation": false,
  "missingFields": []
}

**Important Guidelines:**
- Always extract as much information as possible from the user's message
- If critical fields are missing for CREATE_LEAD (first_name, last_name, email), add them to missingFields
- For UPDATE_LEAD, you need either an email or lead identifier to find the lead
- Use status values exactly as specified
- For dates, convert natural language like "next month" to YYYY-MM-DD format
- Be conversational and helpful
- If the user's intent is unclear, ask for clarification (use "CHAT" action)

**When to Set needsConfirmation:**
- CREATE_LEAD: true (always confirm before creating)
- UPDATE_LEAD: true (always confirm before updating)
- LIST_LEADS: false (no confirmation needed for viewing)
- SEARCH_LEADS: false (no confirmation needed for viewing)
- GET_LEAD: false (no confirmation needed for viewing)
- GET_STATS: false (no confirmation needed for viewing)`;
  }

  /**
   * Process user message with Gemini AI
   */
  sanitizeJsonText(rawText) {
    if (!rawText || !rawText.trim()) {
      throw new Error('Empty response from Gemini');
    }

    let cleanText = rawText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const firstBrace = cleanText.indexOf('{');
    const lastBrace = cleanText.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace >= firstBrace) {
      cleanText = cleanText.slice(firstBrace, lastBrace + 1);
    }

    return cleanText;
  }

  parseGeminiResponse(rawText) {
    const cleanText = this.sanitizeJsonText(rawText);
    return JSON.parse(cleanText);
  }

  isValidResponse(payload) {
    if (!payload || typeof payload !== 'object') {
      return false;
    }

    if (typeof payload.response !== 'string' || payload.response.trim().length === 0) {
      return false;
    }

    if (!payload.action || typeof payload.action !== 'string' || !VALID_ACTIONS.has(payload.action)) {
      return false;
    }

    if (payload.parameters && typeof payload.parameters !== 'object') {
      return false;
    }

    if (payload.missingFields && !Array.isArray(payload.missingFields)) {
      return false;
    }

    return true;
  }

  buildFallbackResponse(userMessage, reason) {
    console.warn(`[CHATBOT] Falling back to pattern matching (${reason})`);
    try {
      const fallbackPayload = chatbotFallback.parseMessage(userMessage);
      return {
        payload: fallbackPayload,
        source: 'fallback',
        model: 'pattern-matching'
      };
    } catch (error) {
      console.error('[CHATBOT] Fallback handler failed:', error);
      throw new ApiError('Unable to process your message. Please try again.', 500);
    }
  }

  async generateWithGemini(prompt) {
    if (!this.genAI || this.geminiModels.length === 0) {
      throw new Error('Gemini models are not available');
    }

    let lastError = null;

    for (const modelName of this.geminiModels) {
      try {
        if (!this.modelCache.has(modelName)) {
          this.modelCache.set(modelName, this.genAI.getGenerativeModel({ model: modelName }));
        }

        const model = this.modelCache.get(modelName);
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        if (!text || !text.trim()) {
          throw new Error('Empty response from Gemini');
        }

        console.log(`[CHATBOT] Gemini model ${modelName} responded successfully`);
        return { text, modelName };
      } catch (error) {
        lastError = error;
        console.error(`[CHATBOT] Gemini model ${modelName} error:`, error.message);
      }
    }

    throw lastError || new Error('All Gemini models failed');
  }
  async processMessage(userId, userMessage, currentUser) {
    try {
      // Add user message to history
      this.addToHistory(userId, 'user', userMessage);

      // Build conversation context
      const history = this.getConversationHistory(userId);
      const contextMessages = history
        .slice(-5) // Last 5 messages
        .map(h => `${h.role}: ${h.content}`)
        .join('\n');

      // Create prompt with system context and user message
      const prompt = `${this.getSystemPrompt()}

**Previous Conversation:**
${contextMessages}

**Current User Message:**
${userMessage}

**User Context:**
- User ID: ${currentUser.id}
- User Role: ${currentUser.role}
- Company ID: ${currentUser.company_id}

Analyze the message and respond ONLY with valid JSON. Do not include any markdown formatting or code blocks.`;

      let parsedResponse;
      let source = 'gemini';
      let modelUsed = null;

      if (this.useFallbackOnly) {
        const fallback = this.buildFallbackResponse(userMessage, 'fallback_only_mode');
        parsedResponse = fallback.payload;
        source = fallback.source;
        modelUsed = fallback.model;
      } else {
        try {
          const { text, modelName } = await this.generateWithGemini(prompt);
          modelUsed = modelName;
          parsedResponse = this.parseGeminiResponse(text);

          if (!this.isValidResponse(parsedResponse)) {
            throw new Error('Invalid response structure from Gemini');
          }
        } catch (geminiError) {
          console.error('[CHATBOT] Gemini processing error:', geminiError);
          const fallback = this.buildFallbackResponse(userMessage, geminiError.message || 'gemini_error');
          parsedResponse = fallback.payload;
          source = fallback.source;
          modelUsed = fallback.model;
        }
      }

      parsedResponse.parameters = parsedResponse.parameters && typeof parsedResponse.parameters === 'object'
        ? parsedResponse.parameters
        : {};

      this.addToHistory(userId, 'assistant', parsedResponse.response);

      // Execute action if needed
      let actionResult = null;
      if (parsedResponse.action && parsedResponse.action !== 'CHAT') {
        console.log(`[CHATBOT] Executing action: ${parsedResponse.action}`);
        console.log(`[CHATBOT] Parameters: ${JSON.stringify(parsedResponse.parameters)}`);
        console.log(`[CHATBOT] Needs confirmation: ${parsedResponse.needsConfirmation === true}`);

        actionResult = await this.executeAction(
          parsedResponse.action,
          parsedResponse.parameters,
          currentUser,
          parsedResponse.needsConfirmation
        );

        if (actionResult?.leads) {
          console.log(`[CHATBOT] Found leads: ${actionResult.leads.length}`);
        }
      }

      return {
        success: true,
        response: parsedResponse.response,
        action: parsedResponse.action || 'CHAT',
        intent: parsedResponse.intent || null,
        parameters: parsedResponse.parameters,
        needsConfirmation: Boolean(parsedResponse.needsConfirmation) && parsedResponse.action !== 'CHAT',
        missingFields: Array.isArray(parsedResponse.missingFields) ? parsedResponse.missingFields : [],
        data: actionResult,
        source,
        model: modelUsed
      };
    } catch (error) {
      console.error('Chatbot processing error:', error);

      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError('Failed to process your message. Please try again.', 500);
    }
  }

  /**
   * Execute the action determined by AI
   */
  async executeAction(action, parameters, currentUser, needsConfirmation) {
    try {
      // If confirmation is needed, don't execute yet
      if (needsConfirmation) {
        return { pending: true, parameters };
      }

      switch (action) {
        case 'CREATE_LEAD':
          return await this.createLead(parameters, currentUser);

        case 'UPDATE_LEAD':
          return await this.updateLead(parameters, currentUser);

        case 'GET_LEAD':
          return await this.getLead(parameters, currentUser);

        case 'SEARCH_LEADS':
          return await this.searchLeads(parameters, currentUser);

        case 'LIST_LEADS':
          return await this.listLeads(parameters, currentUser);

        case 'GET_STATS':
          return await this.getStats(currentUser);

        case 'DELETE_LEAD':
          return await this.deleteLead(parameters, currentUser);

        case 'ADD_LEAD_NOTE':
          return await this.addLeadNote(parameters, currentUser);

        case 'VIEW_LEAD_NOTES':
          return await this.viewLeadNotes(parameters, currentUser);

        case 'MOVE_LEAD_STAGE':
          return await this.moveLeadStage(parameters, currentUser);

        case 'ASSIGN_LEAD':
          return await this.assignLead(parameters, currentUser);

        case 'UNASSIGN_LEAD':
          return await this.unassignLead(parameters, currentUser);

        case 'DETECT_DUPLICATES':
          return await this.detectDuplicates(parameters, currentUser);

        case 'EXPORT_LEADS':
          return await this.exportLeads(parameters, currentUser);

        case 'SUGGEST_ASSIGNMENT':
          return await this.suggestAssignment(parameters, currentUser);

        case 'LEAD_SCORING':
          return await this.scoreLeads(parameters, currentUser);

        default:
          return null;
      }
    } catch (error) {
      console.error('Action execution error:', error);
      throw error;
    }
  }

  /**
   * Create a new lead
   */
  async createLead(parameters, currentUser) {
    const leadData = {
      first_name: parameters.first_name,
      last_name: parameters.last_name,
      email: parameters.email,
      phone: parameters.phone || null,
      company: parameters.company || null,
      job_title: parameters.job_title || null,
      lead_source: parameters.lead_source || 'other',
      status: parameters.status || 'new',
      deal_value: parameters.deal_value || null,
      expected_close_date: parameters.expected_close_date || null,
      priority: parameters.priority || 'medium',
      notes: parameters.notes || null,
      created_by: currentUser.id,
      company_id: currentUser.company_id
    };

    const lead = await leadService.createLead(leadData);
    return { lead, action: 'created' };
  }

  /**
   * Update an existing lead
   */
  async updateLead(parameters, currentUser) {
    // Find lead by email or ID
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead to update', 404);
    }

    // Prepare update data (only include fields that are provided)
    const updateData = {};
    if (parameters.first_name) updateData.first_name = parameters.first_name;
    if (parameters.last_name) updateData.last_name = parameters.last_name;
    if (parameters.email) updateData.email = parameters.email;
    if (parameters.phone) updateData.phone = parameters.phone;
    if (parameters.company) updateData.company = parameters.company;
    if (parameters.job_title) updateData.job_title = parameters.job_title;
    if (parameters.lead_source) updateData.lead_source = parameters.lead_source;
    if (parameters.status) updateData.status = parameters.status;
    if (parameters.deal_value !== undefined) updateData.deal_value = parameters.deal_value;
    if (parameters.expected_close_date) updateData.expected_close_date = parameters.expected_close_date;
    if (parameters.priority) updateData.priority = parameters.priority;
    if (parameters.notes) updateData.notes = parameters.notes;

    const leadResult = await leadService.updateLead(leadId, updateData, currentUser);

    if (!leadResult) {
      throw new ApiError('Lead not found', 404);
    }

    return { lead: leadResult.updatedLead, action: 'updated' };
  }

  /**
   * Get a specific lead
   */
  async getLead(parameters, currentUser) {
    if (parameters.lead_id) {
      const lead = await leadService.getLeadById(parameters.lead_id);
      return { leads: [lead], count: 1 };
    }

    if (parameters.email) {
      const leads = await leadService.searchLeads(parameters.email, 1, currentUser);
      return { leads, count: leads.length };
    }

    throw new ApiError('Please provide a lead ID or email', 400);
  }

  /**
   * Search leads
   */
  async searchLeads(parameters, currentUser) {
    const query = parameters.search || parameters.query || '';
    const limit = parameters.limit || 10;

    const leads = await leadService.searchLeads(query, limit, currentUser);
    return { leads, count: leads.length };
  }

  /**
   * List leads with filters
   */
  async listLeads(parameters, currentUser) {
    const DateParser = require('../utils/dateParser');
    const page = parameters.page || 1;
    const limit = parameters.limit || 10;

    const filters = {
      status: parameters.status || '',
      source: parameters.source || parameters.lead_source || '',
      assigned_to: parameters.assigned_to || '',
      sort_by: parameters.sort_by || 'created_at',
      sort_order: parameters.sort_order || 'desc'
    };

    // Handle date range filters
    if (parameters.created_after) {
      filters.date_from = parameters.created_after;
    }
    if (parameters.created_before) {
      filters.date_to = parameters.created_before;
    }

    // Handle deal value range filters
    if (parameters.deal_value_min) {
      filters.deal_value_min = parameters.deal_value_min;
    }
    if (parameters.deal_value_max) {
      filters.deal_value_max = parameters.deal_value_max;
    }

    const result = await leadService.getLeads(currentUser, page, limit, filters);
    return {
      leads: result.leads,
      count: result.totalItems,
      pagination: {
        current_page: result.currentPage,
        total_pages: result.totalPages,
        has_next: result.hasNext,
        has_prev: result.hasPrev
      }
    };
  }

  /**
   * Get lead statistics
   */
  async getStats(currentUser) {
    const stats = await leadService.getLeadStats(currentUser);
    return { stats };
  }

  /**
   * Confirm and execute pending action
   */
  async confirmAction(userId, action, parameters, currentUser) {
    return await this.executeAction(action, parameters, currentUser, false);
  }

  /**
   * Delete a lead
   */
  async deleteLead(parameters, currentUser) {
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead to delete', 404);
    }

    const result = await leadService.deleteLead(leadId, currentUser);
    return { lead: result.deletedLead, action: 'deleted' };
  }

  /**
   * Add or update notes for a lead
   */
  async addLeadNote(parameters, currentUser) {
    let leadId = parameters.lead_id;
    const noteContent = parameters.note_content || parameters.note || '';

    if (!noteContent.trim()) {
      throw new ApiError('Note content is required', 400);
    }

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead to add note to', 404);
    }

    const updateData = { notes: noteContent };
    const leadResult = await leadService.updateLead(leadId, updateData, currentUser);

    return { lead: leadResult.updatedLead, action: 'note_added' };
  }

  /**
   * View notes and activities for a lead
   */
  async viewLeadNotes(parameters, currentUser) {
    const activityService = require('./activityService');
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead', 404);
    }

    const lead = await leadService.getLeadById(leadId);
    const activitiesResult = await activityService.getActivities(currentUser, { lead_id: leadId });

    return {
      lead: { id: lead.id, name: lead.name, notes: lead.notes },
      activities: activitiesResult.data || [],
      action: 'viewed'
    };
  }

  /**
   * Move lead to a different pipeline stage
   */
  async moveLeadStage(parameters, currentUser) {
    const pipelineService = require('./pipelineService');
    let leadId = parameters.lead_id;
    const stageName = parameters.stage_name || parameters.stage || '';

    if (!stageName.trim()) {
      throw new ApiError('Stage name is required', 400);
    }

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead to move', 404);
    }

    const stagesResult = await pipelineService.getAllStages(currentUser);
    if (!stagesResult.success) {
      throw new ApiError('Could not fetch pipeline stages', 500);
    }

    const stages = stagesResult.data || [];
    const targetStage = stages.find(s => s.name.toLowerCase().includes(stageName.toLowerCase()));

    if (!targetStage) {
      throw new ApiError(`Pipeline stage '${stageName}' not found`, 404);
    }

    const updateData = { pipeline_stage_id: targetStage.id };
    const leadResult = await leadService.updateLead(leadId, updateData, currentUser);

    return { lead: leadResult.updatedLead, stage: targetStage.name, action: 'moved' };
  }

  /**
   * Assign lead to a team member
   */
  async assignLead(parameters, currentUser) {
    const { supabaseAdmin } = require('../config/supabase');
    let leadId = parameters.lead_id;
    const assignTo = parameters.assigned_to || parameters.assign_to || '';

    if (!assignTo.trim()) {
      throw new ApiError('Team member name or email is required', 400);
    }

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead to assign', 404);
    }

    const { data: users, error: usersError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, email')
      .eq('company_id', currentUser.company_id);

    if (usersError) {
      throw new ApiError('Could not fetch team members', 500);
    }

    const targetUser = users.find(u =>
      u.first_name.toLowerCase().includes(assignTo.toLowerCase()) ||
      u.last_name.toLowerCase().includes(assignTo.toLowerCase()) ||
      u.email.toLowerCase().includes(assignTo.toLowerCase())
    );

    if (!targetUser) {
      throw new ApiError(`Team member '${assignTo}' not found`, 404);
    }

    const updateData = { assigned_to: targetUser.id, assigned_at: new Date().toISOString() };
    const leadResult = await leadService.updateLead(leadId, updateData, currentUser);

    return {
      lead: leadResult.updatedLead,
      assigned_to: `${targetUser.first_name} ${targetUser.last_name}`,
      action: 'assigned'
    };
  }

  /**
   * Unassign lead from current assignee
   */
  async unassignLead(parameters, currentUser) {
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead to unassign', 404);
    }

    const updateData = { assigned_to: null };
    const leadResult = await leadService.updateLead(leadId, updateData, currentUser);

    return { lead: leadResult.updatedLead, action: 'unassigned' };
  }

  /**
   * Detect duplicate leads
   */
  async detectDuplicates(parameters, currentUser) {
    const { supabaseAdmin } = require('../config/supabase');

    let searchEmail = parameters.email;
    let searchPhone = parameters.phone;
    let searchCompany = parameters.company;
    let searchName = parameters.search;

    // Try to extract from lead if searching by ID
    if (parameters.lead_id && !searchEmail && !searchPhone) {
      const lead = await leadService.getLeadById(parameters.lead_id);
      searchEmail = lead.email;
      searchPhone = lead.phone;
      searchCompany = lead.company;
      searchName = lead.name;
    }

    if (!searchEmail && !searchPhone && !searchCompany && !searchName) {
      throw new ApiError('Please provide email, phone, company, or lead name to check for duplicates', 400);
    }

    let query = supabaseAdmin
      .from('leads')
      .select('id, name, email, phone, company, status, created_at')
      .eq('company_id', currentUser.company_id);

    const duplicates = [];

    // Check for email duplicates
    if (searchEmail) {
      const { data: emailMatches } = await query
        .ilike('email', `%${searchEmail}%`)
        .limit(10);

      if (emailMatches && emailMatches.length > 1) {
        duplicates.push({
          type: 'email',
          value: searchEmail,
          matches: emailMatches.slice(0, 5)
        });
      }
    }

    // Check for phone duplicates
    if (searchPhone) {
      const { data: phoneMatches } = await supabaseAdmin
        .from('leads')
        .select('id, name, email, phone, company, status')
        .eq('company_id', currentUser.company_id)
        .ilike('phone', `%${searchPhone}%`)
        .limit(10);

      if (phoneMatches && phoneMatches.length > 1) {
        duplicates.push({
          type: 'phone',
          value: searchPhone,
          matches: phoneMatches.slice(0, 5)
        });
      }
    }

    // Check for company duplicates
    if (searchCompany) {
      const { data: companyMatches } = await supabaseAdmin
        .from('leads')
        .select('id, name, email, phone, company, status')
        .eq('company_id', currentUser.company_id)
        .ilike('company', `%${searchCompany}%`)
        .limit(10);

      if (companyMatches && companyMatches.length > 1) {
        duplicates.push({
          type: 'company',
          value: searchCompany,
          matches: companyMatches.slice(0, 5)
        });
      }
    }

    return {
      found: duplicates.length > 0,
      duplicates,
      summary: duplicates.length === 0
        ? 'No duplicates found'
        : `Found ${duplicates.length} potential duplicate${duplicates.length > 1 ? 's' : ''}`
    };
  }

  /**
   * Export leads to CSV or Excel
   */
  async exportLeads(parameters, currentUser) {
    const importController = require('../controllers/importController');
    const page = parameters.page || 1;
    const limit = parameters.limit || 1000;

    const filters = {
      status: parameters.status || '',
      source: parameters.source || parameters.lead_source || '',
      assigned_to: parameters.assigned_to || '',
      date_from: parameters.created_after || '',
      date_to: parameters.created_before || '',
      deal_value_min: parameters.deal_value_min || '',
      deal_value_max: parameters.deal_value_max || ''
    };

    try {
      const result = await leadService.getLeads(currentUser, page, limit, filters);

      if (!result.leads || result.leads.length === 0) {
        throw new ApiError('No leads found to export', 404);
      }

      const format = (parameters.format || 'csv').toLowerCase();

      // Prepare leads data for export
      const leadsForExport = result.leads.map(lead => ({
        'First Name': lead.first_name || '',
        'Last Name': lead.last_name || '',
        'Email': lead.email || '',
        'Phone': lead.phone || '',
        'Company': lead.company || '',
        'Job Title': lead.job_title || '',
        'Source': lead.lead_source || '',
        'Status': lead.status || '',
        'Deal Value': lead.deal_value || '',
        'Expected Close Date': lead.expected_close_date || '',
        'Priority': lead.priority || '',
        'Notes': lead.notes || '',
        'Created At': lead.created_at || ''
      }));

      return {
        success: true,
        data: leadsForExport,
        count: leadsForExport.length,
        format,
        message: `Exported ${leadsForExport.length} lead${leadsForExport.length > 1 ? 's' : ''} in ${format.toUpperCase()} format`
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to export leads', 500);
    }
  }

  /**
   * Suggest assignment for a lead
   */
  async suggestAssignment(parameters, currentUser) {
    const { supabaseAdmin } = require('../config/supabase');
    let leadId = parameters.lead_id;

    if (!leadId && parameters.email) {
      const searchResults = await leadService.searchLeads(parameters.email, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId && parameters.search) {
      const searchResults = await leadService.searchLeads(parameters.search, 1, currentUser);
      if (searchResults && searchResults.length > 0) {
        leadId = searchResults[0].id;
      }
    }

    if (!leadId) {
      throw new ApiError('Could not find the lead', 404);
    }

    const lead = await leadService.getLeadById(leadId);

    // Get all active users
    const { data: users } = await supabaseAdmin
      .from('user_profiles')
      .select('id, first_name, last_name, role')
      .eq('company_id', currentUser.company_id)
      .eq('status', 'active');

    // Get team member workload (number of assigned leads)
    const { data: assignmentCounts } = await supabaseAdmin
      .from('leads')
      .select('assigned_to', { count: 'exact' })
      .eq('company_id', currentUser.company_id)
      .eq('status', 'active');

    const workloadMap = {};
    assignmentCounts?.forEach(assignment => {
      if (assignment.assigned_to) {
        workloadMap[assignment.assigned_to] = (workloadMap[assignment.assigned_to] || 0) + 1;
      }
    });

    // Score users based on role and workload
    const suggestions = users
      ?.filter(u => u.role === 'sales_rep' || u.role === 'manager')
      .map(u => ({
        user_id: u.id,
        name: `${u.first_name} ${u.last_name}`,
        role: u.role,
        workload: workloadMap[u.id] || 0,
        score: this.calculateAssignmentScore(workloadMap[u.id] || 0, u.role)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3) || [];

    return {
      lead: { id: lead.id, name: lead.name, email: lead.email },
      suggestions,
      top_suggestion: suggestions[0] || null,
      summary: suggestions.length > 0
        ? `Recommended: ${suggestions[0].name}`
        : 'No available team members'
    };
  }

  /**
   * Calculate assignment score based on workload and role
   */
  calculateAssignmentScore(workload, role) {
    const roleWeight = role === 'manager' ? 1.2 : 1.0;
    const workloadPenalty = workload * 0.5;
    return (10 - workloadPenalty) * roleWeight;
  }

  /**
   * Score leads by engagement and potential
   */
  async scoreLeads(parameters, currentUser) {
    const page = parameters.page || 1;
    const limit = parameters.limit || 20;

    const filters = {
      status: parameters.status || '',
      source: parameters.source || parameters.lead_source || '',
      assigned_to: parameters.assigned_to || '',
      date_from: parameters.created_after || '',
      date_to: parameters.created_before || ''
    };

    try {
      const result = await leadService.getLeads(currentUser, page, limit, filters);

      if (!result.leads || result.leads.length === 0) {
        throw new ApiError('No leads found to score', 404);
      }

      // Score each lead
      const scoredLeads = result.leads.map(lead => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        score: this.calculateLeadScore(lead),
        factors: {
          status_value: this.getStatusValue(lead.status),
          has_deal_value: lead.deal_value ? true : false,
          deal_value_amount: lead.deal_value || 0,
          recency_days: this.daysSinceCreated(lead.created_at)
        }
      }));

      // Sort by score descending
      scoredLeads.sort((a, b) => b.score - a.score);

      return {
        scored_leads: scoredLeads,
        count: scoredLeads.length,
        average_score: (scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length).toFixed(1),
        summary: `Scored ${scoredLeads.length} leads. Average score: ${(scoredLeads.reduce((sum, l) => sum + l.score, 0) / scoredLeads.length).toFixed(1)}/100`
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('Failed to score leads', 500);
    }
  }

  /**
   * Calculate lead score (0-100)
   */
  calculateLeadScore(lead) {
    let score = 50; // Base score

    // Status scoring (0-30 points)
    const statusValue = this.getStatusValue(lead.status);
    score += statusValue * 3; // Up to 30 points

    // Deal value scoring (0-25 points)
    if (lead.deal_value) {
      const dealScore = Math.min(25, (lead.deal_value / 100000) * 25);
      score += dealScore;
    }

    // Recency scoring (0-20 points)
    const daysSince = this.daysSinceCreated(lead.created_at);
    const recencyScore = Math.max(0, 20 - (daysSince / 7)); // Newer = better
    score += recencyScore;

    // Priority bonus (0-5 points)
    if (lead.priority === 'high') {
      score += 5;
    } else if (lead.priority === 'medium') {
      score += 2.5;
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Get numeric value for status
   */
  getStatusValue(status) {
    const statusMap = {
      'new': 2,
      'contacted': 4,
      'qualified': 8,
      'proposal': 9,
      'negotiation': 9.5,
      'won': 10,
      'lost': 0,
      'inactive': 1,
      'active': 5
    };
    return statusMap[status] || 5;
  }

  /**
   * Calculate days since lead was created
   */
  daysSinceCreated(createdAt) {
    if (!createdAt) return 0;
    const created = new Date(createdAt);
    const now = new Date();
    return Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24));
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
