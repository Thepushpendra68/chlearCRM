# 🚀 Backend Failed to Start - Quick Fix

## Problem
Backend server won't start due to missing environment variables.

## Required Configuration

Your `backend/.env` file needs these variables:

### 1. Database (Supabase) - REQUIRED
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.ey...
```

**How to get these:**
1. Go to your Supabase project: https://app.supabase.com
2. Click on your project
3. Go to Settings → API
4. Copy "Project URL" → SUPABASE_URL
5. Copy "service_role secret" → SUPABASE_SERVICE_KEY

### 2. Authentication (JWT) - REQUIRED
```env
JWT_SECRET=your_secure_random_string_minimum_32_characters
JWT_EXPIRES_IN=7d
```

**Generate JWT_SECRET:**
- Use any random string (32+ characters)
- Example: `MySecureJWTSecret2024ForCRM!@#$%^&*`
- Or generate: `openssl rand -base64 32` (in Git Bash)

### 3. AI Features - OPTIONAL (but needed for AI)
```env
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get:**
1. Visit: https://makersuite.google.com/app/apikey
2. Click "Create API Key"
3. Copy the key

### 4. Server Config - OPTIONAL
```env
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3001
```

---

## Complete backend/.env Template

Copy this into your `backend/.env` file:

```env
# Database Configuration (REQUIRED)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# JWT Configuration (REQUIRED)
JWT_SECRET=YourSecureRandomString32CharactersOrMore!
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3001

# AI Configuration (for AI features)
GEMINI_API_KEY=AIzaSyBxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Email Configuration (optional)
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
```

---

## Step-by-Step Fix

### Step 1: Configure Supabase
1. Open `backend/.env`
2. Replace `SUPABASE_URL` with your actual Supabase URL
3. Replace `SUPABASE_SERVICE_KEY` with your service role key
4. **This is the most important step!**

### Step 2: Add JWT Secret
```env
JWT_SECRET=MyVerySecureRandomStringForJWT2024!@#$%
```

### Step 3: Add Gemini API Key (for AI)
```env
GEMINI_API_KEY=AIzaSy...your_actual_key
```

### Step 4: Save the file

### Step 5: Start Backend
```bash
cd backend
npm run dev
```

### Step 6: Look for Success Messages
```
✅ Server running on port 5000
✅ [EMAIL AI] AI service initialized successfully
```

---

## Common Startup Errors

### Error: "Invalid Supabase credentials"
**Fix:** Check SUPABASE_URL and SUPABASE_SERVICE_KEY are correct

### Error: "JWT_SECRET is required"
**Fix:** Add JWT_SECRET to .env file

### Error: "Cannot connect to database"
**Fix:** 
- Check Supabase project is active
- Verify SUPABASE_URL format: `https://xxxxx.supabase.co`
- Check internet connection

### Error: "Port 5000 already in use"
**Fix:** 
```bash
# Find process using port 5000
netstat -ano | findstr :5000
# Kill the process (replace PID)
taskkill /PID <process_id> /F
```

---

## Verify Backend is Running

After starting, check:

1. **Port is listening:**
   ```powershell
   Get-NetTCPConnection -LocalPort 5000
   ```
   Should show: State = Listen

2. **Health check:**
   Open browser: `http://localhost:5000/health`
   Should show: Server is running

3. **No errors in console:**
   Backend console should show startup logs without errors

---

## Quick Test

Once backend starts, test these URLs:

- ✅ http://localhost:5000 → Should respond
- ✅ http://localhost:3001 → Frontend should load
- ✅ Frontend should connect to backend

---

## Still Not Working?

### Try These:

1. **Delete node_modules and reinstall:**
   ```bash
   cd backend
   rm -rf node_modules
   npm install
   npm run dev
   ```

2. **Check Node version:**
   ```bash
   node --version
   ```
   Should be v18 or higher

3. **Check for typos in .env:**
   - No spaces around `=`
   - No quotes around values
   - File named exactly `.env` (not `.env.txt`)

4. **View detailed errors:**
   Backend console will show the exact error
   Share that error message for specific help

---

## Need Your Supabase Credentials?

If you don't have a Supabase project:

1. Go to https://app.supabase.com
2. Create new project (free)
3. Wait for database setup (~2 minutes)
4. Get credentials from Settings → API
5. Run the SQL schema from `docs/` or migrations

---

**After configuring .env properly, backend should start successfully!** 🚀

