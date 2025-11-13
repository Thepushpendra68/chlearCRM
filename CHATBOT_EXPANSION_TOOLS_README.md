# Chatbot Expansion Tools

This directory contains automated tools to expand the AI assistant from 27 to 135+ actions.

## 🛠️ Available Tools

### 1. Controller Scanner
**File**: `scripts/scan-controllers-v2.js`

**Purpose**: Scans all controllers and lists all discoverable actions

**Usage**:
```bash
node scripts/scan-controllers-v2.js
```

**Output**:
- Lists all 12 controllers
- Shows all 107 methods found
- Generates `chatbot-expansion/ALL_ACTIONS.md`

**Example Output**:
```
Found 12 controllers with methods:

📁 activity
   └── getActivities → _GET_ACTIVITIES
   └── createActivity → _CREATE_ACTIVITY
   ...

Total Actions Found: 107
```

---

### 2. Code Generator
**File**: `scripts/generate-action-code.js`

**Purpose**: Generates ready-to-use code templates for any action

**Usage**:
```bash
node scripts/generate-action-code.js <ACTION_NAME> <MODULE>

# Example:
node scripts/generate-action-code.js GET_ACTIVITIES activity
node scripts/generate-action-code.js CREATE_TASK task
node scripts/generate-action-code.js ASSIGN_LEAD assignment
```

**Output**: 
- Service method template (for chatbotService.js)
- Fallback handler template (for chatbotFallback.js)
- Test cases and examples

**Example**:
```bash
🔧 Generating code for: GET_ACTIVITIES (activity)

📝 SERVICE CODE (add to chatbotService.js):
case 'GET_ACTIVITIES':
  return await this.getActivities(parameters, currentUser);

async getActivities(parameters, currentUser) {
  // ... template code
}

📝 FALLBACK CODE (add to chatbotFallback.js):
// Pattern matcher + handler template

📝 TEST CASES:
// Example queries and expected responses
```

---

### 3. Progress Tracker
**File**: `scripts/track-progress.js`

**Purpose**: Tracks implementation progress and generates reports

**Usage**:
```bash
node scripts/track-progress.js
```

**Output**:
- Generates `chatbot-expansion/PROGRESS.md`
- Shows completion percentage by module
- Lists implemented vs remaining actions

**Example Report**:
```
📊 Progress Summary:
   Total Actions: 107
   Implemented: 27
   Remaining: 80
   Completion: 25.2%

Module Progress:
✅ Activity: 15 (implementing first 10)
✅ Assignment: 18 (implementing first 10)
✅ Pipeline: 10
✅ Task: 10
```

---

### 4. (Optional) Batch Action Adder
**File**: `scripts/add-batch-actions.js` (to be created)

**Purpose**: Adds multiple actions at once

**Usage**:
```bash
node scripts/add-batch-actions.js activity 5
```

**Output**: Ready-to-copy code for 5 actions from activity module

---

## 📂 Output Files

### chatbot-expansion/ALL_ACTIONS.md
Complete list of all 107 discovered actions
- Organized by module
- Shows controller and method name
- Ready to copy-paste into documentation

### chatbot-expansion/PROGRESS.md
Live progress report
- Completion percentage
- Implemented actions list
- Remaining actions list
- Next steps

---

## 🚀 Quick Start Workflow

### Step 1: Scan
```bash
node scripts/scan-controllers-v2.js
```
Review discovered actions in `chatbot-expansion/ALL_ACTIONS.md`

### Step 2: Pick Module
Choose high-value module (Activity, Assignment, Task, or Pipeline)

### Step 3: Generate Code
```bash
node scripts/generate-action-code.js GET_ACTIVITIES activity
```

### Step 4: Implement
Copy generated code to:
- `backend/src/services/chatbotService.js` (service method)
- `backend/src/services/chatbotFallback.js` (fallback handler)

### Step 5: Test
- Test via chat UI
- Test via API

### Step 6: Update Progress
```bash
node scripts/track-progress.js
```
Mark action as implemented in `scripts/track-progress.js`

---

## 📋 Implementation Checklist

For each action:

- [ ] Run code generator
- [ ] Copy service method to chatbotService.js
- [ ] Add to executeAction() switch
- [ ] Copy fallback handler to chatbotFallback.js
- [ ] Add pattern matcher in parseMessage()
- [ ] Add action to VALID_ACTIONS
- [ ] Update system prompt in getSystemPrompt()
- [ ] Test with Gemini
- [ ] Test with fallback
- [ ] Document in quick reference
- [ ] Update progress tracker

---

## 🎯 Common Use Cases

### Adding a Single Action
```bash
# 1. Generate code
node scripts/generate-action-code.js CREATE_TASK task

# 2. Copy templates to chatbotService.js and chatbotFallback.js

# 3. Update system prompt

# 4. Test

# 5. Mark as implemented
# Edit scripts/track-progress.js:
# IMPLEMENTED_ACTIONS.add('CREATE_TASK')
```

### Adding a Batch of Actions
```bash
# For each action:
node scripts/generate-action-code.js GET_ACTIVITIES activity
node scripts/generate-action-code.js CREATE_ACTIVITY activity
node scripts/generate-action-code.js GET_ACTIVITY_STATS activity
# ... etc

# Or use batch adder when available:
node scripts/add-batch-actions.js activity 15
```

### Checking Progress
```bash
# Generate fresh progress report
node scripts/track-progress.js

# Review progress
cat chatbot-expansion/PROGRESS.md
```

---

## 🔧 Customization

### Modifying Templates
Edit `scripts/generate-action-code.js` to customize:
- Service method template
- Fallback handler template
- Parameter extraction logic
- Validation rules
- Response format

### Adding New Helpers
Create utility functions in:
- `chatbotFallback.js` - Pattern matching helpers
- `chatbotService.js` - Business logic helpers

### Updating Action List
If controllers change, rerun scanner:
```bash
node scripts/scan-controllers-v2.js
```

---

## 📊 Metrics & Reporting

### Completion Percentage
Track overall progress:
```
node scripts/track-progress.js | grep "Completion"
# Output: Completion: 25.2%
```

### Actions per Module
See breakdown by module:
```bash
cat chatbot-expansion/PROGRESS.md | grep "Module Progress"
```

### Velocity Tracking
Track actions implemented per week:
- Week 1: X actions
- Week 2: Y actions
- etc.

---

## 🐛 Troubleshooting

### Scanner Finds 0 Actions
**Issue**: Regex not matching your controller style  
**Solution**: Update regex in `scan-controllers-v2.js`

### Code Generator Fails
**Issue**: Action name format unclear  
**Solution**: Use action name with underscores: `GET_ACTIVITIES`

### Pattern Conflicts
**Issue**: Multiple actions match same query  
**Solution**: Reorder patterns (specific before generic), use exclusions

### Missing Parameters
**Issue**: Action fails due to missing fields  
**Solution**: Improve parameter extraction in fallback handler

---

## 💡 Tips

1. **Start Small**: Begin with 5-10 actions from one module
2. **Follow Templates**: Copy-paste and customize
3. **Test Early**: Test each action after adding
4. **Document**: Update quick reference immediately
5. **Track Progress**: Update tracker after each action
6. **Code Review**: Have peer review patterns
7. **Use Helpers**: Leverage extractEmail(), extractName(), etc.
8. **Check Order**: Verify pattern ordering prevents conflicts

---

## 📚 Related Documents

- `AI_ASSISTANT_IMPLEMENTATION_PLAYBOOK.md` - Full implementation guide
- `AI_ASSISTANT_BEST_PRACTICES.md` - Quality standards
- `AI_ASSISTANT_COMPREHENSIVE_EXPANSION_PLAN.md` - Master plan
- `docs/CHATBOT_SYSTEM_REVIEW.md` - Technical deep dive

---

## ✅ Next Steps

1. Run scanner to confirm actions
2. Pick first module (recommend: Activity)
3. Generate code for first action
4. Implement following playbook
5. Test thoroughly
6. Add to progress tracker
7. Repeat for remaining actions

---

**Tools Version**: 1.0  
**Last Updated**: November 2024  
**Status**: Production Ready
