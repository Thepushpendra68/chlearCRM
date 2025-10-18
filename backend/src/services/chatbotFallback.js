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

    // Pattern 1: Detect duplicates
    if (this.matchesPattern(message, ['duplicate', 'check duplicate', 'find duplicate'])) {
      return this.handleDetectDuplicates(message, userMessage);
    }

    // Pattern 2: Export leads
    if (this.matchesPattern(message, ['export', 'download']) &&
        this.matchesPattern(message, ['lead', 'csv', 'excel'])) {
      return this.handleExportLeads(message, userMessage);
    }

    // Pattern 3: Assignment suggestions
    if (this.matchesPattern(message, ['suggest', 'suggest assignment', 'who should', 'assign to']) &&
        !this.matchesPattern(message, ['export', 'delete', 'update'])) {
      return this.handleSuggestAssignment(message, userMessage);
    }

    // Pattern 4: Lead scoring
    if (this.matchesPattern(message, ['score', 'scoring', 'rank']) &&
        this.matchesPattern(message, ['lead', 'leads'])) {
      return this.handleLeadScoring(message, userMessage);
    }

    // Pattern 5: Create task
    if (this.matchesPattern(message, ['create task', 'new task', 'add task', 'schedule'])) {
      return this.handleCreateTask(message, userMessage);
    }

    // Pattern 6: List tasks
    if (this.matchesPattern(message, ['show task', 'list task', 'my task']) ||
        (this.matchesPattern(message, ['task']) && this.matchesPattern(message, ['overdue', 'pending', 'todo']))) {
      return this.handleListMyTasks(message, userMessage);
    }

    // Pattern 7: Update/complete task
    if (this.matchesPattern(message, ['complete task', 'finish task', 'mark done', 'done'])) {
      return this.handleUpdateTask(message, userMessage);
    }

    // Pattern 8: Log activity
    if (this.matchesPattern(message, ['log', 'log call', 'log email', 'log meeting']) ||
        (this.matchesPattern(message, ['call', 'email', 'meeting']) && this.matchesPattern(message, ['with', 'contact']))) {
      return this.handleLogActivity(message, userMessage);
    }

    // Pattern 9: Team stats
    if (this.matchesPattern(message, ['team', 'stats']) ||
        (this.matchesPattern(message, ['stats', 'performance']) && this.matchesPattern(message, ['name', 'member']))) {
      return this.handleTeamStats(message, userMessage);
    }

    // Pattern 10: My stats
    if ((this.matchesPattern(message, ['my stats', 'how am i', 'my performance']) ||
         this.matchesPattern(message, ['stats', 'performance'])) &&
        !this.matchesPattern(message, ['team', 'member', 'name'])) {
      return this.handleMyStats(message, userMessage);
    }

    // Pattern 11: Delete lead
    if (this.matchesPattern(message, ['delete', 'remove', 'drop'])) {
      return this.handleDeleteLead(message, userMessage);
    }

    // Pattern 2: Add note
    if (this.matchesPattern(message, ['add note', 'note', 'add comment'])) {
      return this.handleAddNote(message, userMessage);
    }

    // Pattern 3: View notes
    if (this.matchesPattern(message, ['show note', 'view note', 'notes', 'history', 'activities']) &&
        this.matchesPattern(message, ['note', 'history', 'activity', 'activities'])) {
      return this.handleViewNotes(message, userMessage);
    }

    // Pattern 4: Move lead to stage
    if (this.matchesPattern(message, ['move', 'stage', 'pipeline'])) {
      return this.handleMoveStage(message, userMessage);
    }

    // Pattern 5: Assign lead
    if (this.matchesPattern(message, ['assign', 'assignee'])) {
      return this.handleAssignLead(message, userMessage);
    }

    // Pattern 6: Unassign lead
    if (this.matchesPattern(message, ['unassign', 'remove assign'])) {
      return this.handleUnassignLead(message, userMessage);
    }

    // Pattern 7: List/Show leads with status filter
    if (this.matchesPattern(message, ['show', 'list', 'get', 'find', 'display'])) {
      return this.handleListLeads(message);
    }

    // Pattern 8: Create lead
    if (this.matchesPattern(message, ['create', 'add', 'new']) &&
        this.matchesPattern(message, ['lead'])) {
      return this.handleCreateLead(message, userMessage);
    }

    // Pattern 9: Update lead
    if (this.matchesPattern(message, ['update', 'change', 'modify', 'edit']) &&
        !this.matchesPattern(message, ['stage', 'pipeline'])) {
      return this.handleUpdateLead(message, userMessage);
    }

    // Pattern 10: Search lead
    if (this.matchesPattern(message, ['search', 'find', 'lookup']) &&
        (message.includes('@') || message.includes('email') || /[A-Z][a-z]+/.test(userMessage))) {
      return this.handleSearchLead(message, userMessage);
    }

    // Pattern 11: Statistics
    if (this.matchesPattern(message, ['stat', 'statistics', 'analytics', 'report', 'summary'])) {
      return this.handleStats();
    }

    // Pattern 12: Help/Greeting
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
    const DateParser = require('../utils/dateParser');
    const status = this.extractStatus(message);

    // Check if user wants all leads
    const wantsAll = message.includes('all') || message.includes('every');

    const parameters = {
      limit: 50
    };

    if (status) {
      parameters.status = status;
    }

    // Try to extract date ranges
    const dateKeywords = DateParser.extractDateKeywords(message);
    if (dateKeywords.length > 0) {
      // Look for date expressions in the message
      const dateExprMatch = message.match(/(?:created|since|between|last|this)\s+[^.!?]*/);
      if (dateExprMatch) {
        const dateRange = DateParser.parseNaturalDate(dateExprMatch[0]);
        if (dateRange) {
          parameters.created_after = dateRange.from;
          parameters.created_before = dateRange.to;
        }
      }
    }

    // Try to extract deal value ranges
    const valueKeywords = DateParser.extractValueKeywords(message);
    if (valueKeywords.includes('deal_value') || valueKeywords.includes('value')) {
      const valueExprMatch = message.match(/(?:deal value|value|worth)\s+[^.!?]*/i);
      if (valueExprMatch) {
        const valueRange = DateParser.parseDealValueRange(valueExprMatch[0]);
        if (valueRange) {
          if (valueRange.min !== undefined) {
            parameters.deal_value_min = valueRange.min;
          }
          if (valueRange.max !== undefined) {
            parameters.deal_value_max = valueRange.max;
          }
        }
      }
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
   * Handle delete lead request
   */
  handleDeleteLead(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To delete a lead, please provide the name or email. For example: "Delete john@example.com"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    return {
      action: 'DELETE_LEAD',
      intent: 'Delete lead',
      parameters: email ? { email } : { search: searchQuery },
      response: `I'll delete the lead "${searchQuery}". This action cannot be undone. Are you sure?`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle add note request
   */
  handleAddNote(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    // Try to extract note content - look for content after "note:" or "add note"
    let noteContent = '';
    const notePattern = /(?:note:|add note|comment:)\s*(.+?)(?:$|for|to)/i;
    const noteMatch = originalMessage.match(notePattern);
    if (noteMatch) {
      noteContent = noteMatch[1].trim();
    }

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To add a note, please provide the lead name or email. For example: "Add note to john@example.com: Called today"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    if (!noteContent) {
      return {
        action: 'CHAT',
        intent: 'Need note content',
        parameters: {},
        response: `To add a note to "${searchQuery}", please provide the note content. For example: "Add note to ${searchQuery}: Called today, very interested"`,
        needsConfirmation: false,
        missingFields: ['note_content']
      };
    }

    return {
      action: 'ADD_LEAD_NOTE',
      intent: 'Add note to lead',
      parameters: email ? { email, note_content: noteContent } : { search: searchQuery, note_content: noteContent },
      response: `I'll add the note to "${searchQuery}": "${noteContent}"`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle view notes request
   */
  handleViewNotes(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To view notes and activities, please provide the lead name or email. For example: "Show notes for john@example.com"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    return {
      action: 'VIEW_LEAD_NOTES',
      intent: 'View lead notes and activities',
      parameters: email ? { email } : { search: searchQuery },
      response: `Getting notes and activities for "${searchQuery}"...`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle move lead to stage request
   */
  handleMoveStage(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    // Extract stage name - look for "to [stage]" or "move to [stage]"
    const stagePattern = /(?:to|stage|move to)\s+(\w+)/i;
    const stageMatch = originalMessage.match(stagePattern);
    const stageName = stageMatch ? stageMatch[1].toLowerCase() : '';

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To move a lead, please provide the lead name or email and stage. For example: "Move john@example.com to proposal stage"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    if (!stageName) {
      return {
        action: 'CHAT',
        intent: 'Need stage name',
        parameters: {},
        response: `To move the lead "${searchQuery}", please specify a stage. For example: "Move ${searchQuery} to proposal stage"`,
        needsConfirmation: false,
        missingFields: ['stage_name']
      };
    }

    return {
      action: 'MOVE_LEAD_STAGE',
      intent: 'Move lead to pipeline stage',
      parameters: email ? { email, stage_name: stageName } : { search: searchQuery, stage_name: stageName },
      response: `I'll move "${searchQuery}" to the ${stageName} stage.`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle assign lead request
   */
  handleAssignLead(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    // Extract assignee name - look for "to [name]" or "assign to [name]"
    const assigneePattern = /(?:to|assign to)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i;
    const assigneeMatch = originalMessage.match(assigneePattern);
    const assigneeName = assigneeMatch ? assigneeMatch[1] : '';

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To assign a lead, please provide the lead name/email and team member name. For example: "Assign john@example.com to Sarah"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    if (!assigneeName) {
      return {
        action: 'CHAT',
        intent: 'Need assignee name',
        parameters: {},
        response: `To assign the lead "${searchQuery}", please specify who to assign it to. For example: "Assign ${searchQuery} to Sarah"`,
        needsConfirmation: false,
        missingFields: ['assigned_to']
      };
    }

    return {
      action: 'ASSIGN_LEAD',
      intent: 'Assign lead to team member',
      parameters: email ? { email, assigned_to: assigneeName } : { search: searchQuery, assigned_to: assigneeName },
      response: `I'll assign "${searchQuery}" to ${assigneeName}.`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle unassign lead request
   */
  handleUnassignLead(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To unassign a lead, please provide the lead name or email. For example: "Unassign john@example.com"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    return {
      action: 'UNASSIGN_LEAD',
      intent: 'Unassign lead',
      parameters: email ? { email } : { search: searchQuery },
      response: `I'll unassign "${searchQuery}" from its current owner.`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle detect duplicates request
   */
  handleDetectDuplicates(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    // Try to extract phone - look for phone patterns
    let phone = '';
    const phonePattern = /(?:phone|number|tel)\s*:?\s*([\d\s\-\(\)]+)/i;
    const phoneMatch = originalMessage.match(phonePattern);
    if (phoneMatch) {
      phone = phoneMatch[1].trim();
    }

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (phone) {
      searchQuery = phone;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To check for duplicates, please provide an email, phone, or name. For example: "Check for duplicate john@example.com"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    return {
      action: 'DETECT_DUPLICATES',
      intent: 'Detect duplicate leads',
      parameters: email ? { email } : phone ? { phone } : { search: searchQuery },
      response: `I'll check for duplicates matching "${searchQuery}".`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle export leads request
   */
  handleExportLeads(message, originalMessage) {
    const status = this.extractStatus(message);
    const source = this.extractSource(message);

    const parameters = {
      format: message.includes('excel') ? 'excel' : 'csv'
    };

    if (status) {
      parameters.status = status;
    }

    if (source) {
      parameters.lead_source = source;
    }

    return {
      action: 'EXPORT_LEADS',
      intent: 'Export leads',
      parameters,
      response: `I'll export ${status ? `${status} ` : ''}leads to ${parameters.format.toUpperCase()}.`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Extract lead source/channel from message
   */
  extractSource(message) {
    const sourceKeywords = {
      'website': ['website'],
      'referral': ['referral', 'referred'],
      'social_media': ['social', 'instagram', 'facebook', 'linkedin', 'twitter'],
      'cold_call': ['cold call', 'call', 'phone call'],
      'event': ['event', 'conference', 'webinar', 'trade show'],
      'other': ['other']
    };

    for (const [source, keywords] of Object.entries(sourceKeywords)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        return source;
      }
    }

    return null;
  }

  /**
   * Handle suggest assignment request
   */
  handleSuggestAssignment(message, originalMessage) {
    const email = this.extractEmail(originalMessage);
    const name = this.extractName(originalMessage);

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: 'To get assignment suggestions, please provide a lead name or email. For example: "Who should I assign john@example.com to?"',
        needsConfirmation: false,
        missingFields: ['email']
      };
    }

    return {
      action: 'SUGGEST_ASSIGNMENT',
      intent: 'Suggest assignment',
      parameters: email ? { email } : { search: searchQuery },
      response: `Let me check assignment rules and team capacity to suggest the best person for this lead.`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle lead scoring request
   */
  handleLeadScoring(message, originalMessage) {
    const status = this.extractStatus(message);
    const source = this.extractSource(message);

    const parameters = {
      limit: 20
    };

    if (status) {
      parameters.status = status;
    }

    if (source) {
      parameters.lead_source = source;
    }

    return {
      action: 'LEAD_SCORING',
      intent: 'Score leads',
      parameters,
      response: `I'll score ${status ? `${status} ` : ''}leads based on engagement and potential.`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle create task request
   */
  handleCreateTask(message, originalMessage) {
    // Extract description - typically everything after "create task" or "add task"
    let description = '';
    const taskPattern = /(?:create|add|new|schedule)\s+task\s*:?\s*(.+?)(?:\s+(?:tomorrow|today|next|in|by|due|for|at)\s|\s*$)/i;
    const taskMatch = originalMessage.match(taskPattern);
    if (taskMatch) {
      description = taskMatch[1].trim();
    }

    if (!description) {
      return {
        action: 'CHAT',
        intent: 'Need task description',
        parameters: {},
        response: 'To create a task, please provide a description. For example: "Create task: Follow up with John Doe tomorrow"',
        needsConfirmation: false,
        missingFields: ['description']
      };
    }

    const parameters = {
      description
    };

    // Try to extract due date
    if (originalMessage.match(/tomorrow/i)) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      parameters.due_date = tomorrow.toISOString().split('T')[0];
    }

    return {
      action: 'CREATE_TASK',
      intent: 'Create task',
      parameters,
      response: `I'll create a task: "${description}"`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle list my tasks request
   */
  handleListMyTasks(message, originalMessage) {
    const parameters = {};

    if (originalMessage.match(/overdue/i)) {
      parameters.overdue = true;
    }
    if (originalMessage.match(/completed|done/i)) {
      parameters.status = 'completed';
    }
    if (originalMessage.match(/pending|todo/i)) {
      parameters.status = 'pending';
    }

    return {
      action: 'LIST_MY_TASKS',
      intent: 'List my tasks',
      parameters,
      response: parameters.overdue ? 'Here are your overdue tasks:' : 'Here are your tasks:',
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle update task request
   */
  handleUpdateTask(message, originalMessage) {
    // Try to extract task ID
    let taskId = '';
    const taskIdMatch = originalMessage.match(/#?(\d+)/);
    if (taskIdMatch) {
      taskId = taskIdMatch[1];
    }

    if (!taskId) {
      return {
        action: 'CHAT',
        intent: 'Need task ID',
        parameters: {},
        response: 'To update a task, please provide the task ID. For example: "Mark task #5 as done"',
        needsConfirmation: false,
        missingFields: ['task_id']
      };
    }

    return {
      action: 'UPDATE_TASK',
      intent: 'Complete task',
      parameters: {
        task_id: taskId,
        status: 'completed'
      },
      response: `I'll mark task #${taskId} as completed.`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle log activity request
   */
  handleLogActivity(message, originalMessage) {
    const name = this.extractName(originalMessage);
    const email = this.extractEmail(originalMessage);

    let searchQuery = '';
    if (email) {
      searchQuery = email;
    } else if (name) {
      searchQuery = `${name.first_name} ${name.last_name}`.trim();
    }

    let activityType = 'call';
    if (originalMessage.match(/email/i)) {
      activityType = 'email';
    } else if (originalMessage.match(/meeting/i)) {
      activityType = 'meeting';
    } else if (originalMessage.match(/call|phone/i)) {
      activityType = 'call';
    }

    // Extract description - content after "discussed", "about", or the activity type
    let description = '';
    const descPattern = /(?:discussed|about|regarding|re:|subject:)\s+(.+?)(?:\s*$)/i;
    const descMatch = originalMessage.match(descPattern);
    if (descMatch) {
      description = descMatch[1].trim();
    }

    if (!searchQuery) {
      return {
        action: 'CHAT',
        intent: 'Need lead identifier',
        parameters: {},
        response: `To log a ${activityType}, please provide a lead name or email. For example: "Log call with john@example.com, discussed pricing"`,
        needsConfirmation: false,
        missingFields: ['lead_name']
      };
    }

    return {
      action: 'LOG_ACTIVITY',
      intent: 'Log activity',
      parameters: email ? { lead_name: email, activity_type: activityType, description } : { lead_name: searchQuery, activity_type: activityType, description },
      response: `I'll log a ${activityType} with ${searchQuery}${description ? ` about "${description}"` : ''}.`,
      needsConfirmation: true,
      missingFields: []
    };
  }

  /**
   * Handle team stats request
   */
  handleTeamStats(message, originalMessage) {
    // Try to extract team member name
    const name = this.extractName(originalMessage);

    let userName = '';
    if (name) {
      userName = `${name.first_name} ${name.last_name}`.trim();
    }

    if (!userName) {
      return {
        action: 'CHAT',
        intent: 'Need team member name',
        parameters: {},
        response: 'To see team stats, please provide a team member name. For example: "Show Sarah\'s stats this month"',
        needsConfirmation: false,
        missingFields: ['user_name']
      };
    }

    const parameters = {
      user_name: userName
    };

    // Extract period if available
    if (originalMessage.match(/this month/i)) {
      parameters.period = 'this_month';
    } else if (originalMessage.match(/this week/i)) {
      parameters.period = 'this_week';
    } else if (originalMessage.match(/last month/i)) {
      parameters.period = 'last_month';
    }

    return {
      action: 'GET_TEAM_STATS',
      intent: 'Get team stats',
      parameters,
      response: `Let me get ${userName}'s performance metrics.`,
      needsConfirmation: false,
      missingFields: []
    };
  }

  /**
   * Handle my stats request
   */
  handleMyStats(message, originalMessage) {
    const parameters = {};

    // Extract period if available
    if (originalMessage.match(/this month/i)) {
      parameters.period = 'this_month';
    } else if (originalMessage.match(/this week/i)) {
      parameters.period = 'this_week';
    } else if (originalMessage.match(/last month/i)) {
      parameters.period = 'last_month';
    } else if (originalMessage.match(/today/i)) {
      parameters.period = 'today';
    }

    return {
      action: 'GET_MY_STATS',
      intent: 'Get my stats',
      parameters,
      response: 'Let me pull your performance metrics.',
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
      response: 'Hello! I\'m your CRM assistant. I can help you:\n\n• Create leads: "Create a lead named John Doe, email john@example.com"\n• Show leads: "Show me all active leads"\n• Search: "Find john@example.com"\n• Update: "Update john@example.com status to qualified"\n• Delete: "Delete john@example.com"\n• Add notes: "Add note to john@example.com: Called today"\n• Assign: "Assign john@example.com to Sarah"\n• Move stage: "Move john@example.com to proposal"\n• Check duplicates: "Check for duplicate john@example.com"\n• Export: "Export all qualified leads to CSV"\n• Statistics: "Show me lead statistics"\n\nWhat would you like to do?',
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