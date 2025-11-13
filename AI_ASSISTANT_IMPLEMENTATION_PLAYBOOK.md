# AI Assistant Implementation Playbook
## Turn 108 Controller Methods into AI Actions

**Current Status**: 27 actions implemented | **Found**: 108 actions | **Gap**: 81 actions  
**Goal**: Add all 108 actions to the AI assistant for complete CRM coverage

---

## 🎯 Executive Summary

Your CRM has **108 business methods** across 12 controllers that can be exposed through the AI assistant. This playbook provides a **step-by-step system** to add all of them systematically.

### What This Means
```
Current State (27 actions):
  ✅ "Show me all leads"
  ✅ "Create a lead"
  ✅ "Update lead status"
  ❌ "Show my activity timeline"     ← Need to add
  ❌ "Create a task"                  ← Need to add (partial)
  ❌ "Send email to lead"             ← Need to add
  ❌ "Get pipeline conversion rates"  ← Need to add

Future State (135 actions):
  ✅ "Show my activity timeline"
  ✅ "Create a task for tomorrow"
  ✅ "Send welcome email to John"
  ✅ "Get pipeline conversion rates by stage"
  ✅ "Assign all unassigned website leads to Sarah"
  ✅ "Create email sequence for qualified leads"
  ✅ "Auto-assign leads based on rules"
```

---

## 📊 Discovered Actions Breakdown

| Controller | Methods | Priority | Estimated Effort | Current AI Coverage |
|------------|---------|----------|------------------|-------------------|
| **Activity** | 15 | P0 | 3 days | 1/15 (7%) |
| **Assignment** | 18 | P0 | 3 days | 2/18 (11%) |
| **Auth** | 6 | P2 | 1 day | 0/6 (0%) |
| **Automation** | 9 | P1 | 2 days | 0/9 (0%) |
| **EmailSend** | 7 | P1 | 2 days | 0/7 (0%) |
| **EmailTemplate** | 12 | P1 | 2 days | 0/12 (0%) |
| **EmailWebhook** | 4 | P2 | 1 day | 0/4 (0%) |
| **Import** | 9 | P1 | 2 days | 1/9 (11%) |
| **LeadCapture** | 1 | P2 | 0.5 day | 0/1 (0%) |
| **Pipeline** | 10 | P0 | 2 days | 0/10 (0%) |
| **Task** | 10 | P0 | 2 days | 3/10 (30%) |
| **WorkflowTemplate** | 10 | P1 | 2 days | 0/10 (0%) |
| **TOTAL** | **108** | | **22 days** | **27/135 (20%)** |

---

## 🚀 Quick Start: Adding Your First 10 Actions

### Step 1: Choose a Module
Pick **P0 Priority** module (Activity, Assignment, Pipeline, or Task)

### Step 2: Generate Scaffold
```bash
# Run the scanner (already done)
node scripts/scan-controllers-v2.js

# Review discovered actions
cat chatbot-expansion/ALL_ACTIONS.md
```

### Step 3: Pick 5-10 Actions
Start with these high-value ones:

#### From Activity Module:
```javascript
1. GET_ACTIVITIES       → "Show my activities"
2. CREATE_ACTIVITY      → "Log an activity"
3. GET_ACTIVITY_STATS   → "Show activity statistics"
4. COMPLETE_ACTIVITY    → "Mark activity as complete"
5. GET_TEAM_TIMELINE    → "Show team timeline"
```

#### From Task Module:
```javascript
6. CREATE_TASK          → "Create a task"
7. GET_OVERDUE_TASKS    → "Show overdue tasks"
8. GET_TASK_STATS       → "Show task statistics"
```

### Step 4: Add to ChatbotService.js

**Template** for each action:
```javascript
// 1. ADD TO executeAction() switch statement
case 'GET_ACTIVITIES':
  return await this.getActivities(parameters, currentUser);

case 'CREATE_ACTIVITY':
  return await this.createActivity(parameters, currentUser);

// 2. ADD NEW METHOD at end of class
async getActivities(parameters, currentUser) {
  const activityService = require('./activityService');
  const result = await activityService.getActivities(parameters);
  return { activities: result.data, count: result.totalItems };
}

async createActivity(parameters, currentUser) {
  const activityService = require('./activityService');
  const result = await activityService.createActivity(parameters, currentUser);
  return { activity: result.data, action: 'created' };
}
```

### Step 5: Add to ChatbotFallback.js

