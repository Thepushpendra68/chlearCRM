# WhatsApp Meta Integration - Configuration Guide

## ✅ Your Credentials (Configured)

- **App Name**: CRM Wchat
- **App ID**: 713666807904369
- **App Secret**: ca13696e2b7b91f712be7ac495a5bcd1
- **Client Token**: 5826c0ee457d62a7f68fb54828dabc24
- **Access Token**: EAAKJE4CSuHEBPZCSmyQMobBe6p9W8zhZBHR9SISHrijOEngI0qWdtU1EBZBx8ZBl37k12fg1xPys8ZB3ibxionSRZC7eZCprqHxc4f4UOBy7VGIplaYMiYyHqXhY1n3nq6dp3LfINwECo9WovUV2T712esorLBV3yB5ZBCeN3YngneKpFvYRZBR1khCzA2nsX4f1yZCFAQhkCQz8VuttPSsdAcKZA3gCqBIPSZB3gky76AWxPgZDZD
- **Phone Number ID**: 754391564431502
- **WhatsApp Business Account ID**: 1779313026310884

---

## 🔧 Configuration Steps

### Step 1: Add Environment Variables

Add these to your `backend/.env` file:

```bash
# Meta WhatsApp Business API Configuration
META_WHATSAPP_ACCESS_TOKEN=EAAKJE4CSuHEBPZCSmyQMobBe6p9W8zhZBHR9SISHrijOEngI0qWdtU1EBZBx8ZBl37k12fg1xPys8ZB3ibxionSRZC7eZCprqHxc4f4UOBy7VGIplaYMiYyHqXhY1n3nq6dp3LfINwECo9WovUV2T712esorLBV3yB5ZBCeN3YngneKpFvYRZBR1khCzA2nsX4f1yZCFAQhkCQz8VuttPSsdAcKZA3gCqBIPSZB3gky76AWxPgZDZD
META_WHATSAPP_PHONE_NUMBER_ID=754391564431502
META_WHATSAPP_BUSINESS_ACCOUNT_ID=1779313026310884
META_WHATSAPP_APP_SECRET=ca13696e2b7b91f712be7ac495a5bcd1
META_WHATSAPP_APP_ID=713666807904369
META_WHATSAPP_CLIENT_TOKEN=5826c0ee457d62a7f68fb54828dabc24
META_WHATSAPP_VERIFY_TOKEN=whatsapp_verify_crm_wchat_2025
```

**Note**: Create a secure verify token (the one above is just an example). This will be used for webhook verification.

### Step 2: Run Database Migration

Execute the migration SQL in Supabase:

```sql
-- Run: migrations/20250115_whatsapp_meta_integration.sql
-- In Supabase SQL Editor
```

### Step 3: Configure WhatsApp Integration in Database

**Option A: Using Setup Script (Recommended)**

```bash
cd backend
node scripts/setupWhatsApp.js
```

This script will automatically configure WhatsApp for all active companies in your CRM.

**Option B: Manual Configuration via API**

After logging in, make a POST request to configure:

```bash
POST /api/whatsapp/settings
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "access_token": "EAAKJE4CSuHEBPZCSmyQMobBe6p9W8zhZBHR9SISHrijOEngI0qWdtU1EBZBx8ZBl37k12fg1xPys8ZB3ibxionSRZC7eZCprqHxc4f4UOBy7VGIplaYMiYyHqXhY1n3nq6dp3LfINwECo9WovUV2T712esorLBV3yB5ZBCeN3YngneKpFvYRZBR1khCzA2nsX4f1yZCFAQhkCQz8VuttPSsdAcKZA3gCqBIPSZB3gky76AWxPgZDZD",
  "phone_number_id": "754391564431502",
  "business_account_id": "1779313026310884",
  "app_secret": "ca13696e2b7b91f712be7ac495a5bcd1"
}
```

### Step 4: Configure Webhook in Meta App Dashboard

1. **Go to Meta for Developers**: https://developers.facebook.com/apps/713666807904369/whatsapp-business/configuration

2. **Navigate to**: WhatsApp → Configuration → Webhook

