const { GoogleGenerativeAI } = require('@google/generative-ai');
const leadService = require('./leadService');
const ApiError = require('../utils/ApiError');
const chatbotFallback = require('./chatbotFallback');

/**
 * Chatbot Service for Lead Management
 * Uses Google Gemini AI to process natural language queries
 */
class ChatbotService {
  constructor() {
    this.conversationHistory = new Map(); // Store conversation context per user
    this.useFallbackOnly = process.env.CHATBOT_FALLBACK_ONLY === 'true';

    // If fallback-only mode, skip AI initialization
    if (this.useFallbackOnly) {
      console.log('⚠️ [CHATBOT] Running in FALLBACK-ONLY mode (AI disabled)');
      console.log('✅ [CHATBOT] Pattern matching chatbot initialized');
      return;
    }

    // Validate API key
    if (!process.env.GEMINI_API_KEY) {
      console.warn('⚠️ GEMINI_API_KEY is not set - will use fallback pattern matching');
      this.useFallbackOnly = true;
      return;
    }

    try {
      console.log('✅ Initializing Gemini AI with API key:', process.env.GEMINI_API_KEY.substring(0, 10) + '...');

      // Initialize Gemini AI
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

      // Use gemini-pro-latest (stable model) - more reliable than experimental models
      // Note: gemini-2.0-flash-exp can have 500 errors, gemini-pro-latest is more stable
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro-latest' });

      console.log('✅ Gemini AI chatbot service initialized successfully with model: gemini-pro-latest');
    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error.message);
      console.log('🔄 Falling back to pattern matching mode');
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

      // Use fallback if in fallback-only mode, otherwise try AI first
      let text;

      if (this.useFallbackOnly) {
        console.log('🔄 [CHATBOT] Using fallback pattern matching (AI disabled)...');
        try {
          const fallbackResponse = chatbotFallback.parseMessage(userMessage);
          text = JSON.stringify(fallbackResponse);
          console.log('✅ [CHATBOT] Fallback response generated successfully');
        } catch (fallbackError) {
          console.error('❌ [CHATBOT] Fallback failed:', fallbackError);
          throw new ApiError('Unable to process your message. Please try again.', 500);
        }
      } else {
        // Call Gemini AI
        console.log('🤖 [CHATBOT] Calling Gemini AI...');
        try {
          const result = await this.model.generateContent(prompt);
          const response = await result.response;
          text = response.text();
          console.log('✅ [CHATBOT] Gemini AI response received:', text.substring(0, 100) + '...');
        } catch (geminiError) {
          console.error('❌ [CHATBOT] Gemini API error:', geminiError.message);
          console.log('🔄 [CHATBOT] Switching to fallback pattern matching...');

          // Use fallback pattern matching when AI fails
          try {
            const fallbackResponse = chatbotFallback.parseMessage(userMessage);
            text = JSON.stringify(fallbackResponse);
            console.log('✅ [CHATBOT] Fallback response generated successfully');
          } catch (fallbackError) {
            console.error('❌ [CHATBOT] Fallback also failed:', fallbackError);
            throw new ApiError('Unable to process your message. Please try again later.', 500);
          }
        }
      }

      // Parse the response
      let parsedResponse;
      try {
        // Remove markdown code blocks if present
        const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsedResponse = JSON.parse(cleanText);
        console.log('✅ [CHATBOT] Parsed response action:', parsedResponse.action);
      } catch (parseError) {
        console.error('❌ [CHATBOT] Failed to parse Gemini response:', text);
        console.error('Parse error:', parseError);
        throw new ApiError('Failed to understand the request. Please try again.', 500);
      }

      // Add assistant response to history
      this.addToHistory(userId, 'assistant', parsedResponse.response);

      // Execute action if needed
      let actionResult = null;
      if (parsedResponse.action && parsedResponse.action !== 'CHAT') {
        console.log('🎬 [CHATBOT] Executing action:', parsedResponse.action);
        console.log('📋 [CHATBOT] Parameters:', JSON.stringify(parsedResponse.parameters));
        console.log('❓ [CHATBOT] Needs confirmation:', parsedResponse.needsConfirmation);

        actionResult = await this.executeAction(
          parsedResponse.action,
          parsedResponse.parameters,
          currentUser,
          parsedResponse.needsConfirmation
        );

        console.log('✅ [CHATBOT] Action result:', actionResult ? `${Object.keys(actionResult).join(', ')}` : 'null');
        if (actionResult?.leads) {
          console.log('📊 [CHATBOT] Found leads:', actionResult.leads.length);
        }
      }

      return {
        success: true,
        response: parsedResponse.response,
        action: parsedResponse.action,
        intent: parsedResponse.intent,
        needsConfirmation: parsedResponse.needsConfirmation || false,
        missingFields: parsedResponse.missingFields || [],
        data: actionResult
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

    const lead = await leadService.updateLead(leadId, updateData, currentUser);
    return { lead, action: 'updated' };
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