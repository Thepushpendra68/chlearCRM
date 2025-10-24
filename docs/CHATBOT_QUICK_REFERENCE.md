# Chatbot System - Quick Reference Guide

## Architecture at a Glance

```
User → ChatPanel (React) → chatbotService (API) → chatbotController
                                                        ↓
                                              chatbotService
                                                ↙         ↘
                                           Gemini AI    Fallback Patterns
                                                 ↓            ↓
                                            (parseResponse) (regex match)
                                                 ↘        ↙
                                            executeAction()
                                                   ↓
                                         leadService, taskService, etc.
```

---

## File Structure

```
backend/src/
├── routes/
│   └── chatbotRoutes.js         # 3 endpoints: message, confirm, history
├── controllers/
│   └── chatbotController.js     # HTTP handlers
├── services/
│   ├── chatbotService.js        # 2,075 lines - MAIN LOGIC
│   │   ├── Class: ChatbotService
│   │   ├── Constructor (init Gemini)
│   │   ├── processMessage() - main entry point
│   │   ├── executeAction() - action dispatcher (27 cases)
│   │   ├── 25 action handlers (createLead, updateLead, etc)
│   │   └── Helper methods (scoring, assignment, etc)
│   └── chatbotFallback.js       # 1,329 lines - PATTERN MATCHING
│       ├── Class: ChatbotFallback
│       ├── parseMessage() - pattern dispatcher
│       ├── 40+ pattern checkers
│       ├── Entity extraction (email, name, company, date)
│       └── 40+ handlers (handleCreateLead, handleLogActivity, etc)
└── utils/
    └── dateParser.js            # Date parsing utility

frontend/src/
├── components/Chatbot/
│   ├── ChatPanel.jsx            # Main chat UI component
│   ├── ChatMessage.jsx          # Individual message display
│   └── ChatInput.jsx            # Input field
└── services/
    └── chatbotService.js        # Frontend API wrapper
```

---

## Core Flow

### Message Processing

```javascript
// 1. Frontend sends message
POST /api/chatbot/message
{ message: "Create lead John Doe" }

// 2. Controller receives
chatbotController.processMessage(req, res)

// 3. Service processes
chatbotService.processMessage(userId, message, currentUser)
  - Add to history
  - Try Gemini AI
    - If success → parse response
    - If fail → use fallback pattern matching
  - Return response structure

// 4. Response sent to frontend
{
  success: true,
  response: "conversational text",
  action: "CREATE_LEAD",
  intent: "Create new lead",
  parameters: { first_name: "John", last_name: "Doe", ... },
  needsConfirmation: true,
  missingFields: ["email"],  // email required
  data: null,
  source: "gemini",
  model: "gemini-2.0-flash-exp"
}

// 5. Frontend displays confirmation panel if needsConfirmation=true
```

### Action Confirmation

```javascript
// 1. User clicks Confirm
POST /api/chatbot/confirm
{ action: "CREATE_LEAD", parameters: { first_name: "John", ... } }

// 2. Service executes action
chatbotService.confirmAction(userId, action, parameters, currentUser)
  → executeAction(action, parameters, currentUser, false)
  → Calls appropriate handler: createLead()

// 3. Results returned
{ data: { id: "lead-123", name: "John Doe", email: "john@..." }, ... }

// 4. Frontend shows success message
```

---

## The 27 Actions

