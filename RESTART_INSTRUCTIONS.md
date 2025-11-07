# How to Restart and Verify (Choose One Method)

## Method 1: Automated Script (Recommended)

Run this PowerShell script:

```powershell
.\restart-and-verify.ps1
```

This will:
1. Kill all node processes
2. Verify port is free
3. Start backend in new window
4. Test the endpoint
5. Show you the results

## Method 2: Manual Steps

### Step 1: Kill All Node
```powershell
taskkill /F /IM node.exe
```

### Step 2: Wait 5 seconds
(Seriously, wait 5 seconds)

### Step 3: Start Backend
```powershell
cd backend
npm run dev
```

### Step 4: LOOK FOR THESE LOGS
You MUST see these exact lines:
```
📦 [ACCOUNT ROUTES] Loading account routes module...
✅ [ACCOUNT ROUTES] Router created successfully
✅ [APP] Account routes loaded successfully: true
🔗 [APP] Registering /api/accounts routes...
✅ [APP] /api/accounts routes registered
```

### Step 5: Test in Browser
Open new terminal:
```powershell
curl http://localhost:5000/api/accounts
```

Expected results:
- ❌ `404 Not Found` = Server didn't load routes (see Step 4 logs)
- ✅ `401 Unauthorized` = Routes working! (just needs auth)
- ✅ `200 OK` = Perfect!

## What to Share if Still 404

If you still get 404 after restart:

1. Screenshot of server console showing the startup logs
2. Tell me: Did you see the emoji logs (📦, ✅)?
3. Copy the first 20 lines of server output

## Why This Matters

Node.js doesn't auto-reload routes. When I added the account routes to your code:
- ✅ Files were updated with routes
- ❌ Your running server still has old code in memory
- ✅ Restart loads the new code

After restart with the emoji logs visible, the 404 will be gone.

