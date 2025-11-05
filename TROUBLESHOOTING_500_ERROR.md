# 🔧 Troubleshooting 500 Internal Server Error

## Error You're Seeing:
```
Failed to load resource: the server responded with a status of 500 (Internal Server Error)
Error generating sequence: AxiosError
```

---

## What This Means:
The backend is receiving your request but **failing to process it**. This is usually due to:
1. ❌ Missing or invalid Gemini API key
2. ❌ API key not properly formatted
3. ❌ Gemini API quota/rate limit exceeded
4. ❌ JSON parsing error from AI response
5. ❌ Network issues reaching Gemini servers

---

## 🔍 Step-by-Step Diagnosis

### Step 1: Check Backend Logs

**Restart your backend server** and watch for these messages:

#### ✅ **SUCCESS** - You'll see:
```
[EMAIL AI] 🔄 Initializing Gemini AI...
[EMAIL AI] ✅ AI service initialized successfully
[EMAIL AI] 📊 Using models: gemini-1.5-pro-latest, gemini-1.5-flash-latest
```
✅ If you see this, your API key is working! Continue to Step 2.

#### ❌ **PROBLEM 1** - API Key Not Configured:
```
[EMAIL AI] ⚠️  GEMINI_API_KEY not configured - AI features disabled
[EMAIL AI] 📝 To enable: Add GEMINI_API_KEY to backend/.env
[EMAIL AI] 🔑 Get key: https://makersuite.google.com/app/apikey
```
**FIX:** 
1. Get API key from: https://makersuite.google.com/app/apikey
2. Add to `backend/.env`: `GEMINI_API_KEY=AIzaSy...`
3. Restart backend

#### ❌ **PROBLEM 2** - Invalid API Key:
```
[EMAIL AI] ❌ Failed to initialize: Invalid API key
[EMAIL AI] 🔍 Check your GEMINI_API_KEY is valid
```
**FIX:**
1. Verify your API key at: https://makersuite.google.com/app/apikey
2. Copy the FULL key (starts with `AIzaSy`)
3. Ensure no extra spaces in `.env` file
4. Format: `GEMINI_API_KEY=AIzaSyBxxx...` (no quotes, no spaces)

---

### Step 2: Check .env File Format

Open `backend/.env` and verify:

```env
# ✅ CORRECT FORMAT:
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# ❌ WRONG - Has placeholder:
GEMINI_API_KEY=your_gemini_api_key_here

# ❌ WRONG - Has quotes:
GEMINI_API_KEY="AIzaSyBxxx"

# ❌ WRONG - Has spaces:
GEMINI_API_KEY = AIzaSyBxxx

# ❌ WRONG - Incomplete key:
GEMINI_API_KEY=AIzaSy
```

---

### Step 3: Test API Key Directly

**Test if your key works:**

1. Open: https://aistudio.google.com/app/apikey
2. Click on your API key
3. Check status: Should say "Active"
4. Check quota: Should have requests remaining

---

### Step 4: Check Detailed Error Logs

After restarting backend, try generating a sequence again. Look for these logs:

#### Detailed Error Information:
```
[EMAIL AI] Raw AI response: {... (shows what Gemini returned)
[EMAIL AI] Successfully parsed sequence with 5 steps
```
✅ If you see this, it's working!

#### Or Error Details:
```
[EMAIL AI] Sequence generation error: [error details]
[EMAIL AI] Error details: {
  message: "...",
  name: "...",
  code: "..."
}
```

**Common Error Messages:**

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "API key not valid" | Invalid key | Get new key from Google |
| "quota exceeded" | Used too many requests | Wait or upgrade plan |
| "Failed to parse AI response" | JSON parsing error | Already fixed - restart backend |
| "Network error" | Can't reach Gemini | Check internet connection |

---

## 🛠️ Complete Fix Checklist

### [ ] 1. Get Valid API Key
- Visit: https://makersuite.google.com/app/apikey
- Sign in with Google
- Click "Create API Key"
- Copy the full key (AIzaSy...)

### [ ] 2. Configure backend/.env
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```
(Replace with your actual key)

### [ ] 3. Verify .env File
- No quotes around the key
- No spaces before/after =
- Key is complete (starts with AIzaSy)
- File is named `.env` (not `.env.txt`)

### [ ] 4. Restart Backend
```bash
# Stop current backend (Ctrl+C)
cd backend
npm run dev
```

### [ ] 5. Check Logs
Look for:
```
✅ [EMAIL AI] AI service initialized successfully
```

### [ ] 6. Try Again
- Go to Email Sequences
- Click "AI Generate"
- Enter goal: "Test sequence"
- Should work now! 🎉

---

## 🆘 Still Not Working?

### Check These:

1. **Backend is running?**
   ```bash
   # Should see backend on port 5000
   netstat -ano | findstr ":5000"
   ```

2. **Frontend can reach backend?**
   - Open browser console
   - Network tab should show requests to `localhost:5000`

3. **CORS issues?**
   - Check backend/.env has: `FRONTEND_URL=http://localhost:3001`

4. **Node modules installed?**
   ```bash
   cd backend
   npm install @google/generative-ai
   ```

5. **Firewall blocking?**
   - Try accessing: http://localhost:5000/api/email/ai/status
   - Should get authentication error (401) not timeout

---

## 📊 API Key Limits (Free Tier)

Google Gemini API Free Tier:
- ✅ 60 requests per minute
- ✅ 1,500 requests per day
- ✅ Free forever for development

**If you hit limits:**
- Wait for rate limit to reset (1 minute)
- Or upgrade to paid tier (very cheap)

---

## 🔍 Debug Mode

Want to see detailed logs?

Add to `backend/.env`:
```env
DEBUG=*
LOG_LEVEL=debug
```

This will show:
- All API requests
- AI responses
- Parsing attempts
- Exact errors

---

## ✅ Expected Working Flow

1. User clicks "AI Generate"
2. Frontend sends request to backend
3. Backend logs: `[EMAIL AI] Generating sequence...`
4. Backend calls Gemini API
5. Backend logs: `[EMAIL AI] Raw AI response: {`
6. Backend parses JSON
7. Backend logs: `[EMAIL AI] Successfully parsed sequence with 5 steps`
8. Frontend receives data
9. Sequence appears in UI ✨

If it stops anywhere, the logs will show you where!

---

## 🎯 Quick Test

Run this to test your setup:

**PowerShell:**
```powershell
# Check if .env exists
Test-Path backend\.env

# Check if key is set (will show TRUE/FALSE)
(Get-Content backend\.env) -match "GEMINI_API_KEY=AIza"

# Check backend is running
(Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue).State
```

All should return positive results!

---

**After following these steps, the 500 error should be fixed!** 🚀

If you still have issues, share the exact error logs from the backend console and I can help further!

