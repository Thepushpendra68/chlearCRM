# 🎯 Lead Capture API - Complete Package

## Overview

The Lead Capture API allows external clients to integrate their landing pages, websites, and forms directly with your CRM system. Leads are automatically captured and synced in real-time.

---

## ✨ Features

✅ **Secure API Key Authentication** - Each client gets unique credentials  
✅ **Custom Fields Support** - Capture any additional data beyond standard fields  
✅ **Rate Limiting** - Configurable per client (default: 100 req/hour)  
✅ **Bulk Operations** - Submit up to 100 leads at once  
✅ **Usage Analytics** - Track requests, success rate, response time  
✅ **Auto-Assignment** - Automatically assign leads to specific users  
✅ **CORS Support** - Configure allowed origins per client  
✅ **Webhook Support** - Optional webhooks for notifications  
✅ **Complete Audit Trail** - Every request is logged  

---

## 📂 Files Created

### Backend

```
backend/
├── src/
│   ├── middleware/
│   │   └── apiKeyMiddleware.js         # API key authentication
│   ├── services/
│   │   └── apiClientService.js         # API client management
│   ├── controllers/
│   │   ├── leadCaptureController.js    # Lead capture endpoints
│   │   └── apiClientController.js      # API client CRUD
│   ├── routes/
│   │   ├── leadCaptureRoutes.js        # Public API routes
│   │   └── apiClientRoutes.js          # Admin routes
│   └── app.js                          # Updated with new routes
```

### Database

```
migrations/
└── 20251028_lead_capture_api.sql       # Complete database migration
```

### Documentation

```
docs/
├── lead-capture-api-integration-guide.md  # Client-facing documentation
├── LEAD_CAPTURE_IMPLEMENTATION_GUIDE.md   # Admin implementation guide
├── LEAD_CAPTURE_API_README.md             # This file
└── examples/
    ├── landing-page-simple.html           # Simple form example
    └── landing-page-advanced.html         # Advanced form with custom fields
```

---

## 🚀 Quick Start (For Admins)

### Step 1: Database Setup
```bash
# Run migration in Supabase SQL Editor
migrations/20251028_lead_capture_api.sql
```

### Step 2: Install Dependencies
```bash
cd backend
npm install bcryptjs
```

### Step 3: Deploy Backend
```bash
npm run dev  # Local testing
# or
vercel --prod  # Production deployment
```

### Step 4: Create API Client
```bash
curl -X POST http://localhost:5000/api/api-clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "client_name": "Client Landing Page",
    "rate_limit": 100,
    "default_lead_source": "website"
  }'
```

### Step 5: Test Lead Capture
```bash
curl -X POST http://localhost:5000/api/v1/capture/lead \
  -H "Content-Type: application/json" \
  -H "X-API-Key: ck_your_api_key" \
  -H "X-API-Secret: your_api_secret" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com"
  }'
```

---

## 📡 API Endpoints

### Public Endpoints (API Key Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/capture/lead` | Capture single lead |
| POST | `/api/v1/capture/leads/bulk` | Capture multiple leads |
| GET | `/api/v1/capture/info` | Get API client info |

### Admin Endpoints (JWT Required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/api-clients` | List all API clients |
| POST | `/api/api-clients` | Create API client |
| GET | `/api/api-clients/:id` | Get API client details |
| PUT | `/api/api-clients/:id` | Update API client |
| POST | `/api/api-clients/:id/regenerate-secret` | Regenerate secret |
| DELETE | `/api/api-clients/:id` | Delete API client |
| GET | `/api/api-clients/:id/stats` | Get usage statistics |

---

## 🔑 Authentication

### For External Clients (Lead Capture)

```javascript
headers: {
  'X-API-Key': 'ck_your_api_key',
  'X-API-Secret': 'your_api_secret'
}
```

### For CRM Admins (API Management)

```javascript
headers: {
  'Authorization': 'Bearer your_jwt_token'
}
```

---

## 💾 Database Schema

### `api_clients` Table
```sql
- id (UUID, PK)
- company_id (UUID, FK → companies)
- client_name (TEXT)
- api_key (TEXT, UNIQUE)
- api_secret_hash (TEXT)
- is_active (BOOLEAN)
- rate_limit (INTEGER)
- allowed_origins (TEXT[])
- webhook_url (TEXT)
- custom_field_mapping (JSONB)
- default_lead_source (TEXT)
- default_assigned_to (UUID, FK → user_profiles)
- metadata (JSONB)
- last_used_at (TIMESTAMPTZ)
- created_by (UUID, FK → user_profiles)
- created_at (TIMESTAMPTZ)
- updated_at (TIMESTAMPTZ)
```

### `api_client_requests` Table
```sql
- id (UUID, PK)
- api_client_id (UUID, FK → api_clients)
- endpoint (TEXT)
- method (TEXT)
- status_code (INTEGER)
- response_time_ms (INTEGER)
- ip_address (TEXT)
- user_agent (TEXT)
- request_body (JSONB)
- error_message (TEXT)
- lead_id (UUID, FK → leads)
- created_at (TIMESTAMPTZ)
```

### `leads` Table (Updated)
```sql
-- Added column:
- custom_fields (JSONB)
```

---

## 📊 Example Request/Response

### Capture Lead