3. **Set Webhook URL**:
   - **Production**: `https://your-production-domain.com/api/whatsapp/webhooks/meta`
   - **Local Testing**: Use ngrok: `https://your-ngrok-url.ngrok.io/api/whatsapp/webhooks/meta`
   
   To get ngrok URL:
   ```bash
   # Install ngrok: https://ngrok.com/download
   ngrok http 5000
   # Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
   ```

4. **Set Verify Token**: 
   - Use the same value as `META_WHATSAPP_VERIFY_TOKEN` in your `.env`
   - Example: `whatsapp_verify_crm_wchat_2025`

5. **Subscribe to Fields**:
   - ✅ `messages` - Incoming messages
   - ✅ `message_status` - Delivery status updates

6. **Click "Verify and Save"**

   Meta will send a GET request to verify the webhook. The endpoint should return the challenge.

### Step 5: Test the Integration

#### Test 1: Webhook Verification
Meta will automatically test this when you click "Verify and Save". You should see:
```
✅ [WHATSAPP] Webhook verified
```

#### Test 2: Send a Test Message

```bash
# Replace YOUR_JWT_TOKEN with actual token
# Replace PHONE_NUMBER with recipient (format: 919876543210, no +)

curl -X POST http://localhost:5000/api/whatsapp/send/text \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "919876543210",
    "message": "Hello! This is a test message from CRM Wchat."
  }'
```

#### Test 3: Receive Incoming Message
1. Send a WhatsApp message to your business number (the one linked to Phone Number ID: 754391564431502)
2. Check your server logs - you should see webhook events
3. Check the database - a new lead should be created if the number is unknown
4. Check activities - the message should appear as an activity

---

## 🔍 Verification Checklist

- [ ] Environment variables added to `backend/.env`
- [ ] Database migration executed
- [ ] WhatsApp integration configured (via script or API)
- [ ] Webhook URL configured in Meta Dashboard
- [ ] Webhook verified successfully
- [ ] Test message sent successfully
- [ ] Incoming message received and processed

---

## 🐛 Troubleshooting

### Webhook Verification Fails
- Check that `META_WHATSAPP_VERIFY_TOKEN` matches the token in Meta Dashboard
- Ensure webhook URL is accessible (use ngrok for local testing)
- Check server logs for errors

### Messages Not Sending
- Verify access token is valid and not expired
- Check phone number ID is correct
- Ensure recipient number is in correct format (no +, no spaces)
- Check Meta App Dashboard for API errors

### Incoming Messages Not Processing
- Verify webhook is subscribed to `messages` field
- Check webhook URL is correct and accessible
- Review server logs for webhook processing errors
- Ensure database migration was executed

### Access Token Expired
Meta access tokens can expire. To get a permanent token:
1. Go to Meta App Dashboard → WhatsApp → API Setup
2. Create a System User Access Token
3. Update `META_WHATSAPP_ACCESS_TOKEN` in `.env`
4. Re-run setup script or update via API

---

## 📱 Phone Number Format

WhatsApp requires phone numbers in international format **without** the `+` sign:

- ✅ Correct: `919876543210` (India)
- ✅ Correct: `14155551234` (US)
- ❌ Wrong: `+919876543210`
- ❌ Wrong: `+1 415 555 1234`
- ❌ Wrong: `91987 65432 10`

---

## 🔐 Security Notes

1. **Never commit `.env` file** to version control
2. **Rotate access tokens** periodically
3. **Use HTTPS** for webhook URLs in production
4. **Verify webhook signatures** (already implemented)
5. **Keep App Secret secure** - never expose in client-side code

---

## 📊 API Endpoints Available

Once configured, you can use these endpoints:

- `POST /api/whatsapp/send/text` - Send text message
- `POST /api/whatsapp/send/template` - Send template message
- `GET /api/whatsapp/messages` - Get message history
- `GET /api/whatsapp/templates` - Get approved templates
- `GET /api/whatsapp/settings` - Get current settings
- `POST /api/whatsapp/settings` - Update settings

---

## ✅ Configuration Complete!

Your WhatsApp Meta integration is now configured. You can:
1. Send messages to leads/contacts
2. Receive and process incoming messages
3. Auto-create leads from unknown WhatsApp numbers
4. Track all WhatsApp messages as activities

Next: Build the frontend UI for WhatsApp management!