| # | Action | Confirmation | Example |
|---|--------|--------------|---------|
| 1 | CREATE_LEAD | ✓ | "Create John Doe from Acme" |
| 2 | UPDATE_LEAD | ✓ | "Update John's status to qualified" |
| 3 | GET_LEAD | ✗ | "Get John's details" |
| 4 | SEARCH_LEADS | ✗ | "Find john@acme.com" |
| 5 | LIST_LEADS | ✗ | "Show all leads" / "Show qualified leads" |
| 6 | DELETE_LEAD | ✓ | "Delete john@acme.com" |
| 7 | DETECT_DUPLICATES | ✗ | "Find duplicates for john@acme.com" |
| 8 | EXPORT_LEADS | ✗ | "Export qualified leads to CSV" |
| 9 | SUGGEST_ASSIGNMENT | ✗ | "Who should I assign John to?" |
| 10 | LEAD_SCORING | ✗ | "Score all qualified leads" |
| 11 | CREATE_TASK | ✓ | "Create task: Follow up with John tomorrow" |
| 12 | LIST_MY_TASKS | ✗ | "Show my overdue tasks" |
| 13 | UPDATE_TASK | ✗ | "Mark task 5 as done" |
| 14 | LOG_ACTIVITY | ✓ | "Log call with John: discussed pricing" |
| 15 | GET_TEAM_STATS | ✗ | "Show Sarah's stats this month" |
| 16 | GET_MY_STATS | ✗ | "How am I doing?" |
| 17 | BULK_UPDATE_LEADS | ✓ | "Update all new leads to contacted" |
| 18 | BULK_ASSIGN_LEADS | ✓ | "Assign all unassigned website leads to Sarah" |
| 19 | GROUP_BY_ANALYSIS | ✗ | "Show leads grouped by source" |
| 20 | SCHEDULE_REPORT | ✓ | "Schedule daily report of new leads" |
| 21 | CREATE_REMINDER | ✓ | "Remind me to follow up in 3 days" |
| 22 | GET_STATS | ✗ | "Show statistics" |
| 23 | MOVE_LEAD_STAGE | ✓ | "Move John to proposal stage" |
| 24 | ASSIGN_LEAD | ✓ | "Assign John to Sarah" |
| 25 | UNASSIGN_LEAD | ✓ | "Unassign John" |
| 26 | ADD_LEAD_NOTE | ✗ | "Add note to John: very interested" |
| 27 | VIEW_LEAD_NOTES | ✗ | "Show notes for John" |

---

## Pattern Matching Priority

**CRITICAL**: Earlier patterns take precedence!

```
1. DETECT_DUPLICATES      if (duplicate)
2. EXPORT_LEADS          if (export, lead/csv/excel)
3. SUGGEST_ASSIGNMENT    if (suggest, not export/delete/update)
4. LEAD_SCORING          if (score, lead)
5. CREATE_TASK           if (create/new/add task, schedule)
6. LIST_MY_TASKS         if (show/list/my task) OR (task, overdue/pending/todo)
7. UPDATE_TASK           if (complete/finish task, mark done, done)
8. LOG_ACTIVITY          if (log/had a call/called/emailed/met) OR (call/email/meeting + with/contact) ← FIXED
9. TEAM_STATS            if (team, stats) OR (stats, name/member)
10. MY_STATS             if (my stats/how am I/my performance) AND NOT (team/member/name)
11. BULK_UPDATE          if (update/bulk/all) AND NOT (single/one/call/email/meeting/task/activity)
12. BULK_ASSIGN          if (bulk assign) OR (assign, all/multiple)
13. GROUP_BY_ANALYSIS    if (group/grouped/by) OR (count/how many, by)
14. SCHEDULE_REPORT      if (schedule/report) OR (daily/weekly/monthly, report)
15. CREATE_REMINDER      if (remind/reminder) OR (in/days/hours, remind)
16. DELETE_LEAD          if (delete/remove/drop)
17. ADD_NOTE             if (add note/note/add comment)
18. VIEW_NOTES           if (show note/view note/notes/history/activities, note/history/activity/activities)
19. MOVE_STAGE           if (move/stage/pipeline)
20. ASSIGN_LEAD          if (assign/assignee) AND NOT (bulk)
21. UNASSIGN_LEAD        if (unassign/remove assign)
22. LIST_LEADS           if (show/list/get/find/display)
23. CREATE_LEAD          if (create/add/new, lead)
24. UPDATE_LEAD          if (update/change/modify/edit) AND NOT (stage/pipeline/call/email/meeting/task/activity/log/remind)
25. SEARCH_LEAD          if (search/find/lookup, email or name)
26. STATS                if (stat/statistics/analytics/report/summary)
27. GREETING             if (help/hello/hi/hey/start)
28. UNCLEAR              default

**REMEMBER**: Exclusion guards prevent misrouting!
```

---

## Key Methods in chatbotService.js

