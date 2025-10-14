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
  'GET_STATS'
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

User: "Hello"
Response:
{
  "action": "CHAT",
  "intent": "Greeting",
  "parameters": {},
  "response": "Hello! I'm your CRM assistant. I can help you create leads, search for leads, update lead information, and show you statistics. What would you like to do?",
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
    const page = parameters.page || 1;
    const limit = parameters.limit || 10;

    const filters = {
      status: parameters.status || '',
      source: parameters.source || parameters.lead_source || '',
      assigned_to: parameters.assigned_to || '',
      sort_by: parameters.sort_by || 'created_at',
      sort_order: parameters.sort_order || 'desc'
    };

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
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