**Template** for each action:
```javascript
// 1. ADD PATTERN MATCHER (in parseMessage method)
if (this.matchesPattern(message, ['show', 'my', 'activities']) ||
    this.matchesPattern(message, ['list', 'activities'])) {
  return this.handleGetActivities(message, originalMessage);
}

if (this.matchesPattern(message, ['log', 'activity', 'call', 'email', 'meeting']) ||
    this.matchesPattern(message, ['create', 'activity'])) {
  return this.handleCreateActivity(message, originalMessage);
}

// 2. ADD HANDLER METHOD
handleGetActivities(message, originalMessage) {
  const userId = originalMessage.user_id; // Will be passed by service

  return {
    action: 'GET_ACTIVITIES',
    intent: 'List user activities',
    parameters: { user_id: userId },
    response: 'Here are your recent activities:',
    needsConfirmation: false,
    missingFields: []
  };
}

handleCreateActivity(message, originalMessage) {
  const email = this.extractEmail(originalMessage);
  const activityType = this.extractActivityType(originalMessage);
  const description = this.extractDescription(originalMessage);

  return {
    action: 'CREATE_ACTIVITY',
    intent: 'Create activity',
    parameters: { email, activity_type: activityType, description },
    response: `I'll create an activity${email ? ` for ${email}` : ''}.`,
    needsConfirmation: true,
    missingFields: email ? [] : ['email']
  };
}

// 3. ADD VALID_ACTIONS constant
const VALID_ACTIONS = new Set([
  // ... existing actions
  'GET_ACTIVITIES',
  'CREATE_ACTIVITY',
  // ...
]);
```

### Step 6: Update System Prompt

**In chatbotService.js getSystemPrompt() method:**
```javascript
/** Available Actions (add new ones) */
1. CREATE_LEAD - Create a new lead with details
2. UPDATE_LEAD - Update an existing lead
...
27. GET_ACTIVITIES - List user activities with filters
28. CREATE_ACTIVITY - Log a call, email, or meeting
...
```

### Step 7: Test

**Via Chat UI:**
```
User: "Show my activities"
Expected: Lists activities
Source: gemini or fallback

User: "Log a call with John Doe about pricing"
Expected: Creates activity, asks for confirmation
Source: gemini or fallback
```

**Via API:**
```bash
curl -X POST http://localhost:5000/api/chatbot/message \
  -H "Authorization: Bearer TOKEN" \
  -d '{"message": "Show my activities"}'