| Method | Purpose | Location |
|--------|---------|----------|
| `constructor()` | Initialize Gemini AI, fallback setup | Line ~45 |
| `getSystemPrompt()` | Return system prompt for Gemini | Line ~100 |
| `getConversationHistory(userId)` | Get user's message history | Line ~460 |
| `addToHistory(userId, role, content)` | Add message to history | Line ~470 |
| `clearHistory(userId)` | Clear user's history | Line ~480 |
| `generateWithGemini(prompt)` | Call Gemini AI, try 4 models | Line ~600 |
| `parseGeminiResponse(text)` | Extract JSON from AI response | Line ~520 |
| `isValidResponse(response)` | Validate response structure | Line ~550 |
| `buildFallbackResponse(message)` | Route to pattern matching | Line ~500 |
| `processMessage(userId, message, currentUser)` | **MAIN ENTRY** - process message | Line ~672 |
| `confirmAction(userId, action, params, user)` | Execute confirmed action | Line ~1027 |
| `executeAction(action, params, user, needsConfirm)` | **DISPATCHER** - route to handlers | Line ~760 |
| `createLead()` | Create new lead | Line ~1050 |
| `updateLead()` | Update existing lead | Line ~1120 |
| `listLeads()` | List leads with filters | Line ~1200 |
| `searchLeads()` | Search by name/email | Line ~1270 |
| `deleteLeads()` | Delete lead | Line ~1320 |
| ... (20+ more handlers) | ... | ... |

---

## Key Methods in chatbotFallback.js

| Method | Purpose | Location |
|--------|---------|----------|
| `parseMessage(userMessage)` | **MAIN ENTRY** - route to pattern | Line ~13 |
| `matchesPattern(message, keywords)` | Check if keywords in message | Line ~176 |
| `extractEmail(message)` | Regex extract email | Line ~185 |
| `extractName(message)` | Extract "John Doe" from message | Line ~193 |
| `extractCompany(message)` | Extract "Acme Corp" from message | Line ~210 |
| `extractDate(message)` | Use DateParser utility | Line ~220 |
| `extractSource(message)` | Map lead source terms | Line ~230 |
| `handleCreateLead()` | Extract all lead fields | Line ~250 |
| `handleUpdateLead()` | Find lead, extract updates | Line ~320 |
| `handleListLeads()` | Extract status, source, date filters | Line ~400 |
| `handleLogActivity()` | Extract lead, type, description | Line ~550 |
| `handleBulkUpdate()` | Extract filter & new status | Line ~1100 |
| `handleBulkAssign()` | Extract filter & assignee | Line ~1140 |
| ... (30+ more handlers) | ... | ... |

---

## Environment Variables

```bash
# API Key
GEMINI_API_KEY=your_api_key_here

# Force fallback (skip Gemini)
CHATBOT_FALLBACK_ONLY=true  # or false (default)

# Custom model order
CHATBOT_GEMINI_MODELS=gemini-2.0-flash-exp,gemini-1.5-pro-latest
```

---

## Response Fields Explained

```javascript
{
  success: true,              // Always true (errors thrown instead)
  
  response: "I'll create...",  // Conversational reply to show user
  
  action: "CREATE_LEAD",       // Which action to execute
                               // or "CHAT" for conversation only
  
  intent: "Create new lead",   // Brief description of intent
  
  parameters: {                // Extracted data for action
    first_name: "John",
    email: "john@acme.com"
    // ... other fields
  },
  
  needsConfirmation: true,     // true = show confirmation panel
                               // false = execute immediately
  
  missingFields: ["phone"],    // Empty if all required fields present
                               // Frontend can show: "Missing: phone"
  
  data: null,                  // Results if action already executed
                               // Contains leads[], tasks[], stats, etc
  
  source: "gemini",            // "gemini" or "fallback"
  model: "gemini-2.0-flash-exp" // Which model/system processed it
}
```

---

## Adding a New Action (Checklist)

- [ ] Add to `VALID_ACTIONS` in chatbotService.js
- [ ] Add to system prompt with example
- [ ] Add execution case in `executeAction()` switch
- [ ] Implement handler method in chatbotService
- [ ] Add pattern check in chatbotFallback.parseMessage()
- [ ] Implement handler in chatbotFallback
- [ ] Update frontend ACTION_LABELS if needed
- [ ] Test with both Gemini and fallback
- [ ] Test with invalid inputs
- [ ] Commit with clear message

---

## Debugging Tips

### Check Which System Processed Request
```javascript
// Look at response.source and response.model
response.source === "gemini"   // AI processed it
response.source === "fallback"  // Pattern matching processed it

response.model === "gemini-2.0-flash-exp"  // Specific model
response.model === "fallback_pattern_matching"  // Pattern matched
```

