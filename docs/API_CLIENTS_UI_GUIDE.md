# 🎨 API Clients UI - User Guide

## Overview

You now have a **beautiful, easy-to-use interface** in your CRM to create and manage API clients! No more curl commands or terminal - everything can be done through the UI.

---

## 🔑 Access

### Who Can Use It?

- ✅ **Company Admins** - Full access to manage API clients for their company
- ✅ **Super Admins** - Full access to manage API clients for all companies

### How to Access?

1. Login to your CRM
2. Look in the sidebar navigation
3. Click on **"API Clients"** (with a key icon 🔑)

---

## ✨ Features

### 1. **Create API Clients** 🆕

**How to create:**

1. Click the blue **"Create API Client"** button (top right)
2. Fill in the form:
   - **Client Name** (required): e.g., "Website Contact Form"
   - **Rate Limit**: Requests per hour (default: 100)
   - **Allowed Origins**: Domains that can use this API
   - **Default Lead Source**: Tag for leads (e.g., "website")
   - **Webhook URL**: Optional notification endpoint
3. Click **"Create API Client"**

**What happens next:**

- ⚠️ A popup appears with your API credentials
- ⚠️ **CRITICAL:** The API secret is shown **ONLY ONCE**
- You must copy and save it immediately
- Click "Copy" buttons to copy credentials
- Save them securely (password manager, env file, etc.)

### 2. **View API Clients** 👀

**What you see:**

- List of all your API clients
- Each card shows:
  - Client name
  - API key (with copy button)
  - Rate limit
  - Default lead source
  - Last used timestamp
  - Active/Inactive status

**Status badges:**
- 🟢 **Active** - API client is working
- 🔴 **Inactive** - API client is disabled

### 3. **View Usage Statistics** 📊

**How to view stats:**

1. Click **"View Stats"** button on any API client
2. See detailed analytics:
   - **Total Requests** - All API calls made
   - **Successful** - Successfully processed requests
   - **Failed** - Failed requests
   - **Leads Created** - Total leads captured
   - **Avg Response Time** - API performance

**Statistics are for the last 30 days**

### 4. **Regenerate Secret** 🔄

**When to use:**
- Secret was compromised or leaked
- You lost the original secret
- Rotating credentials for security

**How to regenerate:**

1. Click **"Regenerate Secret"** button
2. Confirm the action (old secret stops working!)
3. New secret appears in popup
4. ⚠️ **SAVE IT IMMEDIATELY** - won't be shown again!
5. Update your integrations with new secret

### 5. **Activate/Deactivate** 🔴🟢

**How to toggle:**

1. Click **"Deactivate"** or **"Activate"** button
2. Status changes immediately
3. **Deactivated clients:**
   - API calls will be rejected
   - No leads will be captured
   - Useful for temporarily disabling integrations

### 6. **Delete Client** 🗑️

**How to delete:**

1. Click **"Delete"** button
2. Confirm deletion
3. ⚠️ **CANNOT BE UNDONE!**
4. Client and all usage logs are removed

**When to delete:**
- Integration is no longer needed
- Client relationship ended
- Testing clients you don't need anymore

### 7. **Copy API Key** 📋

**Quick copy:**

- Click the copy icon next to any API key
- ✓ "Copied!" appears when successful
- Paste wherever you need it

---

## 📱 User Interface Tour

### Main Page

