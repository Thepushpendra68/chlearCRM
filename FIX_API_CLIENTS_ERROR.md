# 🔴 FIX: API Clients "Server Error" Issue

## Problem
The `api_clients` table does not exist in your Supabase database.

Error message:
```
"Could not find the table 'public.api_clients' in the schema cache"
```

## Solution: Create the Table in Supabase

### Step 1: Open Supabase Dashboard
1. Go to: **https://supabase.com/dashboard**
2. Login with your credentials
3. Select your project: **qlivxpsvlymxfnamxvhz.supabase.co**

### Step 2: Navigate to SQL Editor
1. Click **"SQL Editor"** in the left sidebar
2. Click the **"New query"** button (top right)

### Step 3: Copy the SQL Migration
1. Open the file: `D:\chlearcrm\run_this_in_supabase.sql`
2. Press `Ctrl+A` to select all content
3. Press `Ctrl+C` to copy

### Step 4: Paste and Run in Supabase
1. In the Supabase SQL Editor, press `Ctrl+V` to paste
2. Click the **"Run"** button (or press `F5`)
3. Wait for execution to complete (should take 2-5 seconds)

### Step 5: Verify Success
You should see:
```
✅ Lead Capture API migration completed successfully!
```

### Step 6: Refresh Your Browser
1. Go back to: http://localhost:3000/app/api-clients
2. Press `Ctrl+R` to refresh the page
3. The error should be **GONE**! 🎉

---

## What This Creates
- ✅ `api_clients` table - For storing API credentials
- ✅ `api_client_requests` table - For tracking API usage
- ✅ `custom_fields` column in `leads` table
- ✅ Row Level Security (RLS) policies
- ✅ Indexes for better performance
- ✅ Statistics view

---

## Need Help?
If you get any errors during the migration, copy the error message and share it.

---

## Alternative: Quick Copy-Paste
If the file is too large, I can provide a shorter version. Just ask!

