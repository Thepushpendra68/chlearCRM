/**
 * Fallback Pattern Matching System
 * Used when Gemini AI is unavailable or returns errors
 * Provides basic natural language understanding without AI
 */

class ChatbotFallback {
  /**
   * Parse user message using pattern matching
   * Returns the same format as Gemini AI would
   */
  parseMessage(userMessage) {
    const message = userMessage.toLowerCase().trim();

    // Pattern 1: List/Show leads with status filter
    if (this.matchesPattern(message, ['show', 'list', 'get', 'find', 'display'])) {
      return this.handleListLeads(message);
    }

    // Pattern 2: Create lead
    if (this.matchesPattern(message, ['create', 'add', 'new']) &&
        this.matchesPattern(message, ['lead'])) {
      return this.handleCreateLead(message, userMessage);
    }

    // Pattern 3: Update lead
    if (this.matchesPattern(message, ['update', 'change', 'modify', 'edit'])) {
      return this.handleUpdateLead(message, userMessage);
    }

    // Pattern 4: Search lead
    if (this.matchesPattern(message, ['search', 'find', 'lookup']) &&
        (message.includes('@') || message.includes('email') || /[A-Z][a-z]+/.test(userMessage))) {
      return this.handleSearchLead(message, userMessage);
    }

    // Pattern 5: Statistics
    if (this.matchesPattern(message, ['stat', 'statistics', 'analytics', 'report', 'summary'])) {
      return this.handleStats();
    }

    // Pattern 6: Help/Greeting
    if (this.matchesPattern(message, ['help', 'hello', 'hi', 'hey', 'start'])) {
      return this.handleGreeting();
    }

    // Default: Unclear intent
    return this.handleUnclear(message);
  }

  /**
   * Check if message matches any of the patterns
   */
  matchesPattern(message, keywords) {
    return keywords.some(keyword => message.includes(keyword));
  }

  /**
   * Extract email from message
   */
  extractEmail(message) {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = message.match(emailRegex);
    return match ? match[0] : null;
  }

  /**
   * Extract name from message
   */
  extractName(message) {
    // Look for patterns like "named John Doe" or "name is John Doe"
    const namedPattern = /(?:named|name is|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
    const match = message.match(namedPattern);

    if (match) {
      const fullName = match[1].trim();
      const nameParts = fullName.split(' ');
      return {
        first_name: nameParts[0] || '',
        last_name: nameParts.slice(1).join(' ') || ''
      };
    }

    return null;
  }

  /**
   * Extract company from message
   */
  extractCompany(message) {
    const companyPattern = /(?:from|at|company|works at)\s+([A-Z][A-Za-z\s&,.']+?)(?:\s*,|\s+email|\s*$)/i;
    const match = message.match(companyPattern);
    return match ? match[1].trim() : null;
  }

  /**
   * Extract status from message
   */
  extractStatus(message) {
    const statusKeywords = {
      'active': ['active'],
      'inactive': ['inactive'],
      'new': ['new'],
      'contacted': ['contacted'],
      'qualified': ['qualified'],
      'proposal': ['proposal'],
      'negotiation': ['negotiation', 'negotiating'],
      'won': ['won', 'closed won'],
      'lost': ['lost', 'closed lost']
    };

    for (const [status, keywords] of Object.entries(statusKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return status;
      }
    }

    return null;
  }

  /**
   * Handle list/show leads request
   */
  handleListLeads(message) {
    const status = this.extractStatus(message);

    // Check if user wants all leads
    const wantsAll = message.includes('all') || message.includes('every');

    const parameters = {
      limit: 50
    };

    if (status) {
      parameters.status = status;
    }

    return {
      action: 'LIST_LEADS',
      intent: status ? `List ${status} leads` : 'List all leads',
      parameters,
      response: status
        ? `Here are all ${status} leads:`
        : 'Here are all your leads:',
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle create lead request
   */
  handleCreateLead(message, originalMessage) {
    const name = this.extractName(originalMessage);
    const email = this.extractEmail(originalMessage);
    const company = this.extractCompany(originalMessage);

    const parameters = {};
    const missingFields = [];

    if (name) {
      parameters.first_name = name.first_name;
      parameters.last_name = name.last_name;
    } else {
      missingFields.push('first_name', 'last_name');
    }

    if (email) {
      parameters.email = email;
    } else {
      missingFields.push('email');
    }

    if (company) {
      parameters.company = company;
    }

    // If missing critical fields, ask for them
    if (missingFields.length > 0) {
      return {
        action: 'CHAT',
        intent: 'Need more information to create lead',
        parameters: {},
        response: `I'd like to help you create a lead! Please provide: ${missingFields.join(', ')}. For example: "Create a lead named John Doe, email john@example.com, from Acme Corp"`,
        needsConfirmation: false,
        missingFields
      };
    }

    return {
      action: 'CREATE_LEAD',
      intent: 'Create new lead',
      parameters,
      response: `I'll create a lead for ${name.first_name} ${name.last_name} (${email})${company ? ` from ${company}` : ''}. Please confirm.`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle update lead request
   */
  handleUpdateLead(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const status = this.extractStatus(message);

    if (!email && !status) {
      return {
        action: 'CHAT',
        intent: 'Need more information',
        parameters: {},
        response: 'To update a lead, please provide the email address and what you want to update. For example: "Update john@example.com status to qualified"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    const parameters = {};
    if (email) parameters.email = email;
    if (status) parameters.status = status;

    return {
      action: 'UPDATE_LEAD',
      intent: 'Update lead',
      parameters,
      response: `I'll update the lead${email ? ` with email ${email}` : ''}${status ? ` to status "${status}"` : ''}. Please confirm.`,
      needsConfirmation: true,
      missingFields: email ? [] : ['email']
    };
  }

  /**
   * Handle search lead request
   */
  handleSearchLead(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    } else {
      // Extract any capitalized words as potential name
      const words = originalMessage.split(' ');
      const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));
      searchQuery = capitalizedWords.join(' ');
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need search query',
        parameters: {},
        response: 'What would you like to search for? Please provide a name or email address.',
        needsConfirmation: false,
        missingFields: ['search']
      };
    }

    return {
      action: 'SEARCH_LEADS',
      intent: 'Search for lead',
      parameters: {
        search: searchQuery,
        limit: 10
      },
      response: `Searching for "${searchQuery}"...`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle statistics request
   */
  handleStats() {
    return {
      action: 'GET_STATS',
      intent: 'Get lead statistics',
      parameters: {},
      response: 'Here are your lead statistics:',
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle greeting/help
   */
  handleGreeting() {
    return {
      action: 'CHAT',
      intent: 'Greeting',
      parameters: {},
      response: 'Hello! I\'m your CRM assistant. I can help you:\n\n• Create leads: "Create a lead named John Doe, email john@example.com"\n• Show leads: "Show me all active leads"\n• Search: "Find john@example.com"\n• Update: "Update john@example.com status to qualified"\n• Statistics: "Show me lead statistics"\n\nWhat would you like to do?',
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle unclear intent
   */
  handleUnclear(message) {
    return {
      action: 'CHAT',
      intent: 'Unclear request',
      parameters: {},
      response: 'I\'m not sure what you\'d like to do. Here are some things I can help with:\n\n• "Show me all leads"\n• "Create a lead named John Doe, email john@example.com"\n• "Search for john@example.com"\n• "Show me lead statistics"\n\nCould you rephrase your request?',
      needsConfirmation: false,
      missingFields: []
    };
  }
}

// Export singleton instance
module.exports = new ChatbotFallback();