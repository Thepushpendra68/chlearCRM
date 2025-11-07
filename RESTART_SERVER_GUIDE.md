# How to Restart Backend Server to Load Account Routes

## Problem
The `/api/accounts` route returns 404 because the backend server was started **before** the account routes were added to the codebase.

## Solution: Restart the Backend Server

### Step 1: Stop the Current Server

**Option A: If running in terminal**
1. Find the terminal window where the backend server is running
2. Press `Ctrl + C` to stop the server
3. Wait for the server to stop completely

**Option B: If running as a background process**
```powershell
# Find the process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Step 2: Verify Server is Stopped
```powershell
# Check if port 5000 is free
netstat -ano | findstr :5000
# Should return nothing if server is stopped
```

### Step 3: Start the Server Again
```bash
cd backend
npm run dev
```

### Step 4: Verify Routes are Loaded

**Check server console output:**
- Should see: `🚀 Server running on port 5000`
- Should see: `📊 Environment: development`
- Should **NOT** see any errors about missing routes

**Test the route:**
```bash
# In a new terminal, run:
cd backend
node test-accounts-route.js
```

Expected output:
- ✅ Status Code: 401 (Unauthorized - this is GOOD, means route exists!)
- OR ✅ Status Code: 200 (if you have valid auth)

### Step 5: Test from Frontend

1. Open your browser
2. Navigate to `/app/accounts`
3. Check browser DevTools → Network tab
4. Should see `/api/accounts` returning 200 or 401 (not 404)

## Verification Checklist

- [ ] Backend server is stopped
- [ ] Backend server is restarted with `npm run dev`
- [ ] Server starts without errors
- [ ] Test script shows route exists (401 or 200, not 404)
- [ ] Frontend can access `/api/accounts`

## Common Issues

### Issue: "Port 5000 already in use"
**Solution:** 
```powershell
# Find and kill the process
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Issue: "Route still returns 404"
**Possible causes:**
1. Server wasn't actually restarted
2. Route file has syntax error (check server logs)
3. Route not registered in app.js (check line 213)

**Check:**
```bash
# Verify route file exists
ls backend/src/routes/accountRoutes.js

# Verify route is registered
grep "accountRoutes" backend/src/app.js
```

### Issue: "401 Unauthorized" (This is GOOD!)
**Solution:** This means the route exists! You just need to:
1. Make sure you're logged in to the frontend
2. Check that your auth token is valid
3. The route requires authentication, so 401 is expected without a token

## Quick Test Commands

```bash
# Test if route exists (should return 401, not 404)
curl http://localhost:5000/api/accounts

# Test with auth token (replace YOUR_TOKEN)
curl http://localhost:5000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Status

✅ Route file created: `backend/src/routes/accountRoutes.js`
✅ Route registered in: `backend/src/app.js` (line 213)
✅ Route ordering fixed (specific routes before generic)
⏳ **Server restart required** ← YOU ARE HERE

---

**Next Step**: Restart your backend server and test the route!

