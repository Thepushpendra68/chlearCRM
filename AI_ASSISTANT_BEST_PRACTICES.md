# AI Assistant Best Practices Guide
## Expanding from 27 to 135+ Actions

**Context**: Your CRM has 107 discoverable actions. This guide ensures you add them correctly.

---

## 🎯 Core Principles

### 1. **Pattern Specificity**
**Rule**: Specific patterns BEFORE generic patterns

**Why**: Prevents misrouting

**Example**:
```javascript
// ❌ WRONG - Generic pattern first
if (this.matchesPattern(message, ['log', 'call'])) {
  return this.handleUpdateLead(message);
}
if (this.matchesPattern(message, ['log', 'activity'])) {
  return this.handleLogActivity(message);
}

// ✅ CORRECT - Specific pattern first
if (this.matchesPattern(message, ['log', 'activity', 'call', 'email'])) {
  return this.handleLogActivity(message);
}
if (this.matchesPattern(message, ['update', 'lead']) &&
    !this.matchesPattern(message, ['activity', 'call', 'email'])) {
  return this.handleUpdateLead(message);
}
```

### 2. **Exclusion Patterns**
**Rule**: Use negative matching to prevent conflicts

**Example**:
```javascript
// Don't match activity logs as lead updates
if (this.matchesPattern(message, ['update', 'lead']) &&
    !this.matchesPattern(message, ['stage', 'pipeline', 'call', 'email', 'meeting', 'activity'])) {
  return this.handleUpdateLead(message);
}
```

### 3. **Confirmation Strategy**
**Rule**: Confirm ALL destructive operations

**Actions that need confirmation**:
- ✅ CREATE_LEAD
- ✅ UPDATE_LEAD
- ✅ DELETE_LEAD
- ✅ ASSIGN_LEAD
- ✅ BULK_ASSIGN_LEADS
- ✅ CREATE_TASK
- ✅ SEND_EMAIL
- ✅ CREATE_SEQUENCE

**Actions that DON'T need confirmation**:
- ✅ LIST_LEADS
- ✅ GET_LEAD
- ✅ SEARCH_LEADS
- ✅ GET_STATS
- ✅ LIST_TASKS

### 4. **Parameter Extraction Priority**
**Rule**: Extract in order of reliability

**Priority Order**:
1. **Explicit IDs**: `task #123` → `task_id: 123`
2. **Email addresses**: `john@example.com` → `email: "john@example.com"`
3. **Exact names**: `named John Doe` → `first_name: "John", last_name: "Doe"`
4. **Fuzzy search**: Any capitalized words → `search: "John Doe"`
5. **Status keywords**: `qualified`, `active`, etc. → `status: "qualified"`
6. **Dates**: `last week`, `tomorrow` → `date_from`, `date_to`

---

## 📝 Implementation Standards

### Service Method Template
```javascript
async ${methodName}(parameters, currentUser) {
  // 1. Validation
  if (!parameters && this.requiresParameters('${actionName}')) {
    throw new ApiError('Parameters required', 400);
  }

  // 2. Extract user context
  const userId = currentUser.id;
  const companyId = currentUser.company_id;

  // 3. Call controller/service
  const controller = require('../controllers/${module}Controller');
  
  // 4. Prepare request object
  const req = { 
    query: parameters, 
    user: currentUser 
  };
  const res = { 
    json: (data) => data 
  };
  const next = (error) => { 
    throw error; 
  };

  try {
    // 5. Execute
    const result = await controller.${methodName}(req, res, next);
    
    // 6. Normalize response
    return { 
      result, 
      action: '${methodName}' 
    };
  } catch (error) {
    console.error('${actionName} error:', error);
    throw error;
  }
}
```

### Fallback Handler Template
```javascript
handle${camelCaseName}(message, originalMessage) {
  const parameters = {};
  
  // Extract primary identifier (most reliable)
  const email = this.extractEmail(message);
  const name = this.extractName(message);
  
  // Extract secondary parameters
  const status = this.extractStatus(message);
  const priority = this.extractPriority(message);
  
  // Populate parameters
  if (email) parameters.email = email;
  if (name) parameters.name = name;
  if (status) parameters.status = status;
  if (priority) parameters.priority = priority;

  // Validate
  const missingFields = [];
  ${generateValidationLogic}

  return {
    action: '${actionName}',
    intent: '${generateIntent}',
    parameters,
    response: '${generateResponse}',
    needsConfirmation: ${needsConfirmation},
    missingFields
  };
}
```