```

---

## 📋 Batch Implementation Process

### Day 1-2: Activity Module (15 actions)
**Priority Order:**
1. ✅ GET_ACTIVITIES - Most used
2. ✅ CREATE_ACTIVITY - Most used
3. ✅ GET_ACTIVITY_STATS - High value
4. ✅ GET_TEAM_TIMELINE - High value
5. ✅ COMPLETE_ACTIVITY - Common
6. ✅ GET_USER_ACTIVITIES - Useful
7. ✅ GET_LEAD_ACTIVITIES - Useful
8. ✅ UPDATE_ACTIVITY - Common
9. ✅ GET_ACTIVITY_BY_ID - Utility
10. ✅ DELETE_ACTIVITY - Destructive
11. ✅ CREATE_BULK_ACTIVITIES - Power feature
12. ✅ GET_LEAD_TIMELINE - Utility
13. ✅ GET_ACTIVITY_TRENDS - Analytics
14. ✅ GET_LEAD_TIMELINE_SUMMARY - Utility
15. ✅ GET_USER_TIMELINE - Utility

**Estimated Time:** 3 days (2 actions/hour)

### Day 3-4: Assignment Module (18 actions)
**Priority Order:**
1. ✅ ASSIGN_LEAD - Core feature (already exists)
2. ✅ BULK_ASSIGN_LEADS - Core feature (already exists)
3. ✅ GET_TEAM_WORKLOAD - High value
4. ✅ AUTO_ASSIGN_LEAD - Automation
5. ✅ CREATE_ASSIGNMENT_RULE - Configuration
6. ✅ GET_ASSIGNMENT_RECOMMENDATIONS - AI assist
7. ✅ REDISTRIBUTE_LEADS - Power feature
8. ✅ REASSIGN_LEAD - Common
9. ✅ GET_ASSIGNMENT_STATS - Analytics
10. ✅ GET_ASSIGNMENT_HISTORY - Tracking
11. ✅ GET_ACTIVE_RULES - Utility
12. ✅ CREATE_RULE - Common
13. ✅ UPDATE_RULE - Common
14. ✅ GET_RULE_BY_ID - Utility
15. ✅ DELETE_RULE - Destructive
16. ✅ GET_ROUTING_STATS - Analytics
17. ✅ PROCESS_BULK_AUTO_ASSIGN - Power feature
18. ✅ GET_LEAD_ASSIGNMENT_HISTORY - Tracking

**Estimated Time:** 3 days

### Day 5: Pipeline Module (10 actions)
**Priority Order:**
1. ✅ GET_STAGES - Essential
2. ✅ MOVE_LEAD_TO_STAGE - Core (already exists)
3. ✅ GET_PIPELINE_OVERVIEW - High value
4. ✅ GET_CONVERSION_RATES - Analytics
5. ✅ CREATE_STAGE - Configuration
6. ✅ UPDATE_STAGE - Configuration
7. ✅ DELETE_STAGE - Destructive
8. ✅ REORDER_STAGES - Configuration
9. ✅ CREATE_DEFAULT_STAGES - Utility

**Estimated Time:** 2 days

### Day 6: Task Module (10 actions)
**Priority Order:**
1. ✅ CREATE_TASK - Core (already exists)
2. ✅ GET_TASKS - Core (already exists)
3. ✅ GET_OVERDUE_TASKS - High value
4. ✅ COMPLETE_TASK - Common (already exists)
5. ✅ GET_TASK_STATS - Analytics
6. ✅ UPDATE_TASK - Common
7. ✅ GET_TASK_BY_ID - Utility
8. ✅ DELETE_TASK - Destructive
9. ✅ GET_TASKS_BY_LEAD_ID - Utility
10. ✅ GET_TASK_BY_ID - Already listed

**Estimated Time:** 2 days

### Week 2: Email System (32 actions)
**EmailSend (7 actions):**
- SEND_TO_LEAD
- SEND_TO_EMAIL
- GET_SENT_EMAILS
- GET_EMAIL_DETAILS
- GET_SUPPRESSION_LIST
- ADD_TO_SUPPRESSION_LIST
- REMOVE_FROM_SUPPRESSION_LIST

**EmailTemplate (12 actions):**
- GET_TEMPLATES
- GET_TEMPLATE_BY_ID
- CREATE_TEMPLATE
- UPDATE_TEMPLATE
- DELETE_TEMPLATE
- CREATE_VERSION
- PUBLISH_VERSION
- COMPILE_MJML
- PREVIEW_TEMPLATE
- GET_FOLDERS
- GET_INTEGRATION_SETTINGS
- UPSERT_INTEGRATION_SETTINGS

**Automation (9 actions):**
- GET_SEQUENCES
- GET_SEQUENCE_BY_ID
- CREATE_SEQUENCE
- UPDATE_SEQUENCE
- DELETE_SEQUENCE
- ENROLL_LEAD
- UNENROLL_LEAD
- GET_ENROLLMENTS
- PROCESS_DUE_ENROLLMENTS

**WorkflowTemplate (10 actions):**
- GET_TEMPLATES
- GET_TEMPLATE_BY_ID
- CREATE_TEMPLATE
- CREATE_SEQUENCE_FROM_TEMPLATE
- UPDATE_TEMPLATE
- DELETE_TEMPLATE
- EXPORT_TEMPLATE
- IMPORT_TEMPLATE
- GET_TEMPLATE_PACKS
- GET_PACK_BY_ID

**Estimated Time:** 4 days

### Week 3: Import/Export & Other (13 actions)
**Import (9 actions):**
- IMPORT_LEADS (expand existing)
- DRY_RUN_LEADS
- GET_IMPORT_HISTORY
- VALIDATE_IMPORT_FILE
- CONVERT_TO_CSV
- CONVERT_TO_EXCEL
- GET_SUGGESTED_MAPPINGS
- GET_UPLOAD_MIDDLEWARE

**LeadCapture (1 action):**
- CREATE_CAPTURE_FORM

**EmailWebhook (4 actions):**
- HANDLE_POSTMARK_WEBHOOK
- HANDLE_SENDGRID_WEBHOOK
- TEST_WEBHOOK

**Estimated Time:** 2 days

### Week 4: Testing & Polish
- Test all 108 actions
- Fix bugs
- Update documentation
- Performance optimization

---

## 🛠️ Automated Helper Tools

### Tool 1: Batch Action Adder
**File:** `scripts/add-batch-actions.js`

```javascript
// Usage: node scripts/add-batch-actions.js activity 5
// Adds 5 actions from activity module

const module = process.argv[2]; // e.g., 'activity'
const count = parseInt(process.argv[3]) || 5;

