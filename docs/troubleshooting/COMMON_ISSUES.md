# Common Issues & Troubleshooting Guide

## 🔄 Server & Route Issues

### Issue: 404 "Route not found" Error

**Symptoms:**
- Getting "Resource not found" or "Route not found" when accessing API endpoints
- Frontend shows network error (404)

**Common Causes:**
1. **Server not restarted** - Most common! Changes to route files require server restart
2. **Route not registered** - Route exists but not loaded in app.js or api/index.js
3. **Database table missing** - Route works but query fails

**Quick Fix - Follow These Steps:**

#### Step 1: Kill ALL Node Processes
```powershell
taskkill /F /IM node.exe
```
**Important:** Wait 5 seconds after running this.

#### Step 2: Verify Port is Free
```powershell
netstat -ano | findstr :5000
```
Should return NOTHING. If you see output, run Step 1 again.

#### Step 3: Restart Server
```bash
cd backend
npm run dev
```

#### Step 4: Verify Route Registration
Watch for these logs in console:
```
📦 [ACCOUNT ROUTES] Loading account routes module...
✅ [ACCOUNT ROUTES] Router created successfully
✅ [APP] Account routes loaded successfully: true
🔗 [APP] Registering /api/accounts routes...
✅ [APP] /api/accounts routes registered
🚀 Server running on port 5000
```

**If you DON'T see these logs**, the route wasn't loaded properly.

---

### Issue: Still Getting 404 After Restart

**Diagnostic Steps:**

#### 1. Test Route Directly
```bash
curl http://localhost:5000/api/accounts
```

**Expected Results:**
- ✅ `401 Unauthorized` = Route exists! (just needs auth)
- ✅ `200 OK` = Perfect! Route works.
- ❌ `404 Not Found` = Route not loaded (server needs full restart)

#### 2. Add Debug Route (Temporary)
Add this to `backend/src/app.js` BEFORE the 404 handler:
```javascript
app.get('/debug/routes', (req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push({
        path: middleware.route.path,
        methods: Object.keys(middleware.route.methods)
      });
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          routes.push({
            path: handler.route.path,
            methods: Object.keys(handler.route.methods)
          });
        }
      });
    }
  });
  res.json({ routes });
});
```

Then visit: `http://localhost:5000/debug/routes`
Look for `/api/accounts` in the list.

#### 3. Check Route Registration
```bash
cd backend
node -e "const routes = require('./src/routes/accountRoutes'); console.log(typeof routes);"
```

#### 4. Verify Environment Variables
Check `backend/.env` has:
```env
SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
JWT_SECRET=your_secret
PORT=5000
NODE_ENV=development
```

---

### Issue: "Port 5000 already in use"

**Solution:**
```powershell
# Find the process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or kill all node processes
taskkill /F /IM node.exe
```

---

### Issue: Multiple Node Processes Running

```powershell
# List all node processes
Get-Process -Name node | Format-Table Id, StartTime

# Kill specific process by ID
taskkill /F /PID <process_id>

# Or kill all
taskkill /F /IM node.exe
```

---

## 🗄️ Database Issues

### Issue: "relation does not exist" Error

**Symptoms:**
- Error: `{"success":false,"error":"relation \"accounts\" does not exist"}`
- Or: `"Resource not found"`

**Root Cause:**
Database table doesn't exist - migrations not run in Supabase

**Solution:**

#### Step 1: Open Supabase SQL Editor
1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Click "New Query"

#### Step 2: Run Database Migrations
Run these SQL files IN ORDER:
1. `migrations/20250101_create_accounts_table.sql`
2. `migrations/20250102_add_account_id_to_leads.sql`
3. `migrations/20250103_add_account_id_to_activities.sql`
4. `migrations/20250104_add_account_id_to_tasks.sql`

#### Step 3: Verify Tables Exist
```sql
-- Check if accounts table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'accounts'
);

-- If true, check columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'accounts'
ORDER BY ordinal_position;
```

#### Quick Verification Script
Run this in Supabase SQL Editor:
```sql
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'accounts') THEN
        RAISE NOTICE '✅ accounts table exists';
    ELSE
        RAISE NOTICE '❌ accounts table MISSING - Run migration 20250101_create_accounts_table.sql';
    END IF;
END $$;
```

---

### Issue: RLS Policy Errors

**Symptom:** Data returns empty or access denied

**Solution:**
```sql
-- Check if RLS policies exist
SELECT * FROM pg_policies WHERE tablename = 'accounts';

-- Should show 4 policies: SELECT, INSERT, UPDATE, DELETE
```