### Pattern Matching Template
```javascript
// Primary patterns (most specific)
if (this.matchesPattern(message, ${JSON.stringify(primaryKeywords)})) {
  return this.handle${camelCaseName}(message, originalMessage);
}

// Secondary patterns (backup)
if (this.matchesPattern(message, ${JSON.stringify(secondaryKeywords)})) {
  return this.handle${camelCaseName}(message, originalMessage);
}
```

---

## 🔧 Parameter Extraction Utilities

### Email Extraction
```javascript
extractEmail(message) {
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  const match = message.match(emailRegex);
  return match ? match[0] : null;
}
```

### Name Extraction
```javascript
extractName(message) {
  // Pattern: "named John Doe"
  const namedPattern = /(?:named|name is|called)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i;
  const namedMatch = message.match(namedPattern);
  
  if (namedMatch) {
    const fullName = namedMatch[1].trim();
    const parts = fullName.split(' ');
    return {
      first_name: parts[0] || '',
      last_name: parts.slice(1).join(' ') || ''
    };
  }
  
  // Pattern: Capitalized words
  const capitalizedWords = message.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g);
  if (capitalizedWords && capitalizedWords.length >= 2) {
    return {
      first_name: capitalizedWords[0],
      last_name: capitalizedWords.slice(1).join(' ')
    };
  }
  
  return null;
}
```

### Status Extraction
```javascript
extractStatus(message) {
  const statuses = {
    'new': ['new'],
    'active': ['active'],
    'inactive': ['inactive'],
    'contacted': ['contacted'],
    'qualified': ['qualified'],
    'proposal': ['proposal'],
    'negotiation': ['negotiation', 'negotiating'],
    'won': ['won', 'closed won'],
    'lost': ['lost', 'closed lost']
  };
  
  for (const [status, keywords] of Object.entries(statuses)) {
    if (keywords.some(keyword => message.includes(keyword))) {
      return status;
    }
  }
  
  return null;
}
```

### Date Extraction
```javascript
extractDateFrom(message) {
  // "from last week"
  if (message.match(/from\s+last\s+week/i)) {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  }
  
  // "since yesterday"
  if (message.match(/since\s+yesterday/i)) {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().split('T')[0];
  }
  
  return null;
}

extractDateTo(message) {
  // "to today"
  if (message.match(/to\s+today|until\s+today/i)) {
    const date = new Date();
    return date.toISOString().split('T')[0];
  }
  
  return null;
}
```

### Activity Type Extraction
```javascript
extractActivityType(message) {
  if (message.match(/call|phone/i)) return 'call';
  if (message.match(/email/i)) return 'email';
  if (message.match(/meeting/i)) return 'meeting';
  if (message.match(/note/i)) return 'note';
  return 'call'; // default
}
```

---

## 🧪 Testing Standards

### Test Each Action With:

1. **Happy Path**
```
"Show my activities"
"Create a task to call John tomorrow"
"Assign lead to Sarah"
```

2. **Edge Cases**
```
"Show my activities from last year"
"Create task"
"Assign lead"
```

3. **Pattern Conflicts**
```
"Log call with John" → Should go to LOG_ACTIVITY, not UPDATE_LEAD
"Update task" → Should go to UPDATE_TASK, not UPDATE_LEAD
```

4. **Missing Parameters**
```
"Create task" → Should ask for description
"Assign lead" → Should ask for lead and assignee
```

5. **Both AI Modes**
```
- Test with Gemini (source: "gemini")
- Test with fallback (source: "fallback")
```

### Testing Checklist
- [ ] Action routes correctly
- [ ] Parameters extracted accurately
- [ ] Confirmation appears when needed
- [ ] Error messages are helpful
- [ ] Works in both Gemini and fallback modes
- [ ] No pattern conflicts
- [ ] Performance acceptable (<2s for Gemini, <500ms for fallback)

---

## 🐛 Common Issues & Solutions

### Issue 1: Pattern Overlap
**Symptom**: "Log call" triggers UPDATE_LEAD instead of LOG_ACTIVITY

**Solution**: Move LOG_ACTIVITY pattern before UPDATE_LEAD, add exclusions

```javascript
// In parseMessage(), put this BEFORE update patterns:
if (this.matchesPattern(message, ['log', 'call', 'email', 'meeting']) ||
    (this.matchesPattern(message, ['call', 'email', 'meeting']) && 
     this.matchesPattern(message, ['with', 'about', 'discussed']))) {
  return this.handleLogActivity(message, originalMessage);
}
```