// Generates:
- Service methods (ready to copy)
- Fallback handlers (ready to copy)
- Pattern matchers (ready to copy)
- Test cases (ready to copy)
```

### Tool 2: Pattern Matcher Validator
**File:** `scripts/validate-patterns.js`

```javascript
// Tests all patterns for conflicts
// Ensures no overlapping patterns
// Validates entity extraction
```

### Tool 3: Coverage Reporter
**File:** `scripts/report-coverage.js`

```javascript
// Generates report showing:
// - Actions implemented: X/108
// - Coverage by module: X%
// - Missing actions list
// - Next steps
```

---

## 📝 Step-by-Step: Adding One Action

### Example: GET_ACTIVITY_STATS

#### 1. Service Method (chatbotService.js)
```javascript
// Add to executeAction():
case 'GET_ACTIVITY_STATS':
  return await this.getActivityStats(parameters, currentUser);

// Add method:
async getActivityStats(parameters, currentUser) {
  const activityService = require('./activityService');
  const result = await activityService.getActivityStats(parameters, currentUser);
  return { stats: result };
}
```

#### 2. Fallback Handler (chatbotFallback.js)
```javascript
// Add to parseMessage():
if (this.matchesPattern(message, ['activity', 'stats', 'statistics', 'report']) ||
    (this.matchesPattern(message, ['show']) && this.matchesPattern(message, ['activity']))) {
  return this.handleGetActivityStats(message, originalMessage);
}

// Add method:
handleGetActivityStats(message, originalMessage) {
  const period = this.extractPeriod(message);
  
  return {
    action: 'GET_ACTIVITY_STATS',
    intent: 'Get activity statistics',
    parameters: { period },
    response: 'Here are your activity statistics:',
    needsConfirmation: false,
    missingFields: []
  };
}

// Add to VALID_ACTIONS:
const VALID_ACTIONS = new Set([
  // ...
  'GET_ACTIVITY_STATS'
]);
```

#### 3. System Prompt (chatbotService.js)
```javascript
// In getSystemPrompt():
16. GET_ACTIVITY_STATS - Show activity statistics
```

#### 4. Test
```
User: "Show my activity statistics"
User: "Activity report for this month"
```

---

## ⚡ Speed Tips

### 1. Use Templates
Copy-paste the templates above instead of writing from scratch

### 2. Batch Process
Add 5-10 actions from the same module together

### 3. Test Early
Test each action immediately after adding

### 4. Document as You Go
Update CHATBOT_QUICK_REFERENCE.md with new actions

### 5. Use Patterns Wisely
- Put specific patterns BEFORE generic patterns
- Use exclusion patterns to prevent misrouting
- Test edge cases

---

## 🎯 Quality Checklist

For Each Action:

- [ ] Service method implemented
- [ ] Fallback handler implemented
- [ ] Pattern matcher added
- [ ] Action added to VALID_ACTIONS
- [ ] System prompt updated
- [ ] Tested with Gemini
- [ ] Tested with fallback
- [ ] Tested pattern matching
- [ ] Example query documented
- [ ] Edge cases tested

---

## 🐛 Common Pitfalls & Solutions

### Pitfall 1: Pattern Conflicts
**Problem:** "Log call" matches UPDATE_LEAD instead of LOG_ACTIVITY  
**Solution:** Put LOG_ACTIVITY pattern BEFORE UPDATE_LEAD pattern

### Pitfall 2: Missing Parameters
**Problem:** Action fails due to missing required fields  
**Solution:** Add validation and missingFields tracking

### Pitfall 3: Wrong Entity Extraction
**Problem:** Extracts wrong email/name from message  
**Solution:** Use extractEmail(), extractName(), extractCompany() helpers

### Pitfall 4: Missing Confirmation
**Problem:** Destructive actions don't ask for confirmation  
**Solution:** Set needsConfirmation=true for CREATE/UPDATE/DELETE

### Pitfall 5: Poor Intent Recognition
**Problem:** Gemini can't recognize the intent  
**Solution:** Add more examples to system prompt

---

## 📊 Progress Tracking

### Current Status
```
Total Actions Found: 108
Current AI Actions: 27
Gap: 81 actions

By Module:
✅ Activity: 15 (implementing first 10)
✅ Assignment: 18 (implementing first 10)
✅ Pipeline: 10
✅ Task: 10
✅ Email: 32
✅ Import: 9
✅ Other: 13