### Enable Logging
```javascript
// chatbotService.js, processMessage():
console.log('[CHATBOT] Processing:', userMessage);
console.log('[CHATBOT] Action:', parsedResponse.action);
console.log('[CHATBOT] Parameters:', parsedResponse.parameters);

// chatbotFallback.js, parseMessage():
console.log('[FALLBACK] Matching patterns for:', message);
console.log('[FALLBACK] MATCHED: ACTION_NAME');
```

### Test Specific Pattern
```javascript
const fallback = new ChatbotFallback();
const result = fallback.parseMessage('test message here');
console.log('Action:', result.action);
console.log('Parameters:', result.parameters);
```

### Check Conversation History
```javascript
const service = new ChatbotService();
const history = service.getConversationHistory(userId);
console.log('History length:', history.length);
console.log('Messages:', history.map(h => h.content));
```

---

## Common Mistakes to Avoid

### ❌ Pattern Order Mistakes
```javascript
// WRONG: Generic before specific
if (matchesPattern(message, ['update'])) // Catches everything!
  return handleUpdateLead();

if (matchesPattern(message, ['update', 'task'])) // Never reaches here
  return handleUpdateTask();

// RIGHT: Specific before generic
if (matchesPattern(message, ['update', 'task']))
  return handleUpdateTask();

if (matchesPattern(message, ['update']) && !matchesPattern(message, ['task']))
  return handleUpdateLead();
```

### ❌ Missing Guards
```javascript
// WRONG: No exclusions
if (matchesPattern(message, ['activity']))
  return handleActivity();

// RIGHT: Exclude false positives
if (matchesPattern(message, ['activity', 'log', 'call']) &&
    !matchesPattern(message, ['update', 'edit']))
  return handleActivity();
```

### ❌ Wrong Confirmation Flag
```javascript
// WRONG: List operation requires confirmation
{ action: 'LIST_LEADS', needsConfirmation: true }

// RIGHT: Viewing doesn't need confirmation
{ action: 'LIST_LEADS', needsConfirmation: false }

// RIGHT: Destructive needs confirmation
{ action: 'DELETE_LEAD', needsConfirmation: true }
```

### ❌ Missing Entity Extraction
```javascript
// WRONG: No parameter extraction
{ action: 'CREATE_LEAD', parameters: {} }

// RIGHT: Extract what you found
{ action: 'CREATE_LEAD', parameters: { first_name: 'John', email: 'john@...' } }
```

### ❌ Throwing Errors in Handlers
```javascript
// WRONG: Throws, breaks flow
throw new Error('Invalid input');

// RIGHT: Return structured error
return {
  action: 'CHAT',
  response: 'I need more information. Please provide...',
  missingFields: ['email']
}
```

---

## Response Codes & Errors

### Success Response (200)
```javascript
{ success: true, data: {...} }
```

### Input Validation Error (400)
```javascript
{ success: false, error: "Message is required" }
```

### Authorization Error (401/403)
```javascript
{ success: false, error: "Not authenticated" }
```

### Server Error (500)
```javascript
{ success: false, error: "Internal server error" }
```

---

## Quick Testing Commands

```bash
# Test pattern matching
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Create lead John Doe"}'

# Test confirmation
curl -X POST http://localhost:5000/api/chatbot/confirm \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"action":"CREATE_LEAD","parameters":{"first_name":"John","last_name":"Doe","email":"john@example.com"}}'

# Clear history
curl -X DELETE http://localhost:5000/api/chatbot/history \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Performance Baseline

| Operation | Time | Notes |
|-----------|------|-------|
| Pattern match | <10ms | Very fast |
| Gemini response | 500-2000ms | Depends on model |
| Fallback (on error) | <50ms | Much faster |
| Database operation | 10-100ms | Depends on query |
| Full message processing | 500-2100ms | Gemini + DB |

---

## Monitoring Checklist

- [ ] Error rate < 1%
- [ ] Gemini API key still valid
- [ ] Conversation history not growing unbounded (max 10/user)
- [ ] Database connections healthy
- [ ] No memory leaks in chatbotService
- [ ] Response times < 3s average
- [ ] Action handlers completing successfully

---

**For detailed information, see: CHATBOT_SYSTEM_REVIEW.md**

**Last Updated**: December 2024  
**Status**: Production Ready