**Request:**
```bash
POST /api/v1/capture/lead
X-API-Key: ck_abc123...
X-API-Secret: secret_xyz789...

{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "company": "Acme Corp",
  "job_title": "CEO",
  "notes": "Interested in Enterprise plan",
  "custom_fields": {
    "budget": "$50,000",
    "timeline": "Q1 2024",
    "company_size": "50-100"
  }
}
```

**Response:**
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

---

## 🎨 Integration Examples

### HTML/JavaScript
```html
<form id="leadForm">
  <input name="first_name" required>
  <input name="last_name" required>
  <input name="email" type="email" required>
  <button type="submit">Submit</button>
</form>

<script>
document.getElementById('leadForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  
  const response = await fetch('YOUR_CRM_URL/api/v1/capture/lead', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': 'YOUR_API_KEY',
      'X-API-Secret': 'YOUR_API_SECRET'
    },
    body: JSON.stringify(data)
  });
  
  if (response.ok) {
    alert('Thank you! We will contact you soon.');
    e.target.reset();
  }
});
</script>
```

More examples in `docs/examples/` folder.

---

## 🔒 Security Best Practices

1. **Never expose credentials in client-side code**
   - Use backend proxy for production
   - Store in environment variables

2. **Enable CORS restrictions**
   - Configure allowed origins per client
   - Use strict domain matching

3. **Monitor usage**
   - Check rate limit usage regularly
   - Review failed requests
   - Set alerts for suspicious activity

4. **Rotate credentials**
   - Regenerate secrets periodically
   - Revoke compromised credentials immediately

5. **Use HTTPS only**
   - Never send credentials over HTTP
   - Enforce SSL/TLS

---

## 📈 Monitoring Queries

### Total Requests by Client
```sql
SELECT 
  ac.client_name,
  COUNT(acr.id) as total_requests,
  COUNT(acr.id) FILTER (WHERE acr.status_code >= 200 AND acr.status_code < 300) as successful,
  COUNT(acr.id) FILTER (WHERE acr.status_code >= 400) as failed
FROM api_clients ac
LEFT JOIN api_client_requests acr ON acr.api_client_id = ac.id
WHERE acr.created_at >= NOW() - INTERVAL '7 days'
GROUP BY ac.id, ac.client_name;
```

### Leads Created via API
```sql
SELECT 
  DATE(l.created_at) as date,
  COUNT(l.id) as leads_created
FROM leads l
WHERE l.created_by IS NULL  -- API-generated leads
AND l.created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(l.created_at)
ORDER BY date DESC;
```

---

## 🛠️ Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Invalid credentials | Verify API key/secret, check for spaces |
| Rate limit exceeded | Increase limit or wait for hourly reset |
| CORS error | Add domain to allowed_origins |
| Leads not appearing | Check company_id, verify RLS policies |
| Custom fields not saving | Verify custom_fields column exists |

### Debug Checklist

- [ ] API credentials are correct
- [ ] API endpoint URL is correct
- [ ] Required fields are being sent
- [ ] API client is active (`is_active = true`)
- [ ] Rate limit not exceeded
- [ ] CORS configured correctly
- [ ] Backend deployed successfully
- [ ] Database migration ran successfully

---

## 📚 Documentation Links

- **Client Integration Guide**: `docs/lead-capture-api-integration-guide.md`
- **Admin Implementation Guide**: `docs/LEAD_CAPTURE_IMPLEMENTATION_GUIDE.md`
- **Simple Example**: `docs/examples/landing-page-simple.html`
- **Advanced Example**: `docs/examples/landing-page-advanced.html`

---

## 🎯 Use Cases

1. **Landing Pages** - Capture leads from marketing campaigns
2. **Contact Forms** - Website contact forms
3. **Event Registration** - Webinars, conferences, demos
4. **Chatbots** - Integrate with chat platforms
5. **Mobile Apps** - Capture leads from mobile applications
6. **Third-Party Integrations** - Connect with other tools

---

## 🚀 Next Steps

### For Admins:
1. Run database migration
2. Deploy backend code
3. Create test API client
4. Test lead capture
5. Create production API clients for customers
6. Share documentation with clients

### For Clients:
1. Receive API credentials from admin
2. Read integration guide
3. Choose example template or build custom
4. Replace placeholders with your credentials
5. Test on staging environment
6. Deploy to production
7. Monitor leads in CRM

---

## 📊 Metrics

Track these KPIs:
- **API Requests per Day** - Total usage
- **Success Rate** - % of successful captures
- **Response Time** - Average API response time
- **Leads per Client** - Which integrations are most active
- **Error Rate** - Failed requests requiring attention

---

## 🎉 Benefits

### For Your Business:
- ✅ More leads automatically captured
- ✅ No manual data entry
- ✅ Real-time lead notifications
- ✅ Better client service
- ✅ Additional revenue stream

### For Your Clients:
- ✅ Seamless integration
- ✅ No data loss
- ✅ Instant lead follow-up
- ✅ Better conversion rates
- ✅ Complete lead history

---

## 📞 Support

For questions or issues:
- Check troubleshooting section
- Review API logs
- Test with curl
- Contact CRM administrator

---

## 📝 Version History

**v1.0.0** (October 2024)
- Initial release
- Single & bulk lead capture
- API client management
- Custom fields support
- Rate limiting
- Usage analytics
- Complete documentation

---

**Implementation Complete! 🎉**

Your CRM now has a production-ready Lead Capture API that your clients can integrate with their landing pages and forms.