Target: Add all 108 actions
Timeline: 4 weeks
Velocity: ~25 actions/week
```

### Weekly Goals
- **Week 1**: 25 actions (Activity 15 + Assignment 10)
- **Week 2**: 25 actions (Assignment 8 + Pipeline 10 + Task 7)
- **Week 3**: 25 actions (Email system 25)
- **Week 4**: 33 actions (Email 7 + Import 9 + Other 13 + testing)

---

## 💡 Advanced Techniques

### 1. Multi-Step Actions
```javascript
// "Assign all unassigned leads to Sarah"
→ Step 1: Query unassigned leads
→ Step 2: Get Sarah's user ID
→ Step 3: Bulk assign
→ Step 4: Return results
```

### 2. Conditional Logic
```javascript
// "If lead score > 80, assign to senior rep"
→ Check score
→ If > 80: assign to senior
→ Else: assign to junior
```

### 3. Batch with Preview
```javascript
// "Update all new leads to contacted"
→ Show preview (first 5 leads)
→ Ask for confirmation
→ Execute on confirm
```

### 4. Entity Linking
```javascript
// "Send email to John"
→ Find John (could be lead or contact)
→ Get email address
→ Send email
```

### 5. Natural Language Parameters
```javascript
// "Show activities from last week"
→ Parse "last week" → date range
→ Query activities
→ Return results
```

---

## 🚀 Deployment Strategy

### Phase 1: Internal Testing (Week 1-2)
- Add 50 actions
- Test thoroughly
- Fix bugs
- Gather feedback

### Phase 2: Beta Release (Week 3)
- Add remaining 58 actions
- Deploy to staging
- QA testing
- User acceptance testing

### Phase 3: Production Release (Week 4)
- Deploy to production
- Monitor metrics
- Gather user feedback
- Iterate

---

## 📈 Success Metrics

### Coverage Metrics
- [ ] 108/108 actions implemented (100%)
- [ ] 100% pattern matching coverage
- [ ] <500ms response time (fallback)
- [ ] <3000ms response time (Gemini)

### Quality Metrics
- [ ] 95% intent recognition accuracy
- [ ] <1% action execution failures
- [ ] 90% user satisfaction

### Business Metrics
- [ ] 80% of CRM operations via AI
- [ ] 50% reduction in manual work
- [ ] 70% faster task completion

---

## 📚 Resources

### Documentation
- `AI_ASSISTANT_COMPREHENSIVE_EXPANSION_PLAN.md` - Full plan
- `chatbot-expansion/ALL_ACTIONS.md` - All 108 actions
- `docs/CHATBOT_SYSTEM_REVIEW.md` - Technical deep dive

### Scripts
- `scripts/scan-controllers-v2.js` - Controller scanner
- `scripts/add-batch-actions.js` - Batch adder (to create)
- `scripts/validate-patterns.js` - Pattern validator (to create)

### Code References
- `backend/src/services/chatbotService.js` - Main service
- `backend/src/services/chatbotFallback.js` - Pattern matching
- `frontend/src/components/Chatbot/ChatPanel.jsx` - UI

---

## ✅ Next Steps

1. **Review this playbook** (done)
2. **Pick first module** (Activity recommended)
3. **Run scanner** to confirm actions
4. **Add first 5 actions** using templates
5. **Test thoroughly**
6. **Repeat for remaining modules**
7. **Measure success**

---

## 🎓 Training Plan

### For Developers
1. Read this playbook (15 min)
2. Review existing 27 actions (30 min)
3. Add first action following guide (30 min)
4. Add batch of 5 actions (2 hours)
5. Test all actions (1 hour)
6. Document findings (30 min)

**Total Time to Proficiency: 4 hours**

### For QA
1. Read quick reference (10 min)
2. Test all new actions (2 hours)
3. Report bugs (ongoing)
4. Verify fixes (ongoing)

### For Product
1. Understand capabilities (30 min)
2. Plan user training (1 hour)
3. Create documentation (2 hours)
4. Gather user feedback (ongoing)

---

## 🎯 Final Goal

After implementing all 108 actions:

```
User: "Show me all overdue tasks assigned to my team, grouped by priority, and export to Excel"

AI: "I'll fetch 15 overdue tasks from your team, group them by priority (High: 3, Medium: 7, Low: 5), and export to Excel. Confirm?"

User: "Yes"

AI: "✅ Exported 15 tasks to team_overdue_tasks_2024-11-13.xlsx"
```

**The AI will be able to perform ANY operation in your CRM using natural language.**

---

**Document Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Ready for Implementation  
**Estimated Completion**: 4 weeks