```
┌─────────────────────────────────────────────────────────┐
│  API Clients                    [+ Create API Client]   │
│  Manage API credentials for lead capture integrations  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔑 Website Contact Form              [Active]   │  │
│  │                                                  │  │
│  │ API Key: ck_abc123...  [📋 Copy]                │  │
│  │ Rate Limit: 100 req/hour                        │  │
│  │ Default Source: website                         │  │
│  │ Last Used: 2 hours ago                          │  │
│  │                                                  │  │
│  │ [📊 Stats] [🔄 Regen] [⚪ Deactivate] [🗑️ Delete] │  │
│  └─────────────────────────────────────────────────┘  │
│                                                         │
│  ┌─────────────────────────────────────────────────┐  │
│  │ 🔑 Landing Page Form              [Inactive]    │  │
│  │ ...                                              │  │
│  └─────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### Create Modal

```
┌─────────────────────────────────────────────┐
│  Create API Client                    [X]   │
├─────────────────────────────────────────────┤
│                                             │
│  Client Name *                              │
│  ┌──────────────────────────────────────┐  │
│  │ Website Contact Form                 │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  Rate Limit (requests per hour)             │
│  ┌──────────────────────────────────────┐  │
│  │ 100                                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  Allowed Origins (comma-separated)          │
│  ┌──────────────────────────────────────┐  │
│  │ https://example.com                  │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  ...                                        │
│                                             │
│  [Create API Client]      [Cancel]         │
└─────────────────────────────────────────────┘
```

### Credentials Modal (After Creation)

```
┌─────────────────────────────────────────────┐
│           Save These Credentials!           │
│  ⚠️ The API secret will only be shown once │
├─────────────────────────────────────────────┤
│                                             │
│  Client Name                                │
│  Website Contact Form                       │
│                                             │
│  API Key                                    │
│  ┌──────────────────────────────────────┐  │
│  │ ck_abc123...                  [Copy] │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  API Secret                                 │
│  ┌──────────────────────────────────────┐  │
│  │ secret_xyz789...              [Copy] │  │
│  └──────────────────────────────────────┘  │
│                                             │
│  Next steps:                                │
│  1. Copy both credentials                   │
│  2. Share with your client                  │
│  3. Include integration docs                │
│  4. Test the integration                    │
│                                             │
│  [I've Saved the Credentials]               │
└─────────────────────────────────────────────┘
```

---

## 🎯 Common Workflows

### Workflow 1: Setup New Client Integration

1. **Create API client** in UI
2. **Copy credentials** from popup
3. **Email credentials** to client with documentation:
   ```
   Subject: Your API Credentials for Lead Capture

   Hi [Client],

   Your API access is ready!

   API URL: https://your-crm.com
   API Key: ck_abc123...
   API Secret: secret_xyz789...

   Documentation: [link to guide]
   Example: [link to example file]

   Let me know if you need help!
   ```
4. **Client integrates** their landing page
5. **Monitor usage** in Stats

### Workflow 2: Troubleshoot Integration

1. Go to **API Clients**
2. Find the client
3. Click **"View Stats"**
4. Check:
   - Total requests (Are they making calls?)
   - Failed requests (What's failing?)
   - Leads created (Are leads being captured?)
5. If issues:
   - Check if client is **Active**
   - Verify **rate limit** not exceeded
   - Check **allowed origins** are correct
   - Review backend logs

### Workflow 3: Rotate Compromised Credentials

1. Go to **API Clients**
2. Find affected client
3. Click **"Regenerate Secret"**
4. Confirm action
5. **Save new secret** from popup
6. **Contact client immediately**:
   ```
   Subject: URGENT: API Credentials Updated

   Hi [Client],

   We've regenerated your API credentials for security.

   New API Secret: secret_xyz789...
   (API Key unchanged: ck_abc123...)

   Please update your integration ASAP.
   The old secret stopped working immediately.

   Reply if you need help!
   ```

### Workflow 4: Temporarily Disable Integration

1. Go to **API Clients**
2. Find the client
3. Click **"Deactivate"**
4. API calls will be rejected until reactivated
5. To re-enable: Click **"Activate"**

---

## 💡 Tips & Best Practices

### Security
- ✅ Only share credentials via secure channels (encrypted email, password manager)
- ✅ Never commit credentials to Git
- ✅ Rotate secrets periodically
- ✅ Deactivate unused clients
- ✅ Set reasonable rate limits

### Organization
- ✅ Use descriptive client names (e.g., "Homepage Form" not "Client 1")
- ✅ Set default lead sources to track origin
- ✅ Configure allowed origins for CORS security
- ✅ Delete test clients after testing

### Monitoring
- ✅ Check stats weekly
- ✅ Monitor failed requests
- ✅ Watch for rate limit issues
- ✅ Track leads created per client

### Client Support
- ✅ Provide documentation with credentials
- ✅ Include example landing page files
- ✅ Offer to help with initial integration
- ✅ Monitor first few days after setup

---

## 🚨 Troubleshooting

### "I can't see API Clients in sidebar"

**Solution:** Check your role:
- Must be **Company Admin** or **Super Admin**
- Regular users don't have access

### "I lost the API secret"

**Solution:** Regenerate it:
1. Click "Regenerate Secret"
2. Save the new secret
3. Update your integration

### "API calls are failing"

**Check:**
1. Is client **Active**?
2. Is rate limit exceeded? (View Stats)
3. Are allowed origins correct?
4. Are credentials correct?

### "No leads appearing"

**Check:**
1. View Stats - are requests successful?
2. Check CRM leads page - filter by source
3. Verify client is using correct company_id
4. Check backend logs for errors

### "Copy button not working"

**Solution:**
- Try clicking again
- Manually select and copy text
- Check browser permissions for clipboard access

---

## 📊 Understanding Statistics

### Total Requests
- **High number**: Integration is active
- **Zero**: Client hasn't started yet or integration is broken

### Successful vs Failed
- **All successful**: Everything working great!
- **Some failed**: Check error rates, might need investigation
- **All failed**: Integration is broken, contact client immediately

### Leads Created
- **Matches successful requests**: Perfect!
- **Lower than successful**: Some requests don't create leads (duplicates, validation errors)

### Response Time
- **< 500ms**: Excellent performance
- **500-1000ms**: Good performance
- **> 1000ms**: May need optimization

---

## 🎉 Success Metrics

**You'll know it's working when:**

- ✅ Clients can integrate in < 30 minutes
- ✅ Leads appear in CRM instantly
- ✅ Statistics show consistent usage
- ✅ Failed requests rate < 5%
- ✅ Response times < 500ms
- ✅ Zero support tickets about integration

---

## 📞 Need Help?

### For CRM Admins:
- Check backend logs
- Review API client settings
- Test with curl
- Check database directly

### For Clients:
- Provide integration documentation
- Share example landing pages
- Offer to review their code
- Test together on a call

---

## 🎊 Benefits of Using the UI

### Before (Curl Commands):
```bash
# Complex curl command
curl -X POST https://crm.com/api/api-clients \
  -H "Authorization: Bearer long_jwt_token..." \
  -H "Content-Type: application/json" \
  -d '{"client_name":"Test","rate_limit":100}'

# Have to copy API secret from terminal
```

### Now (Beautiful UI):
1. Click "Create API Client" button
2. Fill simple form
3. Click "Create"
4. Credentials appear in nice popup with copy buttons
5. Done! ✨

---

## 📝 Summary

The API Clients UI makes it **incredibly easy** to:

- ✅ Create API clients (30 seconds)
- ✅ View and manage all clients
- ✅ Monitor usage statistics
- ✅ Copy credentials with one click
- ✅ Regenerate secrets instantly
- ✅ Activate/deactivate clients
- ✅ Delete when no longer needed

**No terminal commands required!** Everything through a beautiful, intuitive interface.

---

**Happy integrating! 🚀**

