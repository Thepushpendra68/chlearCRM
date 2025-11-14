# WhatsApp Integration Troubleshooting Guide

## Current Issue: 401 Unauthorized Error

### Error Analysis
The error message shows:
```
Error validating access token: Session has expired...
current time is Thursday, 13-Nov-25 21:33:48 PST
```

This indicates the JWT token expired and refresh failed.

---

## Step-by-Step Diagnosis

### ✅ Step 1: Environment Configuration (VERIFIED)

**Backend (.env):**
- ✅ SUPABASE_URL: Configured
- ✅ SUPABASE_ANON_KEY: Configured
- ✅ SUPABASE_SERVICE_KEY: Configured
- ✅ SUPABASE_JWT_SECRET: Configured
- ✅ PORT: 5000

**Frontend (.env):**
- ✅ VITE_API_URL: http://localhost:5000/api
- ✅ VITE_SUPABASE_URL: Configured
- ✅ VITE_SUPABASE_ANON_KEY: Configured

### ⚠️ Step 2: Session Expiration Issue

**Root Cause:**
The token expired and the refresh token is also expired or invalid.

**Why This Happens:**
1. User was inactive for too long
2. Refresh token expired (Supabase default: 7 days)
3. Session was manually invalidated
4. Browser storage was cleared

### 🔧 Step 3: Solution

**Immediate Fix:**
1. Log out completely
2. Clear browser storage (F12 > Application > Storage > Clear site data)
3. Log in again
4. Test WhatsApp feature

**Long-term Prevention:**
The code now includes:
- Proactive token refresh (5 minutes before expiration)
- Better error handling
- Automatic session renewal during active use

---

## Testing Steps

### Test 1: Verify Backend is Running
```powershell
# Check if backend is running on port 5000
netstat -ano | Select-String ":5000"

# Or test with curl
curl http://localhost:5000/api/auth/health
```

### Test 2: Verify Frontend is Running
```powershell
# Check if frontend is running on port 3000
netstat -ano | Select-String ":3000"
```

### Test 3: Test Authentication
1. Open browser console (F12)
2. Navigate to WhatsApp page
3. Run: `window.runAuthDiagnostics()`
4. Check the output for:
   - Session status
   - Token expiration
   - Refresh token availability

### Test 4: Test API Connection
```javascript
// In browser console
fetch('http://localhost:5000/api/dashboard/badge-counts', {
  headers: {
    'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`
  }
}).then(r => r.json()).then(console.log)
```

---

## Common Issues and Solutions

### Issue 1: "Session expired" on every request
**Cause:** Refresh token is expired or invalid
**Solution:**
1. Clear browser storage
2. Log out and log in again
3. Check Supabase dashboard for user session

### Issue 2: "No refresh token available"
**Cause:** Session was not properly initialized
**Solution:**
1. Hard refresh browser (Ctrl + Shift + R)
2. Clear cache and cookies
3. Log in again

### Issue 3: Backend returns 401 immediately
**Cause:** JWT secret mismatch or token format issue
**Solution:**
1. Verify SUPABASE_JWT_SECRET matches Supabase dashboard
2. Check token format in browser console
3. Verify backend is using correct JWT secret

### Issue 4: WhatsApp settings not configured
**Cause:** Meta WhatsApp credentials not set up
**Solution:**
1. Go to WhatsApp Settings (gear icon)
2. Enter Meta credentials:
   - Access Token
   - Phone Number ID
   - Business Account ID (optional)
   - App Secret (optional)
3. Save settings

---

## Debugging Commands

### Check Session in Browser Console
```javascript
// Get current session
const session = await supabase.auth.getSession()
console.log('Session:', session)

// Check expiration
if (session.data.session) {
  const expiresAt = session.data.session.expires_at
  const expiresIn = expiresAt * 1000 - Date.now()
  console.log('Expires in:', Math.round(expiresIn / 1000), 'seconds')
}

// Run diagnostics
window.runAuthDiagnostics()
```

### Check Backend Logs
```powershell
# If running with npm run dev
# Check terminal for authentication logs:
# - "Authenticating token:"
# - "Authentication successful for user:"
# - "Token verification failed"
```

---

## WhatsApp-Specific Configuration

### Database Setup
Run the migration:
```sql
-- Check if tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'whatsapp%';

-- Should return:
-- whatsapp_messages
-- whatsapp_templates
-- whatsapp_conversations
-- whatsapp_sequences
-- whatsapp_sequence_enrollments
```

### Meta WhatsApp API Configuration
Required from Meta:
1. **Access Token**: Get from Meta Business Suite
2. **Phone Number ID**: From WhatsApp Business API
3. **Business Account ID**: From Meta Business Manager
4. **App Secret**: For webhook verification (optional)

### Test WhatsApp Setup Script
```bash
cd backend
node scripts/setupWhatsApp.js
```

---

## Next Steps

1. **Clear browser storage and log in again**
2. **Run auth diagnostics**: `window.runAuthDiagnostics()`
3. **Check backend logs** for authentication errors
4. **Configure WhatsApp settings** if not done
5. **Test with a simple message** after logging in

---

## Expected Behavior After Fix

1. Token refreshes automatically before expiration
2. No 401 errors during active use
3. Clear error messages if session expires
4. Automatic redirect to login when needed

---

## Contact Support

If issues persist after following this guide:
1. Share browser console logs
2. Share backend terminal logs
3. Share output of `window.runAuthDiagnostics()`
4. Describe exact steps to reproduce

