# 🚀 Quick WhatsApp Setup Guide

## ⚠️ IMPORTANT: Run Database Migration First!

The database migration must be executed before configuring WhatsApp integration.

### Step 1: Run Database Migration

1. **Open Supabase Dashboard**: Go to your Supabase project
2. **Navigate to SQL Editor**
3. **Copy and paste** the entire contents of `migrations/20250115_whatsapp_meta_integration.sql`
4. **Click "Run"**

This will:
- ✅ Add 'whatsapp' to allowed integration types
- ✅ Create `whatsapp_messages` table
- ✅ Create `whatsapp_templates` table
- ✅ Create `whatsapp_conversations` table
- ✅ Create `whatsapp_sequences` table
- ✅ Create `whatsapp_sequence_enrollments` table

### Step 2: Add Environment Variables

Add to `backend/.env`:

```bash
# Meta WhatsApp Business API - CRM Wchat
META_WHATSAPP_ACCESS_TOKEN=EAAKJE4CSuHEBPZCSmyQMobBe6p9W8zhZBHR9SISHrijOEngI0qWdtU1EBZBx8ZBl37k12fg1xPys8ZB3ibxionSRZC7eZCprqHxc4f4UOBy7VGIplaYMiYyHqXhY1n3nq6dp3LfINwECo9WovUV2T712esorLBV3yB5ZBCeN3YngneKpFvYRZBR1khCzA2nsX4f1yZCFAQhkCQz8VuttPSsdAcKZA3gCqBIPSZB3gky76AWxPgZDZD
META_WHATSAPP_PHONE_NUMBER_ID=754391564431502
META_WHATSAPP_BUSINESS_ACCOUNT_ID=1779313026310884
META_WHATSAPP_APP_SECRET=ca13696e2b7b91f712be7ac495a5bcd1
META_WHATSAPP_APP_ID=713666807904369
META_WHATSAPP_CLIENT_TOKEN=5826c0ee457d62a7f68fb54828dabc24
META_WHATSAPP_VERIFY_TOKEN=whatsapp_verify_crm_wchat_2025
```

### Step 3: Run Setup Script

After migration is complete, run:

```bash
cd backend
node scripts/setupWhatsApp.js
```

This will configure WhatsApp for all your companies.

### Step 4: Configure Webhook in Meta

1. Go to: https://developers.facebook.com/apps/713666807904369/whatsapp-business/configuration
2. Scroll to "Webhook" section
3. Click "Edit"
4. **Callback URL**: 
   - Production: `https://your-domain.com/api/whatsapp/webhooks/meta`
   - Local: Use ngrok: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhooks/meta`
5. **Verify Token**: `whatsapp_verify_crm_wchat_2025` (same as in .env)
6. **Subscribe to**:
   - ✅ `messages`
   - ✅ `message_status`
7. Click "Verify and Save"

### Step 5: Test It!

#### Test Webhook (Meta will do this automatically)
When you click "Verify and Save", Meta will test the webhook.

#### Test Sending Message
```bash
# Get your JWT token from login
curl -X POST http://localhost:5000/api/whatsapp/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Hello from CRM Wchat!"
  }'
```

#### Test Receiving Message
Send a WhatsApp message to your business number and check:
- Server logs for webhook events
- Database for new lead (if number unknown)
- Activities table for the message activity

---

## ✅ Your Credentials Summary

- **App**: CRM Wchat (ID: 713666807904369)
- **Phone Number ID**: 754391564431502
- **Business Account ID**: 1779313026310884
- **Access Token**: Configured ✅
- **App Secret**: Configured ✅

---

## 🎯 What's Working Now

✅ Backend API endpoints ready
✅ Database schema ready (after migration)
✅ Webhook handlers ready
✅ Auto lead creation from WhatsApp
✅ Activity logging
✅ Message tracking

---

## 📝 Next: Frontend UI

After backend is working, build:
1. WhatsApp Settings page
2. Message composer
3. Conversation view
4. Quick actions in lead/contact pages

---

**Status**: Backend ready, waiting for database migration!