---

## 🔐 Authentication Issues

### Issue: 401 "Unauthorized"

**This is GOOD!**
401 means the route exists and is working - you just need to authenticate.

**Solution:**
1. Make sure you're logged in to the frontend
2. Check that your auth token is valid
3. The route requires authentication

**Test with Auth Token:**
```bash
curl http://localhost:5000/api/accounts \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### Issue: 403 "Forbidden"

**Symptom:** Authenticated but getting 403

**Cause:** Role-based access control - your user role doesn't have permission

**Solution:**
- Check your user role (super_admin, admin, manager, sales_rep)
- Certain routes require higher privileges (e.g., company_admin, super_admin)

---

## 🌐 Network & Request Issues

### Issue: Getting Network Error in Browser

**Diagnostic Steps:**

#### Step 1: Open Browser DevTools
- Press F12 (or Right-click → Inspect)
- Click on "Network" tab
- Refresh the page

#### Step 2: Find the Failed Request
- Look for `/api/accounts?page=1&limit=20` in Network tab
- Click on it

#### Step 3: Share These Details:
- **Request URL** (e.g., `http://localhost:5000/api/accounts?page=1&limit=20`)
- **Status Code** (404, 500, 401, 403, etc.)
- **Response Headers** (copy all)
- **Response Body** (copy exact text/JSON)
- **Request Headers** (especially Authorization)

#### Status Code Meanings:
- **404** = Route not registered (server problem)
- **500** = Database table missing or server error
- **401** = Not authenticated (login problem)
- **403** = No permission (role problem)

---

## 🔧 Development Workflow Issues

### Issue: Changes Not Taking Effect

**Problem:** Made code changes but server still uses old code

**Solution:** Node.js doesn't auto-reload routes. You MUST restart the server:
```powershell
taskkill /F /IM node.exe
# Wait 5 seconds
cd backend
npm run dev
```

---

### Issue: Build Tools in Wrong Dependencies

**For Vercel Deployment:**
Build tools (vite, postcss, tailwindcss) MUST be in `dependencies`, NOT `devDependencies`.

**Check `frontend/package.json`:**
```json
{
  "dependencies": {
    "vite": "^5.x.x",
    "postcss": "^8.x.x",
    "tailwindcss": "^3.x.x"
  }
}
```

**Fix if needed:**
```bash
cd frontend
npm install vite postcss tailwindcss --save
```

---

## 📊 Environment Setup Issues

### Missing Environment Variables

**Frontend (.env):**
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
```

**Backend (.env):**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
JWT_SECRET=your_jwt_secret
PORT=5000
NODE_ENV=development
```

---

## 🧪 Testing Issues

### Issue: Tests Failing

**Backend Tests:**
```bash
cd backend
npm test
```

**Frontend Tests:**
```bash
cd frontend
npm test
```

**Common Fix:**
```bash
# Backend
cd backend
rm -rf node_modules package-lock.json
npm install

# Frontend
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## 🚀 Nuclear Option - Clean Restart

If nothing works:

```powershell
# 1. Kill all node processes
taskkill /F /IM node.exe

# 2. Clean install backend
cd backend
rm -rf node_modules package-lock.json
npm install

# 3. Clean install frontend
cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 4. Restart backend
cd ../backend
npm run dev

# 5. In new terminal, restart frontend
cd ../frontend
npm run dev
```

---

## 📞 Getting Help

When asking for help, please provide:

1. **Complete error message** (exact text)
2. **Status code** from Network tab
3. **Server startup logs** (from when you run `npm run dev`)
4. **Which step you're on** from this guide
5. **Environment** (Windows/macOS/Linux? Node version?)

### Example:
```
Status Code: 404 Not Found
Response Body: {"success":false,"error":{"message":"Route not found","path":"/api/accounts"}}
Request URL: http://localhost:5000/api/accounts?page=1&limit=20

Server logs show:
✅ [APP] Account routes loaded successfully: true
✅ [APP] /api/accounts routes registered
```

---

## 📚 Related Documentation

- **Database Setup**: See `/docs/troubleshooting/DATABASE_SETUP.md`
- **Feature Roadmap**: See `/docs/features/CRM_ROADMAP.md`
- **Contact Management**: See `/docs/features/CONTACT_MANAGEMENT.md`
- **Full Documentation**: See `README.md`

---

**Last Updated**: November 2025
**Version**: 1.0