### Issue 2: Wrong Entity Extraction
**Symptom**: Extracts wrong email from "Email John and Sarah about meeting"

**Solution**: Be more specific in extraction

```javascript
extractEmail(message) {
  // Only extract if it's a standalone email or after "email"
  const emailPattern = /(?:email\s+)?([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/g;
  const matches = message.match(emailPattern);
  if (matches && matches.length === 1) {
    return matches[0].replace(/^email\s+/i, '');
  }
  return null;
}
```

### Issue 3: Missing Confirmation
**Symptom**: Destructive actions execute without asking

**Solution**: Set needsConfirmation correctly

```javascript
// For destructive actions:
needsConfirmation: true

// For viewing actions:
needsConfirmation: false
```

### Issue 4: Poor Gemini Responses
**Symptom**: Gemini returns invalid JSON or wrong action

**Solution**: Improve system prompt

```javascript
// Add more examples to getSystemPrompt():
User: "Show my activities"
Response:
{
  "action": "GET_ACTIVITIES",
  "intent": "List user activities",
  "parameters": {},
  "response": "Here are your recent activities:",
  "needsConfirmation": false
}
```

### Issue 5: Fallback Pattern Fails
**Symptom**: Fallback returns "Unclear intent" for simple requests

**Solution**: Add more pattern variations

```javascript
// Instead of:
if (message.includes('show activities'))

// Use:
if (this.matchesPattern(message, ['show', 'my', 'activities']) ||
    this.matchesPattern(message, ['list', 'activities']) ||
    this.matchesPattern(message, ['activity', 'timeline']) ||
    message.includes('show activities'))
```

---

## 📊 Performance Optimization

### 1. Cache Frequently Used Data
```javascript
// Cache pipeline stages
this.pipelineStages = null;

async getPipelineStages() {
  if (!this.pipelineStages) {
    this.pipelineStages = await pipelineService.getAllStages();
  }
  return this.pipelineStages;
}
```

### 2. Batch Similar Operations
```javascript
// Instead of N individual queries
for (const lead of leads) {
  await service.getLead(lead.id);
}

// Use batch query
await service.getLeadsBatch(leads.map(l => l.id));
```

### 3. Limit Response Size
```javascript
// For list operations, limit results
const limit = parameters.limit || 50;
if (limit > 100) {
  parameters.limit = 100; // Cap at 100
}
```

### 4. Async Processing for Heavy Operations
```javascript
// For long-running operations, use queue
if (operationRequiresLongTime) {
  const jobId = await queue.add(operation, parameters);
  return { jobId, status: 'processing' };
}
```

---

## 🔒 Security Best Practices

### 1. Validate All Inputs
```javascript
async ${methodName}(parameters, currentUser) {
  // Validate required fields
  if (!parameters.email && !parameters.lead_id) {
    throw new ApiError('Email or lead ID required', 400);
  }
  
  // Validate email format
  if (parameters.email && !validator.isEmail(parameters.email)) {
    throw new ApiError('Invalid email format', 400);
  }
  
  // Validate user permissions
  if (requiresAdmin && !['admin', 'super_admin'].includes(currentUser.role)) {
    throw new ApiError('Insufficient permissions', 403);
  }
}
```

### 2. Sanitize Outputs
```javascript
return {
  result: {
    // Only return safe fields
    id: result.id,
    name: result.name,
    email: result.email
    // Don't expose sensitive fields
  }
};
```

### 3. Rate Limiting
```javascript
// Built into Express routes, but also validate in service
if (this.getRequestCount(userId) > 100) {
  throw new ApiError('Rate limit exceeded', 429);
}
```

---

## 📚 Documentation Standards

### For Each Action, Document:

1. **Purpose**
   - What it does
   - Why it exists

2. **Parameters**
   - Required fields
   - Optional fields
   - Field types
   - Examples

3. **Confirmation**
   - Whether it needs confirmation
   - Why/why not

4. **Examples**
   - At least 3 example queries
   - Cover happy path and edge cases

5. **Response Format**
   - What data is returned
   - Structure of response

### Documentation Template
```markdown
### ACTION_NAME

**Purpose**: Brief description of what this action does

**Parameters**:
- `email` (string, required): Email address of lead
- `status` (string, optional): Lead status
- `priority` (string, optional): Priority level

**Confirmation**: Yes/No - Why

**Example Queries**:
- "Example 1"
- "Example 2"
- "Example 3"

**Response**:
```json
{
  "action": "ACTION_NAME",
  "intent": "...",
  "parameters": { ... },
  "response": "...",
  "data": { ... }
}
```
```

