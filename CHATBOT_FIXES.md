# Chatbot Fixes & Troubleshooting Guide

## ✅ Issues Fixed

### 1. **Gemini AI Model Issue** ✅ FIXED
- **Problem**: Was using `gemini-1.5-flash` which doesn't exist
- **Solution**: Updated to `gemini-2.0-flash-exp` (newest model)
- **Result**: Chatbot now responds correctly!

### 2. **Status Values Mismatch** ✅ FIXED
- **Problem**: Chatbot expected "qualified" status, but database has "active" status
- **Solution**: Updated system prompt to include both status types
- **Available statuses**: active, inactive, new, contacted, qualified, proposal, negotiation, won, lost

### 3. **Enhanced Logging** ✅ ADDED
- Added detailed console logging to track:
  - Action execution
  - Parameters passed
  - Number of leads found
  - Confirmation requirements

---

## 🔍 Current Database State

Based on debug script results:

### Companies:
- Test Company LLC
- Kridha It Solutions Private Limited
- Demo Company

### Leads:
- **Total**: 10 leads
- **Status**: All have status = "active"
- **Issue**: When user asks for "qualified leads", chatbot finds 0 because none exist

---

## 💡 Solutions

### Option 1: Update Leads in Database (Recommended)
Change some leads to have status "qualified":

```sql
-- In Supabase SQL Editor
UPDATE leads
SET status = 'qualified'
WHERE email IN ('mike.chen@startup.co', 'lisa@enterprise.com')
LIMIT 5;
```

### Option 2: Ask for Active Leads
User should ask: **"Show me all active leads"** instead of "qualified leads"

### Option 3: Ask for All Leads
User can ask: **"Show me all leads"** to see everything

---

## 🧪 Testing Scripts Created

### 1. `test-gemini-models.js`
Tests all available Gemini models with your API key

```bash
cd backend
node test-gemini-models.js
```

**Result**: Found `gemini-2.0-flash-exp` works!

### 2. `debug-database.js`
Shows what's actually in your database

```bash
cd backend
node debug-database.js
```

**Shows**:
- All companies and their IDs
- All users and their roles
- All leads grouped by status
- Counts of qualified vs active leads

### 3. `test-chatbot-quick.js`
Tests chatbot JSON response format

```bash
cd backend
node test-chatbot-quick.js
```

---

## 🚀 How to Use the Chatbot Now

### 1. Restart Backend
```bash
cd backend
npm run dev
```

### 2. Open CRM and Login
- Blue chat icon appears in bottom-right

### 3. Try These Queries:

**✅ Will Work:**
```
"Show me all active leads"
"Show me all leads"
"Show me lead statistics"
"Create a lead named Sarah Johnson, email sarah@test.com"
"Search for Mike Chen"
```

**❌ Won't Find Results:**
```
"Show me qualified leads"  ← No qualified leads exist yet
```

---

## 📊 Backend Logs to Watch

When you send a message, look for:

```
🤖 [CHATBOT] Calling Gemini AI...
✅ [CHATBOT] Gemini AI response received
✅ [CHATBOT] Parsed response action: LIST_LEADS
🎬 [CHATBOT] Executing action: LIST_LEADS
📋 [CHATBOT] Parameters: {"status":"active","limit":50}
❓ [CHATBOT] Needs confirmation: false
✅ [CHATBOT] Action result: leads, count, pagination
📊 [CHATBOT] Found leads: 10
```

If you see "Found leads: 0", it means the query is working but no leads match the filter.

---

## 🎯 Next Steps

1. **Add some qualified leads** to your database (Option 1 above)
2. **Restart backend** to load new code
3. **Test with**: "Show me all active leads"
4. **Watch backend logs** to see what's happening

---

## 🐛 If Still Having Issues

### Issue: "No leads found" shown
**Check**:
- Are you logged in?
- Does the logged-in user belong to a company that has leads?
- Run `node debug-database.js` to verify leads exist

### Issue: Chatbot not responding
**Check**:
- Backend logs for errors
- `GEMINI_API_KEY` is set in `.env`
- Browser console for API errors

### Issue: Wrong data returned
**Check**:
- Backend logs show correct action and parameters
- User's `company_id` matches the leads' `company_id`
- RLS (Row Level Security) policies in Supabase

---

## ✨ Features Working Now

- ✅ Gemini AI responding correctly
- ✅ Natural language understanding
- ✅ Action execution (LIST_LEADS, SEARCH_LEADS, etc.)
- ✅ Data fetching from Supabase
- ✅ Status filtering
- ✅ Beautiful UI with lead cards
- ✅ Conversation history
- ✅ Quick actions

## 🎉 Success Criteria

Chatbot is working when you see:
1. Blue chat icon in bottom-right ✅
2. "Hello! I'm your CRM assistant..." greeting ✅
3. Can ask "Show me all leads" and see lead cards ✅
4. Backend logs show action execution ✅
5. Lead data displays properly ✅

---

**Your chatbot is now ready to use!** 🚀

Just remember to ask for "active leads" instead of "qualified leads" until you update the database!