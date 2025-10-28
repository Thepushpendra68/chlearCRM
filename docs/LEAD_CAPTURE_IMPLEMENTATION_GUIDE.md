# 🚀 Lead Capture API - Implementation Guide for CRM Admins

This guide will help you set up and deploy the Lead Capture API feature to allow your clients to integrate their landing pages with your CRM.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Database Setup](#database-setup)
3. [Backend Deployment](#backend-deployment)
4. [Testing](#testing)
5. [Creating API Clients](#creating-api-clients)
6. [Frontend UI (Optional)](#frontend-ui-optional)
7. [Sharing with Clients](#sharing-with-clients)
8. [Monitoring](#monitoring)
9. [Troubleshooting](#troubleshooting)

---

## ✅ Prerequisites

Before starting, ensure you have:

- [x] Access to your Supabase database (SQL Editor)
- [x] Backend API deployed and running
- [x] Admin access to your CRM
- [x] Node.js 18+ installed (for local testing)
- [x] bcryptjs package installed in backend

---

## 🗄️ Database Setup

### Step 1: Run the Migration

1. **Login to Supabase Dashboard**
   - Go to your project
   - Navigate to **SQL Editor**

2. **Run the Migration Script**
   - Open the file: `migrations/20251028_lead_capture_api.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or **F5**

3. **Verify Success**
   ```sql
   -- Check if tables were created
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name IN ('api_clients', 'api_client_requests');

   -- Check if custom_fields column was added to leads
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'leads' 
   AND column_name = 'custom_fields';
   ```

4. **Expected Output**
   ```
   ✅ api_clients table created
   ✅ api_client_requests table created
   ✅ custom_fields column added to leads
   ✅ Indexes created
   ✅ RLS policies enabled
   ✅ Views created
   ```

### Step 2: Verify RLS Policies

```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('api_clients', 'api_client_requests')
AND schemaname = 'public';
```

Expected result: Both should show `true` for `rowsecurity`.

---

## 🚀 Backend Deployment

### Step 1: Install Dependencies

```bash
cd backend
npm install bcryptjs
```

### Step 2: Verify Files Are in Place

Check that these files exist:
- ✅ `backend/src/middleware/apiKeyMiddleware.js`
- ✅ `backend/src/services/apiClientService.js`
- ✅ `backend/src/controllers/leadCaptureController.js`
- ✅ `backend/src/controllers/apiClientController.js`
- ✅ `backend/src/routes/leadCaptureRoutes.js`
- ✅ `backend/src/routes/apiClientRoutes.js`
- ✅ `backend/src/app.js` (updated with new routes)

### Step 3: Test Locally

```bash
# Start backend
cd backend
npm run dev

# Backend should start on http://localhost:5000
```

Check console output for errors. You should see:
```
🚀 Server running on port 5000
📊 Environment: development
```

### Step 4: Test Health Endpoint

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-10-28T...",
  "environment": "development"
}
```

### Step 5: Deploy to Production

**For Vercel:**
```bash
cd backend
vercel --prod
```

**For other platforms:**
- Push to your Git repository
- Your CI/CD should automatically deploy
- Verify deployment was successful

---

## 🧪 Testing

### Test 1: Create Your First API Client (via API)

```bash
# Get your JWT token from CRM login
TOKEN="your_jwt_token_here"

# Create an API client
curl -X POST http://localhost:5000/api/api-clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "client_name": "Test Landing Page",
    "rate_limit": 100,
    "allowed_origins": ["http://localhost:8000"],
    "default_lead_source": "test"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "API client created successfully. IMPORTANT: Save the API secret securely - it will not be shown again!",
  "data": {
    "id": "uuid-here",
    "api_key": "ck_abc123...",
    "api_secret": "secret_xyz789...",
    "client_name": "Test Landing Page",
    "rate_limit": 100,
    "is_active": true
  }
}
```

**⚠️ IMPORTANT:** Copy the `api_secret` immediately - it won't be shown again!

### Test 2: Test Lead Capture

```bash
API_KEY="ck_abc123..."  # From previous step
API_SECRET="secret_xyz789..."  # From previous step

curl -X POST http://localhost:5000/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "phone": "+1234567890",
    "notes": "This is a test lead"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Lead captured successfully",
  "data": {
    "lead_id": "uuid-here",
    "status": "new"
  }
}
```

### Test 3: Verify Lead in CRM

1. Login to your CRM
2. Go to **Leads** page
3. You should see a new lead:
   - Name: Test User
   - Email: test@example.com
   - Source: test
   - Status: new

### Test 4: Test with Custom Fields

```bash
curl -X POST http://localhost:5000/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET" \
  -d '{
    "first_name": "Jane",
    "last_name": "Doe",
    "email": "jane@example.com",
    "custom_fields": {
      "budget": "$50,000",
      "timeline": "Q1 2024",
      "company_size": "50-100"
    }
  }'
```

### Test 5: Test API Info Endpoint

```bash
curl -X GET http://localhost:5000/api/v1/capture/info \
  -H "X-API-Key: $API_KEY" \
  -H "X-API-Secret: $API_SECRET"
```

---

## 👥 Creating API Clients

### Method 1: Via API (Recommended)

Use the endpoint from Test 1 above.

### Method 2: Via Database (Advanced)

⚠️ Only use this if API method doesn't work.

```sql
-- Generate a hashed secret (use Node.js)
-- In Node.js console:
-- const bcrypt = require('bcryptjs');
-- const hash = await bcrypt.hash('your_secret_here', 10);
-- console.log(hash);

INSERT INTO api_clients (
  company_id,
  client_name,
  api_key,
  api_secret_hash,
  rate_limit,
  default_lead_source,
  created_by
) VALUES (
  'your-company-uuid',
  'Landing Page Name',
  'ck_' || encode(gen_random_bytes(24), 'hex'),
  '$2a$10$...', -- Use bcrypt hash from above
  100,
  'website',
  'your-user-uuid'
);
```

### Managing API Clients

#### List All API Clients
```bash
curl http://localhost:5000/api/api-clients \
  -H "Authorization: Bearer $TOKEN"
```

#### Get API Client Details
```bash
curl http://localhost:5000/api/api-clients/{id} \
  -H "Authorization: Bearer $TOKEN"
```

#### Update API Client
```bash
curl -X PUT http://localhost:5000/api/api-clients/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "client_name": "Updated Name",
    "rate_limit": 200,
    "is_active": true
  }'
```

#### Regenerate API Secret
```bash
curl -X POST http://localhost:5000/api/api-clients/{id}/regenerate-secret \
  -H "Authorization: Bearer $TOKEN"
```

#### Deactivate API Client
```bash
curl -X PUT http://localhost:5000/api/api-clients/{id} \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"is_active": false}'
```

#### Delete API Client
```bash
curl -X DELETE http://localhost:5000/api/api-clients/{id} \
  -H "Authorization: Bearer $TOKEN"
```

#### Get Usage Statistics
```bash
curl http://localhost:5000/api/api-clients/{id}/stats?days=30 \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🎨 Frontend UI (Optional)

If you want to create a UI in your CRM for managing API clients:

### Add Navigation Item

In `frontend/src/components/Sidebar.jsx` or similar:

```jsx
{
  name: 'API Clients',
  href: '/settings/api-clients',
  icon: KeyIcon,
  role: ['company_admin', 'super_admin']
}
```

### Create API Clients Page

Create `frontend/src/pages/APIClients.jsx`:

```jsx
import React, { useState, useEffect } from 'react';
import { apiClientService } from '../services/apiClientService';

function APIClients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = async () => {
    try {
      const data = await apiClientService.getAll();
      setClients(data);
    } catch (error) {
      console.error('Error loading API clients:', error);
    } finally {
      setLoading(false);
    }
  };

  // ... rest of component
}
```

### Create Service File

Create `frontend/src/services/apiClientService.js`:

```javascript
import api from './api';

export const apiClientService = {
  getAll: () => api.get('/api-clients'),
  getById: (id) => api.get(`/api-clients/${id}`),
  create: (data) => api.post('/api-clients', data),
  update: (id, data) => api.put(`/api-clients/${id}`, data),
  regenerateSecret: (id) => api.post(`/api-clients/${id}/regenerate-secret`),
  delete: (id) => api.delete(`/api-clients/${id}`),
  getStats: (id, days = 30) => api.get(`/api-clients/${id}/stats?days=${days}`)
};
```

---

## 📤 Sharing with Clients

### Step 1: Generate Credentials

Create an API client for your client (see "Creating API Clients" above).

### Step 2: Share Documentation

Send your client:

1. **Integration Guide**
   - File: `docs/lead-capture-api-integration-guide.md`
   - Convert to PDF or host on your website

2. **API Credentials**
   ```
   API URL: https://your-crm.com
   API Key: ck_abc123...
   API Secret: secret_xyz789...
   ```

3. **Example Landing Pages**
   - Simple: `docs/examples/landing-page-simple.html`
   - Advanced: `docs/examples/landing-page-advanced.html`

### Step 3: Quick Start Email Template

```
Subject: Your CRM API Credentials - Lead Capture Integration

Hi [Client Name],

Your lead capture API has been set up! Here's everything you need to integrate your landing pages with our CRM:

📍 API CREDENTIALS:
------------------
API URL: https://your-crm.com
API Key: ck_abc123...
API Secret: secret_xyz789...

⚠️ IMPORTANT: Keep these credentials secure. Never commit them to Git or expose them in client-side code.

📚 DOCUMENTATION:
-----------------
Complete integration guide: [link to docs]
Example landing pages: [link to examples]

🚀 QUICK START:
---------------
1. Download the example HTML file
2. Replace YOUR_API_KEY and YOUR_API_SECRET with the credentials above
3. Replace YOUR_CRM_URL with: https://your-crm.com
4. Upload to your website
5. Test the form!

📊 FEATURES:
------------
• Automatic lead capture
• Custom fields support
• Real-time sync to CRM
• Rate limiting: 100 requests/hour
• Usage statistics available

Need help? Reply to this email or call us at [phone].

Best regards,
[Your Name]
```

---

## 📊 Monitoring

### Check API Usage

```sql
-- Total requests by API client
SELECT 
  ac.client_name,
  COUNT(acr.id) as total_requests,
  COUNT(acr.id) FILTER (WHERE acr.status_code >= 200 AND acr.status_code < 300) as successful,
  COUNT(acr.id) FILTER (WHERE acr.status_code >= 400) as failed
FROM api_clients ac
LEFT JOIN api_client_requests acr ON acr.api_client_id = ac.id
WHERE acr.created_at >= NOW() - INTERVAL '7 days'
GROUP BY ac.id, ac.client_name
ORDER BY total_requests DESC;
```

### Check Recent Failed Requests

```sql
SELECT 
  ac.client_name,
  acr.endpoint,
  acr.status_code,
  acr.error_message,
  acr.created_at
FROM api_client_requests acr
JOIN api_clients ac ON ac.id = acr.api_client_id
WHERE acr.status_code >= 400
ORDER BY acr.created_at DESC
LIMIT 20;
```

### Check Rate Limit Usage

```sql
SELECT 
  ac.client_name,
  ac.rate_limit,
  COUNT(acr.id) as requests_last_hour,
  ac.rate_limit - COUNT(acr.id) as remaining
FROM api_clients ac
LEFT JOIN api_client_requests acr ON acr.api_client_id = ac.id
  AND acr.created_at >= NOW() - INTERVAL '1 hour'
GROUP BY ac.id, ac.client_name, ac.rate_limit
ORDER BY requests_last_hour DESC;
```

### Check Leads Created via API

```sql
SELECT 
  DATE(l.created_at) as date,
  ac.client_name,
  COUNT(l.id) as leads_created
FROM leads l
JOIN api_client_requests acr ON acr.lead_id = l.id
JOIN api_clients ac ON ac.id = acr.api_client_id
WHERE l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(l.created_at), ac.client_name
ORDER BY date DESC, leads_created DESC;
```

---

## 🔧 Troubleshooting

### Issue 1: "Invalid API credentials" Error

**Cause:** API key or secret is incorrect

**Solutions:**
1. Verify API key starts with `ck_`
2. Check for extra spaces or line breaks
3. Regenerate secret if compromised
4. Verify API client is active: `SELECT is_active FROM api_clients WHERE api_key = 'ck_...'`

### Issue 2: Rate Limit Exceeded

**Cause:** Too many requests in 1 hour

**Solutions:**
1. Check current usage:
   ```sql
   SELECT COUNT(*) 
   FROM api_client_requests 
   WHERE api_client_id = 'uuid'
   AND created_at >= NOW() - INTERVAL '1 hour';
   ```
2. Increase rate limit:
   ```sql
   UPDATE api_clients 
   SET rate_limit = 200 
   WHERE id = 'uuid';
   ```
3. Wait for hourly reset

### Issue 3: Leads Not Appearing in CRM

**Cause:** Multiple possibilities

**Solutions:**
1. Check API response has `lead_id`
2. Verify lead was created:
   ```sql
   SELECT * FROM leads WHERE id = 'lead_id_from_response';
   ```
3. Check company_id matches:
   ```sql
   SELECT company_id FROM leads WHERE id = 'lead_id';
   ```
4. Check RLS policies allow viewing:
   ```sql
   SELECT * FROM leads WHERE company_id = 'your_company_id';
   ```

### Issue 4: CORS Errors

**Cause:** Client domain not in allowed origins

**Solutions:**
1. Add domain to allowed_origins:
   ```sql
   UPDATE api_clients 
   SET allowed_origins = ARRAY['https://client-website.com']
   WHERE id = 'uuid';
   ```
2. Or use backend proxy (recommended)

### Issue 5: Custom Fields Not Saving

**Cause:** Column doesn't exist

**Solutions:**
1. Verify column exists:
   ```sql
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_name = 'leads' 
   AND column_name = 'custom_fields';
   ```
2. Re-run migration if missing

### Issue 6: Performance Issues

**Cause:** Too many requests or slow queries

**Solutions:**
1. Check slow queries:
   ```sql
   SELECT * FROM pg_stat_statements 
   WHERE query LIKE '%api_client%'
   ORDER BY mean_exec_time DESC;
   ```
2. Add indexes if needed
3. Increase rate limits strategically
4. Consider caching for high-volume clients

---

## 📈 Performance Optimization

### Add Database Indexes

```sql
-- If you notice slow queries, add these indexes:
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_api_client_requests_created_client 
ON api_client_requests(api_client_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_leads_custom_fields_gin 
ON leads USING GIN (custom_fields);
```

### Enable Query Logging

In Supabase Dashboard:
1. Go to **Database** → **Logs**
2. Filter by slow queries
3. Optimize as needed

---

## ✅ Deployment Checklist

Before going live:

- [ ] Database migration completed successfully
- [ ] All tests passing
- [ ] Backend deployed to production
- [ ] Health endpoint responding
- [ ] Created test API client
- [ ] Tested lead capture successfully
- [ ] Verified leads appear in CRM
- [ ] Tested custom fields
- [ ] Tested rate limiting
- [ ] Documentation prepared for clients
- [ ] Example pages ready
- [ ] Monitoring queries saved
- [ ] Support contact info updated

---

## 🎉 Success!

Your Lead Capture API is now live! Your clients can now integrate their landing pages with your CRM to automatically capture leads.

### Next Steps:

1. **Create API clients** for your customers
2. **Share documentation** with them
3. **Monitor usage** regularly
4. **Collect feedback** for improvements
5. **Consider building a UI** for easier management

---

## 📞 Support

For questions or issues:
- Check the [Troubleshooting](#troubleshooting) section
- Review API logs in Supabase
- Test with curl first to isolate issues
- Check GitHub issues for similar problems

---

**Last Updated:** October 2024  
**Version:** 1.0.0