---

## 🚀 Quality Gates

### Before Marking Action as Complete:

- [ ] Service method implemented
- [ ] Fallback handler implemented
- [ ] Pattern matcher added
- [ ] Added to VALID_ACTIONS
- [ ] System prompt updated
- [ ] Tested with Gemini
- [ ] Tested with fallback
- [ ] No pattern conflicts
- [ ] Confirmation works correctly
- [ ] Error handling works
- [ ] Parameters extracted correctly
- [ ] Documentation updated
- [ ] Added to progress tracker
- [ ] Code reviewed

---

## 💡 Tips & Tricks

### 1. Use Extract Helpers
Don't manually parse messages - use existing helpers:
- `extractEmail()`
- `extractName()`
- `extractCompany()`
- `extractStatus()`
- `extractDateFrom()`
- `extractDateTo()`

### 2. Group Actions by Module
Add 5-10 actions from the same module together for efficiency

### 3. Test Pattern Order
After adding patterns, test with similar queries:
```
"Show activities" → Should match
"Log call" → Should match LOG_ACTIVITY
"Update lead" → Should match UPDATE_LEAD
"Update task" → Should match UPDATE_TASK
```

### 4. Use Progressive Disclosure
Start with basic patterns, add more variations over time

### 5. Monitor Fallback Usage
Check logs to see if patterns are working:
```
console.log('[FALLBACK] Using pattern for:', action);
```

### 6. Validate Responses
Ensure all actions return consistent response format:
```javascript
return {
  success: true,
  data: result,
  action: actionName,
  message: 'Description of what happened'
};
```

### 7. Log Intent Recognition
Help debug Gemini responses:
```javascript
console.log(`[CHATBOT] Gemini identified action: ${action} (confidence: ${confidence})`);
```

### 8. Use Constants
Centralize action names:
```javascript
const Actions = {
  GET_ACTIVITIES: 'GET_ACTIVITIES',
  CREATE_ACTIVITY: 'CREATE_ACTIVITY',
  // ...
};
```

---

## 📈 Success Metrics

### Technical Metrics
- Pattern match accuracy: >95%
- Intent recognition: >90%
- Response time: <2s (Gemini), <500ms (fallback)
- Error rate: <1%

### Business Metrics
- User adoption: Track % of operations done via AI
- Task completion time: Should decrease by 50%
- User satisfaction: >4/5 rating

---

## 🎓 Developer Onboarding Checklist

### For New Developers:

- [ ] Read AI_ASSISTANT_COMPREHENSIVE_EXPANSION_PLAN.md
- [ ] Read this best practices guide
- [ ] Review existing 27 actions in chatbotService.js
- [ ] Understand dual-mode operation (Gemini + fallback)
- [ ] Run scanner: `node scripts/scan-controllers-v2.js`
- [ ] Generate code: `node scripts/generate-action-code.js GET_ACTIVITIES activity`
- [ ] Add first action following templates
- [ ] Test thoroughly
- [ ] Update progress tracker
- [ ] Document the action
- [ ] Get code review

**Time to First Action**: ~2 hours

---

## 📞 Getting Help

### Resources
- Documentation: See `/docs` folder
- Code examples: Review existing 27 actions
- Scanner output: `chatbot-expansion/ALL_ACTIONS.md`
- Progress tracker: `chatbot-expansion/PROGRESS.md`

### Debugging
1. Check pattern matching order
2. Verify VALID_ACTIONS includes the action
3. Check system prompt for examples
4. Test with both Gemini and fallback
5. Review logs for errors

### Questions
- Review existing patterns in chatbotFallback.js
- Check controller implementation
- Verify parameter extraction
- Ask team members

---

## ✅ Final Checklist

Before deploying new actions:

- [ ] Code follows templates
- [ ] Patterns are specific and ordered correctly
- [ ] Confirmation logic is correct
- [ ] Parameter extraction works
- [ ] Both Gemini and fallback tested
- [ ] No pattern conflicts
- [ ] Documentation complete
- [ ] Progress tracker updated
- [ ] Tests passing
- [ ] Code reviewed
- [ ] Security checks passed
- [ ] Performance acceptable

---

**Remember**: Adding actions is iterative. Start with high-value, simple actions. Add complexity gradually. Test everything. Document as you go.

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Production Ready
