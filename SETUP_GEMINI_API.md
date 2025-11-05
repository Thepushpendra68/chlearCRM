# 🔑 How to Fix "Failed to generate sequence" Error

## Problem
The error occurs because the **Gemini API key is not configured**.

## Solution - 3 Simple Steps

### Step 1: Get Your Gemini API Key

1. Visit: **https://makersuite.google.com/app/apikey**
2. Sign in with your Google account
3. Click **"Create API Key"** button
4. Copy the generated API key

### Step 2: Add API Key to Backend

Open `backend/.env` file and add this line:

```env
GEMINI_API_KEY=your_actual_api_key_here
```

**Example:**
```env
# Database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_supabase_key

# JWT
JWT_SECRET=your_jwt_secret

# Add this line:
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**If .env file doesn't exist:**
```bash
# Create it from the root directory
cd backend
New-Item .env -ItemType File
```

Then add all required environment variables including GEMINI_API_KEY.

### Step 3: Restart Backend Server

**Stop the current backend server:**
- Press `Ctrl + C` in the terminal running backend

**Start it again:**
```bash
cd backend
npm run dev
```

You should see this message in the logs:
```
[EMAIL AI] AI service initialized successfully
```

---

## Verify It's Working

### Test 1: Check AI Status
Open browser console and run:
```javascript
fetch('http://localhost:5000/api/email/ai/status', {
  headers: {
    'Authorization': 'Bearer YOUR_JWT_TOKEN'
  }
}).then(r => r.json()).then(console.log)
```

Should return:
```json
{
  "success": true,
  "data": {
    "available": true,
    "features": [...]
  }
}
```

### Test 2: Try AI Sequence Again
1. Go to Email Sequences
2. Click "New Sequence"
3. Click "AI Generate" button
4. Enter a goal like: "Nurture webinar leads and schedule demos"
5. Click "Generate Sequence"

Should work now! ✅

---

## Common Issues

### Issue 1: Still Shows Error After Adding Key
**Solution:** Make sure you restarted the backend server after adding the key.

### Issue 2: Invalid API Key Error
**Solution:** 
- Double-check you copied the entire key
- Make sure there are no extra spaces
- Verify the key is active at https://makersuite.google.com/app/apikey

### Issue 3: "AI features not available" (503 error)
**Solution:** This means the key is missing or invalid. Follow steps 1-3 above.

---

## Need Help?

### Check Backend Logs
Look for these messages when backend starts:

✅ **Success:**
```
[EMAIL AI] AI service initialized successfully
```

❌ **Problem:**
```
[EMAIL AI] GEMINI_API_KEY not set - AI features disabled
```

### Test in Postman/Insomnia
```bash
POST http://localhost:5000/api/email/ai/generate-sequence
Headers:
  Content-Type: application/json
  Authorization: Bearer YOUR_JWT_TOKEN
Body:
{
  "goal": "Test sequence",
  "lead_type": "prospect",
  "sequence_length": 3
}
```

---

## Free Tier Information

Google Gemini API has a **generous free tier**:
- ✓ 60 requests per minute
- ✓ 1,500 requests per day
- ✓ Free to use for development

Perfect for testing and small-scale usage!

---

**After completing these steps, the AI sequence generation will work perfectly!** 🚀

